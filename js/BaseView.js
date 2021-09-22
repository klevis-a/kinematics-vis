'use strict';

import {PerspectiveCamera} from "three";

export class BaseView {

    constructor() {
        this.parent_div = null;
    }

    postDomAttach(viewManager) {
    }

    initializeVisualOptions(viewManager) {
    }

    get viewGeometry() {
    }

    renderSceneGraph() {
    }

    get controls() {
    }

    updateControls() {
    }

    updateCamera() {
    }

    previewFrame(frameNum) {
    }

    setFrame(frameNum) {
    }

    dispose() {
    }
}

export function defaultCamera(aspectRatio) {
    const fov = 75;
    const camera = new PerspectiveCamera(fov, aspectRatio, 1, 2000);
    camera.position.set(-425, 200, -225);
    camera.updateProjectionMatrix();
    return camera;
}
