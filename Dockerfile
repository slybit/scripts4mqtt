FROM node:carbon-alpine

# Create app directory
WORKDIR /usr/src/app

# server
COPY package.json ./
RUN npm install --production
# Bundle app source
COPY *.js ./

# client
RUN mkdir -p /usr/src/app/client/build
COPY client/build/ /usr/src/app/client/build

#USER node:node

CMD [ "node", "scripts4mqtt.js" ]

# run with
# docker run --name scripts4mqtt -v /home/stefaan/scripts4mqtt/logs/:/logs/ -v /home/stefaan/scripts4mqtt/config.yaml:/usr/src/app/config.yaml -v /home/stefaan/scripts4mqtt/rules.yaml:/usr/src/app/rules.yaml --user 1000:1000 -p 80:4000 -i scripts4mqtt:1.0


