/* Импортирование файла package.json для 
    использования переменных из него */
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

/* Общий обработчик ошибок для npm-пакета plumber, который
    будет использоваться в этом файле */
const onError = err => {
    console.log(err);
};

/* Когда-то давно я перенял некоторые идеи в построении gulp-окружения у
    Andrew Welch (https://nystudio107.com/blog/a-gulp-workflow-for-frontend-development-automation) 
    и с тех пор к своим файлам я также добавляю баннер, который
    описывается в следующей строчке кода. При помощи пакета 
    git-rev-sync я проставляю к своему коду короткий хэш комита из которого
    собирался релиз. И хотя такой баннер не подходит для проектов, не 
    использующих гит (подходит частично), в нашем случае это не важно, т. к.
    вы будете смотреть мой код слитый с гитхаба. Однако, т. к. у проверяющего может
    не быть доступа к гиту, я закомментировал использование этого модуля. 
    В баннере строка 75bf4ee [master] представлена как пример того, что может получиться.
    Если хотите проверить это в действии то вместо нее
    добавте строку ${gitRevSync.short()}[${gitRevSync.branch()}], уберите комментраий со строки 
    //gitRevSync = require("git-rev-sync"), и убедитесь что ваш проект подключен к гиту. 
    В файл все это включено просто потому, что я включаю это во все свои gulp окружения. */
const banner = 
`/**
 * @project     ${package.name}
 * @author      ${package.author}
 * @build       ${moment().format("LLLL")}
 * @release     75bf4ee [master]
 * @copyright   Copyright (c) ${moment().format("YYYY")}, ${package.author}
*/

`;

/* Задача на очистку dist директории. Здесь и далее каждая задача начинается с вывода на консоль
    сообщения. */
gulp.task("clean", () => {
    fancyLog("-> Clean dist & build directories");
    del("./dist/**/*");
    del("./build/**/*");
});

/* Задача на сборку скриптов. */
gulp.task("scripts", () => {
    fancyLog("-> Building JavaScripts");
    return gulp.src(package.globs.distJs)
        /* Здесь и далее каждая задача оборачивается в поток gulp-plumber */
        .pipe(plumber({ errorHandler: onError }))
        /* Для контроля файлов используется пакет gulp-newer. Его действие будет полезным только без использования
            задачи clean (например при livereload или вызове задачи scripts напрямую) */
        .pipe(newer({ dest: package.paths.dist.js + "all.min.js" }))
        /* Начать сбор информации для построения карты файла при помощи пакета gulp-sourcemaps */
        .pipe(sourcemaps.init({ loadMaps: true }))
        /* Объединить все файлы в один gulp-concat */
        .pipe(concat("all.min.js"))
        /* Минифицировать файл при помощи пакета gulp-uglify */
        .pipe(uglify())
        /* Добавить баннер к результату при помощи пакета gulp-header */
        .pipe(header(banner))
        /* Записать карту файла */
        .pipe(sourcemaps.write("./"))
        /* Вывести информацию о размере файлов при помощи пакета gulp-size */
        .pipe(size({ gzip: true, showFiles: true }))
        /* Записать результат по заданному пути */
        .pipe(gulp.dest(package.paths.dist.js));
});

/* Задача на компиляцию SCSS в CSS */
gulp.task("compile:scss", () => {
    fancyLog("-> Compiling scss");
    return gulp.src(package.paths.src.scss + package.vars.scssName)
        .pipe(plumber({ errorHandler: onError }))
        /* Начать сбор информации для построения карты файла при помощи 
            пакета gulp-sourcemaps */
        .pipe(sourcemaps.init({ loadMaps: true }))
        /* Скомпилировать входной SCSS файл в файл таблиц стилей */
        .pipe(
            sass().on("error", sass.logError)
        )
        /* При помощи пакета gulp-cached закэшировать результаты для дальнейшего
            улучшения производительности (например, котгда будет использовано
            наблюдение за изменениями файлов) */
        .pipe(cached("sass"))
        /* Использования модуля autoprefixer для добавления вендорных префиксов
            к стилям */
        .pipe(autoprefixer())
        /* Записать карту файла */
        .pipe(sourcemaps.write("./"))
         /* Вывести информацию о размере файлов при помощи пакета gulp-size */
        .pipe(size({ gzip: true, showFiles: true }))
        /* Записать результат компиляции по указанному временному пути */
        .pipe(gulp.dest(package.paths.build.css));     
});

