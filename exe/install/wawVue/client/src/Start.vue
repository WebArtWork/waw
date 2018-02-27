<template>
<div id="app">
	<header>
		<div class="wrapeer_header">
			<nav class="bu">
				<router-link to="/App"> To App page</router-link>
				<router-link to="/HelloWorld"> To HelloWorld page</router-link>
			</nav>
		</div>
	</header>
	<router-view class ="content"></router-view>

</div>
</template>

<script>
	export default {
  name: 'Start'
}
</script>