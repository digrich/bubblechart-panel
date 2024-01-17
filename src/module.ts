import {FieldOverrideContext, FieldType, PanelPlugin, } from '@grafana/data';
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
      .addRadio({
        name: 'Group by',
        path: 'groupBy',
        description: 'Select the type of grouping to be used: Name or Label',
        defaultValue: 'Name',
        settings: {
          options: [
            { value: "Name", label: "Name" },
            { value: "Label", label: "Label" },
          ],
        }
      })
      .addMultiSelect({
        name: 'Labels',
        path: 'groupLabels',
        description: 'Select labels from the dropdown to customize the order of grouping.',        
        settings: {
          allowCustomValue: true,
          options: [],
          getOptions: async (context: FieldOverrideContext) => {
            const labelOptions: Array<{
              value: string;
              label: string;
            }> = [];
            
            if (context && context.data) {
              const frame = context.data[0];
              for (const field of frame.fields) {
                if (field.type !== FieldType.number) {
                  continue;
                }
                const labels = field.labels;
                for (const key in labels) {
                  labelOptions.push({ value: key, label: key });
                }
              }
            } 
            return Promise.resolve(labelOptions);
          },
        },
        showIf(currentOptions, data) {
          return currentOptions.groupBy === "Label";
        },
      })
      .addTextInput({
        path: 'groupSeparator',
        name: 'Separator',
        description: "For the 'Name' option, use this to split names using a defined character for hierarchical grouping. For example, if '$tag_env,$tag_host' is defined as aliases in the datasource query tab, using ',' as a splitter will group all host circles under the same environment.",
        defaultValue: ',',
        showIf(currentOptions, data) {
          return currentOptions.groupBy === "Name";
        },
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



