'use strict';

import {removeAllChildNodes} from "./JSHelpers.js";
import {promiseLoadSTL} from "./MiscThreeHelpers.js";
import {HumerusLandmarks, ScapulaLandmarks, Trajectory} from "./Csv_Processor.js";
import {ViewManager} from "./ViewManager.js";

function loadJson(jsonFile) {
    return new Promise(function (resolve, reject) {
        Plotly.d3.json(jsonFile, data => resolve(data));
    });
}

function loadCsv(url, hasHeader=false) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {download: true, dynamicTyping: true, skipEmptyLines: true, header: hasHeader, complete: results => {resolve(results)}});
    });
}

function createViewManager(humerusLandmarksFile, scapulaLandmarksFile, trajectoryFile, humerusStlFile, scapulaStlFile, initialLayout=null, guiOptions=null, defaultPlot='axialRot') {
    return Promise.all([loadCsv(humerusLandmarksFile), loadCsv(scapulaLandmarksFile), loadCsv(trajectoryFile),
        promiseLoadSTL(humerusStlFile), promiseLoadSTL(scapulaStlFile)])
        .then(([humerusLandmarksCsv, scapulaLandmarksCsv, trajectory, humerusGeometry, scapulaGeometry]) => {
            const humerusLandmarks = new HumerusLandmarks(humerusLandmarksCsv.data);
            const scapulaLandmarks = new ScapulaLandmarks(scapulaLandmarksCsv.data);
            const humerusTrajectory = new Trajectory(trajectory.data);
            return  new ViewManager(humerusLandmarks, scapulaLandmarks, humerusTrajectory, humerusGeometry, scapulaGeometry, initialLayout, guiOptions, defaultPlot);
        });
}

export class ShoulderVis {
    static ActivityFriendlyNames = new Map([
        ['SA', 'Scapular Plane Abduction'],
        ['CA', 'Coronal Plane Abduction'],
        ['FE', 'Forward Elevation'],
        ['ERa90', 'External Rotation at 90 &deg; of Abduction'],
        ['ERaR', 'External Rotation at Rest'],
        ['WCA', 'Weighted Coronal Plane Abduction'],
        ['WSA', 'Weighted Scapular Plane Abduction'],
        ['WFE', 'Weighted Forward Elevation'],
    ]);

    constructor(dbBasePath, dbSummaryFile, defaultSubject, initialLayout=null, guiOptions=null, defaultPlot='axialRot') {
        this.dbBasePath = dbBasePath;
        this.dbSummaryFile = this.dbBasePath + '/' + dbSummaryFile;
        this.defaultSubject = defaultSubject;
        this.initialLayout = initialLayout;
        this.guiOptions = guiOptions;
        this.dbDiv = document.getElementById('db-div');
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
        this.createDbSelector();
    }

    resetViewManager() {
        if (this.viewManager != null) {
            this.viewManager.dispose();
        }
        const humerusLandmarksFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['humerus_landmarks_file'];
        const scapulaLandmarksFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['scapula_landmarks_file'];
        const humerusStlFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['humerus_stl_smooth_file'];
        const scapulaStlFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['config']['scapula_stl_smooth_file'];
        const trajectoryFile = this.dbBasePath + '/' +  this.dbSummary[this.subjectSelector.value]['activities'][this.activitySelector.value];
        createViewManager(humerusLandmarksFile, scapulaLandmarksFile, trajectoryFile, humerusStlFile, scapulaStlFile, this.initialLayout, this.guiOptions, this.defaultPlot)
            .then(viewManager => {
                this.viewManager = viewManager;
                this.loadingDiv.style.display = 'none'
            });
    }

    populateSubjectActivities(subject) {
        removeAllChildNodes(this.activitySelector);
        // iterate over the activityFriendNames map because it also establishes the order in which the activities should be populated
        const activitiesArray = Object.keys(this.dbSummary[subject]['activities']);
        ShoulderVis.ActivityFriendlyNames.forEach((friendlyName, activityKey) => {
            if (activitiesArray.includes(activityKey)) {
                const activityOption = this.activitySelector.appendChild(document.createElement('option'));
                activityOption.setAttribute('value', activityKey);
                activityOption.innerHTML = friendlyName;
            }
        });
    }

    createDbSelector() {
        loadJson(this.dbSummaryFile).then(dbSummary => {
            this.dbSummary = dbSummary;

            // create subject selector
            this.subjectSelectorDiv = this.dbDiv.appendChild(document.createElement('div'));
            this.subjectSelectorDiv.setAttribute('class', 'dbSelectDiv');
            this.subjectSelector = this.subjectSelectorDiv.appendChild(document.createElement('select'));
            this.subjectSelector.setAttribute('id', 'subjectsSelect');

            // create activities selector
            this.activitySelectorDiv = this.dbDiv.appendChild(document.createElement('div'));
            this.activitySelectorDiv.setAttribute('class', 'dbSelectDiv');
            this.activitySelector = this.activitySelectorDiv.appendChild(document.createElement('select'));
            this.activitySelector.setAttribute('id', 'activitiesSelect');

            // populate the subject and activities selectors
            for(const subject in this.dbSummary) {
                const subjectOption = this.subjectSelector.appendChild(document.createElement('option'));
                subjectOption.setAttribute('value', subject);
                subjectOption.innerHTML = subject;
                if (subject === this.defaultSubject) {
                    subjectOption.setAttribute('selected', 'selected');
                    this.populateSubjectActivities(subject);
                }
            }

            // add event listeners
            this.subjectSelector.addEventListener('change', e => this.populateSubjectActivities(e.target.value));

            // add analyze button
            this.analyzeBtnDiv = this.dbDiv.appendChild(document.createElement('div'));
            this.analyzeBtnDiv.setAttribute('class', 'dbSelectDiv');
            this.analyzeBtn = this.analyzeBtnDiv.appendChild(document.createElement('button'));
            this.analyzeBtn.setAttribute('type', 'button');
            this.analyzeBtn.innerHTML = 'Analyze';
            this.analyzeBtn.addEventListener('click', () => {
                this.resetViewManager();
                this.dbDiv.style.display = 'none';
                this.loadingDiv.style.display = 'block';
            });

            // add close button
            const dbCloseBtnDiv = this.dbDiv.appendChild(document.createElement('div'));
            dbCloseBtnDiv.setAttribute('class', 'close-container');
            this.dbCloseBtn = dbCloseBtnDiv.appendChild(document.createElement('a'));
            this.dbCloseBtn.setAttribute('href', '#');
            this.dbCloseBtn.setAttribute('class', 'close');
            this.dbCloseBtn.setAttribute('id', 'db-close-btn');
            this.dbCloseBtn.addEventListener('click', () => this.dbDiv.style.display = 'none');
        });
    }

}