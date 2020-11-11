import * as THREE from "./vendor/three.js/build/three.module.js";

export class LandmarksInfo {
    static HUMERUS_COLS = [1, 4];

    static HUMERUS_HHC = {row: 1, col: LandmarksInfo.HUMERUS_COLS};
    static HUMERUS_LE = {row: 2, col: LandmarksInfo.HUMERUS_COLS};
    static HUMERUS_ME = {row: 3, col: LandmarksInfo.HUMERUS_COLS};

    constructor(landmarksData) {
        this.LandmarksData = landmarksData;
        this.hhc = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.HUMERUS_HHC.row].slice(...LandmarksInfo.HUMERUS_HHC.col));
        this.le = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.HUMERUS_LE.row].slice(...LandmarksInfo.HUMERUS_LE.col));
        this.me = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.HUMERUS_ME.row].slice(...LandmarksInfo.HUMERUS_ME.col));
    }
}

export class HumerusTrajectory {
    static get FRAME_PERIOD() {
        return 0.01;
    }

    static get HUM_POS() {
        return [0, 3];
    }
    static get HUM_ORIENT() {
        return [3, 7];
    }

    constructor(trajData) {
        this.TimeSeries = trajData.slice(1);
        this.NumFrames = this.TimeSeries.length;
    }

    humPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...HumerusTrajectory.HUM_POS);
    }

    humOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...HumerusTrajectory.HUM_ORIENT);
    }

    humPosVector(frameNum) {
        return new THREE.Vector3(...this.humPos(frameNum));
    }

    humOrientQuat(frameNum) {
        return new THREE.Quaternion(...this.humOrient(frameNum));
    }
}
