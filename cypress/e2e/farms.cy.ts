/// <reference types="cypress" />

describe('Farms Feature', () => {
    let testEmail: string;
    let testPassword: string;
    let testFarmId: string;
    let testFarmName: string;

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

    // Helper function to fill farm form with data
    const fillFarmForm = (farmData: {
        name: string;
        description: string;
        type: string;
        address: string;
        lat?: number;
        lng?: number;
        acres?: number;
        hectares?: number;
    }) => {
        cy.get('[data-testid="farm-name-input"]').clear().type(farmData.name);
        cy.get('[data-testid="farm-description-input"]').clear().type(farmData.description);
        cy.get('[data-testid="farm-type-select"]').select(farmData.type);
        cy.get('[data-testid="farm-location-address-input"]').clear().type(farmData.address);
        
        if (farmData.lat !== undefined) {
        cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
                ($input[0] as HTMLInputElement).valueAsNumber = farmData.lat!;
            cy.wrap($input).trigger('input');
        });
        }
        
        if (farmData.lng !== undefined) {
        cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
                ($input[0] as HTMLInputElement).valueAsNumber = farmData.lng!;
            cy.wrap($input).trigger('input');
        });
        }
        
        if (farmData.acres !== undefined) {
        cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
                ($input[0] as HTMLInputElement).valueAsNumber = farmData.acres!;
            cy.wrap($input).trigger('input');
        });
        }
        
        if (farmData.hectares !== undefined) {
        cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
                ($input[0] as HTMLInputElement).valueAsNumber = farmData.hectares!;
            cy.wrap($input).trigger('input');
            });
        }
    };

    // Helper function to verify URL is farms list (not detail page)
    const verifyFarmsListUrl = () => {
        cy.url({ timeout: 10000 }).should((url) => {
            expect(url).to.include('/farms');
            // Should not have a UUID pattern after /farms/
            expect(url).to.not.match(/\/farms\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        });
        cy.get('[data-testid="farms-page"]').should('be.visible');
    };

    // Helper function to verify farm detail page
    const verifyFarmDetailPage = (farmName: string) => {
        cy.url({ timeout: 10000 }).should('include', '/farms/');
        cy.url().should('not.include', '/farms/create');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');
        cy.get('h1', { timeout: 10000 }).should('contain', farmName);
        cy.get('h1').should('not.contain', 'Loading...');
    };

    it('should handle complete farm CRUD lifecycle', () => {
        const timestamp = Date.now();
        const originalFarmName = `Test Farm ${timestamp}`;
        const updatedFarmName = `Updated Farm ${timestamp}`;

        // CREATE: Create a new farm
        cy.get('[data-testid="create-farm-button"]').click();
        
        fillFarmForm({
            name: originalFarmName,
            description: 'Original farm description',
            type: 'crop',
            address: '123 Farm Road, Farm City, Farm State, Farm Country',
            lat: 34.0522,
            lng: -118.2437,
            acres: 100,
            hectares: 40.47
        });

        // Verify form values before submission
        cy.get('[data-testid="farm-latitude-input"]').should('have.value', '34.0522');
        cy.get('[data-testid="farm-longitude-input"]').should('have.value', '-118.2437');
        cy.get('[data-testid="farm-size-acres-input"]').should('have.value', '100');
        cy.get('[data-testid="farm-size-hectares-input"]').should('have.value', '40.47');

        // Submit the form
        cy.get('[data-testid="farm-submit-button"]').click();

        // Verify redirect to farm detail page
        verifyFarmDetailPage(originalFarmName);

        // Store farm ID from URL for later use
        cy.url().then((url) => {
            const urlParts = url.split('/');
            testFarmId = urlParts[urlParts.length - 1];
            testFarmName = originalFarmName;
        });

        // Verify farm details on detail page
        cy.get('h1').should('contain', originalFarmName);
        
        // Navigate to Details tab to verify farm information
        cy.get('[data-testid="tab-details"]').click();
        cy.contains('Basic Information', { timeout: 10000 }).should('be.visible');
        cy.contains('Farm Type').should('be.visible');
        cy.contains('Crop Farm').should('be.visible');
        cy.contains('Status').should('be.visible');
        cy.contains(/Active|Inactive/).should('be.visible');
        cy.contains('Size').should('be.visible');
        cy.contains('Description').should('be.visible');
        cy.contains('Original farm description').should('be.visible');

        // READ: Verify farm appears in farms list
        cy.get('[data-testid="farms-sidebar-button"]').click();
        verifyFarmsListUrl();
        
        // Wait for farms to load
        cy.wait(2000);
        cy.contains(originalFarmName, { timeout: 10000 }).should('be.visible');
        
        // Verify farm details in the list
        cy.contains(originalFarmName).closest('[data-testid^="farm-row-"]').within(() => {
            cy.contains(/Crop|Livestock|Mixed|Dairy|Poultry|Other/).should('be.visible');
            cy.contains(/Active|Inactive/).should('be.visible');
        });

        // UPDATE: Edit the farm
        cy.contains(originalFarmName).closest('[data-testid^="farm-row-"]').click();
        verifyFarmDetailPage(originalFarmName);

        // Click edit button
        cy.get('[data-testid="edit-farm-button"]').click();
        cy.url().should('include', '/edit');
        cy.get('[data-testid="edit-farm-page"]').should('be.visible');

        // Update the farm information
        fillFarmForm({
            name: updatedFarmName,
            description: 'Updated farm description',
            type: 'dairy',
            address: 'Updated Address, New City, New State',
            lat: 41.8781,
            lng: -87.6298,
            acres: 75,
            hectares: 30.35
        });

        // Submit the updated form
        cy.get('[data-testid="farm-submit-button"]').click();

        // Verify redirect back to farms list
        verifyFarmsListUrl();
        cy.wait(2000);

        // Verify the updated farm appears in the list
        cy.contains(updatedFarmName, { timeout: 10000 }).should('be.visible');
        cy.contains(originalFarmName).should('not.exist');

        // Verify updated details on farm detail page
        cy.contains(updatedFarmName).closest('[data-testid^="farm-row-"]').click();
        verifyFarmDetailPage(updatedFarmName);

        // Navigate to Details tab to verify updated information
        cy.get('[data-testid="tab-details"]').click();
        cy.contains('Basic Information', { timeout: 10000 }).should('be.visible');
        cy.contains('Location Information', { timeout: 10000 }).should('be.visible');

        // Verify updated information
        cy.get('h1').should('contain', updatedFarmName);
        cy.contains('Dairy Farm', { timeout: 10000 }).should('be.visible');
        cy.contains('Updated Address', { timeout: 10000 }).should('be.visible');
        cy.contains('Description', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="farm-detail-page"]').within(() => {
            cy.contains('Updated farm description', { timeout: 10000 }).should('be.visible');
        });

        // DELETE: Delete the farm
        // Stub window.confirm to return true (confirm deletion) BEFORE clicking delete
        cy.window().then((win) => {
            cy.stub(win, 'confirm').as('confirmStub').returns(true);
        });

        // Click delete button
        cy.get('[data-testid="delete-farm-button"]').click();

        // Verify the confirm dialog was called with the correct message
        cy.get('@confirmStub').should('have.been.calledWith', `Are you sure you want to delete "${updatedFarmName}"?`);

        // Verify redirect back to farms list
        verifyFarmsListUrl();

        // Wait for the list to refresh and verify the farm is no longer in the list
        cy.wait(2000);
        cy.contains(updatedFarmName).should('not.exist');
    });

    it('should handle farm deletion cancellation', () => {
        const timestamp = Date.now();
        const farmToKeep = `Farm to Keep ${timestamp}`;

        // Create a farm
        cy.get('[data-testid="create-farm-button"]').click();
        
        fillFarmForm({
            name: farmToKeep,
            description: 'This farm will be kept',
            type: 'poultry',
            address: 'Keep Address',
            lat: 39.9526,
            lng: -75.1652,
            acres: 15,
            hectares: 6.07
        });

        cy.get('[data-testid="farm-submit-button"]').click();
        verifyFarmDetailPage(farmToKeep);

        // Attempt to delete but cancel the confirmation
        cy.window().then((win) => {
            cy.stub(win, 'confirm').as('confirmStub').returns(false);
        });

        cy.get('[data-testid="delete-farm-button"]').click();

        // Verify the confirm dialog was called with the correct message
        cy.get('@confirmStub').should('have.been.calledWith', `Are you sure you want to delete "${farmToKeep}"?`);

        // Verify we're still on the farm detail page (deletion was cancelled)
        cy.url({ timeout: 5000 }).should('include', '/farms/');
        cy.get('[data-testid="farm-detail-page"]').should('be.visible');

        // Navigate back to farms list and verify the farm still exists
        cy.get('[data-testid="farms-sidebar-button"]').click();
        verifyFarmsListUrl();
        
        cy.wait(1000);
        cy.contains(farmToKeep).should('be.visible');
    });
});
