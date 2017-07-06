/*
 * grunt-package-modules
 * https://github.com/joshperry/grunt-package-modules
 *
 * Copyright (c) 2014 Joshua Perry
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path'),
      npm = require('npm');

  grunt.registerMultiTask('packageModules', 'Packages node_modules dependencies at build time for addition to a distribution package.', function() {

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {

      // Make target dir
      grunt.file.mkdir(f.dest);
      
      // Verify that package.json exists and copy it to the target dir
      if(f.src.length === 1) {
        if(grunt.file.exists(f.src[0])) {
          grunt.file.copy(f.src[0], path.join(f.dest, f.src[0]));
        } else {
          grunt.fail.fatal('The package.json file specified does not exist at ' + f.src[0]);
          return false;
        }
      } else {
        grunt.fail.fatal('One source package.json should be specified. There were ' + f.src.length + ' source files specified.');
        return false;
      }

      // Pull the npm dependencies into the bundle directory
      npm.on('log', function(msg) {
        grunt.verbose.writeln(msg);
      });

      var done = this.async();

      npm.load({
        production: true,
        "ignore-scripts": !!f.ignoreScripts,
        prefix: f.dest
      }, function(err) {
        if(err) {
          grunt.fail.fatal(err);
        }

        npm.commands.install([], function(err) {
          if(err) {
            grunt.fail.fatal(err);
          }
          
          done();
        });
      });

    }.bind(this));

  });

};
