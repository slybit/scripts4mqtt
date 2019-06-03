FROM node:carbon-alpine

# Install tzdata so we can set the timezone
RUN apk add tzdata

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

CMD [ "nodemon", "--watch", "../config/config.yaml",  "scripts4mqtt.js" ]

# run with
# docker run --name scripts4mqtt -v /home/stefaan/scripts4mqtt/logs/:/scripts4mqtt/logs/ -v /home/stefaan/scripts4mqtt/config/:/scripts4mqtt/config/ --user 1000:1000 -p 80:4000 -e "TZ=Europe/Brussels" -i scripts4mqtt:1.0

# push to docker hub
# docker tag a38fdc2514c7 slybit/scripts4mqtt:0.3
# docker push slybit/scripts4mqtt:0.3

