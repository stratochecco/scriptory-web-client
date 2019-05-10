<template>
	<b-container id="viewContainer">
        <div id="try-mode-alert" class="px-2">TRY-MODE - CHANGES WILL NOT PERSIST</div>
		<Board mode="try" :uid="boardUid"></Board>
	</b-container>
</template>

<script>

    import BContainer from "bootstrap-vue/src/components/layout/container";
    import Board from "../../components/board/Board";

	export default {
		name: "Boards_Try_View",
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

    #try-mode-alert {
        background-color: $PrimaryColor;
        border-radius: 4px;
        color: $DarkColor;
        font-size: 0.8rem;
        font-weight: 500;
        left: 4px;
        margin-top: -16px;
        opacity: .6;
        position: fixed;
        right: 4px;
        text-align: center;
    }

</style>
