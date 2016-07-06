"use strict";

var metalsmith = require('metalsmith'),
    markdown = require('metalsmith-markdown'),
    layouts = require('metalsmith-layouts'),
    sass = require('metalsmith-sass'),
    Handlebars = require('handlebars'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

var languages = '\/us\/|\/de\/|\/cn\/';

var makeLangFolder = function (files, metalsmith, done) {
    for (var file in files) {
        if (file.match(languages)) {
            var fileUrlTmp = file.split('/');
            //removes the folder 'home'
            if (fileUrlTmp[0] === 'home') {
                fileUrlTmp.shift();
            }
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

var makeIndex = function (files, metalsmith, done) {
    var folders = [];
    var filesWithLang = [];
    var levels = {};
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
    for (var i = 0; i < folders.length; i++) {
        var folderPath = folders[i];
        var folderName;
        var location;
        var toIndex = '';
        var templateIndexName = '';
        var imagePath = '';
        var thumbnailPath = '';
        var heroVideoPath = '';
        var heroImagePath = '';
        var fullVideoPath = '';
        var pageTitle = '';
        var intro = '';
        var toToc = [];
        for (var j = 0; j < filesWithLang.length; j++) {
            var fileWithLang = filesWithLang[j];
            if (fileWithLang.pathLang === folderPath) {
                //add the folder name where index is
                folderName = (function () {
                    var ee = folderPath.split("/");
                    var ii = ee.slice(1, -1);
                    return ii[ii.length - 1] || '';
                })();
                //add the location for breadcrumb
                location = (function () {
                    var ee = folderPath.split("/");
                    var lang = ee.pop();
                    var ff = ee.slice(1);
                    var buffer = [];
                    var link = '/' + lang;
                    for (var i = 0; i < ff.length; i++) {
                        link += '/' + ff[i];
                        buffer.push({name: ff[i], link: link});
                    }
                    return buffer;
                })();
                //add a layout to the index file
                if (fileWithLang.indexTemplate) {
                    templateIndexName = fileWithLang.indexTemplate;
                }
                //add an image path to the index file
                if (fileWithLang.image) {
                    imagePath = fileWithLang.image;
                }
                //add a thumbnail path to the index file
                if (fileWithLang.thumbnail) {
                    thumbnailPath = fileWithLang.thumbnail;
                }
                //add a hero video path to the index file
                if (fileWithLang.heroVideo) {
                    heroVideoPath = fileWithLang.heroVideo;
                }
                //add a hero image path to the index file
                if (fileWithLang.heroImage) {
                    heroImagePath = fileWithLang.heroImage;
                }
                //add a full video path to the index file
                if (fileWithLang.fullVideo) {
                    fullVideoPath = fileWithLang.fullVideo;
                }
                //add a title to the index file
                if (fileWithLang.pageTitle) {
                    pageTitle = fileWithLang.pageTitle;
                }
                //add an intro text to the index file
                if (fileWithLang.intro) {
                    intro = fileWithLang.intro;
                }
                toIndex += fileWithLang.contents.toString();
                toToc.push(fileWithLang.title);
            }
        }
        files[folderPath + '/index.html'] = {
            layout: templateIndexName,
            image: imagePath,
            thumbnail: thumbnailPath,
            heroVideo: heroVideoPath,
            heroImage: heroImagePath,
            fullVideo: fullVideoPath,
            pageTitle: pageTitle,
            intro: intro,
            folder: folderName,
            location: location,
            contents: new Buffer(toIndex),
            toc: toToc
        };
        levels[i] = {
            path: folderPath,
            data: {
                name: (function () {
                    var ee = folderPath.split("/");
                    var ii = ee.slice(1, -1);
                    return ii[ii.length - 1] || '';
                })(),
                thumbnail: thumbnailPath,
                heroVideo: heroVideoPath,
                heroImage: heroImagePath,
                fullVideo: fullVideoPath,
                intro: intro
            }
        };
    }
    // delete partial files
    for (var file in files) {
        if (path.extname(file) === ".html") {
            if (path.basename(file) !== "index.html") {
                delete files[file];
            }
        }
    }
    //add children data into parent
    for (var file in files) {
        var langArray = ['/cn', '/de', '/us'];
        for (var l = 0; l < langArray.length; l++) {
            //divide files by lang
            if (file.match(langArray[l])) {
                var fileLength = path.dirname(file).split('/').length;
                var levelMatch = path.dirname(file).replace(langArray[l],"");
                var subLevel = [];
                for (var obj in levels) {
                    var levelsPath = levels[obj].path;
                    if (levelsPath.match(langArray[l])) {
                        var levelLength = levelsPath.split('/').length;
                        if (fileLength + 1 === levelLength && levelsPath.match(levelMatch)) {
                            subLevel.push(levels[obj].data);
                        }
                    }
                }
                files[file].subLevel = subLevel;
            }
        }
    }
    done();
};

Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/layouts/partials/header.html').toString());
Handlebars.registerPartial('header-nav', fs.readFileSync(__dirname + '/layouts/partials/header-nav.html').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/layouts/partials/footer.html').toString());
Handlebars.registerPartial('listpagebreadcrumb', fs.readFileSync(__dirname + '/layouts/partials/listpagebreadcrumb.html').toString());

// helper to slugify strings
Handlebars.registerHelper('slug', function (content) {
    var spacesToDashes = content.split(' ').join('-').toLowerCase();
    var removeChars = spacesToDashes.replace(/[^a-zA-Z0-9\- ]/g, "");
    return removeChars;
});

// helper to lower case
Handlebars.registerHelper('lower', function (content) {
    if (content && typeof content === 'string') {
        return content.toLowerCase();
    } else {
        return content.toString().toLowerCase();
    }
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
    .use(markdown())
    .use(layouts({
        engine: 'handlebars'
    }))
    .use(makeIndex)
    .use(layouts({
        engine: 'handlebars'
    }))
    .use(makeLangFolder)
    .use(sass({
        file: "scss/main.scss",
        outputDir: './assets/css',
        outputStyle: "compressed"
    }))
    .destination('./build')
    .build(function (err) {
        if (err) console.log(err)
    });