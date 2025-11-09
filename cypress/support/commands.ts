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
             * Custom command to signout via UI
             * @example cy.signout()
             */
            signout(): Chainable<void>;
            /**
             * Custom command to verify farms are present
             * @example cy.verifyFarmsPresent(['Farm 1', 'Farm 2'])
             */
            verifyFarmsPresent(farmNames: string[]): Chainable<void>;

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
             * Create an animal via the UI
             */
            createAnimal(tagId: string, options?: {
                name?: string;
                sex?: 'male' | 'female';
                breed?: string;
                trackingType?: 'individual' | 'batch';
            }): Chainable<void>;
            editAnimal(tagId: string, options?: {
                name?: string;
                sex?: 'male' | 'female';
                breed?: string;
                trackingType?: 'individual' | 'batch';
            }): Chainable<void>;
            deleteAnimal(tagId: string): Chainable<void>;

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

            /**
             * Custom command to create a farm with all details
             * @example cy.createFarm('My Farm', 'A test farm', 'crop', '123 Main St', 40.7128, -74.0060, 10, 4)
             */
            createFarm(name: string, description: string, type: string, address?: string, lat?: number, lng?: number, acres?: number, hectares?: number): Chainable<string>;

            /**
             * Custom command to navigate to farms page
             * @example cy.navigateToFarms()
             */
            navigateToFarms(): Chainable<void>;


            /**
             * Custom command to get farm ID from current URL
             * @example cy.getFarmIdFromUrl()
             */
            getFarmIdFromUrl(): Chainable<string>;
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

