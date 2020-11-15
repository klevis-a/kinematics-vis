'use strict';

export class FrameSelectorController {
    constructor(timeline, frameNumLbl, frameGoCtrl, numFrames, setFrameFnc, updateEulerScenesFnc) {
        this.Timeline = timeline;
        this.FrameNumLbl = frameNumLbl;
        this.FrameGoCtrl = frameGoCtrl;
        this.NumFrames = numFrames;
        this.SetFrameFnc = setFrameFnc;
        this.UpdateEulerScenesFnc = updateEulerScenesFnc;

        this.Timeline.value = 1;
        this.Timeline.min = 1;
        this.Timeline.max = this.NumFrames;
        this.Timeline.step = '1';
        this.FrameNumLbl.innerHTML = 1;

        this.onGoListener = () => this.UpdateEulerScenesFnc(this.Timeline.value-1);
        this.FrameGoCtrl.addEventListener('click', this.onGoListener);
        this.onTimelineInputListener = () => this.handleTimeLineInput();
        this.Timeline.addEventListener('input', this.onTimelineInputListener);
        this.onTimelineKeyListener = (event) => {
            if (event.keyCode === 37) { // left arrow
                const currentVal = parseInt(this.Timeline.value);
                if (currentVal<=this.Timeline.min) {
                    this.Timeline.value = this.Timeline.min;
                }
                else {
                    this.Timeline.value=currentVal-1;
                }
            }
            if (event.keyCode === 39) { // right arrow
                const currentVal = parseInt(this.Timeline.value);
                if (currentVal>=this.Timeline.max) {
                    this.Timeline.value = this.Timeline.max;
                }
                else {
                    this.Timeline.value=currentVal+1;
                }
            }
            this.handleTimeLineInput();
            event.preventDefault();
        };
        this.Timeline.addEventListener('keydown', this.onTimelineKeyListener);
    }

    dispose() {
        this.FrameGoCtrl.removeEventListener('click', this.onGoListener);
        this.Timeline.removeEventListener('input', this.onTimelineInputListener);
        this.Timeline.removeEventListener('keydown', this.onTimelineKeyListener);
    }

    handleTimeLineInput() {
        this.FrameNumLbl.innerHTML = this.Timeline.value;
        this.SetFrameFnc(this.Timeline.value-1);
    }

    updateTimeLine(frameNum) {
        this.Timeline.value = frameNum + 1;
        this.FrameNumLbl.innerHTML = this.Timeline.value;
    }
}