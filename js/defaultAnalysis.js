'use strict';

import {HUMERUS_BASE} from "./RotationHelper.js";
import {ShoulderVis} from "./ShoulderVis.js";

const guiOptions = {
    humerusBase: HUMERUS_BASE.TORSO,
    showAllBones: false,
    showAngles: false,
    showArea: false,
    showTriadsArcs: true,
    showBodyPlanes: false,
    showSphere: true
};

const initialViewLayout = new Map([['view1', 'HUM_EULER_YXY'], ['view2', 'SCAP_EULER_YXZ'], ['view3', 'PREVIEW']]);

const shoulderVis = new ShoulderVis('./csv', 'db_summary.json', initialViewLayout, guiOptions, 'humerusIsb');
