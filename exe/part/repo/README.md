# waw CNAME part

## part.json
Field name is used in waw crud to define sd.CNAME and other crud options like base for update, get etc.<br>
Field dependencies is exactly the same dependencies which was in package.json. All those modules which will be definded there, will be installed in root folder into node_modules.<br>
Field crud is configuration for waw crud, define which fields should be updated and how.

## schema.js
Here we have the collection define for mongodb. If you use waw crud, you should configure here the create method, so crud create work.

## router.js
In this file you start to write your own REST API, which will start with /api/NAME.<br>
Waw crud configuration continue here, permision for each update, create, remove and get<br>
Everything what is in commends, code can be uncomment and modified. All those code are like that by default.

## waw crud