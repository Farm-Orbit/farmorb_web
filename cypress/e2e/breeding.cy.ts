/// <reference types="cypress" />

const formatDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

describe('Breeding Management', () => {
  const password = 'TestPassword123!';
  const uniqueId = Date.now();
  const email = `breeding_${uniqueId}@example.com`;

  before(() => {
    cy.signup(email, password);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(email, password);
    cy.navigateToFarms();
  });

  it('logs a breeding event for an animal and lists it in the breeding table', () => {
    const farmName = `Breeding Farm ${Date.now()}`;
    const farmDescription = 'Automated breeding test farm';

    cy.createFarm(farmName, farmDescription, 'livestock').then(() => {
      const animalTag = `BREED-${Date.now()}`;
      const animalName = `Breeding Animal ${Date.now()}`;

      cy.createAnimal(animalTag, {
        name: animalName,
        sex: 'female',
        breed: 'Angus',
      });

      cy.get('[data-testid="tab-breeding"]').click();
      cy.get('[data-testid="breeding-records-table"], [data-testid="breeding-records-empty"]', {
        timeout: 15000,
      }).should('exist');

      cy.get('[data-testid="create-breeding-record-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '/breeding/new');

      cy.get('[data-testid="breeding-animal-select"]').select(animalName);
      cy.get('[data-testid="breeding-record-type-select"]').select('Breeding');
      cy.get('[data-testid="breeding-event-date-input"]').type(formatDate());
      cy.get('[data-testid="breeding-status-select"]').select('Confirmed');
      cy.get('[data-testid="breeding-gestation-input"]').type('280');
      cy.get('[data-testid="breeding-notes-textarea"]').type('Recorded automatically during Cypress run.');

      cy.get('[data-testid="submit-breeding-record-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=breeding');
      cy.get('[data-testid="breeding-records-table"] tbody', { timeout: 15000 }).within(() => {
        cy.contains('td', animalName).should('be.visible');
        cy.contains('td', 'Breeding').should('be.visible');
        cy.contains('td', 'Confirmed').should('be.visible');
      });
    });
  });
});

export {};
