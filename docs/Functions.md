#Functions

* Global variable hClient to access all methods.

### Connect
Starts a connection to Hubiquitus. Status will be received in the `onStatus` callback set by the user and real-time hMessages will be received through the `onMessage` callback. Each command executed has its own callback that receives a hMessage with hResult payload.

```js
hClient.connect(login, password, hOptions, context)
```

Where:

* login : login of the publisher
* password : publisher's password
* hOptions : hOptions object as defined in [hOptions](https://github.com/hubiquitus/hubiquitus4js/tree/master/hOptions)
* context : any other attribute needed by the authentication actor (null by default)

`Note : if a user lost his connection, the hAPI will try to reconnect him automatically`
### disconnect
Stop a connection to hNode.

```js
hClient.disconnect()
```

### Subscribe
Subscribes the connected publisher to a channel.

```js
hClient.subscribe(actor [, cb])
```

Where:

* actor : `<String>` urn of the channel to subscribe (urn:localhost:mychannel)
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### Unsubscribe
Unsubscribes the connected publisher from a channel.

```js
hClient.unsubscribe(actor [, cb])
```

Where:

* actor : `<String>` urn of the channel to unsubscribe from
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### GetSubscriptions
Recovers in the form of a hMessage with hResult payload a list of the channels to which the user is subscribed. hResult's `result` attribute will be an array of strings containing the `urn` of the channels.

```js
hClient.getSubscriptions([cb])
```

Where:

* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### GetLastMessages
Recovers persisted messages from a channel. hResult's `result` attribute will be an array of persisted hMessages ordered by date (the first one will be the newest). If the user put a filter in his session, hMessages in the array was only them which validate the filter.

```js
void hClient.getLastMessages(actor [, nbLastMsg] [, cb])
```

Where:

* actor : `<String>` urn of the channel.
* nbLastMsg: `<int>` max number of hMessages to recover. If not specified the channel's default will be used, and as fallback the default value for the hCommand.
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### GetThread
Gets an array of hMessages related by convid. If the user put a filter in his session, hMessages in the array was only them which validate the filter.

```js
hClient.getThread(actor, convid [, cb])
```

Where:

* actor : `<String>` urn of the messages to query.
* convid : `<String>` convid of the messages to query.
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### GetThreads
Gets an array of convids from the hConvState that have the status specified in the command. If the user put a filter in his session, hMessages in the array was only them which validate the filter.

```js
hClient.getThreads(actor, status [, cb])
```

Where:

* actor : `<String>` urn of the messages to query.
* status : `<String>` status of the hConvState to query.
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.


### GetRelevantMessages
Gets an array of hMessages marked as relevant from the channel specified. If the user put a filter in his session, hMessages in the array was only them which validate the filter.

```js
hClient.getRelevantMessages(actor [, cb])
```

Where:

* actor : `<String>` urn of the messages to query.
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### SetFilter
Sets a filter for the current session. This filter will be applied to received results from commands and real time hMessages, only letting through messages that match the filter. Note that a empty filter ('{}') means no filter

```js
hClient.setFilter(filter [, cb])
```

Where:

* filter : `<hCondition>` A filter structure as defined in the Hubiquitus Reference.
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

### send
Send a hMessage to an actor.

```js
hClient.send(hMessage [, cb])
```

Where:

* hMessage : `<hMessage>` complete hMessage to send.
* cb : `<Function(hMessage)>` callback that receives the hMessage with hResult payload from the executed command.

```
note: possibly the user will want to use hClient.buildMessage() to create the message before sending.
```

### buildMessage
Creates a hMessage structure. Can be used with `hClient.send()` to send a well-formed message.

```js
hMessage = hClient.buildMessage(actor, type, payload, options)
```

Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* type: `<String>` payload type
* payload: `<Object>` the payload to send
* options: `<hMessageOptions>` an object containing the options to override. If not provided they will be left undefined or filled with default values


### buildhMeasure
Creates a hMessage structure with a hMeasure as a payload. Can be used with `hClient.send()` to send a well-formed message.

```js
hMeasure = hClient.buildMeasure(actor, value, unit, options)
```

Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* value: `<String>` value of the measure. If not provided an error will be thrown
* unit: `<String>` value's unit. If not provided an error will be thrown
* options: `<hMessageOptions>` an object containing the options to override of the hMessage. If not provided they will be left undefined or filled with default ones.

### buildhAlert
Creates a hMessage structure with a hAlert as a payload. Can be used with `hClient.send()` to send a well-formed message.

```js
hAlert = hClient.buildAlert(actor, alert, options)
```

Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* alert: `<String>` message of the alert. If not provided an error will be thrown
* options: `<hMessageOptions>` an object containing the options to override of the hMessage. If not provided they will be left undefined or filled with default ones.

### buildhConvState
Creates a hMessage structure with a hConvState as a payload. Can be used with `hClient.send()` to send a well-formed message.

```js
hConvState = hClient.buildConvState(actor, convid, state, options)
```

Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* convid: `<String>` convid of the conversation.If not provided an error will be thrown
* state: `<String>` id of the hMessage to acknowledge.
* options: `<hMessageOptions>` an object containing the options to override of the hMessage. If not provided they will be left undefined or filled with default ones, save convid given by the user.

### buildhAck
Creates a hMessage structure with a hAck as a payload. Can be used with `hClient.send()` to send a well-formed message.

```js
hAck = hClient.buildAck(actor, ackid, ack, options)
```

Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* ackid: `<String>` id of the hMessage to acknowledge . If not provided an error will be thrown
* ack: `<String>` 'recv' or 'read' . If not provided an error will be thrown
* options: `<hMessageOptions>` an object containing the options to override of the hMessage. If not provided they will be left undefined or filled with default ones.

### buildCommand
Creates a hMessage structure with a hCommand as a payload. Can be used with `hClient.send()` to send a well-formed message.

```js
hCommand = hClient.buildCommand(actor, cmd, params, options)
```

Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* cmd : `<String>` the name of the hCommand to form (hSetFilter, hSubscribe, hGetThread...)
* params: `<Object>` the params need by the hCommand
* options: `<hMessageOptions>` an object containing the options to override of the hMessage. If not provided they will be left undefined or filled with default ones.

### buildResult: function(actor, ref, status, result, options)
Creates a hMessage structure with a hResult as a payload. Can be used with `hClient.send()` to send a well-formed message.

```js
hResult = hClient.buildResult(actor, ref, status, result, options)
```
Where:

* actor : `<String>` urn of the receiver. If not provided an error will be thrown
* ref : `<String>` the msgid of the message which rise this result
* status: `<String>` result status code (see [Codes ](https://github.com/hubiquitus/hubiquitusjs/tree/master/Codes) for more details)
* result: `<Object>` the result of the command
* options: `<hMessageOptions>` an object containing the options to override of the hMessage. If not provided they will be left undefined or filled with default ones.