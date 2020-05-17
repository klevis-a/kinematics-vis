'use strict';

import {TimelineController} from "./TimelineController.js";

export class AnimationHelper {
    constructor(eulerScene, numFrames, framePeriod, playBtn, timeline, frameNumLbl) {
        this.EulerScene = eulerScene;
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
        this.EulerScene.updateToFrame(frameNum);
    }

    render(time) {
        this.CurrentAnimationFnc(time);
        this.EulerScene.renderSceneGraph();
        this.RequestId = requestAnimationFrame((t) => this.render(t));
    }

    renderNoAnimate(time) {
    }

    renderAnimate(time) {
        const timeDiff = time - this.StartTime;
        if (timeDiff > 0) {
            const currentFractionalFrame = (timeDiff/this.FramePeriod) + this.StartFrame;
            const currentFrame = Math.floor(currentFractionalFrame);
            this.EulerScene.updateToFrame(currentFractionalFrame);

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