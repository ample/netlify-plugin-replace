# netlify-plugin-replace

[![build status](https://api.travis-ci.com/ample/netlify-plugin-replace.svg)](https://travis-ci.com/github/ample/netlify-plugin-replace) [![npm version](https://badge.fury.io/js/%40helloample%2Fnetlify-plugin-replace.svg)](https://www.npmjs.com/package/@helloample/netlify-plugin-replace)

Replace environment variables in your publish directory _before_ Netlify deploys your build. Check out an example implementation [here](https://github.com/ample/netlify-plugin-redirects-demo).

## Why?

Netlify will deploy whatever you stick in your publish directory. This is great for simple use-cases but for projects that span multiple environments or rely heavily on environment variables, it can be tricky manage those differences without resorting to gnarly sed scripts or other unmentionable approaches. 

This build plugin solves that problem by replacing references to environment variables _after_ your project is built. A great example of this plugin's power is dynmically updating your `_redirects` file based on its deployment context. 

## Install

Add the plugin to your package.json file...

```
$ npm i @helloample/netlify-plugin-replace -D
```

And add the plugin to your `netlify.toml` file (see configuration for available options)...

[[plugins]]
  package = "@helloample/netlify-plugin-replace"

Commit & push changes back to your repository. 

## Usage

By default, this plugin will look for the following pattern... 

```
${SOME_VALUE}
```

...and will attempt to replace that string with its relevant ENV variable. If the ENV variable doesn't exist, it won't be replaced with anything. 

Following this example, any file in your build's output directory that contains the string `${SOME_VALUE}` will have that string replaced with the contents of `process.env.SOME_VALUE` thanks to this plugin. 

## Configuration

This plugin offers some limited customization options as described below. Simply add these key/values to `netlify.toml` to customize the behavior for your needs.

* `delimiter`: Regex pattern that tells the plugin how to find values to replace. Note, this pattern should contain a single capture group which encapsulates the entire name of the variable (defaults to `${...}`)
* `fileTypes`: Regex pattern to determine the extension of the files to operate on (defaults to `.*`)

The default configuration, if none is specified, is:

[[plugins]]
  package = "@helloample/netlify-plugin-replace"
  [plugins.inputs]
    delimiter = "\${([^}]*)}"
    fileTypes = ".*$"

## License

This project is licensed under the [MIT License](https://github.com/ample/netlify-plugin-replace/blob/main/LICENSE).