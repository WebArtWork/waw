// import Vue from 'vue'
import Vue from 'vue'
import Start from './Start.vue'
import router from './router'
import wvcom from 'wvcom/mongo.js'

Vue.use(wvcom)
Vue.config.productionTip = false

new Vue({
  el: "#app",
  render: h => h(Start),
  router,
  created: function() {
   this.$mongoMethod();
   this.$newMongoMethod();
  }
})
