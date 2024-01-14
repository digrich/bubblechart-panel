import React, {useEffect, useRef, useState} from 'react';
import {BubbleChartLabels, BubbleChartProps, CircleData, TreeRecord} from 'types';
import {Tooltip as ReactTooltip} from 'react-tooltip';
import * as d3 from 'd3';
import {formattedValueToString, getValueFormat} from '@grafana/data';
import {Selection} from 'd3-selection';
import {} from 'd3-hierarchy';
import * as chromatic from 'd3-scale-chromatic';
import {config} from '@grafana/runtime';

const BubbleChart: React.FC<BubbleChartProps> = ({data, width, height, opt}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if(data.children?.length === 0) {
      return;
    }

    const renderData = () => {
      const defaultFonts = '"Helvetica Neue", Helvetica, Arial, sans-serif';
      const defaultShadow = '0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 -1px 0 #fff';
      const mergedOpt = {
        textfont: opt.textfont?.trim() || defaultFonts,
        textanchor: opt.textanchor?.trim() || 'middle',
        textshadow: opt.textshadow?.trim() || defaultShadow,
        bubbleChartLabels: opt.displayLabels || [],

        colorScheme: opt.colorSchemeParams?.colorScheme?.trim() || 'Group',
        thresholds: parseThresholds(opt.colorSchemeParams?.thresholds?.trim() || '50,80'),
        gradientThresholds: parseThresholds(opt.colorSchemeParams?.gradientThresholds?.trim() || '0,100'),

        thresholdColors: (opt.colorSchemeParams?.thresholdColors ?? []).length > 0
          ? opt.colorSchemeParams?.thresholdColors : ["rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
        gradientColors: (opt.colorSchemeParams?.gradientColors ?? []).length > 0
          ? opt.colorSchemeParams?.gradientColors : ['red', 'green'],
        groupDepthColors: (opt.colorSchemeParams?.groupDepthColors ?? []).length > 0
          ? opt.colorSchemeParams?.groupDepthColors : ["hsl(152,80%,80%)", "hsl(228,30%,40%)"],

        unit: opt.unit?.trim() || 'short',
        decimals: opt.decimals,
        valueFormatFunc: formattedValueToString,
        bgColor: config.bootData.user.lightTheme ? 'rgb(230,230,230)' : 'rgb(38,38,38)'
      };
      function parseThresholds(thresholds: string): number[] {
        return thresholds.split(',').map((strValue: string) => Number(strValue.trim()));
      }

      const svgElement = svgRef.current;
      const svgSelection = d3.select(svgElement);

      // Reset the svg selection.
      svgSelection.selectAll("*").remove();

      const bgColor = mergedOpt.bgColor;
      const margin = 20;
      const diameter = + svgSelection.attr("height");
      const g = svgSelection.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      const groupDepthColor = d3.scaleLinear<string>()
        .domain([-1, 5])
        .range(mergedOpt.groupDepthColors)
        .interpolate(d3.interpolateHcl as any);

      const gradientColor = d3.scaleLinear<string>()
        .domain(mergedOpt.gradientThresholds)
        .range(mergedOpt.gradientColors);

      const colorPalette = chromatic.schemeCategory10;
      const uniqueColor = d3.scaleOrdinal().range(colorPalette);

      const pack = d3.pack()
        .size([diameter - margin, diameter - margin])
        .padding(2);

      // Process the data to have a hierarchy structure;
      const root: d3.HierarchyCircularNode<TreeRecord> = d3.hierarchy(data)
        .sum((d: TreeRecord) => {
          return d.value || 1;
        })
        .sort((a: d3.HierarchyNode<TreeRecord>, b: d3.HierarchyNode<TreeRecord>) => {
          return (b.data.value || 1) - (a.data.value || 1);
        })
        .each((d: d3.HierarchyNode<TreeRecord>) => {
          // if(d.data.name) {
          //   d.label = d.data.name;
          //   d.id = d.data.name.toLowerCase().replace(/ |\//g, "-");
          // }
        }) as d3.HierarchyCircularNode<TreeRecord>;;

      // Pass the data to the pack layout to calculate the distribution.
      const nodes = (pack(root as d3.HierarchyNode<unknown>) as d3.HierarchyCircularNode<TreeRecord>).descendants();
      let focus: any, view: d3.ZoomView;
      const circle = createCircles(g, nodes);
      const text = createTexts(g, nodes);

      const node = g.selectAll("circle, text");
      zoomTo([root.x, root.y, root.r * 2 + margin]);

      function zoom(d: d3.HierarchyCircularNode<TreeRecord>) {
        focus = d;
        d3.transition<MouseEvent>()
          .duration((event as MouseEvent).altKey ? 7500 : 750)
          .tween("zoom", function(d) {
            let i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
            return function(t) {
              zoomTo(i(t));
            };
          });
      };

      function zoomTo(v: d3.ZoomView) {
        let k = diameter / v[2];
        view = v;
        node?.attr("transform", (d: any) =>
          isNaN(d.x) ? "translate(0,0)" :
            "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")");
        circle.attr("r", (d: any) => isNaN(d.r) ? 0.5 : ((d.r <= 0 ? 1 : d.r) * k));
        text
        .attr("dy", ".35em")
        .style("font-size", function(d: d3.HierarchyCircularNode<TreeRecord>) {
          const textElement = d3.select(this as SVGTextElement);
          let computedTextLength: number = textElement.node()?.getComputedTextLength() ?? 0;
          computedTextLength = getComputedTextFontSize(computedTextLength, d, k);
          return computedTextLength + "px";
        })
        .style("display", function(d: d3.HierarchyCircularNode<TreeRecord>) {
          const textElement = d3.select(this as SVGTextElement);
          const computedTextLength: number = textElement.node()?.getComputedTextLength() ?? 0;
          const maxTextWidth = d.r * k * 2; // Maximum allowed width within the circle

          // Check if text width exceeds the available space
          return computedTextLength > maxTextWidth ? "none" : "block";
        })
        ;
      };

      /**
       * Returns the color for a circle based on the provided data.
       * @param d - The data for the circle.
       * @returns The color value for the circle.
       */
      function getCircleColor(d: d3.HierarchyCircularNode<TreeRecord>): string {
        let newVal = Number(d.data.value);
        if(mergedOpt.colorScheme === 'Group') {
          return String(groupDepthColor(d.depth));
        } else if(mergedOpt.colorScheme === 'Threshold' && mergedOpt.thresholds.length > 0) {
          if(d.children) {
            return bgColor;
          } else {
            for(let i = mergedOpt.thresholds.length;i > 0;i--) {
              if(newVal >= mergedOpt.thresholds[i - 1]) {
                return mergedOpt.thresholdColors[i];
              }
            }
            return mergedOpt.thresholdColors[0];
          }
        } else if(mergedOpt.colorScheme === 'Gradient') {
          return d.children ? bgColor : String(gradientColor(Number(d.value)));
        } else if(mergedOpt.colorScheme === 'Unique') {
          let color: string = d.children ? bgColor : uniqueColor(String(d.value)) as string;
          return color;
        }
        return 'green';
      }

      function getTooltipText(d: d3.HierarchyCircularNode<TreeRecord>): string {
        let toolTipCell = '<div data-testid="series-icon" style="vertical-align: middle; background:' + getCircleColor(d) + ';width: 14px;height: 4px;border-radius: 9999px;display: inline-block;margin-right: 8px;"></div>';
        const tooltipContent = d === undefined
          ? toolTipCell + ''
          : toolTipCell + '  <strong>' + d.data.name + (!d.children || d.children.length === 0 ? ('</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + formatValue(d.data.value) + '</span>') : ('</strong>'));

        return tooltipContent;
      }

      /**
       * Formats the given value based on the provided format function.
       * @param value - The value to be formatted.
       * @param opt - The options object.
       * @returns The formatted value.
       */
      function formatValue(value: any): string {
        let formattedValue = value.toString();
        if(mergedOpt.unit?.length || mergedOpt.decimals != null) {
          const fmt = getValueFormat(mergedOpt.unit ?? 'short');

          if(!Number.isNaN(value)) {
            formattedValue = formattedValueToString(fmt(value, mergedOpt.decimals));
          }
        }
        return formattedValue;
      }

      // ...
      function createCircles(g: Selection<SVGGElement, unknown, null, undefined>,
        nodes: Array<d3.HierarchyCircularNode<TreeRecord>>):
        Selection<SVGCircleElement, d3.HierarchyCircularNode<TreeRecord>, SVGGElement, undefined> {
        const circle = g.selectAll<SVGCircleElement, CircleData>("circle")
          .data(nodes)
          .enter()
          .append("circle")
          .attr("class", (d: d3.HierarchyCircularNode<TreeRecord>) => d.parent ? (d.children ? "node" : "node node--leaf") : "node node--root")
          .style("fill", (d: d3.HierarchyCircularNode<TreeRecord>) => getCircleColor(d))
          .attr("id", (d: d3.HierarchyCircularNode<TreeRecord>) => d.name)
          .attr("r", (d: d3.HierarchyCircularNode<TreeRecord>) => (d.r && d.r > 0 ? d.r : 1))
          .attr('data-tooltip-id', "my-tooltip")
          .attr('data-tooltip-html', (d) => getTooltipText(d))
          .on("click", (event: MouseEvent, d: d3.HierarchyCircularNode<TreeRecord>) => {
            if(focus !== d) {
              zoom(d);
              event.stopPropagation();
            }
          })
          .on("mouseover", (event: MouseEvent, d: d3.HierarchyCircularNode<TreeRecord>) => {
            setIsOpen(true);
          })
          .on("mouseout", (event: MouseEvent, d: d3.HierarchyCircularNode<TreeRecord>) => {
            setIsOpen(false);
          });
        return circle;
      }

      function createTexts(g: Selection<SVGGElement, unknown, null, undefined>,
        nodes: Array<d3.HierarchyCircularNode<TreeRecord>>):
        Selection<SVGTextElement, d3.HierarchyCircularNode<TreeRecord>, SVGGElement, undefined> {
        const text = g.selectAll<SVGTextElement, CircleData>("text")
          .data(nodes)
          .enter()
          .append("text")
          .attr("font", mergedOpt.textfont)
          .attr("text-anchor", mergedOpt.textanchor)
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .html((d: d3.HierarchyCircularNode<TreeRecord>) => getText(d))
          .style("pointer-events", "none")
          .style("opacity", (d: d3.HierarchyCircularNode<TreeRecord>) => d.children ? 0.0 : 1)
          //.style("display", (d: d3.HierarchyCircularNode<TreeRecord>) => mergedOpt.displayLabel ? "inline" : "none")
          .style("font-size", function(d: d3.HierarchyCircularNode<TreeRecord>) {
            const textElement = d3.select(this as SVGTextElement);
            let computedTextLength: number = textElement.node()?.getComputedTextLength() ?? 0;
            computedTextLength = getComputedTextFontSize(computedTextLength, d, 2);
            return computedTextLength + "px";
          })
          ;
        return text;
      }

      function getText(d: d3.HierarchyCircularNode<TreeRecord>): string {
        let textContent = "";

        const hasName = mergedOpt.bubbleChartLabels.includes(BubbleChartLabels.Name);
        const hasValue = mergedOpt.bubbleChartLabels.includes(BubbleChartLabels.Value);

        if (hasName) {
          textContent += d.data.name;
        }
        if (hasName && hasValue) {
          textContent += ":  ";
        }
        if (hasValue && d.data.value !== undefined) {
          textContent += formatValue(d.data.value);
        }
        // if (hasName) {
        //     textContent += `<tspan>${d.data.name}</tspan>`;
        // }
        // if (hasName && hasValue) {
        //     textContent += "<tspan dy='2em'></tspan>"; // Add a line break using dy attribute
        // }
        // if (hasValue && d.data.value !== undefined) {
        //     textContent += `<tspan>${formatValue(d.data.value)}</tspan>`;
        // }
        
        console.log(textContent);
        return textContent;
      }

      function getComputedTextFontSize(textLength: any, d: d3.HierarchyCircularNode<TreeRecord>, k: number): number {
        if(d === root) {
          return Math.round(Math.max(0.5, d.children ? (d.r / 4) : (Math.min(2 * d.r, (2 * d.r - 8) / textLength * 10))));
        } else {
          return Math.round(Math.max(0.5,
            (d.children ? (d.r / 4) : (k * d.r / 8))));
        };
      }
    };

    renderData(); // Initial render
  }, [opt, data, width, height]);

  return (
    <div>
      <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} id='BubbleChart'>
      </svg>
      <ReactTooltip id='my-tooltip' isOpen={isOpen} />
    </div>
  );
};

export default BubbleChart;
