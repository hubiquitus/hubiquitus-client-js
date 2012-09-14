# HubiquitusJS
Use a simple API to connect to a hNode and do Publish Subscribe using the 
*Hubiquitus* protocol. It is compatible with your **web app** and your
**Node.JS** project.

To communicate with the server it can use
[socket.io](http://socket.io/). To use it's full potential, use it with
[hubiquitus-node](https://github.com/hubiquitus/hubiquitus-node).


## How to Use

You can use **HubiquitusJS** in two completely different ways.

* Inside your *web-browser* as an API to retrieve data for your web app.
* As a *node* module for your *Node.JS* project.

### For your web app
1. Download the code `git://github.com/hubiquitus/hubiquitusjs.git`
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
hClient.connect('username', 'password');
```

### For your Node app
1. Install using NPM: `npm install git://github.com/hubiquitus/hubiquitusjs.git`
2. Import the API and use it!

```js
//Import hClient
var hClient = require('hubiquitusjs').hClient;

//Connect to a hNode using default configuration.
hClient.connect('username', 'password');
```

### Details
To receive messages in realtime, use `hClient.onMessage`, you can set this function that
receives a message to whatever you like. For more information about available data received
in real time see [hCallback](https://github.com/hubiquitus/hubiquitusjs/wiki/hCallback)

Once connected it is also possible to execute other commands:

```js
hClient.subscribe(channel, cb); //Channel to subscribe to using current credentials.
hClient.unsubscribe(channel, cb); //Channel to unsubscribe.
hClient.publish(hMessage, cb); //Publishes an hMessage.
hClient.getMessages(channel, cb); //Get last messages from 'channel'
hClient.disconnect(); //Disconnects from the Server.
hClient.command(hCommand, cb); //Sends an hCommand to an entity (Will call command builder to fill missing)
hClient.commandBuilder(hCommand); //Fills command attributes with default values
```

In all cases, `channel` is a string with the name that identifies the node.

Note: a list of all available operations is in [Functions](https://github.com/hubiquitus/hubiquitusjs/wiki/Functions)

## Options
An `hOptions` object can be sent to the connect function as the last argument.

The keys in this object and an explanation for each one of them can be
found in the [hOptions](https://github.com/hubiquitus/hubiquitusjs/wiki/hOptions) page. 
There are examples of how to create a *hOptions* object in the `examples/` folder.

## License 
Copyright (c) Novedia Group 2012.

This file is part of Hubiquitus.

Hubiquitus is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Hubiquitus is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Hubiquitus.  If not, see <http://www.gnu.org/licenses/>.
