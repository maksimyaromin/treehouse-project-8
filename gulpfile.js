/* Import package.json file for  
   using its variables */
const package = require("./package.json");

const      gulp = require("gulp"),
            del = require("del"),
            iff = require("gulp-if"),
        plumber = require("gulp-plumber"),
          newer = require("gulp-newer"),
         cached = require("gulp-cached"),
   autoprefixer = require("gulp-autoprefixer"),
       fancyLog = require("fancy-log"),
          print = require("gulp-print").default,
         moment = require("moment"),
   //gitRevSync = require("git-rev-sync"),
         header = require("gulp-header"),
     sourcemaps = require("gulp-sourcemaps"),
         uglify = require("gulp-uglify"),
        cssnano = require("gulp-cssnano"),
         concat = require("gulp-concat"),
           size = require("gulp-size")
           sass = require("gulp-sass"),
       imagemin = require("gulp-imagemin"),
         useref = require("gulp-useref"),
        replace = require("gulp-replace"),
    runSequence = require("run-sequence").use(gulp),
         server = require("gulp-server-livereload");

/* The common error handler for the npm-package plumber, which
     will be used in this file */
const onError = err => {
    console.log(err);
};

/* Once I adopted some ideas in building a gulp environment from Andrew Welch
   (https://nystudio107.com/blog/a-gulp-workflow-for-frontend-development-automation) 
    and since then  I also add a banner to my files, which is described in the next line of code. With a help of 
    git-rev-sync package I put  a short hash of the commit to my code from which
    a release was built. Although such kind of a banner is not suitable for projects,  
    which do not use git (partly suitable), it is not of high importance in this case because
    you will watch my code loaded from GitHub. However, since the examiner can
    do not have access to the git, I commented out the use of this module. 
    The line 75bf4ee [master] of banner represents an example of how it can be.
    In order One wold like to see and check it then One should add line 
    ${gitRevSync.short()}[${gitRevSync.branch()}] instead of it, delete comment from the line 
    //gitRevSync = require("git-rev-sync"), and make sure that the project is connected to git. 
    In is included in file only for the reason that I always include it in my gulp environment. */
const banner = 
`/**
 * @project     ${package.name}
 * @author      ${package.author}
 * @build       ${moment().format("LLLL")}
 * @release     75bf4ee [master]
 * @copyright   Copyright (c) ${moment().format("YYYY")}, ${package.author}
*/

`;

/* Task of clearing dist directory. Here an after each task starts with displaying  a message 
    to console. */
gulp.task("clean", () => {
    fancyLog("-> Clean dist & build directories");
    del("./dist/**/*");
    del("./build/**/*");
});

/* Task of building scripts. */
gulp.task("scripts", () => {
    fancyLog("-> Building JavaScripts");
    return gulp.src(package.globs.distJs)
        /* Here an after each task is wrapped in stream gulp-plumber */
        .pipe(plumber({ errorHandler: onError }))
        /* For file control gulp-newer package is used. Its action will be useful only without using
           clean tasks(for example when livereload or when calling scripts tasks directly) */
        .pipe(newer({ dest: package.paths.dist.js + "all.min.js" }))
        /* Start collecting information for building a sourcemap using the package gulp-sourcemaps */
        .pipe(sourcemaps.init({ loadMaps: true }))
        /* Merge all files into one gulp-concat */
        .pipe(concat("all.min.js"))
        /* Minify the file with the gulp-uglify package*/
        .pipe(uglify())
        /* Add a banner to the result using the package gulp-header */
        .pipe(header(banner))
        /* Record a sourcemap */
        .pipe(sourcemaps.write("./"))
        /* Display information about the size of files using the gulp-size package */
        .pipe(size({ gzip: true, showFiles: true }))
        /* Record the result by specified path */
        .pipe(gulp.dest(package.paths.dist.js));
});

/* The task of compiling SCSS in CSS */
gulp.task("compile:scss", () => {
    fancyLog("-> Compiling scss");
    return gulp.src(package.paths.src.scss + package.vars.scssName)
        .pipe(plumber({ errorHandler: onError }))
        /* Start collecting information for building a sourcemap with
             the gulp-sourcemaps package */
        .pipe(sourcemaps.init({ loadMaps: true }))
        /* Compile the input SCSS file into a stylesheet file */
        .pipe(
            sass().on("error", sass.logError)
        )
        /* With the help of the gulp-cached package , cache the results for further
            improved performance (for example, when the monitoring of file changes 
            will be used) */
        .pipe(cached("sass"))
        /* Using the autoprefixer module to add vendor prefixes
           to styles */
        .pipe(autoprefixer())
        /* Record a sourcemap */
        .pipe(sourcemaps.write("./"))
         /* Display information about the size of files using the gulp-size package */
        .pipe(size({ gzip: true, showFiles: true }))
        /* Record the result of compiling to the specified temporary path */
        .pipe(gulp.dest(package.paths.build.css));     
});

