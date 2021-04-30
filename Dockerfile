#FROM is the base image for which we will run our application
FROM node:latest

# Copy files and directories from the application
COPY README.md /usr/royal-flush
COPY package-lock.json /usr/royal-flush
COPY package.json /usr/royal-flush
COPY Procfile /usr/royal-flush
COPY src /usr/royal-flush/src