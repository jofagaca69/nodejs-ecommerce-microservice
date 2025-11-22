require("dotenv").config();

module.exports = {
  mongoURI: process.env.MONGODB_AUTH_URI || "mongodb://mongodb-auth:27017/auth",
  jwtSecret: process.env.JWT_SECRET || "secret",
};
