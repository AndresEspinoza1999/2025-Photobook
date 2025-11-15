/**
 * Placeholder Firebase Functions for the SC9 Photo Book uploader.
 * Replace the thrown errors with real Firebase Storage + Firestore logic
 * once the backend contract is defined.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.generateUploadUrl = functions.https.onCall(async (data, context) => {
  throw new functions.https.HttpsError(
    'unimplemented',
    'Firebase upload ticket generation is not available yet. Implement generateUploadUrl before enabling uploads.'
  );
});

exports.confirmUpload = functions.https.onCall(async (data, context) => {
  throw new functions.https.HttpsError(
    'unimplemented',
    'Firebase upload confirmation is not available yet. Implement confirmUpload before enabling uploads.'
  );
});
