'use strict';

import {PerspectiveCamera} from "three";
import {generateUUID} from "../JSHelpers.js";

export class BaseView {
    constructor(renderer, camera = null) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = null;
        this.parent_div = null;
        this.scene_div = null;
        this.ctrlDiv = null;
        this.uuid = generateUUID();
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        this.createDomElements();
    }

    createDomElements() {
        this.parent_div = document.createElement('div');
        this.parent_div.setAttribute('class', 'view_div');
        this.parent_div.setAttribute('id', this.uuid);
        
        this.scene_div = this.parent_div.appendChild(document.createElement('div'));
        this.scene_div.setAttribute('class', 'scene_div');
        this.scene_div.setAttribute('id', this.uuid + '_scene');
        
        this.ctrlDiv = this.parent_div.appendChild(document.createElement('div'));
        this.ctrlDiv.setAttribute('class', 'view_controls');
        this.ctrlDiv.setAttribute('id', this.uuid + '_ctrls');
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }
        
        if (!this.camera) {
            this.camera = this.createDefaultCamera();
        }
        
        this.scene = this.createScene();
        await this.scene.initialize();
        
        this.isInitialized = true;
    }

    createDefaultCamera() {
        const fov = 75;
        const aspectRatio = 1; // Will be updated when attached to DOM
        const camera = new PerspectiveCamera(fov, aspectRatio, 1, 2000);
        camera.position.set(-425, 200, -225);
        camera.updateProjectionMatrix();
        return camera;
    }

    createScene() {
        throw new Error('createScene must be implemented by subclasses');
    }

    async postDomAttach(viewManager) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        this.scene.createControls();
        this.attachControlEvents(viewManager);
        this.updateCamera();
    }

    attachControlEvents(viewManager) {
        if (this.scene.controls) {
            this.scene.controls.addEventListener('start', viewManager.trackballStartEventListener);
            this.scene.controls.addEventListener('end', viewManager.trackballEndEventListener);
        }
    }

    initializeVisualOptions(viewManager) {
        // Override in subclasses to set up initial visual options
    }

    subscribeEvents(viewManager) {
        // Override in subclasses to subscribe to view manager events
    }

    addEventListener(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    removeEventListener(event, listener) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    get viewGeometry() {
        return this.scene ? this.scene.viewGeometry : null;
    }

    get controls() {
        return this.scene ? this.scene.controls : null;
    }

    renderSceneGraph() {
        if (this.scene) {
            this.scene.renderSceneGraph();
        }
    }

    updateControls() {
        if (this.scene && this.scene.controls) {
            this.scene.controls.update();
        }
    }

    updateCamera() {
        if (this.scene) {
            this.scene.updateCamera();
        }
    }

    async previewFrame(frameNum) {
        // Override in subclasses for frame preview logic
    }

    async setFrame(frameNum) {
        if (this.scene) {
            await this.scene.setFrame(frameNum);
        }
    }

    dispose() {
        // Clean up event listeners
        this.eventListeners.clear();
        
        // Dispose scene
        if (this.scene) {
            this.scene.dispose();
        }
        
        // Remove DOM elements
        if (this.parent_div && this.parent_div.parentNode) {
            this.parent_div.parentNode.removeChild(this.parent_div);
        }
    }
}