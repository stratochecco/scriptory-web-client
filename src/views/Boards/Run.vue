<template>
	<b-container id="viewContainer">
		<Board mode="run" :uid="boardUid"></Board>
	</b-container>
</template>

<script>

    import BContainer from "bootstrap-vue/src/components/layout/container";

    import Board from '../../components/board/Board';

    export default {
        name: "Boards_Run_View",
        components: { BContainer, Board },
        data () {
            return {}
        },
        computed: {
            boardUid () {
                return this.$route.params.uid;
            }
        }
    }

</script>

<style scoped lang="scss">

	@import "../../sass/_config/variables";

	#viewContainer {
		max-width: 100%;
	}

</style>
