# GUIONES PARA GRABACIÓN DE VIDEOS DEMOSTRATIVOS (Streamlabs OBS)

Estos guiones están diseñados para grabar videos dinámicos, técnicos e impecables de **2 minutos de duración**, con un lenguaje profesional y accesible en español.

---

## CONSEJOS GENERALES DE GRABACIÓN CON STREAMLABS OBS:
1. **Resolución:** Graba en Full HD (1080p) a 60 FPS si es posible.
2. **Audio:** Limpia el ruido de fondo en Streamlabs (agrega un filtro de "Supresión de ruido" en el micrófono).
3. **Ritmo:** Habla con un tono calmado, profesional y seguro. No te apures.
4. **Cursor:** Mueve el puntero del mouse de forma suave y deliberada. Evita moverlo en círculos constantemente.

---

# GUION 1: Plataforma de Análisis Táctico — Equipo Daneri
**Duración Estimada:** 2 minutos.  
**Preparación de Pantalla:** Abre la aplicación en tu pantalla principal. Asegúrate de tener cargado un video de boxeo y algunos dibujos y análisis de prueba creados.

### [0:00 - 0:25] Introducción y Propósito del Proyecto
* **Qué mostrar en pantalla:** La vista de inicio (Dashboard) con el menú lateral, los datos del boxeador en pantalla y la transición fluida hacia el **Editor Táctico** con un video cargado.
* **Lo que vas a decir:**
  > *"Hola, mi nombre es Mauricio Daneri. En este video quiero mostrarles la **Plataforma de Análisis Táctico** que diseñé y desarrollé para el Equipo Daneri de Boxeo. El objetivo del proyecto fue crear una herramienta de nivel comercial para que entrenadores y mánagers puedan realizar análisis de video de alta precisión sin depender de anotaciones manuales ni software costoso."*

### [0:25 - 0:55] Demo Interactiva: El Editor Táctico
* **Qué mostrar en pantalla:** Reproduce el video, paúsalo en un momento específico, usa el control frame-by-frame. Activa el pincel y dibuja una flecha de golpe o delimita la posición del ring con la herramienta de círculo.
* **Lo que vas a decir:**
  > *"El núcleo de la aplicación es este **Editor Táctico** interactivo. Desarrollé una capa sobre el reproductor de video usando **Fabric.js** que me permite pausar, avanzar cuadro por cuadro y realizar anotaciones vectoriales dinámicas en tiempo real. Lo interesante es que cada dibujo se asocia como un snapshot a un segundo exacto del video, permitiendo a los entrenadores revisar momentos críticos de la pelea con solo un clic."*

### [0:55 - 1:30] El Súper Poder: Inteligencia Artificial Local (Ollama)
* **Qué mostrar en pantalla:** Abre el chat del Coach AI "Einstein", haz clic en un botón de "Analizar Frame con IA" o muestra el análisis de un fotograma estructurado en JSON.
* **Lo que vas a decir:**
  > *"Una de las características más avanzadas del proyecto es la integración de **Inteligencia Artificial local con Ollama**. Implementé un módulo de análisis de visión multimodal que toma el fotograma en base64 y utiliza un modelo local para autodetectar golpes, esquivas y zonas de impacto de manera automática. A su vez, contamos con el asistente 'Einstein', un modelo de lenguaje que procesa todas las estadísticas de la sesión y redacta recomendaciones tácticas directas en español latinoamericano, todo funcionando de manera local y 100% offline."*

### [1:30 - 2:00] Arquitectura Offline-First y Cierre
* **Qué mostrar en pantalla:** Abre el panel de reportes, genera y descarga el PDF analítico completo. Luego muestra brevemente el panel de Ajustes con las estadísticas de sincronización.
* **Lo que vas a decir:**
  > *"A nivel de arquitectura, la app es **Offline-First**, construida con **React, Electron y Dexie.js** para garantizar que los entrenadores puedan usarla en el gimnasio sin conexión a internet. Los datos se sincronizan automáticamente en segundo plano con **Firebase** apenas se detecta señal. Finalmente, con un clic, el sistema compila todo el análisis en un dossier analítico digital en PDF listo para compartir. Este proyecto demuestra mi enfoque de desarrollo moderno: orquestar herramientas avanzadas de IA para construir software robusto, escalable y con una experiencia de usuario de primer nivel. Muchas gracias por su tiempo."*

---

# GUION 2: Lumina POS — Sistema Omnicanal de Gestión para Kioscos
**Duración Estimada:** 2 minutos.  
**Preparación de Pantalla:** Abre el proyecto de `scalable-pos-system` corriendo localmente. Prepara la terminal de ventas principal (`VentasTerminal001Final.tsx`) en pantalla con algunos productos en el carrito.

### [0:00 - 0:25] Introducción y Enfoque de Prototipado Rápido
* **Qué mostrar en pantalla:** La pantalla de Ventas principal de Lumina POS. Muestra el diseño moderno y limpio en modo oscuro, con la moneda local en ARS (Pesos Argentinos).
* **Lo que vas a decir:**
  > *"Hola, soy Mauricio Daneri. En este video les presento **Lumina POS**, un sistema integral omnicanal diseñado y prototipado para la gestión avanzada de kioscos y comercios minoristas. Este desarrollo demuestra mi capacidad para modelar reglas de negocio complejas y crear flujos de trabajo eficientes para operaciones reales bajo alta presión."*

### [0:25 - 0:55] Flujo de Venta y Terminal de Caja
* **Qué mostrar en pantalla:** Agrega un producto al carrito, cambia la cantidad de ítems, haz clic en el botón de pago, introduce el monto recibido y muestra el cálculo de vuelto en pesos argentinos. Abre la pantalla de Cierre de Caja.
* **Lo que vas a decir:**
  > *"La terminal de ventas está adaptada al comercio local. Soporta múltiples formas de pago, registro rápido de artículos y un flujo guiado para el **Cierre de Caja y Conciliación de Turno**, lo que ayuda a los comerciantes a llevar un control milimétrico del efectivo ingresado, previniendo cualquier tipo de discrepancia al finalizar la jornada laboral."*

### [0:55 - 1:30] Inventario Inteligente y Horarios
* **Qué mostrar en pantalla:** Pasa a la pestaña de **Inventario Final** (muestra las alertas de stock crítico en rojo). Transiciona hacia la vista de **Gestión de Turnos y Horarios** mostrando el calendario de cuadrícula semanal.
* **Lo que vas a decir:**
  > *"A nivel administrativo, implementé un **Módulo de Inventario Inteligente** que alerta visualmente en tiempo real sobre la falta de productos críticos y genera órdenes de compra semiautomáticas vinculadas a una base de datos de proveedores locales. Adicionalmente, el sistema incluye una interfaz de **Gestión de Recursos Humanos** con una agenda semanal visual para organizar turnos, horarios y horas trabajadas de los empleados."*

### [1:30 - 2:00] Backend y Conclusión
* **Qué mostrar en pantalla:** Muestra brevemente la pantalla de analíticas y reportes de ventas mensuales.
* **Lo que vas a decir:**
  > *"El proyecto está desarrollado con **React, TypeScript y Tailwind CSS**, utilizando **Supabase y PostgreSQL** en el backend para gestionar las transacciones y garantizar el tipado seguro de los datos contables. Con Lumina POS demostré mi habilidad para diseñar interfaces altamente intuitivas y estructurar de manera robusta la lógica de un sistema ERP comercial completo. Si buscan un desarrollador capaz de prototipar y construir herramientas de gestión comercial escalables en tiempo récord, no duden en contactarme. Muchas gracias."*
