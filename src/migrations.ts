import { BubbleChartOptions, ColorSchemeParams, ColorSchemeOptions, StatOptions, BubbleChartLabels } from './types';

interface AngularBubbleChartOptions {
  mode: string;
  bgColor: string;
  valueName: string;
  nullPointMode: string;
  decimal: number;
  format: string;
  colorScheme: string;
  groupDepthColors: string[];
  thresholds: string;
  thresholdColors: string[];
  gradientThresholds: string;
  gradientColors: string[];
  groupSeperator: string;
  displayLabel: boolean;
  height: number;
  gridPos: {
    x: number;
    y: number;
    w: number;
    h: number;
  }
}
export const BubbleChartPanelMigrationHandler = (panel: any): Partial<BubbleChartOptions> => {
  if (!panel.groupSeperator) {
    if (!panel.options) {
      return {} as any;
    }
    return panel.options;
  }

  const newDefaults = migrateDefaults({
    mode: panel?.mode,
    bgColor: panel?.bgColor,
    valueName: panel?.valueName,
    nullPointMode: panel?.nullPointMode,
    decimal: panel?.decimal,
    format: panel?.format,
    colorScheme: panel?.colorScheme,
    groupDepthColors: panel?.groupDepthColors,
    thresholds: panel?.thresholds,
    thresholdColors: panel?.thresholdColors,
    gradientThresholds: panel?.gradientThresholds,
    gradientColors: panel?.gradientColors,
    groupSeperator: panel?.groupSeperator,
    displayLabel: panel?.displayLabel,
    height: panel?.height,
    gridPos: panel?.gridPos,
  });

  delete panel.mode;
  delete panel.bgColor;
  delete panel.valueName;
  delete panel.nullPointMode;
  delete panel.decimal;
  delete panel.format;
  delete panel.colorScheme;
  delete panel.groupDepthColors;
  delete panel.thresholds;
  delete panel.thresholdColors;
  delete panel.gradientThresholds;
  delete panel.gradientColors;
  delete panel.groupSeperator;
  delete panel.displayLabel;
  delete panel.height;
  delete panel.svgBubbleId;
  delete panel.svgContainer;

  return {...panel.options, ...newDefaults};
};

export const migrateDefaults = (angular: AngularBubbleChartOptions): Partial<BubbleChartOptions> => {
  let colorSchemeParams: ColorSchemeParams = {
    colorScheme: ColorSchemeOptions.Group,
    groupDepthColors: ["hsl(152,80%,80%)", "hsl(228,30%,40%)"],
    thresholds: '50,80',
    gradientThresholds: '50,80',
    thresholdColors: ["green", "yellow", "red"],
    gradientColors: ['red', 'green'],
  };
  let options: Partial<BubbleChartOptions> = {
    displayLabels: Array<BubbleChartLabels>(0),
    groupBy: 'Name',
    groupLabels: [],
    stat: StatOptions.Current,
    unit: 'short',
    decimals: 2,
    groupSeparator: ',',
    colorSchemeParams: colorSchemeParams,
    text: '',
    showSeriesCount: false,
    // seriesCountSize: SeriesSize.Small,
    bgColor: '',
    displayLabel: false,
    textshadow: '',
    textfont: '',
    textanchor: '',
  }

  if (angular?.valueName) {
    options.stat = getStatOptionByValue(angular.valueName) || StatOptions.Current;
  }

  if (angular?.decimal) {
    options.decimals = angular.decimal;
  }

  if (angular?.format) {
    options.unit = angular.format;
  }

  if (angular?.colorScheme) {
    colorSchemeParams.colorScheme = getColorSchemeByValue(angular.colorScheme) || ColorSchemeOptions.Group;
  }

  if (angular?.groupDepthColors) {
    colorSchemeParams.groupDepthColors = angular.groupDepthColors as [string, string];
  }

  if (angular?.thresholds) {
    colorSchemeParams.thresholds = angular.thresholds;
  }

  if (angular?.thresholdColors) {
    colorSchemeParams.thresholdColors = angular.thresholdColors as [string, string, string];
  }

  if (angular?.gradientThresholds) {
    colorSchemeParams.gradientThresholds = angular.gradientThresholds;
  }

  if (angular?.gradientColors) {
    colorSchemeParams.gradientColors = angular.gradientColors as [string, string];
  }

  if (angular?.groupSeperator) {
    options.groupSeparator = angular.groupSeperator;
  }

  if (angular?.displayLabel && angular.displayLabel) {
    options.displayLabels = [BubbleChartLabels.Name];
  }
  return options;
}

export function getStatOptionByValue(value: string): StatOptions | undefined {
  for (const key in StatOptions) {
    if (StatOptions[key as keyof typeof StatOptions] === value) {
      return StatOptions[key as keyof typeof StatOptions] as StatOptions;
    }
  }
  return undefined; // Value not found
}

export function getColorSchemeByValue(value: string): ColorSchemeOptions | undefined {
  for (const key in ColorSchemeOptions) {
    if (ColorSchemeOptions[key as keyof typeof ColorSchemeOptions] === value) {
      return ColorSchemeOptions[key as keyof typeof ColorSchemeOptions] as ColorSchemeOptions;
    }
  }
  return undefined; // Value not found
}
