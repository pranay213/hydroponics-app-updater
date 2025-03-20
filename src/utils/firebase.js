// firebase.js
const admin = require('firebase-admin');
const { serviceAccount } = require('./constants');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'expo-updates-194bc.appspot.com',
});

const bucket = admin.storage().bucket();

module.exports = { bucket };
