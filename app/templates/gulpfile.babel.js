// generated on <%= date %> using <%= name %> <%= version %>
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {stream as wiredep} from 'wiredep';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var AUTOPREFIXER_CONSERVATIVE = [
  '> 0.5%', 'last 10 versions', 'Firefox ESR', 'Opera 12.1'
];

gulp.task('styles', () => {
  return gulp.src('dev/styles/imports.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.sourcemaps.write())
    .pipe($.rename('main.css'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
<% if (testFramework === 'mocha') { -%>
    mocha: true
<% } else if (testFramework === 'jasmine') { -%>
    jasmine: true
<% } -%>
  }
};

gulp.task('lint', lint('dev/scripts/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

gulp.task('validate-html', () => {
  gulp.src('.tmp/**/*.html')
    .pipe($.w3cjs());
});

gulp.task('html', ['views', 'styles'], () => {
  const assets = $.useref.assets({searchPath: ['.tmp', 'dev', '.']});

  return gulp.src(['dev/**/*.html', '.tmp/**/*.html'])
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('views', () => {
  return gulp.src('dev/**/*.jade')
    .pipe($.jade({pretty: true}))
    .pipe(gulp.dest('.tmp'))
    .pipe(reload({stream: true}));
});

gulp.task('images', () => {
  return gulp.src('dev/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('dev/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'dev/**/*.*',
    '!dev/**/*.html',
    '!dev/**/*.jade'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('copy', () => {
  return gulp.src([
    '.tmp/styles/**/*'
  ], {
    dot: true
  }).pipe(gulp.dest('dist/styles'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['views', 'styles', 'fonts', 'validate-html', 'lint'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'dev'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'dev/**/*.html',
    '.tmp/*.html',
    'dev/styles/**/*.scss',
    'dev/**/*.js',
    'dev/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('dev/**/*.jade', ['views']);
  gulp.watch('.tmp/**/*.html', ['validate-html']);
  gulp.watch(['dev/scripts/**/*.js', 'dev/modules/**/*.js', 'dev/elements/**/*.js'], ['lint']);
  gulp.watch(['dev/styles/**/*.scss', 'dev/modules/**/*.scss', 'dev/elements/**/*.scss'], ['styles']);
  gulp.watch('dev/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': 'dev/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('dev/styles/**/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('dev/styles'));

  gulp.src('dev/layouts/**/*.jade')
    .pipe(wiredep({<% if (includeBootstrap) { %>
      exclude: ['bootstrap-sass'], <% } %>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('dev'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
