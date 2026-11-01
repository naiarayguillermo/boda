/**
 * ===================================================================
 * CONFIGURACIÓN DE FIREBASE PARA CONFIRMACIONES & DASHBOARD
 * Proyecto: boda-3be54
 * ===================================================================
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBuSGBLIq3ZPcG16BzMd5yikuYfPIQONqc",
  authDomain: "boda-3be54.firebaseapp.com",
  projectId: "boda-3be54",
  storageBucket: "boda-3be54.firebasestorage.app",
  messagingSenderId: "795045687285",
  appId: "1:795045687285:web:b47bdba427b856cef1fabc",
  measurementId: "G-NY42PPNJ4X"
};

// Sincronización activada con Firebase
const ENABLE_FIREBASE = true;

// Requerir Firebase Auth para entrar en /dashboard/
const REQUIRE_AUTH = true;

// Firebase Auth sigue usando email internamente, pero la interfaz solo pide usuario.
const ADMIN_USERNAME = "naiarayguillermo";
const ADMIN_AUTH_EMAIL = `${ADMIN_USERNAME}@boda.es`;
const ALLOWED_USER_UID = "O8pC4aNgKFQ6P9pm4uiSdSDec3U2";

// Nombre de la colección en Firestore donde se guardan los invitados
const FIRESTORE_COLLECTION = "confirmaciones_boda";

if (typeof window !== "undefined") {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.ENABLE_FIREBASE = ENABLE_FIREBASE;
  window.REQUIRE_AUTH = REQUIRE_AUTH;
  window.ADMIN_USERNAME = ADMIN_USERNAME;
  window.ADMIN_AUTH_EMAIL = ADMIN_AUTH_EMAIL;
  window.ALLOWED_USER_UID = ALLOWED_USER_UID;
  window.FIRESTORE_COLLECTION = FIRESTORE_COLLECTION;
}