// Custom command to signout via UI
Cypress.Commands.add('signout', () => {
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

// Custom command to verify farms are present
Cypress.Commands.add('verifyFarmsPresent', (farmNames: string[]) => {
    // Should be on farms page
    cy.url().should('include', '/farms');
    cy.contains('Farms').should('be.visible');
    
    // Verify each farm name is present
    farmNames.forEach(farmName => {
        cy.contains(farmName).should('be.visible');
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

Cypress.Commands.add('createAnimal', (tagId: string, options: {
  name?: string;
  sex?: 'male' | 'female';
  breed?: string;
  trackingType?: 'individual' | 'batch';
} = {}) => {
  const { name, sex = 'female', breed, trackingType = 'individual' } = options;

  cy.get('[data-testid="tab-animals"]').click();
  cy.get('[data-testid="create-animal-button"]').click();

  cy.get('[data-testid="animal-tag-id-input"]').clear().type(tagId);

  if (name) {
    cy.get('[data-testid="animal-name-input"]').clear().type(name);
  } else {
    cy.get('[data-testid="animal-name-input"]').clear();
  }

  cy.get('[data-testid="animal-sex-select"]').select(sex);

  if (breed) {
    cy.get('[data-testid="animal-breed-input"]').clear().type(breed);
  } else {
    cy.get('[data-testid="animal-breed-input"]').clear();
  }

  cy.get('[data-testid="animal-tracking-type-select"]').select(trackingType);
  cy.get('[data-testid="create-animal-submit-button"]').click();
  cy.wait(1000);
  cy.contains('td', tagId).should('exist');
});

Cypress.Commands.add('editAnimal', (tagId: string, options: {
  name?: string;
  sex?: 'male' | 'female';
  breed?: string;
  trackingType?: 'individual' | 'batch';
} = {}) => {
  const { name, sex, breed, trackingType } = options;

  cy.get('[data-testid="tab-animals"]').click();
  cy.contains('td', tagId).should('exist');
  cy.get(`[data-testid="edit-animal-button-${tagId}"]`).click();

  if (name !== undefined) {
    cy.get('[data-testid="edit-animal-name-input"]').clear();
    if (name) {
      cy.get('[data-testid="edit-animal-name-input"]').type(name);
    }
  }

  if (sex) {
    cy.get('[data-testid="edit-animal-sex-select"]').select(sex);
  }

  if (breed !== undefined) {
    cy.get('[data-testid="edit-animal-breed-input"]').clear();
    if (breed) {
      cy.get('[data-testid="edit-animal-breed-input"]').type(breed);
    }
  }

  if (trackingType) {
    cy.get('[data-testid="edit-animal-tracking-type-select"]').select(trackingType);
  }

  cy.get('[data-testid="update-animal-submit-button"]').click();
  cy.wait(1000);

  if (name) {
    cy.contains('td', name).should('exist');
  }
});

Cypress.Commands.add('deleteAnimal', (tagId: string) => {
  cy.get('[data-testid="tab-animals"]').click();
  cy.contains('td', tagId).should('exist');

  cy.once('window:confirm', () => true);
  cy.get(`[data-testid="delete-animal-button-${tagId}"]`).click();

  cy.wait(1000);
  cy.contains('td', tagId).should('not.exist');
});

// Custom command to wait for API calls
Cypress.Commands.add('waitForApi', (method: string, url: string) => {
    cy.intercept(method, url).as('apiCall');
    cy.wait('@apiCall');
});

// Custom command to sign up a new user
Cypress.Commands.add('signup', (email: string, password: string) => {
    // Intercept the signup API call
    cy.intercept('POST', '**/auth/register').as('signupRequest');
    
    cy.visit('/signup');
    cy.get('h1').should('contain', 'Sign Up');

    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="confirm-password-input"]').type(password);
    cy.get('input[type="checkbox"]').check();

    cy.get('[data-testid="signup-submit-button"]').click();

    // Wait for the API call to complete
    cy.wait('@signupRequest', { timeout: 15000 }).then((interception) => {
        // Check if signup was successful (status 200 or 201)
        if (interception.response && (interception.response.statusCode === 200 || interception.response.statusCode === 201)) {
            cy.log('Signup successful');
        } else {
            cy.log('Signup may have failed, checking for errors');
            // Check for error messages on the page
            cy.get('body').then(($body) => {
                if ($body.find('[data-testid="error-message"]').length > 0) {
                    cy.get('[data-testid="error-message"]').then(($error) => {
                        throw new Error(`Signup failed: ${$error.text()}`);
                    });
                }
            });
        }
    });

    // Wait for redirect to home page (successful signup)
    cy.url({ timeout: 15000 }).should('eq', Cypress.config().baseUrl + '/');
    cy.get('[data-testid="home-page"]', { timeout: 10000 }).should('be.visible');
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

// Custom command to create a farm with all details
Cypress.Commands.add('createFarm', (name: string, description: string, type: string, address?: string, lat?: number, lng?: number, acres?: number, hectares?: number) => {
    cy.get('[data-testid="create-farm-button"]').click();
    cy.get('[data-testid="farm-name-input"]').type(name);
    cy.get('[data-testid="farm-description-input"]').type(description);
    cy.get('[data-testid="farm-type-select"]').select(type);
    
    // Fill in location fields with provided values or defaults
    const farmAddress = address || '123 Farm Road, Farm City, Farm State, Farm Country';
    const farmLat = lat || 34.0522;
    const farmLng = lng || -118.2437;
    const farmAcres = acres || 100;
    const farmHectares = hectares || 40.47;
    
    cy.get('[data-testid="farm-location-address-input"]').type(farmAddress);
    cy.get('[data-testid="farm-latitude-input"]').then(($input) => {
        ($input[0] as HTMLInputElement).valueAsNumber = farmLat;
        cy.wrap($input).trigger('input');
    });
    cy.get('[data-testid="farm-longitude-input"]').then(($input) => {
        ($input[0] as HTMLInputElement).valueAsNumber = farmLng;
        cy.wrap($input).trigger('input');
    });
    cy.get('[data-testid="farm-size-acres-input"]').then(($input) => {
        ($input[0] as HTMLInputElement).valueAsNumber = farmAcres;
        cy.wrap($input).trigger('input');
    });
    cy.get('[data-testid="farm-size-hectares-input"]').then(($input) => {
        ($input[0] as HTMLInputElement).valueAsNumber = farmHectares;
        cy.wrap($input).trigger('input');
    });
    
    // Wait a moment for form state to update
    cy.wait(500);
    
    cy.get('[data-testid="farm-submit-button"]').click();

    // Wait for farm to be created and redirected to farm detail page
    cy.url({ timeout: 10000 }).should('include', '/farms/');
    cy.url().should('not.include', '/farms/create');
    cy.get('[data-testid="farm-detail-page"]').should('be.visible');

    // Return the farm ID from URL
    return cy.url().then((url) => {
        const urlParts = url.split('/');
        const farmId = urlParts[urlParts.length - 1];
        return farmId;
    });
});


// Custom command to navigate to farms page
Cypress.Commands.add('navigateToFarms', () => {
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="all-farms-sidebar-button"]').should('be.visible').click();
    cy.url().should('include', '/farms');
    cy.get('[data-testid="farms-page"]').should('be.visible');
});


// Custom command to get farm ID from current URL
Cypress.Commands.add('getFarmIdFromUrl', () => {
    return cy.url().then((url) => {
        const urlParts = url.split('/');
        const farmId = urlParts[urlParts.length - 1];
        return farmId;
    });
});

export { };
