"use strict";

var metalsmith  = require('metalsmith'),
    markdown    = require('metalsmith-markdown'),
    layouts     = require('metalsmith-layouts'),
    collections = require('metalsmith-collections'),
    permalinks  = require('metalsmith-permalinks'),
    branch      = require('metalsmith-branch'),
    sass        = require('metalsmith-sass'),
    Handlebars  = require('handlebars'),
    fs          = require('fs'),
    path        = require('path'),
    _           = require('lodash');

var languages = '\/us\/|\/de\/|\/zh\/';

var makeLangFolder = function(files, metalsmith, done) {
    for (var file in files) {
        if (file.match(languages)) {
            var fileUrlTmp = file.split('/');
            var startLang = fileUrlTmp.splice(-2, 1);
            var fileUrl = fileUrlTmp.unshift(startLang);
            fileUrl = fileUrlTmp.join('/');
            var data = files[file];
            delete files[file];
            files[fileUrl] = data;
        }
    }
    done();
};

var makeIndex = function(files, metalsmith, done) {
    var folders = [];
    var filesWithLang = [];
    for (var file in files) {
        if (file.match(languages)) {
            var folder = path.dirname(file);
            files[file].pathLang = folder;
            filesWithLang.push(files[file]);
            folders.push(folder);
        }
    }

    //find unique folder paths
    folders = _.uniq(folders);

    //concat the files in those paths
    for (var i=0; i < folders.length; i++) {
        var folderPath = folders[i];
        var toIndex = '';
        var templateIndexName = '';
        var toToc = [];
        for (var j=0; j < filesWithLang.length; j++) {
            var fileWithLang = filesWithLang[j];
            if (fileWithLang.pathLang == folderPath) {
                if (fileWithLang.indexTemplate) {
                    templateIndexName = fileWithLang.indexTemplate;
                }
                toIndex += fileWithLang.contents.toString();
                toToc.push(fileWithLang.title);
            }
        }
        files[folderPath + '/index.html'] = {
            layout: templateIndexName,
            contents: new Buffer(toIndex),
            toc: toToc
        };
    }
    done();

};

var deletePartialMarkdownFiles = function(files, metalsmith, done) {
    var meta = metalsmith.metadata();
    for (var file in files) {
        var type = files[file].type;
        if (type == "partial") {
            delete files[file];
        }
    }
    done();
};

Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/layouts/partials/header.html').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/layouts/partials/footer.html').toString());
Handlebars.registerPartial('listpagebreadcrumb', fs.readFileSync(__dirname + '/layouts/partials/listpagebreadcrumb.html').toString());

// helper to slugify strings
Handlebars.registerHelper('slug', function (content) {
    var spacesToDashes = content.split(' ').join('-').toLowerCase();
    var removeChars = spacesToDashes.replace(/[^a-zA-Z0-9\- ]/g, "");
    return removeChars;
});

// helper to update date, format: 10 Mar 2014
Handlebars.registerHelper('date', function () {
    var date = new Date();
    var day = date.getDate();
    var month = [];
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    var year = date.getFullYear();
    var str = day + ' ' + month[date.getMonth()] + ' ' + year;
    return str;
});

// if equals helper
Handlebars.registerHelper('if_eq', function (a, b, opts) {
    if (a == b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

// if not equals helpers
Handlebars.registerHelper('if_ne', function (a, b, opts) {
    if (a != b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

metalsmith(__dirname)
    .use(layouts({
        engine: 'handlebars'
    }))
    .use(markdown())
    .use(makeIndex)
    .use(layouts({
        engine: 'handlebars'
    }))
    .use(makeLangFolder)
    .use(sass({
        file: "scss/*.scss",
        outputDir: '/assets/css',
        outputStyle: "compressed"
    }))
    .use(deletePartialMarkdownFiles)
    .destination('./build')
    .build(function (err) {
        if (err) console.log(err)
    });


