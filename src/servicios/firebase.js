import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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
const dbFirestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, dbFirestore, googleProvider };
