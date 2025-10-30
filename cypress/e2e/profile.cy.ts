/// <reference types="cypress" />

describe('User Profile Feature', () => {
    let testEmail: string;
    let testPassword: string;

    before(() => {
        // Generate unique credentials for this test
        const timestamp = Date.now();
        testEmail = `profile${timestamp}@example.com`;
        testPassword = 'TestPassword123!';

        // Sign up a user using reusable command
        cy.signup(testEmail, testPassword);
    });

    beforeEach(() => {
        // Clear any existing auth state
        cy.clearAuth();
        // Ensure we're authenticated for each test
        cy.signin(testEmail, testPassword);
    });

    it('should update user profile information successfully', () => {
        const newFirstName = 'Updated First';
        const newLastName = 'Updated Last';
        
        // Navigate to profile page via header dropdown
        cy.get('[data-testid="user-dropdown-button"]').click();
        cy.get('a[href="/profile"]').click();
        cy.url({ timeout: 10000 }).should('include', '/profile');

        // Open edit modal and update profile
        cy.get('[data-testid="edit-profile-button"]').click();
        cy.get('[data-testid="first-name-input"]').clear().type(newFirstName);
        cy.get('[data-testid="last-name-input"]').clear().type(newLastName);
        cy.get('[data-testid="save-profile-button"]').click();
        
        // Wait for API call to complete and modal to close
        cy.contains('Edit Personal Information').should('not.exist');
        
        // Verify the form shows the updated values
        cy.get('[data-testid="edit-profile-button"]').click();
        cy.get('[data-testid="first-name-input"]').should('have.value', newFirstName);
        cy.get('[data-testid="last-name-input"]').should('have.value', newLastName);
        
        // Close modal
        cy.get('[data-testid="close-profile-button"]').click();
    });

    it('should update password successfully and verify with login', () => {
        const newPassword = 'NewSecurePassword123!';
        
        // Navigate to profile page
        cy.get('[data-testid="user-dropdown-button"]').click();
        cy.get('a[href="/profile"]').click();
        cy.url({ timeout: 10000 }).should('include', '/profile');

        // Open password change modal
        cy.get('[data-testid="change-password-button"]').click();
        cy.get('[data-testid="change-password-modal-title"]').should('be.visible');
        
        // Fill in password form with valid data
        cy.get('[data-testid="current-password-input"]').type(testPassword);
        cy.get('[data-testid="new-password-input"]').type(newPassword);
        cy.get('[data-testid="confirm-password-input"]').type(newPassword);
        
        // Submit the form
        cy.get('[data-testid="save-password-button"]').click();
        
        // Wait for password change to complete and modal to close
        cy.get('[data-testid="change-password-modal-title"]', { timeout: 15000 }).should('not.exist');
        
        // Verify success notification appears
        cy.get('[data-testid="notification-container"]').should('be.visible');
        cy.contains('Password changed successfully!').should('be.visible');
        
        // Sign out to test the new password
        cy.signout();
        
        // Try to sign in with old password - should fail
        cy.visit('/signin');
        cy.get('[data-testid="email-input"]').type(testEmail);
        cy.get('[data-testid="password-input"]').type(testPassword);
        cy.get('[data-testid="signin-submit-button"]').click();
        
        // Should stay on signin page and show error
        cy.url().should('include', '/signin');
        
        // Now sign in with new password - should succeed
        cy.get('[data-testid="password-input"]').clear().type(newPassword);
        cy.get('[data-testid="signin-submit-button"]').click();
        
        // Should redirect to home page
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
        cy.get('[data-testid="home-page"]').should('be.visible');
    });

    it.skip('should validate email form correctly', () => {
        // Navigate to profile page
        cy.get('[data-testid="user-dropdown-button"]').click();
        cy.get('a[href="/profile"]').click();
        cy.url({ timeout: 10000 }).should('include', '/profile');

        // Open email change modal
        cy.get('[data-testid="change-email-button"]').click();
        
        // Test validation - invalid email format
        cy.get('[data-testid="new-email-input"]').type('invalid-email');
        cy.get('[data-testid="save-email-button"]').click();
        cy.contains('Please enter a valid email address').should('be.visible');
    });
});