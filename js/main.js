import {SceneManager} from "./SceneManager.js";
import {CSVLoader} from "./CSVLoader.js";
import {promiseLoadSTL} from "./MiscThreeHelpers.js";
import * as STA_CSV_Processor from "./STA_CSV_Processor.js";

function loadPapaParse() {
    return new Promise(function (resolve, reject) {
        require(['./js/vendor/papaparse.js'], papa => resolve(papa));
    });
}

const csvLoaderInit = loadPapaParse().then(papa => new CSVLoader(papa));
const landmarkInit = csvLoaderInit.then(csvLoader => csvLoader.loadCsv('./csv/N005_CTdata_Input_for_mtwtesla.csv'));
const humerusLoader = promiseLoadSTL('./models/humerus.stl');

Promise.all([landmarkInit, humerusLoader]).then(([landmarkResults, humerusGeometry]) => {
    const landmarksInfo = new STA_CSV_Processor.LandmarksInfo(landmarkResults.data);
    const sceneManager = new SceneManager(landmarksInfo, humerusGeometry);
});
