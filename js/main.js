import {SceneManager} from "./SceneManager.js";
import {CSVLoader} from "./CSVLoader.js";
import {promiseLoadSTL} from "./MiscThreeHelpers.js";
import * as Csv_Processor from "./Csv_Processor.js";
import {get_url_param} from "./JSHelpers.js";

function loadPapaParse() {
    return new Promise(function (resolve, reject) {
        require(['./js/vendor/papaparse.js'], papa => resolve(papa));
    });
}

const csvPathParam = get_url_param('csvpath');
const csvPath =  './csv/N005_F_R_47/'.concat(csvPathParam ? csvPathParam : 'N005_CA_t01.csv');
const csvLoaderInit = loadPapaParse().then(papa => new CSVLoader(papa));
const landmarkInit = csvLoaderInit.then(csvLoader => csvLoader.loadCsv('./csv/N005_F_R_47/N005_F_R_47_humerus_landmarks.csv'));
const humerusTrajectoryInit = csvLoaderInit.then((csvLoader) => csvLoader.loadCsv(csvPath));
const humerusLoader = promiseLoadSTL('./models/humerus.stl');

Promise.all([landmarkInit, humerusTrajectoryInit, humerusLoader]).then(([landmarkResults, humerusTrajectoryResults, humerusGeometry]) => {
    const landmarksInfo = new Csv_Processor.LandmarksInfo(landmarkResults.data);
    const humerusTrajectory = new Csv_Processor.HumerusTrajectory(humerusTrajectoryResults.data);
    const sceneManager = new SceneManager(landmarksInfo, humerusTrajectory, humerusGeometry);
});

// close button
const closeBtn = document.getElementById('help-close-btn');
const helpDiv = document.getElementById('help-div');
const helpBtn = document.getElementById('help-btn');
closeBtn.onclick = () => helpDiv.style.display = "none";
helpBtn.onclick = () => helpDiv.style.display = "block";
