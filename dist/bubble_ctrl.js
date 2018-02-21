'use strict';

System.register(['app/plugins/sdk', './external/d3.v3.min', 'lodash', 'jquery', 'app/core/time_series', './external/jquery.tipsy.min.js', './css/jquery.tipsy.min.css!', './css/bubble-panel.css!', './external/bubble', 'app/core/config', 'app/core/utils/kbn'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, d3v3, _, $, TimeSeries, config, kbn, _createClass, panelDefaults, BubbleChartCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_externalD3V3Min) {
            d3v3 = _externalD3V3Min;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_jquery) {
            $ = _jquery.default;
        }, function (_appCoreTime_series) {
            TimeSeries = _appCoreTime_series.default;
        }, function (_externalJqueryTipsyMinJs) {}, function (_cssJqueryTipsyMinCss) {}, function (_cssBubblePanelCss) {}, function (_externalBubble) {}, function (_appCoreConfig) {
            config = _appCoreConfig.default;
        }, function (_appCoreUtilsKbn) {
            kbn = _appCoreUtilsKbn.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            panelDefaults = {
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

            _export('BubbleChartCtrl', BubbleChartCtrl = function (_MetricsPanelCtrl) {
                _inherits(BubbleChartCtrl, _MetricsPanelCtrl);

                function BubbleChartCtrl($scope, $injector) {
                    _classCallCheck(this, BubbleChartCtrl);

                    var _this = _possibleConstructorReturn(this, (BubbleChartCtrl.__proto__ || Object.getPrototypeOf(BubbleChartCtrl)).call(this, $scope, $injector));

                    _.defaultsDeep(_this.panel, panelDefaults);

                    _this.containerDivId = 'container_' + _this.panel.id;
                    _this.panelContainer = null;
                    _this.panel.svgContainer = null;
                    _this.panel.svgBubbleId = 'svg_' + _this.panel.id;

                    _this.events.on('render', _this.onRender.bind(_this));
                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    _this.events.on('data-received', _this.onDataReceived.bind(_this));
                    _this.events.on('data-error', _this.onDataError.bind(_this));
                    _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
                    return _this;
                }

                _createClass(BubbleChartCtrl, [{
                    key: 'onDataReceived',
                    value: function onDataReceived(dataList) {
                        this.series = dataList.map(this.seriesHandler.bind(this));
                        this.render();
                    }
                }, {
                    key: 'seriesHandler',
                    value: function seriesHandler(seriesData) {
                        var series = new TimeSeries({
                            datapoints: seriesData.datapoints,
                            alias: seriesData.target
                        });

                        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
                        return series;
                    }
                }, {
                    key: 'parseSeries',
                    value: function parseSeries(series) {
                        var _this2 = this;

                        return _.map(this.series, function (serie, i) {
                            return {
                                name: serie.alias,
                                aliases: serie.alias.split(_this2.panel.groupSeperator),
                                size: serie.valueFormater(serie.stats[_this2.panel.valueName], _this2.panel.decimal)
                            };
                        });
                    }
                }, {
                    key: 'parseSeriesToJSON',
                    value: function parseSeriesToJSON() {
                        var _this3 = this;

                        var tree = { "name": this.panel.title, "children": [] };
                        this.parsedSeries = this.parseSeries(this.series);
                        _.forEach(this.parsedSeries, function (record) {
                            _this3.createRecurseTree(tree, record.aliases, record);
                        });
                        return tree;
                    }
                }, {
                    key: 'createRecurseTree',
                    value: function createRecurseTree(tree, aliases, record) {
                        if (aliases.length === 0) return;
                        var alias = aliases[0];
                        var group = _.find(tree.children, function (r) {
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
                }, {
                    key: 'recurseTree',
                    value: function (_recurseTree) {
                        function recurseTree(_x, _x2, _x3) {
                            return _recurseTree.apply(this, arguments);
                        }

                        recurseTree.toString = function () {
                            return _recurseTree.toString();
                        };

                        return recurseTree;
                    }(function (tree, newKey, newId) {
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
                        if (child) {
                            // recursively process on child
                            recurseTree(child, newKey, newId);
                        } else {
                            // no child, so just fill the tree
                            tree[newKey] = { _id: newId };
                        }
                    })
                }, {
                    key: 'onDataError',
                    value: function onDataError() {
                        this.series = [];
                        this.render();
                    }
                }, {
                    key: 'setContainer',
                    value: function setContainer(container) {
                        this.panelContainer = container;
                        this.panel.svgContainer = container;
                    }
                }, {
                    key: 'onRender',
                    value: function onRender() {
                        //this.data = json_data;
                    }
                }, {
                    key: 'addBubbleChart',
                    value: function addBubbleChart() {
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
                        var svg = d3v3.select(this.panel.svgContainer).append("svg").attr("width", this.panelWidth).attr("height", this.panelHeight).attr("viewBox", '0,0,' + this.panelHeight + ',' + this.panelWidth).attr("id", this.panel.svgBubbleId);

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
                            bgColor: config.bootData.user.lightTheme ? 'rgb(230,230,230)' : 'rgb(38,38,38)'
                        };
                        this.bubble = new bubbleChart(svg, opt);
                        if (this.data) this.bubble.renderData(this.data);
                    }
                }, {
                    key: 'isNewDashboardLayout',
                    value: function isNewDashboardLayout() {
                        return this.panel.updateGridPos !== undefined;
                    }
                }, {
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Options', 'public/plugins/digrich-bubblechart-panel/editor.html', 2);
                        this.unitFormats = kbn.getUnitFormats();
                    }
                }, {
                    key: 'setUnitFormat',
                    value: function setUnitFormat(subItem) {
                        this.panel.format = subItem.value;
                        this.render();
                    }
                }, {
                    key: 'onPanelTeardown',
                    value: function onPanelTeardown() {
                        this.$timeout.cancel(this.nextTickPromise);
                    }
                }, {
                    key: 'invertColorOrder',
                    value: function invertColorOrder() {
                        var tmp = this.panel.thresholdColors[0];
                        this.panel.thresholdColors[0] = this.panel.thresholdColors[2];
                        this.panel.thresholdColors[2] = tmp;
                        this.render();
                    }
                }, {
                    key: 'getPanelHeight',
                    value: function getPanelHeight() {
                        //panel can have a fixed height via options
                        var height = this.panel.height || this.row.height || 250;
                        if (_.isString(height)) {
                            height = parseInt(height.replace('px', ''), 10);
                        }
                        return height;
                    }
                }, {
                    key: 'getPanelWidthBySpan',
                    value: function getPanelWidthBySpan() {
                        var viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                        // get the pixels of a span
                        var pixelsPerSpan = viewPortWidth / 12;
                        // multiply num spans by pixelsPerSpan
                        var trueWidth = Math.round(this.panel.span * pixelsPerSpan);
                        return trueWidth;
                    }
                }, {
                    key: 'link',
                    value: function link(scope, elem, attrs, ctrl) {
                        var gaugeByClass = elem.find('div#bubble-container');
                        gaugeByClass.append('<div id="' + ctrl.containerDivId + '"></div>');

                        var container = gaugeByClass[0].childNodes[1];
                        ctrl.setContainer(container);

                        function render() {
                            if (!ctrl.series) {
                                return;
                            }

                            ctrl.data = ctrl.parseSeriesToJSON();
                            ctrl.addBubbleChart();
                        }
                        this.events.on('render', function () {
                            render();
                            ctrl.renderingCompleted();
                        });
                    }
                }]);

                return BubbleChartCtrl;
            }(MetricsPanelCtrl));

            _export('BubbleChartCtrl', BubbleChartCtrl);

            BubbleChartCtrl.templateUrl = 'module.html';
        }
    };
});
//# sourceMappingURL=bubble_ctrl.js.map
