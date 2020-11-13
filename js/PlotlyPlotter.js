import {MathUtils} from "./vendor/three.js/build/three.module.js";
import {range} from "./JSHelpers.js";

export class PlotlyPlotter {
    constructor(rotations, realAxialRot, poeDiv, eaDiv, axialRotDiv, plotMethodNames, onClick, onHover, onUnhover, plotSelectorDiv) {
        this.rotations = rotations;
        this.realAxialRot = realAxialRot;
        this.poeDiv = poeDiv;
        this.eaDiv = eaDiv;
        this.axialRotDiv = axialRotDiv;
        this.plotSelectorDiv = plotSelectorDiv;
        this.plotMethodNames = plotMethodNames;
        this.onClick = onClick;
        this.onHover = onHover;
        this.onUnhover = onUnhover;
        this.addPlotSelector();
        this.prepareData();
        this.commonPlotLayout();
        this.createPlots();
    }

    addPlotSelector() {
        const plots = new Map([
            ['Plane of Elevation', this.poeDiv.id],
            ['Angle of Elevation', this.eaDiv.id],
            ['Axial Rotation', this.axialRotDiv.id],
        ]);

        const selector = this.plotSelectorDiv.appendChild(document.createElement('select'));
        selector.addEventListener('change', e => {
            plots.forEach((div_id, title) => {
                document.getElementById(div_id).style.display = (div_id === e.target.value) ? 'block' : 'none';
            });
        });

        plots.forEach((div_id, title) => {
            const option = selector.appendChild(document.createElement('option'));
            option.setAttribute('value', div_id);
            option.innerHTML = title;
            if (title === 'Axial Rotation') {
                option.setAttribute('selected', 'selected');
            }
        });
    }

    prepareData() {
        // get poe angles
        this.poe = new Map([['HUM_EULER_YXY', []], ['HUM_EULER_XZY', []], ['HUM_SWING_TWIST', []]]);
        this.rotations.get('HUM_EULER_YXY').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[0].angle);
            this.poe.get('HUM_EULER_YXY').push(angle);
            this.poe.get('HUM_SWING_TWIST').push(angle);
        });
        this.rotations.get('HUM_EULER_XZY').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[1].angle);
            this.poe.get('HUM_EULER_XZY').push(angle);
        });

        // get ea angles
        this.ea = new Map([['HUM_EULER_YXY', []], ['HUM_EULER_XZY', []], ['HUM_SWING_TWIST', []]]);
        this.rotations.get('HUM_EULER_YXY').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[1].angle);
            this.ea.get('HUM_EULER_YXY').push(angle);
            this.ea.get('HUM_SWING_TWIST').push(angle);
        });
        this.rotations.get('HUM_EULER_XZY').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[0].angle);
            this.ea.get('HUM_EULER_XZY').push(angle);
        });

        // get axial rotation angle
        this.axialRot = new Map([['HUM_EULER_YXY', []], ['HUM_EULER_XZY', []], ['HUM_SWING_TWIST', []]]);
        this.rotations.get('HUM_EULER_YXY').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[2].angle);
            this.axialRot.get('HUM_EULER_YXY').push(angle);
        });
        this.rotations.get('HUM_EULER_XZY').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[2].angle);
            this.axialRot.get('HUM_EULER_XZY').push(angle);
        });
        this.rotations.get('HUM_SWING_TWIST').forEach(rotation => {
            const angle = MathUtils.radToDeg(rotation[1].angle);
            this.axialRot.get('HUM_SWING_TWIST').push(angle);
        });
        this.axialRot.set('HUM_REAL_AXIAL', this.realAxialRot.map(rot => MathUtils.radToDeg(rot)));


        // frame numbers
        this.frameNums = range(this.poe.get('HUM_EULER_YXY').length).map(val => val + 1);
    }

    commonPlotLayout() {
        this.layout = {
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

    createPlots() {
        const plotConfigs = [
            {
                title: 'Plane of Elevation',
                traj_data: this.poe,
                div: this.poeDiv
            },

            {
                title: 'Angle of Elevation',
                traj_data: this.ea,
                div: this.eaDiv
            },

            {
                title: 'Axial Rotation',
                traj_data: this.axialRot,
                div: this.axialRotDiv
            }
        ];

        plotConfigs.forEach(plotConfig => {
            const traces = Array.from(plotConfig.traj_data, ([method_name, data]) => {
                return {x: this.frameNums, y: data, type: 'scatter', name: this.plotMethodNames.get(method_name)}
            });
            const layout = JSON.parse(JSON.stringify(this.layout));
            layout.title = plotConfig.title;

            Plotly.newPlot(plotConfig.div.id, traces, layout, {scrollZoom: true, responsive: true, displaylogo: false});
            plotConfig.div.on('plotly_click', this.onClick)
                .on('plotly_hover', this.onHover)
                .on('plotly_unhover', this.onUnhover);
        });
    }
}