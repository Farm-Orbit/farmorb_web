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
                species?: string;
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

            /**
             * Custom command to create a group
             * @example cy.createGroup('Breeding Cows', 'Breeding', 'North Pasture', 'Group for breeding')
             */
            createGroup(name: string, purpose: string, location?: string, description?: string): Chainable<void>;

            /**
             * Custom command to invite a member to a farm
             * @example cy.inviteMember('member@example.com')
             */
            inviteMember(email: string, role?: 'member'): Chainable<void>;

            /**
             * Custom command to accept an invitation
             * @example cy.acceptInvitation('Farm Name')
             */
            acceptInvitation(farmName: string): Chainable<void>;

            /**
             * Custom command to add an animal to a group
             * @example cy.addAnimalToGroup(farmId, groupId, animalTagId, 'Group Name', 'Notes')
             */
            addAnimalToGroup(farmId: string, groupId: string, animalTagId: string, groupName: string, notes?: string): Chainable<void>;

            /**
             * Custom command to create a health record
             * @example cy.createHealthRecord({ animalName: 'Bessie', type: 'Vaccination', title: 'Annual Vaccination' })
             */
            createHealthRecord(options: {
                animalName: string;
                type: string;
                title: string;
                description?: string;
                performedAt?: string;
                performedBy?: string;
                medication?: string;
                dosage?: string;
                cost?: string;
                healthScore?: string;
            }): Chainable<void>;

            /**
             * Custom command to create a breeding record
             * @example cy.createBreedingRecord({ animalName: 'Bessie', mateName: 'Bull', eventDate: '2024-01-01' })
             */
            createBreedingRecord(options: {
                animalName: string;
                mateName?: string;
                eventDate: string;
                type?: string;
                method?: string;
                status?: string;
                gestation?: string;
                expectedDueDate?: string;
                notes?: string;
            }): Chainable<void>;

            /**
             * Custom command to create a feeding record
             * @example cy.createFeedingRecord({ feedType: 'Hay', amount: '100', unit: 'kilograms', date: '2024-01-01' })
             */
            createFeedingRecord(options: {
                feedType: string;
                amount: string;
                unit: string;
                date: string;
                inventoryItem: string; // Required
                cost?: string;
                notes?: string;
                animalName?: string;
                groupName?: string;
            }): Chainable<void>;

            /**
             * Custom command to create an inventory item
             * @example cy.createInventoryItem({ name: 'Feed', category: 'feed', quantity: '100', unit: 'kilograms' })
             */
            createInventoryItem(options: {
                name: string;
                category: string;
                quantity: string;
                unit: string;
                cost?: string;
                threshold?: string;
                supplier?: string;
                notes?: string;
            }): Chainable<void>;

            /**
             * Custom command to navigate to inventory item detail page
             * @example cy.navigateToInventoryItemDetail('Feed Item')
             */
            navigateToInventoryItemDetail(itemName: string): Chainable<void>;

            /**
             * Custom command to create an inventory transaction
             * @example cy.createInventoryTransaction({ type: 'restock', quantity: '50', cost: '125.00', supplier: 'Supplier Name', notes: 'Restocked' })
             */
            createInventoryTransaction(options: {
                type: 'purchase' | 'restock' | 'usage' | 'adjustment' | 'loss';
                quantity: string;
                cost?: string;
                supplier?: string;
                notes?: string;
                fromTable?: boolean; // If true, clicks top-up button from table, otherwise uses detail page buttons
                itemName?: string; // Required if fromTable is true
            }): Chainable<void>;

            /**
             * Custom command to verify inventory transaction in history
             * @example cy.verifyTransactionInHistory({ type: 'Purchase', quantity: '40' })
             */
            verifyTransactionInHistory(options: {
                type: string;
                quantity?: string;
                notes?: string;
            }): Chainable<void>;

            /**
             * Custom command to verify inventory item quantity
             * @example cy.verifyInventoryQuantity('Feed Item', '150 kilograms')
             */
            verifyInventoryQuantity(itemName: string, expectedQuantity: string): Chainable<void>;
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
    species?: string;
    sex?: 'male' | 'female';
    breed?: string;
    trackingType?: 'individual' | 'batch';
} = {}) => {
    const {
        name,
        species = 'cattle',
        sex = 'female',
        breed,
        trackingType = 'individual',
    } = options;

    // Ensure we're on the farm detail page first (should already be there when called)
    // Navigate to animals tab if not already there
    cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).should('be.visible').click();
    cy.wait(2000);

    // Click the "Add Animal" button to navigate to create animal page
    cy.get('[data-testid="create-animal-button"]', { timeout: 10000 }).should('exist').click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/animals/new');

    cy.get('[data-testid="animal-tag-id-input"]').clear().type(tagId);
    cy.get('[data-testid="animal-species-select"]').select(species);

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
    cy.get('[data-testid="submit-animal-button"]').click();

    // Wait for redirect or error - check URL after a brief wait
    cy.wait(3000); // Wait for form submission to complete
    
    // Check if we're still on the create page (indicates error)
    cy.url().then((url) => {
      if (url.includes('/animals/new')) {
        // Still on create page - check for error message
        cy.get('body').then(($body) => {
          const errorElement = $body.find('.text-red-600, .text-red-400').first();
          if (errorElement.length > 0) {
            const errorText = errorElement.text();
            cy.log('❌ Animal creation error:', errorText);
            throw new Error(`Animal creation failed: ${errorText}`);
          } else {
            // No error visible but still on create page - might be a validation issue
            cy.log('⚠️ Still on create page after submission, but no error visible');
            throw new Error('Animal creation did not redirect - form may have validation errors');
          }
        });
      } else {
        // Successfully redirected - verify we're on the correct page
        expect(url).to.include('/farms/');
        expect(url).to.include('?tab=animals');
      }
    });

    // Wait for redirect to complete and verify animal exists
    cy.url({ timeout: 15000 }).should('include', '?tab=animals');
    cy.contains('tbody tr', tagId, { timeout: 10000 }).should('exist');
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

    cy.url({ timeout: 10000 }).should('include', `/animals/`);

    if (name !== undefined) {
        cy.get('[data-testid="animal-name-input"]').clear();
        if (name) {
            cy.get('[data-testid="animal-name-input"]').type(name);
        }
    }

    if (sex) {
        cy.get('[data-testid="animal-sex-select"]').select(sex);
    }

    if (breed !== undefined) {
        cy.get('[data-testid="animal-breed-input"]').clear();
        if (breed) {
            cy.get('[data-testid="animal-breed-input"]').type(breed);
        }
    }

    if (trackingType) {
        cy.get('[data-testid="animal-tracking-type-select"]').select(trackingType);
    }

    cy.get('[data-testid="submit-animal-button"]').click();
    cy.url({ timeout: 10000 }).should('include', '?tab=animals');

    if (name) {
        cy.contains('tbody tr', name, { timeout: 10000 }).should('exist');
    }
});

