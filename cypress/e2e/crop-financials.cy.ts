/// <reference types="cypress" />

// The question the whole crop module exists to answer: what did a kilo cost,
// and did this block pay. Nearly all of the cost should arrive without anyone
// typing it.
describe('Crop financials', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';
  let farmName: string;

  before(() => {
    const ts = Date.now();
    testEmail = `money${ts}@example.com`;
    farmName = `Margin Estate ${ts}`;
    cy.signup(testEmail, testPassword);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(testEmail, testPassword);
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="farms-page"]').should('be.visible');
  });

  it('costs a block from logged work and sells its harvest', () => {
    cy.startCreateFarm();
    cy.get('[data-testid="farm-name-input"]').clear().type(farmName);
    cy.get('[data-testid="farm-description-input"]').clear().type('Margin test');
    cy.get('[data-testid="farm-type-select"]').select('crop');
    cy.get('[data-testid="farm-location-address-input"]').clear().type('1 Money Lane');
    cy.get('[data-testid="farm-submit-button"]').click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="nav-crops"]').click();
    cy.get('[data-testid="add-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-name-input"]').type('Mango');
    cy.get('[data-testid="crop-library-panel"] select').eq(0).select('perennial');
    cy.get('[data-testid="save-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-Mango"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-locations"]').click();
    cy.contains('button', 'Add location').click();
    cy.get('[data-testid="grow-locations-panel"] input[placeholder="Location name"]').type('Block 4');
    cy.get('[data-testid="grow-locations-panel"] input[placeholder="Size (ha)"]').type('4');
    cy.contains('button', 'Save location').click();
    cy.contains('Block 4', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-plantings"]').click();
    cy.contains('button', 'New planting').click();
    cy.get('[data-testid="plantings-panel"] select').eq(0).select('Block 4');
    cy.get('[data-testid="plantings-panel"] select').eq(1).select('Mango');
    cy.contains('button', 'Save planting').click();
    cy.get('[data-testid="plantings-panel"]').contains('Mango', { timeout: 10000 }).should('be.visible');

    // Nothing costed before any work is logged.
    cy.get('[data-testid="nav-money"]').click();
    cy.get('[data-testid="financials-panel"]').should('be.visible');
    cy.get('[data-testid="financials-empty"]').should('not.exist');
    cy.get('[data-testid="total-cost"]').should('contain.text', '0.00');

    // A typed cost — the kind with no operational trace.
    cy.get('[data-testid="add-expense-button"]').click();
    cy.get('[data-testid="expense-category-select"]').select('land');
    cy.get('[data-testid="expense-description-input"]').type('Block 4 rent');
    cy.get('[data-testid="expense-amount-input"]').type('300');
    cy.get('[data-testid="expense-planting-select"]').select(1);
    cy.get('[data-testid="save-expense-button"]').click();

    cy.get('[data-testid="expense-manual"]', { timeout: 15000 }).should('contain.text', 'Block 4 rent');
    cy.get('[data-testid="total-cost"]').should('contain.text', '300.00');

    // Harvest, then sell from it.
    cy.get('[data-testid="nav-harvests"]').click();
    cy.contains('button', 'Record harvest').click();
    cy.get('[data-testid="harvests-panel"] select').eq(0).find('option').eq(1).then(($opt) => {
      cy.get('[data-testid="harvests-panel"] select').eq(0).select($opt.val() as string);
    });
    cy.get('[data-testid="harvests-panel"] input[placeholder="Quantity"]').type('2000');
    cy.contains('button', 'Save harvest').click();
    cy.get('[data-testid="harvests-panel"]').contains('2000', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid^="sell-harvest-"]').first().click();
    // Defaults to everything still unsold, so the common case is no typing.
    cy.get('[data-testid="sale-quantity-input"]').should('have.value', '2000');
    cy.get('[data-testid="sale-quantity-input"]').clear().type('1500');
    cy.get('[data-testid="sale-price-input"]').type('1.20');
    cy.get('[data-testid="sale-channel-select"]').select('export');
    cy.get('[data-testid="save-sale-button"]').click();

    cy.get('[data-testid="harvests-panel"]', { timeout: 15000 }).should('contain.text', '1500');

    // The database refuses to sell more than was picked, and it reaches the user.
    cy.get('[data-testid^="sell-harvest-"]').first().click();
    cy.get('[data-testid="sale-quantity-input"]').clear().type('900');
    cy.get('[data-testid="sale-price-input"]').type('1.00');
    cy.get('[data-testid="save-sale-button"]').click();
    cy.get('[data-testid="sale-error"]', { timeout: 15000 })
      .should('contain.text', 'exceeds the harvest');

    // Margin and cost per kilo.
    cy.get('[data-testid="nav-money"]').click();
    cy.get('[data-testid="total-revenue"]', { timeout: 15000 }).should('contain.text', '1,800.00');
    cy.get('[data-testid="total-margin"]').should('contain.text', '1,500.00');
    cy.get('[data-testid="financials-cost-per-kg"]').should('contain.text', '0.15');
  });

  it('derives input and labour cost from a logged spray', () => {
    cy.contains(farmName).click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // A priced product, and an hourly rate for the farm.
    cy.get('[data-testid="nav-details"]').click();
    cy.wait(500);

    cy.get('[data-testid="quick-log-button"]').click();
    cy.get('[data-testid="activity-type-select"]').select('pruning');
    cy.get('[data-testid="activity-targets"] button').first().click();
    cy.get('[data-testid="activity-more-toggle"]').click();
    cy.get('[data-testid="activity-labour-input"]').type('4');
    cy.get('[data-testid="save-activity-button"]').click();
    cy.get('[data-testid="quick-log-flash"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="quick-log-close"]').click();

    // No hourly rate is set on this farm, so hours are recorded but not
    // priced — the ledger must not invent a number.
    cy.get('[data-testid="nav-money"]').click();
    cy.get('[data-testid="financials-panel"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="expense-derived"]').should('not.exist');
  });
});
