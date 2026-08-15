/// <reference types="cypress" />

// A perennial tree bears annually for decades. This walks a mango planting
// through three bearing seasons and harvests in the third — the shape the old
// ratoon-capped model could not express.
describe('Perennial bearing seasons', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';
  let farmName: string;

  before(() => {
    const ts = Date.now();
    testEmail = `mango${ts}@example.com`;
    farmName = `Mango Estate ${ts}`;
    cy.signup(testEmail, testPassword);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(testEmail, testPassword);
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="farms-page"]').should('be.visible');
  });

  it('advances a mango planting through seasons and harvests in the third', () => {
    const thisYear = new Date().getFullYear();

    cy.get('[data-testid="create-farm-button"]').click();
    cy.get('[data-testid="farm-name-input"]').clear().type(farmName);
    cy.get('[data-testid="farm-description-input"]').clear().type('Perennial season test');
    cy.get('[data-testid="farm-type-select"]').select('crop');
    cy.get('[data-testid="farm-location-address-input"]').clear().type('1 Orchard Road');
    cy.get('[data-testid="farm-submit-button"]').click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // A perennial crop — this is what makes the planting bear seasons.
    cy.get('[data-testid="nav-crops"]').click();
    cy.get('[data-testid="crop-library-panel"]').should('be.visible');
    cy.get('[data-testid="add-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-name-input"]').type('Mango');
    cy.get('[data-testid="crop-library-panel"] select').eq(0).select('perennial');
    cy.get('[data-testid="save-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-Mango"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-locations"]').click();
    cy.get('[data-testid="grow-locations-panel"]').should('be.visible');
    cy.contains('button', 'Add location').click();
    cy.get('[data-testid="grow-locations-panel"] input[placeholder="Location name"]').type('Block 4');
    cy.contains('button', 'Save location').click();
    cy.contains('Block 4', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-plantings"]').click();
    cy.get('[data-testid="plantings-panel"]').should('be.visible');
    cy.contains('button', 'New planting').click();
    cy.get('[data-testid="plantings-panel"] select').eq(0).select('Block 4');
    cy.get('[data-testid="plantings-panel"] select').eq(1).select('Mango');
    cy.contains('button', 'Save planting').click();
    cy.get('[data-testid="plantings-panel"]').contains('Mango', { timeout: 10000 }).should('be.visible');

    // A perennial opens on a named season, not a "mother crop".
    cy.get('[data-testid="plantings-panel"] tbody tr').first().click();
    cy.get('[data-testid="planting-cycles"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="cycle-row-1"]').should('contain.text', `${thisYear} season`);
    cy.get('[data-testid="cycle-row-1"]').should('contain.text', 'Bearing now');

    // Advance two seasons. The button names the year it is about to start.
    cy.get('[data-testid="start-next-cycle-button"]')
      .should('contain.text', `Start ${thisYear + 1} season`)
      .click();
    cy.get('[data-testid="cycle-row-2"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="start-next-cycle-button"]').click();
    cy.get('[data-testid="cycle-row-3"]', { timeout: 10000 }).should('be.visible');

    // Exactly one season bears at a time, and it is the newest.
    cy.get('[data-testid="cycle-active"]').should('have.length', 1);
    cy.get('[data-testid="cycle-row-3"]').find('[data-testid="cycle-active"]').should('exist');

    // Seasons advanced without a harvest are closed as terminated, not
    // recorded as having produced fruit.
    cy.get('[data-testid="cycle-row-1"]').should('contain.text', 'terminated');

    // Harvest lands in the current season without being asked which one.
    cy.get('[data-testid="nav-harvests"]').click();
    cy.get('[data-testid="harvests-panel"]').should('be.visible');
    cy.contains('button', 'Record harvest').click();
    cy.get('[data-testid="harvests-panel"] select').eq(0).find('option').eq(1).then(($opt) => {
      cy.get('[data-testid="harvests-panel"] select').eq(0).select($opt.val() as string);
    });
    cy.get('[data-testid="harvest-cycle-chip"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="harvests-panel"] input[placeholder="Quantity"]').type('4200');
    cy.contains('button', 'Save harvest').click();

    // And is reported against that season, not a ratoon number.
    cy.get('[data-testid="harvests-panel"]').contains('4200', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="harvests-panel"] tbody').should('contain.text', 'season');

    // The yield shows against the season that produced it.
    cy.get('[data-testid="nav-plantings"]').click();
    cy.get('[data-testid="plantings-panel"] tbody tr').first().click();
    cy.get('[data-testid="cycle-row-3"]', { timeout: 10000 }).should('contain.text', '4200');
  });
});
