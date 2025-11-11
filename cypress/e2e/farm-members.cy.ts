describe('Farm Members Feature', () => {
  let testEmail: string;
  let testPassword: string;
  let farmId: string;
  let inviteeEmail: string;
  let inviteePassword: string;

  before(() => {
    // Generate unique credentials for this test
    const timestamp = Date.now();
    testEmail = `testuser${timestamp}@example.com`;
    testPassword = 'TestPassword123!';

    // Sign up a user using reusable command
    cy.signup(testEmail, testPassword);

    cy.clearAuth();

    // Create a second user for invitation
    inviteeEmail = `invitee${timestamp}@example.com`;
    inviteePassword = 'InviteePassword123!';

    // Sign up the invitee user
    cy.signup(inviteeEmail, inviteePassword);
  });

  beforeEach(() => {
    // Clear any existing auth state
    cy.clearAuth();
    // Ensure we're authenticated for each test
    cy.signin(testEmail, testPassword);
    // Navigate to farms page to ensure we're in the right place
    cy.get('[data-testid="farms-sidebar-button"]').click();
    cy.get('[data-testid="farms-page"]').should('be.visible');
  });

  it('should create a farm and manage members', () => {
    // Create a new farm using reusable command
    cy.createFarm('Test Farm for Members', 'A test farm for member management', 'crop').then((farmId) => {
      // Store farm ID for later use
      cy.wrap(farmId).as('farmId');
      cy.log('Farm created with ID:', farmId);
    });

    // Navigate to Members tab
    cy.get('[data-testid="tab-members"]').click();

    // Check that the invite member button is visible (owner should see it)
    cy.get('[data-testid="invite-member-button"]').should('be.visible');

    // Check that the farm owner is present in the members list
    cy.contains('Owner').should('be.visible');
    cy.contains(testEmail).should('be.visible');
  });

  it('should invite a member to the farm, verify invitation acceptance, and confirm both members are visible', () => {
    // Create a new farm using reusable command
    cy.createFarm('Test Farm for Inviting', 'A test farm for inviting members', 'crop').then((farmId) => {
      // Store farm ID for later use
      cy.wrap(farmId).as('farmId');
      cy.log('Farm created with ID:', farmId);
    });

    // Navigate to Members tab
    cy.get('[data-testid="tab-members"]').click();

    // Check that the invite member button is visible (owner should see it)
    cy.get('[data-testid="invite-member-button"]').should('be.visible');
    
    // Check that the farm owner is present in the members list
    cy.contains('Owner').should('be.visible');
    cy.contains(testEmail).should('be.visible');

    // Click invite member button
    cy.get('[data-testid="invite-member-button"]', { timeout: 15000 }).click();

    // Should navigate to invite page
    cy.url().should('include', '/invite');
    cy.get('[data-testid="invite-member-form"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Invite Member').should('be.visible');

    // Fill in the invite form with the invitee's email
    cy.get('[data-testid="invite-email-input"]').type(inviteeEmail);
    cy.get('[data-testid="invite-role-select"]').select('member');

    // Submit the form
    cy.get('[data-testid="invite-submit-button"]').click();

    // Should navigate back to farm page immediately
    cy.url({ timeout: 5000 }).should('include', '/farms/');
    cy.url().should('not.include', '/invite');
    
    // Wait for the notification to appear and check for success notification
    cy.get('[data-testid="notification-container"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="notification-container"]').within(() => {
      cy.contains('Invitation Sent!').should('be.visible');
      cy.contains(`Invitation sent successfully`).should('be.visible');
    });
    
    // Verify we're on the farm page
    cy.url().should('include', '/farms/');
    cy.get('[data-testid="farm-detail-page"]').should('be.visible');
    
    // Navigate to Members tab to verify
    cy.get('[data-testid="tab-members"]').click();
    cy.get('[data-testid="invite-member-button"]').should('be.visible');

    // Store the farm URL for later use
    cy.url().then((farmUrl) => {
      cy.wrap(farmUrl).as('farmUrl');
    });

    // Now verify the invitation appears in the invited user's account
    // Log out and sign in as the invited user
    cy.signout();
    
    // Sign in as the invited user
    cy.signin(inviteeEmail, inviteePassword);
    
    // Now verify the invitation appears in the invited user's account
    // Navigate to invitations page using the sidebar
    cy.get('[data-testid="farms-sidebar-button"]').click({ force: true });
    cy.get('[data-testid="my-invitations-sidebar-button"]').click({ force: true });
    
    // Verify the invitation appears
    cy.url().should('include', '/invitations');
    cy.contains('Farm Invitations').should('be.visible');
    cy.contains('Test Farm for Inviting').should('be.visible');
    cy.contains('member').should('be.visible'); // Should show the role (lowercase)
    cy.contains('Pending').should('be.visible'); // Should show the status

    // Accept the invitation
    cy.get('[data-testid^="accept-invitation-"]').first().click();
    
    // Wait a moment for the invitation to be processed
    cy.wait(2000);
    
    // Verify the invitation is no longer visible (since it was accepted)
    cy.contains('Test Farm for Inviting').should('not.exist');
    cy.contains('No invitations found').should('be.visible');
    
    // Navigate to farms page to verify access
    cy.get('[data-testid="farms-sidebar-button"]').click({ force: true });
    
    // Verify the invited user can see the farm they were invited to
    cy.contains('Test Farm for Inviting').should('be.visible');
    
    // Click on the farm to access it
    cy.contains('Test Farm for Inviting').click();
    
    // Verify the user can access the farm (they should have member access)
    // The farm detail page should show the farm name and basic information
    cy.get('[data-testid="farm-detail-page"]').should('be.visible');
    cy.contains('Test Farm for Inviting').should('be.visible');
    
    // Wait a moment for the page to load
    cy.wait(2000);
    
    // Navigate to Details tab to verify farm details
    cy.get('[data-testid="tab-details"]').click();
    
    // Verify farm details are visible
    cy.contains('Basic Information').should('be.visible');
    cy.contains('Additional Information').should('be.visible');
    
    // Verify the user can see farm type and status
    cy.contains('Crop Farm').should('be.visible');
    cy.contains('Active').should('be.visible');
    
    // Verify the user can see farm description
    cy.contains('A test farm for inviting members').should('be.visible');
    
    // Navigate to Members tab to see the farm members section
    cy.get('[data-testid="tab-members"]').click();
    
    // Wait for the members table to load
    cy.wait(2000);
    
    // Wait for table to be visible
    cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    
    // Verify there are exactly 2 members in the table
    cy.get('tbody tr', { timeout: 10000 }).should('have.length', 2);
    
    // Verify both email addresses are present in the members table
    cy.contains('td', testEmail, { timeout: 10000 }).should('be.visible'); // Farm owner
    cy.contains('td', inviteeEmail, { timeout: 10000 }).should('be.visible'); // Invited member
    
    // Verify roles are present in the table
    // Owner role should be visible in the table (check in table body, not dropdown)
    cy.get('tbody').within(() => {
        cy.contains('Owner').should('be.visible');
        cy.contains('Member').should('be.visible');
    });
    
    cy.log('✅ Verified 2 members in the table: owner and invited member');
  });
});
