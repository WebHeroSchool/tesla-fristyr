const env = require('gulp-env');
const glob = require('glob')
const clean = require('gulp-clean');
const rename = require('gulp-rename')
const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const cssnano = require('gulp-cssnano');
const postcss = require('gulp-postcss');
const reporter = require('postcss-reporter');
const stylelint = require('stylelint')
const sourcemaps = require('gulp-sourcemaps');
const handlebars = require('gulp-compile-handlebars')
const browserSync = require('browser-sync').create();
const autoprefixer = require('autoprefixer');
const nested = require('postcss-nested');
const imagemin = require('gulp-imagemin');
const filter = require('gulp-filter');

const postcssShort = require('postcss-short');
const assets  = require('postcss-assets');
const postcssPresetEnv = require('postcss-preset-env');

const rulesStyles = require('./stylelyntrc.json');
const rulesScripts = require('./eslintrc.json');
const templateContext = require('./src/data.json');

const paths = {
    src: {
        styles:'src/styles/*.css',
        scripts: 'src/scripts/*.js',
        dir: 'src/templates'
    },
    build: {
        dir: 'build/',
        styles: 'build/styles',
        scripts: 'build/scripts'
    },
    buildNames: {
        styles: 'index.min.css',
        scripts: 'index.min.js'
    },
    templates: 'src/templates/**/*.hbs',
    lint: {
        scripts: ['**/*.js' , '!node_mpdules/**/*', '!build/**/*'],
        styles: ['**/*.css', '!node_modules/**/*', '!build/**/*']
    }

};

env({
    file: '.env',
    type: 'ini',
  });

  gulp.task('compile', () => {
    glob(paths.templates, (err, files) => {
        if (!err) {
            const options = {
                ignorePartials: true,
                batch: files.map(item => item.slice(0, item.lastIndexOf('/'))),
                helpers: {
                    capitals: str => str.toUpperCase(),
                    sum: (a, b) => a + b
                }
            };

            gulp.src(`${paths.src.dir}/index.hbs`)
                .pipe(handlebars({ templateContext }, options))
                .pipe(rename('index.html'))
                .pipe(gulp.dest(paths.build.dir));
        }
    });
});

gulp.task('clean', () => {
    gulp.src('build', {read: false})
        .pipe(clean());
});

gulp.task('js', () => {
    return gulp.src([paths.src.scripts])
        .pipe(sourcemaps.init())
            .pipe(concat(paths.buildNames.scripts))
            .pipe(babel({
                presets: ['@babel/env']
            }))
            .pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.build.scripts))
});

gulp.task('css', () => {
    const plugins = [
        autoprefixer({browsers: ['last 1 version']
    }),
        nested,
        postcssShort,
        assets({
            loadPaths: ['src/img/'],
            relativeTo: 'src/styles/'
        }),
        postcssPresetEnv,
    ];
    return gulp.src([paths.src.styles])
        .pipe(sourcemaps.init())
            .pipe(postcss(plugins))
            .pipe(concat(paths.buildNames.styles))
            .pipe(gulpif(process.env.NODE_ENV === 'production', cssnano()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.build.styles))
});

gulp.task('lint', ['eslint', 'stylelint']);

gulp.task('eslint', () => {
    gulp.src(paths.lint.scripts)
        .pipe(eslint(rulesScripts))
            .pipe(eslint.format());
});

gulp.task('stylelint', () => {
    gulp.src(paths.lint.styles)
        .pipe(postcss([
            stylelint(rulesStyles),
            reporter({
                clearReportedMessages: true,
                throwError: false
            })
        ]));
});

gulp.task('build', ['js', 'css']);


gulp.task('browser-sync',() => {
    browserSync.init({
        server: {
            baseDir: "build/"
        }
    });
        gulp.watch(paths.src.scripts, ['js-watch']);
        gulp.watch(paths.src.styles, ['css-watch']);
});

gulp.task('fonts', () => {
    gulp.src('./src/fonts/**/*')
        .pipe(filter(['*.woff', '*.woff2', '*.otf', '*.ttf']))
        .pipe(gulp.dest(`${paths.build.dir}/fonts`));
});

gulp.task('image', () => {
    gulp.src('src/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest(`${paths.build.dir}/img`));
});

gulp.task('watch', () => {
    gulp.watch(paths.handlebars, ['compile']);
    gulp.watch(paths.src.styles, ['css']);
    gulp.watch(paths.src.scripts, ['js']);
    gulp.watch('src/data.json')
        .on('change', browserSync.reload);
    gulp.watch(`${paths.buildDir}/**/*`)
        .on('change', browserSync.reload);
});

gulp.task('build', ['js', 'css', 'compile', 'fonts', 'image']);


gulp.task('prod', ['build']);
gulp.task('dev', ['build', 'browser-sync'])