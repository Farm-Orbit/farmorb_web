/// <reference types="cypress" />

describe('AuthGuard Integration Test', () => {
    const password = 'TestPassword123!';

    beforeEach(() => {
        // Clear all auth data before each test
        cy.clearAuth();
    });

    it('should redirect to signin when not authenticated', () => {
        // Visit home page without authentication
        cy.visit('/');

        // Should be redirected to signin page by middleware
        cy.url().should('include', '/signin');
        cy.get('h1').should('contain', 'Sign In');
    });

    it('should allow access to home page when authenticated', () => {
        const email = `authguard${Date.now()}@example.com`;

        cy.signup(email, password);
        cy.visit('/');

        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
        cy.get('[data-testid="home-page"]').should('be.visible');
    });

    it('should redirect authenticated users away from signin page', () => {
        const email = `authguard-redirect${Date.now()}@example.com`;

        cy.signup(email, password);
        cy.visit('/signin');

        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
        cy.get('[data-testid="home-page"]').should('be.visible');
    });

    it('should show loading state when AuthGuard is checking auth', () => {
        const email = `authguard-loading${Date.now()}@example.com`;

        cy.signup(email, password);

        // Reload to simulate a fresh session that needs to rehydrate from tokens
        cy.reload();

        cy.contains('Loading...', { timeout: 3000 }).should('be.visible');
        cy.get('[data-testid="home-page"]', { timeout: 10000 }).should('be.visible');
    });
});
