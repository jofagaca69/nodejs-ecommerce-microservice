const AuthService = require('../../../src/services/authService');
const User = require('../../../src/models/user');
const mongoose = require('mongoose');

describe('AuthService - User Update Validation', () => {
  let authService;

  beforeAll(async () => {
    const MONGODB_TEST_URI = process.env.MONGODB_AUTH_URI || 'mongodb://localhost:27017/?authSource=admin';
    await mongoose.connect(MONGODB_TEST_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    authService = new AuthService();
  });

  afterEach(async () => {
    await User.deleteMany({ username: /^testuser/ });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Phone Number Validation', () => {
    it('USER-UPDATE-UNIT-001: should validate phone number format (8-15 digits)', async () => {
      // Arrange: Create a test user
      const user = await authService.register({
        username: 'testuser_phone1',
        password: 'password123'
      });

      // Act & Assert: Valid phone numbers
      const validPhones = ['12345678', '1234567890', '123456789012345'];
      
      for (const phone of validPhones) {
        const updatedUser = await authService.updateUser(user._id.toString(), { phone });
        expect(updatedUser.phone).toBe(phone);
      }
    });

    it('USER-UPDATE-UNIT-002: should reject phone number with less than 8 digits', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_phone2',
        password: 'password123'
      });

      // Act & Assert
      await expect(
        authService.updateUser(user._id.toString(), { phone: '1234567' })
      ).rejects.toThrow('Phone number must be 8-15 digits');
    });

    it('USER-UPDATE-UNIT-003: should reject phone number with more than 15 digits', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_phone3',
        password: 'password123'
      });

      // Act & Assert
      await expect(
        authService.updateUser(user._id.toString(), { phone: '1234567890123456' })
      ).rejects.toThrow('Phone number must be 8-15 digits');
    });

    it('USER-UPDATE-UNIT-004: should reject phone number with non-digit characters', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_phone4',
        password: 'password123'
      });

      // Act & Assert
      await expect(
        authService.updateUser(user._id.toString(), { phone: '123-456-7890' })
      ).rejects.toThrow('Phone number must be 8-15 digits');
    });
  });

  describe('User Update with Customer Information', () => {
    it('USER-UPDATE-UNIT-005: should update user with name, phone, and address', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_update1',
        password: 'password123'
      });

      // Act
      const updatedUser = await authService.updateUser(user._id.toString(), {
        name: 'John Doe',
        phone: '1234567890',
        address: '123 Main Street, City'
      });

      // Assert
      expect(updatedUser.name).toBe('John Doe');
      expect(updatedUser.phone).toBe('1234567890');
      expect(updatedUser.address).toBe('123 Main Street, City');
    });

    it('USER-UPDATE-UNIT-006: should validate name max length (100 characters)', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_update2',
        password: 'password123'
      });

      const longName = 'a'.repeat(101);

      // Act & Assert
      await expect(
        authService.updateUser(user._id.toString(), { name: longName })
      ).rejects.toThrow('Name must be 100 characters or less');
    });

    it('USER-UPDATE-UNIT-007: should validate address max length (500 characters)', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_update3',
        password: 'password123'
      });

      const longAddress = 'a'.repeat(501);

      // Act & Assert
      await expect(
        authService.updateUser(user._id.toString(), { address: longAddress })
      ).rejects.toThrow('Address must be 500 characters or less');
    });

    it('USER-UPDATE-UNIT-008: should require at least one field for update', async () => {
      // Arrange
      const user = await authService.register({
        username: 'testuser_update4',
        password: 'password123'
      });

      // Act & Assert
      await expect(
        authService.updateUser(user._id.toString(), {})
      ).rejects.toThrow('At least one field must be provided for update');
    });
  });
});
