import React, {useEffect, useState} from 'react';
import BubbleChart from './BubbleChart';
import {BubbleChartOptions, ParsedSeriesRecord, TreeRecord} from 'types';
import {DataFrame, Field, FieldType, LoadingState, PanelProps, getValueFormat, reduceField} from '@grafana/data';
import _ from 'lodash';

interface Props extends PanelProps<BubbleChartOptions> {}

export const BubbleChartPanel: React.FC<Props> = ({options, data, id, width, height, replaceVariables, fieldConfig }) => {
  let bubbleChartWidth = width;
  let bubbleChartHeight = height;
  bubbleChartWidth = bubbleChartHeight = Math.min(bubbleChartWidth, bubbleChartHeight);
  let [cachedProcessedData, setCachedProcessedData] = useState<TreeRecord>();

  useEffect(() => {
    const parseSeriesToJSON = (): TreeRecord => {
      const tree: TreeRecord = {name: 'BubbleChart', children: []};
      const parsedSeries: ParsedSeriesRecord[] = parseSeries(data.series);

      _.forEach(parsedSeries, (record: ParsedSeriesRecord) => {
        createRecurseTree(tree, record.aliases, record);
      });

      return tree;
    };

    const parseSeries = (series: DataFrame[]): ParsedSeriesRecord[] => {
      const areAllSeriesNamesSame = (series.length > 0 && series.every((serieFrame: DataFrame) => serieFrame.name === series[0]?.name));

      let parsedSeries: ParsedSeriesRecord[] = _.map(series, (serieFrame: DataFrame, i) => {
        const valueFields: Field[] = [];
        for(const aField of serieFrame.fields) {
          if(aField.type === FieldType.number) {
            valueFields.push(aField);
          }
        }

        let reducerStat;

        switch(options.stat) {
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
            // This is done for the backward comptability where we used to 
            // get the dynamic traget name using the field and labels name. 
            let stremName = areAllSeriesNamesSame ? 
              valueField.name + " " + JSON.stringify(valueField.labels) : serieFrame.name;
              aliases = stremName?.split(options.groupSeparator) || [valueField.name];
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

    if (data.state === LoadingState.Done) {
      const bubbleChartData: TreeRecord = parseSeriesToJSON();
      setCachedProcessedData(bubbleChartData);
    }
  }, [options, data, id, width, height, replaceVariables, fieldConfig]);

  if (cachedProcessedData === undefined) {
    return (
      <>Loading... please wait</>
    )
  }

  return (
    <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <BubbleChart data={cachedProcessedData} width={bubbleChartWidth} height={bubbleChartHeight} opt={options} />
    </div>
  );
};
