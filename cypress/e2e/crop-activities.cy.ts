/// <reference types="cypress" />

// Logging a spray across several blocks in one submission, and the two
// consequences the grower cares about: stock comes off, and the harvest date
// moves.
describe('Crop activities', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';
  let farmName: string;

  before(() => {
    const ts = Date.now();
    testEmail = `activity${ts}@example.com`;
    farmName = `Spray Estate ${ts}`;
    cy.signup(testEmail, testPassword);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(testEmail, testPassword);
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="farms-page"]').should('be.visible');
  });

  it('logs one spray across two blocks and blocks an early harvest', () => {
    cy.startCreateFarm();
    cy.get('[data-testid="farm-name-input"]').clear().type(farmName);
    cy.get('[data-testid="farm-description-input"]').clear().type('Activity test');
    cy.get('[data-testid="farm-type-select"]').select('crop');
    cy.get('[data-testid="farm-location-address-input"]').clear().type('1 Spray Lane');
    cy.get('[data-testid="farm-submit-button"]').click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // Crop + two blocks
    cy.get('[data-testid="nav-crops"]').click();
    cy.get('[data-testid="add-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-name-input"]').type('Mango');
    cy.get('[data-testid="crop-library-panel"] select').eq(0).select('perennial');
    cy.get('[data-testid="save-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-Mango"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-locations"]').click();
    ['Block A', 'Block B'].forEach((name) => {
      cy.contains('button', 'Add location').click();
      cy.get('[data-testid="grow-locations-panel"] input[placeholder="Location name"]').type(name);
      cy.get('[data-testid="grow-locations-panel"] input[placeholder="Size (ha)"]').type('4');
      cy.contains('button', 'Save location').click();
      cy.contains(name, { timeout: 10000 }).should('be.visible');
    });

    cy.get('[data-testid="nav-plantings"]').click();
    ['Block A', 'Block B'].forEach((block) => {
      cy.contains('button', 'New planting').click();
      cy.get('[data-testid="plantings-panel"] select').eq(0).select(block);
      cy.get('[data-testid="plantings-panel"] select').eq(1).select('Mango');
      cy.contains('button', 'Save planting').click();
      cy.wait(800);
    });

    // One submission, two blocks.
    cy.get('[data-testid="nav-activities"]').click();
    cy.get('[data-testid="activities-panel"]').should('be.visible');
    cy.get('[data-testid="activities-empty"]').should('exist');

    cy.get('[data-testid="log-activity-button"]').click();
    cy.get('[data-testid="log-activity-form"]').should('be.visible');
    cy.get('[data-testid="activity-type-select"]').should('have.value', 'spray');

    cy.get('[data-testid="select-all-targets"]').click();
    cy.get('[data-testid="activity-targets"] button[aria-pressed="true"]').should('have.length', 2);

    cy.get('[data-testid="activity-rate-input"]').type('2.5');

    // Rate × area, computed rather than asked for. The blocks carry no area of
    // their own, so it falls back to the location's.
    cy.get('[data-testid="activity-quantity-hint"]').should('contain.text', 'Uses');

    cy.get('[data-testid="activity-phi-input"]').clear().type('14');
    cy.get('[data-testid="save-activity-button"]').click();

    // Confirms with the date that now matters, not just "saved".
    cy.get('[data-testid="activity-flash"]', { timeout: 15000 })
      .should('contain.text', '2 blocks')
      .and('contain.text', 'Earliest harvest');

    // Two rows, presented as the one action they were.
    cy.get('[data-testid="timeline-activity"]').should('have.length', 1);
    cy.get('[data-testid="timeline-batch-count"]').should('contain.text', '2 blocks');
    cy.get('[data-testid="activity-timeline"]').should('contain.text', '14 day interval');

    // Harvesting inside the interval is refused, and says why.
    cy.get('[data-testid="nav-harvests"]').click();
    cy.contains('button', 'Record harvest').click();
    cy.get('[data-testid="harvests-panel"] select').eq(0).find('option').eq(1).then(($opt) => {
      cy.get('[data-testid="harvests-panel"] select').eq(0).select($opt.val() as string);
    });
    cy.get('[data-testid="harvests-panel"] input[placeholder="Quantity"]').type('300');
    cy.contains('button', 'Save harvest').click();

    cy.get('[data-testid="harvests-panel"]', { timeout: 15000 })
      .should('contain.text', 'Harvest blocked');
  });

  it('shows only sprays when filtered', () => {
    cy.contains(farmName).click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="nav-activities"]').click();

    cy.get('[data-testid="log-activity-button"]').click();
    cy.get('[data-testid="activity-type-select"]').select('irrigation');
    // Irrigation does not consume a product, so those fields are not shown.
    cy.get('[data-testid="activity-product-select"]').should('not.exist');
    cy.get('[data-testid="activity-phi-input"]').should('not.exist');
    cy.get('[data-testid="activity-targets"] button').first().click();
    cy.get('[data-testid="save-activity-button"]').click();
    cy.get('[data-testid="activity-flash"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="activity-timeline"] li').should('have.length', 2);
    cy.get('[data-testid="activity-filter-select"]').select('spray');
    cy.get('[data-testid="activity-timeline"] li').should('have.length', 1);
    cy.get('[data-testid="activity-timeline"]').should('contain.text', 'Spray');
  });

  it('repeats a batch spray across the same blocks', () => {
    cy.contains(farmName).click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="nav-activities"]').click();

    cy.get('[data-testid="activity-filter-select"]').select('spray');
    cy.get('[data-testid="repeat-activity-button"]').first().click();

    // Reopens prefilled — same type, same product rate, and crucially every
    // block the original covered, not just the row that was clicked.
    cy.get('[data-testid="log-activity-form"]').should('be.visible');
    cy.get('[data-testid="activity-type-select"]').should('have.value', 'spray');
    cy.get('[data-testid="activity-rate-input"]').should('have.value', '2.5');
    cy.get('[data-testid="activity-targets"] button[aria-pressed="true"]').should('have.length', 2);

    cy.get('[data-testid="save-activity-button"]').click();
    cy.get('[data-testid="activity-flash"]', { timeout: 15000 }).should('contain.text', '2 blocks');
  });

  it('records a problem with severity', () => {
    cy.contains(farmName).click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="nav-activities"]').click();

    cy.get('[data-testid="log-observation-button"]').click();
    cy.get('[data-testid="log-observation-form"]').should('be.visible');
    cy.get('[data-testid="observation-name-input"]').type('Anthracnose');
    cy.get('[data-testid="severity-moderate"]').click();
    cy.get('[data-testid="severity-moderate"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="save-observation-button"]').click();

    cy.get('[data-testid="activity-flash"]', { timeout: 15000 })
      .should('contain.text', 'moderate Anthracnose');

    cy.get('[data-testid="activity-filter-select"]').select('observations');
    cy.get('[data-testid="timeline-observation"]')
      .should('contain.text', 'Anthracnose')
      .and('contain.text', 'moderate');
  });

  it('logs from the header without navigating to the activities tab', () => {
    cy.contains(farmName).click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // Deliberately stays on the crops tab — the point is that recording does
    // not start with navigation.
    cy.get('[data-testid="nav-crops"]').click();
    cy.get('[data-testid="quick-log-button"]').should('be.visible').click();
    cy.get('[data-testid="quick-log-dialog"]').should('be.visible');

    cy.get('[data-testid="activity-type-select"]').select('pruning');
    cy.get('[data-testid="activity-targets"] button').first().click();
    cy.get('[data-testid="save-activity-button"]').click();

    // Offers another straight away — crews log several things in a row.
    cy.get('[data-testid="quick-log-flash"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="quick-log-again"]').click();
    cy.get('[data-testid="log-activity-form"]').should('be.visible');
    cy.get('[data-testid="quick-log-close"]').click();
    cy.get('[data-testid="quick-log-dialog"]').should('not.exist');

    // And it landed.
    cy.get('[data-testid="nav-activities"]').click();
    cy.get('[data-testid="activity-timeline"]', { timeout: 15000 })
      .should('contain.text', 'Pruning');
  });

  it('hides the quick log outside a farm', () => {
    cy.get('[data-testid="quick-log-button"]').should('not.exist');
  });
});
