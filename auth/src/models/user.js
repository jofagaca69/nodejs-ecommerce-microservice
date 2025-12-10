const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    maxlength: 100
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        // Phone validation: 8-15 digits only
        return !v || /^[0-9]{8,15}$/.test(v);
      },
      message: 'Phone number must be 8-15 digits'
    }
  },
  address: {
    type: String,
    maxlength: 500
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'employee'],
    default: 'user'
  }
});

// Index for phone lookup
UserSchema.index({ phone: 1 });

module.exports = mongoose.model("User", UserSchema);