Cypress.Commands.add('deleteAnimal', (tagId: string) => {
    cy.get('[data-testid="tab-animals"]').click();
    cy.contains('td', tagId).should('exist');

    cy.once('window:confirm', () => true);
    cy.get(`[data-testid="delete-animal-button-${tagId}"]`).click();

    cy.contains('td', tagId).should('not.exist');
});

// Custom command to wait for API calls
Cypress.Commands.add('waitForApi', (method: string, url: string) => {
    cy.intercept(method, url).as('apiCall');
    cy.wait('@apiCall');
});

// Custom command to sign up a new user
Cypress.Commands.add('signup', (email: string, password: string) => {
    // Ensure no lingering auth state before attempting signup
    cy.clearAuth();

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
    // First check URL doesn't include /create, then check it includes /farms/
    cy.url({ timeout: 15000 }).should((url) => {
      expect(url).to.include('/farms/');
      expect(url).to.not.include('/farms/create');
      expect(url).to.not.include('/create');
    });
    
    // Wait for the farm detail page to load
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');

    // Return the farm ID from URL
    return cy.url().then((url) => {
        const urlParts = url.split('/');
        const farmId = urlParts[urlParts.length - 1];
        return farmId;
    });
});


// Custom command to navigate to farms page
Cypress.Commands.add('navigateToFarms', () => {
    cy.visit('/farms');
    cy.url({ timeout: 10000 }).should('include', '/farms');
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

// Custom command to create a group (simple version - just creates, doesn't return ID)
Cypress.Commands.add('createGroup', (name: string, purpose: string, location?: string, description?: string) => {
    // Navigate to groups tab
    cy.get('[data-testid="tab-groups"]').click();
    cy.wait(1000);

    // Click create group button
    cy.get('[data-testid="create-group-button"]', { timeout: 10000 }).should('be.visible').click();

    // Wait for navigation to create page
    cy.url({ timeout: 10000 }).should('include', '/groups/new');
    cy.wait(1000);

    // Fill out the form
    cy.get('[data-testid="group-name-input"]', { timeout: 10000 }).should('be.visible').clear().type(name);
    cy.get('[data-testid="group-purpose-input"]').should('be.visible').clear().type(purpose);

    if (location) {
        cy.get('[data-testid="group-location-input"]').should('be.visible').clear().type(location);
    }

    if (description) {
        cy.get('[data-testid="group-description-textarea"]').should('be.visible').clear().type(description);
    }

    // Submit the form
    cy.get('[data-testid="create-group-submit-button"]').should('be.visible').click();

    // Wait for redirect back to farm groups tab
    cy.url({ timeout: 10000 }).should('include', '?tab=groups');
    cy.contains(name, { timeout: 10000 }).should('be.visible');
    cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
});

// Custom command to invite a member to a farm
Cypress.Commands.add('inviteMember', (email: string, role: 'member' = 'member') => {
    cy.get('[data-testid="tab-members"]').click();
    cy.wait(1000);
    cy.get('[data-testid="invite-member-button"]', { timeout: 10000 }).click();
    cy.url({ timeout: 10000 }).should('include', '/invite');
    cy.get('[data-testid="invite-member-form"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="invite-email-input"]').clear().type(email);
    cy.get('[data-testid="invite-role-select"]').select(role);
    cy.get('[data-testid="invite-submit-button"]').click();

    cy.url({ timeout: 10000 }).should('include', '/farms/');
    cy.url().should('not.include', '/invite');
    cy.get('[data-testid="notification-container"]', { timeout: 10000 }).should('be.visible');
});

// Custom command to accept an invitation
Cypress.Commands.add('acceptInvitation', (farmName: string) => {
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="my-invitations-sidebar-button"]').click();
    cy.url({ timeout: 10000 }).should('include', '/invitations');

    // Wait for invitations page to load
    cy.wait(2000);

    // Find and accept the invitation for the specified farm
    cy.contains(farmName, { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid^="accept-invitation-"]').first().click();

    // Wait for invitation to be processed
    cy.wait(3000);

    // After accepting, we should either see "No invitations found" or be redirected
    // Check if we're still on invitations page or if we were redirected
    cy.url().then((url) => {
        if (url.includes('/invitations')) {
            // Still on invitations page - check for empty state or remaining invitations
            cy.get('body').then(($body) => {
                if ($body.find(':contains("No invitations found")').length > 0) {
                    cy.contains('No invitations found', { timeout: 10000 }).should('be.visible');
                } else {
                    // Invitation might still be processing, just verify we're on the page
                    cy.url().should('include', '/invitations');
                }
            });
        }
    });
});

// Custom command to add an animal to a group
// Can start from either farm detail page or group detail page
Cypress.Commands.add('addAnimalToGroup', (farmId: string, groupId: string, animalTagId: string, groupName: string, notes?: string) => {
    // Check if we're already on the group detail page by trying to find the element
    cy.get('body').then(($body) => {
        // Try to find group detail page element (non-blocking check)
        const groupDetailPage = $body.find('[data-testid="group-detail-page"]');
        
        if (groupDetailPage.length === 0) {
            // We're NOT on the group detail page - navigate from farm detail page
            cy.get('[data-testid="farm-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Navigate to groups tab on farm detail page
            cy.get('[data-testid="tab-groups"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            // Wait for groups table to load
            cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
            cy.wait(1000);
            
            // Find the group row and click the group name button to navigate to group detail
            cy.contains('tbody tr', groupName, { timeout: 10000 })
                .within(() => {
                    cy.contains('button', groupName).click();
                });
            
            cy.wait(2000); // Wait for navigation to group detail page
        }
    });
    
    // At this point, we should be on the group detail page - verify it
    cy.get('[data-testid="group-detail-page"]', { timeout: 10000 }).should('be.visible');
    
    // Check if we're on the animals tab - look for the add button (only visible on animals tab)
    cy.get('body').then(($body) => {
        const addButton = $body.find('[data-testid="add-animal-to-group-button"]:visible');
        
        if (addButton.length === 0) {
            // Not on animals tab yet - navigate to it
            cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
        } else {
            // Already on animals tab, just wait a bit for content to load
            cy.wait(1000);
        }
    });
    
    cy.get('[data-testid="add-animal-to-group-button"]', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.get('[data-testid="animal-select"]', { timeout: 10000 }).should('be.visible');
    
    // Wait for available animals to load (check that dropdown has options beyond the default "Select an animal..." option)
    cy.get('[data-testid="animal-select"] option', { timeout: 10000 }).should('have.length.at.least', 2);
    cy.wait(1000); // Additional wait for dropdown to be fully populated
    
    // Select animal by tag ID - the format is "TAG_ID - Name" or just "TAG_ID"
    cy.get('[data-testid="animal-select"]').then(($select) => {
        const selectElement = $select[0] as HTMLSelectElement;
        const options = Array.from(selectElement.options) as HTMLOptionElement[];
        
        // Log available options for debugging
        const optionTexts = options.map(opt => opt.text).filter(text => text && text !== 'Select an animal...');
        cy.log(`Available animals: ${optionTexts.join(', ')}`);
        
        // Find option that contains the tag ID (format: "TAG_ID - Name" or "TAG_ID")
        const option = options.find((opt) => {
            const text = opt.text.trim();
            return text && text !== 'Select an animal...' && text.startsWith(animalTagId);
        });
        
        if (option && option.value) {
            cy.get('[data-testid="animal-select"]').select(option.value);
        } else {
            // Fallback: try to find by includes (for cases with extra whitespace)
            const fallbackOption = options.find((opt) => {
                const text = opt.text.trim();
                return text && text !== 'Select an animal...' && text.includes(animalTagId);
            });
            
            if (fallbackOption && fallbackOption.value) {
                cy.get('[data-testid="animal-select"]').select(fallbackOption.value);
            } else {
                // Log all available options for debugging
                const availableOptions = options
                    .filter(opt => opt.text && opt.text !== 'Select an animal...')
                    .map(opt => opt.text);
                throw new Error(
                    `Could not find animal with tag ID: ${animalTagId}. Available animals: ${availableOptions.join(', ')}`
                );
            }
        }
    });
    
    if (notes) {
        cy.get('[data-testid="add-animal-notes-textarea"]').type(notes);
    }
    
    cy.get('[data-testid="add-animal-submit-button"]').click();
    cy.wait(2000);
    
    // After adding, we should still be on the group detail page, animals tab
    cy.get('[data-testid="group-detail-page"]', { timeout: 10000 }).should('be.visible');
    cy.contains(animalTagId, { timeout: 10000 }).should('be.visible');
});

// Custom command to create a health record
// Can be called from animal detail page (animal will be pre-selected) or farm detail page
Cypress.Commands.add('createHealthRecord', (options: {
    animalName: string;
    type: string;
    title: string;
    description?: string;
    performedAt?: string;
    performedBy?: string;
    medication?: string;
    dosage?: string;
    cost?: string;
    healthScore?: string;
}) => {
    // Check if we're on animal detail page or farm detail page
    cy.get('body').then(($body) => {
        const isOnAnimalDetailPage = $body.find('[data-testid="animal-detail-page"]').length > 0;
        const isOnFarmDetailPage = $body.find('[data-testid="farm-detail-page"]').length > 0;
        
        if (isOnAnimalDetailPage) {
            // We're on animal detail page - click health tab and then "Add Health Record" button
            cy.get('[data-testid="tab-health"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            // Click "Add Health Record" button (should be in AnimalHealthRecords component)
            cy.contains('button', 'Add Health Record', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });
        } else if (isOnFarmDetailPage) {
            // We're on farm detail page - navigate to health tab and create from there
            cy.get('[data-testid="tab-health"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            cy.get('[data-testid="create-health-record-button"]', { timeout: 10000 })
                .should('exist')
                .click({ force: true });
            
            // Wait for navigation to form page
            cy.url({ timeout: 10000 }).should('include', '/health/records/new');
            
            // Wait for animal dropdown options to load
            cy.get('[data-testid="health-record-animal-select"] option', { timeout: 10000 })
                .should('have.length.at.least', 2);
            cy.wait(1000);
            
            // Select animal by name
            cy.get('[data-testid="health-record-animal-select"]').then(($select) => {
                const selectElement = $select[0] as HTMLSelectElement;
                const animalOptions = Array.from(selectElement.options) as HTMLOptionElement[];
                
                const option = animalOptions.find((opt) => {
                    const text = opt.text.trim();
                    return text && text !== 'Select animal' && text.includes(options.animalName);
                });
                
                if (option && option.value) {
                    cy.get('[data-testid="health-record-animal-select"]').select(option.value);
                } else {
                    cy.get('[data-testid="health-record-animal-select"]').select(options.animalName, { force: true });
                }
            });
        } else {
            throw new Error('Must be on animal detail page or farm detail page to create health record');
        }
    });
    
    // Wait for form page to load (if not already there)
    cy.url({ timeout: 10000 }).should('include', '/health/records/new');
    
    // Only try to select animal if the select field is visible (not pre-selected)
    cy.get('body').then(($body) => {
        const animalSelectVisible = $body.find('[data-testid="health-record-animal-select"]:visible').length > 0;
        if (!animalSelectVisible) {
            // Animal is pre-selected, we can proceed directly without selecting
            cy.log('Animal is pre-selected from animal detail page');
        }
    });
    
    cy.get('[data-testid="health-record-type-select"]').select(options.type);
    cy.get('[data-testid="health-record-title-input"]').clear().type(options.title);

    if (options.description) {
        cy.get('[data-testid="health-record-description-textarea"]').clear().type(options.description);
    }

    if (options.performedAt) {
        cy.get('[data-testid="health-record-performed-at-input"]').clear().type(options.performedAt);
    }

    if (options.performedBy) {
        // performedBy can be a member name or email - find the matching option in the dropdown
        // Wait for dropdown options to load
        cy.get('[data-testid="health-record-performed-by-select"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="health-record-performed-by-select"] option', { timeout: 10000 })
            .should('have.length.at.least', 1); // At least the "Select member (optional)" option
        
        cy.get('[data-testid="health-record-performed-by-select"]').then(($select) => {
            const selectElement = $select[0] as HTMLSelectElement;
            const selectOptions = Array.from(selectElement.options) as HTMLOptionElement[];
            const performedByValue = options.performedBy;
            
            // Find option that matches the performedBy value (by name or email)
            const matchingOption = selectOptions.find((opt) => {
                const text = opt.text.trim();
                return text && text !== 'Select member (optional)' && 
                       (text.toLowerCase().includes(performedByValue!.toLowerCase()) || 
                        text.toLowerCase() === performedByValue!.toLowerCase());
            });
            
            if (matchingOption && matchingOption.value) {
                cy.get('[data-testid="health-record-performed-by-select"]').select(matchingOption.value);
                cy.log(`✅ Selected member: ${matchingOption.text} for performed_by`);
            } else {
                // If no match found, log a warning but don't fail - performed_by is optional
                cy.log(`⚠️ Could not find member matching "${performedByValue}" - leaving performed_by empty (will default to current user)`);
            }
        });
    }

    if (options.medication) {
        cy.get('[data-testid="health-record-medication-input"]').clear().type(options.medication);
    }

    if (options.dosage) {
        cy.get('[data-testid="health-record-dosage-input"]').clear().type(options.dosage);
    }

    if (options.cost) {
        cy.get('[data-testid="health-record-cost-input"]').clear().type(options.cost);
    }

    if (options.healthScore) {
        cy.get('[data-testid="health-record-health-score-input"]').clear().type(options.healthScore);
    }

    cy.get('[data-testid="submit-health-record-button"]').click();
    
    // Wait for redirect - could be to animal detail page or farm detail page
    cy.url({ timeout: 15000 }).should((url) => {
        expect(url).not.to.include('/health/records/new');
        expect(url).to.include('/farms/');
    });
    
    // Check if we're redirected to animal detail page or farm detail page
    cy.get('body').then(($body) => {
        const isOnAnimalDetailPage = $body.find('[data-testid="animal-detail-page"]').length > 0;
        const isOnFarmDetailPage = $body.find('[data-testid="farm-detail-page"]').length > 0;
        
        if (isOnAnimalDetailPage) {
            // Verify we're on animal detail page with health tab
            cy.url({ timeout: 5000 }).should('include', 'tab=health');
            cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify health record appears in animal's health records table
            cy.get('[data-testid="animal-health-records-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="animal-health-records-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.title, { timeout: 15000 }).should('be.visible');
            });
        } else if (isOnFarmDetailPage) {
            // Verify we're on farm detail page with health tab
            cy.url({ timeout: 5000 }).should('include', 'tab=health');
            cy.get('[data-testid="farm-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify health record appears in farm's health records table
            cy.get('[data-testid="health-records-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="health-records-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.title, { timeout: 15000 }).should('be.visible');
            });
        }
    });
});

// Custom command to create a breeding record
// Can be called from animal detail page (animal will be pre-selected) or farm detail page
Cypress.Commands.add('createBreedingRecord', (options: {
    animalName: string;
    mateName?: string;
    eventDate: string;
    type?: string;
    method?: string;
    status?: string;
    gestation?: string;
    expectedDueDate?: string;
    notes?: string;
}) => {
    // Check if we're on animal detail page or farm detail page
    cy.get('body').then(($body) => {
        const isOnAnimalDetailPage = $body.find('[data-testid="animal-detail-page"]').length > 0;
        const isOnFarmDetailPage = $body.find('[data-testid="farm-detail-page"]').length > 0;
        
        if (isOnAnimalDetailPage) {
            // We're on animal detail page - click breeding tab and then "Add Breeding Record" button
            cy.get('[data-testid="tab-breeding"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            // Click "Add Breeding Record" button (should be in AnimalBreedingTimeline component)
            cy.contains('button', 'Add Breeding Record', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });
        } else if (isOnFarmDetailPage) {
            // We're on farm detail page - navigate to breeding tab and create from there
            cy.get('[data-testid="tab-breeding"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            cy.get('[data-testid="create-breeding-record-button"]', { timeout: 10000 })
                .should('exist')
                .click({ force: true });
            
            // Wait for navigation to form page
            cy.url({ timeout: 10000 }).should('include', '/breeding/new');
            
            // Wait for animal dropdown options to load
            cy.get('[data-testid="breeding-animal-select"] option', { timeout: 10000 })
                .should('have.length.at.least', 2);
            cy.wait(1000);
            
            // Select animal by name
            cy.get('[data-testid="breeding-animal-select"]').then(($select) => {
                const selectElement = $select[0] as HTMLSelectElement;
                const animalOptions = Array.from(selectElement.options) as HTMLOptionElement[];
                
                const option = animalOptions.find((opt) => {
                    const text = opt.text.trim();
                    return text && text !== 'Select animal' && text.includes(options.animalName);
                });
                
                if (option && option.value) {
                    cy.get('[data-testid="breeding-animal-select"]').select(option.value);
                } else {
                    cy.get('[data-testid="breeding-animal-select"]').select(options.animalName, { force: true });
                }
            });
        } else {
            throw new Error('Must be on animal detail page or farm detail page to create breeding record');
        }
    });
    
    // Wait for form page to load (if not already there)
    cy.url({ timeout: 10000 }).should('include', '/breeding/new');
    
    // If animal select is visible, it means we're creating from farm detail page
    // If it's not visible, animal is pre-selected from animal detail page
    cy.get('body').then(($body) => {
        const animalSelectVisible = $body.find('[data-testid="breeding-animal-select"]:visible').length > 0;
        
        if (!animalSelectVisible) {
            // Animal is pre-selected, we can proceed directly without selecting
            cy.log('Animal is pre-selected from animal detail page');
        }
    });
    
    // Only try to select animal if the select field is visible (not pre-selected)
    cy.get('body').then(($body) => {
        const animalSelectVisible = $body.find('[data-testid="breeding-animal-select"]:visible').length > 0;
        if (animalSelectVisible) {
            // Animal select is visible, so we need to select it
            cy.get('[data-testid="breeding-animal-select"]').select(options.animalName);
        }
    });
    
    cy.get('[data-testid="breeding-record-type-select"]').select(options.type || 'Breeding');
    cy.get('[data-testid="breeding-event-date-input"]').clear().type(options.eventDate);

    if (options.mateName) {
        cy.get('[data-testid="breeding-mate-select"]').select(options.mateName);
    }

    if (options.method) {
        cy.get('[data-testid="breeding-method-select"]').select(options.method);
    }

    if (options.status) {
        cy.get('[data-testid="breeding-status-select"]').select(options.status);
    }

    if (options.gestation) {
        cy.get('[data-testid="breeding-gestation-input"]').clear().type(options.gestation);
    }

    if (options.expectedDueDate) {
        cy.get('[data-testid="breeding-expected-due-date-input"]').clear().type(options.expectedDueDate);
    }

    if (options.notes) {
        cy.get('[data-testid="breeding-notes-textarea"]').clear().type(options.notes);
    }

    cy.get('[data-testid="submit-breeding-record-button"]').click();
    
    // Wait for redirect - could be to animal detail page or farm detail page
    cy.url({ timeout: 15000 }).should((url) => {
        expect(url).not.to.include('/breeding/new');
        expect(url).to.include('/farms/');
    });
    
    // Check if we're redirected to animal detail page or farm detail page
    cy.get('body').then(($body) => {
        const isOnAnimalDetailPage = $body.find('[data-testid="animal-detail-page"]').length > 0;
        const isOnFarmDetailPage = $body.find('[data-testid="farm-detail-page"]').length > 0;
        
        if (isOnAnimalDetailPage) {
            // Verify we're on animal detail page with breeding tab
            cy.url({ timeout: 5000 }).should('include', 'tab=breeding');
            cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify breeding record appears in animal's breeding timeline table
            cy.get('[data-testid="animal-breeding-timeline-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="animal-breeding-timeline-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.animalName, { timeout: 15000 }).should('be.visible');
            });
        } else if (isOnFarmDetailPage) {
            // Verify we're on farm detail page with breeding tab
            cy.url({ timeout: 5000 }).should('include', 'tab=breeding');
            cy.get('[data-testid="farm-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify breeding record appears in farm's breeding records table
            cy.get('[data-testid="breeding-records-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="breeding-records-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.animalName, { timeout: 15000 }).should('be.visible');
            });
        }
    });
});

// Custom command to create an inventory item
Cypress.Commands.add('createInventoryItem', (options: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    cost?: string;
    threshold?: string;
    supplier?: string;
    notes?: string;
}) => {
    // Ensure we're on the farm detail page
    cy.url({ timeout: 15000 }).should('include', '/farms/');
    cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
    cy.wait(1000);
    
    // Navigate to inventory tab if not already there
    cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).should('be.visible').click();
    cy.wait(2000);
    
    // Wait for the create button to be visible (indicates tab is loaded)
    cy.get('[data-testid="inventory-create-button"]', { timeout: 10000 }).should('be.visible');

    // Click create button
    cy.get('[data-testid="inventory-create-button"]').scrollIntoView().click();
    cy.url({ timeout: 10000 }).should('include', '/inventory/new');

    // Fill form
    cy.get('[data-testid="inventory-item-name-input"]', { timeout: 10000 }).type(options.name);
    cy.get('[data-testid="inventory-item-category-select"]').select(options.category);
    cy.get('[data-testid="inventory-item-quantity-input"]').type(options.quantity);
    cy.get('[data-testid="inventory-item-unit-select"]').select(options.unit);

    if (options.cost) {
        cy.get('[data-testid="inventory-item-cost-input"]').type(options.cost);
    }

    if (options.threshold) {
        cy.get('[data-testid="inventory-item-threshold-input"]').type(options.threshold);
    }

    if (options.supplier) {
        cy.get('[data-testid="inventory-item-supplier-select"]').select(options.supplier);
    }

    if (options.notes) {
        cy.get('[data-testid="inventory-item-notes-input"]').type(options.notes);
    }

    // Submit
    cy.get('[data-testid="inventory-item-submit-button"]').click();
    cy.url({ timeout: 10000 }).should('include', '?tab=inventory');
    cy.wait(2000);

    // Verify item appears
    cy.contains('Inventory Items').scrollIntoView();
    cy.contains(options.name, { timeout: 10000 }).should('be.visible');
});

// Custom command to navigate to inventory item detail page
Cypress.Commands.add('navigateToInventoryItemDetail', (itemName: string) => {
    // Navigate to inventory tab if not already there
    cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).click();
    cy.wait(2000);

    // Click on item name
    cy.contains(itemName, { timeout: 10000 }).click();

    // Verify navigation to detail page
    cy.url({ timeout: 10000 }).should('include', '/inventory/');
    cy.url().should('not.include', '/edit');
    cy.url().should('not.include', '/new');
    cy.contains(itemName, { timeout: 10000 }).should('be.visible');
    cy.contains('Item Details', { timeout: 10000 }).should('be.visible');
    cy.contains('Transaction History', { timeout: 10000 }).should('be.visible');
    cy.wait(2000);
});

// Custom command to create an inventory transaction
Cypress.Commands.add('createInventoryTransaction', (options: {
    type: 'purchase' | 'restock' | 'usage' | 'adjustment' | 'loss';
    quantity: string;
    cost?: string;
    supplier?: string;
    notes?: string;
    fromTable?: boolean;
    itemName?: string;
}) => {
    // Determine which button to click based on transaction type and location
    if (options.fromTable && options.itemName) {
        // Click top-up button from items table
        cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).click();
        cy.wait(2000);
        cy.contains(options.itemName, { timeout: 10000 })
            .scrollIntoView()
            .parents('tr')
            .within(() => {
                cy.get('[data-testid*="top-up-button"]', { timeout: 10000 }).scrollIntoView().click();
            });
    } else {
        // Use detail page buttons
        const buttonMap: Record<string, string> = {
            'purchase': 'top-up-button',
            'restock': 'top-up-button',
            'usage': 'record-usage-button',
            'adjustment': 'record-adjustment-button',
            'loss': 'record-loss-button',
        };
        cy.get(`[data-testid="${buttonMap[options.type]}"]`, { timeout: 10000 }).click();
    }

    // Wait for modal to open
    cy.get('[data-testid="transaction-type-select"]', { timeout: 10000 }).should('be.visible');

    // Set transaction type if not already set correctly
    cy.get('[data-testid="transaction-type-select"]').then(($select) => {
        const currentValue = $select.val();
        if (currentValue !== options.type) {
            cy.get('[data-testid="transaction-type-select"]').select(options.type);
        }
    });

    // Fill transaction form
    cy.get('[data-testid="transaction-quantity-input"]').clear().type(options.quantity);

    // Cost and supplier are only shown for purchase and restock
    if ((options.type === 'purchase' || options.type === 'restock') && options.cost) {
        cy.get('[data-testid="transaction-cost-input"]').clear().type(options.cost);
    }

    if ((options.type === 'purchase' || options.type === 'restock') && options.supplier) {
        cy.get('[data-testid="transaction-supplier-select"]').select(options.supplier);
    }

    if (options.notes) {
        cy.get('[data-testid="transaction-notes-input"]').clear().type(options.notes);
    }

    // Submit transaction
    cy.get('[data-testid="transaction-submit-button"]').click();
    cy.wait(2000);
});

// Custom command to verify inventory transaction in history
Cypress.Commands.add('verifyTransactionInHistory', (options: {
    type: string;
    quantity?: string;
    notes?: string;
}) => {
    cy.get('[data-testid="transactions-table"]', { timeout: 10000 }).should('be.visible');
    cy.contains(options.type, { timeout: 10000 }).should('be.visible');

    if (options.quantity) {
        cy.contains(options.quantity).should('be.visible');
    }

    if (options.notes) {
        cy.contains(options.notes).should('be.visible');
    }
});

// Custom command to verify inventory item quantity
Cypress.Commands.add('verifyInventoryQuantity', (itemName: string, expectedQuantity: string) => {
    // Check if we're on detail page or items table
    cy.url().then((url) => {
        if (url.includes('/inventory/') && !url.includes('/new') && !url.includes('/edit')) {
            // On detail page - check quantity display
            cy.contains(expectedQuantity, { timeout: 10000 }).should('be.visible');
        } else {
            // On items table - check quantity in table
            cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).click();
            cy.wait(2000);
            cy.contains(itemName, { timeout: 10000 })
                .scrollIntoView()
                .parents('tr')
                .within(() => {
                    cy.contains(expectedQuantity).should('be.visible');
                });
        }
    });
});

