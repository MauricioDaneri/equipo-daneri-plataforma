# CASO DE ESTUDIO: Plataforma de Análisis Táctico — Equipo Daneri
**Desarrollador Fullstack & Orquestador de IA:** Mauricio Daneri
**Tipo de Proyecto:** Aplicación de Escritorio Profesional (Electron + React + Firebase)
**Enlace de Demostración:** [Ver Video Demo en Carpeta]

---

## 1. Resumen Ejecutivo
El **Equipo Daneri** requería una herramienta de nivel profesional que digitalizara y automatizara el proceso de análisis táctico de peleas de boxeo. Los entrenadores solían tomar notas manuales e ineficientes. 

Diseñé y construí un MVP robusto y comercial en un tiempo récord de **una semana y media**, integrando tecnologías avanzadas como renderizado sobre video en tiempo real, sincronización automática sin conexión y **análisis automatizado con Inteligencia Artificial local**.

---

## 2. El Desafío Técnico
Para que la aplicación fuera útil en gimnasios y eventos de boxeo (donde la conectividad a internet suele ser inestable o nula), el sistema debía cumplir con tres condiciones críticas:
1. **Edición Táctica Fluida:** Permitir dibujar vectores y notas tácticas directamente sobre un reproductor de video de alta definición sin latencia. Sincronizar el dibujo con fotogramas específicos (*frame-by-frame*).
2. **Arquitectura Offline-First:** La app debe funcionar al 100% de manera local y sincronizarse bidireccionalmente con la nube de Firebase cuando haya internet, asegurando que no se pierdan datos en caso de cortes eléctricos.
3. **Automatización de Análisis:** Ofrecer un módulo de asistencia analítica inteligente para el rincón sin depender de APIs en la nube caras o lentas.

---

## 3. Soluciones Arquitectónicas & Stack de Tecnología

### A. Interfaz y Editor Táctico (React + Fabric.js + Electron)
* **¿Por qué?** Elegí **Electron** para empaquetar la app como una herramienta de escritorio nativa para Windows, lo que facilita el acceso al almacenamiento local de videos pesados.
* **Canvas Táctico:** Implementé un lienzo interactivo con **Fabric.js** superpuesto de forma transparente sobre el tag de video de HTML5. Permite dibujar flechas vectoriales de trayectoria de golpes, delimitar zonas de ring y guardar *snapshots* del estado visual asociados a segundos y milisegundos exactos del timeline.

### B. Base de Datos Offline-First y Sincronización (Dexie.js + Firestore)
* **Base de Datos Local:** Implementé **Dexie.js** para gestionar una base de datos IndexedDB local de manera transaccional. La app realiza lecturas y escrituras instantáneas en la computadora local.
* **Cola de Sincronización Inteligente:** Diseñé un módulo de sincronización bidireccional en segundo plano. Al detectar conexión a internet, un proceso liviano sincroniza los registros locales con **Firebase Firestore** de forma segura, resolviendo conflictos de concurrencia.
* **Auditoría e Integridad:** Añadí rutinas automáticas de auto-recuperación ante fallos inesperados y copias de seguridad automáticas en archivos JSON estructurados.

### C. IA Local Multimodal (Ollama Vision Integration)
* **Coach AI "Einstein":** Integré un asistente interactivo local basado en Ollama que analiza las estadísticas del boxeador (eficacia de golpes, distribución de zonas de ataque) y genera un veredicto táctico en español directo y accionable.
* **Análisis de Fotogramas por Visión:** Implementé un procesador que extrae fotogramas del video en Base64 y los envía a un modelo multimodal local (como `llava` o `llama3.2-vision`) para clasificar de forma autónoma el tipo de golpe (Jab, Cross, Gancho), la esquina involucrada y la zona de impacto en formato JSON estructurado.

---

## 4. Metodología de Desarrollo: Orquestación Asistida por IA
Este proyecto demuestra mi flujo de trabajo moderno como desarrollador de alto rendimiento:
* **Planificación Arquitectónica:** Definición rigurosa de modelos de datos y flujo de información antes de escribir la primera línea de código.
* **Aceleración con IA:** Utilicé herramientas avanzadas de IA (como Antigravity y Stitch) como copilotos de desarrollo para la generación veloz de lógica compleja de Canvas e IndexedDB, enfocando mi atención humana en la experiencia de usuario, la depuración y la coherencia del negocio.
* **Rigor de Calidad:** Creación de pruebas unitarias robustas utilizando **Vitest** para garantizar la integridad de los algoritmos de base de datos y la sincronización.

---

## 5. Logros Destacados
* **100% de Autonomía:** El sistema es capaz de iniciar, autenticar (mediante Firebase Auth), analizar peleas con IA y registrar entrenamientos completos sin conexión a internet.
* **Exportación de Dossier de Élite:** Motor de exportación dinámico utilizando **html2canvas** y **jsPDF** para generar informes en PDF impecables y listos para imprimir con gráficas interactivas y estadísticas completas del boxeador.
* **UX/UI Inmersiva y Premium:** Diseño estético de alta gama en modo oscuro, utilizando Framer Motion para micro-animaciones fluidas e iconos elegantes de Lucide React, creando una experiencia sumamente atractiva para directores técnicos y preparadores físicos.
