'use strict';

export class CSVLoader {
    constructor(papa) {
        this.Papa = papa;
    }

    loadCsv(url, hasHeader=false) {
        return new Promise((resolve, reject) => {
            this.Papa.parse(url, {download: true, dynamicTyping: true, skipEmptyLines: true, header: hasHeader, complete: results => {resolve(results)}});
        });
    }
}