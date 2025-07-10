'use strict';

import {Vector3} from "three";
import {BaseView} from "./BaseView.js";
import {EulerDecompositionScene} from "../scene/EulerDecompositionScene.js";
import {BoneComponent} from "../scene/components/BoneComponent.js";
import {SphereComponent} from "../scene/components/SphereComponent.js";
import {ConeComponent} from "../scene/components/ConeComponent.js";
import {EulerSceneAnimationHelper} from "../EulerSceneAnimationHelper.js";
import {HUMERUS_BASE} from "../RotationHelper.js";

export class HumerusView extends BaseView {
    static DECOMPOSITION_METHODS = {
        'HUM_EULER_YXY': {
            northPole: new Vector3(0, 1, 0),
            supportsAreaVis: true,
            supportsAxialRot: true
        },
        'HUM_EULER_XZY': {
            northPole: new Vector3(1, 0, 0),
            supportsAreaVis: true,
            supportsAxialRot: true
        },
        'HUM_SVD': {
            northPole: new Vector3(0, 1, 0),
            supportsAreaVis: false,
            supportsAxialRot: true
        },
        'HUM_SHORTEST_PATH': {
            northPole: new Vector3(0, 1, 0),
            supportsAreaVis: true,
            supportsAxialRot: true
        },
        'HUM_SHORTEST_PATH_START_END': {
            northPole: new Vector3(0, 1, 0),
            supportsAreaVis: true,
            supportsAxialRot: true,
            supportsConeVis: true
        },
        'HUM_SWING_TWIST': {
            northPole: new Vector3(0, 1, 0),
            supportsAreaVis: true,
            supportsAxialRot: true
        },
        'HUM_SIMULTANEOUS': {
            northPole: new Vector3(0, 1, 0),
            supportsAreaVis: true,
            supportsAxialRot: true
        }
    };

    constructor(camera, renderer, rotationHelper, methodName, humerusGeometry, humerusLength, 
                anglesVisLayer, areaVisLayer, humerusBase, numAnimFrames = 100, framePeriod = 10) {
        super(renderer, camera);
        
        this.rotationHelper = rotationHelper;
        this.methodName = methodName;
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.anglesVisLayer = anglesVisLayer;
        this.areaVisLayer = areaVisLayer;
        this.numAnimFrames = numAnimFrames;
        this.framePeriod = framePeriod;
        this.animationHelper = null;
        this.viewManagerEventListeners = new Map();
        
        this.setHumerusBase(humerusBase);
        this.methodInfo = HumerusView.DECOMPOSITION_METHODS[this.methodName];
        
        if (!this.methodInfo) {
            throw new Error(`Unknown decomposition method: ${this.methodName}`);
        }
    }

    createScene() {
        const scene = new EulerDecompositionScene(
            this.scene_div,
            this.renderer,
            this.camera,
            this.numAnimFrames,
            10, // arcStripWidth
            150, // triadLength
            50  // markingStart
        );

        this.setupSceneComponents(scene);
        return scene;
    }

    setupSceneComponents(scene) {
        // Add bone component
        const boneComponent = new BoneComponent(this.humerusGeometry);
        scene.addComponent('bone', boneComponent);

        // Add sphere component
        const sphereComponent = new SphereComponent(100, 32, 16);
        sphereComponent.setNorthPole(this.methodInfo.northPole);
        scene.addComponent('sphere', sphereComponent);

        // Add cone component if method supports it
        if (this.methodInfo.supportsConeVis) {
            const coneComponent = new ConeComponent(this.humerusLength);
            scene.addComponent('cone', coneComponent);
        }

        // Store references for easy access
        this.boneComponent = boneComponent;
        this.sphereComponent = sphereComponent;
        this.coneComponent = this.methodInfo.supportsConeVis ? scene.getComponent('cone') : null;
    }

