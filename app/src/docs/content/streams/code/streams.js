export const CreateJavascriptClient =
`const streamr = new StreamrClient({
    auth: {
        privateKey: 'YOUR-PRIVATE-KEY',
    },
})`

export const CreateJavaClient = `AuthenticationMethod method = new EthereumAuthenticationMethod("YOUR-PRIVATE-KEY");
StreamrClient client = new StreamrClient(method);`

export const AuthJavascriptClient =
`new StreamrClient({
    auth: {
        provider: window.ethereum,
    }
})`

export const AuthJavaClient = 'StreamrClient client = new StreamrClient(new EthereumAuthenticationMethod(myEthereumPrivateKey));'

export const SubscribeJavascriptClient =
`// Subscribe to a stream
const subscription = client.subscribe({
    stream: 'MY-STREAM-ID',
},
(message) => {
    // This function will be called when new messages occur
    console.log(JSON.stringify(message))
})`

export const SubscribeJavaClient =
`Subscription sub = client.subscribe(stream, new MessageHandler() {
    @Override
    void onMessage(Subscription s, StreamMessage message) {
        // Here you can react to the latest message
        System.out.println(message.getPayload().toString());
    }
})`

export const PublishJavascriptClient =
`// Here is the event we'll be sending
const msg = {
    hello: 'world',
    random: Math.random()
}

// Publish the event to the Stream
client.publish('MY-STREAM-ID', msg)
    .then(() => console.log('Sent successfully: ', msg))`

export const PublishJavaClient =
`// Create the message payload, which is represented as a Map
Map<String, Object> msg = new LinkedHashMap<>();
msg.put("foo", "bar");
msg.put("random", Math.random());

// Then publish it!
client.publish(stream, msg);`

export const encryptionJavaClient =
`Stream stream = new Stream("my-data-stream");

//---- PUBLISHER SIDE ----

// an AES 256 bits key that is initially known only to the publisher
UnencryptedGroupKey groupKey = '0x...';
// streamId → group key used to encrypt data
HashMap<String, UnencryptedGroupKey> publisherGroupKeys = new HashMap<>();
publisherGroupKeys.put(stream.getId(), groupKey);
EncryptionOptions encryptionOptions = new EncryptionOptions(publisherGroupKeys, …);
StreamrClient publisher = new StreamrClient(new StreamrClientOptions(..., encryptionOptions, …))

Map<String, Object> messageContent = …;
// going to be published encrypted with ‘groupKey’
publisher.publish(stream, messageContent);

//---- SUBSCRIBER SIDE ----

StreamrClient subscriber = new StreamrClient(...);
// under the hood, it will use the protocol to securely obtain
// ‘groupKey’ to then decrypt the received data
subscriber.subscribe(stream, …);`

export const encryptionJavascriptClient =
`//---- PUBLISHER SIDE ----

// an AES 256 bits key that is initially known only to the publisher
const groupKey = '0x...'
const publisher = new StreamrClient({
    publisherGroupKeys: {
        'my-stream-id': groupKey
    }
})
const msg = {
    ...
}
// going to be published encrypted with ‘groupKey’
publisher.publish('my-stream-id', msg)

//---- SUBSCRIBER SIDE ----

const subscriber = new StreamrClient(...)
// under the hood, it will use the protocol to securely obtain
// ‘groupKey’ to then decrypt the received data
subscriber.subscribe('my-stream-id', …);`

export const rekeyJavaClient =
`Stream stream = new Stream(...);
client.rekey(stream);`

export const rekeyJavascriptClient =
`client.rekey('my-stream-id')
`
