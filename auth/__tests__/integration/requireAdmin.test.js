const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const requireAdmin = require("../../src/middlewares/requireAdmin");
const AuthService = require("../../src/services/authService");
const User = require("../../src/models/user");
const config = require("../../src/config");

const authService = new AuthService();
const MONGODB_TEST_URI = process.env.MONGODB_AUTH_URI || "mongodb://localhost:27017/?authSource=admin";

describe("requireAdmin Middleware Integration Tests", () => {
  let mockReq, mockRes, mockNext;

  beforeAll(async () => {
    if (!MONGODB_TEST_URI) {
      throw new Error("MONGODB_AUTH_URI no está definida");
    }
    await mongoose.connect(MONGODB_TEST_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  });

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(async () => {
    await authService.deleteTestUsers();
    await User.deleteMany({ username: /^middleware_test/ });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("REQUIRE-ADMIN-INT-001: should allow access for admin role", async () => {
    // Arrange: Create admin user and get token
    const adminUser = await authService.register({
      username: "middleware_test_admin",
      password: "admin123",
      role: "admin"
    });

    const loginResult = await authService.login("middleware_test_admin", "admin123");
    const token = loginResult.token;

    mockReq.headers.authorization = `Bearer ${token}`;

    // Act
    requireAdmin(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.role).toBe("admin");
  });

  it("REQUIRE-ADMIN-INT-002: should allow access for employee role", async () => {
    // Arrange: Create employee user and get token
    const employeeUser = await authService.register({
      username: "middleware_test_emp",
      password: "emp123",
      role: "employee"
    });

    const loginResult = await authService.login("middleware_test_emp", "emp123");
    const token = loginResult.token;

    mockReq.headers.authorization = `Bearer ${token}`;

    // Act
    requireAdmin(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockReq.user.role).toBe("employee");
  });

  it("REQUIRE-ADMIN-INT-003: should reject access for user role", async () => {
    // Arrange: Create regular user and get token
    const regularUser = await authService.register({
      username: "middleware_test_user",
      password: "user123",
      role: "user"
    });

    const loginResult = await authService.login("middleware_test_user", "user123");
    const token = loginResult.token;

    mockReq.headers.authorization = `Bearer ${token}`;

    // Act
    requireAdmin(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Admin or employee role required"),
        userRole: "user"
      })
    );
  });

  it("REQUIRE-ADMIN-INT-004: should reject request without authorization header", () => {
    // Arrange: No authorization header
    mockReq.headers = {};

    // Act
    requireAdmin(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("REQUIRE-ADMIN-INT-005: should reject request with invalid token", () => {
    // Arrange: Invalid token
    mockReq.headers.authorization = "Bearer invalid-token";

    // Act
    requireAdmin(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Invalid or expired token")
      })
    );
  });

  it("REQUIRE-ADMIN-INT-006: should reject request with expired token", () => {
    // Arrange: Create expired token
    const expiredToken = jwt.sign(
      { id: "123", username: "test", role: "admin" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "-1h" } // Expired 1 hour ago
    );

    mockReq.headers.authorization = `Bearer ${expiredToken}`;

    // Act
    requireAdmin(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});
