// import Vue from 'vue'
import Vue from 'vue/dist/vue.js'
import App from './components/App.vue'
import Start from './Start.vue'
import HelloWorld from './components/HelloWorld.vue'
import VueRouter from 'vue-router'
import wcom from 'vue-router'

Vue.config.productionTip = false

Vue.use(VueRouter);

const router = new VueRouter({
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
	mode: 'history'
})

new Vue({
  el: "#app",
  render: h => h(Start),
  router
})
