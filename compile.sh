#!/bin/bash

uglify=./node_modules/uglify-js/bin/uglifyjs
if [ ! -f $uglify ]
then
  echo "> ERROR : $uglify  not found in node modules !"
  echo "did you run npm install ?"
  exit -1
fi

lib="hubiquitus.js"
minlib="hubiquitus.min.js"

echo "> cleaning previous build..."
rm $lib $minlib

echo "> building $lib..."
touch $lib
parts=(
  "vendor/sockjs.js"
  "vendor/lodash.js"
  "lib/util.js"
  "lib/logger.js"
  "lib/events.js"
  "lib/transport.js"
  "lib/application.js"
)
for part in "${parts[@]}"
do
  echo "merging $part in $lib..."
  cat $part >> $lib
  echo -e >> $lib
done

echo "> building $minlib..."
uglifyjs $lib -o $minlib
