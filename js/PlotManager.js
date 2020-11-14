import {MathUtils} from "./vendor/three.js/build/three.module.js";
import {range} from "./JSHelpers.js";
import {realAxialRotation} from "./RotDecompositions.js";

export class PlotManager {
    constructor(rotationHelper, onClick, onHover, onUnhover, plotContainerDiv, plotSelectorDiv, defaultPlot, humerusSpec='th') {
        this.humerusSpec = humerusSpec;
        this.rotationHelper = rotationHelper;
        this.plotContainerDiv = plotContainerDiv;
        this.plotSelectorDiv = plotSelectorDiv;
        this.onClick = onClick;
        this.onHover = onHover;
        this.onUnhover = onUnhover;
        this.frameNums = range(this.rotationHelper.trajectory.NumFrames).map(val => val + 1);
        this.plotMap = new Map();
        this.defaultPlot = defaultPlot;

        this.plotNames = new Map([
            ['HUM_EULER_YXY', "ISB: yx'y''"],
            ['HUM_EULER_XZY', "Phadke: xz'y''"],
            ['HUM_SWING_TWIST', 'Swing Twist'],
            ['TRUE_AXIAL_ROTATION', 'True Axial Rotation']
        ]);

        this.prepareData();
        this.createPlots();
        this.addPlotSelector();
    }

    prepareData() {
        this.th = new Map();
        this.th.set('HUM_EULER_YXY', [[],[],[]]);
        this.th.set('HUM_EULER_XZY', [[],[],[]]);
        this.th.set('HUM_SWING_TWIST', []);
        this.gh = new Map();
        this.gh.set('HUM_EULER_YXY', [[],[],[]]);
        this.gh.set('HUM_EULER_XZY', [[],[],[]]);
        this.gh.set('HUM_SWING_TWIST', []);
        this.st = new Map();
        this.st.set('SCAP_EULER_YXZ', [[],[],[]]);

        for(let i=0; i<this.rotationHelper.trajectory.NumFrames; i++) {
            for(let j=0; j<3; j++) {
                this.th.get('HUM_EULER_YXY')[j].push(MathUtils.radToDeg(this.rotationHelper.th_rotations.get('HUM_EULER_YXY')[i][j].angle));
                this.th.get('HUM_EULER_XZY')[j].push(MathUtils.radToDeg(this.rotationHelper.th_rotations.get('HUM_EULER_XZY')[i][j].angle));
                this.gh.get('HUM_EULER_YXY')[j].push(MathUtils.radToDeg(this.rotationHelper.gh_rotations.get('HUM_EULER_YXY')[i][j].angle));
                this.gh.get('HUM_EULER_XZY')[j].push(MathUtils.radToDeg(this.rotationHelper.gh_rotations.get('HUM_EULER_XZY')[i][j].angle));
                this.st.get('SCAP_EULER_YXZ')[j].push(MathUtils.radToDeg(this.rotationHelper.st_rotations.get('SCAP_EULER_YXZ')[i][j].angle));
            }

            this.th.get('HUM_SWING_TWIST').push(MathUtils.radToDeg(this.rotationHelper.th_rotations.get('HUM_SWING_TWIST')[i][1].angle));
            this.gh.get('HUM_SWING_TWIST').push(MathUtils.radToDeg(this.rotationHelper.gh_rotations.get('HUM_SWING_TWIST')[i][1].angle));
        }

        this.th.set('TRUE_AXIAL_ROTATION', realAxialRotation(this.rotationHelper.th_quat).map(val => MathUtils.radToDeg(val)));
        this.gh.set('TRUE_AXIAL_ROTATION', realAxialRotation(this.rotationHelper.gh_quat).map(val => MathUtils.radToDeg(val)));
    }

    commonPlotLayout() {
        return  {
            xaxis: {
                title: {text: 'Frame Number', standoff: 0},
                automargin: true
            },
            yaxis: {
                title: {text: 'Angle (deg)', standoff: 5},
                automargin: true
            },
            showlegend: true,
            legend: {"orientation": "h"},
            margin: {l: 50, r: 50, t: 50, b: 50},
            hovermode: 'closest'
        };
    }

