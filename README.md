# royal-flush

Do you enjoy poker with your friends? Ever wanted to keep track of who wins and loses and prove to them definitively that you’re the best among them? Our app allows you to record your live poker games simply and easily, then gives you personal statistics on them. You can use our lightweight design to enter poker hands and results with either your mobile device or on our website. You can tell how many hands you win on average, your betting tendencies, and many other kinds of statistics to compare them with friends, improve your game, and have fun playing face to face poker.

Live at [royalflush.herokuapp.com](royalflush.herokuapp.com)

# How to Run Locally

1. Install Node.js and npm by going to the [Node.js download page](https://nodejs.org/en/download/) and picking the installer that matches your operating system.
2. Clone this repository to your local machine. To do this, open up the Git terminal and go to the directory you would like the project to reside in. Once you are there, run the following command:
> `git clone https://github.com/Maydit/royal-flush.git`
3. Open up the node terminal, and from that terminal go to the new royal-flush directory that was just created.
4. Run the following command from the royal-flush directory (this only needs to be performed once):
>`npm install`
5. Everytime you would like to start the server from the royal-flush directory, run the the following command:
>`node src/server.js`
6. Once the server is running, open up your web browser and put localhost:3000 as the URL.
# How to Run Through Docker

1. Install docker by going to the [Docker download page](https://docs.docker.com/get-started/) and picking the installer that matches your operating system.
2. Once docker is set up, run the following commands
> `docker pull eekor/royalflush`
> `docker run --publish 3000:3000 eekor/royalflush`
3. Once the container is successfully running, open up your web browser and put localhost:3000 as the URL.

# [Code Of Conduct](https://github.com/justinchen673/royal-flush/blob/testingScripts/Contributor%20Code%20of%20Conduct.md)

# [How to Run The Demo/Testing Script](https://github.com/justinchen673/royal-flush/blob/testingScripts/runningTesting.md)

