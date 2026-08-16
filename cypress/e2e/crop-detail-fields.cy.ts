/// <reference types="cypress" />

// The schema stored far more than the panels ever asked for. This covers the
// fields CR-4 exposed, and the multi-grade harvest path.
describe('Crop detail fields', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';
  let farmName: string;

  before(() => {
    const ts = Date.now();
    testEmail = `depth${ts}@example.com`;
    farmName = `Depth Estate ${ts}`;
    cy.signup(testEmail, testPassword);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(testEmail, testPassword);
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="farms-page"]').should('be.visible');
  });

  it('captures agronomy detail and a two-grade harvest', () => {
    cy.get('[data-testid="create-farm-button"]').click();
    cy.get('[data-testid="farm-name-input"]').clear().type(farmName);
    cy.get('[data-testid="farm-description-input"]').clear().type('Field depth test');
    cy.get('[data-testid="farm-type-select"]').select('crop');
    cy.get('[data-testid="farm-location-address-input"]').clear().type('1 Depth Lane');
    cy.get('[data-testid="farm-submit-button"]').click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // Crop type with spacing and yield, and ratoon settings that only appear
    // once the crop is said to regrow.
    cy.get('[data-testid="nav-crops"]').click();
    cy.get('[data-testid="add-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-name-input"]').type('Mango');
    cy.get('[data-testid="crop-library-panel"] select').eq(0).select('perennial');
    cy.get('[data-testid="crop-type-scientific-input"]').type('Mangifera indica');
    cy.get('[data-testid="crop-type-months-input"]').type('36');

    cy.get('[data-testid="crop-type-max-ratoons-input"]').should('not.exist');
    cy.get('[data-testid="crop-type-more-toggle"]').click();
    cy.get('[data-testid="crop-type-row-spacing-input"]').type('8');
    cy.get('[data-testid="crop-type-plant-spacing-input"]').type('6');
    cy.get('[data-testid="crop-type-yield-input"]').type('12.5');
    cy.get('[data-testid="crop-type-max-ratoons-input"]').should('not.exist');
    cy.get('[data-testid="crop-type-ratoon-checkbox"]').check();
    cy.get('[data-testid="crop-type-max-ratoons-input"]').should('be.visible');
    cy.get('[data-testid="crop-type-ratoon-checkbox"]').uncheck();

    cy.get('[data-testid="save-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-Mango"]', { timeout: 10000 }).should('be.visible');

    // Location with soil and position behind the disclosure.
    cy.get('[data-testid="nav-locations"]').click();
    cy.contains('button', 'Add location').click();
    cy.get('[data-testid="grow-locations-panel"] input[placeholder="Location name"]').type('Block 4');
    cy.get('[data-testid="grow-locations-panel"] input[placeholder="Size (ha)"]').type('4');
    cy.get('[data-testid="location-status-select"]').select('active');
    cy.get('[data-testid="location-soil-ph-input"]').should('not.exist');
    cy.get('[data-testid="location-more-toggle"]').click();
    cy.get('[data-testid="location-soil-type-input"]').type('Sandy loam');
    cy.get('[data-testid="location-soil-ph-input"]').type('6.4');
    cy.get('[data-testid="location-irrigation-input"]').type('Drip');
    cy.contains('button', 'Save location').click();
    cy.contains('Block 4', { timeout: 10000 }).should('be.visible');

    // Planting with its own area and a graft method.
    cy.get('[data-testid="nav-plantings"]').click();
    cy.contains('button', 'New planting').click();
    cy.get('[data-testid="plantings-panel"] select').eq(0).select('Block 4');
    cy.get('[data-testid="plantings-panel"] select').eq(1).select('Mango');
    cy.get('[data-testid="planting-area-input"]').type('3.5');
    cy.get('[data-testid="planting-more-toggle"]').click();
    cy.get('[data-testid="planting-method-select"]').select('graft');
    cy.contains('button', 'Save planting').click();
    cy.get('[data-testid="plantings-panel"]').contains('Mango', { timeout: 10000 }).should('be.visible');

    // One picking session, two grades, one submission.
    cy.get('[data-testid="nav-harvests"]').click();
    cy.contains('button', 'Record harvest').click();
    cy.get('[data-testid="harvests-panel"] select').eq(0).find('option').eq(1).then(($opt) => {
      cy.get('[data-testid="harvests-panel"] select').eq(0).select($opt.val() as string);
    });

    cy.get('[data-testid="harvest-quantity-input-0"]').type('120');
    cy.get('[data-testid="harvest-grade-select-0"]').select('export_a');
    cy.get('[data-testid="add-harvest-line"]').click();
    cy.get('[data-testid="harvest-quantity-input-1"]').type('40');
    cy.get('[data-testid="harvest-grade-select-1"]').select('local_b');

    cy.get('[data-testid="harvest-brix-input"]').should('not.exist');
    cy.get('[data-testid="harvest-more-toggle"]').click();
    cy.get('[data-testid="harvest-brix-input"]').type('14.2');
    cy.get('[data-testid="harvest-destination-select"]').select('storage');

    cy.contains('button', 'Save harvest').click();

    // Two records from one submission, both against the same season.
    cy.get('[data-testid="harvests-panel"] tbody tr', { timeout: 15000 })
      .should('have.length.at.least', 2);
    cy.get('[data-testid="harvests-panel"]').should('contain.text', '120');
    cy.get('[data-testid="harvests-panel"]').should('contain.text', '40');
  });
});
