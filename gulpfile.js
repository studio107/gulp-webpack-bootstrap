var version = require('./package.json').version,
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    autoprefixer = require('gulp-autoprefixer'),
    flatten = require('gulp-flatten'),
    gulpif = require('gulp-if'),
    csso = require('gulp-csso'),
    del = require('del'),
    sass = require('gulp-sass'),
    livereload = require('gulp-livereload'),
    sourcemaps = require('gulp-sourcemaps'),
    watch = require('gulp-watch');

var isWatch = true;

var settings = {
    scsso: {
        comments: false,
        restructure: false
    },
    sass: {
        includePaths: [
            './bower_components/mindy-sass'
        ]
    },
    paths: {
        images: './src/images/**/*{.jpg,.png}',
        fonts: './src/fonts/**/*{.eot,.otf,.woff,.woff2,.ttf,.svg}',
        css: [
            './src/scss/**/*.scss',
            './src/fonts/**/*.css'
        ]
    },
    dst: {
        css: './dist/' + version + '/css',
        images: './dist/' + version + '/images',
        fonts: './dist/' + version + '/fonts'
    }
};

gulp.task('fonts', function () {
    gulp.src(settings.paths.fonts)
        .pipe(flatten())
        .pipe(gulp.dest(settings.dst.fonts));
});

gulp.task('images', function () {
    gulp.src(settings.paths.images)
        .pipe(gulp.dest(settings.dst.images));
});

gulp.task('css', function () {
    return gulp.src(settings.paths.css)
        .pipe(sass(settings.sass).on('error', sass.logError))
        .pipe(gulpif(settings.DEBUG, sourcemaps.init()))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concat('bundle.css'))
        .pipe(csso(settings.scsso))
        .pipe(gulpif(settings.DEBUG, sourcemaps.write('.')))
        .pipe(gulp.dest(settings.dst.css))
        .pipe(gulpif(isWatch, livereload()));
});

gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(settings.paths.css, ['css']);
});

gulp.task('clean', function () {
    return del('dist/' + version);
});

gulp.task('default', ['clean'], function () {
    return gulp.start('css', 'images', 'fonts');
});