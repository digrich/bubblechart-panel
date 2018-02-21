import { MetricsPanelCtrl } from 'app/plugins/sdk';
import * as d3v3 from './external/d3.v3.min';
import _ from 'lodash';
import $ from 'jquery';
import TimeSeries from 'app/core/time_series';
import './external/jquery.tipsy.min.js';
import './css/jquery.tipsy.min.css!';
import './css/bubble-panel.css!';
import './external/bubble';
import config from 'app/core/config';
import kbn from 'app/core/utils/kbn';

const panelDefaults = {
    mode: 'time',
    bgColor: null,
    valueName: 'current',
    nullPointMode: 'connected',
    decimal: 2,
    format: 'short',
    colorScheme: 'Group',
    groupDepthColors: ["hsl(152,80%,80%)", "hsl(228,30%,40%)"],
    thresholds: "50,80",
    thresholdColors: ["green", "yellow", "red"],
    gradientThresholds: "50,80",
    gradientColors: ['red', 'green'],
    groupSeperator: ',',
    displayLabel: true,
    height: 400,
    gridPos: { x: 0, y: 0, w: 12, h: 11 }
};

export class BubbleChartCtrl extends MetricsPanelCtrl {

    constructor($scope, $injector) {
        super($scope, $injector);
        _.defaultsDeep(this.panel, panelDefaults);

        this.containerDivId = 'container_' + this.panel.id;
        this.panelContainer = null;
        this.panel.svgContainer = null;
        this.panel.svgBubbleId = 'svg_' + this.panel.id;

        this.events.on('render', this.onRender.bind(this));
        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('data-received', this.onDataReceived.bind(this));
        this.events.on('data-error', this.onDataError.bind(this));
        this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    }

    onDataReceived(dataList) {
        this.series = dataList.map(this.seriesHandler.bind(this));
        this.render();
    }

    seriesHandler(seriesData) {
        var series = new TimeSeries({
            datapoints: seriesData.datapoints,
            alias: seriesData.target
        });

        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
        return series;
    }

    parseSeries(series) {
        return _.map(this.series, (serie, i) => {
            return {
                name: serie.alias,
                aliases: serie.alias.split(this.panel.groupSeperator),
                size: serie.valueFormater(serie.stats[this.panel.valueName], this.panel.decimal)
            };
        });
    }

    parseSeriesToJSON() {
        var tree = { "name": this.panel.title, "children": [] };
        this.parsedSeries = this.parseSeries(this.series);
        _.forEach(this.parsedSeries, record => {
            this.createRecurseTree(tree, record.aliases, record);
        });
        return tree;
    }

    createRecurseTree(tree, aliases, record) {
        if (aliases.length === 0)
            return;
        var alias = aliases[0];
        var group = _.find(tree.children, function(r) {
            return r.name == alias;
        });
        if (group === undefined) {
            if (aliases.length == 1) {
                group = { "name": alias };
            } else {
                group = { "name": alias, "children": [] };
            }

            tree.children.push(group);
        }
        if (aliases.length == 1) {
            group.size = record.size;
        }
        aliases.shift();
        this.createRecurseTree(group, aliases, record);
    }

    recurseTree(tree, newKey, newId) {
        if (angular.element.isEmptyObject(tree)) {
            tree[newKey] = { _id: newId };
            return;
        }

        var child = null; // find current tree's child
        for (var key in tree) {
            if (key != '_id') {
                child = tree[key]; // found a child
                break;
            }
        }
        if (child) { // recursively process on child
            recurseTree(child, newKey, newId);
        } else { // no child, so just fill the tree
            tree[newKey] = { _id: newId };
        }
    }

    onDataError() {
        this.series = [];
        this.render();
    }

    /**
     * [setContainer description]
     * @param {[type]} container [description]
     */
    setContainer(container) {
        this.panelContainer = container;
        this.panel.svgContainer = container;
    }

    onRender() {
        //this.data = json_data;
    }

    addBubbleChart() {
        if ($('#' + this.panel.svgBubbleId).length) {
            $('#' + this.panel.svgBubbleId).remove();
        }

        var panelTitleOffset = 0;
        if (this.panel.title !== "") {
            panelTitleOffset = 25;
        }

        this.panelHeight = this.isNewDashboardLayout() ? this.panel.gridPos.h * 30 : this.getPanelHeight() - panelTitleOffset;
        this.panelWidth = this.isNewDashboardLayout() ? this.panel.gridPos.w * 30 : this.getPanelWidthBySpan();

        this.panelHeight = this.panelWidth = Math.min(this.panelHeight, this.panelWidth);
        var svg = d3v3.select(this.panel.svgContainer)
            .append("svg")
            .attr("width", this.panelWidth)
            .attr("height", this.panelHeight)
            .attr("viewBox", '0,0,' + this.panelHeight + ',' + this.panelWidth)
            .attr("id", this.panel.svgBubbleId);

        var opt = {
            colorScheme: this.panel.colorScheme,
            groupDepthColors: this.panel.groupDepthColors,
            thresholds: this.panel.thresholds,
            thresholdColors: this.panel.thresholdColors,
            gradientThresholds: this.panel.gradientThresholds,
            gradientColors: this.panel.gradientColors,
            displayLabel: this.panel.displayLabel,
            valueFormatFunc: kbn.valueFormats[this.panel.format],
            decimal: this.panelContainer.decimal,
            bgColor: config.bootData.user.lightTheme ?
                'rgb(230,230,230)' : 'rgb(38,38,38)'
        };
        this.bubble = new bubbleChart(svg, opt);
        if (this.data)
            this.bubble.renderData(this.data);
    }

    isNewDashboardLayout() {
        return this.panel.updateGridPos !== undefined;
    }

    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/digrich-bubblechart-panel/editor.html', 2);
        this.unitFormats = kbn.getUnitFormats();
    }

    setUnitFormat(subItem) {
        this.panel.format = subItem.value;
        this.render();
    }

    onPanelTeardown() {
        this.$timeout.cancel(this.nextTickPromise);
    }

    invertColorOrder() {
        var tmp = this.panel.thresholdColors[0];
        this.panel.thresholdColors[0] = this.panel.thresholdColors[2];
        this.panel.thresholdColors[2] = tmp;
        this.render();
    }

    getPanelHeight() {
        //panel can have a fixed height via options
        var height = this.panel.height || this.row.height || 250;
        if (_.isString(height)) {
            height = parseInt(height.replace('px', ''), 10);
        }
        return height;
    }

    // determine the width of a panel by the span and viewport
    getPanelWidthBySpan() {
        var viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        // get the pixels of a span
        var pixelsPerSpan = viewPortWidth / 12;
        // multiply num spans by pixelsPerSpan
        var trueWidth = Math.round(this.panel.span * pixelsPerSpan);
        return trueWidth;
    }

    link(scope, elem, attrs, ctrl) {
        var gaugeByClass = elem.find('div#bubble-container');
        gaugeByClass.append('<div id="' + ctrl.containerDivId + '"></div>');

        var container = gaugeByClass[0].childNodes[1];
        ctrl.setContainer(container);

        function render() {
            if (!ctrl.series) { return; }

            ctrl.data = ctrl.parseSeriesToJSON();
            ctrl.addBubbleChart();
        }
        this.events.on('render', () => {
            render();
            ctrl.renderingCompleted();
        });
    }
}

BubbleChartCtrl.templateUrl = 'module.html';