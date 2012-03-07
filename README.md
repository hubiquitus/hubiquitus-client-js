# HubiquitusJS
Use a simple API to do Publish Subscribe (pubsub) from your **web app** or your
**Node.JS** project to a **XMPP Server**.
As transports it can use `BOSH` or `Socket.IO`. To use its full potential, use
with [hubiquitus-node](https://github.com/hubiquitus/hubiquitus-node).


## How to Use

You can use **HubiquitusJS** in two completely different ways.

* Inside your *web-browser* as an API to retrieve data for your web app.
* As a *node* module for your *Node.JS* project.

### For your web app
1. Download the code `git://github.com/hubiquitus/hubiquitusjs.git`
2. In your HTML File add

```html
<!-- Tag for socket.io is only needed if you will use it as transport-->
<script src='lib/transports/socketio/socket.io.js'></script>
<script data-main="my_script.js" src='lib/require.js'></script>
```

3. In *my_script.js* put the following

```js
define(
    ['/hubiquitus.js'], //Import the API
    function(hub){
	//Connect and pass the callback for the messages received.
	hub.connect(username, password, function(msg){
            document.getElementById("body").innerHTML = msg.data;
        });
    }
);
```

### For your Node app
1. Install using NPM: `npm install git://github.com/hubiquitus/hubiquitusjs.git`
2. Import the API and use it!

```js
//Import the module
var hubiquitus = require('hubiquitusjs');

//Connect to the XMPP Server using default configuration.
var hub = hubiquitus.connect(username, password, function(msg){
	console.log(msg);});
```

### Details
The last parameter in connect is the callback that will receive the messages
sent by the server in the form of:
`{ type: ('status'|'data'), data: ?}`. If type == status, data contains
a string with the server status (see `examples/`). If type == data,
`data` contains the server message.

Once connected it is possible to execute other pubsub commands:

```js
hub.subscribe(node); //Node to subscribe to using current credentials.
hub.unsubscribe(node, subID); //Node to unsubscribe. Optional subID.
hub.publish(node, item); //Publish string 'item' to 'node'.
hub.disconnect(); //Disconnects from the XMPP Server and destroys socket.
```

In all cases, `node` is a string with the name that identifies the node.

## Options
The file `lib/options.js` has all the parameters that can be passed to 
**HubiquitusJS**. You can see in `examples/` how to apply them.

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
