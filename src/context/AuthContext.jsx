import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, dbFirestore } from '../servicios/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null); // 'admin', 'analista', 'tecnico', 'boxeador'
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        
        try {
          // Consultar el rol en Firestore
          const userRef = doc(dbFirestore, 'usuarios', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setRol(userSnap.data().rol);
          } else {
            // Si no existe, crear el perfil base.
            // Si es el email del desarrollador, darle admin directo.
            const esDeveloper = user.email === 'mauriciodaneriok@gmail.com';
            const nuevoRol = esDeveloper ? 'admin' : 'boxeador';
            
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              rol: nuevoRol,
              createdAt: new Date().toISOString()
            });
            setRol(nuevoRol);
          }
        } catch (error) {
          console.error("Error obteniendo rol:", error);
          setRol('boxeador'); // Fallback seguro
        }
      } else {
        setUsuario(null);
        setRol(null);
      }
      setCargandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, rol, cargandoAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
