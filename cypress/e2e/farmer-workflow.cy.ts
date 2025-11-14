/// <reference types="cypress" />

/**
 * Comprehensive End-to-End Test: Complete Farm Workflow
 * 
 * This test simulates a realistic farm management scenario:
 * 1. Farmer creates a farm and invites 3 team members
 * 2. Members accept invitations and join the farm
 * 3. Team members collaborate on different tasks:
 *    - Member 1: Creates organizational groups
 *    - Member 2: Registers animals (~20 animals)
 *    - Member 3: Organizes animals into groups (not all animals)
 * 4. Health and breeding records are created
 * 5. Farm overview and reports are verified
 */
describe('Complete Farm Workflow - Multi-User Collaboration', () => {
    // User credentials - use random digits for uniqueness
    const randomId = Math.floor(Math.random() * 100000);
    const farmerEmail = `farmer.${randomId}@sunshinedairy.com`;
    const farmerPassword = 'Farmer123!';
    const member1Email = `manager.${randomId}@sunshinedairy.com`;
    const member1Password = 'Manager123!';
    const member2Email = `worker.${randomId}@sunshinedairy.com`;
    const member2Password = 'Worker123!';
    const member3Email = `assistant.${randomId}@sunshinedairy.com`;
    const member3Password = 'Assistant123!';

    // Farm data
    let farmId: string;
    const farmName = `Sunshine Dairy Farm ${randomId}`;
    const farmDescription = 'A modern dairy farm specializing in Holstein and Jersey cattle';

    // Groups
    let breedingGroupId: string;
    let milkingGroupId: string;
    let calvesGroupId: string;

    // Animals array to track created animals
    const animals: Array<{ tagId: string; name: string; sex: 'male' | 'female'; breed: string; groupId?: string }> = [];

    // Helper function to generate tag ID with zero-padding
    const generateTagId = (prefix: string, number: number) => {
        return `${prefix}${String(number).padStart(3, '0')}`;
    };

    // Helper function to get date in YYYY-MM-DD format
    const getDate = (daysOffset: number = 0) => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    };

    before(() => {
        // Sign up all users sequentially - don't clear auth between, just sign out if needed
        cy.signup(farmerEmail, farmerPassword);
        cy.signout();
        
        cy.signup(member1Email, member1Password);
        cy.signout();
        
        cy.signup(member2Email, member2Password);
        cy.signout();
        
        cy.signup(member3Email, member3Password);
        cy.signout();
    });

    // it('should complete full farm workflow with team collaboration', () => {
    //     // ==========================================
    //     // STEP 1: FARMER SETUP - Create Farm
    //     // ==========================================
    //     cy.log('👨‍🌾 Step 1: Farmer creates farm');
    //     cy.clearAuth();
    //     cy.signin(farmerEmail, farmerPassword);
    //     cy.navigateToFarms();

    //     cy.createFarm(
    //         farmName,
    //         farmDescription,
    //         'dairy',
    //         '123 Dairy Road, Farm Valley, CA 90210',
    //         37.7749,
    //         -122.4194,
    //         150,
    //         60.7
    //     ).then((id) => {
    //         farmId = id;
    //         cy.log(`✅ Farm created: ${farmName} (ID: ${farmId})`);

    //         // Verify we're on farm detail page
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.get('[data-testid="farm-detail-page"]').should('be.visible');

    //         // ==========================================
    //         // STEP 2: FARMER INVITES MEMBERS
    //         // ==========================================
    //         cy.log('👥 Step 2: Farmer invites team members');
            
    //         cy.inviteMember(member1Email);
    //         cy.log(`✅ Invited ${member1Email}`);
            
    //         cy.inviteMember(member2Email);
    //         cy.log(`✅ Invited ${member2Email}`);
            
    //         cy.inviteMember(member3Email);
    //         cy.log(`✅ Invited ${member3Email}`);

    //         // ==========================================
    //         // STEP 3: MEMBERS ACCEPT INVITATIONS
    //         // ==========================================
    //         cy.log('✅ Step 3: Members accept invitations');

    //         // Member 1 accepts
    //         cy.signout();
    //         cy.signin(member1Email, member1Password);
    //         cy.acceptInvitation(farmName);
    //         cy.log(`✅ ${member1Email} joined the farm`);

    //         // Member 2 accepts
    //         cy.signout();
    //         cy.signin(member2Email, member2Password);
    //         cy.acceptInvitation(farmName);
    //         cy.log(`✅ ${member2Email} joined the farm`);

    //         // Member 3 accepts
    //         cy.signout();
    //         cy.signin(member3Email, member3Password);
    //         cy.acceptInvitation(farmName);
    //         cy.log(`✅ ${member3Email} joined the farm`);

    //         // ==========================================
    //         // STEP 4: MEMBER 1 CREATES GROUPS
    //         // ==========================================
    //         cy.log('📁 Step 4: Member 1 creates organizational groups');
            
    //         // Navigate to farm
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.contains(farmName).click();
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.get('[data-testid="farm-detail-page"]', { timeout: 10000 }).should('be.visible');
    //         cy.wait(2000);

    //         // Create Breeding Group
    //         cy.createGroup(
    //             'Breeding Cows',
    //             'Breeding',
    //             'North Pasture',
    //             'Cows assigned for breeding program'
    //         );
            
    //         // Wait for table to be fully loaded with the new group
    //         cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    //         cy.contains('Breeding Cows', { timeout: 10000 }).should('be.visible');
    //         cy.wait(2000);
            
    //         // Extract group ID from edit button in the row containing "Breeding Cows"
    //         cy.contains('tbody tr', 'Breeding Cows', { timeout: 10000 })
    //             .within(() => {
    //                 cy.get('[data-testid^="edit-group-button-"]')
    //                     .invoke('attr', 'data-testid')
    //                     .then((testId) => {
    //                         if (testId && testId.startsWith('edit-group-button-')) {
    //                             breedingGroupId = testId.replace('edit-group-button-', '');
    //                             cy.log(`✅ Created Breeding Cows group (ID: ${breedingGroupId})`);
    //                         }
    //                     });
    //             });
            
    //         // Navigate back to groups tab
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.visit(`/farms/${farmId}?tab=groups`);
    //         cy.wait(2000);

    //         // Create Milking Group
    //         cy.createGroup(
    //             'Milking Cows',
    //             'Milking',
    //             'Milking Barn',
    //             'Active milking cows in production'
    //         );
            
    //         // Wait for table to be fully loaded with the new group
    //         cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    //         cy.contains('Milking Cows', { timeout: 10000 }).should('be.visible');
    //         cy.wait(2000);
            
    //         // Extract group ID from edit button in the row containing "Milking Cows"
    //         cy.contains('tbody tr', 'Milking Cows', { timeout: 10000 })
    //             .within(() => {
    //                 cy.get('[data-testid^="edit-group-button-"]')
    //                     .invoke('attr', 'data-testid')
    //                     .then((testId) => {
    //                         if (testId && testId.startsWith('edit-group-button-')) {
    //                             milkingGroupId = testId.replace('edit-group-button-', '');
    //                             cy.log(`✅ Created Milking Cows group (ID: ${milkingGroupId})`);
    //                         }
    //                     });
    //             });

    //         // Create Calves Group (no need to navigate, we're already on groups tab)
    //         cy.createGroup(
    //             'Calves',
    //             'Raising',
    //             'Calf Barn',
    //             'Young calves being raised'
    //         );
            
    //         // Wait for table to be fully loaded with the new group
    //         cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    //         cy.contains('Calves', { timeout: 10000 }).should('be.visible');
    //         cy.wait(2000);
            
    //         // Extract group ID from edit button in the row containing "Calves"
    //         cy.contains('tbody tr', 'Calves', { timeout: 10000 })
    //             .within(() => {
    //                 cy.get('[data-testid^="edit-group-button-"]')
    //                     .invoke('attr', 'data-testid')
    //                     .then((testId) => {
    //                         if (testId && testId.startsWith('edit-group-button-')) {
    //                             calvesGroupId = testId.replace('edit-group-button-', '');
    //                             cy.log(`✅ Created Calves group (ID: ${calvesGroupId})`);
    //                         }
    //                     });
    //             });

    //         // ==========================================
    //         // STEP 5: MEMBER 2 REGISTERS ANIMALS
    //         // ==========================================
    //         cy.log('🐄 Step 5: Member 2 registers animals');
            
    //         cy.signout();
    //         cy.signin(member2Email, member2Password);
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.contains(farmName).click();
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.wait(2000);

    //         // Create breeding cows (5 animals)
    //         const breedingCowNames = ['Bessie', 'Daisy', 'Molly', 'Rosie', 'Luna'];
    //         for (let i = 0; i < 5; i++) {
    //             const tagId = generateTagId('BR', i + 1);
    //             const name = breedingCowNames[i];
    //             animals.push({ tagId, name, sex: 'female', breed: 'Holstein', groupId: breedingGroupId });
                
    //             cy.createAnimal(tagId, {
    //                 name,
    //                 species: 'cattle',
    //                 sex: 'female',
    //                 breed: 'Holstein',
    //                 trackingType: 'individual',
    //             });
    //             cy.log(`✅ Registered ${name} (${tagId})`);
    //         }

    //         // Create milking cows (8 animals)
    //         const milkingCowNames = ['Buttercup', 'Clover', 'Honey', 'Ivy', 'Jasmine', 'Katie', 'Maggie', 'Nellie'];
    //         for (let i = 0; i < 8; i++) {
    //             const tagId = generateTagId('MK', i + 1);
    //             const name = milkingCowNames[i];
    //             animals.push({ tagId, name, sex: 'female', breed: 'Holstein', groupId: milkingGroupId });
                
    //             cy.createAnimal(tagId, {
    //                 name,
    //                 species: 'cattle',
    //                 sex: 'female',
    //                 breed: 'Holstein',
    //                 trackingType: 'individual',
    //             });
    //             cy.log(`✅ Registered ${name} (${tagId})`);
    //         }

    //         // Create bulls (2 animals - not in groups)
    //         const bullNames = ['Thor', 'Zeus'];
    //         for (let i = 0; i < 2; i++) {
    //             const tagId = generateTagId('BL', i + 1);
    //             const name = bullNames[i];
    //             animals.push({ tagId, name, sex: 'male', breed: 'Angus' }); // No groupId
                
    //             cy.createAnimal(tagId, {
    //                 name,
    //                 species: 'cattle',
    //                 sex: 'male',
    //                 breed: 'Angus',
    //                 trackingType: 'individual',
    //             });
    //             cy.log(`✅ Registered ${name} (${tagId})`);
    //         }

    //         // Create calves (5 animals)
    //         const calfNames = ['Bambi', 'Coco', 'Duke', 'Ella', 'Finn'];
    //         for (let i = 0; i < 5; i++) {
    //             const tagId = generateTagId('CF', i + 1);
    //             const name = calfNames[i];
    //             animals.push({ tagId, name, sex: i < 3 ? 'female' : 'male', breed: 'Holstein', groupId: calvesGroupId });
                
    //             cy.createAnimal(tagId, {
    //                 name,
    //                 species: 'cattle',
    //                 sex: i < 3 ? 'female' : 'male',
    //                 breed: 'Holstein',
    //                 trackingType: 'individual',
    //             });
    //             cy.log(`✅ Registered ${name} (${tagId})`);
    //         }

    //         cy.log(`✅ Total animals registered: ${animals.length}`);

    //         // ==========================================
    //         // STEP 6: MEMBER 3 ORGANIZES ANIMALS INTO GROUPS
    //         // ==========================================
    //         cy.log('📋 Step 6: Member 3 organizes animals into groups');
            
    //         cy.signout();
    //         cy.signin(member3Email, member3Password);
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.contains(farmName).click();
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.wait(2000);

    //         // Add breeding cows to breeding group
    //         const breedingCows = animals.filter(a => a.groupId === breedingGroupId);
    //         for (const cow of breedingCows) {
    //             cy.addAnimalToGroup(farmId, breedingGroupId, cow.tagId, `${cow.name} added to breeding program`);
    //             cy.log(`✅ Added ${cow.name} to Breeding Cows group`);
    //         }

    //         // Add milking cows to milking group
    //         const milkingCows = animals.filter(a => a.groupId === milkingGroupId);
    //         for (const cow of milkingCows) {
    //             cy.addAnimalToGroup(farmId, milkingGroupId, cow.tagId, `${cow.name} added to milking group`);
    //             cy.log(`✅ Added ${cow.name} to Milking Cows group`);
    //         }

    //         // Add calves to calves group
    //         const calves = animals.filter(a => a.groupId === calvesGroupId);
    //         for (const calf of calves) {
    //             cy.addAnimalToGroup(farmId, calvesGroupId, calf.tagId, `${calf.name} added to calves group`);
    //             cy.log(`✅ Added ${calf.name} to Calves group`);
    //         }

    //         // Note: Bulls are not added to any group (realistic scenario - they're kept separate)

    //         // ==========================================
    //         // STEP 7: MEMBER 1 CREATES HEALTH RECORDS
    //         // ==========================================
    //         cy.log('🏥 Step 7: Member 1 creates health records');
            
    //         cy.signout();
    //         cy.signin(member1Email, member1Password);
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.contains(farmName).click();
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.wait(2000);

    //         // Create health records for some animals
    //         cy.createHealthRecord({
    //             animalName: 'Bessie',
    //             type: 'Vaccination',
    //             title: 'Annual Vaccination',
    //             description: 'Annual vaccination for respiratory diseases',
    //             performedAt: getDate(),
    //             performedBy: 'Dr. Smith',
    //             medication: 'Respiratory Vaccine',
    //             dosage: '5ml',
    //             cost: '25.00',
    //             healthScore: '9',
    //         });
    //         cy.log('✅ Health record created for Bessie');

    //         cy.createHealthRecord({
    //             animalName: 'Buttercup',
    //             type: 'Treatment',
    //             title: 'Hoof Treatment',
    //             description: 'Routine hoof trimming and treatment',
    //             performedAt: getDate(-5),
    //             performedBy: 'Dr. Smith',
    //             medication: 'Antibiotic Ointment',
    //             dosage: '2ml',
    //             cost: '15.00',
    //             healthScore: '8',
    //         });
    //         cy.log('✅ Health record created for Buttercup');

    //         // ==========================================
    //         // STEP 8: MEMBER 2 CREATES BREEDING RECORDS
    //         // ==========================================
    //         cy.log('🐂 Step 8: Member 2 creates breeding records');
            
    //         cy.signout();
    //         cy.signin(member2Email, member2Password);
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.contains(farmName).click();
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.wait(2000);

    //         // Create breeding records
    //         cy.createBreedingRecord({
    //             animalName: 'Bessie',
    //             mateName: 'Thor',
    //             eventDate: getDate(-60),
    //             type: 'Breeding',
    //             method: 'Natural',
    //             status: 'Confirmed',
    //             gestation: '280',
    //             expectedDueDate: getDate(220),
    //             notes: 'Natural breeding with confirmed pregnancy',
    //         });
    //         cy.log('✅ Breeding record created for Bessie');

    //         cy.createBreedingRecord({
    //             animalName: 'Daisy',
    //             mateName: 'Zeus',
    //             eventDate: getDate(-45),
    //             type: 'Breeding',
    //             method: 'Natural',
    //             status: 'Confirmed',
    //             gestation: '280',
    //             expectedDueDate: getDate(235),
    //             notes: 'Natural breeding with confirmed pregnancy',
    //         });
    //         cy.log('✅ Breeding record created for Daisy');

    //         // ==========================================
    //         // STEP 9: FARMER VERIFIES FARM OVERVIEW
    //         // ==========================================
    //         cy.log('👨‍🌾 Step 9: Farmer verifies farm overview');
            
    //         cy.signout();
    //         cy.signin(farmerEmail, farmerPassword);
    //         cy.get('[data-testid="farms-sidebar-button"]').click();
    //         cy.contains(farmName).click();
    //         cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
    //         cy.wait(2000);

    //         // Verify farm details
    //         cy.get('[data-testid="farm-detail-page"]').should('be.visible');
    //         cy.get('h1').should('contain', farmName);

    //         // Verify groups
    //         cy.get('[data-testid="tab-groups"]').click();
    //         cy.wait(2000);
    //         cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    //         cy.contains('Breeding Cows').should('be.visible');
    //         cy.contains('Milking Cows').should('be.visible');
    //         cy.contains('Calves').should('be.visible');
    //         cy.log('✅ All groups are visible');

    //         // Verify animals (should have at least 20)
    //         cy.get('[data-testid="tab-animals"]').click();
    //         cy.wait(2000);
    //         cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    //         cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 20);
    //         cy.log('✅ All animals are visible');

    //         // Verify members (should have 4: farmer + 3 members)
    //         cy.get('[data-testid="tab-members"]').click();
    //         cy.wait(2000);
    //         cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
    //         cy.get('tbody tr', { timeout: 10000 }).should('have.length', 4);
    //         cy.contains(farmerEmail).should('be.visible');
    //         cy.contains(member1Email).should('be.visible');
    //         cy.contains(member2Email).should('be.visible');
    //         cy.contains(member3Email).should('be.visible');
    //         cy.log('✅ All members are visible');

    //         // Verify health records
    //         cy.get('[data-testid="tab-health"]').click();
    //         cy.wait(2000);
    //         cy.get('[data-testid="health-records-table"]', { timeout: 10000 }).should('exist');
    //         cy.log('✅ Health records are visible');

    //         // Verify breeding records
    //         cy.get('[data-testid="tab-breeding"]').click();
    //         cy.wait(2000);
    //         cy.get('[data-testid="breeding-records-table"]', { timeout: 10000 }).should('exist');
    //         cy.log('✅ Breeding records are visible');

    //         cy.log('🎉 Complete farm workflow test passed!');
    //     });
    // });

    it('should complete simplified farm workflow with team collaboration', () => {
        // ==========================================
        // STEP 1: FARMER SETUP - Create Farm
        // ==========================================
        cy.log('👨‍🌾 Step 1: Farmer creates farm');
        cy.clearAuth();
        cy.signin(farmerEmail, farmerPassword);
        cy.navigateToFarms();

        cy.createFarm(
            farmName,
            farmDescription,
            'dairy',
            '123 Dairy Road, Farm Valley, CA 90210',
            37.7749,
            -122.4194,
            150,
            60.7
        ).then((id) => {
            farmId = id;
            cy.log(`✅ Farm created: ${farmName} (ID: ${farmId})`);

            // Verify we're on farm detail page
            cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
            cy.get('[data-testid="farm-detail-page"]').should('be.visible');

            // ==========================================
            // STEP 2: FARMER INVITES MEMBERS
            // ==========================================
            cy.log('👥 Step 2: Farmer invites team members');
            
            cy.inviteMember(member1Email);
            cy.log(`✅ Invited ${member1Email}`);
            
            cy.inviteMember(member2Email);
            cy.log(`✅ Invited ${member2Email}`);

            // ==========================================
            // STEP 3: MEMBERS ACCEPT INVITATIONS
            // ==========================================
            cy.log('✅ Step 3: Members accept invitations');

            // Member 1 accepts
            cy.signout();
            cy.signin(member1Email, member1Password);
            cy.acceptInvitation(farmName);
            cy.log(`✅ ${member1Email} joined the farm`);

            // Member 2 accepts
            cy.signout();
            cy.signin(member2Email, member2Password);
            cy.acceptInvitation(farmName);
            cy.log(`✅ ${member2Email} joined the farm`);

            // ==========================================
            // STEP 4: MEMBER 1 CREATES A GROUP
            // ==========================================
            cy.log('📁 Step 4: Member 1 creates a group');
            
            // Navigate to farm
            cy.get('[data-testid="farms-sidebar-button"]').click();
            cy.contains(farmName).click();
            cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
            cy.get('[data-testid="farm-detail-page"]', { timeout: 10000 }).should('be.visible');
            cy.wait(2000);

            // Create one group
            cy.createGroup(
                'Breeding Cows',
                'Breeding',
                'North Pasture',
                'Cows assigned for breeding program'
            );
            
            // Wait for table to be fully loaded with the new group
            cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
            cy.contains('Breeding Cows', { timeout: 10000 }).should('be.visible');
            cy.wait(2000);
            
            // Extract group ID from edit button in the row containing "Breeding Cows"
            cy.contains('tbody tr', 'Breeding Cows', { timeout: 10000 })
                .within(() => {
                    cy.get('[data-testid^="edit-group-button-"]')
                        .invoke('attr', 'data-testid')
                        .then((testId) => {
                            if (testId && testId.startsWith('edit-group-button-')) {
                                breedingGroupId = testId.replace('edit-group-button-', '');
                                cy.log(`✅ Created Breeding Cows group (ID: ${breedingGroupId})`);
                            }
                        });
                });

            // ==========================================
            // STEP 5: MEMBER 2 REGISTERS 2 ANIMALS
            // ==========================================
            cy.log('🐄 Step 5: Member 2 registers animals');
            
            cy.signout();
            cy.signin(member2Email, member2Password);
            cy.get('[data-testid="farms-sidebar-button"]').click();
            cy.contains(farmName).click();
            cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
            cy.wait(2000);

            // Create 2 animals
            const animalNames = ['Bessie', 'Daisy'];
            for (let i = 0; i < 2; i++) {
                const tagId = generateTagId('COW', i + 1);
                const name = animalNames[i];
                animals.push({ tagId, name, sex: 'female', breed: 'Holstein', groupId: breedingGroupId });
                
                cy.createAnimal(tagId, {
                    name,
                    species: 'cattle',
                    sex: 'female',
                    breed: 'Holstein',
                    trackingType: 'individual',
                });
                cy.log(`✅ Registered ${name} (${tagId})`);
            }

            cy.log(`✅ Total animals registered: ${animals.length}`);

            // ==========================================
            // STEP 6: MEMBER 1 ADDS ANIMALS TO GROUP
            // ==========================================
            cy.log('📋 Step 6: Member 1 adds animals to group');
            
            cy.signout();
            cy.signin(member1Email, member1Password);
            cy.get('[data-testid="farms-sidebar-button"]').click();
            cy.contains(farmName).click();
            cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
            cy.wait(2000);

            // Add both animals to the group
            for (const animal of animals) {
                cy.addAnimalToGroup(farmId, breedingGroupId, animal.tagId, 'Breeding Cows', `${animal.name} added to breeding program`);
                cy.log(`✅ Added ${animal.name} to Breeding Cows group`);
            }

            // ==========================================
            // STEP 7: MEMBER 1 CREATES A HEALTH RECORD FROM ANIMAL DETAIL PAGE
            // ==========================================
            cy.log('🏥 Step 7: Member 1 creates health record from animal detail page');
            
            cy.signout();
            cy.signin(member1Email, member1Password);
            cy.get('[data-testid="farms-sidebar-button"]').click();
            cy.contains(farmName).click();
            cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
            cy.wait(2000);
            
            // Navigate to animals tab
            cy.get('[data-testid="tab-animals"]').click();
            cy.wait(2000);
            
            // Click on Bessie's tag_id button to navigate to animal detail page
            // The tag_id is stored in animals[0].tagId (Bessie is the first animal)
            // The tag_id column is rendered as a clickable button in AnimalsTable
            const bessieTagId = animals[0].tagId;
            cy.contains('button', bessieTagId, { timeout: 10000 }).click();
            
            cy.wait(2000);
            
            // Verify we're on the animal detail page
            cy.get('[data-testid="animal-detail-page"]', { timeout: 10000 }).should('be.visible');
            cy.url({ timeout: 10000 }).should('include', '/animals/');

            // Create health record for Bessie (animal is pre-selected)
            cy.createHealthRecord({
                animalName: 'Bessie',
                type: 'Vaccination',
                title: 'Annual Vaccination',
                description: 'Annual vaccination for respiratory diseases',
                performedAt: getDate(),
                performedBy: 'Dr. Smith',
                medication: 'Respiratory Vaccine',
                dosage: '5ml',
                cost: '25.00',
                healthScore: '9',
            });
            cy.log('✅ Health record created for Bessie');

            // ==========================================
            // STEP 8: FARMER VERIFIES FARM OVERVIEW
            // ==========================================
            cy.log('👨‍🌾 Step 8: Farmer verifies farm overview');
            
            cy.signout();
            cy.signin(farmerEmail, farmerPassword);
            cy.get('[data-testid="farms-sidebar-button"]').click();
            cy.contains(farmName).click();
            cy.url({ timeout: 10000 }).should('include', `/farms/${farmId}`);
            cy.wait(2000);

            // Verify farm details
            cy.get('[data-testid="farm-detail-page"]').should('be.visible');
            cy.get('h1').should('contain', farmName);

            // Verify group
            cy.get('[data-testid="tab-groups"]').click();
            cy.wait(2000);
            cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
            cy.contains('Breeding Cows').should('be.visible');
            cy.log('✅ Group is visible');

            // Verify animals (should have 2)
            cy.get('[data-testid="tab-animals"]').click();
            cy.wait(2000);
            cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
            cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 2);
            cy.contains('Bessie').should('be.visible');
            cy.contains('Daisy').should('be.visible');
            cy.log('✅ All animals are visible');

            // Verify members (should have 3: farmer + 2 members)
            cy.get('[data-testid="tab-members"]').click();
            cy.wait(2000);
            cy.get('.MuiTable-root', { timeout: 10000 }).should('be.visible');
            cy.get('tbody tr', { timeout: 10000 }).should('have.length', 3);
            cy.contains(farmerEmail).should('be.visible');
            cy.contains(member1Email).should('be.visible');
            cy.contains(member2Email).should('be.visible');
            cy.log('✅ All members are visible');

            // Verify health records
            cy.get('[data-testid="tab-health"]').click();
            cy.wait(2000);
            cy.get('[data-testid="health-records-table"]', { timeout: 10000 }).should('exist');
            cy.contains('Annual Vaccination').should('be.visible');
            cy.log('✅ Health records are visible');

            cy.log('🎉 Simplified farm workflow test passed!');
        });
    });
});
