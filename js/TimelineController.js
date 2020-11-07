'use strict';

export class TimelineController {
    constructor(playBtn, timeline, numFrames, playFnc, pauseFnc, setFrameFnc) {
        this.PlayBtn = playBtn;
        this.Timeline = timeline;
        this.NumFrames = numFrames;
        this.Playing = false;
        this.PlayFnc = playFnc;
        this.PauseFnc = pauseFnc;
        this.SetFrameFnc = setFrameFnc;

        this.Timeline.value = 0;
        this.Timeline.min = 0;
        this.Timeline.max = this.NumFrames;
        this.Timeline.step = 'any';

        this.PlayBtn.onclick = () => this.handlePlayBtn();
        this.Timeline.oninput = () => this.handleTimeLineInput();
        this.Timeline.addEventListener('keydown', (event) => {
            if (event.keyCode === 37) {
                const currentVal = parseFloat(this.Timeline.value);
                if (currentVal<=this.Timeline.min) {
                    this.Timeline.value = this.Timeline.min;
                }
                else {
                    this.Timeline.value=currentVal-1;
                }
            }
            if (event.keyCode === 39) {
                const currentVal = parseFloat(this.Timeline.value);
                if (currentVal>=this.Timeline.max) {
                    this.Timeline.value = this.Timeline.max;
                }
                else {
                    this.Timeline.value=currentVal+1;
                }
            }
            this.handleTimeLineInput();
            event.preventDefault();
        });
    }

    handlePlayBtn() {
        if (this.Playing) {
            this.pausePress();
            this.PauseFnc();
        }
        else {
            this.playPress();
            this.PlayFnc(parseFloat(this.Timeline.value));
        }
    }

    handleTimeLineInput() {
        this.SetFrameFnc(this.Timeline.value);
    }

    pausePress() {
        this.PlayBtn.classList.remove('pause');
        this.PlayBtn.classList.add('play');
        this.Playing = false;
    }

    playPress() {
        this.PlayBtn.classList.remove('play');
        this.PlayBtn.classList.add('pause');
        this.Playing = true;
    }

    updateTimeLine(frameNum) {
        this.Timeline.value = frameNum;
    }
}