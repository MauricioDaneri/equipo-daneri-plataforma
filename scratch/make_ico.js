const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function main() {
  const sourcePath = path.join(__dirname, '../public/assets/logo-small.png');
  const destPath = path.join(__dirname, '../public/assets/icon.ico');

  console.log(`[ICO Maker] Cargando imagen desde: ${sourcePath}`);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: No se encontró la imagen de origen.`);
    return;
  }

  // Cargar imagen
  const img = await loadImage(sourcePath);
  
  // Crear canvas de 256x256
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  // Dibujar y redimensionar con alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, 256, 256);

  // Convertir canvas a buffer de PNG
  console.log(`[ICO Maker] Convirtiendo canvas a buffer de PNG...`);
  const pngBuffer = canvas.toBuffer('image/png');
  const pngSize = pngBuffer.length;

  // Crear cabecera ICO de 22 bytes
  // Header (6 bytes) + Directory Entry (16 bytes)
  const icoHeader = Buffer.alloc(22);
  
  // --- Header ---
  icoHeader.writeUInt16LE(0, 0);  // Reservado (0)
  icoHeader.writeUInt16LE(1, 2);  // Tipo (1 = Icon)
  icoHeader.writeUInt16LE(1, 4);  // Cantidad de imágenes (1)

  // --- Directory Entry ---
  icoHeader.writeUInt8(0, 6);     // Ancho 256 (representado por 0)
  icoHeader.writeUInt8(0, 7);     // Alto 256 (representado por 0)
  icoHeader.writeUInt8(0, 8);     // Paleta de colores (0 = no usado)
  icoHeader.writeUInt8(0, 9);     // Reservado (0)
  icoHeader.writeUInt16LE(1, 10); // Planos de color (1)
  icoHeader.writeUInt16LE(32, 12);// Bits por píxel (32)
  icoHeader.writeUInt32LE(pngSize, 14); // Tamaño del buffer PNG en bytes
  icoHeader.writeUInt32LE(22, 18); // Offset de la imagen (22 bytes)

  // Concatenar cabecera e imagen
  const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);

  // Guardar archivo
  fs.writeFileSync(destPath, icoBuffer);
  console.log(`[ICO Maker] ¡Icono creado exitosamente en: ${destPath} (Tamaño: ${icoBuffer.length} bytes)!`);
}

main().catch(err => {
  console.error('[ICO Maker] Error crítico:', err);
});
