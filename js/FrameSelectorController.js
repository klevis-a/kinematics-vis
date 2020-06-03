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

        this.FrameGoCtrl.onclick = () => this.UpdateEulerScenesFnc(this.Timeline.value-1);
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

    handleTimeLineInput() {
        this.FrameNumLbl.innerHTML = this.Timeline.value;
        this.SetFrameFnc(this.Timeline.value-1);
    }
}