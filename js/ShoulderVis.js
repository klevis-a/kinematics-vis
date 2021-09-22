'use strict';

import {removeAllChildNodes} from "./JSHelpers.js";
import {promiseLoadSTL} from "./MiscThreeHelpers.js";
import {HumerusLandmarks, ScapulaLandmarks, Trajectory} from "./Csv_Processor.js";
import {ViewManager} from "./ViewManager.js";
import Plotly from 'plotly.js-dist-min';
import Papa from 'papaparse';

function loadJson(jsonFile) {
    return new Promise(function (resolve, reject) {
        Plotly.d3.json(jsonFile, data => resolve(data));
    });
}

function loadCsv(url, hasHeader=false) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {download: !(url instanceof File), dynamicTyping: true, skipEmptyLines: true, header: hasHeader,
            complete: results => {resolve(results)}});
    });
}

export function createViewManager(humerusLandmarksFile, scapulaLandmarksFile, trajectoryFile, humerusStlFile, scapulaStlFile, freq, initialLayout=null, guiOptions=null, defaultPlot='axialRot') {
    return Promise.all([loadCsv(humerusLandmarksFile), loadCsv(scapulaLandmarksFile), loadCsv(trajectoryFile),
        promiseLoadSTL(humerusStlFile), promiseLoadSTL(scapulaStlFile)])
        .then(([humerusLandmarksCsv, scapulaLandmarksCsv, trajectory, humerusGeometry, scapulaGeometry]) => {
            const humerusLandmarks = new HumerusLandmarks(humerusLandmarksCsv.data);
            const scapulaLandmarks = new ScapulaLandmarks(scapulaLandmarksCsv.data);
            const humerusTrajectory = new Trajectory(trajectory.data, freq);
            return  new ViewManager(humerusLandmarks, scapulaLandmarks, humerusTrajectory, humerusGeometry, scapulaGeometry, initialLayout, guiOptions, defaultPlot);
        });
}

export class ShoulderVis {

    constructor(dbBasePath, dbSummaryFile, initialLayout=null, guiOptions=null, defaultPlot='axialRot') {
        this.dbBasePath = dbBasePath;
        this.dbSummaryFile = this.dbBasePath + '/' + dbSummaryFile;
        this.initialLayout = initialLayout;
        this.guiOptions = guiOptions;
        this.dbDiv = document.getElementById('db-div');
        this.fileSelectorsDiv = document.getElementById('file-selectors');
        this.loadingDiv = document.getElementById('loading-div');
        this.viewManager = null;
        this.defaultPlot = defaultPlot;
        this.closeBtn = document.getElementById('help-close-btn');
        this.helpDiv = document.getElementById('help-div');
        this.helpBtn = document.getElementById('help-btn');
        this.dbBtn = document.getElementById('db-open-link');
        this.closeBtn.addEventListener('click', () => this.helpDiv.style.display = 'none');
        this.helpBtn.addEventListener('click', () => this.helpDiv.style.display = 'block');
        this.dbBtn.addEventListener('click', () => this.dbDiv.style.display = 'block');
        this.createFileSelector();
        this.createDbSelector();
    }

    resetViewManagerDb() {
        if (this.viewManager != null) {
            this.viewManager.dispose();
        }
        const humerusLandmarksFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['humerus_landmarks_file'];
        const scapulaLandmarksFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['scapula_landmarks_file'];
        const humerusStlFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['humerus_stl_file'];
        const scapulaStlFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['scapula_stl_file'];
        const trajectoryFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['activities'][this.activitySelector.value]['trajectory'];
        const freq = this.dbSummary[this.subjectSelector.value]['activities'][this.activitySelector.value]['freq']
        createViewManager(humerusLandmarksFile, scapulaLandmarksFile, trajectoryFile, humerusStlFile, scapulaStlFile, freq, this.initialLayout, this.guiOptions, this.defaultPlot)
            .then(viewManager => {
                this.viewManager = viewManager;
                this.loadingDiv.style.display = 'none'
            });
    }

    resetViewManagerManual() {
        if (this.viewManager != null) {
            this.viewManager.dispose();
        }
        const humerusLandmarksFile = this.humerusLandmarksFile.files[0];
        const scapulaLandmarksFile = this.scapulaLandmarksFile.files[0];
        const humerusStlFile = this.humerusStlFile.files[0];
        const scapulaStlFile = this.scapulaStlFile.files[0];
        const trajectoryFile = this.trajectoryFile.files[0];
        createViewManager(humerusLandmarksFile, scapulaLandmarksFile, trajectoryFile, humerusStlFile, scapulaStlFile,
            parseFloat(this.freqInput.value), this.initialLayout, this.guiOptions, this.defaultPlot)
            .then(viewManager => {
                this.viewManager = viewManager;
                this.loadingDiv.style.display = 'none'
            });
    }

