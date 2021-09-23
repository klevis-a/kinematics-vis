const gulp = require('gulp');
const unzip = require('gulp-unzip');
const download = require('gulp-download');

const data_dir = './data'
const healthy_url = 'https://shouldervis.chpc.utah.edu/kinevis/healthy.zip';

function fetch_data() {
    return download(healthy_url).pipe(unzip()).pipe(gulp.dest('./data/healthy'))
}

exports.fetch_data = fetch_data
