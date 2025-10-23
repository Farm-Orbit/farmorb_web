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

export { };
