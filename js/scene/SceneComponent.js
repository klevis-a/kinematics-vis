'use strict';

export class SceneComponent {
    constructor(name) {
        this.name = name;
        this.isInitialized = false;
    }

    async initialize(scene) {
        if (this.isInitialized) {
            return;
        }
        await this.onInitialize(scene);
        this.isInitialized = true;
    }

    async reset(scene, data) {
        await this.onReset(scene, data);
    }

    async setFrame(scene, frameNum) {
        await this.onSetFrame(scene, frameNum);
    }

    dispose(scene) {
        this.onDispose(scene);
        this.isInitialized = false;
    }

    onInitialize(scene) {
        // Override in subclasses
    }

    onReset(scene, data) {
        // Override in subclasses
    }

    onSetFrame(scene, frameNum) {
        // Override in subclasses
    }

    onDispose(scene) {
        // Override in subclasses
    }
}