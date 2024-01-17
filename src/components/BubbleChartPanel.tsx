import React from 'react';
import BubbleChart from './BubbleChart';
import {BubbleChartOptions, ParsedSeriesRecord, TreeRecord} from 'types';
import {DataFrame, Field, FieldType, PanelProps, getValueFormat, reduceField} from '@grafana/data';
import _ from 'lodash';

export const BubbleChartPanel = ({width, height, data, options}: PanelProps<BubbleChartOptions>) => {
  const parseSeries = (series: DataFrame[]): ParsedSeriesRecord[] => {
    console.log('parseSeries', series);

    let parsedSeries: ParsedSeriesRecord[] = _.map(series, (serieFrame: DataFrame, i) => {
      const valueFields: Field[] = [];
      for(const aField of serieFrame.fields) {
        if(aField.type === FieldType.number) {
          valueFields.push(aField);
        }
      }

      let stats = options.stat;
      let reducerStat;

      switch(stats) {
        case 'min':
          reducerStat = 'min';
          break;
        case 'max':
          reducerStat = 'max';
          break;
        case 'avg':
          reducerStat = 'mean';
          break;
        case 'total':
          reducerStat = 'sum';
          break;
        case 'current':
          reducerStat = 'first';
          break;
        default:
          reducerStat = 'sum';
          break;
      }

      const formattedFields: ParsedSeriesRecord[] = [];
      for(const valueField of valueFields) {
        const standardCalcs = reduceField({field: valueField!, reducers: ['bogus']});
        let operatorValue = standardCalcs[reducerStat];
        const result = getValueFormat(options.unit)(operatorValue, 2, undefined, undefined);
        let aliases = [valueField.name];
        if (options.groupBy === "Name") {
          aliases = serieFrame.name?.split(options.groupSeparator) || [valueField.name];
        } else if (options.groupBy === "Label") {
          if (options.groupLabels === undefined || options.groupLabels.length === 0) {
            aliases = [valueField.name];
          } else {
            aliases = options.groupLabels.map((label: string) => valueField.labels?.[label] || '');
          }
        }
        formattedFields.push({
          name: serieFrame.name || valueField.name,
          aliases: aliases,
          value: result.text
        });
      }
      return formattedFields[0];
    });
    return _.filter(parsedSeries, (record: ParsedSeriesRecord) => record !== undefined);
  };

  const parseSeriesToJSON = (): TreeRecord => {
    const tree: TreeRecord = {name: 'BubbleChart', children: []};
    const parsedSeries: ParsedSeriesRecord[] = parseSeries(data.series);

    _.forEach(parsedSeries, (record: ParsedSeriesRecord) => {
      createRecurseTree(tree, record.aliases, record);
    });

    return tree;
  };

  const createRecurseTree = (tree: TreeRecord, aliases: string[], record: ParsedSeriesRecord) => {
    if(aliases.length === 0) {return; };
    const alias = aliases[0];
    let group = _.find(tree.children, (r) => r.name === alias);

    if(group === undefined) {
      if(aliases.length === 1) {
        group = {name: alias};
      } else {
        group = {name: alias, children: []};
      }
      tree.children!.push(group);
    }

    if(aliases.length === 1) {
      group.value = Number(record.value);
    }

    aliases.shift();
    createRecurseTree(group, aliases, record);
  };

  const bubbleChartData: TreeRecord = parseSeriesToJSON();

  let bubbleChartWidth = width;
  let bubbleChartHeight = height;
  bubbleChartWidth = bubbleChartHeight = Math.min(bubbleChartWidth, bubbleChartHeight);

  return (
    <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <BubbleChart data={bubbleChartData} width={bubbleChartWidth} height={bubbleChartHeight} opt={options} />
    </div>
  );
};
