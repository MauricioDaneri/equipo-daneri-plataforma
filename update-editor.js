const fs = require('fs');

let content = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');

if (!content.includes('useModal')) {
  content = content.replace(
    'import { db } from \'../servicios/db\'',
    'import { db } from \'../servicios/db\'\nimport { useModal } from \'../context/ModalContext\''
  );
}

if (!content.includes('const { mostrarConfirmacion, mostrarAlerta } = useModal()')) {
  content = content.replace(
    'export default function EditorTactico() {',
    'export default function EditorTactico() {\n  const { mostrarConfirmacion, mostrarAlerta } = useModal()'
  );
}

// 1. obtenerVeredictoEinstein
content = content.replace(
  '      alert(\n        "Registra al menos algunos eventos en la línea de tiempo antes de consultar el veredicto.",\n      );',
  '      mostrarAlerta({ titulo: "Faltan Eventos", mensaje: "Registra al menos algunos eventos en la línea de tiempo antes de consultar el veredicto.", tipo: "advertencia" });'
);

// 2. iniciarBarridoIA (3 alerts and 1 confirm)
content = content.replace(
  'alert("Carga un video para poder iniciar el barrido con IA.");',
  'mostrarAlerta({ titulo: "Falta Video", mensaje: "Carga un video para poder iniciar el barrido con IA.", tipo: "advertencia" });'
);

content = content.replace(
  'alert("La duración del video no es válida.");',
  'mostrarAlerta({ titulo: "Error de Video", mensaje: "La duración del video no es válida.", tipo: "peligro" });'
);

content = content.replace(
  '    const confirm = window.confirm(\n      `¿Iniciar barrido automático del video completo? Esto procesará el video cada ${stepBarrido} segundos y etiquetará automáticamente los golpes usando el modelo local \'${ollamaModelo}\'. Puede tomar varios minutos.`,\n    );\n    if (!confirm) return;',
  '    const confirmado = await mostrarConfirmacion({\n      titulo: "Iniciar Barrido Automático",\n      mensaje: `¿Iniciar barrido automático del video completo? Esto procesará el video cada ${stepBarrido} segundos y etiquetará automáticamente los golpes usando el modelo local \'${ollamaModelo}\'. Puede tomar varios minutos.`,\n      textoConfirmar: "Iniciar",\n      tipo: "info"\n    });\n    if (!confirmado) return;'
);

// 3. end of sweep
content = content.replace(
  'alert("¡El barrido automático de video con IA local ha finalizado!");',
  'mostrarAlerta({ titulo: "Barrido Finalizado", mensaje: "¡El barrido automático de video con IA local ha finalizado con éxito!", tipo: "exito" });'
);

// 4. exportarDataset (2 alerts)
content = content.replace(
  'alert("Carga un video para poder exportar el dataset.");',
  'mostrarAlerta({ titulo: "Falta Video", mensaje: "Carga un video para poder exportar el dataset.", tipo: "advertencia" });'
);

content = content.replace(
  '      alert(\n        "No hay golpes etiquetados con coordenadas en el mapa de calor para exportar. Registra impactos en la pestaña \'Mapa de Calor\' primero.",\n      );',
  '      mostrarAlerta({\n        titulo: "Sin Coordenadas",\n        mensaje: "No hay golpes etiquetados con coordenadas en el mapa de calor para exportar. Registra impactos en la pestaña \'Mapa de Calor\' primero.",\n        tipo: "advertencia"\n      });'
);

// 5. end of export
content = content.replace(
  '    alert(\n      `¡Dataset de entrenamiento generado exitosamente con ${snapshots.length} capturas etiquetadas!`,\n    );',
  '    mostrarAlerta({\n      titulo: "Dataset Generado",\n      mensaje: `¡Dataset de entrenamiento generado exitosamente con ${snapshots.length} capturas etiquetadas!`,\n      tipo: "exito"\n    });'
);

// Save back
fs.writeFileSync('src/vistas/EditorTactico.jsx', content);
console.log('EditorTactico.jsx updated');
