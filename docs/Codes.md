## hStatus (Describe the connection status)
### Statuses Codes:

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Value</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>CONNECTING</td>
            <td>1</td>
            <td>hAPI is trying to establish a connection</td>
        </tr>
        <tr>
            <td>CONNECTED</td>
            <td>2</td>
            <td>The client is connected and authenticated to the server. This status is required to perform any operations on hAPI</td>
        </tr>
        <tr>
            <td>DISCONNECTING</td>
            <td>5</td>
            <td>hAPI is trying to close the connection to the server</td>
        </tr>
        <tr>
            <td>DISCONNECTED</td>
            <td>6</td>
            <td>The client is offline</td>
        </tr>
    </tbody>
</table>

### Errors Codes:

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Value</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>NO_ERROR</td>
            <td>0</td>
            <td>There was no error</td>
        </tr>
        <tr>
            <td>URN_MALFORMAT</td>
            <td>1</td>
            <td>The given publisher id is not in the form urn:domain:publisher</td>
        </tr>
        <tr>
            <td>CONN_TIMEOUT</td>
            <td>2</td>
            <td>The connection to hubiquitus timed out</td>
        </tr>
        <tr>
            <td>AUTH_FAILED</td>
            <td>3</td>
            <td>Authentication refused by hubiquitus</td>
        </tr>
        <tr>
            <td>ALREADY_CONNECTED</td>
            <td>5</td>
            <td>The user is already connected / trying to connect</td>
        </tr>
        <tr>
            <td>TECH_ERROR</td>
            <td>6</td>
            <td>An error not handled by the hAPI, maybe caused by related libraries</td>
        </tr>
        <tr>
            <td>NOT_CONNECTED</td>
            <td>7</td>
            <td>An action that required the user to be connected when it was not was executed</td>
        </tr>
        <tr>
            <td>CONN_PROGRESS</td>
            <td>8</td>
            <td>A connection is already in progress</td>
        </tr>
    </tbody>
</table>

## hResult (Describe the result of a hMessage)

### hResultStatus Codes

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Value</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>OK</td>
            <td>0</td>
            <td>There was no error</td>
        </tr>
        <tr>
            <td>TECH_ERROR</td>
            <td>1</td>
            <td>There was an error during the treatment of the hMessage</td>
        </tr>
        <tr>
            <td>NOT_CONNECTED</td>
            <td>3</td>
            <td>An action that required the user to be connected when it was not was executed</td>
        </tr>
        <tr>
            <td>NOT_AUTHORIZED</td>
            <td>5</td>
            <td>The user was not authorized to do this action</td>
        </tr>
        <tr>
            <td>MISSING_ATTR</td>
            <td>6</td>
            <td>The user not give all the mandatory attribute</td>
        </tr>
        <tr>
            <td>INVALID_ATTR</td>
            <td>7</td>
            <td>The user give a invalid attribute</td>
        </tr>
        <tr>
            <td>NOT_AVAILABLE</td>
            <td>9</td>
            <td>This fonction is not available for this user</td>
        </tr>
        <tr>
            <td>EXEC_TIMEOUT</td>
            <td>10</td>
            <td>The server can't respond before timeout</td>
        </tr>
    </tbody>
</table>