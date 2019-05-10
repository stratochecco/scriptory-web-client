><template>
	<div class="fixed-bottom px-4 py-3 d-flex align-items-center cookie-banner">
        <span>By using this Site or clicking "I AGREE", you agree to our use of cookies. Read <a href="/docs/privacy" target="_blank">Privacy Policy</a>.</span>
        <b-button @click="$emit('agree')" variant="outline-info" size="sm" class="ml-auto">I AGREE</b-button>
    </div>
</template>

<script>

    import BButton from "bootstrap-vue/src/components/button/button";

	export default {
		name: "CookieBanner",
        components: { BButton }
	}

</script>

<style scoped lang="scss">

	@import "../sass/_config/variables";

	.cookie-banner {
        background-color: $DarkerBackgroundColor;
        height: auto;
        width: 100%;
	}

</style>
