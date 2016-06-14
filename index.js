var metalsmith  = require('metalsmith'),
    markdown    = require('metalsmith-markdown'),
    layouts     = require('metalsmith-layouts'),
    collections = require('metalsmith-collections'),
    permalinks  = require('metalsmith-permalinks'),
    sass        = require('metalsmith-sass'),
    Handlebars  = require('handlebars'),
    fs          = require('fs'),
    path        = require('path'),
    metalsmithExpress = require('metalsmith-express');


// var makeLangFolder = function(files, metalsmith, done) {
//
//     meta = metalsmith.metadata();
//     for (var file in files) {
//         var type = files[file].type;
//         if (type == "partial" || type == "code") {
//             delete files[file];
//         }
//     }
//     done();
// };

// var parseContentForSnippet = function (files, metalsmith, done) {
//     var contents;
//     var cleancontents;
//     var snippet;
//     var snippetclean;
//
//     Object.keys(files).forEach(function (file) {
//         var type = files[file].type;
//         contents = files[file].contents.toString();
//         if (type == "partial") {
//
//             try {
//                 cleancontents = contents.replace(/\[snippet\][\s\S]*?\[\/snippet\]/i, "");
//
//                 snippet = contents.match(/\[snippet\][\s\S]*?\[\/snippet\]/i);
//
//                 if (snippet) {
//                     snippetclean = snippet[0];
//
//                     snippetclean = snippetclean.replace(/\[snippet\]/, "");
//                     snippetclean = snippetclean.replace(/\[\/snippet\]/, "");
//
//                     const buffsnippet = new Buffer(snippetclean);
//                     files[file].snippet = buffsnippet;
//
//                     const buffcontents = new Buffer(cleancontents);
//                     files[file].contents = buffcontents;
//
//                 } else {
//                     cleancontents = null;
//                     contents = null;
//                     snippet = null;
//                     snippetclean = null;
//                 }
//             } catch(err) {
//                 return err.message;
//             }
//         }
//     });
//     done();
// };

var makeLangFolder = function(files, metalsmith, done) {
    
    var re = '\/us\/';
    for (var file in files) {
        if (file.match(re)) {
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
    // .use(metalsmithExpress({
    //     "liveReload": true,
    //     "liveReloadPort": 35729,
    //     "middleware": []
    // }))
    .use(makeLangFolder)
    .use(layouts({
        engine: 'handlebars'
    }))
    .use(collections({
        makeIndex: {
            pattern: '*.md',
            sortBy: 'order'
        }
    }))
    .use(markdown())
    .use(sass({
        "files": "assets/sass/*.scss",
        "includePaths": "assets/sass",
        "outputDir": "assets/css",
        "outputStyle": "compressed"
    }))
    .destination('./build')
    .build(function (err) {
        if (err) console.log(err)
    });


