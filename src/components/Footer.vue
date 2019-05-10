<template>
	<b-container>
		<footer class="page-footer font-small">
			<div class="container">
				<div class="row">
                    <div class="col-6 col-md">
                        <h3>Useful links</h3>
                        <p><b-link to="/docs/support">Support</b-link></p>
                    </div>
					<div class="col-6 col-md">
						<h3>Info</h3>
                        <p><b-link to="/docs/under-the-hood">Under the hood</b-link></p>
						<p><b-link to="/docs/terms">Terms of Use</b-link></p>
						<p><b-link to="/docs/privacy">Privacy</b-link></p>
					</div>
				</div>
				<div class="row">
					<div class="col-12">
						<div class="footer-copyright text-center py-3">© {{ new Date() | moment("YYYY") }} Francesco Camuffo | scriptory.io <a href="https://github.com/stratochecco/scriptory-web-client/releases"><img src="https://badgen.net/github/release/stratochecco/scriptory-web-client" alt="Scriptory version"></a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	</b-container>
</template>

<script>


	import BLink from "bootstrap-vue/src/components/link/link";
    import BContainer from "bootstrap-vue/src/components/layout/container";

    export default {
		name: "AppFooter",
        components: { BContainer, BLink }
    }

</script>

<style scoped lang="scss">

	@import "../sass/_config/variables";

	.page-footer {
		border-top: 1px solid $PrimaryColor;
		margin-top: 80px;
	}

</style>
