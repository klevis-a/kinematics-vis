'use strict';

import {STLLoader} from "./vendor/three.js/examples/jsm/loaders/STLLoader.js";

export function promiseLoadSTL(url, onprogress = function () {})
{
    if (url instanceof File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', function (event) {
                const contents = event.target.result;
                const geometry = new STLLoader().parse(contents);
                geometry.sourceType = 'stl';
                geometry.sourceFile = url.name;
                resolve(geometry);
            }, false);
            if ( reader.readAsBinaryString !== undefined ) {
                reader.readAsBinaryString(url);
            } else {
                reader.readAsArrayBuffer(url);
            }
        });
    }
    else {
        return new Promise((resolve, reject) => {
            new STLLoader().load(url, resolve, onprogress, reject);
        });
    }
}
