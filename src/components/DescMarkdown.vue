<template>
    <markdown-editor class="desc-markdown" :value="value" :sanitize="true" :configs="configs" @input="updateValue"></markdown-editor>
</template>

<script>

    import markdownEditor from 'vue-simplemde/src/markdown-editor';

    export default {
        name: "DescMarkdown",
        components: {
            markdownEditor
        },
        props: { value: String },
        data () {
            return {
                configs: {
                    toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "horizontal-rule", "|", "code", "link", "image", "table", "preview", "|", "guide"]
                }
            }
        },
        methods: {
            updateValue(value) {
                this.$emit('input', value);
            }
        }
    }

</script>

<style lang="scss">

    .desc-markdown {
        @import '../../node_modules/simplemde-theme-base/src/simplemde-theme-base';
    }

</style>
