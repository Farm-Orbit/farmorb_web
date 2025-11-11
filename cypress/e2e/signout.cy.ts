/// <reference types="cypress" />

describe('Signout Test', () => {
    let testEmail: string;

    beforeEach(() => {
        // Generate unique email for this test
        const timestamp = Date.now();
        testEmail = `testuser${timestamp}@example.com`;

        // First sign up a user
        cy.clearAuth();
        cy.visit('/signup');
        cy.get('h1').should('contain', 'Sign Up');

        cy.get('[data-testid="email-input"]').type(testEmail);
        cy.get('[data-testid="password-input"]').type('TestPassword123!');
        cy.get('[data-testid="confirm-password-input"]').type('TestPassword123!');
        cy.get('input[type="checkbox"]').check();

        cy.get('[data-testid="signup-submit-button"]').click();

        // Wait for signup to complete and redirect to home
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');

        // Verify we're on the home page
        cy.get('[data-testid="home-page"]').should('be.visible');
    });

    it('should successfully sign out a user', () => {
        // Click on user dropdown
        cy.get('[data-testid="user-dropdown-button"]').click();

        // Wait for dropdown to open and verify signout button is visible
        cy.get('[data-testid="signout-button"]').should('be.visible');

        // Click sign out button
        cy.get('[data-testid="signout-button"]').click();

        // Should be redirected to signin page
        cy.url({ timeout: 10000 }).should('include', '/signin');

        // Should show signin page
        cy.get('h1').should('contain', 'Sign In');
    });
});