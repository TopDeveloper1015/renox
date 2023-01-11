// Dependencies
const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const terser = require('gulp-terser');
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');
const rename = require('gulp-rename');

Object.assign(sass, { compiler: require('sass') });

const cleanCSS = require('gulp-clean-css');

let SRC_FOLDER = 'src';

// Clear dist folder for new build
gulp.task('clean', () => {
    return del('dist/**', { force: true });
});

// Gulp task to copy fonts files to output directory
gulp.task('fonts', () => {
    return gulp.src(SRC_FOLDER + '/assets/fonts/**')
        .pipe(gulp.dest('dist/assets/fonts'));
});

// Gulp task to copy css files to output directory
gulp.task('css', () => {
    return gulp.src([
        SRC_FOLDER + '/assets/css/**/*.css'
    ], { base: SRC_FOLDER })
        .pipe(gulp.dest('dist'));
});

// Gulp task to copy images files to output directory
gulp.task('images', () => {
    return gulp.src(SRC_FOLDER + '/assets/images/**')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/assets/images'));
});

/** @param {NodeJS.ReadWriteStream} stream */
const fixHTML = (stream) => {
    return stream
        .pipe(replace(/assets\/scss\/(.*?)\.scss/g, 'assets/css/$1.min.css'));
};

// Gulp task to copy HTML files to output directory
gulp.task('html', () => {
    return fixHTML(gulp.src([
        SRC_FOLDER + '/**/*.html',
    ], { base: SRC_FOLDER }))
        .pipe(gulp.dest('dist'));
});

// Gulp task to concatenate our css files
gulp.task('sass', () => {
    return gulp.src(SRC_FOLDER + '/assets/scss/theme/*.scss')
        .pipe(sass())
        .pipe(cleanCSS({
            level: 0,
            format: 'beautify'
        }))
        .pipe(gulp.dest('dist/assets/css/theme'))
        .pipe(cleanCSS())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('dist/assets/css/theme'));
});

// Gulp task to concatenate our js files
gulp.task('js', () => {
    return gulp.src([
            SRC_FOLDER + '/assets/js/*.js',
        ])
        .pipe(terser())
        .pipe(gulp.dest('dist/assets/js'));
});

// Gulp task to copy other files
gulp.task('other', () => {
    return gulp.src([
            SRC_FOLDER + '/**',
            '!' + SRC_FOLDER + '/assets/**',
            '!' + SRC_FOLDER + '/**/*.html',
            '!' + SRC_FOLDER + '/debug*.css',
            '!' + SRC_FOLDER + '/debug*.css.map',
    ], { base: SRC_FOLDER, nodir: true })
        .pipe(gulp.dest('dist'));
});

// Gulp build task
gulp.task('build', gulp.series('clean', gulp.parallel('css', 'fonts', 'images', 'html', 'sass', 'js', 'other')));
