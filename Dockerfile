FROM node:18
WORKDIR /
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD [ "node", "index.js" ]