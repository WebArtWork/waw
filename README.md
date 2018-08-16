# Web Art Work Framework
Framework Build to support every platform and many different technologies. On Mobiles area it use Cordova lib which works over webiste code. On computers OS like windows, iOS or linux it use Electron which also works on website code. For website work, there are 4 different base for workout as Angular.js, Vue.js, React.js and Angular which handle front-end workthrough.

## waw Core
[Each waw project](https://github.com/WebArtWork/waw/wiki/waw-Logic) has the same structure which is divided into client and server folders. [Server](https://github.com/WebArtWork/waw/wiki/waw-Server) is responsible for the REST API and all server side processes. [CRUD](https://github.com/WebArtWork/waw/wiki/waw-CRUD) is build to use routes which is similar on each piece of logic and server config modify details of it. Client is responsible for what browser client see and can be build with [Angular.js](https://github.com/WebArtWork/waw/wiki/waw-Angular) or [Angular 6](https://github.com/WebArtWork/waw/wiki/waw-Ngx). [Translate](https://github.com/WebArtWork/waw/wiki/waw-Translate) is part of client and it's responsible to translate the web content into different language without using code modifications.

## Node.js
[Node.js](https://nodejs.org) is the main key of the framework, something that's it's built on. To work with framework you have to install it on your environment. Prefferable use LTS version, to don't have any problems with not tested node.js.

## Installtion
```bash
npm i -g waw
```
If you are experiencing issues with installation on permision level, you can try command.
```bash
npm i -g --unsafe-perm waw
```
### Packages required globally
npmi is package with which waw can install other packages within the waw project.
```bash
npm i -g npmi
```
pm2 is required mostly on servers, which keep your process online no matter what happens.
```bash
npm i -g pm2
```
nodemon is local project runner, which allow you to develop in a nice way.
```bash
npm i -g nodemon
```

## Get Started
To create new waw project you can type:
```bash
waw new
```
which will create project within the folder you are in, with name which you provided and client branch which you selected.

Inside waw project folder you can type 
```bash
waw
```
which will start your project if everything is installed correctly.

## Framework Structure
For those who want to check code of the waw, there are 3 folders exe, run and sd which handle everything within the framework.

### exe 
handle all commands which can be executed from terminal, like create new project or create new part and many others.

### run
This folder basically create website, reading all parts from the server, run workers of the client connect with other Web Art Work tools.

### sd
There are scripts which are helpful in both exe and run folder and for that scenario there is sd folder which mostly have useful functions and packages.