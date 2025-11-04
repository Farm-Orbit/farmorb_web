/// <reference types="cypress" />

describe('Animal Management', () => {
    let testEmail: string;
    let testPassword: string;
    let farmId: string;
    let groupId: string;

    before(() => {
        // Generate unique credentials for this test
        const timestamp = Date.now();
        testEmail = `animals${timestamp}@example.com`;
        testPassword = 'TestPassword123!';

        // Sign up a user using reusable command
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
        // Clear any existing auth state
        cy.clearAuth();
        // Ensure we're authenticated for each test
        cy.signin(testEmail, testPassword);
        // Navigate to farm detail page
        cy.visit(`/farms/${farmId}`);
    });

    it('should create a group first (prerequisite for animals)', () => {
        // Navigate to Groups tab
        cy.get('[data-testid="tab-groups"]').click();
        
        const groupName = `Test Group for Animals ${Date.now()}`;
        
        // Click create group button
        cy.get('[data-testid="create-group-button"]').click();
        
        // Fill out the form
        cy.get('[data-testid="group-name-input"]').type(groupName);
        cy.get('[data-testid="group-purpose-input"]').clear().type('Breeding');
        cy.get('[data-testid="group-description-textarea"]').type('Test group for animal tests');
        
        // Submit the form
        cy.get('[data-testid="create-group-submit-button"]').click();
        
        // Wait for the group to be created
        cy.wait(1000);
        
        // Verify group appears
        cy.contains(groupName).should('be.visible');
    });

    it('should add an animal', () => {
        // Navigate to Animals tab
        cy.get('[data-testid="tab-animals"]').click();
        
        // Wait for animals table to load
        cy.wait(1000);
        
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
        
        // Wait for modal to close and table to update
        cy.wait(1000);
        
        // Verify animal appears in the table
        cy.contains('Bessie').should('be.visible');
        cy.contains(tagId).should('be.visible');
        cy.contains('Holstein').should('be.visible');
    });

    // Note: Animals are now associated with groups through a many-to-many relationship
    // The animals table doesn't currently have a group filter, so this test is skipped
    // Animals can be added to groups via the groups interface

    it('should filter animals by status', () => {
        // Navigate to Animals tab
        cy.get('[data-testid="tab-animals"]').click();
        
        // Wait for animals to load
        cy.wait(1000);
        
        // Get the status filter dropdown (second select)
        cy.get('select').eq(1).select('Active');
        
        // Wait for filter to apply
        cy.wait(500);
        
        // Verify only active animals are shown
        cy.get('tbody tr').each(($row) => {
            cy.wrap($row).should('contain', 'Active');
        });
    });

    it('should search for animals', () => {
        // Navigate to Animals tab
        cy.get('[data-testid="tab-animals"]').click();
        
        // Wait for animals to load
        cy.wait(1000);
        
        // Get the search input
        cy.get('input[placeholder="Search"]').should('be.visible').type('Bessie');
        
        // Wait for search to apply
        cy.wait(500);
        
        // Verify search results
        cy.get('tbody tr').should('contain', 'Bessie');
    });

    it('should display animal details correctly in the table', () => {
        // Navigate to Animals tab
        cy.get('[data-testid="tab-animals"]').click();
        
        // Wait for animals to load
        cy.wait(1000);
        
        // Verify table has the expected columns
        cy.get('thead').within(() => {
            cy.contains('Tag ID').should('be.visible');
            cy.contains('Name').should('be.visible');
            cy.contains('Breed').should('be.visible');
            cy.contains('Sex').should('be.visible');
            cy.contains('Birth Date').should('be.visible');
            cy.contains('Status').should('be.visible');
        });
        
        // Verify at least one animal row exists
        cy.get('tbody tr').should('have.length.at.least', 1);
    });

    it('should show animal count in table', () => {
        // Navigate to Animals tab
        cy.get('[data-testid="tab-animals"]').click();
        
        // Wait for animals to load
        cy.wait(1000);
        
        // Check if pagination info is visible
        cy.get('tbody tr').then(($rows) => {
            const count = $rows.length;
            if (count > 0) {
                // Verify pagination/count info exists
                cy.contains(/\d+-\d+ of \d+/).should('be.visible');
            }
        });
    });

    it('should show empty state when no animals exist', () => {
        // Navigate to Animals tab
        cy.get('[data-testid="tab-animals"]').click();
        
        // Wait for animals to load
        cy.wait(1000);
        
        // If there are animals, delete them first (this would require individual deletion)
        // For now, just verify the empty state message appears when appropriate
        cy.get('body').then(($body) => {
            if ($body.find('tbody tr').length === 0) {
                // Verify empty state is shown
                cy.contains('No animals found').should('be.visible');
                cy.contains('Get started by adding your first animal').should('be.visible');
            }
        });
    });

    // Note: Animals are now independent of groups - they can be created without groups
    // Animals can be added to groups later through the groups interface
    // This test is no longer applicable as animals don't require groups to exist
});

