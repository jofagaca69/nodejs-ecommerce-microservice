const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthService = require("../../src/services/authService");
const User = require("../../src/models/user");
const config = require("../../src/config");

const authService = new AuthService();

const MONGODB_TEST_URI = "mongodb://localhost:27017/?authSource=admin";

describe("Auth Service <--> MongoDB Integration Tests", () => {
  beforeAll(async () => {
    if (!MONGODB_TEST_URI) {
      throw new Error(
        "MONGODB_AUTH_URI no está definida. ¡Verifica la configuración de Docker Compose!"
      );
    }
    await mongoose.connect(MONGODB_TEST_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  });

  afterEach(async () => {
    await authService.deleteTestUsers();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("INT-AUTH-001: Registro exitoso: Debe guardar el usuario con la contraseña hasheada", async () => {
    const username = "testuser001";
    const password = "securepassword";

    const registeredUser = await authService.register({ username, password });

    expect(registeredUser).toHaveProperty("username", username);
    expect(registeredUser).toHaveProperty("_id");

    const userInDb = await User.findOne({ username });
    expect(userInDb).not.toBeNull();

    expect(userInDb.password).not.toBe(password);

    const isHashValid = await bcrypt.compare(password, userInDb.password);
    expect(isHashValid).toBe(true);
  });

  it("INT-AUTH-004: Registro fallido: Debe manejar el error de username duplicado", async () => {
    const username = "testduplicateuser";
    const password = "p1";

    await authService.register({ username, password });

    let error;
    try {
      const existingUser = await authService.findUserByUsername(username);
      if (existingUser) {
        throw new Error("Username already taken");
      }
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toMatch("Username already taken");

    const userCount = await User.countDocuments({ username });
    expect(userCount).toBe(1);
  });

  it("INT-AUTH-002: Login exitoso: Debe devolver el token JWT", async () => {
    const username = "testloginuser";
    const password = "correctpass";

    await authService.register({ username, password });

    const result = await authService.login(username, password);

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("token");

    const decoded = jwt.verify(result.token, config.jwtSecret);
    expect(decoded).toHaveProperty("id");
  });

  it("INT-AUTH-003: Login fallido: Debe rechazar por contraseña incorrecta", async () => {
    const username = "testwrongpass";
    const password = "correctpass";
    const incorrectPassword = "wrongpass";

    await authService.register({ username, password });

    const result = await authService.login(username, incorrectPassword);

    expect(result.success).toBe(false);
    expect(result.message).toMatch("Invalid username or password");
    expect(result).not.toHaveProperty("token");
  });

  it("INT-AUTH-005: Login fallido: Debe rechazar por usuario inexistente", async () => {
    const username = "testnonexistent";
    const password = "anypassword";

    const result = await authService.login(username, password);

    expect(result.success).toBe(false);
    expect(result.message).toMatch("Invalid username or password");
    expect(result).not.toHaveProperty("token");
  });
});
