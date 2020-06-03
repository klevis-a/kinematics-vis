import * as THREE from "./vendor/three.js/build/three.module.js";

export class LandmarksInfo {
    static HUMERUS_COLS = [3, 6];
    static SCAPULA_COLS = [6, 9];

    static HUMERUS_HHC = {row: 12, col: LandmarksInfo.HUMERUS_COLS};
    static HUMERUS_LE = {row: 13, col: LandmarksInfo.HUMERUS_COLS};
    static HUMERUS_ME = {row: 14, col: LandmarksInfo.HUMERUS_COLS};

    static SCAPULA_GC = {row: 12, col: LandmarksInfo.SCAPULA_COLS};
    static SCAPULA_IA = {row: 13, col: LandmarksInfo.SCAPULA_COLS};
    static SCAPULA_TS = {row: 14, col: LandmarksInfo.SCAPULA_COLS};
    static SCAPULA_PLA = {row: 15, col: LandmarksInfo.SCAPULA_COLS};
    static SCAPULA_AC = {row: 16, col: LandmarksInfo.SCAPULA_COLS};

    constructor(landmarksData) {
        this.LandmarksData = landmarksData;
        this.humerus = {};
        this.scapula = {};

        this.humerus.hhc = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.HUMERUS_HHC.row].slice(...LandmarksInfo.HUMERUS_HHC.col));
        this.humerus.le = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.HUMERUS_LE.row].slice(...LandmarksInfo.HUMERUS_LE.col));
        this.humerus.me = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.HUMERUS_ME.row].slice(...LandmarksInfo.HUMERUS_ME.col));

        this.scapula.gc = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.SCAPULA_GC.row].slice(...LandmarksInfo.SCAPULA_GC.col));
        this.scapula.ia = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.SCAPULA_IA.row].slice(...LandmarksInfo.SCAPULA_IA.col));
        this.scapula.ts = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.SCAPULA_TS.row].slice(...LandmarksInfo.SCAPULA_TS.col));
        this.scapula.pla = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.SCAPULA_PLA.row].slice(...LandmarksInfo.SCAPULA_PLA.col));
        this.scapula.ac = new THREE.Vector3(...this.LandmarksData[LandmarksInfo.SCAPULA_AC.row].slice(...LandmarksInfo.SCAPULA_AC.col));
    }
}

export class StaticSTAInfo {
    static UP = [0, 3];

    constructor(csvResults) {
        this.StaticData = csvResults.data[1];
        this.Markers = new Map();
        processMarkerData(this.Markers, csvResults.data[0], 3);
    }

    up() {
        return this.StaticData.slice(...StaticSTAInfo.UP);
    }

    upVector() {
        return new THREE.Vector3(...this.up());
    }

    markerPos(markerName) {
        return this.StaticData.slice(...this.Markers.get(markerName));
    }

    markerPosVector(markerName) {
        return new THREE.Vector3(...this.markerPos(markerName));
    }
}

export class TimeSeriesSTAInfo {
    static get FRAME_PERIOD() {
        return 10;
    }

    static get TORSO_POS() {
        return [0, 3];
    }

    static get TORSO_ORIENT() {
        return [3, 7];
    }

    static get SCAP_POS() {
        return [7, 10];
    }

    static get SCAP_ORIENT() {
        return [10, 14];
    }
    static get HUM_POS() {
        return [14, 17];
    }
    static get HUM_ORIENT() {
        return [17, 21];
    }

    constructor(csvResults) {
        this.TimeSeries = csvResults.data.slice(1);
        this.NumFrames = this.TimeSeries.length;
        this.Markers = new Map();
        processMarkerData(this.Markers, csvResults.data[0], 14);
    }

    markerPos(markerName, frameNum) {
        return this.TimeSeries[frameNum].slice(...this.Markers.get(markerName));
    }

    torsoPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...TimeSeriesSTAInfo.TORSO_POS);
    }

    torsoOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...TimeSeriesSTAInfo.TORSO_ORIENT);
    }

    scapPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...TimeSeriesSTAInfo.SCAP_POS);
    }

    scapOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...TimeSeriesSTAInfo.SCAP_ORIENT);
    }

    humPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...TimeSeriesSTAInfo.HUM_POS);
    }

    humOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...TimeSeriesSTAInfo.HUM_ORIENT);
    }

    markerPosVector(markerName, frameNum) {
        const markerPos = this.markerPos(markerName, frameNum);
        const markerPosNoNaN = markerPos.filter(x => !isNaN(x));
        if (markerPosNoNaN.length == markerPos.length) {
            return new THREE.Vector3(...markerPos);
        }
        else {
            return null;
        }
    }

    torsoPosVector(frameNum) {
        return new THREE.Vector3(...this.torsoPos(frameNum));
    }

    torsoOrientQuat(frameNum) {
        return new THREE.Quaternion(...this.torsoOrient(frameNum));
    }

    scapPosVector(frameNum) {
        return new THREE.Vector3(...this.scapPos(frameNum));
    }

    scapOrientQuat(frameNum) {
        return new THREE.Quaternion(...this.scapOrient(frameNum));
    }

    humPosVector(frameNum) {
        return new THREE.Vector3(...this.humPos(frameNum));
    }

    humOrientQuat(frameNum) {
        return new THREE.Quaternion(...this.humOrient(frameNum));
    }
}

function processMarkerData(map, fields, startIdx) {
    const markerFields = fields.slice(startIdx);

    markerFields.forEach((item, index) => {
        const [currentMarker, currentDim] = item.split('_');
        if (currentDim === 'X') map.set(currentMarker, [startIdx+index]);
        if (currentDim === 'Z') map.get(currentMarker).push(startIdx+index+1);
    });
}