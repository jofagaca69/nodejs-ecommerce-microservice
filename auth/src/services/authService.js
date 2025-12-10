const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/userRepository");
const config = require("../config");
const User = require("../models/user");

/**
 * Class to hold the business logic for the auth service interacting with the user repository
 */
class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async findUserByUsername(username) {
    const user = await User.findOne({ username });
    return user;
  }

  async login(username, password, requireRole = null) {
    const user = await this.userRepository.getUserByUsername(username);

    if (!user) {
      return { success: false, message: "Invalid username or password" };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { success: false, message: "Invalid username or password" };
    }

    // Validate role if requireRole is specified
    if (requireRole) {
      const userRole = user.role || 'user';
      if (userRole !== requireRole && userRole !== 'admin' && requireRole === 'employee') {
        // Allow employees to use 'admin' requireRole, but not vice versa
        // Actually, if requireRole is 'employee', only 'employee' or 'admin' should pass
        // If requireRole is 'admin', only 'admin' should pass
        if (requireRole === 'admin' && userRole !== 'admin') {
          return { 
            success: false, 
            message: "User does not have admin permissions",
            userRole: userRole
          };
        }
        if (requireRole === 'employee' && userRole !== 'employee' && userRole !== 'admin') {
          return { 
            success: false, 
            message: "User does not have employee permissions",
            userRole: userRole
          };
        }
      }
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role || 'user' }, config.jwtSecret);

    return { success: true, token };
  }

  async register(user) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    return await this.userRepository.createUser(user);
  }

  async deleteTestUsers() {
    // Delete all users with a username that starts with "test"
    await User.deleteMany({ username: /^test/ });
  }

  async getAllUsers() {
    const users = await User.find().select('-password');
    return users;
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    return user;
  }

  async updateUser(userId, updateData) {
    // No permitir actualizar la contraseña directamente
    const { password, ...safeUpdateData } = updateData;
    
    // Validate phone number format if provided
    if (safeUpdateData.phone !== undefined && safeUpdateData.phone !== null && safeUpdateData.phone !== '') {
      const phoneRegex = /^[0-9]{8,15}$/;
      if (!phoneRegex.test(safeUpdateData.phone)) {
        throw new Error('Phone number must be 8-15 digits');
      }
    }
    
    // Validate name length if provided
    if (safeUpdateData.name !== undefined && safeUpdateData.name !== null) {
      if (safeUpdateData.name.length > 100) {
        throw new Error('Name must be 100 characters or less');
      }
    }
    
    // Validate address length if provided
    if (safeUpdateData.address !== undefined && safeUpdateData.address !== null) {
      if (safeUpdateData.address.length > 500) {
        throw new Error('Address must be 500 characters or less');
      }
    }
    
    // Ensure at least one field is being updated
    if (Object.keys(safeUpdateData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    return user;
  }
}

module.exports = AuthService;
