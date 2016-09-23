'use strict';

const gulp = require('gulp');
const gulplog = require('gulplog');
const gulpUtils = require('gulp-util');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');

const del = require('del');

/* CONFIGS */
const pathConfig = {
	library: {
		pathToDist: 'dist',
		pathToLib: 'lib'
	}
};

const tasksConfig = {
	library: {
		clean: 'lib:clean',
		build: 'lib:build',
		main: 'lib:main'
	}
};

/* LIBRARY TASKS */

gulp.task(tasksConfig.library.clean, () => del(pathConfig.library.pathToDist));

gulp.task(tasksConfig.library.build, () => {
	return gulp.src(`${pathConfig.library.pathToLib}/*.js`)
		.pipe(plumber({
			errorHandler: notify.onError(err => {
				gulpUtils.log(`[${tasksConfig.library.build}]`, err.toString({ colors: true }));
				return ({
					title: `${tasksConfig.library.build}`,
					message: err.message
				});
			})
		}))
		.pipe(babel({
			presets: [
				'es2015',
				'react'
			],
			plugins: [
				'transform-class-properties',
				'transform-es2015-destructuring',
				'transform-object-rest-spread'
			]
		}))
		.pipe(gulp.dest(pathConfig.library.pathToDist));
});

// gulp.task(tasksConfig.library.main, gulp.series(
// 	tasksConfig.library.clean,
// 	// tasksConfig.library.build,
// ));
