/// <reference types="cypress" />

// Covers the farm-scoped sidebar: context switching, farm-type gating, and
// that sidebar links drive the `?tab=` section the detail page renders.
describe('farm-scoped sidebar', () => {
  it('switches context and navigates sections', () => {
    const ts = Date.now();
    const email = `nav${ts}@example.com`;

    cy.signup(email, 'TestPassword123!');

    // Global context: sidebar shows the top-level menu. Dashboard and Farms
    // used to be separate entries for the same job; the home page is the farm
    // list now, so there is one.
    cy.get('[data-testid="dashboard-sidebar-button"]').should('not.exist');
    cy.get('[data-testid="farms-sidebar-button"]').should('be.visible');
    cy.get('[data-testid="my-invitations-sidebar-button"]').should('be.visible');
    
    cy.get('[data-testid="farm-switcher-button"]').should('not.exist');

    // A brand-new account lands on a welcome whose only action is the one
    // thing that unblocks the rest of the product.
    cy.get('[data-testid="farms-welcome"]').should('be.visible');
    cy.get('[data-testid="create-first-farm-button"]').should('be.visible');
    cy.get('[data-testid="create-farm-button"]').should('not.exist');

    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.createFarm(`Nav Livestock ${ts}`, 'livestock nav test', 'livestock').then((livestockId) => {
      // Farm context: switcher + livestock sections, no crop sections.
      cy.get('[data-testid="farm-switcher-button"]').should('be.visible');
      cy.contains('[data-testid="farm-switcher-button"]', `Nav Livestock ${ts}`);
      cy.get('[data-testid="nav-animals"]').should('be.visible');
      cy.get('[data-testid="nav-inventory"]').should('be.visible');
      cy.get('[data-testid="nav-activity"]').should('be.visible');
      cy.get('[data-testid="nav-crops"]').should('not.exist');

      // Sidebar drives the section.
      cy.get('[data-testid="nav-health"]').click();
      cy.url().should('include', `/farms/${livestockId}?tab=health`);
      cy.get('[data-testid="health-records-table"], [data-testid="health-records-empty"]', {
        timeout: 15000,
      }).should('exist');


      // Second farm, crop type, to prove gating + switching. Leaving a farm
      // goes through the switcher now — there is no separate back link.
      cy.get('[data-testid="farm-switcher-button"]').click();
      cy.get('[data-testid="farm-switcher-all"]').click();
      cy.get('[data-testid="farms-page"]').should('be.visible');
      cy.createFarm(`Nav Crop ${ts}`, 'crop nav test', 'crop').then((cropId) => {
        cy.get('[data-testid="nav-crops"]').should('be.visible');
        cy.get('[data-testid="nav-plantings"]').should('be.visible');
        cy.get('[data-testid="nav-animals"]').should('not.exist');

        // Switcher lists both farms and moves between them.
        cy.get('[data-testid="farm-switcher-button"]').click();
        cy.get('[data-testid="farm-switcher-menu"]').should('be.visible');
        cy.get(`[data-testid="farm-switcher-option-${livestockId}"]`).should('exist');

        cy.get(`[data-testid="farm-switcher-option-${livestockId}"]`).click();
        cy.url().should('include', `/farms/${livestockId}`);
        cy.get('[data-testid="nav-animals"]').should('be.visible');
        cy.get('[data-testid="nav-crops"]').should('not.exist');

        // Leaving a farm belongs to the switcher, not a separate back link.
        cy.get('[data-testid="farms-sidebar-button"]').should('not.exist');
        cy.get('[data-testid="farm-switcher-button"]').click();
        cy.get('[data-testid="farm-switcher-all"]').click();
        cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        cy.get('[data-testid="farms-page"]').should('be.visible');

        cy.log(`crop farm ${cropId}`);
      });
    });
  });
});
