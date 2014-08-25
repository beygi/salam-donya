module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        wiredep: {
            rtl: {
                // Point to the files that should be updated when
                // you run `grunt wiredep`
                src: [
                    'index.rtl.html' // .html support...
                ],
                dependencies: true,
                devDependencies: false,
                fileTypes: {
                  html: {
                      block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
                      detect: {
                        js: /<script.*src=['"](.+)['"]>/gi,
                        css: /<link.*href=['"](.+)['"]/gi
                      },
                      replace: {
                        js: '<script src="/{{filePath}}"></script>',
                        css: '<link rel="stylesheet" href="/{{filePath}}" />'
                      }
                  }
                }
            },
            ltr: {
                //we must exclude some rtl specified from template
                src: [
                    'index.ltr.html' // .html support...
                ],
                dependencies: true,
                devDependencies: false,
                fileTypes: {
                  html: {
                      block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
                      detect: {
                        js: /<script.*src=['"](.+)['"]>/gi,
                        css: /<link.*href=['"](.+)['"]/gi
                      },
                      replace: {
                        js: '<script src="/{{filePath}}"></script>',
                        css: '<link rel="stylesheet" href="/{{filePath}}" />'
                      }
                  }
                },
                exclude: ['lib/bootstrap-rtl/dist/css/bootstrap-rtl.css']
            }
        },
        "bower-install-simple": {
            options: {
                color: true,
                production: true
            }
        },
        sass: { // task
            dist: { // target
                files: { // dictionary of files
                    'lib/app/css/main.css': 'dev/css/main.sass' // 'destination': 'source'
                },
                options: { // dictionary of render options
                    outputStyle: "compressed"
                }
            }
        },
        cssmin: {
            add_banner: {
                options: {
                    banner: '/* minified css file */'
                },
                files: {
                    'lib/app/css/main.css': ['lib/app/css/main.css']
                }
            }
        },

        uglify: {
            development: {
                options: {
                    /*apply if you want to prevent changes to your variable and function names.
          mangle: false
          */
                mangle: false
                },
                files: {
                    'lib/app/js/main.js': ['dev/js/main.js']
                }
            }
        },


        htmlmin: { // Task
            production: { // Target
                options: { // Target options
                    removeComments: true,
                    collapseWhitespace: true,
                    maxLineLength: 200
                },
                files: { // Dictionary of files
                    'index.rtl.html': 'index.rtl.html',
                    'index.ltr.html': 'index.ltr.html'// 'destination': 'source'
                }
            }
        },


        copy: {
            main: {
                files: [
                    // includes files within path
                    {
                        expand: true,
                        flatten: true,
                        src: ['dev/templates/*'],
                        dest: 'lib/app/templates'
                    }, {
                        expand: true,
                        flatten: true,
                        src: ['dev/css/*.ttf','dev/css/*.jpeg', 'dev/css/*.jpg', 'dev/css/*.png','dev/css/*.gif'],
                        dest: 'lib/app/css/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['dev/data.json'],
                        dest: 'lib/'
                    }, {
                        expand: true,
                        flatten: true,
                        src: ['dev/index.rtl.html'],
                        dest: ''
                    },{
                        expand: true,
                        flatten: true,
                        src: ['dev/index.ltr.html'],
                        dest: ''
                    }
                ]
            }
        },


        imagemin: { // Task
            dynamic: { // Another target
                files: [{
                    expand: true, // Enable dynamic expansion
                    cwd: 'lib/app/css/', // Src matches are relative to this path
                    src: ['**/*.{png,jpg,gif}'], // Actual patterns to match
                    dest: 'lib/app/css/' // Destination path prefix
                }],
                options: { // Target options
                    optimizationLevel: 7
                }
            }
        }


    });

    grunt.loadNpmTasks('grunt-wiredep');
    grunt.loadNpmTasks("grunt-bower-install-simple");
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    // Default task(s).
    grunt.registerTask('default', ['bower-install-simple', 'copy', 'sass', 'cssmin', 'uglify', 'wiredep', 'htmlmin', 'imagemin']);

};
