import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1600,
        viewportHeight: 900,
        video: false,
        screenshotOnRunFailure: false,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack',
        },
    },
    env: {
        // Environment variables for testing
        SUPABASE_URL: 'http://127.0.0.1:54421',
        API_URL: 'http://127.0.0.1:54421',
        TEST_USER_EMAIL: 'test@example.com',
        TEST_USER_PASSWORD: 'TestPassword123!',
    },
});
