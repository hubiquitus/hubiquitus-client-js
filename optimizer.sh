#!/bin/bash

node node_modules/requirejs/bin/r.js -o baseUrl=. paths.requireLib=./lib/require name=hubiquitus include=requireLib optimize=none out=hubiquitus-full.js
