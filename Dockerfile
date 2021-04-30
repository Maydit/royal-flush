#FROM is the base image for which we will run our application
FROM node:latest

# Update and install dependencies
RUN apt-get update

# Set the Working Envrionment
WORKDIR /usr/royal-flush

# Copy files and directories from the application
COPY package-lock.json /usr/royal-flush
COPY package.json /usr/royal-flush

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "/usr/royal-flush/src/server.js" ]
