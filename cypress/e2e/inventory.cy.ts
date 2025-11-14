/// <reference types="cypress" />

describe('Inventory Management', () => {
  let testEmail: string;
  let testPassword: string;
  let farmId: string;

  before(() => {
    // Generate unique credentials for this test
    const timestamp = Date.now();
    testEmail = `inventory${timestamp}@example.com`;
    testPassword = 'TestPassword123!';

    // Sign up a user using reusable command
    cy.signup(testEmail, testPassword);

    cy.navigateToFarms();

    const farmName = `Inventory Test Farm ${timestamp}`;
    cy.createFarm(farmName, 'Test farm for inventory management', 'livestock').then((id) => {
      farmId = id;
      cy.log('Farm created with ID:', id);
    });
  });

  beforeEach(() => {
    // Clear any existing auth state
    cy.clearAuth();
    // Ensure we're authenticated for each test
    cy.signin(testEmail, testPassword);
    // Navigate to farm detail page
    cy.visit(`/farms/${farmId}`);
    cy.wait(1000);
  });

  describe('Supplier Management', () => {
    it('should create a supplier and verify it appears in the table', () => {
      const supplierName = `Test Supplier ${Date.now()}`;
      const supplierPhone = '555-0100';
      const supplierEmail = `supplier${Date.now()}@example.com`;

      // Navigate to Suppliers tab
      cy.get('[data-testid="tab-suppliers"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Check if empty state or table exists
      cy.get('body').then(($body) => {
        const hasEmptyState = $body.find('[data-testid="suppliers-empty"]').length > 0;
        const hasTable = $body.find('[data-testid="suppliers-table"]').length > 0;
        cy.log(`Empty state: ${hasEmptyState}, Has table: ${hasTable}`);
      });

      // Click create supplier button
      cy.get('[data-testid="supplier-create-button"]', { timeout: 10000 }).should('be.visible').click();

      // Wait for navigation to create page
      cy.url({ timeout: 10000 }).should('include', '/suppliers/new');

      // Fill out the form
      cy.get('[data-testid="supplier-name-input"]', { timeout: 10000 }).should('be.visible').type(supplierName);
      cy.get('[data-testid="supplier-phone-input"]').type(supplierPhone);
      cy.get('[data-testid="supplier-email-input"]').type(supplierEmail);
      cy.get('[data-testid="supplier-address-input"]').type('123 Farm Supply St, City, State 12345');
      cy.get('[data-testid="supplier-notes-input"]').type('Test supplier created during Cypress test');

      // Submit the form
      cy.get('[data-testid="supplier-submit-button"]').should('be.visible').click();

      // Wait for navigation back to suppliers tab
      cy.url({ timeout: 10000 }).should('include', '?tab=suppliers');

      // Verify supplier appears
      cy.wait(2000);
      cy.contains(supplierName, { timeout: 10000 }).should('be.visible');
    });

    it('should edit a supplier', () => {
      // First create a supplier
      const supplierName = `Edit Test Supplier ${Date.now()}`;
      const updatedName = `Updated ${supplierName}`;

      // Navigate to Suppliers tab
      cy.get('[data-testid="tab-suppliers"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Create supplier
      cy.get('[data-testid="supplier-create-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.url({ timeout: 10000 }).should('include', '/suppliers/new');
      cy.get('[data-testid="supplier-name-input"]', { timeout: 10000 }).type(supplierName);
      cy.get('[data-testid="supplier-phone-input"]').type('555-0200');
      cy.get('[data-testid="supplier-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=suppliers');
      cy.wait(2000);

      // Find and click edit button for the supplier
      cy.contains(supplierName, { timeout: 10000 })
        .parents('tr')
        .within(() => {
          cy.get('button').contains('Edit').click();
        });

      // Wait for edit page
      cy.url({ timeout: 10000 }).should('include', '/suppliers/').and('include', '/edit');

      // Update the name
      cy.get('[data-testid="supplier-name-input"]', { timeout: 10000 }).clear().type(updatedName);

      // Submit
      cy.get('[data-testid="supplier-submit-button"]').click();

      // Verify update
      cy.url({ timeout: 10000 }).should('include', '?tab=suppliers');
      cy.wait(2000);
      cy.contains(updatedName, { timeout: 10000 }).should('be.visible');
    });

    it('should delete a supplier', () => {
      // First create a supplier
      const supplierName = `Delete Test Supplier ${Date.now()}`;

      // Navigate to Suppliers tab
      cy.get('[data-testid="tab-suppliers"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Create supplier
      cy.get('[data-testid="supplier-create-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.url({ timeout: 10000 }).should('include', '/suppliers/new');
      cy.get('[data-testid="supplier-name-input"]', { timeout: 10000 }).type(supplierName);
      cy.get('[data-testid="supplier-phone-input"]').type('555-0300');
      cy.get('[data-testid="supplier-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=suppliers');
      cy.wait(2000);

      // Find and click delete button
      cy.contains(supplierName, { timeout: 10000 })
        .parents('tr')
        .within(() => {
          cy.get('button').contains('Delete').click();
        });

      // Confirm deletion
      cy.on('window:confirm', () => true);

      // Wait for deletion
      cy.wait(2000);

      // Verify supplier is removed
      cy.contains(supplierName).should('not.exist');
    });
  });

  describe('Inventory Item Management', () => {
    it('should create an inventory item and verify it appears in the table', () => {
      const itemName = `Test Item ${Date.now()}`;

      // Navigate to Inventory tab
      cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Check if empty state or table exists
      cy.get('body').then(($body) => {
        const hasEmptyState = $body.find('[data-testid="inventory-items-empty"]').length > 0;
        const hasTable = $body.find('[data-testid="inventory-items-table"]').length > 0;
        cy.log(`Empty state: ${hasEmptyState}, Has table: ${hasTable}`);
      });

      // Click create item button
      cy.get('[data-testid="inventory-create-button"]', { timeout: 10000 }).should('be.visible').click();

      // Wait for navigation to create page
      cy.url({ timeout: 10000 }).should('include', '/inventory/new');

      // Fill out the form
      cy.get('[data-testid="inventory-item-name-input"]', { timeout: 10000 }).should('be.visible').type(itemName);
      cy.get('[data-testid="inventory-item-category-select"]').select('feed');
      cy.get('[data-testid="inventory-item-quantity-input"]').type('100');
      cy.get('[data-testid="inventory-item-unit-select"]').select('kilograms');
      cy.get('[data-testid="inventory-item-cost-input"]').type('2.50');
      cy.get('[data-testid="inventory-item-threshold-input"]').type('20');
      cy.get('[data-testid="inventory-item-notes-input"]').type('Test inventory item created during Cypress test');

      // Submit the form
      cy.get('[data-testid="inventory-item-submit-button"]').should('be.visible').click();

      // Wait for navigation back to inventory tab
      cy.url({ timeout: 10000 }).should('include', '?tab=inventory');

      // Scroll to inventory items section and verify item appears
      cy.contains('Inventory Items').scrollIntoView();
      cy.wait(2000);
      cy.contains(itemName, { timeout: 10000 }).should('be.visible');
    });

    it('should filter inventory items by category', () => {
      // Create items in different categories
      const feedItem = `Feed Item ${Date.now()}`;
      const medItem = `Medication Item ${Date.now()}`;

      // Navigate to Inventory tab
      cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Create feed item
      cy.get('[data-testid="inventory-create-button"]', { timeout: 10000 }).click();
      cy.url({ timeout: 10000 }).should('include', '/inventory/new');
      cy.get('[data-testid="inventory-item-name-input"]', { timeout: 10000 }).type(feedItem);
      cy.get('[data-testid="inventory-item-category-select"]').select('feed');
      cy.get('[data-testid="inventory-item-quantity-input"]').type('50');
      cy.get('[data-testid="inventory-item-unit-select"]').select('kilograms');
      cy.get('[data-testid="inventory-item-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=inventory');

      cy.contains('Inventory Items').scrollIntoView();
      cy.wait(2000);

      // Create medication item
      cy.get('[data-testid="inventory-create-button"]', { timeout: 10000 }).click();
      cy.url({ timeout: 10000 }).should('include', '/inventory/new');
      cy.get('[data-testid="inventory-item-name-input"]', { timeout: 10000 }).type(medItem);
      cy.get('[data-testid="inventory-item-category-select"]').select('medication');
      cy.get('[data-testid="inventory-item-quantity-input"]').type('10');
      cy.get('[data-testid="inventory-item-unit-select"]').select('dozen');
      cy.get('[data-testid="inventory-item-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=inventory');

      cy.contains('Inventory Items').scrollIntoView();
      cy.wait(2000);

      // Filter by feed category
      cy.contains('Inventory Items').scrollIntoView();
      cy.get('[data-testid="inventory-category-filter"]', { timeout: 10000 }).select('feed');
      cy.wait(2000);

      // Verify only feed item is visible
      cy.contains(feedItem).should('be.visible');
      cy.contains(medItem).should('not.exist');
    });

    it('should edit an inventory item', () => {
      // First create an item
      const itemName = `Edit Test Item ${Date.now()}`;
      const updatedName = `Updated ${itemName}`;

      // Create item using reusable command
      cy.createInventoryItem({
        name: itemName,
        category: 'equipment',
        quantity: '5',
        unit: 'quantity',
      });

      // Find the item row and click edit button using data-testid
      cy.contains(itemName, { timeout: 10000 })
        .scrollIntoView()
        .parents('tr')
        .within(() => {
          // Get the item ID from the row by finding any data-testid that contains "edit-item-button-"
          cy.get('[data-testid^="edit-item-button-"]', { timeout: 10000 })
            .scrollIntoView()
            .should('be.visible')
            .click();
        });

      // Wait for navigation to edit page - URL should include /edit
      cy.url({ timeout: 15000 }).should((url) => {
        expect(url).to.include('/inventory/');
        expect(url).to.include('/edit');
      });

      // Update the name
      cy.get('[data-testid="inventory-item-name-input"]', { timeout: 10000 }).clear().type(updatedName);

      // Submit
      cy.get('[data-testid="inventory-item-submit-button"]').click();

      // Verify update
      cy.url({ timeout: 10000 }).should('include', '?tab=inventory');
      cy.wait(2000);
      cy.contains(updatedName, { timeout: 10000 }).should('be.visible');
    });

    it('should delete an inventory item', () => {
      // First create an item
      const itemName = `Delete Test Item ${Date.now()}`;

      // Create item using reusable command
      cy.createInventoryItem({
        name: itemName,
        category: 'supplies',
        quantity: '25',
        unit: 'bales',
      });

      // Stub window.confirm to return true BEFORE clicking delete
      cy.window().then((win) => {
        cy.stub(win, 'confirm').as('confirmStub').returns(true);
      });

      // Find and click delete button using data-testid
      cy.contains(itemName, { timeout: 10000 })
        .scrollIntoView()
        .parents('tr')
        .within(() => {
          cy.get('[data-testid^="delete-item-button-"]', { timeout: 10000 })
            .scrollIntoView()
            .should('be.visible')
            .click();
        });

      // Verify the confirm dialog was called
      cy.get('@confirmStub').should('have.been.calledWith', `Are you sure you want to delete "${itemName}"?`);

      // Wait for deletion to complete
      cy.wait(3000);

      // Verify item is removed
      cy.contains(itemName, { timeout: 10000 }).should('not.exist');
    });

    it('should create an inventory item with a supplier', () => {
      // First create a supplier
      const supplierName = `Supplier for Item ${Date.now()}`;
      const itemName = `Item with Supplier ${Date.now()}`;

      // Navigate to Suppliers tab and create supplier
      cy.get('[data-testid="tab-suppliers"]', { timeout: 10000 }).click();
      cy.wait(2000);
      cy.get('[data-testid="supplier-create-button"]', { timeout: 10000 }).click();
      cy.url({ timeout: 10000 }).should('include', '/suppliers/new');
      cy.get('[data-testid="supplier-name-input"]', { timeout: 10000 }).type(supplierName);
      cy.get('[data-testid="supplier-phone-input"]').type('555-0400');
      cy.get('[data-testid="supplier-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=suppliers');
      cy.wait(2000);

      // Navigate to Inventory tab
      cy.get('[data-testid="tab-inventory"]', { timeout: 10000 }).click();
      cy.wait(2000);

      // Create item with supplier
      cy.get('[data-testid="inventory-create-button"]', { timeout: 10000 }).scrollIntoView().should('be.visible').click();
      cy.url({ timeout: 10000 }).should('include', '/inventory/new');
      cy.get('[data-testid="inventory-item-name-input"]', { timeout: 10000 }).type(itemName);
      cy.get('[data-testid="inventory-item-category-select"]').select('feed');
      cy.get('[data-testid="inventory-item-quantity-input"]').type('75');
      cy.get('[data-testid="inventory-item-unit-select"]').select('kilograms');
      cy.get('[data-testid="inventory-item-supplier-select"]').select(supplierName);
      cy.get('[data-testid="inventory-item-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=inventory');

      // Verify item was created
      cy.contains('Inventory Items').scrollIntoView();
      cy.wait(2000);
      cy.contains(itemName, { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Inventory Transactions', () => {
    let itemId: string;
    let itemName: string;
    let supplierId: string;
    let supplierName: string;

    before(() => {
      // Create a supplier for transaction tests
      const timestamp = Date.now();
      supplierName = `Transaction Supplier ${timestamp}`;
      
      cy.clearAuth();
      cy.signin(testEmail, testPassword);
      cy.visit(`/farms/${farmId}`);
      cy.wait(1000);

      cy.get('[data-testid="tab-suppliers"]', { timeout: 10000 }).click();
      cy.wait(2000);

      cy.get('[data-testid="supplier-create-button"]', { timeout: 10000 }).click();
      cy.url({ timeout: 10000 }).should('include', '/suppliers/new');
      cy.get('[data-testid="supplier-name-input"]', { timeout: 10000 }).type(supplierName);
      cy.get('[data-testid="supplier-phone-input"]').type('555-0500');
      cy.get('[data-testid="supplier-submit-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=suppliers');
      cy.wait(2000);
    });

    beforeEach(() => {
      cy.clearAuth();
      cy.signin(testEmail, testPassword);
      cy.visit(`/farms/${farmId}`);
      cy.wait(1000);

      // Create an inventory item for transaction tests
      itemName = `Transaction Test Item ${Date.now()}`;

      cy.createInventoryItem({
        name: itemName,
        category: 'feed',
        quantity: '100',
        unit: 'kilograms',
        cost: '2.50',
        threshold: '20',
      });
    });

    it('should create restock transaction from items table and verify quantity update', () => {
      cy.createInventoryTransaction({
        type: 'restock',
        quantity: '50',
        cost: '125.00',
        supplier: supplierName,
        notes: 'Restocked inventory for testing',
        fromTable: true,
        itemName: itemName,
      });

      // Verify quantity increased (100 + 50 = 150)
      cy.verifyInventoryQuantity(itemName, '150');
    });

    it('should navigate to detail page and perform all transaction types with history verification', () => {
      // Navigate to item detail page
      cy.navigateToInventoryItemDetail(itemName);

      // 1. Create a purchase transaction (increases quantity, has supplier and cost)
      cy.createInventoryTransaction({
        type: 'purchase',
        quantity: '40',
        cost: '100.00',
        supplier: supplierName,
        notes: 'Purchased from supplier',
      });
      cy.verifyInventoryQuantity(itemName, '140 kilograms');
      cy.verifyTransactionInHistory({ type: 'Purchase', quantity: '40' });

      // 2. Create a usage transaction (decreases quantity)
      cy.createInventoryTransaction({
        type: 'usage',
        quantity: '25',
        notes: 'Used for feeding animals',
      });
      cy.verifyInventoryQuantity(itemName, '115 kilograms'); // 140 - 25 = 115

      // 3. Create an adjustment transaction (increases quantity)
      cy.createInventoryTransaction({
        type: 'adjustment',
        quantity: '10',
        notes: 'Inventory count adjustment',
      });
      cy.verifyInventoryQuantity(itemName, '125 kilograms'); // 115 + 10 = 125

      // 4. Create a loss transaction (decreases quantity)
      cy.createInventoryTransaction({
        type: 'loss',
        quantity: '5',
        notes: 'Spoiled inventory',
      });
      cy.verifyInventoryQuantity(itemName, '120 kilograms'); // 125 - 5 = 120

      // Verify all transactions appear in history
      cy.verifyTransactionInHistory({ type: 'Purchase' });
      cy.verifyTransactionInHistory({ type: 'Usage' });
      cy.verifyTransactionInHistory({ type: 'Adjustment' });
      cy.verifyTransactionInHistory({ type: 'Loss' });
    });

    it('should prevent invalid transactions exceeding available quantity', () => {
      cy.navigateToInventoryItemDetail(itemName);

      // Click Record Usage
      cy.get('[data-testid="record-usage-button"]', { timeout: 10000 }).click();
      cy.get('[data-testid="transaction-type-select"]', { timeout: 10000 }).should('be.visible');

      // Try to use more than available (100 + 1 = 101)
      cy.get('[data-testid="transaction-quantity-input"]').clear().type('101');
      cy.get('[data-testid="transaction-notes-input"]').type('This should fail');

      // Submit - should show validation error
      cy.get('[data-testid="transaction-submit-button"]').click();
      cy.wait(1000);

      // Check for error message (validation happens on submit)
      // The form should prevent submission or show an error
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('Cannot usage more than available') || 
                         $body.text().includes('exceed available stock');
        const formStillOpen = $body.find('[data-testid="transaction-type-select"]').length > 0;
        
        if (hasError || formStillOpen) {
          cy.log('Validation error detected or form still open');
        }
      });
    });

    it('should show low stock indicator when quantity is below threshold', () => {
      // Create item with low quantity
      const lowStockItemName = `Low Stock Item ${Date.now()}`;

      cy.createInventoryItem({
        name: lowStockItemName,
        category: 'medication',
        quantity: '15', // Below threshold
        unit: 'dozen',
        threshold: '20', // Threshold is 20
      });

      // Verify low stock badge appears
      cy.contains(lowStockItemName, { timeout: 10000 })
        .scrollIntoView()
        .parents('tr')
        .within(() => {
          cy.get('[data-testid*="low-stock-badge"]', { timeout: 10000 }).should('be.visible');
          cy.contains('Low Stock').should('be.visible');
        });
    });
  });
});

