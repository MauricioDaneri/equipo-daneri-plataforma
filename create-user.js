const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

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

async function run() {
  const email = "admin@equipodaneri.com";
  const password = "DaneriApp2026!";
  console.log(`Intentando crear usuario ${email}...`);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario creado con éxito. UID:", user.uid);
    
    // Crear el documento de usuario en Firestore con rol admin
    console.log("Creando documento de usuario en Firestore...");
    await setDoc(doc(dbFirestore, "usuarios", user.uid), {
      email: email,
      displayName: "Administrador Equipo Daneri",
      rol: "admin",
      createdAt: new Date().toISOString()
    });
    console.log("Documento en Firestore creado con éxito.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

run();
