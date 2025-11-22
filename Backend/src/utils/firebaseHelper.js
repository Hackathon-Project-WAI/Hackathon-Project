const firebaseClient = require("../integrations/firebaseClient");

/**
 * Đọc dữ liệu từ Firebase Realtime Database
 */
async function readFirebaseData(path) {
  return await firebaseClient.readData(path);
}

/**
 * Ghi dữ liệu vào Firebase Realtime Database
 */
async function writeFirebaseData(path, data) {
  return await firebaseClient.writeData(path, data);
}

module.exports = {
  readFirebaseData,
  writeFirebaseData,
};