    populateSubjectActivities(subject) {
        removeAllChildNodes(this.activitySelector);
        // iterate over the activityFriendNames map because it also establishes the order in which the activities should be populated
        const activitiesArray = Object.keys(this.dbSummary[subject]['activities']);
        activitiesArray.forEach(friendlyName => {
            const activityOption = this.activitySelector.appendChild(document.createElement('option'));
            activityOption.setAttribute('value', friendlyName);
            activityOption.innerHTML = friendlyName;
        });
    }

    createDbSelector() {
        loadJson(this.dbSummaryFile).then(dbSummary => {
            this.dbSummary = dbSummary;

            // add close button
            const dbCloseBtnDiv = this.dbDiv.appendChild(document.createElement('div'));
            dbCloseBtnDiv.setAttribute('class', 'close-container');
            this.dbCloseBtn = dbCloseBtnDiv.appendChild(document.createElement('a'));
            this.dbCloseBtn.setAttribute('href', '#');
            this.dbCloseBtn.setAttribute('class', 'close');
            this.dbCloseBtn.setAttribute('id', 'db-close-btn');
            this.dbCloseBtn.addEventListener('click', () => {
                this.dbDiv.style.display = 'none';
                this.fileSelectorsDiv.style.display = 'none';
            });

            // create subject selector
            const subjectSelectorDiv = this.dbDiv.appendChild(document.createElement('div'));
            subjectSelectorDiv.setAttribute('class', 'dbSelectDiv');
            this.subjectSelector = subjectSelectorDiv.appendChild(document.createElement('select'));
            this.subjectSelector.setAttribute('id', 'subjectsSelect');

            // create activities selector
            const activitySelectorDiv = this.dbDiv.appendChild(document.createElement('div'));
            activitySelectorDiv.setAttribute('class', 'dbSelectDiv');
            this.activitySelector = activitySelectorDiv.appendChild(document.createElement('select'));
            this.activitySelector.setAttribute('id', 'activitiesSelect');

            // populate the subject and activities selectors
            for(const subject in this.dbSummary) {
                const subjectOption = this.subjectSelector.appendChild(document.createElement('option'));
                subjectOption.setAttribute('value', subject);
                subjectOption.innerHTML = subject;
                if ('default' in this.dbSummary[subject]) {
                    subjectOption.setAttribute('selected', 'selected');
                    this.populateSubjectActivities(subject);
                }
            }

            // add event listeners
            this.subjectSelector.addEventListener('change', e => this.populateSubjectActivities(e.target.value));

            // add analyze button
            const analyzeBtnDiv = this.dbDiv.appendChild(document.createElement('div'));
            analyzeBtnDiv.setAttribute('class', 'dbSelectDiv');
            this.analyzeDbBtn = analyzeBtnDiv.appendChild(document.createElement('button'));
            this.analyzeDbBtn.setAttribute('type', 'button');
            this.analyzeDbBtn.innerHTML = 'Analyze';
            this.analyzeDbBtn.addEventListener('click', () => {
                this.resetViewManagerDb();
                this.fileSelectorsDiv.style.display = 'none';
                this.dbDiv.style.display = 'none';
                this.loadingDiv.style.display = 'block';
            });

            // add manual file selection link
            const manualFileLinkDiv = this.dbDiv.appendChild(document.createElement('div'));
            manualFileLinkDiv.setAttribute('class', 'manualDbLink');
            this.manualFileLink = manualFileLinkDiv.appendChild(document.createElement('a'));
            this.manualFileLink.setAttribute('href', '#');
            this.manualFileLink.innerHTML = 'Manual File Selection';
            this.manualFileLink.setAttribute('id', 'manual-file-link');
            this.manualFileLink.addEventListener('click', () => {
                this.dbDiv.style.display = 'none';
                this.fileSelectorsDiv.style.display = 'block';
            });
        })
        .then(() => {
            this.loadingDiv.style.display = 'none';
            this.dbDiv.style.display = 'block';
        });
    }

