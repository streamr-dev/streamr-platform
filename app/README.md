# Streamr Core frontend

This is the Streamr Core application frontend, which includes tooling for creating and editing Streamr resources 
(streams, canvases, dashboards, products), the data marketplace, and related documentation.

The Core frontend runs against an API backend and Ethereum smart contracts. For more information see [Backend](#backend).

## Folder structure

Although the frontend consists of a single app, the code is structured into different folders based on the different functionalities of the app. The code is under the `src` folder:

* `auth` contains components for login
* `docs` contains the Streamr documentation
* `editor` is the visual programming environment for canvases
* `marketplace` contains the data marketplace
* `shared` has shared code and utilities
* `userpages` contains the views for managing a user's Streamr resources
* `routes` contains the list of App routes.
* `utils` contains commonly used utilities, used throughout the App. 
* `stories` storybook stories.
* `test` App unit tests. 
* `travis_scripts` Deployment scripts.

## Getting Started

### Frontend

```
npm install
npm start
```

Webpack is configured with live reloading and will be served on http://localhost once the backend stack is running on Docker (see [Backend](#backend)).

### Documentation

The live documentation can be found at [streamr.network/docs](https://streamr.network/docs). 
The documentation content files are held in `/src/docs/content` as MDX files (jsx flavoured markdown). 
Community contributions are encouraged, please see the [Docs Editing Guide](https://github.com/streamr-dev/streamr-platform/app/src/docs/docsEditingGuide.md) for more information.

### Environment & Smart contract configuration

To be able to use the Marketplace, you'll need to configure these variables into your `.env` file:

| Variable                                          | Description                                                          |
|---------------------------------------------------|----------------------------------------------------------------------|
| PORT                                              | Port used by webpack devServer                                       |
| PLATFORM_ORIGIN_URL                               | Base path/address of the current environment                         |
| STREAMR_API_URL                                   | Address of the environment's Backend Rest API                        |
| STREAMR_WS_URL                                    | Address of the environment's Backend Websocket API                   |
| STREAMR_URL                                       | API Address for Dockerized Environments                              |
| MARKETPLACE_CONTRACT_ADDRESS                      | Address of the deployed latest Marketplace contract                  |
| DATA_TOKEN_CONTRACT_ADDRESS                       | Address of the deployed DATA Token contract                          |
| DAI_TOKEN_CONTRACT_ADDRESS                        | Address of the deployed DAI Token contract                           |
| WEB3_REQUIRED_NETWORK_ID                          | This is used to check that the user has selected the correct network |
| WEB3_PUBLIC_HTTP_PROVIDER                         | A public provider used to query Marketplace methods without Metamask |
| WEB3_PUBLIC_WS_PROVIDER                           | A public websocket prodiver (currently not in use)                   |
| WEB3_TRANSACTION_CONFIRMATION_BLOCKS              | Number of confirmations required for tx to be considered successful  |
| BUNDLE_ANALYSIS                                   | Optional, enables generating bundle size analysis report.            |
| STREAMR_ENGINE_NODE_ADDRESSES                     |                                                                      |
| UNISWAP_ADAPTOR_CONTRACT_ADDRESS                  | Address of the deployed Uniswap adaptor                              |
| DATA_UNION_OPERATOR_ADDRESS                       |                                                                      |
| DATA_UNION_BLOCK_FREEZE_PERIOD_SECONDS            |                                                                      |
| DATA_UNION_PUBLISH_MEMBER_LIMIT                   | Number of members required for a data union product before publish   |
| THE_GRAPH_API_URL                                 | Address of the environment's The Graph API                           |

Development values (set the values in your `.env`):

| Variable                                          | Value                                        | Description                     |
|---------------------------------------------------|----------------------------------------------|---------------------------------|
| PORT                                              | `3333`                                       |                                 |
| PLATFORM_ORIGIN_URL                               | `http://localhost`                           |                                 |
| STREAMR_API_URL                                   | `http://localhost/api/v1`                    |                                 |
| STREAMR_WS_URL                                    | `ws://localhost/api/v1/ws`                   |                                 |
| STREAMR_URL                                       | `http://localhost`                           |                                 |
| MARKETPLACE_CONTRACT_ADDRESS                      | `0xF1371c0f40528406dc4f4cAf89924eA9Da49E866` |                                 |
| DATA_TOKEN_CONTRACT_ADDRESS                       | `0xbAA81A0179015bE47Ad439566374F2Bae098686F` |                                 |
| DAI_TOKEN_CONTRACT_ADDRESS                        | `0x642d2b84a32a9a92fec78ceaa9488388b3704898` |                                 |
| WEB3_REQUIRED_NETWORK_ID                          | 8995                                         |                                 |
| WEB3_PUBLIC_HTTP_PROVIDER                         | http://localhost:8545                        | Private network                 |
| WEB3_PUBLIC_WS_PROVIDER                           | ws://localhost:8545                          |                                 |
| WEB3_TRANSACTION_CONFIRMATION_BLOCKS              | 1                                            | Parity confirms tx immediately  |
| BUNDLE_ANALYSIS                                   | 1                                            | PLATFORM_ORIGIN_URL/report.html |
| STREAMR_ENGINE_NODE_ADDRESSES                     | 0xFCAd0B19bB29D4674531d6f115237E16AfCE377c   |                                 |
| UNISWAP_ADAPTOR_CONTRACT_ADDRESS                  | 0xe4ea76e830a659282368ca2e7e4d18c4ae52d8b3   |                                 |
| DATA_UNION_OPERATOR_ADDRESS                       | 0xa3d1F77ACfF0060F7213D7BF3c7fEC78df847De1   |                                 |
| DATA_UNION_BLOCK_FREEZE_PERIOD_SECONDS            | 1                                            |                                 |
| DATA_UNION_PUBLISH_MEMBER_LIMIT                   | 1                                            |                                 |
| THE_GRAPH_API_URL                                 | `http://localhost:8000`                      |                                 |

Optional config values:

| Variable             | Description                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| SENTRY_DSN           | Identifier for Sentry error reporting service                                                  |
| SENTRY_ORG           | Identifier for Sentry organisation                                                             |
| LOGROCKET_SLUG       | Identifier for LogRocket error reporting service (used in staging and public beta environment) |
| GOOGLE_ANALYTICS_ID  | Identifier for Google Analytics                                                                |
| STORYBOOK_BASE_PATH  | Build path for Storybook stories                                                               |
| PLATFORM_PUBLIC_PATH | Public path for Webpack config. If not defined, relative paths are used.                       |

Use `.travis.yml` to set the production values.

### Smart contract configuration

To be able to use the Marketplace, you'll need to configure these variables into your `.env` file:

| Variable                     | Description                                                          |
|------------------------------|----------------------------------------------------------------------|
| MARKETPLACE_CONTRACT_ADDRESS | Address of the deployed Marketplace contract                         |
| DATA_TOKEN_CONTRACT_ADDRESS  | Address of the deployed DATA Token contract                          |
| WEB3_REQUIRED_NETWORK_ID     | This is used to check that the user has selected the correct network |
| WEB3_PUBLIC_HTTP_PROVIDER    | A public provider used to query Marketplace methods without Metamask |
| WEB3_PUBLIC_WS_PROVIDER      | A public websocket prodiver (currently not in use)                   |

Development values (set the values in your `.env`):

| Variable                     | Value                                        | Description      |
|------------------------------|----------------------------------------------|------------------|
| MARKETPLACE_CONTRACT_ADDRESS | `0xF1371c0f40528406dc4f4cAf89924eA9Da49E866` |                  |
| DATA_TOKEN_CONTRACT_ADDRESS  | `0xbAA81A0179015bE47Ad439566374F2Bae098686F` |                  |
| WEB3_REQUIRED_NETWORK_ID     | 8995                                         | Private network  |
| WEB3_PUBLIC_HTTP_PROVIDER    | http://localhost:8545                        |                  |
| WEB3_PUBLIC_WS_PROVIDER      | ws://localhost:8545                          |                  |

Use `.travis.yml` to set the production values.

#### Routes

Marketplace: [/marketplace](/marketplace)

Core Pages:  [/core](/core)

Docs: [/docs](/docs)

### Backend

To run the app locally, you must install and start the development environment running on Docker. 
Follow the instructions [https://github.com/streamr-dev/streamr-docker-dev](here) to start the full stack except the frontend:

`streamr-docker-dev start --except platform`

Note that the instructions also include login credentials for the local app. 


### Git Branches

Development Branch -> Local environment (bleeding edge)

Master Branch (untagged) -> Production ready code

Master Branch (tagged releases) -> Production code - https://streamr.network/core

### Deploying to Staging

Merging a PR to `development` will trigger a release to staging. 

### Deploying to Production 

Follow these steps to push a new production release:

First check that there are no open tickets for critical/major bugs discovered on the development branch recently that should not be pushed to production.

To make life easier, nobody should push to the `development` branch while you're deploying, so let the team know you're deploying before you start.

```
git checkout master
git merge origin/development
npm version patch
git add package.json package-lock.json
git commit -m "Upgrade to 2.1.15"
git push
```

At this point it's a good idea to check that Travis confirms all tests are passing. Then, for example if the new version is '2.1.15', 

```
git tag -a v2.1.15 -m 'v2.1.15'
git push --tags
```

Following a deployment, `package.json` on `master` will have a higher version that on `development` so it's important to update `development` with this change.

```
git checkout development
git merge origin/master
git push
```

The parameter patch means updating the last number of the version, eg. 1.0.0 -> 1.0.1. Possible parameter values are [<VERSION>, patch, minor, major]

### Production Hotfixes

Create new branch from master `hotfix/ticket-id-issue-title` 
Merge the approved branch to master and push a tagged incremental release. 

```
git checkout master
git merge hotfix/ticket-id-issue-title
npm version patch
git add package.json package-lock.json
git commit -m "Upgrade to 2.1.15"
git push
```

At this point it's a good idea to check that Travis confirms all tests are passing. Then, for example if the new version is '2.1.15', 

```
git tag -a v2.1.15 -m 'v2.1.15'
git push --tags
```

Remember to mirror the same fix in the `development` branch with new tests or new test conditions that prove the new functionality if required.

```
git checkout development
git merge origin/master
git push
```

### Adding new Features

```
git checkout development
git pull
git checkout -b ticket-id-issue-title
```

Then write your code, and get the pull request approved by two developers, ideally with tests proving the functionality. Then, merge the PR into `development`.

### Storybook

The project contains a Storybook including stories from the main components. The Storybook can be run with `npm run storybook` and built with `npm run build-storybook`. Storybook should be accessible after running `npm run storybook` at http://localhost:6006 or on your network at http://10.200.10.1:6006

## Deployment

- When production builds:
  - Webpack creates `.map`-file in `dist` -directory with bundled JS
  - Travis has a script container (Runs when deploying in production)
    - Creates a new release in Sentry by `TRAVIS_TAG`
    - Pushes source map -file from `dist` into Sentry with tagged release
    - Removes the `.map`-file so it doesn't end up in production

### Sentry

JavaScript error tracking from Sentry helps developers easily fix and prevent JavaScript errors in production as part of your commit-deploy-iterate workflow. Ask a powerful developer for access to the Sentry alerts.
