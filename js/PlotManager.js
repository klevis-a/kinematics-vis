import {MathUtils} from "./vendor/three.js/build/three.module.js";
import {range} from "./JSHelpers.js";
import {realAxialRotation} from "./RotDecompositions.js";
import {HUMERUS_BASE} from "./RotationHelper.js";

export class PlotManager {
    constructor(rotationHelper, onClick, onHover, onUnhover, plotContainerDiv, plotSelectorDiv, defaultPlot, humerusBase=HUMERUS_BASE.TORSO) {
        this.setHumerusSpec(humerusBase);
        this.rotationHelper = rotationHelper;
        this.plotContainerDiv = plotContainerDiv;
        this.plotSelectorDiv = plotSelectorDiv;
        this.onClick = onClick;
        this.onHover = onHover;
        this.onUnhover = onUnhover;
        this.frameNums = range(this.rotationHelper.trajectory.NumFrames).map(val => val + 1);
        this.plotMap = new Map();
        this.defaultPlot = defaultPlot;
        this.humerusBasePlots = new Map();

        this.plotNames = new Map([
            ['HUM_EULER_YXY', "ISB: yx'y''"],
            ['HUM_EULER_XZY', "Phadke: xz'y''"],
            ['HUM_SWING_TWIST', 'Swing Twist'],
            ['TRUE_AXIAL_ROTATION', 'True Axial Rotation'],
            ['SCAP_EULER_YXZ', "ISB: yx'z''"]
        ]);

        this.prepareData();
        this.createPlots();
        this.addPlotSelector();
    }

    setHumerusSpec(humerusBase) {
        switch (humerusBase) {
            case HUMERUS_BASE.TORSO:
                this.humerusSpec = 'th';
                break;
            case HUMERUS_BASE.SCAPULA:
                this.humerusSpec = 'gh';
                break;
            default:
                this.humerusSpec = 'th';
        }
    }

    changeHumerusBase(humerusBase) {
        this.setHumerusSpec(humerusBase);
        this.humerusBasePlots.forEach((plotConfig, view_id) => Plotly.react(view_id, plotConfig.traces(), plotConfig.layout(),
            {scrollZoom: true, responsive: true, displaylogo: false}));
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
        const layout = this.poeLayout();
        this.createPlot('poe', this.poeTraces(), layout, layout.title);
        this.humerusBasePlots.set('poe', {traces: () => this.poeTraces(), layout: () => this.poeLayout()});
    }

    poeTraces() {
        return [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: this.plotNames.get('HUM_EULER_YXY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[1], type: 'scatter', name: this.plotNames.get('HUM_EULER_XZY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: this.plotNames.get('HUM_SWING_TWIST')}
        ];
    }

    poeLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Humerus Plane of Elevation';
        return layout;
    }

    eaPlot() {
        const layout = this.eaLayout();
        this.createPlot('ea', this.eaTraces(), layout, layout.title);
        this.humerusBasePlots.set('ea', {traces: () => this.eaTraces(), layout: () => this.eaLayout()});
    }

    eaLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Humerus Angle of Elevation';
        return layout;
    }

    eaTraces() {
        return [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: this.plotNames.get('HUM_EULER_YXY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[0], type: 'scatter', name: this.plotNames.get('HUM_EULER_XZY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: this.plotNames.get('HUM_SWING_TWIST')}
        ];
    }

    axialRotPlot() {
        const layout = this.axialRotLayout();
        this.createPlot('axialRot', this.axialRotTraces(), layout, layout.title);
        this.humerusBasePlots.set('axialRot', {traces: () => this.axialRotTraces(), layout: () => this.axialRotLayout()});
    }

    axialRotTraces() {
        return [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[2], type: 'scatter', name: this.plotNames.get('HUM_EULER_YXY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[2], type: 'scatter', name: this.plotNames.get('HUM_EULER_XZY')},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_SWING_TWIST'), type: 'scatter', name: this.plotNames.get('HUM_SWING_TWIST')},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
    }

    axialRotLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Humerus Axial Rotation';
        return layout;
    }

    humerusIsbPlot() {
        const layout = this.humerusIsbLayout();
        this.createPlot('humerusIsb', this.humerusIsbTraces(), layout, layout.title);
        this.humerusBasePlots.set('humerusIsb', {traces: () => this.humerusIsbTraces(), layout: () => this.humerusIsbLayout()});
    }

    humerusIsbTraces() {
        return [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: 'Plane of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: 'Angle of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[2], type: 'scatter', name: 'Axial Rotation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
    }

    humerusIsbLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Humerus ' + this.plotNames.get('HUM_EULER_YXY');
        return layout;
    }

    humerusPhadkePlot() {
        const layout = this.humerusPhadkeLayout();
        this.createPlot('humerusPhadke', this.humerusPhadkeTraces(), layout, layout.title);
        this.humerusBasePlots.set('humerusPhadke', {traces: () => this.humerusPhadkeTraces(), layout: () => this.humerusPhadkeLayout()});
    }

    humerusPhadkeTraces() {
        return [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[0], type: 'scatter', name: 'Angle of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[1], type: 'scatter', name: 'Angle of Flexion/Horizontal Abd/Add'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_XZY')[2], type: 'scatter', name: 'Axial Rotation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
    }

    humerusPhadkeLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Humerus ' + this.plotNames.get('HUM_EULER_XZY');
        return layout;
    }

    humerusSwingTwistPlot() {
        const layout = this.humerusSwingTwistLayout();
        this.createPlot('humerusSwingTwist', this.humerusSwingTwistTraces(), layout, layout.title);
        this.humerusBasePlots.set('humerusSwingTwist', {traces: () => this.humerusSwingTwistTraces(), layout: () => this.humerusSwingTwistLayout()});
    }

    humerusSwingTwistTraces() {
        return [
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[0], type: 'scatter', name: 'Plane of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_EULER_YXY')[1], type: 'scatter', name: 'Angle of Elevation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('HUM_SWING_TWIST'), type: 'scatter', name: 'Axial Rotation'},
            {x: this.frameNums, y: this[this.humerusSpec].get('TRUE_AXIAL_ROTATION'), type: 'scatter', name: this.plotNames.get('TRUE_AXIAL_ROTATION')}
        ];
    }

    humerusSwingTwistLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Humerus ' + this.plotNames.get('HUM_SWING_TWIST');
        return layout;
    }

    scapulaPlot() {
        const layout =  this.scapulaLayout();
        this.createPlot('scap', this.scapulaTraces(), layout, layout.title);
    }

    scapulaTraces() {
        return [
            {x: this.frameNums, y: this.st.get('SCAP_EULER_YXZ')[0], type: 'scatter', name: 'Retraction(-)/Protraction(+)'},
            {x: this.frameNums, y: this.st.get('SCAP_EULER_YXZ')[1], type: 'scatter', name: 'Lateral(-)/Medial(+) Rotation'},
            {x: this.frameNums, y: this.st.get('SCAP_EULER_YXZ')[2], type: 'scatter', name: 'Anterior(-)/Posterior(+) Tilt'}
        ];
    }

    scapulaLayout() {
        const layout = this.commonPlotLayout();
        layout.title = 'Scapula ' + this.plotNames.get('SCAP_EULER_YXZ');
        return layout;
    }

    createPlots() {
        this.poePlot();
        this.eaPlot();
        this.axialRotPlot();
        this.humerusIsbPlot();
        this.humerusPhadkePlot();
        this.humerusSwingTwistPlot();
        this.scapulaPlot();
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
