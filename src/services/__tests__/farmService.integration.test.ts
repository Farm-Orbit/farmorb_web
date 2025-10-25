import { FarmService } from '../farmService';
import { AuthService } from '../authService';
import { TokenManager } from '../../utils/tokenManager';
import { CreateFarmData } from '../../types/farm';

describe('FarmService Integration Tests', () => {
    // Test with real API calls - no mocking
    const testUser = {
        email: `testuser${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
    };

    const testFarmData: CreateFarmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State, Test Country',
        location_latitude: 34.0522,
        location_longitude: -118.2437,
        size_acres: 100,
        size_hectares: 40.47,
    };

    let createdFarmId: string;
    let authToken: string;

    // Setup: Sign up and login before running farm tests
    beforeAll(async () => {
        try {
            console.log('🔐 Setting up authentication...');

            // Sign up the test user
            await AuthService.register(testUser);
            console.log('✅ User registered successfully');

            // Login to get the token
            const authResponse = await AuthService.login({
                email: testUser.email,
                password: testUser.password,
            });

            authToken = authResponse.accessToken;

            // Set the token in TokenManager so API calls will use it
            TokenManager.setAccessToken(authToken, authResponse.expiresIn);
            if (authResponse.refreshToken) {
                TokenManager.setRefreshToken(authResponse.refreshToken);
            }

            console.log('✅ User logged in successfully, token set in TokenManager');

        } catch (error) {
            console.error('❌ Authentication setup failed:', error);
            throw error;
        }
    }, 15000);

    // Cleanup: Clear tokens after tests
    afterAll(async () => {
        try {
            TokenManager.clearTokens();
            console.log('🧹 Tokens cleared after tests');
        } catch (error) {
            console.error('❌ Token cleanup failed:', error);
        }
    });

    it('should create a farm successfully', async () => {
        try {
            const result = await FarmService.createFarm(testFarmData);

            // Log the actual response to understand the structure
            console.log('🔍 Farm creation response:', JSON.stringify(result, null, 2));

            // Verify the response structure
            expect(result).toBeDefined();
            expect((result as any).id).toBeDefined();
            expect((result as any).name).toBe(testFarmData.name);
            expect((result as any).description).toBe(testFarmData.description);
            expect((result as any).farm_type).toBe(testFarmData.farm_type);
            expect((result as any).location_address).toBe(testFarmData.location_address);
            expect((result as any).location_latitude).toBe(testFarmData.location_latitude);
            expect((result as any).location_longitude).toBe(testFarmData.location_longitude);
            expect((result as any).size_acres).toBe(testFarmData.size_acres);
            expect((result as any).size_hectares).toBe(testFarmData.size_hectares);
            expect((result as any).is_active).toBeDefined();
            expect((result as any).created_at).toBeDefined();
            expect((result as any).updated_at).toBeDefined();

            // Store the created farm ID for cleanup
            createdFarmId = (result as any).id;

            console.log('✅ Farm created successfully:', result);
        } catch (error) {
            console.error('❌ Farm creation failed:', error);
            throw error;
        }
    }, 10000);

    it('should fetch all farms', async () => {
        try {
            const result = await FarmService.getFarms();

            // Log the actual response to understand the structure
            console.log('🔍 Farm listing response:', JSON.stringify(result, null, 2));

            // Verify the response structure
            expect(result).toBeDefined();
            expect(Array.isArray(result.farms)).toBe(true);

            // Check if our created farm is in the list
            const ourFarm = result.farms.find(farm => (farm as any).id === createdFarmId);
            expect(ourFarm).toBeDefined();
            expect((ourFarm as any)?.name).toBe(testFarmData.name);

            console.log('✅ Farms fetched successfully:', result.farms.length, 'farms found');
        } catch (error) {
            console.error('❌ Fetch farms failed:', error);
            throw error;
        }
    }, 10000);

    it('should fetch a specific farm by ID', async () => {
        try {
            const result = await FarmService.getFarmById(createdFarmId);

            // Verify the response structure
            expect(result).toBeDefined();
            expect((result as any).id).toBe(createdFarmId);
            expect((result as any).name).toBe(testFarmData.name);
            expect((result as any).description).toBe(testFarmData.description);
            expect((result as any).farm_type).toBe(testFarmData.farm_type);
            expect((result as any).location_address).toBe(testFarmData.location_address);

            console.log('✅ Farm fetched by ID successfully:', result);
        } catch (error) {
            console.error('❌ Fetch farm by ID failed:', error);
            throw error;
        }
    }, 10000);

    it('should handle farm update', async () => {
        try {
            const updateData = {
                id: createdFarmId,
                name: `Updated ${testFarmData.name}`,
                description: 'Updated description',
                farm_type: 'dairy',
                location_address: 'Updated Farm Address',
            };

            const result = await FarmService.updateFarm(createdFarmId, updateData);

            // Verify the response structure
            expect(result).toBeDefined();
            expect((result as any).id).toBe(createdFarmId);
            expect((result as any).name).toBe(updateData.name);
            expect((result as any).description).toBe(updateData.description);
            expect((result as any).farm_type).toBe(updateData.farm_type);
            expect((result as any).location_address).toBe(updateData.location_address);

            console.log('✅ Farm updated successfully:', result);
        } catch (error) {
            console.error('❌ Farm update failed:', error);
            throw error;
        }
    }, 10000);

    it('should delete a farm', async () => {
        try {
            const result = await FarmService.deleteFarm(createdFarmId);

            // Verify the response structure
            expect(result).toBeDefined();
            // The API returns "Farm archived successfully" message
            expect((result as any).message).toBe('Farm archived successfully');

            console.log('✅ Farm deleted successfully:', result);
        } catch (error) {
            console.error('❌ Farm deletion failed:', error);
            throw error;
        }
    }, 10000);

    it('should handle farm not found error', async () => {
        try {
            await FarmService.getFarmById('non-existent-id');
            // If we get here, the test should fail
            expect(true).toBe(false);
        } catch (error) {
            // This is expected - the farm should not be found
            expect(error).toBeDefined();
            console.log('✅ Farm not found error handled correctly:', error);
        }
    }, 10000);
});
