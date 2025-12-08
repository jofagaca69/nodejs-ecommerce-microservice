const axios = require("axios");

const gatewayUrl = "http://localhost:3003";

describe("Gateway <--> Auth microservice integration", () => {

  beforeEach(async () => {
    await axios.post(`${gatewayUrl}/auth/delete-test-users`);
  });

  afterEach(async () => {
    await axios.post(`${gatewayUrl}/auth/delete-test-users`);
  });

  it("Registro exitoso: Debe devolver la información del usuario registrado", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    const response = await axios.post(`${gatewayUrl}/auth/register`, user);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("username", "testuser");
  });

  it("Registro fallido: username ya existe", async () => {
    const user = {
      username: "testuser",
      password: "password123"
    };
  
    await axios.post(`${gatewayUrl}/auth/register`, user);
  
    const err = await axios
      .post(`${gatewayUrl}/auth/register`, user)
      .catch(e => e);
  
    expect(err.response.status).toBe(400);
    expect(err.response.data).toHaveProperty("message", "Username already taken");
  });

  it("Login exitoso: Debe devolver el token de autenticación", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    await axios.post(`${gatewayUrl}/auth/register`, user);

    const response = await axios.post(`${gatewayUrl}/auth/login`, user);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("token");
  });

  it("Login erroneo: Debe devolver mensaje de error", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };
  
    const userIncorrect = {
      username: "prueba",
      password: "contra"
    };
  
    await axios.post(`${gatewayUrl}/auth/register`, user);
  
    const err = await axios.post(`${gatewayUrl}/auth/login`, userIncorrect)
      .catch(e => e);
  
    expect(err.response.status).toBe(400);
    expect(err.response.data).toHaveProperty("message", "Invalid username or password");
  
  });
  

  it("Autenticación exitosa con token", async () => {

    const user = {
      username: "testuser",
      password: "password123"
    };

    await axios.post(`${gatewayUrl}/auth/register`, user);

    const responseLogin = await axios.post(`${gatewayUrl}/auth/login`, user);
    const token = responseLogin.data.token;

    const response = await axios.get(`${gatewayUrl}/auth/dashboard`, {
      headers: { "x-auth-token": token }
    });

    expect(response.status).toBe(200);
  });

});
