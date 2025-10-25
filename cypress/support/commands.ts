/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-cy attribute.
             * @example cy.dataCy('greeting')
             */
            dataCy(value: string): Chainable<JQuery<HTMLElement>>;

            /**
             * Custom command to login with test credentials
             * @example cy.login('test@example.com', 'password123')
             */
            login(email: string, password: string): Chainable<void>;

            /**
             * Custom command to logout
             * @example cy.logout()
             */
            logout(): Chainable<void>;

            /**
             * Custom command to clear all cookies and localStorage
             * @example cy.clearAuth()
             */
            clearAuth(): Chainable<void>;

            /**
             * Custom command to set authentication cookies
             * @example cy.setAuthCookies('access-token', 'refresh-token')
             */
            setAuthCookies(accessToken: string, refreshToken?: string): Chainable<void>;

            /**
             * Custom command to wait for API response
             * @example cy.waitForApi('POST', '/auth/login')
             */
            waitForApi(method: string, url: string): Chainable<void>;

            /**
             * Custom command to sign up a new user
             * @example cy.signup('test@example.com', 'password123')
             */
            signup(email: string, password: string): Chainable<void>;

            /**
             * Custom command to sign in with credentials
             * @example cy.signin('test@example.com', 'password123')
             */
            signin(email: string, password: string): Chainable<void>;
        }
    }
}

// Custom command to select by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => {
    return cy.get(`[data-cy=${value}]`);
});

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.session([email, password], () => {
        cy.visit('/signin');
        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/admin');
    });
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
        win.sessionStorage.clear();
    });
});

// Custom command to clear authentication data
Cypress.Commands.add('clearAuth', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
        win.sessionStorage.clear();
    });
});

// Custom command to set authentication cookies
Cypress.Commands.add('setAuthCookies', (accessToken: string, refreshToken?: string) => {
    cy.setCookie('access_token', accessToken);
    if (refreshToken) {
        cy.setCookie('refresh_token', refreshToken);
    }
});

// Custom command to wait for API calls
Cypress.Commands.add('waitForApi', (method: string, url: string) => {
    cy.intercept(method, url).as('apiCall');
    cy.wait('@apiCall');
});

// Custom command to sign up a new user
Cypress.Commands.add('signup', (email: string, password: string) => {
    cy.visit('/signup');
    cy.get('h1').should('contain', 'Sign Up');

    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="confirm-password-input"]').type(password);
    cy.get('input[type="checkbox"]').check();

    cy.get('[data-testid="signup-submit-button"]').click();

    // Wait for signup to complete and redirect to home
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
    cy.get('[data-testid="home-page"]').should('be.visible');
});

// Custom command to sign in with credentials
Cypress.Commands.add('signin', (email: string, password: string) => {
    cy.visit('/signin');

    // Check if we're already on the home page (already authenticated)
    cy.url().then((url) => {
        if (url === Cypress.config().baseUrl + '/') {
            cy.log('Already authenticated, skipping signin');
            cy.get('[data-testid="home-page"]').should('be.visible');
        } else {
            // Not authenticated, proceed with signin
            cy.get('h1').should('contain', 'Sign In');

            cy.get('[data-testid="email-input"]').type(email);
            cy.get('[data-testid="password-input"]').type(password);

            cy.get('[data-testid="signin-submit-button"]').click();

            // Wait for signin to complete and redirect to home
            cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
            cy.get('[data-testid="home-page"]').should('be.visible');
        }
    });
});

export { };