// Custom command to create a feeding record
// Can be called from animal detail page (animal will be pre-selected), group detail page (group will be pre-selected), or farm detail page
Cypress.Commands.add('createFeedingRecord', (options: {
    feedType: string;
    amount: string;
    unit: string;
    date: string;
    inventoryItem: string; // Required
    cost?: string;
    notes?: string;
    animalName?: string;
    groupName?: string;
}) => {
    // Check if we're on animal detail page, group detail page, or farm detail page
    cy.get('body').then(($body) => {
        const isOnAnimalDetailPage = $body.find('[data-testid="animal-detail-page"]').length > 0;
        const isOnGroupDetailPage = $body.find('[data-testid="group-detail-page"]').length > 0;
        const isOnFarmDetailPage = $body.find('[data-testid="farm-detail-page"]').length > 0;
        
        if (isOnAnimalDetailPage) {
            // We're on animal detail page - click feeding tab and then "Add Feeding Record" button
            cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            // Click "Add Feeding Record" button (should be in AnimalFeedingRecords component)
            cy.contains('button', 'Add Feeding Record', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });
        } else if (isOnGroupDetailPage) {
            // We're on group detail page - click feeding tab and then "Add Feeding Record" button
            cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(2000);
            
            // Click "Add Feeding Record" button (should be in GroupFeedingRecords component)
            cy.contains('button', 'Add Feeding Record', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });
        } else if (isOnFarmDetailPage) {
            // We're on farm detail page - feeding records must be created from animal or group pages
            // This should not happen, but if it does, throw an error
            throw new Error('Feeding records must be created from animal or group detail pages. Please navigate to an animal or group page first.');
        } else {
            throw new Error('Must be on animal detail page or group detail page to create feeding record');
        }
    });
    
    // Wait for form page to load
    cy.url({ timeout: 10000 }).should('include', '/feeding/records/new');
    
    // Wait for form fields to be visible
    cy.get('[data-testid="feeding-feed-type-input"]', { timeout: 10000 }).should('be.visible');
    
    // Fill out the form
    cy.get('[data-testid="feeding-feed-type-input"]').clear().type(options.feedType);
    cy.get('[data-testid="feeding-amount-input"]').clear().type(options.amount);
    cy.get('[data-testid="feeding-unit-select"]').select(options.unit);
    cy.get('[data-testid="feeding-date-input"]').clear().type(options.date);
    
    // Inventory item is required
    if (!options.inventoryItem) {
        throw new Error('inventoryItem is required for creating feeding records');
    }
    
    // Wait for inventory items to load in the dropdown
    cy.get('[data-testid="feeding-inventory-item-select"]', { timeout: 10000 }).should('be.visible');
    
    // Wait for dropdown options to be populated
    cy.get('[data-testid="feeding-inventory-item-select"] option', { timeout: 10000 })
        .should('have.length.at.least', 1);
    
    // Wait a bit more for inventory items to load (especially if just created)
    cy.wait(2000);
    
    // Find the option that contains the inventory item name
    // The dropdown shows items as "Item Name (quantity unit)", so we need to match by name
    cy.get('[data-testid="feeding-inventory-item-select"]').then(($select) => {
        const selectElement = $select[0] as HTMLSelectElement;
        const selectOptions = Array.from(selectElement.options) as HTMLOptionElement[];
        const inventoryItemName = options.inventoryItem!;
        
        // Find option that contains the inventory item name
        const matchingOption = selectOptions.find((opt) => {
            const text = opt.text.trim();
            return text && text.toLowerCase().includes(inventoryItemName.toLowerCase());
        });
        
        if (matchingOption && matchingOption.value) {
            cy.get('[data-testid="feeding-inventory-item-select"]').select(matchingOption.value);
            cy.log(`✅ Selected inventory item: ${matchingOption.text}`);
        } else {
            // Log available options for debugging
            const availableOptions = selectOptions.map(opt => opt.text).join(', ');
            cy.log(`⚠️ Available inventory items: ${availableOptions}`);
            throw new Error(`Could not find inventory item "${inventoryItemName}" in dropdown. Available options: ${availableOptions}`);
        }
    });
    
    if (options.cost) {
        cy.get('[data-testid="feeding-cost-input"]').clear().type(options.cost);
    }
    
    if (options.notes) {
        cy.get('[data-testid="feeding-notes-textarea"]').clear().type(options.notes);
    }
    
    // Submit the form
    cy.get('[data-testid="feeding-submit-button"]').click();
    
    // Wait for redirect - could be to animal detail page, group detail page, or farm detail page
    cy.url({ timeout: 15000 }).should((url) => {
        expect(url).not.to.include('/feeding/records/new');
        expect(url).to.include('/farms/');
    });
    
    // Check if we're redirected to animal detail page, group detail page, or farm detail page
    cy.get('body').then(($body) => {
        const isOnAnimalDetailPage = $body.find('[data-testid="animal-detail-page"]').length > 0;
        const isOnGroupDetailPage = $body.find('[data-testid="group-detail-page"]').length > 0;
        const isOnFarmDetailPage = $body.find('[data-testid="farm-detail-page"]').length > 0;
        
        if (isOnAnimalDetailPage) {
            // Verify we're on animal detail page with feeding tab
            cy.url({ timeout: 5000 }).should('include', 'tab=feeding');
            cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify feeding record appears in animal's feeding records table
            cy.get('[data-testid="animal-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="animal-feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.feedType, { timeout: 15000 }).should('be.visible');
            });
        } else if (isOnGroupDetailPage) {
            // Verify we're on group detail page with feeding tab
            cy.url({ timeout: 5000 }).should('include', 'tab=feeding');
            cy.get('[data-testid="group-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify feeding record appears in group's feeding records table
            cy.get('[data-testid="group-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="group-feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.feedType, { timeout: 15000 }).should('be.visible');
            });
        } else if (isOnFarmDetailPage) {
            // Verify we're on farm detail page with feeding tab
            cy.url({ timeout: 5000 }).should('include', 'tab=feeding');
            cy.get('[data-testid="farm-detail-page"]', { timeout: 10000 }).should('be.visible');
            
            // Verify feeding record appears in farm's feeding records table
            cy.get('[data-testid="feeding-records-table"]', { timeout: 15000 }).should('be.visible');
            cy.get('[data-testid="feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
                cy.contains('td', options.feedType, { timeout: 15000 }).should('be.visible');
            });
        }
    });
});

export { };