    async initialize() {
        await super.initialize();
        
        // Set up scene with initial data
        if (this.methodName === 'HUM_SHORTEST_PATH_START_END') {
            this.scene.startingQuat = this.humerusQuat(0);
        }
        
        // Initialize with frame 0 data
        await this.setFrame(0);
        
        // Create animation helper
        this.animationHelper = new EulerSceneAnimationHelper(
            this.ctrlDiv,
            this.scene,
            this.numAnimFrames,
            this.framePeriod
        );
    }

    async setFrame(frameNum) {
        // Update bone position for preview
        const quaternion = this.humerusQuat(frameNum);
        this.boneComponent.updateMainBoneQuaternion(quaternion);
        
        // Update scene with decomposition data
        const rotations = this.humerusRotation(this.methodName, frameNum);
        await this.scene.reset({rotations, frameNum});
        
        // Update animation helper
        if (this.animationHelper) {
            this.animationHelper.goToStep(this.scene.currentStep);
        }
    }

    async previewFrame(frameNum) {
        const quaternion = this.humerusQuat(frameNum);
        this.boneComponent.updateMainBoneQuaternion(quaternion);
    }

    initializeVisualOptions(viewManager) {
        this.showTriadsArcs(viewManager.guiOptions.showTriadsArcs);
        this.priorStepHumeriVisible(viewManager.guiOptions.showAllBones);
        this.toggleBodyPlaneVisibility(viewManager.guiOptions.showBodyPlanes);
        this.toggleSphereVisibility(viewManager.guiOptions.showSphere);
    }

    subscribeEvents(viewManager) {
        const eventHandlers = {
            'showTriadsArcs': event => this.showTriadsArcs(event.visibility),
            'showAllBones': event => this.priorStepHumeriVisible(event.visibility),
            'showBodyPlanes': event => this.toggleBodyPlaneVisibility(event.visibility),
            'showSphere': event => this.toggleSphereVisibility(event.visibility),
            'humerusBase': event => {
                this.setHumerusBase(event.humerusBase);
                this.setFrame(event.frameNum);
            }
        };

        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            viewManager.addEventListener(eventName, handler);
            this.viewManagerEventListeners.set(eventName, handler);
        });
    }

    showTriadsArcs(flag) {
        this.scene.triadsArcsVisible = flag;
        this.scene.showTriadsArcs();
    }

    priorStepHumeriVisible(flag) {
        this.boneComponent.setPriorStepBonesVisible(flag);
    }

    toggleBodyPlaneVisibility(flag) {
        this.scene.toggleBodyPlaneVisibility(flag);
    }

    toggleSphereVisibility(flag) {
        this.sphereComponent.setVisible(flag);
    }

    setHumerusBase(base) {
        switch (base) {
            case HUMERUS_BASE.TORSO:
                this.humerusRotation = (methodName, frameNum) => 
                    this.rotationHelper.humerusRotation_torso(methodName, frameNum);
                this.humerusQuat = frameNum => 
                    this.rotationHelper.humerusQuat_torso(frameNum);
                break;
            case HUMERUS_BASE.SCAPULA:
                this.humerusRotation = (methodName, frameNum) => 
                    this.rotationHelper.humerusRotation_scapula(methodName, frameNum);
                this.humerusQuat = frameNum => 
                    this.rotationHelper.humerusQuat_scapula(frameNum);
                break;
            default:
                this.humerusRotation = (methodName, frameNum) => 
                    this.rotationHelper.humerusRotation_torso(methodName, frameNum);
                this.humerusQuat = frameNum => 
                    this.rotationHelper.humerusQuat_torso(frameNum);
        }

        // Update starting quaternion for shortest path methods
        if (this.methodName === 'HUM_SHORTEST_PATH_START_END') {
            this.scene.startingQuat = this.humerusQuat(0);
        }
    }

    dispose() {
        // Clean up view manager event listeners
        this.viewManagerEventListeners.forEach((handler, eventName) => {
            // Note: In a real implementation, you'd need a reference to viewManager
            // viewManager.removeEventListener(eventName, handler);
        });
        this.viewManagerEventListeners.clear();

        // Dispose animation helper
        if (this.animationHelper) {
            this.animationHelper.dispose();
        }

        super.dispose();
    }
}