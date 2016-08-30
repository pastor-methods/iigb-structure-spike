'use strict';


var metalsmith = require('metalsmith'),
  markdown = require('metalsmith-markdown'),
  layouts = require('metalsmith-layouts'),
  sass = require('metalsmith-sass'),
  fs = require('fs'),
  structureParser = require('./lib/structure-parser');


var handle = require('./lib/helpers/error-handler').handle;

build();

/**
 * Main build function. Builds site with content, structure and layouts
 */
function build() {
  metalsmith(__dirname)
    .use(markdown())
    .use(structureParser('./structure'))
    .use(layouts({
      engine: 'swig'
    }))
    .use(sass({
      file: 'scss/main.scss',
      outputDir: './assets/css',
      outputStyle: 'compressed'
    }))
    .use(sass({
      file: 'scss/main-ie8.scss',
      outputDir: './assets/css',
      outputStyle: 'compressed'
    }))
    .use(sass({
      file: 'scss/main-ie9.scss',
      outputDir: './assets/css',
      outputStyle: 'compressed'
    }))
    .destination('./build')
    .build(function(err) {
      handle(err);
    });
}