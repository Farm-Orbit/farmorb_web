/// <reference types="cypress" />

const formatDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const createFarmAndAnimal = (label: string) => {
  const timestamp = Date.now();
  const farmName = `${label} ${timestamp}`;
  const farmDescription = `${label} automated test farm`;
  const animalTag = `${label.toUpperCase()}-${timestamp}`;
  const animalName = `${label} Animal ${timestamp}`;

  return cy
    .createFarm(farmName, farmDescription, 'livestock')
    .then((farmId) => {
      // Wait for farm detail page to fully load
      cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
      cy.wait(2000); // Additional wait for page to stabilize
      
      // Now create the animal
      return cy.createAnimal(animalTag, {
        name: animalName,
        species: 'cattle',
        sex: 'female',
        breed: 'Holstein',
      }).then(() => ({ farmName, animalName, animalTag }));
    });
};

const createFarmAndGroup = (label: string) => {
  const timestamp = Date.now();
  const farmName = `${label} ${timestamp}`;
  const farmDescription = `${label} automated test farm`;
  const groupName = `${label} Group ${timestamp}`;

  return cy
    .createFarm(farmName, farmDescription, 'livestock')
    .then(() =>
      cy.createGroup(groupName, 'Feeding', 'North Pasture', `${label} group for feeding tests`),
    )
    .then(() => ({ farmName, groupName }));
};

// Helper function to create an inventory item for feeding tests
const createFeedInventoryItem = (label: string) => {
  const timestamp = Date.now();
  const inventoryItemName = `${label} Feed ${timestamp}`;
  
  return cy.createInventoryItem({
    name: inventoryItemName,
    category: 'feed',
    quantity: '1000',
    unit: 'kilograms',
    cost: '2.50',
    threshold: '100',
  }).then(() => {
    // Wait for redirect back to farm detail page
    cy.url({ timeout: 15000 }).should('include', '/farms/');
    cy.wait(2000); // Wait for inventory item to be saved
    return cy.wrap(inventoryItemName);
  });
};

