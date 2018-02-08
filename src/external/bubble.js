function bubbleChart(svg, opt) {
    defaultFonts = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    if (typeof opt.textfont === 'undefined') { opt.textfont = defaultFonts; }
    if (typeof opt.textanchor === 'undefined') { opt.textanchor = 'middle'; }
    defaultShadow = '0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 -1px 0 #fff';
    if (typeof opt.textshadow === 'undefined') { opt.textshadow = defaultShadow; }
    if (typeof opt.displayLabel === 'undefined') { opt.displayLabel = true }

    if (typeof opt.colorScheme === 'undefined') { opt.colorScheme = 'Group'; }

    if (typeof opt.groupDepthColors === 'undefined') { opt.groupDepthColors = ["hsl(152,80%,80%)", "hsl(228,30%,40%)"]; }

    if (typeof opt.thresholds === 'undefined' || opt.thresholds === '') { opt.thresholds = '50,80'; }

    opt.thresholds = opt.thresholds.split(',').map(function(strVale) {
        return Number(strVale.trim());
    });

    if (typeof opt.thresholdColors === 'undefined') {
        opt.thresholdColors = ["rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"];
    }
    if (typeof opt.gradientThresholds === 'undefined' || opt.gradientThresholds === '') { opt.gradientThresholds = '0,100'; }
    opt.gradientThresholds = opt.gradientThresholds.split(',').map(function(strVale) {
        return Number(strVale.trim());
    });

    if (typeof opt.gradientColors === 'undefined') { opt.gradientColors = ['red', 'green']; }

    var bgColor = opt.bgColor;
    var margin = 20;
    var format = d3v3.format(",d");
    var diameter = +svg.attr("width");
    var g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    // Remove all tooltips on new data.
    $("div[id=tipsy]").remove();

    var groupDepthCcolor = d3v3.scale.linear()
        .domain([-1, 5])
        .range(opt.groupDepthColors)
        .interpolate(d3v3.interpolateHcl);

    var gradientColor = d3v3.scale.linear()
        .domain(opt.gradientThresholds)
        .range(opt.gradientColors);

    var uniqueColor = d3v3.scale.category20();

    var pack = d3v3.layout.pack()
        .size([diameter - margin, diameter - margin])
        .value(function(d) { return d.size; })
        .padding(2);

    var focus, nodes, view, node, circle, text, title, root;

    function renderData(data) {
        root = data;

        focus = root,
            nodes = pack.nodes(root);

        circle = g.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("class", function(d) { return d.parent ? (d.children ? "node" : "node node--leaf") : "node node--root"; })
            .style("fill", function(d) {
                return getCircleColor(d);
            })
            .attr("id", function(d) { return d.name; })
            .attr("r", function(d) {
                return d.r <= 0 ? 1 : d.r;
            })
            .on("click", function(d) {
                if (focus !== d) {
                    zoom(d);
                    d3v3.event.stopPropagation();
                }
            })

        text = g.selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("font", opt.textfont)
            .attr("text-anchor", opt.textanchor)
            .style("pointer-events", "none")
            .style("opacity", function(d) { return d.children ? 0.0 : 1; })
            .style("display", function(d) { return opt.displayLabel ? "inline" : "none"; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.name;
            })
            .style("font-size", function(d) {
                d.textLength = this.getComputedTextLength();
                return getComputedTextFontSize(d.textLength, d, 2);
            })

        $('svg circle').tipsy({
            gravity: 'n',
            fade: true,
            html: true,
            title: function() {
                var d = this.__data__;
                var msg = d == undefined ? "" : "<strong>" + d.name + (!d.children || d.children.length === 0 ? (": </strong>" + formatValue(d.value) + "</span>") : ("</strong>"));
                return msg;
            }
        });
        node = g.selectAll("circle,text");
        svg.on("click", function() { zoom(root); });

        zoomTo([root.x, root.y, root.r * 2 + margin]);
    }

    function zoom(d) {
        var focus0 = focus;
        focus = d;
        var k = diameter / d.r / 2;
        var transition = d3v3.transition()
            .duration(d3v3.event.altKey ? 7500 : 750)
            .tween("zoom", function(d) {
                var i = d3v3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function(t) {
                    zoomTo(i(t));
                };
            });
    };

    function zoomTo(v) {
        var k = diameter / v[2];
        view = v;
        node.attr("transform", function(d) {
            return isNaN(d.x) ? "translate(0,0)" : "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function(d) {
            return isNaN(d.r) ? 0.5 : ((d.r <= 0 ? 1 : d.r) * k);
        });
        text.attr("dy", ".35em");
        text.text(function(d) { return d.name });
        text.style("font-size", function(d) {
            d.textLength = this.getComputedTextLength();
            return getComputedTextFontSize(d.textLength, d, k);
        });
    };

    function getComputedTextFontSize(textLength, d, k) {
        if (d == root) {
            return Math.round(Math.max(0.5, d.children ? (d.r / 4) : (Math.min(2 * d.r, (2 * d.r - 8) / d.textLength * 10)))) + "px";
        } else {
            return Math.round(Math.max(0.5,
                (d.children ? (d.r / 4) : (k * d.r / 8)))) + "px";
        };
    }

    function getCircleColor(d) {
        var newVal = d.value;
        if (opt.colorScheme === 'Group') {
            return groupDepthCcolor(d.depth);
        } else if (opt.colorScheme === 'Threshold' && opt.thresholds.length > 0) {
            if (d.children) {
                return bgColor;
            } else {
                for (var i = opt.thresholds.length; i > 0; i--) {
                    if (newVal >= opt.thresholds[i - 1]) {
                        return opt.thresholdColors[i];
                    }
                }
                return opt.thresholdColors[0];
            }
        } else if (opt.colorScheme === 'Gradient') {
            return d.children ? bgColor : gradientColor(d.value);
        } else if (opt.colorScheme === 'Unique') {
            return d.children ? bgColor : uniqueColor(d.value);
        }
    }

    function getDecimalsForValue(value) {
        if (_.isNumber(opt.decimal)) {
            return { decimals: opt.decimal, scaledDecimals: null };
        }

        var delta = value / 2;
        var dec = -Math.floor(Math.log(delta) / Math.LN10);

        var magn = Math.pow(10, -dec);
        var norm = delta / magn; // norm is between 1.0 and 10.0
        var size;

        if (norm < 1.5) {
            size = 1;
        } else if (norm < 3) {
            size = 2;
            // special case for 2.5, requires an extra decimal
            if (norm > 2.25) {
                size = 2.5;
                ++dec;
            }
        } else if (norm < 7.5) {
            size = 5;
        } else {
            size = 10;
        }

        size *= magn;

        // reduce starting decimals if not needed
        if (Math.floor(value) === value) { dec = 0; }

        var result = {};
        result.decimals = Math.max(0, dec);
        result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

        return result;
    }

    function formatValue(value) {
        var formatFunc = opt.valueFormatFunc;
        if (formatFunc) {
            var decimalInfo = getDecimalsForValue(value);
            return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        }
        return value;
    }

    return {
        renderData: renderData
    };
};