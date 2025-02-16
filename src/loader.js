const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

function loadEnv(envFilePath = ".env") {
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  }

  return process.env;
}

module.exports = { loadEnv };
