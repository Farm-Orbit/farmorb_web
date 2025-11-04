/// <reference types="cypress" />

describe('Group Management', () => {
    let testEmail: string;
    let testPassword: string;
    let farmId: string;

    before(() => {
        // Generate unique credentials for this test
        const timestamp = Date.now();
        testEmail = `groups${timestamp}@example.com`;
        testPassword = 'TestPassword123!';

        // Sign up a user using reusable command
        cy.signup(testEmail, testPassword);

        cy.navigateToFarms();
        
        const farmName = `Group Test Farm ${timestamp}`;
        cy.createFarm(
            farmName,
            'Test farm for group management',
            'livestock'
        ).then((id) => {
            farmId = id;
            cy.log('Farm created with ID:', id);
        });
    });

    beforeEach(() => {
        // Clear any existing auth state
        cy.clearAuth();
        // Ensure we're authenticated for each test
        cy.signin(testEmail, testPassword);
        // Navigate to farm detail page
        cy.visit(`/farms/${farmId}`);
        cy.wait(1000);
        // Navigate to Groups tab
        cy.get('[data-testid="tab-groups"]', { timeout: 10000 }).click();
        // Wait for the groups section to load (either empty state or table)
        cy.wait(2000);
    });

    it('should create a group and verify it appears in the table', () => {
        const groupName = `Test Group ${Date.now()}`;
        
        // First, verify empty state or table is visible
        cy.get('body').then(($body) => {
            // Check if empty state or table exists
            const hasEmptyState = $body.find(':contains("No groups found")').length > 0;
            const hasTable = $body.find('.MuiTable-root').length > 0;
            
            cy.log(`Empty state: ${hasEmptyState}, Has table: ${hasTable}`);
        });
        
        // Click create group button (use longer timeout)
        cy.get('[data-testid="create-group-button"]', { timeout: 10000 }).should('be.visible').click();
        
        // Wait for modal to open and be fully rendered
        cy.wait(1000);
        
        // Fill out the form
        cy.get('[data-testid="group-name-input"]', { timeout: 10000 }).should('be.visible').clear().type(groupName);
        cy.get('[data-testid="group-purpose-input"]').should('be.visible').clear().type('Breeding');
        cy.get('[data-testid="group-description-textarea"]').should('be.visible').type('Test breeding group');
        
        // Submit the form
        cy.get('[data-testid="create-group-submit-button"]').should('be.visible').click();
        
        // Wait for the modal to close and table to update
        cy.wait(3000);
        
        // Verify group appears in the page (could be in table or as first item)
        cy.contains(groupName, { timeout: 10000 }).should('be.visible');
        
        // Verify table now exists
        cy.get('.MuiTable-root', { timeout: 5000 }).should('be.visible');
    });

    it('should edit a group', () => {
        // Wait for table content to load (MUI table structure)
        cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
        
        // Find the first edit button in the table
        cy.get('tbody tr').first().within(() => {
            cy.contains('button', 'Edit', { timeout: 5000 }).click();
        });
        
        // Wait for edit modal to open
        cy.get('[data-testid="group-name-input"]', { timeout: 10000 }).should('be.visible');
        
        // Update the group name
        const updatedName = `Updated Group ${Date.now()}`;
        cy.get('[data-testid="group-name-input"]').clear().type(updatedName);
        
        // Submit the form
        cy.get('[data-testid="update-group-submit-button"]').click();
        
        // Wait for modal to close and table to update
        cy.wait(2000);
        
        // Verify the group was updated
        cy.contains(updatedName, { timeout: 10000 }).should('be.visible');
    });

    it('should search for groups', () => {
        // Wait for table to load
        cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
        
        // Get the search input (Material React Table search)
        cy.get('input[placeholder="Search"]', { timeout: 10000 }).should('be.visible').type('Test');
        
        // Wait for search to apply
        cy.wait(1000);
        
        // Verify search results contain "Test"
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length > 0) {
                cy.wrap($rows).each(($row) => {
                    cy.wrap($row).should('contain', 'Test');
                });
            }
        });
    });

    it('should delete a group', () => {
        // Wait for table to load
        cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
        
        // Get initial count
        cy.get('tbody tr').then(($rows) => {
            const initialCount = $rows.length;
            
            if (initialCount > 0) {
                // Delete the last group (to avoid deleting one we just created in other tests)
                cy.get('tbody tr').last().within(() => {
                    cy.contains('button', 'Delete').click();
                });
                
                // Confirm deletion
                cy.on('window:confirm', () => true);
                
                // Wait for deletion to complete
                cy.wait(2000);
                
                // Verify the group count decreased or table is empty
                cy.get('body').then(($body) => {
                    if ($body.find('tbody tr').length > 0) {
                        cy.get('tbody tr').should('have.length', initialCount - 1);
                    } else {
                        // Empty state should be visible
                        cy.contains('No groups found').should('be.visible');
                    }
                });
            }
        });
    });

    it('should show empty state when no groups exist', () => {
        // Check if table exists and has rows
        cy.get('body').then(($body) => {
            if ($body.find('tbody tr').length > 0) {
                // Delete all groups
                cy.get('tbody tr').then(($rows) => {
                    const count = $rows.length;
                    
                    for (let i = 0; i < count; i++) {
                        cy.get('tbody tr').first().within(() => {
                            cy.contains('button', 'Delete').click();
                        });
                        cy.on('window:confirm', () => true);
                        cy.wait(1000);
                    }
                });
            }
        });
        
        // Wait for state to update
        cy.wait(1000);
        
        // Verify empty state is shown
        cy.contains('No groups found', { timeout: 10000 }).should('be.visible');
        cy.contains('Get started by creating your first group').should('be.visible');
    });
});

