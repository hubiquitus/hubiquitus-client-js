# hOptions
hOptions is one of the arguments passed to the hClient when the method `connect` is being called.

It follows the hOptions reference and some special values for this platform.

## Transport
Transport to connect to the hNode (from Hubiquitus  Reference)

```js
hOptions["transport"] = "socketio"
```

`Default Value: "socketio"`

## Endpoint
Endpoint of the hNode. Expects an array from which one will be chosen randomly. (from Hubiquitus Reference)

```js
hOptions["endpoints"] = <String[]>
```

`Default Value: ["http://localhost:8080"]`

## Timeout
Time to wait (ms) while connecting to the hNode. If it doesn't respond in that interval an error will be passed to callback.

```js
hOptions["timeout"] = <int>
```

`Default Value: 15000`

## msgTimeout
Timeout (ms) value used by the hAPI for all the services except the send() one. If it doesn't respond in that interval an error will be passed to the callback.

```js
hOptions["msgTimeout"] = <int>
```

`Default Value: 30000`

## authCb
If you want use an external script for authentification you can add it here. You just need to use the user as attribut and return a user and his password

```js
authCb = function(user, cb){ cb(user, password) }
```

`cb is the callback you have to use to return the user and his password`