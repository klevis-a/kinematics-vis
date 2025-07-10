'use strict';

import {Scene, Color, PerspectiveCamera, EventDispatcher} from 'three';
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls.js";
import {divGeometry} from "../SceneHelpers.js";

export class BaseScene extends EventDispatcher {
    static SCENE_COLOR = 0xDCDCDC;

    constructor(viewElement, renderer, camera) {
        super();
        this.viewElement = viewElement;
        this.renderer = renderer;
        this.camera = camera;
        this.scene = new Scene();
        this.scene.background = new Color(BaseScene.SCENE_COLOR);
        this.components = new Map();
        this.componentOrder = [];
        this.isInitialized = false;
    }

    addComponent(name, component) {
        if (this.components.has(name)) {
            throw new Error(`Component '${name}' already exists`);
        }
        this.components.set(name, component);
        this.componentOrder.push(name);
        
        if (this.isInitialized) {
            component.initialize(this);
        }
    }

    removeComponent(name) {
        const component = this.components.get(name);
        if (component) {
            component.dispose(this);
            this.components.delete(name);
            this.componentOrder = this.componentOrder.filter(n => n !== name);
        }
    }

    getComponent(name) {
        return this.components.get(name);
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }
        
        this.initializeCore();
        
        for (const name of this.componentOrder) {
            const component = this.components.get(name);
            await component.initialize(this);
        }
        
        this.isInitialized = true;
        this.dispatchEvent({type: 'initialized'});
    }

    initializeCore() {
        // Override in subclasses for scene-specific initialization
    }

    async reset(data) {
        this.dispatchEvent({type: 'beforeReset', data});
        
        for (const name of this.componentOrder) {
            const component = this.components.get(name);
            await component.reset(this, data);
        }
        
        this.dispatchEvent({type: 'afterReset', data});
    }

    async setFrame(frameNum) {
        this.dispatchEvent({type: 'beforeFrameChange', frameNum});
        
        for (const name of this.componentOrder) {
            const component = this.components.get(name);
            await component.setFrame(this, frameNum);
        }
        
        this.dispatchEvent({type: 'afterFrameChange', frameNum});
    }

    renderSceneGraph() {
        const geometry = this.viewGeometry;
        this.dispatchEvent({type: 'beforeRender', geometry});
        this.renderer.render(this.scene, this.camera);
        this.dispatchEvent({type: 'afterRender', geometry});
    }

    get viewGeometry() {
        return divGeometry(this.viewElement);
    }

    updateCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.viewElement);
        this.setTrackballControls(this.controls);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    setTrackballControls(trackBallControl) {
        trackBallControl.rotateSpeed = 3.0;
        trackBallControl.zoomSpeed = 1.2;
        trackBallControl.panSpeed = 0.8;
        trackBallControl.keys = [65, 83, 68]; // A, S, D
    }

    dispose() {
        this.dispatchEvent({type: 'beforeDispose'});
        
        for (const name of this.componentOrder) {
            const component = this.components.get(name);
            component.dispose(this);
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        this.scene.dispose();
        this.dispatchEvent({type: 'afterDispose'});
    }
}