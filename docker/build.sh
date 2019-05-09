#!/bin/bash
# clean up from previous run
rm -rf /usr/local/build
mkdir -p /usr/local/build
# copy the source code
cp -r /source /usr/local/build/
# build the code (note that the cp command also creates the /usr/local/build/source directory)
cd /usr/local/build/source/
npm install
npm run build


