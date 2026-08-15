/// <reference types="cypress" />

describe('Crop farming flow (Supabase)', () => {
    let testEmail: string;
    const testPassword = 'TestPassword123!';
    let farmName: string;

    before(() => {
        const timestamp = Date.now();
        testEmail = `cropuser${timestamp}@example.com`;
        farmName = `Crop Farm ${timestamp}`;

        cy.signup(testEmail, testPassword);
    });

    beforeEach(() => {
        cy.clearAuth();
        cy.signin(testEmail, testPassword);
        cy.get('[data-testid="farms-sidebar-button"]').click();
        cy.get('[data-testid="farms-page"]').should('be.visible');
    });

    it('creates a crop farm and records type, location, planting, harvest', () => {
        cy.get('[data-testid="create-farm-button"]').click();

        cy.get('[data-testid="farm-name-input"]').clear().type(farmName);
        cy.get('[data-testid="farm-description-input"]').clear().type('Supabase crop test farm');
        cy.get('[data-testid="farm-type-select"]').select('crop');
        cy.get('[data-testid="farm-location-address-input"]').clear().type('1 Crop Lane');
        cy.get('[data-testid="farm-submit-button"]').click();

        cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
        cy.get('h1').should('contain', farmName);

        // Crop library
        cy.get('[data-testid="nav-crops"]').click();
        cy.get('[data-testid="crop-library-panel"]').should('be.visible');
        cy.get('[data-testid="add-crop-type-button"]').click();
        cy.get('[data-testid="crop-type-name-input"]').type('Pineapple');
        cy.get('[data-testid="save-crop-type-button"]').click();
        cy.get('[data-testid="crop-type-Pineapple"]', { timeout: 10000 }).should('be.visible').click();
        cy.get('[data-testid="variety-name-input"]').type('MD2');
        cy.get('[data-testid="add-variety-button"]').click();
        cy.contains('[data-testid="crop-library-panel"] li', 'MD2', { timeout: 10000 }).should('be.visible');

        // Locations
        cy.get('[data-testid="nav-locations"]').click();
        cy.get('[data-testid="grow-locations-panel"]').should('be.visible');
        cy.contains('button', 'Add location').click();
        cy.get('[data-testid="grow-locations-panel"] input[placeholder="Location name"]').type('Block A');
        cy.contains('button', 'Save location').click();
        cy.contains('Block A', { timeout: 10000 }).should('be.visible');

        // Planting
        cy.get('[data-testid="nav-plantings"]').click();
        cy.get('[data-testid="plantings-panel"]').should('be.visible');
        cy.contains('button', 'New planting').click();
        cy.get('[data-testid="plantings-panel"] select').eq(0).select('Block A');
        cy.get('[data-testid="plantings-panel"] select').eq(1).select('Pineapple');
        cy.get('[data-testid="plantings-panel"] select').eq(2).select('MD2');
        cy.contains('button', 'Save planting').click();
        cy.get('[data-testid="plantings-panel"]').contains('Pineapple', { timeout: 10000 }).should('be.visible');

        // Harvest
        cy.get('[data-testid="nav-harvests"]').click();
        cy.get('[data-testid="harvests-panel"]').should('be.visible');
        cy.contains('button', 'Record harvest').click();
        cy.get('[data-testid="harvests-panel"] select').eq(0).find('option').eq(1).then(($opt) => {
            cy.get('[data-testid="harvests-panel"] select').eq(0).select($opt.val() as string);
        });
        // The cycle is resolved from the planting rather than asked for.
        cy.get('[data-testid="harvest-cycle-chip"]').should('contain.text', 'Mother crop');
        cy.get('[data-testid="harvests-panel"] input[placeholder="Quantity"]').type('120');
        cy.contains('button', 'Save harvest').click();
        cy.get('[data-testid="harvests-panel"]').contains('120', { timeout: 10000 }).should('be.visible');
    });
});
