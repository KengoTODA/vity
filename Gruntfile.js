module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      build: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'bower_components/',
          src: [
            'angular/*.js', 'angular/*.map', 'angular/*.gzip',
            'jquery/dist/*',
            'bootstrap/dist/js/*',
            'requirejs/require.js',
            'es5-shim/es*.js', 'es5-shim/es*.map',
            'es6-shim/es*.js', 'es6-shim/es*.map',
            'qunit/qunit/qunit.js'
          ],
          dest: 'html/js/lib/'
        }, {
          expand: true,
          flatten: true,
          cwd: 'bower_components/',
          src: [
            'bootstrap/dist/css/*', 'angular/*.css', 'qunit/qunit/qunit.css',
            'fontawesome/css/*.css'
          ],
          dest: 'html/css/'
        }, {
          expand: true,
          flatten: true,
          cwd: 'bower_components/',
          src: [
            'bootstrap/dist/fonts/*', 'fontawesome/fonts/*'
          ],
          dest: 'html/fonts/'
        }]
      }
    }, // end of copy task
    watch: {
      less: {
        files: ['./html/less/*.less', './html/**/*.html', './html/**/*.js'],
        tasks: ["less"],
        options: {
          livereload: {
            key: grunt.file.read('./ssl/key.pem'),
            cert: grunt.file.read('./ssl/cert.pem')
          },
          spawn: false,
          interval: 300
        }
      }
    },
    less: {
      style: {
        options: {
          cleancss: true
        },
        src: "./html/less/vity.less",
        dest: "./html/css/vity.css"
      },
    },
    concurrent: {
      target: {
        tasks: ['less:watch', 'watch:less'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-concurrent');


  grunt.registerTask('default', ['copy']);
};
