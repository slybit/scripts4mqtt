#!/bin/bash
if [ "$#" -ne 1 ]; then
      echo "USage: build_docker.sh <image_version>"
      exit 1	
fi
# -- make sure we have the latest release code --
git pull
git checkout release
# -- build the client --
#cd client
#npm install
#npm run build
docker start -i nodebuilder
rm -rf ./client/build/
docker cp nodebuilder:/usr/local/build/source/build/ ./client/
# -- build the docker
docker build . --tag scripts4mqtt:"$1"

