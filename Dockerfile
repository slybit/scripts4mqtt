FROM node:carbon-alpine

# Create app directory
RUN mkdir -p /scripts4mqtt/server && mkdir -p /scripts4mqtt/client/build

# server
WORKDIR /scripts4mqtt/server
COPY ./server/package.json ./
RUN npm install --production && npm install -g nodemon
# Bundle app source
COPY ./server/*.js ./

# client
WORKDIR /scripts4mqtt/client/build
COPY client/build/ ./

WORKDIR /scripts4mqtt/server

CMD [ "nodemon", "--watch", "../config", "-e", "yaml", "--ignore", "../config/rules.yaml", "scripts4mqtt.js" ]

# run with
# docker run --name scripts4mqtt -v /home/stefaan/scripts4mqtt/logs/:/scripts4mqtt/logs/ -v /home/stefaan/scripts4mqtt/config/:/scripts4mqtt/config/ --user 1000:1000 -p 80:4000 -i scripts4mqtt:1.0


