/// <reference types="cypress" />

describe('Signin Test', () => {
    let testEmail: string;

    before(() => {
        // Generate unique email for this test
        const timestamp = Date.now();
        testEmail = `testuser${timestamp}@example.com`;

        // First sign up a user
        cy.visit('/signup');
        cy.get('h1').should('contain', 'Sign Up');

        cy.get('[data-testid="email-input"]').type(testEmail);
        cy.get('[data-testid="password-input"]').type('TestPassword123!');
        cy.get('[data-testid="confirm-password-input"]').type('TestPassword123!');
        cy.get('input[type="checkbox"]').check();

        cy.get('[data-testid="signup-submit-button"]').click();

        // Wait for signup to complete and redirect to home
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');

        // Clear auth to test signin
        cy.clearAuth();
    });

    it('should successfully sign in a user', () => {
        // Visit signin page
        cy.visit('/signin');

        // Wait for page to load
        cy.get('h1').should('contain', 'Sign In');

        // Fill out the form with valid data
        cy.get('[data-testid="email-input"]').type(testEmail);
        cy.get('[data-testid="password-input"]').type('TestPassword123!');

        // Submit form
        cy.get('[data-testid="signin-submit-button"]').click();

        // Wait for redirect to home page (successful signin)
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');

        // Verify we're on the home page
        cy.get('[data-testid="home-page"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
        // Visit signin page
        cy.visit('/signin');

        // Wait for page to load
        cy.get('h1').should('contain', 'Sign In');

        // Fill out the form with invalid data
        cy.get('[data-testid="email-input"]').type('invalid@example.com');
        cy.get('[data-testid="password-input"]').type('wrongpassword');

        // Submit form
        cy.get('[data-testid="signin-submit-button"]').click();

        // Should stay on signin page and show error
        cy.url().should('include', '/signin');

        // Should show error message
        cy.get('.text-red-600').should('be.visible');
    });
});