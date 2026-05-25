import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAkz2l5aZlQUidqoybX2tOMr82qqFAlpw",
  authDomain: "daneri-boxing-analytics.firebaseapp.com",
  projectId: "daneri-boxing-analytics",
  storageBucket: "daneri-boxing-analytics.firebasestorage.app",
  messagingSenderId: "1066173224320",
  appId: "1:1066173224320:web:b34aa7d63172a38892dd65"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Forzar persistencia de sesión local (LocalStorage) en Electron/Navegador para evitar cierres de sesión
setPersistence(auth, browserLocalPersistence)
  .catch((err) => {
    console.error("[Firebase Auth] Error setting local persistence:", err);
  });

const dbFirestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Forzar al selector de cuentas de Google para dejar elegir la cuenta al iniciar sesión
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, dbFirestore, googleProvider };
