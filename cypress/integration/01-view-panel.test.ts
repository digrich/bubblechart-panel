import { e2e } from '@grafana/e2e';
import { TestIds } from '../../src/constants';

/**
 * Dashboard
 */
const json = require('../../provisioning/dashboards/dashboard.json');
const testedPanel = json.panels[0];

/**
 * Selector
 */
const getTestIdSelector = (testId: string) => `[data-testid="${testId}"]`;

/**
 * Panel
 */
describe('Viewing an bubble chart panel', () => {
  beforeEach(() => {
    e2e.flows.openDashboard({
      uid: json.uid,
    });
  });

  it('Should display a bubble chart', () => {
    console.log("Starting....");
    const currentPanel = e2e.components.Panels.Panel.title(testedPanel.title);
    currentPanel.should('be.visible');
    
    // currentPanel.first().screenshot("Graph Panel");
    // Log panel content for debugging
    // currentPanel.invoke('text').then((text) => {
    //   cy.log('Panel Content:', text);
    // });

    /**
     * Root
     */
    const root = cy.get(getTestIdSelector(TestIds.panel.root));
    root.should('be.visible');

    cy.wait(3000);

    /**
     * Screenshot
     */
    root.screenshot(testedPanel.title);
    e2e().compareScreenshots({ name: testedPanel.title, threshold: 0.05 });

    // Debugging commands - uncomment if needed
    // cy.get('body').then(($body) => {
    //   if ($body.find('[data-testid="data-testid Panel header Group Color Scheme"]').length > 0) {
    //     cy.log('Element found!');
    //   } else {
    //     cy.log('Element not found!');
    //   }
    // });
  });
});