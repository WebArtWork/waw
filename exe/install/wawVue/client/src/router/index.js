import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import App from '@/components/App'

Vue.use(Router)

export default new Router({
 routes: [
	{ 
		path: '/App',
		name: "pageOne",
		component: App
	},
	{ 
		path: '/Helloworld',
		name: "pageTwo",
		component: HelloWorld
	}
	],
	// mode: 'history'
})
