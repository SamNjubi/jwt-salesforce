FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
RUN apt-get -y install openssl=1.1.1-1ubuntu2.1~18.04.6
COPY . .
EXPOSE 8080
CMD [ "node", "index.js" ]