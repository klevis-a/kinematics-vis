import {SceneManager} from "./SceneManager.js";
import {CSVLoader} from "./CSVLoader.js";
import {promiseLoadSTL} from "./MiscThreeHelpers.js";
import * as STA_CSV_Processor from "./STA_CSV_Processor.js";
import {get_url_param} from "./JSHelpers.js";

function loadPapaParse() {
    return new Promise(function (resolve, reject) {
        require(['./js/vendor/papaparse.js'], papa => resolve(papa));
    });
}

const csvPathParam = get_url_param('csvpath');
const csvPath =  './csv/'.concat(csvPathParam ? csvPathParam : 'N002A_CA_t01.csv');
const csvLoaderInit = loadPapaParse().then(papa => new CSVLoader(papa));
const landmarkInit = csvLoaderInit.then(csvLoader => csvLoader.loadCsv('./csv/N005_CTdata_Input_for_mtwtesla.csv'));
const timeSeriesCsvInit = csvLoaderInit.then((csvLoader) => csvLoader.loadCsv(csvPath));
const humerusLoader = promiseLoadSTL('./models/humerus.stl');

Promise.all([landmarkInit, timeSeriesCsvInit, humerusLoader]).then(([landmarkResults, timeSeriesResults, humerusGeometry]) => {
    const landmarksInfo = new STA_CSV_Processor.LandmarksInfo(landmarkResults.data);
    const timeSeriesInfo = new STA_CSV_Processor.TimeSeriesSTAInfo(timeSeriesResults);
    const sceneManager = new SceneManager(landmarksInfo, timeSeriesInfo, humerusGeometry);
});
