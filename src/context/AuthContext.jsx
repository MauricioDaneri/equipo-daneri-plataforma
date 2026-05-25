import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, dbFirestore } from '../servicios/firebase';

const AuthContext = createContext();

// Emails que reciben rol de admin automáticamente al registrarse
const EMAILS_ADMIN = [
  'mauriciodaneriok@gmail.com',
  'admin@equipodaneri.com',
];

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null); // 'admin', 'analista', 'tecnico', 'boxeador'
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);

        try {
          // Consultar el perfil del usuario en Firestore
          const userRef = doc(dbFirestore, 'usuarios', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // Usuario ya registrado — cargar su rol
            const datos = userSnap.data();
            setRol(datos.rol);
            setPerfilUsuario(datos);
          } else {
            // ✅ PRIMER LOGIN: Auto-registrar al usuario
            // Si el email está en la lista de admins, darle ese rol
            const esAdmin = EMAILS_ADMIN.includes(user.email?.toLowerCase());
            const nuevoRol = esAdmin ? 'admin' : 'boxeador';

            const nuevoPerfil = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
              photoURL: user.photoURL || null,
              rol: nuevoRol,
              createdAt: new Date().toISOString(),
              proveedor: user.providerData?.[0]?.providerId || 'unknown',
            };

            await setDoc(userRef, nuevoPerfil);
            console.log(`[Auth] Nuevo usuario registrado: ${user.email} → rol: ${nuevoRol}`);

            setRol(nuevoRol);
            setPerfilUsuario(nuevoPerfil);
          }
        } catch (error) {
          console.error('[Auth] Error al gestionar perfil de usuario:', error);
          // Fallback: si Firestore falla, permitir acceso básico
          setRol('boxeador');
          setPerfilUsuario({ email: user.email, displayName: user.displayName, rol: 'boxeador' });
        }
      } else {
        setUsuario(null);
        setRol(null);
        setPerfilUsuario(null);
      }
      setCargandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, rol, perfilUsuario, cargandoAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
