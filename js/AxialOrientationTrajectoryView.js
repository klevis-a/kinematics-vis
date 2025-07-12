'use strict';

import {Vector3} from "three";
import {BaseView} from "./BaseView.js";
import {AxialOrientationTrajectoryScene} from "./AxialOrientationTrajectoryScene.js";
import {CustomDataLoader} from "./CustomDataLoader.js";
import {generateUUID} from "./JSHelpers.js";
import {HumerusAngVelocityScene} from "./HumerusAngVelocityScene";

export class AxialOrientationTrajectoryView {
    constructor(rotationHelper, renderer, humerusGeometry, humerusLength, arcStripWidth = 10, triadLength=150, markingStart=50) {
        this.rotationHelper = rotationHelper;
        this.renderer = renderer;
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.arcStripWidth = arcStripWidth;
        this.triadLength = triadLength;
        this.markingStart = markingStart;
        this.customDataLoader = new CustomDataLoader();
        this.isDataLoaded = false;
        this.trialVisibility = {
            'Trial1': true,
            'Trial2': true,
            'Trial3': true,
            'Trial4': true
        };
        this.createDivElements();
        this.createControls();
        this.axialScene = new AxialOrientationTrajectoryScene(this.scene_div, this.renderer, humerusGeometry, humerusLength);
        this.animationHelper = {CurrentAnimationFnc: (t) => {}};
        this.setFrame(0)
    }

    createDivElements() {
        this.uuid = generateUUID();
        this.parent_div = document.createElement('div');
        this.parent_div.setAttribute('class', 'view_div');
        this.parent_div.setAttribute('id', this.uuid);

        this.scene_div = this.parent_div.appendChild(document.createElement('div'));
        this.scene_div.setAttribute('class', 'scene_div');
        this.scene_div.setAttribute('id', this.uuid + '_scene');

        this.controls_div = this.parent_div.appendChild(document.createElement('div'));
        this.controls_div.setAttribute('class', 'view_controls');
        this.controls_div.setAttribute('id', this.uuid + '_controls');
        this.controls_div.style.padding = '10px';
        this.controls_div.style.backgroundColor = '#f0f0f0';
        this.controls_div.style.borderTop = '1px solid #ccc';
    }

    createControls() {
        // Create trajectory visibility toggles
        const label = document.createElement('label');
        label.textContent = 'Visible Trajectories: ';
        label.style.marginRight = '15px';
        label.style.fontWeight = 'bold';
        this.controls_div.appendChild(label);

        ['Trial1', 'Trial2', 'Trial3', 'Trial4'].forEach(trialName => {
            this.createTrajectoryToggle(trialName);
        });
    }

    createTrajectoryToggle(trialName) {
        const button = document.createElement('button');
        button.textContent = trialName;
        button.style.marginRight = '10px';
        button.style.padding = '5px 15px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        
        button.addEventListener('click', () => {
            this.trialVisibility[trialName] = !this.trialVisibility[trialName];
            button.style.backgroundColor = this.trialVisibility[trialName] ? '#4CAF50' : '#f44336';
            this.updateVisibleTrajectories();
        });
        
        this.controls_div.appendChild(button);
    }

    initialize() {
        // Load custom data
        const success = this.customDataLoader.loadCustomData();
        if (!success) {
            console.error('Failed to load custom data');
            return;
        }

        this.isDataLoaded = true;
        
        this.axialScene = new AxialOrientationTrajectoryScene(
            this.scene_div,
            this.renderer,
            this.humerusGeometry,
            this.humerusLength
        );

        console.log('AxialOrientationTrajectoryView initialized successfully');
    }

    postDomAttach(viewManager) {
        if (!this.isDataLoaded) {
            this.initialize();
        }
        
        if (this.axialScene) {
            this.axialScene.createCamera();
            this.axialScene.createControls();
        }
    }

    initializeVisualOptions(viewManager) {
        // Custom view doesn't need to integrate with ViewManager's GUI options
    }

    updateVisibleTrajectories() {
        // For now, this method doesn't do anything special
        // In the future, you could show multiple trajectories simultaneously
        // For this implementation, we'll just update the current frame
        // to reflect any changes in visibility
    }

    getMaxFrames() {
        if (!this.isDataLoaded) return 0;
        
        // Return the maximum number of frames across all visible trajectories
        let maxFrames = 0;
        Object.keys(this.trialVisibility).forEach(trialName => {
            if (this.trialVisibility[trialName]) {
                const frames = this.customDataLoader.getNumFrames(trialName);
                maxFrames = Math.max(maxFrames, frames);
            }
        });
        return maxFrames;
    }

    get viewGeometry() {
        return this.axialScene ? this.axialScene.viewGeometry : null;
    }

    renderSceneGraph() {
        if (this.axialScene) {
            this.axialScene.renderSceneGraph();
        }
    }

    get controls() {
        return this.axialScene ? this.axialScene.controls : null;
    }

    updateControls() {
        if (this.axialScene && this.axialScene.controls) {
            this.axialScene.controls.update();
        }
    }

    updateCamera() {
        if (this.axialScene) {
            this.axialScene.updateCamera();
        }
    }

    previewFrame(frameNum) {
        if (!this.isDataLoaded || !this.axialScene) {
            return;
        }

        // For preview, show the first visible trajectory
        const visibleTrial = this.getFirstVisibleTrial();
        console.log(visibleTrial)
        if (visibleTrial) {
            this.updateSceneForTrial(visibleTrial, frameNum);
        }
    }

    setFrame(frameNum) {
        if (!this.isDataLoaded || !this.axialScene) {
            return;
        }

        // For setFrame, show the first visible trajectory
        const visibleTrial = this.getFirstVisibleTrial();
        if (visibleTrial) {
            this.updateSceneForTrial(visibleTrial, frameNum);
        }
    }

    getFirstVisibleTrial() {
        const trialNames = ['Trial1', 'Trial2', 'Trial3', 'Trial4'];
        return trialNames.find(trial => this.trialVisibility[trial]);
    }

    updateSceneForTrial(trialName, frameNum) {
        const maxFrames = this.customDataLoader.getNumFrames(trialName);
        if (frameNum >= maxFrames) {
            return;
        }

        // Get humerus quaternion for this frame
        const humerusQuat = this.customDataLoader.getHumerusQuat(trialName, frameNum);
        if (humerusQuat) {
            this.axialScene.updateHumerusOrientation(humerusQuat);
        }

        // Get angular velocity for this frame
        const angularVelocity = this.customDataLoader.getAngularVelocity(trialName, frameNum);
        if (angularVelocity) {
            this.axialScene.updateAngularVelocityVector(angularVelocity);
        }
    }

    subscribeEvents(viewManager) {
        // This custom view doesn't need to subscribe to ViewManager events
        // since it's standalone and uses its own data
    }

    dispose() {
        if (this.axialScene) {
            this.axialScene.dispose();
        }
        
        if (this.parent_div && this.parent_div.parentNode) {
            this.parent_div.parentNode.removeChild(this.parent_div);
        }
    }
}