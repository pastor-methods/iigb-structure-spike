'use strict';

/**
 * Dependencies
 */
var metalsmith = require('metalsmith');
var json = require('metalsmith-json');
var path = require('path');
var debug = require('debug')('structure-parser');


/**
 * Helpers
 */
var handle = require('./helpers/error-handler').handle;


/**
 * Expose `plugin`.
 */
module.exports = structureParser;



/**
 * Metalsmith plugin to parse iigb path structure.
 *
 * Parses each {language-code}.json file under structure folder
 * and puts mapped content data into releavent page entries.
 
 *
 * @param  {Object} opts options
 * @return {Function}
 */
function structureParser(structuesDirectory) {
  var directory = structuesDirectory || './structure';

  return parseStructure;

  /**
   * Using contents supplied, parser replaces actual content with content path defined in sections in structure file.
   *
   * The parser clears supplied markdown and html files (@param contents) and supplies each page entry as an index.html
   * file to be created by metalsmith. Each page entry can have multiple contents mapped to it in sections. The
   * content is attached as metadata (data field) to each filed.
   *
   * The resulting file list can be processed using markdown layout plugin.
   *
   * @param  {Object}   contents markdown or html files
   * @param  {[type]}   msmith   metalsmith
   * @param  {Function} done     callback
   */
  function parseStructure(contents, msmith, done) {
    var baseDir = msmith._directory;
    debug('Using directory:', path.join(baseDir, directory));
    parse();

    function parse() {
      var files = {}; //resulting index.html file to replace content file list
      metalsmith(baseDir)
        .source(directory)
        .use(json())
        .process(function(err, structureFiles) {
          handle(err);
          Object.keys(structureFiles)
            .forEach(function(structure) {
              if (isJson(structure)) {
                debug('Processing ' + structure);
                var lang = path.basename(structure, '.json');
                processStructure(lang, structureFiles[structure], files);
              } else {
                debug('Skipping file ' + structure);
              }
            });

          clearContentFiles(contents);
          extend(contents, files); //push index.html files into file list
          done();
        });
    }

    /**
     * Clear content files (namely .html files in file list)
     * to no to be copied over to build.
     *
     * Note: Since markdown files are expected to be processed before
     * they also will have .htm extension
     *
     * @param  {Object} obj the object
     */
    function clearContentFiles(obj) {
      Object.keys(obj).forEach(function(key) {
        if (isContent(key)) {
          delete obj[key];
        }
      });
    }

    /**
     * Extend object properties with another given object
     * @param  {Object} source      source object
     * @param  {[type]} destination destionation object
     */
    function extend(source, destination) {
      Object.keys(destination).forEach(function(key) {
        source[key] = destination[key];
      });
    }


    function processStructure(language, structure, files) {
      var data = structure.data;
      if (!data) {
        return;
      }
      parsePages(language, structure.data, null, files);
    }

    function parsePages(language, pages, parentPath, files) {
      for (var i = 0; i < pages.length; i++) {
        var page = pages[i];
        debug('Processing page entry ' + page.url);
        var filePath = language + path.sep + buildPath(page, parentPath);
        //put new page to resulting file list
        files[filePath + 'index.html'] = inflateContent(language, page, contents);
        //Process sub pages
        if (page.children) {
          parsePages(language, page.children, path, contents, files);
        }
      }
    }

    /**
     * Replaces sections with actual content
     * and transform page object to a metalsmith processable file entry
     * @return {Object} inflated page entry
     */
    function inflateContent(language, page, contents) {
      page.language = language;
      var sections = page.sections;
      Object.keys(sections).forEach(function(key) {
        var section = sections[key];
        if (typeof section === 'string') { //content path
          sections[key] = getContent(section, key);
        } else if (isArray(section)) { //content path list
          for (var i = 0; i < section.length; i++) {
            section[i] = getContent(section[i], key);
          }
        }
      });

      //metalsmith layouts skips file entries with non-utf8 or empty contents.
      //This will make it work
      page.contents = '';
      return page;

      function getContent(cPath, sectionKey) {
        var p = path.parse(cPath);
        //content files are transformed into html after markdown process
        var contentPath = p.dir + path.sep + p.name + '.html';
        var content = contents[contentPath];
        if (content) {
          debug('Map:"' + cPath + '" -> "' + page.layout + ':' + sectionKey + '"');
          if (content.contents) {
            content.contents = content.contents.toString(); //buffer to string
          }
        } else {
          debug('Content not found ', contentPath);
        }
        return content;
      }

    }


    function isArray(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
     * Builds path by appending page path to parent path
     * @param  {Object} page       page entry
     * @param  {String} parentPath parent page path
     * @return {String}            resulting path
     */
    function buildPath(page, parentUrl) {
      var p;
      if (!parentUrl || (parentUrl === '/')) {
        p = page.url;
      } else {
        p = parentUrl + page.url;
      }

      return trail(p);

      //add trailing slash to path
      function trail(p) {
        if (p === '/') {
          return ''; //paths should be ralative to build folder
        }
        return p + path.sep;
      }
    }

    function isJson(file) {
      return /\.json/.test(path.extname(file));
    }

    function isContent(file) {
      var ext = path.extname(file);
      return /\.html/.test(ext);
    }

  }
}