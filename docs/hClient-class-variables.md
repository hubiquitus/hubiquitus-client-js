When you start an instance of an hClient you have acces to few variables :

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
            <td>msgToBeAnswered</td>
            <td>Object</td>
            <td>List the msgid of the hMessage which waiting a response</td>
        </tr>
        <tr>
            <td>status</td>
            <td>Int</td>
            <td>Code which define the client status</td>
        </tr>
        <tr>
            <td>hOptions</td>
            <td>Object</td>
            <td>List the user's options used to establish the connection with hubiquitus</td>
        </tr>
        <tr>
            <td>fullurn</td>
            <td>String</td>
            <td>hClient's URN with resource</td>
        </tr>
        <tr>
            <td>resource</td>
            <td>String</td>
            <td>hClient's resource</td>
        </tr>
        <tr>
            <td>domain</td>
            <td>String</td>
            <td>hClient's domain</td>
        </tr>
        <tr>
            <td>publisher</td>
            <td>String</td>
            <td>hClient's URN without resource</td>
        </tr>
        <tr>
            <td>filter</td>
            <td><a href="https://github.com/hubiquitus/hubiquitus4js/tree/master/docs/DataStructure.md">hCondition</a></td>
            <td>Filter apply to the session (can be undefined)</td>
        </tr>
    </tbody>
</table>