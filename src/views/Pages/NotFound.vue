<template>
	<b-container id="viewContainer">
		<b-card style="text-align: center;">
			<h1 style="font-size: 8rem;">404 👻</h1>
			<h2>The page you are looking for does not exists!</h2>
		</b-card>
		<b-card style="text-align: center;">
			<b-link to="/"><b-button variant="outline-light">Home</b-button></b-link>
			<b-link to="/explore"><b-button variant="outline-light">Find Something</b-button></b-link>
			<b-link to="/u/profile"><b-button variant="outline-light">Profile</b-button></b-link>
		</b-card>
	</b-container>
</template>

<script>

    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BLink from "bootstrap-vue/src/components/link/link";

    export default {
        components: { BLink, BCard, BContainer }
    };

</script>
