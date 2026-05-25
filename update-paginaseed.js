const fs = require('fs');
let content = fs.readFileSync('src/vistas/PaginaSeed.jsx', 'utf8');

if (!content.includes('useModal')) {
  content = content.replace(
    'import { useNavigate } from \'react-router-dom\'',
    'import { useNavigate } from \'react-router-dom\'\nimport { useModal } from \'../context/ModalContext\''
  );
}

if (!content.includes('const { mostrarConfirmacion, mostrarAlerta } = useModal()')) {
  content = content.replace(
    'export default function PaginaSeed() {',
    'export default function PaginaSeed() {\n  const { mostrarConfirmacion, mostrarAlerta } = useModal()'
  );
}

content = content.replace(
  'if (!window.confirm(\'¿Eliminar el seed de Iván Danele vs Leveti? Se borrarán los perfiles, la sesión y todos los eventos.\')) return',
  'const confirmado = await mostrarConfirmacion({ titulo: "Limpiar Seed", mensaje: "¿Eliminar el seed de Iván Danele vs Leveti? Se borrarán los perfiles, la sesión y todos los eventos.", textoConfirmar: "Limpiar", tipo: "peligro" });\n    if (!confirmado) return;'
);

content = content.replace(
  'if (!ivan) { alert(\'Primero carga los datos del seed.\'); return }',
  'if (!ivan) { mostrarAlerta({ titulo: "Faltan Datos", mensaje: "Primero carga los datos del seed.", tipo: "advertencia" }); return }'
);

content = content.replace(
  'if (!sesion) { alert(\'Sesión no encontrada.\'); return }',
  'if (!sesion) { mostrarAlerta({ titulo: "Error", mensaje: "Sesión no encontrada.", tipo: "peligro" }); return }'
);

fs.writeFileSync('src/vistas/PaginaSeed.jsx', content);
console.log('PaginaSeed.jsx updated');
