import {get_url_param} from "./JSHelpers.js";
import {HUMERUS_BASE} from "./RotationHelper.js";
import {createViewManager} from "./ShoulderVis.js";

const humerusLandmarksFile = get_url_param('hlf');
const scapulaLandmarksFile = get_url_param('slf');
const humerusStlFile = get_url_param('hsf');
const scapulaStlFile = get_url_param('ssf');
const trajectoryFile = get_url_param('tf');
const freq = get_url_param('freq');

const guiOptions = {
    humerusBase: HUMERUS_BASE.TORSO,
    showAllBones: false,
    showAngles: false,
    showArea: false,
    showTriadsArcs: true,
    showBodyPlanes: false,
    showSphere: true
};

const initialViewLayout = new Map([['view1', 'HUM_EULER_YXY'], ['view2', 'SCAP_EULER_YXZ'], ['view3', 'PREVIEW']]);

const helpDiv = document.getElementById('help-div');
const helpBtn = document.getElementById('help-btn');
const closeBtn = document.getElementById('help-close-btn');
helpBtn.addEventListener('click', () => helpDiv.style.display = 'block');
closeBtn.addEventListener('click', () => helpDiv.style.display = 'none');

let viewManager = null;
const loadingDiv = document.getElementById('loading-div');
createViewManager(humerusLandmarksFile, scapulaLandmarksFile, trajectoryFile, humerusStlFile, scapulaStlFile, freq, initialViewLayout, guiOptions, 'axialRot')
    .then(viewManager => {
        viewManager = viewManager;
        loadingDiv.style.display = 'none'
    });
