/// <reference types="cypress" />

describe('Livestock Management - Herds and Animals', () => {
    let testEmail: string;
    let testPassword: string;
    let farmId: string;
    let herdId: string;

    before(() => {
        // Generate unique credentials for this test
        const timestamp = Date.now();
        testEmail = `livestock${timestamp}@example.com`;
        testPassword = 'TestPassword123!';

        // Sign up a user using reusable command
        cy.signup(testEmail, testPassword);

        cy.navigateToFarms();
        
        const farmName = `Livestock Test Farm ${timestamp}`;
        cy.createFarm(
            farmName,
            'Test farm for livestock management',
            'livestock'
        ).then((id) => {
            farmId = id;
        });
    });

    beforeEach(() => {
        // Clear any existing auth state
        cy.clearAuth();
        // Ensure we're authenticated for each test
        cy.signin(testEmail, testPassword);
        // Navigate to farm detail page
        cy.visit(`/farms/${farmId}`);
    });

    it('should create a herd and verify it appears in the list', () => {
        const herdName = `Test Herd ${Date.now()}`;
        
        // Click create herd button
        cy.get('[data-testid="create-herd-button"]').click();
        
        // Fill out the form
        cy.get('[data-testid="herd-name-input"]').type(herdName);
        cy.get('[data-testid="herd-purpose-select"]').select('dairy');
        cy.get('[data-testid="herd-location-input"]').type('Pasture 1');
        cy.get('[data-testid="herd-species-select"]').select('mammal');
        cy.get('[data-testid="herd-description-textarea"]').type('Test dairy herd');
        
        // Submit the form
        cy.get('[data-testid="create-herd-submit-button"]').click();
        
        // Wait for the herd to appear in the list
        cy.contains(herdName).should('be.visible');
        
        // Verify herd details are shown
        cy.contains('Dairy').should('be.visible');
        cy.contains('Pasture 1').should('be.visible');
    });

    it('should expand a herd to view animals', () => {
        // Wait for herds to load
        cy.get('[data-testid="herds-section"]').should('be.visible');
        
        // Find the first herd card and expand it
        cy.get('[data-testid^="herd-card-"]').first().within(() => {
            cy.get('[data-testid^="toggle-animals-"]').click();
        });
        
        // Verify animals section is visible
        cy.get('[data-testid="animals-section"]').should('be.visible');
    });

    it('should add an animal to a herd', () => {
        // Wait for herds to load and expand the first herd
        cy.get('[data-testid="herds-section"]').should('be.visible');
        
        cy.get('[data-testid^="herd-card-"]').first().within(() => {
            cy.get('[data-testid^="toggle-animals-"]').click();
        });
        
        // Click add animal button
        cy.get('[data-testid="create-animal-button"]').click();
        
        // Fill out the animal form
        const tagId = `TAG${Date.now()}`;
        cy.get('[data-testid="animal-tag-id-input"]').type(tagId);
        cy.get('[data-testid="animal-name-input"]').type('Bessie');
        cy.get('[data-testid="animal-sex-select"]').select('female');
        cy.get('[data-testid="animal-breed-input"]').type('Holstein');
        cy.get('[data-testid="animal-tracking-type-select"]').select('individual');
        
        // Submit the form
        cy.get('[data-testid="create-animal-submit-button"]').click();
        
        // Verify animal appears in the list
        cy.contains('Bessie').should('be.visible');
        cy.contains(tagId).should('be.visible');
        cy.contains('Holstein').should('be.visible');
    });

    it('should edit a herd', () => {
        // Wait for herds to load
        cy.get('[data-testid="herds-section"]').should('be.visible');
        
        // Find the first herd card and edit it
        cy.get('[data-testid^="herd-card-"]').first().within(() => {
            cy.get('[data-testid^="edit-herd-"]').click();
        });
        
        // Wait for edit modal to open
        cy.get('[data-testid="edit-herd-name-input"]').should('be.visible');
        
        // Update the herd name
        cy.get('[data-testid="edit-herd-name-input"]').clear().type('Updated Herd Name');
        
        // Submit the form
        cy.get('[data-testid="update-herd-submit-button"]').click();
        
        // Verify the herd was updated
        cy.contains('Updated Herd Name').should('be.visible');
    });

    it('should edit an animal', () => {
        // Wait for herds to load and expand the first herd
        cy.get('[data-testid="herds-section"]').should('be.visible');
        
        cy.get('[data-testid^="herd-card-"]').first().within(() => {
            cy.get('[data-testid^="toggle-animals-"]').click();
        });
        
        // Wait for animals to load and find the first animal
        cy.get('[data-testid^="animal-card-"]').first().within(() => {
            cy.get('[data-testid^="edit-animal-"]').click();
        });
        
        // Wait for edit modal to open
        cy.get('[data-testid="edit-animal-name-input"]').should('be.visible');
        
        // Update the animal name
        cy.get('[data-testid="edit-animal-name-input"]').clear().type('Updated Animal Name');
        
        // Submit the form
        cy.get('[data-testid="update-animal-submit-button"]').click();
        
        // Verify the animal was updated
        cy.contains('Updated Animal Name').should('be.visible');
    });

    it('should delete an animal', () => {
        // Wait for herds to load and expand the first herd
        cy.get('[data-testid="herds-section"]').should('be.visible');
        
        cy.get('[data-testid^="herd-card-"]').first().within(() => {
            cy.get('[data-testid^="toggle-animals-"]').click();
        });
        
        // Wait for animals to load and get count
        let animalCount = 0;
        cy.get('[data-testid^="animal-card-"]').then(($animals) => {
            animalCount = $animals.length;
            
            // Delete the first animal
            cy.get('[data-testid^="animal-card-"]').first().within(() => {
                cy.get('[data-testid^="delete-animal-"]').click();
            });
            
            // Confirm deletion
            cy.on('window:confirm', () => true);
            
            // Verify the animal count decreased
            if (animalCount > 0) {
                cy.get('[data-testid^="animal-card-"]').should('have.length', animalCount - 1);
            }
        });
    });

    it('should delete a herd', () => {
        // Wait for herds to load and get count
        cy.get('[data-testid="herds-section"]').should('be.visible');
        
        let herdCount = 0;
        cy.get('[data-testid^="herd-card-"]').then(($herds) => {
            herdCount = $herds.length;
            
            if (herdCount > 0) {
                // Delete the first herd
                cy.get('[data-testid^="herd-card-"]').first().within(() => {
                    cy.get('[data-testid^="delete-herd-"]').click();
                });
                
                // Confirm deletion
                cy.on('window:confirm', () => true);
                
                // Verify the herd count decreased
                cy.get('[data-testid^="herd-card-"]').should('have.length', herdCount - 1);
            }
        });
    });
});

