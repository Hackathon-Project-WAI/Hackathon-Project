/**
 * Main exports for Backend modules
 * Use this file to import modules from outside Backend folder
 */

// Email Service
const emailService = require("./src/email/emailService");
const EmailTemplates = require("./src/email/templates");

// Integrations
const firebaseClient = require("./src/integrations/firebaseClient");
const geminiClient = require("./src/integrations/geminiClient");
const openWeatherClient = require("./src/integrations/openWeatherClient");

// Services
const weatherService = require("./src/services/weatherService");
const floodPredictionService = require("./src/services/floodPredictionService");
const personalizedAlertService = require("./src/services/personalizedAlertService");

// Configs
const config = require("./src/configs");

module.exports = {
  // Email
  emailService,
  EmailTemplates,

  // Integrations
  firebaseClient,
  geminiClient,
  openWeatherClient,

  // Services
  weatherService,
  floodPredictionService,
  personalizedAlertService,

  // Config
  config,
};
