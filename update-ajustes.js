const fs = require('fs');
let content = fs.readFileSync('src/vistas/Ajustes.jsx', 'utf8');

if (!content.includes('useModal')) {
  content = content.replace(
    'import { db } from \'../servicios/db\'',
    'import { db } from \'../servicios/db\'\nimport { useModal } from \'../context/ModalContext\''
  );
}

if (!content.includes('const { mostrarConfirmacion, mostrarAlerta } = useModal()')) {
  content = content.replace(
    'const [config, setConfig] = useState({',
    'const { mostrarConfirmacion, mostrarAlerta } = useModal()\n  const [config, setConfig] = useState({'
  );
}

content = content.replace(
  'alert(`La tecla [${formatearTecla(e.code)}] ya está en uso por otra acción.`)',
  'mostrarAlerta({ titulo: \'Atajo Ocupado\', mensaje: `La tecla [${formatearTecla(e.code)}] ya está en uso por otra acción.`, tipo: \'advertencia\' })'
);

content = content.replace(
  'const confirmacion = window.confirm("⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\\n\\n¿Estás absolutamente seguro de que quieres borrar TODOS los boxeadores, sesiones y análisis?\\nEsta acción NO se puede deshacer.")',
  'const confirmacion = await mostrarConfirmacion({ titulo: "Restablecer Base de Datos", mensaje: "¿Estás absolutamente seguro de que quieres borrar TODOS los boxeadores, sesiones y análisis?\\nEsta acción NO se puede deshacer.", textoConfirmar: "Sí, Borrar Todo", tipo: "peligro" })'
);

content = content.replace(
  'alert("Error al exportar la base de datos.")',
  'mostrarAlerta({ titulo: "Error al Exportar", mensaje: "Hubo un problema al exportar la base de datos.", tipo: "peligro" })'
);

content = content.replace(
  'if (!window.confirm("⚠️ ¿Estás seguro de que quieres importar este respaldo? Esto reemplazará y combinará los datos actuales con los del archivo.")) return',
  'const confirmado = await mostrarConfirmacion({ titulo: "Importar Respaldo", mensaje: "¿Estás seguro de que quieres importar este respaldo?\\nEsto reemplazará y combinará los datos actuales con los del archivo.", textoConfirmar: "Importar", tipo: "advertencia" });\n    if (!confirmado) return;'
);

content = content.replace(
  'alert("¡Base de datos restaurada exitosamente!")',
  'await mostrarAlerta({ titulo: "Restauración Exitosa", mensaje: "¡Base de datos restaurada exitosamente!", tipo: "exito" })'
);

content = content.replace(
  'alert("Error al procesar el archivo de respaldo. Asegúrate de elegir un archivo JSON válido.")',
  'mostrarAlerta({ titulo: "Error al Importar", mensaje: "Error al procesar el archivo de respaldo. Asegúrate de elegir un archivo JSON válido.", tipo: "peligro" })'
);

content = content.replace(
  'if (window.confirm("¿Limpiar todos los reportes de error de la base de datos?")) {',
  'const confirmado = await mostrarConfirmacion({ titulo: "Limpiar Logs", mensaje: "¿Limpiar todos los reportes de error de la base de datos?", textoConfirmar: "Limpiar", tipo: "advertencia" });\n    if (confirmado) {'
);

content = content.replace(
  'if (window.confirm(\'¿Eliminar este perfil de analista?\')) {',
  'const confirmado = await mostrarConfirmacion({ titulo: "Eliminar Analista", mensaje: "¿Seguro que deseas eliminar este perfil de analista?", textoConfirmar: "Eliminar", tipo: "peligro" });\n    if (confirmado) {'
);

fs.writeFileSync('src/vistas/Ajustes.jsx', content);
console.log('Ajustes.jsx updated successfully.');