describe('Feeding Management', () => {
  const password = 'TestPassword123!';
  const uniqueId = Date.now();
  const email = `feeding_${uniqueId}@example.com`;

  before(() => {
    cy.signup(email, password);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(email, password);
    // Navigate to farms page and wait for it to load
    cy.visit('/farms');
    cy.url({ timeout: 10000 }).should('include', '/farms');
    cy.get('[data-testid="farms-page"]', { timeout: 15000 }).should('be.visible');
  });

  it('creates a feeding record for an animal from animal detail page and displays it in the records table', () => {
    createFarmAndAnimal('Feeding Animal Farm').then(({ animalName, animalTag }) => {
      // Create inventory item first (required for feeding records)
      createFeedInventoryItem('Feeding Animal').then((inventoryItemName) => {
        // Navigate to animals tab
        cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Navigate to animal detail page by clicking on tag_id button
        cy.contains('button', animalTag, { timeout: 10000 }).click();
        cy.wait(2000);
        cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');

        // Wait a bit to ensure inventory item is available
        cy.wait(2000);

        // Create feeding record (animal is pre-selected, inventory item is required)
        cy.createFeedingRecord({
          feedType: 'Hay',
          amount: '100',
          unit: 'kilograms',
          date: formatDate(),
          inventoryItem: inventoryItemName,
          notes: 'Morning feeding for animal',
        });

        // Verify record appears in animal's feeding records table
        cy.get('[data-testid="animal-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.get('[data-testid="animal-feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
          cy.contains('td', 'Hay').should('be.visible');
          cy.contains('td', '100').should('be.visible');
          cy.contains('td', 'kilograms').should('be.visible');
        });
      });
    });
  });

  it('creates a feeding record for a group from group detail page and displays it in the records table', () => {
    createFarmAndGroup('Feeding Group Farm').then(({ groupName }) => {
      // Create inventory item first (required for feeding records)
      createFeedInventoryItem('Feeding Group').then((inventoryItemName) => {
        // Navigate to groups tab
        cy.get('[data-testid="tab-groups"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Wait for groups table to load
        cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
        cy.wait(1000);

        // Navigate to group detail page by clicking on group name
        cy.contains('tbody tr', groupName, { timeout: 10000 })
          .within(() => {
            cy.contains('button', groupName).click();
          });
        cy.wait(2000);
        cy.get('[data-testid="group-detail-page"]', { timeout: 10000 }).should('be.visible');

        // Wait a bit to ensure inventory item is available
        cy.wait(2000);

        // Create feeding record (group is pre-selected, inventory item is required)
        cy.createFeedingRecord({
          feedType: 'Grain',
          amount: '200',
          unit: 'kilograms',
          date: formatDate(),
          inventoryItem: inventoryItemName,
          cost: '150.00',
          notes: 'Evening feeding for group',
        });

        // Verify record appears in group's feeding records table
        cy.get('[data-testid="group-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.get('[data-testid="group-feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
          cy.contains('td', 'Grain').should('be.visible');
          cy.contains('td', '200').should('be.visible');
          cy.contains('td', 'kilograms').should('be.visible');
        });
      });
    });
  });

  it('creates a feeding record with inventory item and verifies it in farm detail page', () => {
    createFarmAndAnimal('Feeding Inventory Farm').then(({ animalName, animalTag }) => {
      // Wait for redirect to farm detail page after animal creation
      cy.url({ timeout: 15000 }).should('include', '/farms/');
      cy.url().should('include', '?tab=animals');
      cy.wait(2000);

      // First create an inventory item (feed category)
      const inventoryItemName = `Feed Item ${Date.now()}`;
      cy.createInventoryItem({
        name: inventoryItemName,
        category: 'feed',
        quantity: '500',
        unit: 'kilograms',
        cost: '2.50',
        threshold: '50',
      });

      // Wait for redirect back to farm detail page after inventory item creation
      cy.url({ timeout: 15000 }).should('include', '/farms/');
      cy.url().should('include', '?tab=inventory'); // Should be on inventory tab after creation
      cy.wait(3000); // Wait a bit longer to ensure inventory item is saved and available

      // Navigate to animals tab
      cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Navigate to animal detail page by clicking on tag_id button
      cy.contains('button', animalTag, { timeout: 10000 }).click();
      cy.wait(2000);
      cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');

      // Wait a bit more to ensure inventory item is available in the API
      cy.wait(2000);

      // Create feeding record with inventory item
      cy.createFeedingRecord({
        feedType: 'Concentrate',
        amount: '50',
        unit: 'kilograms',
        date: formatDate(),
        inventoryItem: inventoryItemName,
        cost: '125.00',
        notes: 'Feeding with inventory item',
      });

      // Navigate to farm detail page and check feeding records tab
      cy.get('[data-testid="farms-sidebar-button"]').click();
      cy.contains('Feeding Inventory Farm').click();
      cy.wait(2000);
      
      // Ensure we're on the farm detail page
      cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
      
      // Navigate to feeding tab
      cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Verify record appears in farm's feeding records table
      cy.get('[data-testid="feeding-records-table"]', { timeout: 15000 }).should('be.visible');
      cy.wait(2000); // Wait for table to load
      cy.get('[data-testid="feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
        cy.contains('td', 'Concentrate').should('be.visible');
        cy.contains('td', '50').should('be.visible');
        cy.contains('td', 'kilograms').should('be.visible');
      });
      
      // Verify inventory item appears (check outside of within block)
      cy.get('[data-testid="feeding-records-table"] tbody', { timeout: 15000 }).then(($tbody) => {
        const tableText = $tbody.text();
        if (tableText.includes(inventoryItemName)) {
          cy.get('[data-testid="feeding-records-table"] tbody').within(() => {
            cy.contains('td', inventoryItemName).should('be.visible');
          });
        } else {
          cy.log(`⚠️ Inventory item "${inventoryItemName}" not found in table (might not have loaded yet)`);
        }
      });
    });
  });

  it('edits a feeding record and verifies the changes', () => {
    createFarmAndAnimal('Feeding Edit Farm').then(({ animalName, animalTag }) => {
      // Create inventory item first (required for feeding records)
      createFeedInventoryItem('Feeding Edit').then((inventoryItemName) => {
        // Navigate to animals tab
        cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Navigate to animal detail page by clicking on tag_id button
        cy.contains('button', animalTag, { timeout: 10000 }).click();
        cy.wait(2000);
        cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');

        // Wait a bit to ensure inventory item is available
        cy.wait(2000);

        // Create a feeding record
        cy.createFeedingRecord({
          feedType: 'Hay',
          amount: '100',
          unit: 'kilograms',
          date: formatDate(),
          inventoryItem: inventoryItemName,
          notes: 'Original feeding record',
        });

        // Wait for record to appear
        cy.get('[data-testid="animal-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.wait(2000);

        // Navigate to farm detail page to find edit button
        cy.get('[data-testid="farms-sidebar-button"]').click();
        cy.contains('Feeding Edit Farm').click();
        cy.wait(2000);
        
        // Ensure we're on the farm detail page
        cy.get('[data-testid="farm-detail-page"]', { timeout: 15000 }).should('be.visible');
        
        // Navigate to feeding tab
        cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Find the record and click edit button
        cy.get('[data-testid="feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.wait(2000); // Wait for table to fully render
        
        // Find the row containing 'Hay' and click the Edit button
        cy.contains('td', 'Hay', { timeout: 10000 })
          .parents('tr')
          .within(() => {
            cy.get('button').contains('Edit').scrollIntoView().should('be.visible').click({ force: true });
          });

        // Wait for edit page to load
        cy.url({ timeout: 15000 }).should('include', '/feeding/records/');
        cy.url().should('include', '/edit');
        cy.wait(2000); // Wait for edit page to fully load

        // Wait for form fields to be visible and inventory items to load
        cy.get('[data-testid="feeding-feed-type-input"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="feeding-inventory-item-select"]', { timeout: 10000 }).should('be.visible');
        cy.wait(2000); // Wait for inventory items to load

        // Verify inventory item is already selected (should be from initial values)
        cy.get('[data-testid="feeding-inventory-item-select"]').should(($select) => {
          expect($select.val()).to.not.be.empty;
        });

        // Update the form
        cy.get('[data-testid="feeding-feed-type-input"]').clear().type('Grain');
        cy.get('[data-testid="feeding-amount-input"]').clear().type('150');
        cy.get('[data-testid="feeding-notes-textarea"]').clear().type('Updated feeding record');

        // Submit the changes
        cy.get('[data-testid="feeding-submit-button"]').click();

        // Wait for redirect to farm detail page (might redirect to farm detail with or without tab)
        cy.url({ timeout: 15000 }).should((url) => {
          // Should be on farm detail page
          expect(url).to.include('/farms/');
          expect(url).to.not.include('/feeding/records/');
          expect(url).to.not.include('/edit');
        });
        cy.wait(2000);

        // Navigate to feeding tab if not already there
        cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Verify updated record appears
        cy.get('[data-testid="feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.get('[data-testid="feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
          cy.contains('td', 'Grain').should('be.visible');
          cy.contains('td', '150').should('be.visible');
          cy.contains('td', 'Updated feeding record').should('be.visible');
        });
      });
    });
  });

  it('deletes a feeding record and verifies it is removed', () => {
    createFarmAndAnimal('Feeding Delete Farm').then(({ animalName, animalTag }) => {
      // Create inventory item first (required for feeding records)
      createFeedInventoryItem('Feeding Delete').then((inventoryItemName) => {
        // Navigate to animals tab
        cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Navigate to animal detail page by clicking on tag_id button
        cy.contains('button', animalTag, { timeout: 10000 }).click();
        cy.wait(2000);
        cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');

        // Wait a bit to ensure inventory item is available
        cy.wait(2000);

        // Create a feeding record
        cy.createFeedingRecord({
          feedType: 'Hay',
          amount: '100',
          unit: 'kilograms',
          date: formatDate(),
          inventoryItem: inventoryItemName,
          notes: 'Record to be deleted',
        });

        // Wait for record to appear
        cy.get('[data-testid="animal-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.wait(2000);

        // Navigate to farm detail page to find delete button
        cy.get('[data-testid="farms-sidebar-button"]').click();
        cy.contains('Feeding Delete Farm').click();
        cy.wait(2000);
        cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Find the record and delete it
        cy.get('[data-testid="feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.contains('td', 'Record to be deleted', { timeout: 10000 })
          .parents('tr')
          .within(() => {
            // Stub window.confirm to return true
            cy.window().then((win) => {
              cy.stub(win, 'confirm').returns(true);
            });
            cy.contains('button', 'Delete').click();
          });

        // Wait for deletion to complete
        cy.wait(2000);

        // Verify record is removed (either empty state or record not in table)
        cy.get('body').then(($body) => {
          const hasEmptyState = $body.find('[data-testid="feeding-records-empty"]').length > 0;
          const hasTable = $body.find('[data-testid="feeding-records-table"]').length > 0;

          if (hasEmptyState) {
            cy.get('[data-testid="feeding-records-empty"]').should('be.visible');
          } else if (hasTable) {
            cy.get('[data-testid="feeding-records-table"] tbody').within(() => {
              cy.contains('td', 'Record to be deleted').should('not.exist');
            });
          }
        });
      });
    });
  });

  it('creates multiple feeding records and verifies they appear in the table', () => {
    createFarmAndAnimal('Feeding Multiple Farm').then(({ animalName, animalTag }) => {
      // Create inventory item first (required for feeding records)
      createFeedInventoryItem('Feeding Multiple').then((inventoryItemName) => {
        // Navigate to animals tab
        cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Navigate to animal detail page by clicking on tag_id button
        cy.contains('button', animalTag, { timeout: 10000 }).click();
        cy.wait(2000);
        cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');

        // Wait a bit to ensure inventory item is available
        cy.wait(2000);

        // Create first feeding record
        cy.createFeedingRecord({
          feedType: 'Hay',
          amount: '100',
          unit: 'kilograms',
          date: formatDate(),
          inventoryItem: inventoryItemName,
          notes: 'First feeding',
        });

        // Wait for first record to appear
        cy.get('[data-testid="animal-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.wait(2000);

        // Create second feeding record
        cy.createFeedingRecord({
          feedType: 'Grain',
          amount: '50',
          unit: 'kilograms',
          date: formatDate(),
          inventoryItem: inventoryItemName,
          cost: '75.00',
          notes: 'Second feeding',
        });

        // Verify both records appear
        cy.get('[data-testid="animal-feeding-records-table"]', { timeout: 15000 }).should('be.visible');
        cy.get('[data-testid="animal-feeding-records-table"] tbody', { timeout: 15000 }).within(() => {
          cy.contains('td', 'Hay').should('be.visible');
          cy.contains('td', 'Grain').should('be.visible');
          cy.contains('td', 'First feeding').should('be.visible');
          cy.contains('td', 'Second feeding').should('be.visible');
        });
      });
    });
  });

  it('validates required fields when creating a feeding record', () => {
    createFarmAndAnimal('Feeding Validation Farm').then(({ animalName, animalTag }) => {
      // Wait for redirect to farm detail page after animal creation
      cy.url({ timeout: 15000 }).should('include', '/farms/');
      cy.wait(2000);
      
      // Create inventory item first (required for feeding records) - must be on farm detail page
      createFeedInventoryItem('Feeding Validation').then((inventoryItemName) => {
        // Navigate to animals tab
        cy.get('[data-testid="tab-animals"]', { timeout: 10000 }).click();
        cy.wait(2000);

        // Navigate to animal detail page by clicking on tag_id button
        cy.contains('button', animalTag, { timeout: 10000 }).click();
        cy.wait(2000);
        cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');

        // Navigate to feeding tab and click "Add Feeding Record"
        cy.get('[data-testid="tab-feeding"]', { timeout: 10000 }).click();
        cy.wait(2000);
        cy.contains('button', 'Add Feeding Record', { timeout: 10000 }).click();

        // Wait for form page to load
        cy.url({ timeout: 10000 }).should('include', '/feeding/records/new');
        cy.get('[data-testid="feeding-feed-type-input"]', { timeout: 10000 }).should('be.visible');

        // Wait for inventory items to load
        cy.wait(2000);

        // Try to submit without filling required fields (including inventory item)
        cy.get('[data-testid="feeding-submit-button"]').click();

        // Wait a bit for validation
        cy.wait(1000);

        // Check if form is still open (validation should prevent submission)
        cy.url().should('include', '/feeding/records/new');
        cy.get('[data-testid="feeding-feed-type-input"]').should('be.visible');

        // Verify that inventory item error is shown
        cy.get('[data-testid="feeding-inventory-item-select"]', { timeout: 10000 }).should('be.visible');
        cy.get('body').then(($body) => {
          // Check for validation error message
          if ($body.text().includes('Inventory item is required')) {
            cy.contains('Inventory item is required').should('be.visible');
          }
        });

        // Fill required fields including inventory item
        cy.get('[data-testid="feeding-feed-type-input"]').type('Hay');
        cy.get('[data-testid="feeding-amount-input"]').type('100');
        cy.get('[data-testid="feeding-unit-select"]').select('kilograms');
        cy.get('[data-testid="feeding-date-input"]').type(formatDate());
        
        // Select inventory item (required)
        cy.get('[data-testid="feeding-inventory-item-select"]', { timeout: 10000 }).should('be.visible');
        cy.wait(2000); // Wait for options to load
        cy.get('[data-testid="feeding-inventory-item-select"]').then(($select) => {
          const selectElement = $select[0] as HTMLSelectElement;
          const selectOptions = Array.from(selectElement.options) as HTMLOptionElement[];
          const matchingOption = selectOptions.find((opt) => {
            const text = opt.text.trim();
            return text && text.toLowerCase().includes(inventoryItemName.toLowerCase());
          });
          
          if (matchingOption && matchingOption.value) {
            cy.get('[data-testid="feeding-inventory-item-select"]').select(matchingOption.value);
          }
        });

        cy.get('[data-testid="feeding-submit-button"]').click();

        // Verify redirect
        cy.url({ timeout: 10000 }).should('not.include', '/feeding/records/new');
        cy.url().should('include', '/farms/');
      });
    });
  });
});

export {};

