const AuthService = require("../services/authService");

/**
 * Class to encapsulate the logic for the auth routes
 */

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res) {
    const { username, password } = req.body;

    const result = await this.authService.login(username, password);

    if (result.success) {
      res.json({ token: result.token });
    } else {
      res.status(400).json({ message: result.message });
    }
  }

  async register(req, res) {
    const user = req.body;
  
    try {
      const existingUser = await this.authService.findUserByUsername(user.username);
  
      if (existingUser) {
        console.log("Username already taken")
        throw new Error("Username already taken");
      }
  
      const result = await this.authService.register(user);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async getProfile(req, res) {
    const userId = req.user.id;

    try {
      const user = await this.authService.getUserById(userId);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async deleteTestUsers(req, res) {
    try {
      await this.authService.deleteTestUsers();
      res.status(200).json({ message: "Test users deleted" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // Obtener todos los usuarios
  async getAllUsers(req, res) {
    try {
      const users = await this.authService.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // Obtener usuario por ID
  async getUserById(req, res) {
    try {
      const user = await this.authService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // Actualizar usuario
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedUser = await this.authService.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json(updatedUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // Eliminar usuario
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.authService.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AuthController;
