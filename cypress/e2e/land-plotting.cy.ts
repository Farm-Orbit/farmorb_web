/// <reference types="cypress" />

// Drawing a block on a map and letting the shape decide its area — a grower
// knows where the block is far better than how many hectares it is.
describe('Land plotting', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';
  let farmName: string;

  before(() => {
    const ts = Date.now();
    testEmail = `plot${ts}@example.com`;
    farmName = `Plot Estate ${ts}`;
    cy.signup(testEmail, testPassword);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(testEmail, testPassword);
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="farms-page"]').should('be.visible');
  });

  it('draws a boundary and derives the block size from it', () => {
    cy.get('[data-testid="create-farm-button"]').click();
    cy.get('[data-testid="farm-name-input"]').clear().type(farmName);
    cy.get('[data-testid="farm-description-input"]').clear().type('Plotting test');
    cy.get('[data-testid="farm-type-select"]').select('crop');
    cy.get('[data-testid="farm-location-address-input"]').clear().type('1 Plot Lane');
    cy.get('[data-testid="farm-submit-button"]').click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="nav-locations"]').click();
    cy.contains('button', 'Add location').click();
    cy.get('[data-testid="grow-locations-panel"] input[placeholder="Location name"]').type('Block A');
    cy.contains('button', 'Save location').click();
    cy.contains('Block A', { timeout: 10000 }).should('be.visible');

    // No size yet — the point is that drawing supplies it.
    cy.get('[data-testid="grow-locations-panel"] tbody tr').first().should('contain.text', '—');

    cy.get('[data-testid^="draw-boundary-"]').first().should('contain.text', 'Draw boundary').click();
    cy.get('[data-testid="farm-map"]', { timeout: 20000 }).should('be.visible');
    cy.get('.leaflet-container', { timeout: 20000 }).should('be.visible');

    // Saving needs a real shape, not two points.
    cy.get('[data-testid="map-save-boundary"]').should('be.disabled');

    cy.get('.leaflet-container').click(180, 140);
    cy.get('.leaflet-container').click(420, 140);
    cy.get('.leaflet-container').click(420, 300);
    cy.get('[data-testid="map-save-boundary"]').should('not.be.disabled');
    cy.get('.leaflet-container').click(180, 300);

    // Area is reported as the shape is built, before committing to it.
    cy.get('[data-testid="farm-map"]').should('contain.text', '4 points');
    cy.get('[data-testid="farm-map"]').should('contain.text', 'ha');

    // Undo removes the last corner rather than the whole shape.
    cy.get('[data-testid="map-undo-point"]').click();
    cy.get('[data-testid="farm-map"]').should('contain.text', '3 points');
    cy.get('.leaflet-container').click(180, 300);

    cy.get('[data-testid="map-save-boundary"]').click();

    cy.get('[data-testid="map-message"]', { timeout: 15000 })
      .should('contain.text', 'Boundary saved');

    // The drawing decided the size.
    cy.get('[data-testid="grow-locations-panel"] tbody tr')
      .first()
      .should('not.contain.text', '—');

    // And it is offered for redrawing rather than drawing again.
    cy.get('[data-testid^="draw-boundary-"]').first().should('contain.text', 'Redraw');
  });

  it('picks spray targets by tapping the block on a map', () => {
    cy.contains(farmName).click();
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // A crop in the drawn block, so the map has something to colour and the
    // activity has something to attach to.
    cy.get('[data-testid="nav-crops"]').click();
    cy.get('[data-testid="add-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-name-input"]').type('Mango');
    cy.get('[data-testid="crop-library-panel"] select').eq(0).select('perennial');
    cy.get('[data-testid="save-crop-type-button"]').click();
    cy.get('[data-testid="crop-type-Mango"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-plantings"]').click();
    cy.contains('button', 'New planting').click();
    cy.get('[data-testid="plantings-panel"] select').eq(0).select('Block A');
    cy.get('[data-testid="plantings-panel"] select').eq(1).select('Mango');
    cy.contains('button', 'Save planting').click();
    cy.get('[data-testid="plantings-panel"]').contains('Mango', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="nav-activities"]').click();
    cy.get('[data-testid="log-activity-button"]').click();

    // The list is the default; the map is a choice.
    cy.get('[data-testid="activity-targets"]').should('be.visible');
    cy.get('[data-testid="toggle-target-map"]').click();
    cy.get('[data-testid="activity-target-map"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-testid="activity-targets"]').should('not.exist');

    // Tapping the block selects the planting inside it.
    cy.get('.leaflet-container', { timeout: 20000 }).should('be.visible');
    cy.wait(1500);
    cy.get('.leaflet-interactive').first().click({ force: true });

    cy.get('[data-testid="toggle-target-map"]').click();
    cy.get('[data-testid="activity-targets"] button[aria-pressed="true"]')
      .should('have.length', 1);

    cy.get('[data-testid="save-activity-button"]').click();
    cy.get('[data-testid="activity-flash"]', { timeout: 15000 }).should('contain.text', '1 block');
  });
});
