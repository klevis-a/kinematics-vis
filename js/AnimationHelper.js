'use strict';

import {TimelineController} from "./TimelineController.js";
import {divGeometry} from "./SceneHelpers.js"

export class AnimationHelper {
    constructor(eulerScenes, numFrames, framePeriod, playBtn, timeline, frameNumLbl, renderer, parentElement, updateCamera) {
        this.UpdateCamera = updateCamera;
        this.Renderer = renderer;
        this.ParentElement = parentElement;
        this.EulerScenes = eulerScenes;
        this.NumFrames = numFrames;
        this.FramePeriod = framePeriod;
        const playFnc = (frameNum) => this.play(frameNum);
        const pauseFnc = () => this.pause();
        const setFrameFnc = (frameNum) => this.setFrame(frameNum);
        this.TimelineController = new TimelineController(playBtn, timeline, frameNumLbl, this.NumFrames, playFnc, pauseFnc, setFrameFnc);
        this.CurrentAnimationFnc = (t) => this.renderNoAnimate(t);
        this.render();
    }

    play(frameNum) {
        this.StartFrame = frameNum;
        this.StartTime = performance.now();
        this.CurrentAnimationFnc = (t) => this.renderAnimate(t);
    }

    pause() {
        this.CurrentAnimationFnc = (t) => this.renderNoAnimate(t);
    }

    setFrame(frameNum) {
        this.CurrentAnimationFnc = (t) => this.renderNoAnimate(t);
        this.TimelineController.pausePress();
        this.EulerScenes.forEach(eulerScene => eulerScene.updateToFrame(frameNum));
    }

    render(time) {
        this.CurrentAnimationFnc(time);
        this.Renderer.setScissorTest(true);
        this.EulerScenes.forEach((eulerScene) => {
            const {contentLeft: left, contentTop: top, contentWidth: width, contentHeight: height} = eulerScene.viewGeometry;
            const {contentHeight: parentHeight} = divGeometry(this.ParentElement);
            eulerScene.renderer.setScissor(left, parentHeight-top-height, width, height);
            eulerScene.renderer.setViewport(left, parentHeight-top-height, width, height);
            if (this.UpdateCamera) eulerScene.updateCamera();
            eulerScene.renderSceneGraph();
        });
        requestAnimationFrame((t) => this.render(t));
    }

    renderNoAnimate(time) {
    }

    renderAnimate(time) {
        const timeDiff = time - this.StartTime;
        if (timeDiff > 0) {
            const currentFractionalFrame = (timeDiff/this.FramePeriod) + this.StartFrame;
            const currentFrame = Math.floor(currentFractionalFrame);
            this.EulerScenes.forEach(eulerScene => eulerScene.updateToFrame(currentFractionalFrame));

            if (currentFrame>=this.NumFrames) {
                this.TimelineController.updateTimeLine(this.NumFrames);
                this.TimelineController.pausePress();
                this.CurrentAnimationFnc = (t) => this.renderNoAnimate(t);
            }
            else {
                this.TimelineController.updateTimeLine(currentFractionalFrame);
                this.CurrentAnimationFnc = (t) => this.renderAnimate(t);
            }
        }
    }

}