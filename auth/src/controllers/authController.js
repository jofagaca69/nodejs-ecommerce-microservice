const AuthService = require("../services/authService");

/**
 * Class to encapsulate the logic for the auth routes
 */

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res) {
    const { username, password, requireRole } = req.body;

    // Log admin login attempts with structured logging
    if (requireRole) {
      console.log(`[Admin Login] Attempt - Username: ${username}, RequireRole: ${requireRole}, Timestamp: ${new Date().toISOString()}`);
    } else {
      console.log(`[User Login] Attempt - Username: ${username}, Timestamp: ${new Date().toISOString()}`);
    }

    const result = await this.authService.login(username, password, requireRole);

    if (result.success) {
      if (requireRole) {
        console.log(`[Admin Login] Success - Username: ${username}, Role: ${requireRole}, Timestamp: ${new Date().toISOString()}`);
      } else {
        console.log(`[User Login] Success - Username: ${username}, Timestamp: ${new Date().toISOString()}`);
      }
      res.json({ success: true, token: result.token });
    } else {
      // Return appropriate status code based on error type
      if (result.userRole && requireRole) {
        // User doesn't have required role
        console.log(`[Admin Login] Failed - Username: ${username}, RequiredRole: ${requireRole}, UserRole: ${result.userRole}, Timestamp: ${new Date().toISOString()}`);
        res.status(403).json({ 
          success: false,
          message: result.message,
          userRole: result.userRole
        });
      } else {
        // Invalid credentials
        console.log(`[Login] Failed - Invalid credentials for username: ${username}, Timestamp: ${new Date().toISOString()}`);
        res.status(401).json({ 
          success: false,
          message: result.message 
        });
      }
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
      
      // Log customer information update
      console.log(`[Customer Update] User ID: ${id}, Fields: ${Object.keys(updateData).join(', ')}`);
      
      const updatedUser = await this.authService.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      console.log(`[Customer Update] Success - User ID: ${id}`);
      res.json(updatedUser);
    } catch (err) {
      console.error(`[Customer Update] Error - User ID: ${req.params.id}, Error: ${err.message}`);
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