/* The task of assembling styles. Depends on the secondary task compile:scss */
gulp.task("styles", [ "compile:scss" ], () => {
    fancyLog("-> Building css");
    return gulp.src(package.globs.distCss)
        .pipe(plumber({ errorHandler: onError }))
        /* To control the files, the gulp-newer package is used. ts action will be useful only without using
           clean tasks(for example when livereload or when calling styles tasks directly) */
        .pipe(newer({ dest: package.paths.dist.css + "all.min.css" }))
        /*  Display on console list of files to be used. In this task it is not much important
            as far as there is only one file. But as i mentioned before in this file I do it as I used to
            for many years of use gulp. In any case, it's useful to know. To display
           a gulp-print package is used*/
        .pipe(print())
        /* Start collecting information for building a sourcemap with
             the gulp-sourcemaps package */
        .pipe(sourcemaps.init({ loadMaps: true }))
        /* Merge all files into one gulp-concat */
        .pipe(concat("all.min.css"))
        /* Minify and optimize the output file using the package gulp-cssnano */
        .pipe(cssnano({
            discardComments: {
                removeAll: true
            },
            discardDuplicates: true,
            discardEmpty: true,
            minifyFontValues: true,
            minifySelectors: true
        }))
        /* Add a banner to the result using the package gulp-header */
        .pipe(header(banner))
        /* Record a sourcemap */
        .pipe(sourcemaps.write("./"))
        /* Display information about the size of files using the gulp-size package */
        .pipe(size({ gzip: true, showFiles: true }))
        /* Record the result by specified path */
        .pipe(gulp.dest(package.paths.dist.css));
});

/* Task of  image optimization */
gulp.task("images", () => {
    fancyLog("-> Images optimizing");
    return gulp.src(package.paths.src.images + "**/*.{png,jpg}")
        .pipe(plumber({ errorHandler: onError }))
        /*  png and jpg image optimization from incoming directory  with a help of gulp-imagemin package*/
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            optimizationLevel: 7,
            svgoPlugins: [ { removeViewBox: false } ],
            verbose: true,
            use: []
        }))
         /* Record the result by specified path */
        .pipe(gulp.dest(package.paths.dist.images));
});

/* Task of icon copying */
gulp.task("icons", () => {
    fancyLog("-> Icons copying");
    return gulp.src(package.globs.distIcons)
        .pipe(plumber({ errorHandler: onError }))
        /* Display to the console all the files that will be copied. */
        .pipe(print())
        .pipe(gulp.dest(package.paths.dist.icons));
});

/* Task of HTML Template compilation*/
gulp.task("template", () => {
    fancyLog("-> Building template");
    return gulp.src(package.paths.src.template)
        .pipe(plumber({ errorHandler: onError }))
        /*Replace links to pictures using the gulp-replace package. In a real project, you will probably do it in a different way.
            For example, it would not occur to you  to violate the specified in the template structure in the folder with the collected files. Or
            you will not use not pure HTML template and replace links with any of many packages */
        .pipe(replace(/images\//g, `content/images/`))
        /* Replace links to some resource files (styles, scripts) using the  gulp-useref package*/
        .pipe(useref())
        .pipe(gulp.dest(package.paths.dist.template));
});

/* The main task for building a front-end */
gulp.task("build", (done) => {
    /* When you run this task, the dist and build directories will be cleaned first. Then, using the run-sequence package
         all other tasks which are necessary for building a site will be launched */
    runSequence("clean", "images", "icons", "styles", "scripts", "template", done);
});

/* Default task. Builds the project and runs the local web server. For this kind of tasks I usually use 
     gulp-server-livereload. */
gulp.task("default", [ "build" ], () => {
    /* The server will start on the 9000 port. The browser window will be opened automatically. */
    gulp.src("./dist").pipe(server({ port: 9000, open: true, livereload: true }));

    /* Monitoring changes in files SCSS and JS */
    gulp.watch([ 
        package.paths.src.scss + "**/*.scss", 
        package.paths.src.scss + "**/*.sass" 
    ], [ "styles" ]);
    gulp.watch([ 
        package.paths.src.js + "**/*.js" 
    ], [ "scripts" ]);
});