<template>
	<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" :width="width" viewBox="0 0 210 200"><title>flag</title><rect width="10" height="200"/><rect x="10" width="200" height="100" style="fill:none"/><path d="M210,100H10V0H210ZM14,96H206V4H14Z" style="fill:#fff"/><rect id="Quarter-1" x="14" y="4" width="96" height="46"  :fill="quarters[0]"/><rect id="Quarter-2" x="110" y="4" width="96" height="46"  :fill="quarters[1]"/><rect id="Quarter-3" x="14" y="50" width="96" height="46"  :fill="quarters[2]"/><rect id="Quarter-4" x="110" y="50" width="96" height="46"  :fill="quarters[3]"/></svg>
</template>

<script>

	export default {
		name: "Flag",
		props: { width: String, quarters: Array }
	}

</script>
