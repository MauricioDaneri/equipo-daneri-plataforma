# CASO DE ESTUDIO: Lumina POS — Sistema Omnicanal de Gestión para Comercios (Kioscos)
**Desarrollador Fullstack & Orquestador de IA:** Mauricio Daneri
**Tipo de Proyecto:** Aplicación Web de Gestión Comercial y Prototipado Rápido (React + TS + Supabase + Tailwind)
**Enlace de Demostración:** [Ver Video Demo en Carpeta]

---

## 1. Resumen Ejecutivo
El comercio minorista y de kioscos de cercanía requiere una gestión operativa sumamente rápida y precisa. Los sistemas tradicionales de punto de venta (POS) suelen ser anticuados, lentos y difíciles de configurar. 

**Lumina POS** es un prototipo interactivo de alta fidelidad diseñado para revolucionar la administración de kioscos complejos. El sistema abarca desde la terminal de ventas en pesos argentinos (ARS) hasta la planificación semanal de empleados, la gestión de inventario crítico, órdenes de compra automatizadas y cierres de caja blindados.

---

## 2. El Desafío del Prototipado
El objetivo principal del proyecto fue **modelar rápidamente una solución integral de nivel enterprise** para un comercio minorista, validando la lógica del negocio antes de su despliegue final:
1. **Multi-Terminal y Roles:** Distinguir claramente el flujo del operario de caja del panel administrativo del dueño.
2. **Localización de Moneda y Gastos:** Diseñar una terminal de cobro adaptada al flujo de efectivo en pesos argentinos (ARS), incluyendo devoluciones y notas de crédito ágiles.
3. **Gestión de Stock Crítico:** Evitar la rotura de inventario en productos de alta rotación mediante alertas visuales y pedidos automáticos a proveedores registrados.

---

## 3. Soluciones Técnicas & Módulos Prototipados

### A. Terminal de Ventas y Caja (VentasTerminal001Final.tsx)
* **Cobro Ágil:** Interfaz optimizada para el teclado y lectura de código de barras. Soporta cálculo inmediato de vuelto, múltiples métodos de pago (efectivo, billeteras virtuales, tarjetas) y registro automático en el módulo de caja.
* **Cierres de Turno (CierreDeTurnoLuminaPos.tsx):** Flujo guiado de conciliación de efectivo para cajeros, registrando discrepancias y previniendo pérdidas monetarias operativas.

### B. Gestión de Recursos Humanos y Horarios (GestiNDeTurnosYHorarios.tsx)
* **Vista de Agenda Semanal:** Calendario interactivo desarrollado para planificar turnos y horarios de empleados de manera visual, controlando horas trabajadas y evitando solapamiento de horarios.

### C. Control de Inventario y Abastecimiento (InventarioFinal.tsx)
* **Inventario Dinámico:** Base de datos de stock con cálculo automático de costo promedio ponderado, control de lotes y alertas de stock mínimo.
* **Proveedores y Órdenes de Compra:** Integración de una base de datos de proveedores (`BaseDeDatosDeProveedores.tsx`) y generación semiautomática de nuevas órdenes de compra (`NuevaOrdenDeCompraRefinada.tsx`) cuando el stock cae por debajo de la zona de seguridad.

### D. Infraestructura Backend (Supabase + TypeScript)
* **¿Por qué Supabase?** Elegí **Supabase (PostgreSQL)** para implementar una infraestructura relacional sólida de forma inmediata, aprovechando su motor en tiempo real para la actualización instantánea de stock entre terminales y notificaciones push de ventas.
* **Seguridad y Tipado:** Desarrollo en **TypeScript** garantizando la solidez del flujo de datos y previniendo errores en tiempo de ejecución al manipular precios, cantidades y transacciones de caja.

---

## 4. Metodología de Desarrollo: Vibecoding y Prototipado Acelerado
Este proyecto destaca mi enfoque ágil para estructurar sistemas de gran escala en días:
* **Diseño UX Operativo:** En lugar de crear pantallas estáticas, utilicé la IA (herramientas como Stitch) para codificar componentes interactivos fluidos que representan la experiencia de usuario real en una terminal de caja física.
* **Enfoque de Negocio:** Demostración de un entendimiento profundo del funcionamiento de un negocio real (flujo de caja, conciliación bancaria, egresos/gastos y relaciones con proveedores).
* **Adaptabilidad:** Capacidad para estructurar e implementar una base de código compleja en TypeScript y TailwindCSS con estándares modernos de legibilidad y modularidad.

---

## 5. Valor para Empresas y Clientes Freelance
* **Demostración de Arquitectura ERP:** Aunque el sistema se presenta como un prototipo avanzado, la calidad del código, el tipado de TypeScript y la integración de Supabase demuestran mi capacidad para estructurar ERPs y soluciones de gestión interna comercial listos para producción.
* **Diseño de Interfaz de Alta Conversión:** Visualización impecable con Tailwind CSS, garantizando tiempos de respuesta instantáneos en pantalla para operarios bajo presión en horas pico de venta.
