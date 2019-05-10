const webpackConfig = require('./webpack.config.js');

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        webpack: {
            options: {
                stats: true
            },
            dev: webpackConfig('development'),
            prod: webpackConfig('production')
        },
        /*copy: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: ['*.js'],
                        dest: './webroot/js/'
                        //ext: '.js',
                        //extDot: 'first'
                    },
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: ['*.css'],
                        dest: './webroot/css/'
                        //ext: '.css',
                        //extDot: 'first'
                    }
                ]
            },
            prod: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: ['*.min.js'],
                        dest: './webroot/js/',
                        ext: '.min.js',
                        extDot: 'first'
                    },
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: ['*.min.css'],
                        dest: './webroot/css/',
                        ext: '.min.css',
                        extDot: 'first'
                    }
                ]
            }
        },*/
        watch: {
            vue: {
                files: ['src/**/*.vue', 'src/**/*.js', 'src/**/*.scss'],
                tasks: ['webpack-dev']
            }
        }
    });

    grunt.loadNpmTasks('grunt-webpack');
    //grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.loadNpmTasks('grunt-contrib-watch');

    //grunt.registerTask('webpack-dev', ['webpack:dev', 'copy:dev']);
    grunt.registerTask('webpack-dev', ['webpack:dev']);

    //grunt.registerTask('webpack-prod', ['webpack:prod', 'copy:prod']);
    grunt.registerTask('webpack-prod', ['webpack:prod']);

    grunt.registerTask('watch-vue', ['watch:vue']);
};
