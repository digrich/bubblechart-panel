import {PanelPlugin} from '@grafana/data';
import {StatOptions, BubbleChartOptions, BubbleChartLabels} from './types';
import {BubbleChartPanel} from 'components/BubbleChartPanel';
import {FieldConfig} from '@grafana/schema';
import './bubble-panel.css';
import {ColorSchemeEditor} from 'components/ColorSchemeEditor';

export const plugin = new PanelPlugin < BubbleChartOptions, FieldConfig> (BubbleChartPanel)
  .setPanelOptions((builder) => {
    builder
      .addMultiSelect({
        name: 'Labels',
        path: 'displayLabels',
        description: 'Select the labels to be displayed in the bubble chart circles',
        defaultValue: BubbleChartLabels.Name,
        settings: {
          options: [
            { value: BubbleChartLabels.Name, label: 'Name' },
            { value: BubbleChartLabels.Value, label: 'Value' },
          ],
        },
      })
      .addSelect({
        path: 'stat',
        name: 'Calculation',
        defaultValue: 'current',
        description: 'Choose a reducer function',
        settings: {
          options: [
            {
              value: StatOptions.Min,
              label: 'min',
            },
            {
              value: StatOptions.Max,
              label: 'max',
            },
            {
              value: StatOptions.Avg,
              label: 'avg',
            },
            {
              value: StatOptions.Current,
              label: 'current',
            },
            {
              value: StatOptions.Total,
              label: 'total',
            },
          ],
        }
      })
      .addUnitPicker({
        path: 'unit',
        name: 'Unit',
        description: 'Choose a unit for the displayed values',
        defaultValue: 'short',
      })
      .addTextInput({
        path: 'decimals',
        name: 'Decimals',
        description: 'Number of decimals',
        defaultValue: '2',
      })
      .addTextInput({
        path: 'groupSeparator',
        name: 'Group Separator',
        description: "Type a character in this field to arrange tag values hierarchically in the 'Alias' field under the datasource query tab, enabling left-to-right splitting for parent-child relationships in the circles. For instance, use ',' in the alias like $tag_env,$tag_host.",
        defaultValue: ',',
      })
      .addCustomEditor({
        name: 'Color scheme',
        id: 'colorSchemeParams',
        path: 'colorSchemeParams',
        // description: 'Choose the color scheme to use. ',
        editor: ColorSchemeEditor,
        defaultValue: {
          colorScheme: 'Group',
          groupDepthColors: ['#73bf69', '#FAD22A'],
          thresholds: '20,50',
          gradientThresholds: '20,50',
          thresholdColors: ['#73bf69', '#FAD22A', '#f2495c'],
          gradientColors: ['#73bf69', '#f2495c']
        },
        category: ['Color scheme'],
      })
  })
  .setNoPadding();



