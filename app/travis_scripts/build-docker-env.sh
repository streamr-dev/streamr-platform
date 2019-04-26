#!/usr/bin/env bash

trap "killall background" EXIT # clean up background jobs

##
## Pulls down streamr-docker-dev and starts an engine-and-editor instance + associated services ##
##

source "${BASH_SOURCE%/*}/utils.sh"

cd $TRAVIS_BUILD_DIR
sudo /etc/init.d/mysql stop
sudo sysctl fs.inotify.max_user_watches=524288; sudo sysctl -p
sudo ifconfig docker0 10.200.10.1/24

git clone https://github.com/streamr-dev/streamr-docker-dev.git
streamr_docker_dev='streamr-docker-dev/streamr-docker-dev/bin.sh'
# start everything except eth watcher
$streamr_docker_dev start 5

RETRIES=30;
RETRY_DELAY=5s;

# wait for E&E to come up
waitFor $RETRIES $RETRY_DELAY checkHTTP "engine-and-editor" 200 http://localhost:8081/streamr-core/login/auth;

$streamr_docker_dev log -f &

# exit if E&E never comes up
if [ $? -eq 1 ] ; then
    echo "engine-and-editor never up";
    $streamr_docker_dev ps;
    exit 1;
fi

$streamr_docker_dev restart data-api; # let's restart it for good measure (?!)

# wait briefly for data-api to come up. it probably needs restarting again.
waitFor 20 3s checkHTTP "data-api" 401 http://localhost:8890/;

# try restarting everything if still not up
if [ $? -eq 1 ] ; then
    echo "data-api still not up"
    $streamr_docker_dev ps;
    # try waiting again
    $streamr_docker_dev restart cassandra;
    $streamr_docker_dev restart zookeeper;
    $streamr_docker_dev restart kafka;
    $streamr_docker_dev restart data-api;
    waitFor $RETRIES $RETRY_DELAY checkHTTP "data-api" 404 http://localhost:8890/;
    # exit if data-api ever came up (ffs)
    if [ $? -eq 1 ] ; then
        echo "data-api never up.";
        exit 1;
    fi
    waitFor $RETRIES $RETRY_DELAY checkHTTP "nginx" 200 http://localhost:80/;
fi

$streamr_docker_dev ps;
