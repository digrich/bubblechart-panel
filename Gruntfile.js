module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-package-modules');

    grunt.initConfig({
        clean: ["dist"],

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                ignores: ['src/bower_components/**', 'src/**/external/**'],
            },
            src: ['Gruntfile.js', 'src/**/*.js'],
        },
        copy: {
            src_to_dist: {
                cwd: 'src',
                expand: true,
                src: ['**/*', '!**/*.scss'],
                dest: 'dist'
            },
            pluginDef: {
                expand: true,
                src: ['plugin.json', 'README.md'],
                dest: 'dist',
            }
        },

        packageModules: {
            dist: {
                src: 'package.json',
                dest: 'dist/src'
            },
        },

        concat: {
            dist: {
                src: ['src/node_modules/**/*.js'],
                dest: 'dist/src/<%= pkg.namelower %>-<%= pkg.version %>.js'
            }
        },
        watch: {
            rebuild_all: {
                files: ['src/**/*', 'plugin.json', 'README.md'],
                tasks: ['default'],
                options: { spawn: false }
            },
        },

        babel: {
            options: {
                ignore: ['**/external/*'],
                sourceMap: true,
                presets: ["es2015"],
                plugins: ['transform-es2015-modules-systemjs', "transform-es2015-for-of"],
            },
            dist: {
                files: [{
                    cwd: 'src',
                    expand: true,
                    src: ['*.js'],
                    dest: 'dist',
                    ext: '.js'
                }]
            },
        },

    });

    grunt.registerTask('default', ['jshint', 'clean', 'copy:src_to_dist', 'copy:pluginDef', 'packageModules', 'babel']);
};