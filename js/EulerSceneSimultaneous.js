import {EulerScene} from "./EulerScene.js";
import * as THREE from "./vendor/three.js/build/three.module.js";
import * as EulerStep from "./EulerStep.js";
import {axisAngleFromQuat, AxisAngle} from "./EulerDecompositions.js";


class EulerStepSimultaneous extends EulerStep.EulerStep {

    constructor(quatStart, rotation, numFrames, triadLength, triadAspectRatio, markingsStart, stepNumber, arcStripWidth, numArcRadialSegments, arcHeightSegments, simultaneous_rotations) {
        super(quatStart, rotation, numFrames, triadLength, triadAspectRatio, markingsStart, stepNumber, arcStripWidth, numArcRadialSegments, arcHeightSegments);
        this.simultaneous_rotations = simultaneous_rotations;
    }

    createArcs() {
        super.createArcs();
        // only the arc showing the rotation of the humeral axis makes sense
        this.arcs[0].visible = false;
        this.arcs[2].visible = false;
    }

    createRotAxis() {
        super.createRotAxis();
        // the rotation axis is non-constant and doesn't make sense to show
        this.rotAxis.visible = false;
    }

    updateTriad(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            this.triad.quaternion.copy(this.endingTriad.quaternion);
        } else {
            const interpFactor = frameNum/this.numFrames;
            const endQuat = (new THREE.Quaternion().setFromAxisAngle(this.simultaneous_rotations[0].axis, this.simultaneous_rotations[0].angle * interpFactor))
                .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.simultaneous_rotations[1].angle * interpFactor));
            this.triad.quaternion.copy(endQuat);
        }
    }
}

export class EulerSceneSimultaneous extends EulerScene{
    // admittedly, this is a hackish way of implementing this feature but EulerStep was built to display sequential rotations

    constructor(viewElement, trackballDiv, renderer, numFrames, camera, arcStripWidth, triadLength, markingStart) {
        super(viewElement, trackballDiv, renderer, numFrames, camera, arcStripWidth, triadLength, markingStart);
    }

    createSteps() {
        const finalQuat = this.rotations.reduce((accumulator, rotation) =>
            (new THREE.Quaternion().setFromAxisAngle(rotation.axis, rotation.angle)).multiply(accumulator), new THREE.Quaternion());
        this.quaternions = [new THREE.Quaternion(), finalQuat];
        const rotation = axisAngleFromQuat(finalQuat);

        // the euler step will go from beginning to end in one step even though there are two rotations - because
        // these rotations happen simultaneously
        const eulerStep = new EulerStepSimultaneous(this.quaternions[0], rotation, this.numFrames, this.triadLength,
            this.triadAspectRatio, this.markingsStart, 1, this.arcStripWidth, this.numFrames, this.arcHeightSegments, this.rotations);

        this.addStepToScene(eulerStep);
        this.steps = [eulerStep];
        this.dispatchEvent({type: 'createSteps'});
    }

    goToStep(stepNum) {
        this.currentStep = stepNum;
        this.dispatchEvent({type: 'stepChange'});
    }

    updateToFrame(frameNum) {
        this.steps[0].updateToFrame(frameNum);
        this.dispatchEvent({type: 'frameChange', frameNum: frameNum});
    }

    initialize(rotations) {
        console.assert(rotations.length === 2);
        super.initialize(rotations);
    }
}
