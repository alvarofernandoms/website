var fs           = require('fs'),
    gulp         = require('gulp'),
    del          = require('del'),
    rsync        = require('gulp-rsync'),
    postcss      = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    cssnano      = require('cssnano'),
    rollup       = require('rollup-stream'),
    sourcemaps   = require('gulp-sourcemaps'),
    source       = require('vinyl-source-stream'),
    buffer       = require('vinyl-buffer'),
    resolve      = require('rollup-plugin-node-resolve'),
    commonjs     = require("rollup-plugin-commonjs"),
    babel        = require('rollup-plugin-babel'),
    replace      = require('rollup-plugin-replace'),
    vue          = require('rollup-plugin-vue');

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

gulp.task('clean', function() {
  return del(['../priv/static'], {force: true});
});

gulp.task('static', function() {
  return gulp.src('static/**')
    .on('error', swallowError)
    .pipe(rsync({
      root: 'static/',
      destination: '../priv/static/',
      silent: true
    }));
});

gulp.task('css', function () {
  var plugins = [
    require('postcss-partial-import'),
    require('postcss-advanced-variables'),
    autoprefixer({browsers: ['last 3 versions']}),
    cssnano()
  ];
  return gulp.src('css/*.css')
    .on('error', swallowError)
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('../priv/static/css/'));
});

gulp.task('js', function() {
  files = fs.readdirSync("js/")
      .filter(function(file) {
        return fs.statSync(`js/${file}`).isFile();
      });
  return files.map(function(file) {
    return rollup({
      entry: `js/${file}`,
      format: 'iife',
      sourceMap: 'inline',
      plugins: [
        resolve({
          jsnext: true,
          main: true,
          browser: true,
        }),
        vue({
          css: '../priv/static/css/components.css',
          compileTemplate: true
        }),
        replace({
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        commonjs(),
        babel({
          exclude: 'node_modules/**',
        }),
      ],
    })
      .on('error', swallowError)
      .pipe(source(file, 'js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('../priv/static/js/'));
  });

});

gulp.task('watch', function() {
  gulp.start('static', 'css', 'js');
  gulp.watch('static/**/*', ['static']);
  gulp.watch('css/**/*', ['css']);
  gulp.watch('js/**/*', ['js']);
});

gulp.task('default', ['clean', 'static'], function() {
  gulp.start('css', 'js');
});
