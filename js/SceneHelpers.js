'use strict';

import {Box3} from "three";

export function boundingBox_objects(objects) {
    const bb = new Box3();
    for(const object of objects) bb.expandByObject(object);
    return  bb;
}

export function computeCameraDistance(bbSize, cameraAspect, cameraFov, fitOffset = 1.2)
{
    const maxSize = Math.max(bbSize.x, bbSize.y, bbSize.z);
    const fitHeightDistance = maxSize / (2 * Math.atan( Math.PI * cameraFov / 360));
    const fitWidthDistance = fitHeightDistance / cameraAspect;
    return fitOffset * Math.max( fitHeightDistance, fitWidthDistance );
}

export function divGeometry(divElement)
{
    const boundingRect = divElement.getBoundingClientRect();
    return {
        contentLeft: boundingRect.left,
        contentTop: boundingRect.top,
        contentWidth: divElement.clientWidth,
        contentHeight: divElement.clientHeight,
        aspectRatio: divElement.clientWidth/divElement.clientHeight
    }
}

export function updateSpotLight(light,lightHelper) {
    light.target.updateMatrixWorld();
    if (lightHelper != null) lightHelper.update();
}

export function updateDirectionalLight(light, lightHelper) {
    light.updateMatrixWorld();
    light.target.updateMatrixWorld();
    if (lightHelper != null) lightHelper.update();
}
