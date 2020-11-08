'use strict';

import {TimelineController} from "./TimelineController.js";

export class ViewAnimationHelper {
    constructor(ctrlDiv, eulerScene, numFrames, framePeriod) {
        this.EulerScene = eulerScene;
        this.NumFrames = numFrames;
        this.FramePeriod = framePeriod;
        this.CtrlDiv = ctrlDiv;
        this.createCtrlDiv();
        const playFnc = (frameNum) => this.play(frameNum);
        const pauseFnc = () => this.pause();
        const setFrameFnc = (frameNum) => this.setFrame(frameNum);
        this.TimelineController = new TimelineController(this.playBtn, this.timeline, this.NumFrames, playFnc, pauseFnc, setFrameFnc);
        this.CurrentAnimationFnc = (t) => this.renderNoAnimate(t);
    }

    createCtrlDiv() {
        const parentElement = this.CtrlDiv;
        const stateCtrlDiv = parentElement.appendChild(document.createElement('div'));
        stateCtrlDiv.setAttribute('class', 'stateControl');
        const stateCtrlForm = stateCtrlDiv.appendChild(document.createElement('form'));
        stateCtrlForm.setAttribute('name', parentElement.id + '_stateCtrlForm');
        const animationHelper = this;
        const changeHandler = function () {
            animationHelper.goToStep(parseInt(this.value) - 1);
        };
        this.EulerScene.rotations.forEach((rotation, idx) => {
            const id = parentElement.id + '_' +  (idx + 1);
            const stateDiv = stateCtrlForm.appendChild(document.createElement('div'));
            const stateRadio = stateDiv.appendChild(document.createElement('input'));
            stateRadio.setAttribute('type', 'radio');
            stateRadio.setAttribute('name', parentElement.id + '_rotationStates');
            stateRadio.setAttribute('value', (idx + 1).toString());
            stateRadio.setAttribute('id', id);
            stateRadio.addEventListener('change', changeHandler);
            const stateRadioLbl = stateDiv.appendChild(document.createElement('label'));
            stateRadioLbl.setAttribute('for', id);
            stateRadioLbl.innerHTML = (idx + 1).toString();
            if (idx === 0) {
                stateRadio.toggleAttribute('checked');
                stateRadioLbl.setAttribute('class', 'firstState');
            }
        });
        const timelineCtrlDiv = parentElement.appendChild(document.createElement('div'));
        timelineCtrlDiv.setAttribute('class', 'timelineCtrl');
        this.playBtn = timelineCtrlDiv.appendChild(document.createElement('div'));
        this.playBtn.setAttribute('class', 'play');
        const sliderDiv = timelineCtrlDiv.appendChild(document.createElement('div'));
        sliderDiv.setAttribute('class', 'sliderDiv');
        this.timeline = sliderDiv.appendChild(document.createElement('input'));
        this.timeline.setAttribute('type', 'range');
        this.timeline.setAttribute('min', '0');
        this.timeline.setAttribute('max', (this.NumFrames - 1).toString());
        this.timeline.setAttribute('value', '0');
        this.timeline.setAttribute('step', 'any');
        this.timeline.setAttribute('class', 'slider');
        this.timeline.setAttribute('id', parentElement.id + '_timeline');
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

    goToStep(stepNum) {
        this.CurrentAnimationFnc = (t) => this.renderNoAnimate(t);
        this.TimelineController.pausePress();
        this.EulerScene.goToStep(parseInt(stepNum));
        this.TimelineController.updateTimeLine(0);
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