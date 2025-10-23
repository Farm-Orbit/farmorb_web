/// <reference types="cypress" />

describe('AuthGuard Integration Test', () => {
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
        // Set auth cookies to simulate authenticated state
        cy.setCookie('access_token', 'mock-access-token');
        cy.setCookie('refresh_token', 'mock-refresh-token');

        // Visit home page
        cy.visit('/');

        // Should stay on home page (middleware allows it)
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // Should show the home page
        cy.get('[data-testid="home-page"]').should('be.visible');
    });

    it('should redirect authenticated users away from signin page', () => {
        // Set auth cookies
        cy.setCookie('access_token', 'mock-access-token');
        cy.setCookie('refresh_token', 'mock-refresh-token');

        // Visit signin page
        cy.visit('/signin');

        // Should be redirected away from signin (middleware redirects to /admin)
        cy.url().should('not.include', '/signin');
    });

    it('should show loading state when AuthGuard is checking auth', () => {
        // Set auth cookies
        cy.setCookie('access_token', 'mock-access-token');
        cy.setCookie('refresh_token', 'mock-refresh-token');

        // Visit home page
        cy.visit('/');

        // Should show loading state briefly
        cy.get('body').should('contain.text', 'Loading...');

        // Eventually should show the home page
        cy.get('[data-testid="home-page"]').should('be.visible');
    });
});
