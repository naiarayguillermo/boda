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

// Requerir PIN/contraseña para entrar en dashboard.html (false = acceso directo)
const REQUIRE_AUTH = false;

// Nombre de la colección en Firestore donde se guardan los invitados
const FIRESTORE_COLLECTION = "confirmaciones_boda";

if (typeof window !== "undefined") {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.ENABLE_FIREBASE = ENABLE_FIREBASE;
  window.REQUIRE_AUTH = REQUIRE_AUTH;
  window.FIRESTORE_COLLECTION = FIRESTORE_COLLECTION;
}
