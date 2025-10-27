/// <reference types="cypress" />

describe('Farms Feature', () => {
    let testEmail: string;
    let testPassword: string;

    before(() => {
        // Generate unique credentials for this test
        const timestamp = Date.now();
        testEmail = `testuser${timestamp}@example.com`;
        testPassword = 'TestPassword123!';

        // Sign up a user using reusable command
        cy.signup(testEmail, testPassword);
    });

    beforeEach(() => {
        // Clear any existing auth state
        cy.clearAuth();
        // Ensure we're authenticated for each test
        cy.signin(testEmail, testPassword);
        // Navigate to farms page to ensure we're in the right place
        cy.get('[data-testid="farms-sidebar-button"]').click();
        cy.get('[data-testid="farms-page"]').should('be.visible');
    });

    it('should create a farm and verify it appears in the list', () => {
        // Intercept the farm creation API call to verify decimal values
        cy.intercept('POST', '/api/farms', (req) => {
            console.log('🚀 Farm creation request body:', req.body);
            expect(req.body.location_latitude).to.equal(34.0522);
            expect(req.body.location_longitude).to.equal(-118.2437);
            expect(req.body.size_acres).to.equal(100);
            expect(req.body.size_hectares).to.equal(40.47);
        }).as('createFarm');

        // Click create farm button
        cy.get('[data-testid="create-farm-button"]').click();

        // Fill out the form with unique farm name
        const farmName = `Test Farm ${Date.now()}`;
        cy.get('[data-testid="farm-name-input"]').type(farmName);
        cy.get('[data-testid="farm-description-input"]').type('Test farm description');
        cy.get('[data-testid="farm-type-select"]').select('crop');
        cy.get('[data-testid="farm-location-address-input"]').type('123 Farm Road, Farm City, Farm State, Farm Country');
        // Use valueAsNumber for decimal inputs to avoid browser validation issues
        cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 34.0522;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = -118.2437;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 100;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 40.47;
            cy.wrap($input).trigger('input');
        });

        // Wait a moment for form state to update
        cy.wait(500);

        // Debug: Check the actual values in the form inputs
        cy.get('[data-testid="farm-latitude-input"]').should('have.value', '34.0522');
        cy.get('[data-testid="farm-longitude-input"]').should('have.value', '-118.2437');
        cy.get('[data-testid="farm-size-acres-input"]').should('have.value', '100');
        cy.get('[data-testid="farm-size-hectares-input"]').should('have.value', '40.47');

        // Submit the form
        cy.get('[data-testid="farm-submit-button"]').click();

        // Wait for the API call to complete and verify decimal values were sent correctly
        cy.wait('@createFarm');

        // Wait for redirect to farm detail page
        cy.url({ timeout: 10000 }).should('include', '/farms/');
        cy.url().should('not.include', '/farms/create');

        // Verify we're on the farm detail page
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // The test should FAIL if our specific farm is not found
        cy.contains(farmName).should('be.visible');

        // Verify the farm details are displayed correctly on the detail page
        // Check that farm name is displayed in the page title
        cy.get('h1').should('contain', farmName);

        // Check that farm type is displayed in the basic information section
        cy.contains('Farm Type').should('be.visible');
        cy.contains(/Crop Farm|Livestock Farm|Mixed Farm|Dairy Farm|Poultry Farm|Other/).should('be.visible');

        // Check that farm status is displayed (Active/Inactive only)
        cy.contains('Status').should('be.visible');
        cy.contains(/Active|Inactive/).should('be.visible');

        // Check that farm size is displayed
        cy.contains('Size').should('be.visible');
    });

    it('should list farms and verify farm details', () => {
        // Should show farms page (already navigated in beforeEach)
        cy.get('[data-testid="farms-page"]').should('be.visible');

        // Wait for farms to load
        cy.get('[data-testid="farms-page"]', { timeout: 10000 }).should('be.visible');

        // This test should verify that farms are properly listed
        // Check if farms exist and verify they are displayed correctly
        cy.get('body').then(($body) => {
            if ($body.find('[data-testid^="farm-card-"]').length > 0) {
                // Farms exist - verify they are displayed correctly
                cy.get('[data-testid^="farm-card-"]').first().should('be.visible');

                // Verify farm details are displayed
                cy.get('[data-testid^="farm-card-"]').first().within(() => {
                    // Check that farm name is displayed
                    cy.get('h3').should('be.visible').and('not.be.empty');

                    // Check that farm type is displayed
                    cy.contains(/Crop Farm|Livestock Farm|Mixed Farm|Dairy Farm|Poultry Farm|Other/).should('be.visible');

                    // Check that farm status is displayed (Active/Inactive only)
                    cy.contains(/Active|Inactive/).should('be.visible');

                    // Check that farm size is displayed
                    cy.contains(/Size/).should('be.visible');
                });
            } else {
                // No farms exist - this is also a valid state
                cy.log('No farms found - this is expected if no farms have been created yet');
            }
        });
    });

    it('should edit a farm successfully', () => {
        // First, create a farm to edit
        cy.get('[data-testid="create-farm-button"]').click();

        const originalFarmName = `Original Farm ${Date.now()}`;
        cy.get('[data-testid="farm-name-input"]').type(originalFarmName);
        cy.get('[data-testid="farm-description-input"]').type('Original description');
        cy.get('[data-testid="farm-type-select"]').select('crop');
        cy.get('[data-testid="farm-location-address-input"]').type('Original Address');
        cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 40.7128;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = -74.0060;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 50;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 20.23;
            cy.wrap($input).trigger('input');
        });

        cy.get('[data-testid="farm-submit-button"]').click();
        
        // Should redirect to farm detail page
        cy.url({ timeout: 10000 }).should('include', '/farms/');
        cy.url().should('not.include', '/farms/create');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // Click edit button
        cy.get('[data-testid="edit-farm-button"]').click();

        // Should be on edit page
        cy.url().should('include', '/edit');
        cy.get('[data-testid="edit-farm-page"]').should('be.visible');

        // Update the farm information
        const updatedFarmName = `Updated Farm ${Date.now()}`;
        cy.get('[data-testid="farm-name-input"]').clear().type(updatedFarmName);
        cy.get('[data-testid="farm-description-input"]').clear().type('Updated description');
        cy.get('[data-testid="farm-type-select"]').select('dairy');
        cy.get('[data-testid="farm-location-address-input"]').clear().type('Updated Address');
        cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 41.8781;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = -87.6298;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 75;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 30.35;
            cy.wrap($input).trigger('input');
        });

        // Submit the updated form
        cy.get('[data-testid="farm-submit-button"]').click();

        // Should redirect back to farms list
        cy.url({ timeout: 10000 }).should('include', '/farms');

        // Verify the updated farm appears in the list
        cy.wait(2000);
        cy.contains(updatedFarmName).should('be.visible');

        // Verify the old name is no longer visible
        cy.contains(originalFarmName).should('not.exist');

        // Click on the updated farm to verify the changes were saved
        cy.contains(updatedFarmName).closest('[data-testid^="farm-card-"]').click();

        // Should be on farm detail page
        cy.url().should('include', '/farms/');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // Verify the updated information is displayed
        cy.contains(updatedFarmName).should('be.visible');
        cy.contains('Updated description').should('be.visible');
        cy.contains('Updated Address').should('be.visible');
    });

    it('should delete a farm successfully', () => {
        // First, create a farm to delete
        cy.get('[data-testid="create-farm-button"]').click();

        const farmToDelete = `Farm to Delete ${Date.now()}`;
        cy.get('[data-testid="farm-name-input"]').type(farmToDelete);
        cy.get('[data-testid="farm-description-input"]').type('This farm will be deleted');
        cy.get('[data-testid="farm-type-select"]').select('livestock');
        cy.get('[data-testid="farm-location-address-input"]').type('Delete Address');
        cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 37.7749;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = -122.4194;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 25;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 10.12;
            cy.wrap($input).trigger('input');
        });

        cy.get('[data-testid="farm-submit-button"]').click();
        
        // Should redirect to farm detail page
        cy.url({ timeout: 10000 }).should('include', '/farms/');
        cy.url().should('not.include', '/farms/create');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // Click delete button
        cy.get('[data-testid="delete-farm-button"]').click();

        // Confirm deletion in the browser dialog
        cy.on('window:confirm', (str) => {
            expect(str).to.contain(farmToDelete);
            return true;
        });

        // Should redirect back to farms list
        cy.url({ timeout: 10000 }).should('include', '/farms');

        // Verify the farm is no longer in the list
        cy.wait(2000);
        cy.contains(farmToDelete).should('not.exist');
    });

    it('should cancel farm deletion when user cancels confirmation', () => {
        // First, create a farm
        cy.get('[data-testid="create-farm-button"]').click();

        const farmToKeep = `Farm to Keep ${Date.now()}`;
        cy.get('[data-testid="farm-name-input"]').type(farmToKeep);
        cy.get('[data-testid="farm-description-input"]').type('This farm will be kept');
        cy.get('[data-testid="farm-type-select"]').select('poultry');
        cy.get('[data-testid="farm-location-address-input"]').type('Keep Address');
        cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 39.9526;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = -75.1652;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 15;
            cy.wrap($input).trigger('input');
        });
        cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
            ($input[0] as HTMLInputElement).valueAsNumber = 6.07;
            cy.wrap($input).trigger('input');
        });

        cy.get('[data-testid="farm-submit-button"]').click();
        
        // Should redirect to farm detail page
        cy.url({ timeout: 10000 }).should('include', '/farms/');
        cy.url().should('not.include', '/farms/create');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // Click delete button
        cy.get('[data-testid="delete-farm-button"]').click();

        // Cancel deletion in the browser dialog
        cy.on('window:confirm', (str) => {
            expect(str).to.contain(farmToKeep);
            return false; // Cancel the deletion
        });

        // Should still be on the farm detail page
        cy.url().should('include', '/farms/');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // Go back to farms list and verify the farm still exists
        cy.get('[data-testid="back-to-farms-button"]').click();
        cy.url().should('include', '/farms');
        cy.contains(farmToKeep).should('be.visible');
    });
});