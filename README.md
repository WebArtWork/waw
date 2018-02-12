# Web Art Work Framework
Framework Build to support every platform and many different technologies. On Mobiles area it use Cordova lib which works over webiste code. On computers OS like windows, iOS or linux it use Electron which also works on website code. For website work, there are 4 different base for workout, Angular.js, Vue.js, React.js and Angular which handle front-end workthrough.

## Node.js
[Node.js](https://nodejs.org) is the main key of the framework, something that's it's built on. To work with framework you have to install it on your environment.

## Installtion
npm i -g waw

### Packages required globally
npm i -g npmi
npm i -g pm2
npm i -g nodemon


## Client Side
After you decide on which tech you want to work, there are many different possibilities for each client side framework. The common part is script which we create to connect with server and handle information. Every client has it's own workers which do different jobs, from generating files to translating texts.

## Server Side
Main database is Mongodb which is NoSQL database and has collections and each collection has documents. So we divided our back-end into parts which each one has one collection and handle everything has to do with that collection. Build-in crud works with each part and has specific routes with url with part name.


## Framework Structure
There are 3 folders exe, run and sd which handle everything within the framework.

### exe 
Folder exe handle all commands which can be executed from terminal, like create new project or create new part and many others.

### run
This folder basically create website, reading all parts from the server, run workers of the client connect with other Web Art Work tools.

### sd
There are scripts which are helpful in both exe and run folder and for that scenario there is sd folder which mostly have useful functions and packages.