    createPlot(div_id, traces, layout, friendly_name) {
        const plotDiv = this.plotContainerDiv.appendChild(document.createElement('div'));
        plotDiv.setAttribute('class', 'plotDiv');
        plotDiv.setAttribute('id', div_id);
        Plotly.newPlot(div_id, traces, layout, {scrollZoom: true, responsive: true, displaylogo: false});
        plotDiv.on('plotly_click', this.onClick)
            .on('plotly_hover', this.onHover)
            .on('plotly_unhover', this.onUnhover);
        this.plotMap.set(div_id, friendly_name);
        plotDiv.style.display = (div_id === this.defaultPlot) ? 'block' : 'none';
    }

    poePlot() {
        const layout = this.commonPlotLayout();
        layout.title = 'Plane of Elevation';
        const traces = [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: this.plotNames.get('HUM_EULER_YXY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[1], type: 'scatter', name: this.plotNames.get('HUM_EULER_XZY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: this.plotNames.get('HUM_SWING_TWIST')}
        ];
        this.createPlot('poe', traces, layout, layout.title);
    }

    eaPlot() {
        const layout = this.commonPlotLayout();
        layout.title = 'Angle of Elevation';
        const traces = [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: this.plotNames.get('HUM_EULER_YXY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[0], type: 'scatter', name: this.plotNames.get('HUM_EULER_XZY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: this.plotNames.get('HUM_SWING_TWIST')}
        ];
        this.createPlot('ea', traces, layout, layout.title);
    }

    axialRotPlot() {
        const layout = this.commonPlotLayout();
        layout.title = 'Axial Rotation';
        const traces = [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[2], type: 'scatter', name: this.plotNames.get('HUM_EULER_YXY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[2], type: 'scatter', name: this.plotNames.get('HUM_EULER_XZY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_SWING_TWIST'), type: 'scatter', name: this.plotNames.get('HUM_SWING_TWIST')},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
        this.createPlot('axialRot', traces, layout, layout.title);
    }

    humerusIsbPlot() {
        const layout = this.commonPlotLayout();
        layout.title = this.plotNames.get('HUM_EULER_YXY');
        const traces = [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: 'Plane of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: 'Angle of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[2], type: 'scatter', name: 'Axial Rotation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
        this.createPlot('humerusIsb', traces, layout, layout.title);
    }

    humerusPhadkePlot() {
        const layout = this.commonPlotLayout();
        layout.title = this.plotNames.get('HUM_EULER_XZY');
        const traces = [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[0], type: 'scatter', name: 'Angle of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[1], type: 'scatter', name: 'Angle of Flexion/Horizontal Abd/Add'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[2], type: 'scatter', name: 'Axial Rotation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
        this.createPlot('humerusPhadke', traces, layout, layout.title);
    }

    humerusSwingTwistPlot() {
        const layout = this.commonPlotLayout();
        layout.title = this.plotNames.get('HUM_SWING_TWIST');
        const traces = [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: 'Plane of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: 'Angle of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_SWING_TWIST'), type: 'scatter', name: 'Axial Rotation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
        this.createPlot('humerusSwingTwist', traces, layout, layout.title);
    }

    createPlots() {
        this.poePlot();
        this.eaPlot();
        this.axialRotPlot();
        this.humerusIsbPlot();
        this.humerusPhadkePlot();
        this.humerusSwingTwistPlot();
    }

    addPlotSelector() {
        const selector = this.plotSelectorDiv.appendChild(document.createElement('select'));
        selector.addEventListener('change', e => {
            this.plotMap.forEach((title, div_id) => {
                document.getElementById(div_id).style.display = (div_id === e.target.value) ? 'block' : 'none';
            });
        });

        this.plotMap.forEach((title, div_id) => {
            const option = selector.appendChild(document.createElement('option'));
            option.setAttribute('value', div_id);
            option.innerHTML = title;
            if (div_id === this.defaultPlot) {
                option.setAttribute('selected', 'selected');
            }
        });
    }
}