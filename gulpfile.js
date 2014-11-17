// Gulp.js configuration

// include gulp and plugins
var
  gulp = require('gulp'),
  preprocess = require('gulp-preprocess'),
  frep = require('gulp-frep'),
  newer = require('gulp-newer'),
  concat = require('gulp-concat'),
  htmlclean = require('gulp-htmlclean'),
  imagemin = require('gulp-imagemin'),
  imacss = require('gulp-imacss'),
  sass = require('gulp-sass'),
  pleeease = require('gulp-pleeease'),
  jshint = require('gulp-jshint'),
  deporder = require('gulp-deporder'),
  stripdebug = require('gulp-strip-debug'),
  uglify = require('gulp-uglify'),
  size = require('gulp-size'),
  del = require('del'),
  browsersync = require('browser-sync'),
  reload = browsersync.reload,
  pkg = require('./package.json');

// file locations
var
  buildType = (process.env.NODE_ENV || 'development').toLowerCase(),

  // do not use absolute ./paths - watch fails to detect new and deleted files
  source = 'source/',
  dest = 'build/',

  html = {
    in: source + '*.html',
    watch: source + '**/*.html',
    out: dest,
    context: {
      NODE_ENV: buildType,
      author: pkg.author,
      version: pkg.version
    }
  },

  images = {
    in: source + 'images/*.*',
    out: dest + 'images/'
  },

  imguri = {
    in: source + 'images/inline/*',
    out: source + 'scss/images/',
    filename: '_datauri.scss',
    frep: [
      {
        pattern: /\.imacss\.imacss\-/ig,
        replacement: '%imageuri-'
      }
    ]
  },

  css = {
    in: source + 'scss/main.scss',
    watch: [source + 'scss/**/*', '!' + imguri.out + imguri.filename],
    out: dest + 'css/',
    sassOpts: {
      imagePath: '../images',
      outputStyle: 'nested',
      precision: 3,
      errLogToConsole: true
    },
    pleeeaseOpts: {
      autoprefixer: { browsers: ['last 2 versions', '> 2%']},
      rem: ['16px'],
      pseudoElements: true,
      mqpacker: true,
      minifier: (buildType != 'development')
    }
  },

  js = {
    in: source + 'js/**/*',
    out: dest + 'js/',
    filename: 'main.js'
  },

  syncopts = {
    server: {
      baseDir: dest,
      index: 'index.html'
    },
    ghostMode: {
      clicks: true,
      location: true,
      forms: true,
      scroll: true
    },
    open: false,
    notify: true
  }
;

// show build type
console.log('Build type: ' + buildType);

// clean the build folder
gulp.task('clean', function() {
  del([
    dest + '*'
  ]);
});

// build HTML files
gulp.task('html', function() {
  if (buildType == 'development') {
    return gulp.src(html.in)
      .pipe(preprocess({ context: html.context }))
      .pipe(gulp.dest(html.out));
  }
  else {
    return gulp.src(html.in)
      .pipe(preprocess({ context: html.context }))
      .pipe(size({ title:'HTML in' }))
      .pipe(htmlclean())
      .pipe(size({ title:'HTML out' }))
      .pipe(gulp.dest(html.out));
  }
});

// optimize images
gulp.task('images', function() {
  return gulp.src(images.in)
    .pipe(newer(images.out))
    .pipe(imagemin())
    .pipe(gulp.dest(images.out));
});

// convert inline images to data URIs in a SCSS file
gulp.task('imguri', function() {
  return gulp.src(imguri.in)
    .pipe(imagemin())
    .pipe(imacss(imguri.filename))
    .pipe(frep(imguri.frep))
    .pipe(gulp.dest(imguri.out));
});

// compile Sass
gulp.task('sass', ['imguri'], function() {
  return gulp.src(css.in)
    .pipe(sass(css.sassOpts))
    .pipe(pleeease(css.pleeeaseOpts))
    .pipe(size({title:'CSS'}))
    .pipe(gulp.dest(css.out))
    .pipe(reload({ stream: true }));
});

// javascript
gulp.task('js', function() {
  if (buildType == 'development') {
    return gulp.src(js.in)
      .pipe(newer(js.out))
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(jshint.reporter('fail'))
      .pipe(gulp.dest(js.out));
  }
  else {
    del([
      dest + 'js/*'
    ]);
    return gulp.src(js.in)
      .pipe(size({ title:'JS in' }))
      .pipe(deporder())
      .pipe(concat(js.filename))
      .pipe(stripdebug())
      .pipe(uglify())
      .pipe(size({ title:'JS out' }))
      .pipe(gulp.dest(js.out));
  }
});

// browser sync
gulp.task('browsersync', function() {
  browsersync(syncopts);
});

// default task
gulp.task('default', ['html', 'images', 'sass', 'js', 'browsersync'], function() {

  // html changes
  gulp.watch(html.watch, ['html', browsersync.reload]);

  // image changes
  gulp.watch(images.in, ['images']);

  // sass and inline image changes
  gulp.watch([css.watch, imguri.in], ['sass']);

  // javascript changes
  gulp.watch(js.in, ['js', browsersync.reload]);

});