    createFileSelector() {
        // add close button
        const fsCloseBtnDiv = this.fileSelectorsDiv.appendChild(document.createElement('div'));
        fsCloseBtnDiv.setAttribute('class', 'close-container');
        this.fsCloseBtn = fsCloseBtnDiv.appendChild(document.createElement('a'));
        this.fsCloseBtn.setAttribute('href', '#');
        this.fsCloseBtn.setAttribute('class', 'close');
        this.fsCloseBtn.setAttribute('id', 'db-close-btn');
        this.fsCloseBtn.addEventListener('click', () => {
            this.dbDiv.style.display = 'none';
            this.fileSelectorsDiv.style.display = 'none';
        });

        let fileTrajectoryDiv, humerusLandmarksDiv, scapulaLandmarksDiv, humerusStlDiv, scapulaStlDiv;
        [fileTrajectoryDiv, this.trajectoryFile] = createIndFileSelector('trajectoryFile', 'Trajectory', 'dbSelectDiv');
        this.fileSelectorsDiv.appendChild(fileTrajectoryDiv);
        [humerusLandmarksDiv, this.humerusLandmarksFile] = createIndFileSelector('humerusLandmarksFile', 'Humerus Landmarks', 'dbSelectDiv');
        this.fileSelectorsDiv.appendChild(humerusLandmarksDiv);
        [scapulaLandmarksDiv, this.scapulaLandmarksFile] = createIndFileSelector('scapulaLandmarksFile', 'Scapula Landmarks', 'dbSelectDiv');
        this.fileSelectorsDiv.appendChild(scapulaLandmarksDiv);
        [humerusStlDiv, this.humerusStlFile] = createIndFileSelector('humerusStlFile', 'Humerus STL', 'dbSelectDiv');
        this.fileSelectorsDiv.appendChild(humerusStlDiv);
        [scapulaStlDiv, this.scapulaStlFile] = createIndFileSelector('scapulaStlFile', 'Scapula STL', 'dbSelectDiv');
        this.fileSelectorsDiv.appendChild(scapulaStlDiv);

        // add frequency
        const freqDiv = document.createElement('div');
        freqDiv.setAttribute('class', 'dbSelectDiv');
        const freqLabel = freqDiv.appendChild(document.createElement('label'));
        freqLabel.setAttribute('for', 'freq');
        freqLabel.innerHTML = '<b>' + 'Frequency (Hz)  ' + '</b>';
        this.freqInput = freqDiv.appendChild(document.createElement('input'));
        this.freqInput.setAttribute('type', 'text');
        this.freqInput.setAttribute('id', 'freq');
        this.freqInput.setAttribute('size', '4');
        this.fileSelectorsDiv.appendChild(freqDiv);

        // add analyze button
        const analyzeBtnDiv = this.fileSelectorsDiv.appendChild(document.createElement('div'));
        analyzeBtnDiv.setAttribute('class', 'dbSelectDiv');
        this.analyzeFsBtn = analyzeBtnDiv.appendChild(document.createElement('button'));
        this.analyzeFsBtn.setAttribute('type', 'button');
        this.analyzeFsBtn.innerHTML = 'Analyze';
        this.analyzeFsBtn.addEventListener('click', () => {
            this.resetViewManagerManual();
            this.fileSelectorsDiv.style.display = 'none';
            this.loadingDiv.style.display = 'block';
        });

        // add db selection link
        const dbLinkDiv = this.fileSelectorsDiv.appendChild(document.createElement('div'));
        dbLinkDiv.setAttribute('class', 'manualDbLink');
        this.dbLink = dbLinkDiv.appendChild(document.createElement('a'));
        this.dbLink.setAttribute('href', '#');
        this.dbLink.innerHTML = 'Use Database';
        this.dbLink.setAttribute('id', 'db-selection-link');
        this.dbLink.addEventListener('click', () => {
            this.dbDiv.style.display = 'block';
            this.fileSelectorsDiv.style.display = 'none';
        });
    }
}

function createIndFileSelector(id, labelText, divClass) {
    const fileSelectorDiv = document.createElement('div');
    fileSelectorDiv.setAttribute('class', divClass);
    const fileSelectorLabel = fileSelectorDiv.appendChild(document.createElement('label'));
    fileSelectorLabel.setAttribute('for', id);
    fileSelectorLabel.innerHTML = '<b>' + labelText + '</b>';
    const fileSelector = fileSelectorDiv.appendChild(document.createElement('input'));
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('id', id);
    return [fileSelectorDiv, fileSelector];
}