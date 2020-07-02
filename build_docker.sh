#!/bin/bash
if [ "$#" -ne 1 ]; then
      echo "USage: build_docker.sh <image_version>"
      exit 1	
fi
# -- make sure we have the latest release code --
#git pull
#git checkout master
# -- build the client --
cd client
#npm install
npm run build
# -- build the docker
cd ..
docker build . --tag scripts4mqtt:"$1"

