const mongoose = require("mongoose");
const AuthService = require("../../src/services/authService");
const User = require("../../src/models/user");
const config = require("../../src/config");

const authService = new AuthService();

const MONGODB_TEST_URI = process.env.MONGODB_AUTH_URI || "mongodb://localhost:27017/?authSource=admin";

describe("Admin Login Integration Tests", () => {
  beforeAll(async () => {
    if (!MONGODB_TEST_URI) {
      throw new Error("MONGODB_AUTH_URI no está definida");
    }
    await mongoose.connect(MONGODB_TEST_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  });

  afterEach(async () => {
    await authService.deleteTestUsers();
    await User.deleteMany({ username: /^admin_test/ });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("ADMIN-LOGIN-INT-001: Admin login should succeed with valid admin credentials and requireRole", async () => {
    // Arrange: Create admin user
    const adminUser = await authService.register({
      username: "admin_test001",
      password: "admin123",
      role: "admin"
    });

    // Act: Login with requireRole
    const result = await authService.login("admin_test001", "admin123", "admin");

    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    
    // Verify token includes role
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(result.token);
    expect(decoded.role).toBe("admin");
  });

  it("ADMIN-LOGIN-INT-002: Admin login should reject user without admin role", async () => {
    // Arrange: Create regular user
    const regularUser = await authService.register({
      username: "admin_test002",
      password: "user123",
      role: "user"
    });

    // Act: Try to login as admin
    const result = await authService.login("admin_test002", "user123", "admin");

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain("admin permissions");
    expect(result.userRole).toBe("user");
  });

  it("ADMIN-LOGIN-INT-003: Employee login should succeed with requireRole employee", async () => {
    // Arrange: Create employee user
    const employeeUser = await authService.register({
      username: "admin_test003",
      password: "emp123",
      role: "employee"
    });

    // Act: Login with requireRole employee
    const result = await authService.login("admin_test003", "emp123", "employee");

    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(result.token);
    expect(decoded.role).toBe("employee");
  });

  it("ADMIN-LOGIN-INT-004: Admin can login with requireRole employee (admin has higher privileges)", async () => {
    // Arrange: Create admin user
    const adminUser = await authService.register({
      username: "admin_test004",
      password: "admin123",
      role: "admin"
    });

    // Act: Login with requireRole employee (admin should be allowed)
    const result = await authService.login("admin_test004", "admin123", "employee");

    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });

  it("ADMIN-LOGIN-INT-005: Login without requireRole should work normally (backward compatibility)", async () => {
    // Arrange: Create regular user
    const user = await authService.register({
      username: "admin_test005",
      password: "user123",
      role: "user"
    });

    // Act: Login without requireRole
    const result = await authService.login("admin_test005", "user123");

    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(result.token);
    expect(decoded.role).toBe("user");
  });

  it("ADMIN-LOGIN-INT-006: Invalid credentials should fail regardless of requireRole", async () => {
    // Arrange: Create admin user
    await authService.register({
      username: "admin_test006",
      password: "admin123",
      role: "admin"
    });

    // Act: Try to login with wrong password
    const result = await authService.login("admin_test006", "wrongpassword", "admin");

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid username or password");
    expect(result.userRole).toBeUndefined();
  });
});
