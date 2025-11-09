/// <reference types="cypress" />

describe('Farm Activity', () => {
  const password = 'Password123!';
  const timestamp = Date.now();
  const email = `audit-${timestamp}@example.com`;

  before(() => {
    cy.clearAuth();
    cy.signup(email, password);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(email, password);
  });

  it('shows farm activity after creating and updating an animal', () => {
    const uniqueSuffix = Date.now();
    const animalTag = `AN-${uniqueSuffix}`;

    cy.navigateToFarms();
    cy.createFarm(
      `Audit Farm ${uniqueSuffix}`,
      'Farm for audit log testing',
      'mixed'
    ).then((farmId) => {
      cy.get('[data-testid="tab-activity"]').click();

      cy.createAnimal(animalTag, {
        name: 'Audit Bull',
        sex: 'male',
        breed: 'Angus',
        trackingType: 'individual',
      });

      cy.editAnimal(animalTag, {
        name: 'Audit Bull Updated',
        trackingType: 'batch',
      });

      cy.deleteAnimal(animalTag);

      cy.get('[data-testid="tab-activity"]').click();

      cy.get('[data-testid="audit-action-readable"]').should('contain.text', 'Created animal');
      cy.get('[data-testid="audit-action-readable"]').should('contain.text', 'Updated animal');
      cy.get('[data-testid="audit-action-readable"]').should('contain.text', 'Deleted animal');
      cy.contains(/Audit Bull Updated/i).should('exist');
    });
  });
});

