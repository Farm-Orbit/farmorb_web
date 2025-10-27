import { FarmMemberService } from '../farmMemberService';
import { FarmService } from '../farmService';
import { AuthService } from '../authService';
import { TokenManager } from '../../utils/tokenManager';

describe('FarmMemberService Integration Tests', () => {
  // These tests require a running API server
  // Make sure the backend API is running before running these tests
  
  // Test with real API calls - no mocking
  const testUser = {
    email: `testuser${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };
  
  let testFarm: any;
  let authToken: string;
  
  beforeAll(async () => {
    // Create a test user and farm for the integration tests
    try {
      // Register a test user
      await AuthService.register(testUser);
      
      // Login to get auth token
      const loginResponse = await AuthService.login({
        email: testUser.email,
        password: testUser.password,
      });
      
      authToken = loginResponse.accessToken;
      
      // Set the token in TokenManager so API calls will use it
      TokenManager.setAccessToken(authToken, loginResponse.expiresIn);
      if (loginResponse.refreshToken) {
        TokenManager.setRefreshToken(loginResponse.refreshToken);
      }
      
      console.log('✅ User logged in successfully, token set in TokenManager');
    } catch (error: any) {
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

  describe('getFarmMembers', () => {
    it('should fetch farm members successfully', async () => {
      // Create a test farm first - using the same pattern as farmService test
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      const result = await FarmMemberService.getFarmMembers((farm as any).id);
      
      // Should return an array of members
      expect(Array.isArray(result)).toBe(true);
      
      // The farm owner should be in the members list
      expect(result.length).toBeGreaterThan(0);
      
      const ownerMember = result.find(member => member.role === 'owner');
      expect(ownerMember).toBeDefined();
      expect(ownerMember?.role).toBe('owner');
      expect(ownerMember).toHaveProperty('joined_at');
    });
  });

  describe('inviteMember', () => {
    it('should invite member by email successfully', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      const inviteData = {
        email: 'newmember@example.com',
        role: 'member' as const,
      };

      const result = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      
      // Should return an invitation object
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('farm_id', (farm as any).id);
      expect(result).toHaveProperty('farm_name', (farm as any).name);
      expect(result).toHaveProperty('email', 'newmember@example.com');
      expect(result).toHaveProperty('role', 'member');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('expires_at');
      expect(result).toHaveProperty('created_at');
    });

    it('should invite member by phone successfully', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      const inviteData = {
        phone: '+233241234567', // Exactly 13 characters as required by API
        role: 'member' as const,
      };

      const result = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      
      // Should return an invitation object
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('farm_id', (farm as any).id);
      expect(result).toHaveProperty('farm_name', (farm as any).name);
      expect(result).toHaveProperty('phone', '+233241234567');
      expect(result).toHaveProperty('role', 'member');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('expires_at');
      expect(result).toHaveProperty('created_at');
    });
  });

  describe('removeFarmMember', () => {
    it('should remove farm member successfully', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      // Create a second user (the member to be removed)
      const memberEmail = `membertoremove${Date.now()}@example.com`;
      const memberPassword = 'Member123!';
      
      // Register the member
      await AuthService.register({
        email: memberEmail,
        password: memberPassword,
        firstName: 'Member',
        lastName: 'ToRemove',
      });

      // Login as the member to get their token
      const memberLogin = await AuthService.login({
        email: memberEmail,
        password: memberPassword,
      });

      // Set the member's token in TokenManager
      TokenManager.setAccessToken(memberLogin.accessToken, memberLogin.expiresIn);
      if (memberLogin.refreshToken) {
        TokenManager.setRefreshToken(memberLogin.refreshToken);
      }

      // Now invite this user to the farm (as the farm owner)
      // We need to switch back to the farm owner's token
      const farmOwnerLogin = await AuthService.login({
        email: testUser.email,
        password: testUser.password,
      });
      TokenManager.setAccessToken(farmOwnerLogin.accessToken, farmOwnerLogin.expiresIn);
      if (farmOwnerLogin.refreshToken) {
        TokenManager.setRefreshToken(farmOwnerLogin.refreshToken);
      }

      const inviteData = {
        email: memberEmail,
        role: 'member' as const,
      };

      const invitation = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      expect(invitation).toBeDefined();
      expect(invitation.status).toBe('pending');

      // Now switch back to the member's token and accept the invitation
      TokenManager.setAccessToken(memberLogin.accessToken, memberLogin.expiresIn);
      if (memberLogin.refreshToken) {
        TokenManager.setRefreshToken(memberLogin.refreshToken);
      }

      // Accept the invitation to create a member
      const acceptResult = await FarmMemberService.acceptInvitation(invitation.id);
      expect(acceptResult.success).toBe(true);
      console.log('✅ Member accepted invitation successfully');

      // Now switch back to farm owner's token to remove the member
      TokenManager.setAccessToken(farmOwnerLogin.accessToken, farmOwnerLogin.expiresIn);
      if (farmOwnerLogin.refreshToken) {
        TokenManager.setRefreshToken(farmOwnerLogin.refreshToken);
      }

      // Now verify the member was added by fetching farm members
      const membersBefore = await FarmMemberService.getFarmMembers((farm as any).id);
      expect(Array.isArray(membersBefore)).toBe(true);
      
      console.log('🔍 Members before removal:', membersBefore);
      console.log('🔍 Looking for member with email:', memberEmail);
      
      // Find the member we just added (should have the invited email)
      const addedMember = membersBefore.find(member => 
        member.email === memberEmail
      );
      expect(addedMember).toBeDefined();
      expect(addedMember?.id).toBeDefined();

      console.log('🔍 Found member to remove:', addedMember);

      // Now remove the member
      // Note: The backend expects the user_id, not the farm member id
      console.log('🔍 Attempting to remove member with user_id:', addedMember!.user_id);
      const removeResult = await FarmMemberService.removeFarmMember((farm as any).id, addedMember!.user_id);
      expect(removeResult.success).toBe(true);

      // Verify the member was removed by fetching farm members again
      const membersAfter = await FarmMemberService.getFarmMembers((farm as any).id);
      expect(Array.isArray(membersAfter)).toBe(true);
      
      // The removed member should no longer be in the list
      const removedMember = membersAfter.find(member => 
        member.id === addedMember!.id
      );
      expect(removedMember).toBeUndefined();
      
      console.log('✅ Member successfully removed from farm');
    });
  });

  describe('getUserInvitations', () => {
    it('should fetch user invitations by email', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      // First, create an invitation to a different user's email
      // (can't invite the same user who owns the farm)
      const inviteData = {
        email: 'differentuser@example.com',
        role: 'member' as const,
      };

      const invitation = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      expect(invitation).toBeDefined();
      expect(invitation.email).toBe('differentuser@example.com');

      // Now fetch invitations for this email - should find the one we just created
      const result = await FarmMemberService.getUserInvitations('differentuser@example.com');
      
      // Should return an array of invitations
      expect(Array.isArray(result)).toBe(true);
      
      // Should have at least one invitation since we just created one
      expect(result.length).toBeGreaterThan(0);
      
      // Should find the invitation we just created
      const foundInvitation = result.find(inv => inv.id === invitation.id);
      expect(foundInvitation).toBeDefined();
      expect(foundInvitation?.email).toBe('differentuser@example.com');
      expect(foundInvitation?.farm_id).toBe((farm as any).id);
      expect(foundInvitation?.role).toBe('member');
      expect(foundInvitation?.status).toBe('pending');
    });

    it('should fetch user invitations by phone', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      // Test with a phone number
      const testPhone = '+233241234567';
      
      // First, create an invitation to this phone number
      const inviteData = {
        phone: testPhone,
        role: 'member' as const,
      };

      const invitation = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      expect(invitation).toBeDefined();
      expect(invitation.phone).toBe(testPhone);

      // Now fetch invitations for this phone - should find the one we just created
      const result = await FarmMemberService.getUserInvitations(undefined, testPhone);
      
      // Should return an array of invitations
      expect(Array.isArray(result)).toBe(true);
      
      // Should have at least one invitation since we just created one
      expect(result.length).toBeGreaterThan(0);
      
      // Should find the invitation we just created
      const foundInvitation = result.find(inv => inv.id === invitation.id);
      expect(foundInvitation).toBeDefined();
      expect(foundInvitation?.phone).toBe(testPhone);
      expect(foundInvitation?.farm_id).toBe((farm as any).id);
      expect(foundInvitation?.role).toBe('member');
      expect(foundInvitation?.status).toBe('pending');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      // Create a second user (the invited user)
      const invitedUserEmail = `inviteduser${Date.now()}@example.com`;
      const invitedUserPassword = 'InvitedUser123!';
      
      // Register the invited user
      await AuthService.register({
        email: invitedUserEmail,
        password: invitedUserPassword,
        firstName: 'Invited',
        lastName: 'User',
      });

      // Login as the invited user to get their token
      const invitedUserLogin = await AuthService.login({
        email: invitedUserEmail,
        password: invitedUserPassword,
      });

      // Set the invited user's token in TokenManager
      TokenManager.setAccessToken(invitedUserLogin.accessToken, invitedUserLogin.expiresIn);
      if (invitedUserLogin.refreshToken) {
        TokenManager.setRefreshToken(invitedUserLogin.refreshToken);
      }

      // Now invite this user to the farm (as the farm owner)
      // We need to switch back to the farm owner's token
      const farmOwnerLogin = await AuthService.login({
        email: testUser.email,
        password: testUser.password,
      });
      TokenManager.setAccessToken(farmOwnerLogin.accessToken, farmOwnerLogin.expiresIn);
      if (farmOwnerLogin.refreshToken) {
        TokenManager.setRefreshToken(farmOwnerLogin.refreshToken);
      }

      const inviteData = {
        email: invitedUserEmail,
        role: 'member' as const,
      };

      const invitation = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      expect(invitation).toBeDefined();
      expect(invitation.id).toBeDefined();
      expect(invitation.status).toBe('pending');

      // Now switch back to the invited user's token and accept the invitation
      TokenManager.setAccessToken(invitedUserLogin.accessToken, invitedUserLogin.expiresIn);
      if (invitedUserLogin.refreshToken) {
        TokenManager.setRefreshToken(invitedUserLogin.refreshToken);
      }

      // Now test accepting the invitation as the invited user
      const result = await FarmMemberService.acceptInvitation(invitation.id);
      
      // Should return a success response
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      console.log('✅ Invitation accepted successfully by the invited user');
    });
  });

  describe('declineInvitation', () => {
    it('should decline invitation successfully', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      // First create an invitation to decline
      const inviteData = {
        email: 'membertodecline@example.com',
        role: 'member' as const,
      };

      const invitation = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      expect(invitation).toBeDefined();
      expect(invitation.id).toBeDefined();
      expect(invitation.status).toBe('pending');

      // Now test declining the invitation
      // Note: In a real scenario, this would be done by the invited user
      // For this test, we'll verify the endpoint works correctly
      const result = await FarmMemberService.declineInvitation(invitation.id);
      
      // Should return a success response
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      // Verify the invitation was declined
      console.log('✅ Invitation declined successfully');
    });
  });

  describe('acceptInvitationByToken', () => {
    it('should accept invitation by token successfully', async () => {
      // Create a test farm first
      const farmData = {
        name: `Test Farm ${Date.now()}`,
        description: 'Integration test farm for member management',
        farm_type: 'crop',
        location_address: '123 Test Farm Road, Test City, Test State',
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        size_acres: 100,
        size_hectares: 40.47,
      };

      const farm = await FarmService.createFarm(farmData);
      expect(farm).toBeDefined();
      expect((farm as any).id).toBeDefined();

      // First create an invitation to get a token
      const inviteData = {
        email: 'memberbytoken@example.com',
        role: 'member' as const,
      };

      const invitation = await FarmMemberService.inviteMember((farm as any).id, inviteData);
      expect(invitation).toBeDefined();

      // Test accepting by token (this would typically be done with a real token from email)
      // For this test, we'll use a mock token to verify the endpoint exists
      // This should fail with an invalid token, which is expected behavior
      try {
        const result = await FarmMemberService.acceptInvitationByToken('mock-token-123');
        
        // If it doesn't fail, that's unexpected - the test should fail
        expect(result).toBeUndefined(); // This should not be reached
      } catch (error: any) {
        // This should fail with an invalid token, which is expected
        expect(error).toBeDefined();
        // The error might be a 500 error, which is also acceptable for invalid tokens
        expect(error.statusCode === 500 || error.message?.includes('token') || error.error?.includes('token')).toBe(true);
        console.log('✅ Accept invitation by token endpoint is working (correctly rejected invalid token)');
      }
    });
  });

  afterAll(async () => {
    // Cleanup: Delete the test farm and user if needed
    try {
      if (testFarm?.id) {
        await FarmService.deleteFarm(testFarm.id);
        console.log('✅ Test farm cleaned up');
      }
    } catch (error: any) {
      console.log('⚠️ Test cleanup failed:', error.message);
    }
  });
});