/* Задача на сборку стилей. Зависит от вспомогательной задачи compile:scss */
gulp.task("styles", [ "compile:scss" ], () => {
    fancyLog("-> Building css");
    return gulp.src(package.globs.distCss)
        .pipe(plumber({ errorHandler: onError }))
        /* Для контроля файлов используется пакет gulp-newer. Его действие будет полезным только без использования
            задачи clean (например при livereload или вызове задачи styles напрямую) */
        .pipe(newer({ dest: package.paths.dist.css + "all.min.css" }))
        /* Вывести на консоль список файлов, которые будут использоваться. В данной задаче это не особенно
            важно, т. к. файл будет всего один. Но, как я писал ранее в этом файле многое так, как я привык
            делать за многолетнее использование gulp. В любом случае это полезно знать. Для вывода используется
            пакет gulp-print */
        .pipe(print())
        /* Начать сбор информации для построения карты файла при помощи 
            пакета gulp-sourcemaps */
        .pipe(sourcemaps.init({ loadMaps: true }))
        /* Объединить все файлы в один gulp-concat */
        .pipe(concat("all.min.css"))
        /* Минифицировать и оптимизировать выходной файл при помощи пакета gulp-cssnano */
        .pipe(cssnano({
            discardComments: {
                removeAll: true
            },
            discardDuplicates: true,
            discardEmpty: true,
            minifyFontValues: true,
            minifySelectors: true
        }))
        /* Добавить баннер к результату при помощи пакета gulp-header */
        .pipe(header(banner))
        /* Записать карту файла */
        .pipe(sourcemaps.write("./"))
        /* Вывести информацию о размере файлов при помощи пакета gulp-size */
        .pipe(size({ gzip: true, showFiles: true }))
        /* Записать результат по заданному пути */
        .pipe(gulp.dest(package.paths.dist.css));
});

/* Задача на оптимизацию изображений */
gulp.task("images", () => {
    fancyLog("-> Images optimizing");
    return gulp.src(package.paths.src.images + "**/*.{png,jpg}")
        .pipe(plumber({ errorHandler: onError }))
        /* Оптимизация изображений из входной папки в формате png и jpg при помощи пакета gulp-imagemin */
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            optimizationLevel: 7,
            svgoPlugins: [ { removeViewBox: false } ],
            verbose: true,
            use: []
        }))
         /* Записать результат по заданному пути */
        .pipe(gulp.dest(package.paths.dist.images));
});

/* Задача на копирование иконок */
gulp.task("icons", () => {
    fancyLog("-> Icons copying");
    return gulp.src(package.globs.distIcons)
        .pipe(plumber({ errorHandler: onError }))
        /* Вывести на консоль все файлы, которые будут скопированы. */
        .pipe(print())
        .pipe(gulp.dest(package.paths.dist.icons));
});

/* Задача для сборки HTML шаблона */
gulp.task("template", () => {
    fancyLog("-> Building template");
    return gulp.src(package.paths.src.template)
        .pipe(plumber({ errorHandler: onError }))
        /* Заменить ссылки на картинки при помощи пакета gulp-replace. В реальном проекте вы наверняка будете делать по другому.
            Например, вам в голову не придет в папке с собранными файлами нарушить заданную в шаблоне структуру. Или вы будете
            использовать не чистый HTML шаблон и заменять ссылки каким то другим пакетом, коих множество */
        .pipe(replace(/images\//g, `content/images/`))
        /* Заменить ссылки на некоторые файлы ресурсов (стили, скрипты) при помощи пакета gulp-useref */
        .pipe(useref())
        .pipe(gulp.dest(package.paths.dist.template));
});

/* Основная задача для построения фронт-энда */
gulp.task("build", (done) => {
    /* При запуске этой задачи первым делом очистятся директории dist и build. Затем, при помощи пакета run-sequence
        запустятся все остальные задачи, необходимые для построения сайта */
    runSequence("clean", "images", "icons", "styles", "scripts", "template", done);
});

/* Задача по-умолчанию. Собирает проект и запускает локальный веб-сервер. Для решения подобных задач я обычно использую 
     gulp-server-livereload. */
gulp.task("default", [ "build" ], () => {
    /* Сервер запустится на 9000 порту. Окно браузера будет открыто автоматически. */
    gulp.src("./dist").pipe(server({ port: 9000, open: true, livereload: true }));

    /* Наблюдение за изменением файлов SCSS и JS */
    gulp.watch([ 
        package.paths.src.scss + "**/*.scss", 
        package.paths.src.scss + "**/*.sass" 
    ], [ "styles" ]);
    gulp.watch([ 
        package.paths.src.js + "**/*.js" 
    ], [ "scripts" ]);
});