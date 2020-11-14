'use strict';

import {Vector3, Quaternion} from "./vendor/three.js/build/three.module.js";

export class HumerusLandmarks {
    static COLS = [1, 4];

    constructor(landmarksData) {
        this.LandmarksData = landmarksData;
        this.hhc = new Vector3(...this.LandmarksData[1].slice(...HumerusLandmarks.COLS));
        this.le = new Vector3(...this.LandmarksData[2].slice(...HumerusLandmarks.COLS));
        this.me = new Vector3(...this.LandmarksData[3].slice(...HumerusLandmarks.COLS));
    }
}

export class ScapulaLandmarks {
    static COLS = [1, 4];

    constructor(landmarksData) {
        this.LandmarksData = landmarksData;
        this.gc = new Vector3(...this.LandmarksData[1].slice(...ScapulaLandmarks.COLS));
        this.ia = new Vector3(...this.LandmarksData[2].slice(...ScapulaLandmarks.COLS));
        this.ts = new Vector3(...this.LandmarksData[3].slice(...ScapulaLandmarks.COLS));
        this.pla = new Vector3(...this.LandmarksData[4].slice(...ScapulaLandmarks.COLS));
        this.ac = new Vector3(...this.LandmarksData[5].slice(...ScapulaLandmarks.COLS));
    }
}

export class Trajectory {
    static get FRAME_PERIOD() {
        return 0.01;
    }

    static get TORSO_POS() {
        return [0, 3];
    }
    static get TORSO_ORIENT() {
        return [3, 7];
    }

    static get SCAPULA_POS() {
        return [7, 10];
    }
    static get SCAPULA_ORIENT() {
        return [10, 14];
    }

    static get HUM_POS() {
        return [14, 17];
    }
    static get HUM_ORIENT() {
        return [17, 21];
    }

    constructor(trajData) {
        this.TimeSeries = trajData.slice(1);
        this.NumFrames = this.TimeSeries.length;
    }

    // torso
    torsoPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...Trajectory.TORSO_POS);
    }

    torsoOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...Trajectory.TORSO_ORIENT);
    }

    torsoPosVector(frameNum) {
        return new Vector3(...this.torsoPos(frameNum));
    }

    torsoOrientQuat(frameNum) {
        return new Quaternion(...this.torsoOrient(frameNum));
    }

    // scapula
    scapPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...Trajectory.SCAPULA_POS);
    }

    scapOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...Trajectory.SCAPULA_ORIENT);
    }

    scapPosVector(frameNum) {
        return new Vector3(...this.scapPos(frameNum));
    }

    scapOrientQuat(frameNum) {
        return new Quaternion(...this.scapOrient(frameNum));
    }

    // humerus
    humPos(frameNum) {
        return this.TimeSeries[frameNum].slice(...Trajectory.HUM_POS);
    }

    humOrient(frameNum) {
        return this.TimeSeries[frameNum].slice(...Trajectory.HUM_ORIENT);
    }

    humPosVector(frameNum) {
        return new Vector3(...this.humPos(frameNum));
    }

    humOrientQuat(frameNum) {
        return new Quaternion(...this.humOrient(frameNum));
    }
}
