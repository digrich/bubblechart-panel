# grunt-package-modules

> Packages node_modules dependencies at build time for addition to a distribution package.

Checking `node_modules` in to source control is a lame solution to locking dependencies for a certain commit.
[npm shrinkwrap](https://docs.npmjs.com/cli/shrinkwrap) is great for locking dependencies to specific commits but doesn't directly help with distribution packaging.

The `node_modules` folder that is used for building your project is not viable for dist packaging because it will contain dev dependencies (like this grunt plugin) and can also contain host-specific binary node modules.

This task takes care of creating a fresh `node_modules` for including in a distribution tarball by effectively copying the `package.json` into a temp directory, and then executing `npm install --production --ignore-scripts --prefix tempdir/` to install all production deps into `tmpdir/node_modules`.

This directory can then be the source of another plugin, like copy or compress, to package the fresh `node_modules` into its delicious-looking retail packaging.

This is a great module to use with the concurrent plugin so that the node modules will download while other parts of your packaging flow are executing (sassing, lessing, uglifying, compiling, and other transformation plugins verbified).

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-package-modules --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-package-modules');
```

## The "packageModules" task

### Overview
In your project's Gruntfile, add a section named `package_modules` to the data object passed into `grunt.initConfig()`.

The `src` is the `package.json` that describes the dependencies that should be packaged up.
The `dest` is the destination directory where the fresh `node_modules` directory should be placed, this is usually a temp directory.

```js
grunt.initConfig({
  packageModules: {
    dist: {
      src: 'package.json',
      dest: '.tmp/module_packaging'
    },
  },
});
```

### Examples

Here is an example that uses the copy and compress plugins to send the packaged modules to a dist tarball:

```js
grunt.initConfig({
  packageModules: {
    dist: {
      src: 'package.json',
      dest: 'dist'
    },
  },
  copy: {
    dist: {
  	  files: [{
		// Copy project files to dist dir
        expand: true,
        dest: 'dist',
        src: [
          'lib/**/*'
        ]
      }]
    },
  },
  // tarball all the files in the dist dir into proj-dist.tar.gz
  compress: {
    dist: {
      options: {
	    archive: 'dist/proj-dist.tar.gz'
	  },
	  files: [{
	    expand: true,
		dot: true,
		cwd: 'dist',
        src: '**/*'
      }]
    }
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
**v0.1.0**
Initial Release

## To Do
- [ ] Tests
- [ ] Possibly add support for npm shrinkwraping
