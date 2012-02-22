# Hubiquitusjs

Hubiquitusjs is a Javascript library that allows a web client to connect to a
XMPP Server and perform pubsub commands using websockets or BOSH. You won't have
to worry about  how to make the XMPP stanzas; Just configure `hubiquitusjs` and
start publishing and subscribing in a flash!

## Features

* Allows the client to use different transport methods, allowing to use
the best transport for the client type.

* Simplified pubsub library. Do not worry about how a stanza is made! just
say what you want to publish or to subscribe and `hubiquitusjs` does it for you.

## How to Install

To install this library you just download the project and add it to your
Web project.

1.  $ git clone git://github.com/hubiquitus/hubiquitusjs.git
	
2.	Copy the `scripts` folder to your web project.

3.	Add to the header of your HTML file

```html
<script src='scripts/socket.io.js'></script>
<script data-main="scripts/main" src='scripts/require.js'></script>
```

That's it! you are ready to use `hubiquitusjs`!

## How to use

Once you have added the files to your project you are ready to use it.

If you want to use the Websocket features you need to have a server running
`hubiquitus-node`, take a look at the project to see how to install it.

To use it you need to put your account information in `main.js`. For the
`gateway` part you can choose if you want `bosh` or `socketio`, and fill
only the corresponding sections. 

Then, you will create a Client object, you can define dynamically your 
username, password and domain. When you are done, start by running 
`Client.connect()` to establish a connection.

The method `Client.onMessage()` treats the incoming messages, you can define
in this method how to manage them.

After that, you can run the different commands like `Client.publish()`.
See `main.js` for a list of possible commands and their parameters.

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