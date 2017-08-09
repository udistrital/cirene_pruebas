// Karma configuration
// Generated on Mon Jul 31 2017 18:05:51 GMT-0500 (-05)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    // phantomjs error ! https://github.com/ariya/phantomjs/issues/14054
    files: [
      './node_modules/phantomjs-polyfill-find/find-polyfill.js',
      'dist/app/lib/jquery/dist/jquery.js',
      'dist/app/lib/materialize/dist/js/materialize.js',
      'dist/app/lib/sidebar-v2/js/jquery-sidebar.js',
      'dist/app/lib/openlayers/js/ol.js',
      'dist/app/lib/jsts/jsts.min.js',
      'dist/app/lib/chart.js/js/Chart.bundle.js',
      'dist/app/js/createMap.js',
      'dist/app/js/mapTools.js',
      'dist/app/js/queries.js',
      'dist/app/js/generalReport.js',
      'dist/app/js/reports.js',
      'dist/app/js/init.js',
      'test/createMap_spec.js',
      'test/generalReport_spec.js',
      'test/mapTools_spec.js'
    ],


    // list of files to exclude
    exclude: [
      '**/*.swp'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Firefox', 'Chrome', 'PhantomJS'],
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
