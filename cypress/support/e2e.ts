// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
    try {
        const serviceWorker = win.navigator?.serviceWorker;
        if (serviceWorker?.getRegistrations) {
            serviceWorker
                .getRegistrations()
                .then((registrations) => {
                    registrations.forEach((registration) => {
                        registration.unregister();
                    });
                })
                .catch(() => {
                    // ignore failures when service workers cannot be queried (e.g. invalid controller state)
                });
        }
    } catch (error) {
        // ignore errors that occur while attempting to disable service workers
    }
});

// Map tiles are stubbed for every spec. Fetching real tiles from
// OpenStreetMap makes the suite slow and non-deterministic — one map test went
// from 4 seconds to 16 minutes once their rate limiting kicked in — and their
// usage policy discourages automated bulk downloading. The map's behaviour is
// what is under test, not the imagery.
const BLANK_TILE = Cypress.Blob.base64StringToBlob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'image/png'
);

beforeEach(() => {
    cy.intercept({ hostname: /tile\.openstreetmap\.org$/ }, (req) => {
        req.reply({ statusCode: 200, body: BLANK_TILE, headers: { 'content-type': 'image/png' } });
    });
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
    // Prevent Cypress from failing the test on uncaught exceptions
    // that are not related to the application being tested
    if (err.message.includes('ResizeObserver loop limit exceeded')) {
        return false;
    }
    if (err.message.includes('Non-Error promise rejection captured')) {
        return false;
    }
    return true;
});
