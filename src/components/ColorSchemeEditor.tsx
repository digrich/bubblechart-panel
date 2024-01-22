import {css} from '@emotion/css';
import React from 'react';
import {GrafanaTheme2, StandardEditorProps} from '@grafana/data';
import {Field, ColorPicker, RadioButtonGroup, useStyles2, Input, Button, Alert} from '@grafana/ui';
import {ColorSchemeOptions, ColorSchemeParams} from 'types';

export interface ColorSchemeEditorSettings {}
interface Props extends StandardEditorProps<string | string[] | null, ColorSchemeEditorSettings> {}

export const ColorSchemeEditor: React.FC<Props> = ({context, onChange}) => {
  const styles = useStyles2(getStyles);
  const config: ColorSchemeParams = context.options.colorSchemeParams;

  const onFieldChange = <K extends keyof ColorSchemeParams>(field: K, value: ColorSchemeParams[K]) => {
    onChange({
      ...context.options.colorSchemeParams, 
      [field]: value
    });
  };

  const invertColors = () => {
    onChange({
      ...context.options.colorSchemeParams, 
      thresholdColors: [...config.thresholdColors].reverse()});
  };

  return (
    <>
      <Field>
        <RadioButtonGroup
          id='colorSchemes'
          options={[
            {
              value: ColorSchemeOptions.Group,
              label: 'Group',
            },
            {
              value: ColorSchemeOptions.Threshold,
              label: 'Threshold',
            },
            {
              value: ColorSchemeOptions.Gradient,
              label: 'Gradient',
            },
            {
              value: ColorSchemeOptions.Unique,
              label: 'Unique',
            }
          ]}
          value={config.colorScheme}
          onChange={(val) => onFieldChange('colorScheme', val)}
        />
      </Field>
      {(config.colorScheme === ColorSchemeOptions.Group) && (
        <>
          <Alert title="" severity="info">Define two colors to create a hierarchical color scheme for circles based on their group. Set colors, such as Green and Yellow, to visually represent different shades within each group. Customize the color scheme to align with your specific data patterns.</Alert>
          <Field horizontal={true} label="Colors" description="Select two colors to represent distinct shades in the circle hierarchy">
            <div className={styles.container}>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.groupDepthColors[0]}
                  onChange={(color) => onFieldChange('groupDepthColors', [color, config.groupDepthColors[1]])}
                  enableNamedColors={false}
                />
              </div>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.groupDepthColors[1]}
                  onChange={(color) => onFieldChange('groupDepthColors', [config.groupDepthColors[0], color])}
                  enableNamedColors={false}
                />
              </div>
            </div>
          </Field>
        </>
      )}

      {(config.colorScheme === ColorSchemeOptions.Gradient) && (
        <>
          <Alert title="" severity="info">Use a gradient scale to color circles based on their values. Define threshold values like 20, 50 and corresponding colors to create a visually appealing gradient effect that reflects the data distribution.</Alert>
          <Field horizontal={true} label="Gradient Values" description="Set threshold values. Only two values are supported, such as 20,50">
            <Input type="text" placeholder="20,50" value={config.gradientThresholds} onChange={(event) => onFieldChange('gradientThresholds', event.currentTarget.value)} />
          </Field>
          <Field horizontal={true} label="Colors" description="Select two colors to create an appealing gradient effect">
            <div className={styles.container}>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.gradientColors[0]}
                  onChange={(color) => onFieldChange('gradientColors', [color, config.gradientColors[1]])}
                  enableNamedColors={false}
                />
              </div>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.gradientColors[1]}
                  onChange={(color) => onFieldChange('gradientColors', [config.gradientColors[0], color])}
                  enableNamedColors={false}
                />
              </div>
            </div>
          </Field>
        </>
      )}

      {(config.colorScheme === ColorSchemeOptions.Threshold) && (
        <>
          <Alert title="" severity="info">Color circles based on predefined threshold values to visually represent your data. Set threshold values, like 20,50 , resulting in color bands: Green for values under 20, Yellow for 20-50, and Red for values exceeding 50. Customize the color scheme to align with your specific data patterns.</Alert>
          <Field horizontal={true} label="Threshold Values" description="Set threshold values. Only two values are supported, such as 20,50">
            <Input type="text" placeholder="20,50" value={config.thresholds} onChange={(event) => onFieldChange('thresholds', event.currentTarget.value)} />
          </Field>
          <Field horizontal={true} label="Colors" description="Select three colors to define distinct bands based on threshold values.">
            <div className={styles.container}>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.thresholdColors[0]}
                  onChange={(color) => onFieldChange('thresholdColors', [color, config.thresholdColors[1], config.thresholdColors[2]])}
                  enableNamedColors={false}
                />
              </div>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.thresholdColors[1]}
                  onChange={(color) => onFieldChange('thresholdColors', [config.thresholdColors[0], color, config.thresholdColors[2]])}
                  enableNamedColors={false}
                />
              </div>
              <div className={styles.picker}>
                <ColorPicker
                  color={config.thresholdColors[2]}
                  onChange={(color) => onFieldChange('thresholdColors', [config.thresholdColors[0], config.thresholdColors[1], color])}
                  enableNamedColors={false}
                />
              </div>
              <Button
                size="md"
                onClick={(event) => invertColors()}
              >Invert</Button>
            </div>
          </Field>
        </>
      )}
      {(config.colorScheme === ColorSchemeOptions.Unique) && (
        <>
          <Alert title="" severity="info">Apply unique color to circles, distinguishing them based on specific characteristics. This scheme allows for clear differentiation and categorization of circles, making it easy to interpret the data.</Alert>
        </>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-end;
    align-items: center;
  `,
  picker: css`
    margin-right: 3px;
    cursor: pointer;
    background: rgb(17, 18, 23);
    padding: 3px;
    height: 32px;
    width: 38px;
    border: 1px solid rgba(204, 204, 220, 0.2);
    display: flex;
    flex-direction: row;
    -webkit-box-align: center;
    align-items: center;
    justify-content: center;
    align-content: flex-end;
  `,
});
