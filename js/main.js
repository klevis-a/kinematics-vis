import {EulerScene} from "./EulerScene.js";
import {AnimationHelper} from "./AnimationHelper.js";

function getTimelineCtrlElements() {
    return {
        playBtn: document.getElementById('playPauseCtrl'),
        timeline: document.getElementById('timeline'),
        frameNumLbl: document.getElementById('frameNum')
    }
}

function getEulerSceneElements() {
    return {
        canvas: document.getElementById('canvas'),
        view: document.getElementById('view'),
    }
}

const numFrames = 100;
const framePeriod = 30;
const {canvas, view} = getEulerSceneElements();
const eulerScene = new EulerScene(view, canvas, numFrames);
const {playBtn, timeline, frameNumLbl} = getTimelineCtrlElements();
const animationHelper = new AnimationHelper(eulerScene, numFrames, framePeriod, playBtn, timeline, frameNumLbl);
