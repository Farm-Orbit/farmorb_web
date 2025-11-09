/// <reference types="cypress" />

describe('Animal Management', () => {
    let testEmail: string;
    let testPassword: string;
    let farmId: string;
    let animalTagId: string;
    let animalId: string;

    before(() => {
        const timestamp = Date.now();
        testEmail = `animals${timestamp}@example.com`;
        testPassword = 'TestPassword123!';

        cy.signup(testEmail, testPassword);
        cy.navigateToFarms();

        const farmName = `Animal Test Farm ${timestamp}`;
        cy.createFarm(
            farmName,
            'Test farm for animal management',
            'livestock'
        ).then((id) => {
            farmId = id;
        });
    });

    beforeEach(() => {
        cy.clearAuth();
        cy.signin(testEmail, testPassword);
    });

    it('should create a group first (prerequisite for animals)', () => {
        cy.visit(`/farms/${farmId}?tab=groups`);

        const groupName = `Test Group for Animals ${Date.now()}`;

        cy.get('[data-testid="create-group-button"]').click();
        cy.url().should('include', `/farms/${farmId}/groups/new`);

        cy.get('[data-testid="group-name-input"]').type(groupName);
        cy.get('[data-testid="group-purpose-input"]').clear().type('Breeding');
        cy.get('[data-testid="group-description-textarea"]').type('Test group for animal tests');
        cy.get('[data-testid="create-group-submit-button"]').click();

        cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
        cy.url().should('include', 'tab=groups');
        cy.contains(groupName, { timeout: 10000 }).should('be.visible');
    });

    it('should add an animal via the standalone page', () => {
        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.get('[data-testid="create-animal-button"]').click();
        cy.url().should('include', `/farms/${farmId}/animals/new`);

        animalTagId = `TAG${Date.now()}`;
        cy.get('[data-testid="animal-tag-id-input"]').type(animalTagId);
        cy.get('[data-testid="animal-name-input"]').type('Bessie');
        cy.get('[data-testid="animal-sex-select"]').select('female');
        cy.get('[data-testid="animal-breed-input"]').type('Holstein');
        cy.get('[data-testid="animal-tracking-type-select"]').select('individual');

        cy.get('[data-testid="submit-animal-button"]').click();

        cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
        cy.url().should('include', 'tab=animals');

        cy.contains('tbody tr', animalTagId, { timeout: 10000 }).should('be.visible');
        cy.contains('tbody tr', 'Bessie').should('be.visible');
        cy.contains('tbody tr', 'Holstein').should('be.visible');

        cy.contains('td', animalTagId)
          .closest('tr')
          .invoke('attr', 'data-testid')
          .then((testId) => {
              expect(testId, 'row data-testid exists').to.exist;
              animalId = testId!.replace('farm-row-', '');
          });
    });

    it('should edit an animal via the standalone page', () => {
        const updatedName = 'Bessie Updated';

        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.wrap(null).then(() => {
            expect(animalId, 'animalId captured from create step').to.be.a('string');
        });

        cy.get(`[data-testid="edit-animal-button-${animalTagId}"]`).click();
        cy.url().should('include', `/farms/${farmId}/animals/${animalId}/edit`);

        cy.get('[data-testid="animal-name-input"]').clear().type(updatedName);
        cy.get('[data-testid="animal-status-select"]').select('sold');
        cy.get('[data-testid="submit-animal-button"]').click();

        cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
        cy.url().should('include', 'tab=animals');

        cy.contains('tbody tr', updatedName, { timeout: 10000 }).should('be.visible');
        cy.contains('tbody tr', 'Sold').should('be.visible');
    });

    it('should filter animals by status', () => {
        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.get('[data-testid="animal-status-filter"]').select('Sold');

        cy.get('[data-testid="animal-status-filter"]').should('have.value', 'sold');

        cy.get('tbody tr').each(($row) => {
            cy.wrap($row).should('contain', 'Sold');
        });
    });

    it('should search for animals using the global search', () => {
        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.get('input[placeholder="Search"]').should('be.visible').clear().type('Bessie Updated');

        cy.contains('tbody tr', 'Bessie Updated', { timeout: 10000 }).should('be.visible');
    });

    it('should display animal details correctly in the table', () => {
        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.get('thead').within(() => {
            cy.contains('Tag ID').should('be.visible');
            cy.contains('Name').should('be.visible');
            cy.contains('Breed').should('be.visible');
            cy.contains('Sex').should('be.visible');
            cy.contains('Birth Date').should('be.visible');
            cy.contains('Status').should('be.visible');
        });

        cy.get('tbody tr').should('have.length.at.least', 1);
    });

    it('should show pagination info when animals exist', () => {
        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.get('tbody tr').then(($rows) => {
            if ($rows.length > 0) {
                cy.contains(/\d+-\d+ of \d+/).should('be.visible');
            }
        });
    });

    it('should show empty state when no animals exist', () => {
        cy.visit(`/farms/${farmId}?tab=animals`);

        cy.get('tbody tr').then(($rows) => {
            if ($rows.length === 0) {
                cy.contains('No animals found').should('be.visible');
                cy.contains('Get started by adding your first animal').should('be.visible');
            } else {
                cy.contains('No animals found').should('not.exist');
            }
        });
    });
});

