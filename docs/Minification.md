Minification is the process of removing all unnecessary characters from source code, without changing its functionality. These unnecessary characters usually include white space characters, new line characters, comments, and sometimes block delimiters, which are used to add readability to the code but are not required for it to execute. It also add all requires files in your script, so you don't have to include them anymore

## How to minify your project
A script name `optimizer` is available in the hubiquitus4js sources. You just have to execute it (on Unix system). It will create a new file call `hubiquitus-min.js` which contain all you need. You just have to import it in your web project

### Before minify :
```html
    <!-- Imports necessary for hAPI -->
    <script src='../../lib/transports/socketio/socket.io.js'></script>
    <script data-main="../../hubiquitus.js" src='../../lib/require.js'></script>
    <!-- Your script -->
    <script src="complete.js"></script>
```

### After minify :
```html
    <!-- Imports necessary for hAPI -->
    <script src='../../hubiquitus-min.js'></script>
    <!-- Your script -->
    <script src="complete.js"></script>
```