module.exports = function(api) {
    api.cache(true);
    const presets = [
        [
            '@babel/preset-env',
            {
                corejs: 2,
                useBuiltIns: 'usage',
                targets: {
                    browsers: 'last 2 versions, > 1%, not IE <= 11'
                },
                modules: 'commonjs'
                //debug: true,
            }
        ]
    ];
    const plugins = [
        ['@babel/plugin-syntax-dynamic-import'],
        ['@babel/plugin-transform-spread'],
        ['@babel/plugin-transform-runtime']
    ];
    return {
        presets,
        plugins
    };
};
