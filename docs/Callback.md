When you send any hMessage, if you add a timeout attribute its means you want to receive a callback. By default, if you don't add timeout, you will not receive callback.

## onStatus
`onStatus` is a function that receives a `hStatus` object each time it is called by the hAPI.
It receives the connection status in real-time.

To set this function the user can change the attribute `hClient.onStatus`, setting it to
a `function onStatus(hStatus)`.

Where:

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>status</td>
            <td>Int</td>
            <td>The status code of the connection</td>
        </tr>
        <tr>
            <td>errors</td>
            <td>Int</td>
            <td>The error code message of the connection</td>
        </tr>
    </tbody>
</table>

> Note : you can find the different status and errors code [here](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/Codes)

## onMessage
`onMessage` is a function that receives a `hMessage` object each time it is called by the hAPI.
It receives real-time messages from the network.

To set this function the user can change the attribute `hClient.onMessage`, setting it to a
`function onMessage(hMessage)`

Where:

* hMessage is a hMessage JSON Object (For more details see [Data Structure](https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/DataStructure))
