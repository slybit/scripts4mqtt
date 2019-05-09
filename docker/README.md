## Build the node builder docker image

```sh
docker build -t nodebuilder-img -f Dockerfile.build .
```
This a a very simple image that is based of the official node images and simply executes `/build.sh` when you run the container.
Note that this `/build.sh` has to be mounted in te volume.

## Running the build container

### Flow

1. User `docker create` to create a container with the necessary volume mounts
2. Run this container for every build
3. Extract the result using `docker cp`

### Example

1. Create a container of the nodebuilder image

```sh
docker create  -v $(pwd)/client:/source -v $(pwd)/build.sh:/build.sh --name nodebuilder nodebuilder-img
```

Here, the node source code in the `$(pwd)/client` folder is mounted in `/source`.
The build script is mounted from `$(pwd)/build.sh`.

This could be a simple build script:
```sh
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
```

2. Run the container to build the node app

```sh
docker start -i nodebuilder
```

3. Extract the resulting code 

```sh
docker cp nodebuilder:/usr/local/build/source/build/ ~/app/
```

This assumes that the resulting files are located in `/usr/local/build/source/build`.