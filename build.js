"use strict";

var metalsmith = require('metalsmith'),
    markdown = require('metalsmith-markdown'),
    layouts = require('metalsmith-layouts'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    branch = require('metalsmith-branch'),
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
    var filesWithLang = {};
    var section = {};
    var sector = {};
    var subSector = {};
    var cn = {};
    section.cn = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    sector.cn = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    subSector.cn = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    var de = {};
    section.de = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    sector.de = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    subSector.de = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    var us = {};
    section.us = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    sector.us = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    subSector.us = {name: '', image: '', thumbnail: '', heroVideo: '', fullVideo: '', heroImage: ''};
    for (var file in files) {
        if (file.match(languages)) {
            var folderPath = path.dirname(file);
            folders.push(folderPath);
            files[file].pathLang = folderPath;
            var filePath = files[file].pathLang.split('/');
            var lang = filePath[filePath.length - 1];
            var filePathLength = files[file].pathLang.split('/').length;
            if (filePathLength === 3) {
                console.log(files[file])
                var x = files[file].pathLang.split('/');
                if (!section[lang].name) {
                    section[lang].name = x[1];
                }
                if (!section[lang].image) {
                    section[lang].image = files[file].image;
                }
                if (!section[lang].thumbnail) {
                    section[lang].thumbnail = files[file].thumbnail;
                }
                if (!section[lang].heroVideo) {
                    section[lang].heroVideo = files[file].heroVideo;
                }
                if (!section[lang].fullVideo) {
                    section[lang].fullVideo = files[file].fullVideo;
                }
                if (section[lang].heroImage) {
                    section[lang].heroImage = files[file].heroImage;
                }
            }
            console.log(section.de)
            if (filePathLength === 4) {
                sector[lang].files.push(files[file]);
            }
            if (filePathLength === 5) {
                subSector[lang].files.push(files[file]);
            }
        }
    }


    // concat the files in those paths
    for (var i = 0; i < folders.length; i++) {
        var folderPath = folders[i];
        // var section = {};
        // var sector = {};
        // var subSector = {};
        var folderUrlTmp = folderPath.split('/');
        var lang = folderUrlTmp[folderUrlTmp.length - 1];
        var filteredByLang = folders.filter(RegExp.prototype.test.bind(new RegExp(lang)));
        // console.log(filteredByLang)
        var toIndex = '';
        var templateIndexName = '';
        var thumbnailPath = '';
        var heroVideoPath = '';
        var heroImagePath = '';
        var fullVideoPath = '';
        var toToc = [];
        for (var j = 0; j < filesWithLang.length; j++) {
            var fileWithLang = filesWithLang[j];
            if (fileWithLang.pathLang == folderPath) {
                //add a layout to the index file
                if (fileWithLang.indexTemplate) {
                    templateIndexName = fileWithLang.indexTemplate;
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
                //check for main sections
                if (folderUrlTmp.length === 2) {
                    for (var f in filteredByLang) {
                        var breakFolderName = filteredByLang[f].split('/');
                        if (breakFolderName.length === 3) {
                            section = {title: breakFolderName[1]};
                            // console.log(fileWithLang)
                        }
                    }
                    section = _.uniq(section);
                }
                //check for sectors
                if (folderUrlTmp.length === 3) {
                    for (var f in filteredByLang) {
                        var breakFolderName = filteredByLang[f].split('/');
                        if (breakFolderName.length === 4) {
                            sector.push(breakFolderName[2]);
                        }
                    }
                    sector = _.uniq(sector);
                }
                //check for subsectors
                if (folderUrlTmp.length === 4) {
                    for (var f in filteredByLang) {
                        var breakFolderName = filteredByLang[f].split('/');
                        if (breakFolderName.length === 5) {
                            sector.push(breakFolderName[2]);
                            subSector.push(breakFolderName[3]);
                        }
                    }
                    sector = _.uniq(sector);
                    subSector = _.uniq(subSector);
                }
                toIndex += fileWithLang.contents.toString();
                toToc.push(fileWithLang.title);
            }
        }
        files[folderPath + '/index.html'] = {
            layout: templateIndexName,
            thumbnail: thumbnailPath,
            heroVideo: heroVideoPath,
            heroImage: heroImagePath,
            fullVideo: fullVideoPath,
            contents: new Buffer(toIndex),
            section: section,
            sector: sector,
            subSector: subSector,
            toc: toToc
        };
    }
    //delete partial files
    for (var file in files) {
        if (path.basename(file) !== "index.html") {
            delete files[file];
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

metalsmith(__dirname)
// .use(makeIndex)
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
    .destination('./build')
    .build(function (err) {
        if (err) console.log(err)
    });

// if not equals helpers
Handlebars.registerHelper('if_ne', function (a, b, opts) {
    if (a != b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

