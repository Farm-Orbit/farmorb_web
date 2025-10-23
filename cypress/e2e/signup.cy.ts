/// <reference types="cypress" />

describe('Signup Test', () => {
    it('should successfully sign up a new user', () => {
        // Generate unique email for this test
        const timestamp = Date.now();
        const testEmail = `testuser${timestamp}@example.com`;

        // Visit signup page
        cy.visit('/signup');

        // Wait for page to load
        cy.get('h1').should('contain', 'Sign Up');

        // Fill out the form with valid data
        cy.get('[data-testid="email-input"]').type(testEmail);
        cy.get('[data-testid="password-input"]').type('TestPassword123!');
        cy.get('[data-testid="confirm-password-input"]').type('TestPassword123!');

        // Accept terms
        cy.get('input[type="checkbox"]').check();

        // Submit form
        cy.get('[data-testid="signup-submit-button"]').click();

        // Wait for redirect to home page (successful signup)
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');

        // Verify we're on the home page
        cy.get('[data-testid="home-page"]').should('be.visible');
    });
});
