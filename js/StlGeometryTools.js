import {Matrix4, Vector3} from "./vendor/three.js/build/three.module.js";

export function normalizeHumerusGeometry(humerusLandmarks, humerusGeometry) {
    const hhc = humerusLandmarks.hhc;
    const le = humerusLandmarks.le;
    const me = humerusLandmarks.me;
    const y_axis = new Vector3().addVectors(me, le).multiplyScalar(0.5).multiplyScalar(-1).add(hhc);
    const x_axis = new Vector3().subVectors(me, le).cross(y_axis);
    const z_axis = new Vector3().crossVectors(x_axis, y_axis);
    x_axis.normalize();
    y_axis.normalize();
    z_axis.normalize();
    const BB_T_H = new Matrix4().makeBasis(x_axis, y_axis, z_axis).setPosition(hhc);
    const H_T_BB = new Matrix4().getInverse(BB_T_H);
    humerusGeometry.applyMatrix4(H_T_BB);
}

export function normalizeScapulaGeometry(scapulaLandmarks, scapulaGeometry) {
    const gc = scapulaLandmarks.gc;
    const ia = scapulaLandmarks.ia;
    const ts = scapulaLandmarks.ts;

    const z_axis = new Vector3().subVectors(gc, ts);
    const x_axis = new Vector3().crossVectors(z_axis, new Vector3().subVectors(ia, ts));
    const y_axis = new Vector3().crossVectors(z_axis, x_axis);
    x_axis.normalize();
    y_axis.normalize();
    z_axis.normalize();
    const BB_T_S = new Matrix4().makeBasis(x_axis, y_axis, z_axis).setPosition(gc);
    const S_T_BB = new Matrix4().getInverse(BB_T_S);
    scapulaGeometry.applyMatrix4(S_T_BB);
}
