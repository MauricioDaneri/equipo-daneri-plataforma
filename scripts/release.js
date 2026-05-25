const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cargar variables de entorno del archivo .env de forma manual (sin dependencias)
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        const val = trimmed.substring(index + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "MauricioDaneri";
const REPO = "equipo-daneri-plataforma";

if (!TOKEN) {
  console.error("❌ Error: GITHUB_TOKEN no está definido en el archivo .env");
  process.exit(1);
}

// Helper para hacer llamadas HTTP a la API de GitHub
async function githubRequest(method, endpoint, body = null, headers = {}) {
  const url = `https://api.github.com${endpoint}`;
  const defaultHeaders = {
    "Authorization": `token ${TOKEN}`,
    "User-Agent": "Equipo-Daneri-Release-Script",
    "Accept": "application/vnd.github.v3+json",
    ...headers
  };

  const options = {
    method,
    headers: defaultHeaders,
  };

  if (body) {
    if (body instanceof Buffer) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API Error (${response.status}) on ${endpoint}: ${text}`);
  }
  return response.json();
}

async function main() {
  console.log("🚀 Iniciando proceso de automatización de Release...");

  // 1. Obtener versión de package.json
  const pkgPath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;
  const tag = `v${version}`;
  console.log(`📦 Versión detectada: ${version} (Tag: ${tag})`);

  // 2. Ejecutar Git commit por cualquier cambio y empujar rama
  try {
    console.log("📤 Guardando cualquier cambio restante en Git...");
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore(release): release ${tag}"`, { stdio: 'ignore' }); // Ignora si no hay cambios
  } catch (e) {
    // Si no hay nada para commitear, Git da exit code 1. Es normal.
  }

  console.log("📤 Empujando commits a GitHub...");
  execSync('git push origin main', { stdio: 'inherit' });

  // 3. Crear y empujar el tag local
  console.log(`🏷️ Creando tag Git local: ${tag}...`);
  try {
    execSync(`git tag -d ${tag}`, { stdio: 'ignore' }); // Eliminar tag anterior si existiera localmente
  } catch (e) {}
  execSync(`git tag ${tag}`, { stdio: 'inherit' });

  console.log("📤 Empujando tag a GitHub...");
  try {
    execSync(`git push origin :refs/tags/${tag}`, { stdio: 'ignore' }); // Eliminar tag en GitHub si existiera
  } catch (e) {}
  execSync(`git push origin ${tag}`, { stdio: 'inherit' });

  // 4. Compilar instaladores en producción
  console.log("⚙️ Compilando instaladores nativos en producción...");
  execSync('npm run build && electron-builder', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // 5. Crear el Release en GitHub
  console.log(`✨ Creando Release en GitHub: ${tag}...`);
  const releaseData = await githubRequest("POST", `/repos/${OWNER}/${REPO}/releases`, {
    tag_name: tag,
    target_commitish: "main",
    name: tag,
    body: `Release automático de la Plataforma de Análisis del Equipo Daneri versión ${tag}.\n\n* Base de datos local versión 4 optimizada.\n* Soporte para F12 DevTools.\n* Sincronización en la nube lista.\n* Portabilidad táctica de showfiles (.daneri) integrada.`,
    draft: false,
    prerelease: false
  });

  const releaseId = releaseData.id;
  const uploadUrl = releaseData.upload_url.split('{')[0]; // URL para subir assets
  console.log(`✅ Release creado con ID: ${releaseId}`);

  // 6. Subir los archivos compilados a la versión de GitHub
  const assetsFolder = "E:\\INSTALADORES";
  const filesToUpload = [
    { name: `equipo-daneri-plataforma-setup-${version}.exe`, contentType: "application/octet-stream" },
    { name: `equipo-daneri-plataforma-setup-${version}.exe.blockmap`, contentType: "application/octet-stream" },
    { name: "latest.yml", contentType: "text/yaml" }
  ];

  for (const file of filesToUpload) {
    const filePath = path.join(assetsFolder, file.name);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: No se encontró el archivo compilado: ${filePath}`);
      continue;
    }

    console.log(`📤 Subiendo asset: ${file.name}...`);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Subida mediante API de assets de GitHub (se hace a uploads.github.com)
    const assetUrl = `${uploadUrl}?name=${encodeURIComponent(file.name)}`;
    const response = await fetch(assetUrl, {
      method: "POST",
      headers: {
        "Authorization": `token ${TOKEN}`,
        "User-Agent": "Equipo-Daneri-Release-Script",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": file.contentType,
        "Content-Length": fileBuffer.length
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Error subiendo ${file.name}:`, errText);
    } else {
      console.log(`✅ Asset subido con éxito: ${file.name}`);
    }
  }

  console.log(`\n🎉 ¡RELEASE ${tag} COMPLETADO CON ÉXITO! 🎉`);
  console.log(`Los analistas recibirán la notificación de actualización automática de inmediato al abrir la aplicación.`);
}

main().catch(err => {
  console.error("❌ Error fatal en el proceso de release:", err);
  process.exit(1);
});
