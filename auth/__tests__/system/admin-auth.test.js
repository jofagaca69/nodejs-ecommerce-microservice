const mongoose = require("mongoose");
const AuthService = require("../../src/services/authService");
const User = require("../../src/models/user");
const jwt = require("jsonwebtoken");
const config = require("../../src/config");

const authService = new AuthService();

const MONGODB_TEST_URI = process.env.MONGODB_AUTH_URI || "mongodb://localhost:27017/?authSource=admin";

describe("Admin Authentication System Tests", () => {
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
    await User.deleteMany({ username: /^sys_test/ });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("ADMIN-AUTH-SYS-001: Complete admin login flow should generate valid JWT with role", async () => {
    // Arrange: Create admin user
    const adminUser = await authService.register({
      username: "sys_test_admin",
      password: "admin123",
      role: "admin"
    });

    // Act: Login as admin
    const result = await authService.login("sys_test_admin", "admin123", "admin");

    // Assert: Token is valid and contains role
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();

    // Verify token structure
    const decoded = jwt.verify(result.token, config.jwtSecret);
    expect(decoded.id).toBe(adminUser._id.toString());
    expect(decoded.username).toBe("sys_test_admin");
    expect(decoded.role).toBe("admin");
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it("ADMIN-AUTH-SYS-002: User with role 'user' cannot login with requireRole 'admin'", async () => {
    // Arrange: Create regular user
    await authService.register({
      username: "sys_test_user",
      password: "user123",
      role: "user"
    });

    // Act: Try admin login
    const result = await authService.login("sys_test_user", "user123", "admin");

    // Assert: Should be rejected
    expect(result.success).toBe(false);
    expect(result.message).toContain("admin permissions");
    expect(result.userRole).toBe("user");
  });

  it("ADMIN-AUTH-SYS-003: Token generated includes role even when requireRole is not specified", async () => {
    // Arrange: Create user with any role
    const user = await authService.register({
      username: "sys_test_any",
      password: "pass123",
      role: "employee"
    });

    // Act: Login without requireRole
    const result = await authService.login("sys_test_any", "pass123");

    // Assert: Token should include role
    expect(result.success).toBe(true);
    const decoded = jwt.decode(result.token);
    expect(decoded.role).toBe("employee");
  });

  it("ADMIN-AUTH-SYS-004: User without role defined should default to 'user' and be rejected for admin login", async () => {
    // Arrange: Create user without explicit role (should default to 'user')
    const user = await User.create({
      username: "sys_test_default",
      password: "$2a$10$dummyhash", // Dummy hash, we'll use authService for actual creation
    });
    // Actually use authService to ensure proper password hashing
    await user.deleteOne();
    await authService.register({
      username: "sys_test_default",
      password: "pass123"
      // role not specified, should default to 'user'
    });

    // Act: Try admin login
    const result = await authService.login("sys_test_default", "pass123", "admin");

    // Assert: Should be rejected
    expect(result.success).toBe(false);
    expect(result.userRole).toBe("user");
  });
});
