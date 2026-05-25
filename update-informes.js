const fs = require('fs');

// Informes.jsx
let informes = fs.readFileSync('src/vistas/Informes.jsx', 'utf8');
if (!informes.includes('useModal')) {
  informes = informes.replace(
    'import { db } from \'../servicios/db\'',
    'import { db } from \'../servicios/db\'\nimport { useModal } from \'../context/ModalContext\''
  );
}
if (!informes.includes('const { mostrarConfirmacion } = useModal()')) {
  informes = informes.replace(
    'export default function Informes() {\n  const navigate = useNavigate()',
    'export default function Informes() {\n  const navigate = useNavigate()\n  const { mostrarConfirmacion } = useModal()'
  );
}
informes = informes.replace(
  'if (window.confirm(\'¿Estás seguro de eliminar este informe y todo su registro de eventos? Esta acción no se puede deshacer.\')) {',
  'const confirmado = await mostrarConfirmacion({ titulo: "Eliminar Informe", mensaje: "¿Estás seguro de eliminar este informe y todo su registro de eventos?\\nEsta acción no se puede deshacer.", textoConfirmar: "Eliminar", tipo: "peligro" });\n    if (confirmado) {'
);
fs.writeFileSync('src/vistas/Informes.jsx', informes);
console.log('Informes.jsx updated');


// PerfilBoxeador.jsx
let perfil = fs.readFileSync('src/vistas/PerfilBoxeador.jsx', 'utf8');
if (!perfil.includes('useModal')) {
  perfil = perfil.replace(
    'import ModalBoxeador from \'../components/ui/ModalBoxeador\'',
    'import ModalBoxeador from \'../components/ui/ModalBoxeador\'\nimport { useModal } from \'../context/ModalContext\''
  );
}
if (!perfil.includes('const { mostrarAlerta } = useModal()')) {
  perfil = perfil.replace(
    'export default function PerfilBoxeador() {',
    'export default function PerfilBoxeador() {\n  const { mostrarAlerta } = useModal()'
  );
}
perfil = perfil.replace(
  'if (!ollamaDisponible) return alert("Ollama no está disponible.")',
  'if (!ollamaDisponible) return mostrarAlerta({ titulo: "Servicio no disponible", mensaje: "Ollama no está disponible o no está respondiendo en localhost:11434.", tipo: "peligro" })'
);
perfil = perfil.replace(
  'alert("Error al contactar con Ollama.")',
  'mostrarAlerta({ titulo: "Error de IA", mensaje: "Error al contactar con el Asistente IA (Ollama).", tipo: "peligro" })'
);
fs.writeFileSync('src/vistas/PerfilBoxeador.jsx', perfil);
console.log('PerfilBoxeador.jsx updated');
