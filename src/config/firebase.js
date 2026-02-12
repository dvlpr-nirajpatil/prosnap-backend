const admin = require("firebase-admin");

const serviceAccount = require("../private/firebase_private_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
