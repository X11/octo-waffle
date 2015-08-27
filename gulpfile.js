var gulp = require('gulp');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var sass = require('gulp-ruby-sass');
var stylish = require('jshint-stylish');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var nodemon = require('gulp-nodemon');
var del = require('del');

notify.logLevel(0);

gulp.task('clean', function(cb) {
    del(['./public/dist/**/*'], cb);
});

gulp.task('scripts', function() {
    return gulp.src('./public/javascripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(notify(function(file) {
            if (file.jshint.success) return false;

            var errors = file.jshint.results.map(function(data) {
                if (data.error)
                    return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason; // jshint ignore:line
            }).join("\n");

            return {
                title: "Gulp JSHint notification",
                message: file.relative + " (" + file.jshint.results.length + " errors)\n" + errors, // jshint ignore:line
                icon: ""
            };
        }))
        .pipe(jshint.reporter('fail')).on('error', function() {
            this.emit('end');
        })
        .pipe(sourcemaps.init())
        .pipe(uglify())
        //.pipe(concat('main.min.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./public/dist/js/'));
});

gulp.task("sass", function() {
    sass('./public/stylesheets/main.scss', {
            sourcemap: true,
            style: "compressed",
        })
        //.pipe(rename('core.min.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./public/dist/css/'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch('./public/javascript/**/*.js', ['scripts']);
    gulp.watch('./public/stylesheets/**/*.scss', ['sass']);
});

gulp.task('server', function() {
    nodemon({
        script: './app.js',
        ext: ['js'],
        watch: ["routes"],
        env: {
            'NODE_ENV': 'development',
        },
        tasks: ['lint']
    });
});

gulp.task('lint', function() {
    //todo
});

gulp.task('client', ['scripts', 'sass']);

// The default task (called when you run `gulp` from cli)
gulp.task('default', [
    'watch',
    'client',
    'server'
]);

