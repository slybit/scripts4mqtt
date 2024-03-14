# scripts4mqtt

A simple automation system for MQTT messaging systems.

## Brief overview

Scripts4MQTT makes it possible to write simple automation scripts that interact primarily with an MQTT messaging system. It can read and create MQTT messages and respond with certain actions, depending on the rules set up by the user.

It consists of 2 parts:
1. The server that is registered with an MQTT broker and executes actions depending on the rules that are enabled.
2. The web client that can be used to manage the server.

The server is a node.js application with a simple Express based API.
The client is a React based web application, consisting only of static HTML and Javascript pages that are served by the server.

The use of the API and the client is optional.

## Installation

### Without docker

To run scripts4mqtt directly on your host machine, you must have `node.js` and `npm` installed.

Start by downloading the latest release from github and unzip it in some folder of your choice.

Starts scripts4mqtt using
```sh
$ cd server
$ npm install  # just once to install all dependencies
$ npm install -g nodemon # just once
$ nodemon --watch ../config -e yaml --ignore ../config/rules.yaml scripts4mqtt.js
```

This will start the scripts4mqtt server and also the API and the web client if it is enabled in the config file (see further below for details).

I use nodemon to automatically restart the server whenever the `config/config.yaml` file is changed. This was added because the web api allows you to edit the config file and most updates of the config are only taken into account with a server restart. If you don not need this feature, you can just use `node scripts4mqtt.js` to start the server.

By default, the web client runs on port 4000 and you can test it by browsing to [http://localhost:4000/](http://localhost:4000/).


### Use it with docker

#### Use the image from docker hub:

```sh
$ docker run --name scripts4mqtt -v /hostpath/to/scripts4mqtt/logs/:/scripts4mqtt/logs/ -v /hostpath/to/scripts4mqtt/config/:/scripts4mqtt/config/ --user 1000:1000 -p 4000:4000 slybit/scripts4mqtt:VERSION
```

(Look on [docker hub](https://hub.docker.com/repository/registry-1.docker.io/slybit/scripts4mqtt/tags?page=1) for the latest available version.)

Since scripts4mqtt is writing to the 3 mounted folders/files, you have to make sure that you are running the container with *your* user id and group id by adapting the `--user` parameter. If you omit the `--user` parameter, the container will run as root and the log files, config.yaml and rules.yaml will also be owned by root. Not only is it bad practice to run containers as root when not required, it is also inconvenient.

You should make sure that the `/hostpath/to/scripts4mqtt/logs/` and the `/hostpath/to/scripts4mqtt/config` folders exist prior to starting the container. If they do not exist, docker will create them and they will be owned by `root`!


### From source

Clone the latest master branch from github.

Build the React web app and start the server:

```sh
$ cd client
$ npm install # gonna install quite a lot of development dependencies
$ npm run build # will build the final react web app in the 'client\build' folder
$ cd ../server
$ npm install # server dependencies
$ node scripts4mqtt # will start the server and web api and react web app
```

Or build your own docker image:

```sh
$ ./build_docker.sh VERSION
```

The script basically goes through the steps above (building the client, etc.) and then runs a 'docker build' to create an image tagged with 'scripts4mqtt:VERSION'.

!!Build it using node v16!!

Finally start your own container:

```sh
$ docker run --name scripts4mqtt -v /hostpath/to/scripts4mqtt/logs/:/scripts4mqtt/logs/ -v /hostpath/to/scripts4mqtt/config/:/scripts4mqtt/config/ --user 1000:1000 -p 4000:4000 scripts4mqtt:VERSION
```


## If you wish to develop scripts4mqtt

For development, it is highly recommended to run the `server` and `client` separately. This way, you get all the advantage of the React development tools and you do not have to rebuild the React app for every change you make.

Clone the repository and start the server with:
```sh
$ cd server
$ npm install
$ node scripts4mqtt.js # or nodemon --watch ../config -e yaml --ignore ../config/rules.yaml scripts4mqtt.js
```
This will start the server and the API listening on port 4000 by default.

Start the client with:
```sh
$ cd client
$ npm install
$ npm start
```
This will start the React web client on port 3000. The web client will connect to the API on port 4000. This port can be configured in the `client\package.json` file in the client folder by adapting the `proxy` URL.

## Configuration

The configuration is done by adapting the `hostpath/to/scripts4mqtt/config/config.yaml` file. The default file contains all options and documentation to explain the options.

## Setting up Rules

Rules are triggered by *conditions* and execute one or more *actions*.

## Creating Conditions

There are 2 types of conditions:
1. MQTT
2. A timing condition based on a cron expression



### MQTT condition



Any number of them can be combined using OR and AND operations.

## Actions


### Delay and repetition

The execution of an action can be delayed and or repeated.

In case either of these options is used for one or more actions in a rule, the following will happen we the condition block of that rule is triggered again:
* All pending actions (delayed and repeating) will be cancelled.
* New delayed and/or repeating actions will be created with the updated context.

This means that:
* In case a re-trigger happens sooner than the delay of an action, that action's delay will be reset.
* In case of a running repeating action, the action's context will be updated to reflect the new trigger conditions.


### Delay

The delay parameter will delay the execution of an action with the specified amount of milliseconds. For example, setting a delay of 60000 will delay the execution of the action with 1 minute.



# Notes

The client package.json specifies core-js@2 as a requirement, because react-sortly depends on this.
Probably in the future, this might give issues with react and hopefully react-sortly will move its dependency to core-js@3.



