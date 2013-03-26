# Hubiquitus4js
Use a simple API to connect to a hNode and do Publish Subscribe using the
*Hubiquitus* protocol. It is compatible with your **web app** and your
**Node.JS** project.

To communicate with the server it can use
[socket.io](http://socket.io/). To use it, you need
[hubiquitus](https://github.com/hubiquitus/hubiquitus).


## How to Use

You can use **Hubiquitus4js** in two completely different ways.

* Inside your *web-browser* as an API to retrieve data for your web app.
* As a *node* module for your *Node.JS* project.

### For your web app
1. Download the code `git://github.com/hubiquitus/hubiquitus4js.git`
2. In your HTML File add

```html
<!-- Imports necessary for hAPI -->
<!-- Tag for socket.io is only needed if you will use it as transport-->
<script src='../../lib/transports/socketio/socket.io.js'></script>
<script data-main="../../hubiquitus.js" src='../../lib/require.js'></script>
<!-- Your script -->
<script src="my_script.js"></script>
```

3. In *my_script.js* put the following

```js
//Connect to a hNode
hClient.connect('login', 'password', 'hOptions');
```

### For your Node app
1. Install using NPM: `npm install git://github.com/hubiquitus/hubiquitus4js.git`
2. Import the API and use it!

```js
//Import hClient
var hClient = require('hubiquitus4js').hClient;

//Connect to a hNode using default configuration.
hClient.connect('login', 'password', 'hOptions');
```

### Details
To receive messages in realtime, use `hClient.onMessage`, you can set this function that
receives a message to whatever you like. For more information about available data received
in real time see [Callback](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Callback)

Once connected it is also possible to execute other commands:

```js
hClient.subscribe(channel, cb); //Channel to subscribe to using current credentials.
hClient.unsubscribe(channel, cb); //Channel to unsubscribe.
hClient.send(hMessage, cb); //Sent an hMessage.
hClient.getLastMessages(channel, cb); //Get last messages from 'channel'
hClient.disconnect(); //Disconnects from the Server.
hClient.buildMessage(actor, type, payload, options); //Create a valid hMessage
```
Note: a list of all available operations is in [Functions](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Functions)

### References
You can find relevant informations of all the hubiquitus4js's references in :
* [Data Structure](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/DataStructure)
* [Filter](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Filter)
* [Functions](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Functions)
* [Codes](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Codes)
* [Callback](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Callback)
* [Connect Options](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/hOptions)
* [Minification](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Minification)
* [Proxy Pass](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Proxy-Pass)
* [hClient class variables](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/hClient-class-variables)

## Options
An `hOptions` object can be sent to the connect function as the last argument.

The keys in this object and an explanation for each one of them can be
found in the [hOptions](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/hOptions) page.
There are examples of how to create a *hOptions* object in the `examples/` folder.

## License

Copyright (c) Novedia Group 2012.

This file is part of Hubiquitus

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

You should have received a copy of the MIT License along with Hubiquitus.
If not, see [MIT licence](http://opensource.org/licenses/mit-license.php).

