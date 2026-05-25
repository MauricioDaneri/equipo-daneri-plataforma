import { createContext, useContext, useState, useCallback } from 'react';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    titulo: '',
    mensaje: '',
    tipo: 'info', // 'peligro', 'info', 'advertencia', 'exito'
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const cerrarModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const mostrarConfirmacion = useCallback(({ 
    titulo, 
    mensaje, 
    tipo = 'advertencia',
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar' 
  }) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        titulo,
        mensaje,
        tipo,
        textoConfirmar,
        textoCancelar,
        onConfirm: () => {
          cerrarModal();
          resolve(true);
        },
        onCancel: () => {
          cerrarModal();
          resolve(false);
        }
      });
    });
  }, [cerrarModal]);

  const mostrarAlerta = useCallback(({ 
    titulo, 
    mensaje, 
    tipo = 'info',
    textoConfirmar = 'Aceptar'
  }) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        titulo,
        mensaje,
        tipo,
        textoConfirmar,
        textoCancelar: '', // No se usa en info
        onConfirm: () => {
          cerrarModal();
          resolve(true);
        },
        onCancel: () => {
          cerrarModal();
          resolve(true); // En alerta, cancelar y aceptar hacen lo mismo (cerrar)
        }
      });
    });
  }, [cerrarModal]);

  return (
    <ModalContext.Provider value={{ mostrarConfirmacion, mostrarAlerta }}>
      {children}
      <ModalConfirmacion 
        {...modalConfig}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe usarse dentro de un ModalProvider');
  }
  return context;
}
