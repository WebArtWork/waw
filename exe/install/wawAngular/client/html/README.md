# Html used in waw client.
This folder used to structure in best way the html files. There are few simple rules to keep everything in same way.

## Structure
Initially we have folder structure which host all files which supporting many other files like index.html for Derer or angular directives. We can use three different type of pages which support different type of websites. Simple.html show how should be good to use page without angular. Local use angular but don't use local routing, which mostly used for SEO same as Simple.html. Route.html use angular local routing, mostly on pages which everything should run fast and SEO is not that required. Angular directives which can be used in different pages, each file should start with _ and then the name of the directive.

## Pages
All pages start with an file which is in the root folder. In most cases that file simply require the files from structure. In the case where page use local routing, we should create new folder for all local pages of that page.