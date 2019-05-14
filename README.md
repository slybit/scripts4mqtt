# scripts4mqtt

A simple automation system for MQTT messaging systems.

## Brief overview

Scripts4MQTT makes it possible to write simple automation scripts that interact primarily with an MQTT messaging system. It can read and create MQTT messages and respond with certain actions, depending on the rules set up by the user.

It consists of 2 parts:
1. The server that is registered with an MQTT broker and executes actions depending on the rules that are enabled.
2. The web client that can be used to manage the server.

The server is a node.js application with a simple Express based API.
The client is a React based web application, consisting only of static HTML and Javascript pages that are served by the server.

Note that the use of the API and the client is optional.

## Installation

### Without docker

To run scripts4mqtt directly on your host machine, you must have `node.js` and `npm` installed.

Start by downloading the latest release from github and unzip it in some folder of your choice.

Starts scripts4mqtt using
```sh
$ npm install  # just once to install all dependencies
$ node scripts4mqtt.js
```

This will start the scripts4mqtt server and also the API and the web client if it is enabled in the config file (see further below for details).

By default, the web client runs on port 4000 and you can test it by browsing to [http://localhost:4000/](http://localhost:4000/).


### Use it with docker

#### Use the image from docker hub:

```sh
$ docker run --name scripts4mqtt -v /path/to/scripts4mqtt/logs/:/logs/ -v /path/to/scripts4mqtt/config.yaml:/usr/src/app/config.yaml -v /path/to/scripts4mqtt/rules.yaml:/usr/src/app/rules.yaml --user 1000:1000 -p 4000:4000 bluemalt/scripts4mqtt
```

Since scripts4mqtt is writing to the 3 mounted folders/files, you have to make sure that you are running the container with *your* user id and group id by adapting the `--user` parameter. If you omit the `--user` parameter, the container will run as root and the log files, config.yaml and rules.yaml will also be owned by root. Not only is it bad practice to run containers as root when not required, it is also inconvenient.

#### Build it yourself

```sh
$ docker build . --tag scripts4mqtt
$ docker run --name scripts4mqtt -v /path/to/scripts4mqtt/logs/:/logs/ -v /path/to/scripts4mqtt/config.yaml:/usr/src/app/config.yaml -v /path/to/scripts4mqtt/rules.yaml:/usr/src/app/rules.yaml --user 1000:1000 -p 4000:4000 scripts4mqtt
```

Same remark abou the `--user` parameter applies here.

### If you wish to develop scripts4mqtt

Simply clone the repository and start the server with:
```sh
$ npm install
$ node scripts4mqtt.js
```
This will start the server and the API listening on port 4000 by default.


Start the client with:
```sh
$ cd client
$ npm install
$ npm start
```
This will start the React web client on port 3000. The web client will connect to the API on port 4000. This port can be configured in the `package.json` file in the client folder by adapting the `proxy` URL.

## Configuration

The configuration is done by adapting the `path/to/scripts4mqtt/config.yaml` file. The default file contains all options and documentation to explain the options.

## Setting up Rules

Rules are triggered by *conditions* and execute one or more *actions*.

## Creating Conditions

There are 2 types of conditions:
1. MQTT
2. A timing condition based on a cron expression



### MQTT condition



Any number of them can be combined using OR and AND operations.


# Notes

The client package.json specifies core-js@2 as a requirement, because react-sortly depends on this.
Probably in the future, this might give issues with react and hopefully react-sortly will move its dependency to core-js@3.



