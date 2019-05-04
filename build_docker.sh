#!/bin/bash
if [ "$#" -ne 1 ]; then
      echo "USage: build_docker.sh <image_version>"
      exit 1	
fi
cd client
#npm install
npm run build
cd ..
docker build . --tag scripts4mqtt:"$1"

