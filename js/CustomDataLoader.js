'use strict';

import {Trajectory} from "./Csv_Processor.js";
import {promiseLoadSTL} from "./MiscThreeHelpers.js";
import {angularVelocity} from "./RotDecompositions.js";
import {Matrix3, Matrix4, Quaternion} from "three";
import Papa from 'papaparse';

function loadCsv(url, hasHeader=false) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {download: !(url instanceof File), dynamicTyping: true, skipEmptyLines: true, header: hasHeader,
            complete: results => {resolve(results)}});
    });
}

export class CustomDataLoader {
    constructor() {
        this.trajectories = new Map();
        this.angularVelocities = new Map();
        this.humerusGeometry = null;
        this.isLoaded = false;
        this.framePeriod = 10; // milliseconds
    }

    loadCustomData() {
        try {
            // Load the 4 trajectories
            const trajectoryPromises = [];
            for (let i = 1; i <= 4; i++) {
                const trialName = `Trial${i}`;
                const url = `./healthy/custom/${trialName}.csv`;
                trajectoryPromises.push(this.loadTrajectory(trialName, url));
            }

            // Wait for all data to load
            Promise.all(trajectoryPromises).then(() => {
                // Calculate angular velocities for all trajectories
                this.calculateAngularVelocities();

                this.isLoaded = true;
                console.log('Custom data loaded successfully');
                return true;
            });

            return true;
        } catch (error) {
            console.error('Error loading custom data:', error);
            this.isLoaded = false;
            return false;
        }
    }

    async loadTrajectory(trialName, url) {
        try {
            const csvResult = await loadCsv(url);
            const trajectory = csvResult.data.map(row => new Quaternion(row[0], row[1], row[2], row[3]).normalize());
            this.trajectories.set(trialName, trajectory);
            console.log(`Loaded trajectory: ${trialName}`);
        } catch (error) {
            console.error(`Error loading trajectory ${trialName}:`, error);
            throw error;
        }
    }

    calculateAngularVelocities() {
        console.log('Calculating angular velocities...');
        for (const [trialName, trajectory] of this.trajectories) {
            console.log('Calculating angular velocities...');
            // Convert quaternions to Matrix3 array
            const rotationMatrices = trajectory.map(quat => {
                const mat3 = new Matrix3();
                mat3.setFromMatrix4(new Matrix4().makeRotationFromQuaternion(quat));
                return mat3;
            });

            // Calculate angular velocity using the existing function
            const dt = 1 / 100;
            const angVel = angularVelocity(rotationMatrices, dt);
            this.angularVelocities.set(trialName, angVel);
        }
    }

    getTrajectory(trialName) {
        return this.trajectories.get(trialName);
    }

    getTrajectoryNames() {
        return Array.from(this.trajectories.keys());
    }

    getHumerusGeometry() {
        return this.humerusGeometry;
    }

    getNumFrames(trialName) {
        const trajectory = this.trajectories.get(trialName);
        return trajectory ? trajectory.length : 0;
    }

    // Helper method to get humerus quaternion for a specific trial and frame
    getHumerusQuat(trialName, frameNum) {
        const trajectory = this.trajectories.get(trialName);
        if (!trajectory || frameNum >= trajectory.length) {
            return null;
        }
        return trajectory[frameNum];
    }

    // Helper method to get humerus position for a specific trial and frame
    getHumerusPos(trialName, frameNum) {
        const trajectory = this.trajectories.get(trialName);
        if (!trajectory || frameNum >= trajectory.humerus_pos.length) {
            return null;
        }
        return trajectory.humerus_pos[frameNum];
    }

    // Get angular velocity for a specific trial and frame
    getAngularVelocity(trialName, frameNum) {
        const angVel = this.angularVelocities.get(trialName);
        if (!angVel || frameNum >= angVel.length) {
            return null;
        }
        return angVel[frameNum];
    }

    // Get all angular velocities for a trial
    getAllAngularVelocities(trialName) {
        return this.angularVelocities.get(trialName);
    }
}