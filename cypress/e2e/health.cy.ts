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
    .then(() =>
      cy.createAnimal(animalTag, {
        name: animalName,
        sex: 'female',
        breed: 'Holstein',
      }),
    )
    .then(() => ({ farmName, animalName }));
};

describe('Health Management', () => {
  const password = 'TestPassword123!';
  const uniqueId = Date.now();
  const email = `health_${uniqueId}@example.com`;

  before(() => {
    cy.signup(email, password);
  });

  beforeEach(() => {
    cy.clearAuth();
    cy.signin(email, password);
    cy.navigateToFarms();
  });

  it('creates a health record for an animal and displays it in the records table', () => {
    createFarmAndAnimal('Health Record Farm').then(({ animalName }) => {
      cy.get('[data-testid="tab-health"]').click();
      cy.get('[data-testid="health-records-table"], [data-testid="health-records-empty"]', {
        timeout: 15000,
      }).should('exist');
      cy.get('[data-testid="health-schedules-table"], [data-testid="health-schedules-empty"]', {
        timeout: 15000,
      }).should('exist');

      cy.get('[data-testid="create-health-record-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '/health/records/new');

      cy.get('[data-testid="health-record-animal-select"]').select(animalName);
      cy.get('[data-testid="health-record-type-select"]').select('Vaccination');
      cy.get('[data-testid="health-record-title-input"]').type('Annual Vaccination');
      cy.get('[data-testid="health-record-performed-at-input"]').type(formatDate());
      cy.get('[data-testid="health-record-medication-input"]').type('Vitamin booster');
      cy.get('[data-testid="health-record-notes-textarea"]').type('Automated record created during Cypress test.');

      cy.get('[data-testid="submit-health-record-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=health');
      cy.get('[data-testid="health-records-table"] tbody', { timeout: 15000 }).within(() => {
        cy.contains('td', 'Annual Vaccination').should('be.visible');
        cy.contains('td', animalName).should('be.visible');
        cy.contains('td', 'Vaccination').should('be.visible');
      });
    });
  });

  it('creates a health schedule for an animal and lists it in the schedules table', () => {
    createFarmAndAnimal('Health Schedule Farm').then(({ animalName }) => {
      cy.get('[data-testid="tab-health"]').click();
      cy.get('[data-testid="health-records-table"], [data-testid="health-records-empty"]', {
        timeout: 15000,
      }).should('exist');
      cy.get('[data-testid="health-schedules-table"], [data-testid="health-schedules-empty"]', {
        timeout: 15000,
      }).should('exist');

      cy.get('[data-testid="create-health-schedule-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '/health/schedules/new');

      cy.get('[data-testid="health-schedule-target-type-select"]').select('Animal');
      cy.get('[data-testid="health-schedule-target-select"]').select(animalName);
      cy.get('[data-testid="health-schedule-name-input"]').type('Quarterly Wellness Check');
      cy.get('[data-testid="health-schedule-frequency-select"]').select('Recurring');
      cy.get('[data-testid="health-schedule-interval-input"]').clear().type('90');
      cy.get('[data-testid="health-schedule-start-date-input"]').type(formatDate());
      cy.get('[data-testid="health-schedule-lead-time-input"]').clear().type('5');
      cy.get('[data-testid="health-schedule-description-textarea"]').type('Automated schedule created during Cypress test.');

      cy.get('[data-testid="submit-health-schedule-button"]').click();
      cy.url({ timeout: 10000 }).should('include', '?tab=health');
      cy.get('[data-testid="health-schedules-table"] tbody', { timeout: 15000 }).within(() => {
        cy.contains('td', 'Quarterly Wellness Check').should('be.visible');
        cy.contains('td', 'Recurring').should('be.visible');
        cy.contains('td', 'Active').should('be.visible');
      });
    });
  });
});

export {};
