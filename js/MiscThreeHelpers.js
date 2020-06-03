'use strict';

import {STLLoader} from "./vendor/three.js/examples/jsm/loaders/STLLoader.js";

export function promiseLoadSTL(url, onprogress = function () {})
{
    return new Promise((resolve, reject) => {
        new STLLoader().load(url, resolve, onprogress, reject)
    });
}
