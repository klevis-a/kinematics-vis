import {Matrix4, Vector3} from "./vendor/three.js/build/three.module.js";

class EulerDecomposition {
    constructor(mat4) {
        this.mat4 = mat4;
    }

    getElement(row,column) {
        return this.mat4.elements[4*column+row];
    }

    createAxisAngleMap() {
        this.axisAngleMap = new Map();
        this.axisAngleMap.set(this.axis_1, this.angles[0]);
        this.axisAngleMap.set(this.axis_2, this.angles[1]);
        this.axisAngleMap.set(this.axis_2$, this.angles[1]);
        this.axisAngleMap.set(this.axis_3, this.angles[2]);
        this.axisAngleMap.set(this.axis_3$, this.angles[2]);
        this.axisAngleMap.set(this.axis_3$$, this.angles[2]);
    }
}

export class EulerDecomposition_RY$$_RZ$_RX extends EulerDecomposition{
    constructor(mat4) {
        super(mat4);
        this.angles = [];
        this.extractAngles();
        this.createAxes();
        this.createAxisAngleMap();
        this.createRotations();
    }

    extractAngles() {
        if (this.getElement(0, 1) < 1) {
            if (this.getElement(0, 1) > -1) {
                this.angles[0] = Math.atan2(this.getElement(2, 1), this.getElement(1, 1));
                this.angles[1] = Math.asin(-this.getElement(0, 1));
                this.angles[2] = Math.atan2(this.getElement(0, 2), this.getElement(0, 0));
            }
            // r01=-1
            else {
                this.angles[0] = Math.atan2(-this.getElement(2,0),this.getElement(2,2));
                this.angles[1] = Math.PI/2;
                this.angles[2] = 0;
            }
        }
        // r01=+1
        else {
            this.angles[0] = Math.atan2(-this.getElement(2,0),this.getElement(2,2));
            this.angles[1] = -Math.PI/2;
            this.angles[2] = 0;
        }
    }

    createAxes() {
        this.axis_1 = new Vector3(1, 0, 0);
        this.axis_2 = new Vector3(0, 0, 1);
        this.axis_3 = new Vector3(0, 1, 0);

        const afterRot1 = new Matrix4().makeRotationAxis(this.axis_1, this.angles[0]);
        this.axis_2$ = new Vector3().setFromMatrixColumn(afterRot1,2);
        this.axis_3$ = new Vector3().setFromMatrixColumn(afterRot1,1);

        const afterRot2 = new Matrix4().makeRotationAxis(this.axis_2$, this.angles[1]).multiply(afterRot1);
        this.axis_3$$ = new Vector3().setFromMatrixColumn(afterRot2,1);
    }

    createRotations() {
        this.R3$$_R2$_R1 = [this.axis_1, this.axis_2$, this.axis_3$$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R3$$_R1_R2 = [this.axis_2, this.axis_1, this.axis_3$$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R2$_R3$_R1 = [this.axis_1, this.axis_3$, this.axis_2$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R2$_R1_R3 = [this.axis_3, this.axis_1, this.axis_2$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R1_R2_R3 = [this.axis_3, this.axis_2, this.axis_1].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
    }
}

export class AxisAngle {
    constructor(axis, angle) {
        this.axis = axis;
        this.angle = angle;
    }
}