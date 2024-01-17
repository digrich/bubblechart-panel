import {PanelProps} from '@grafana/data';
import * as common from '@grafana/schema';

type SeriesSize = 'sm' | 'md' | 'lg';

export interface BubbleChartPanelProps extends PanelProps {
  opts: BubbleChartOptions;
}

export interface BubbleChartOptions extends PanelProps, common.OptionsWithTooltip, common.OptionsWithLegend {
  displayLabels: BubbleChartLabels;
  groupBy: string;
  groupLabels: string[];
  stat: StatOptions;
  unit: string;
  decimals: number;
  groupSeparator: string;
  colorSchemeParams: ColorSchemeParams;
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
  bgColor: string;
  displayLabel: boolean;
  textshadow: string;
  textfont: string;
  textanchor: string;
}

export type ColorSchemeParams = {
  colorScheme: ColorSchemeOptions;
  groupDepthColors: [string, string];
  thresholds: string;
  gradientThresholds: string;
  thresholdColors: [string, string, string];
  gradientColors: [string, string];
}

export interface BubbleChartProps {
  data: TreeRecord;
  width: number;
  height: number;
  opt: BubbleChartOptions;
}

export type ParsedSeriesRecord = {
  name: string;
  aliases: string[];
  value: number | string;
}

export type TreeRecord = {
  name: string;
  children?: TreeRecord[];
  value?: number;
}

export interface Node {
  parent?: Node;
  children?: Node[];
  name: string;
  r: number;
}

export interface CircleData {
  parent?: Node;
  name: string;
  value: number;
  depth: number;
  r: number;
  children?: CircleData[];
}

export interface DataRecord {
  name: string;
  value: number;
  category: string;
}

export enum ColorSchemeOptions {
  Group = 'Group',
  Threshold = 'Threshold',
  Gradient = 'Gradient',
  Unique = 'Unique'
}

export enum StatOptions {
  Min = 'min',
  Max = 'max',
  Avg = 'avg',
  Total = 'total',
  Current = 'current'
}

export enum BubbleChartLabels {
  Name = 'name',
  Value = 'value'
}

// export enum BubbleChartGroupLabels {
//   Name = 'series_name',
//   Label = 'series_label'
// }
