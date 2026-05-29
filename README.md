# 🥊 equipo-daneri-plataforma
> **Elite Boxing Tactical Analysis & Performance Platform**
> A robust, offline-first hybrid application designed for coaches, athletes, and promoters to perform high-precision fight analytics, leverage local AI vision models, and compile professional performance dossiers.

---

## 🌟 Key Pillars & Features

1. **🎨 High-Performance Video Canvas (React + Fabric.js)**
   * Overlays a high-speed vector layer on top of standard HTML5 video elements.
   * Frame-by-frame navigation allows coaches to paint tactical diagrams (punch paths, angles, positioning) with zero latency.
   * Every annotation is stored as a timed snapshot, linked down to the millisecond.

2. **⚡ Offline-First Synchronization (Dexie.js + Firebase Firestore)**
   * Designed to work in gyms, arenas, and off-grid sporting venues with unstable connections.
   * Uses **Dexie.js** as a transactional engine for local **IndexedDB** writes.
   * Automatically queues operations and syncs bi-directionally with **Firebase Firestore** once internet is restored.

3. **🧠 Offline AI Vision Orchestrator (Ollama & LLaVA)**
   * Eliminates cloud API costs and latency during high-stakes events.
   * Extracts video frames as Base64 strings and processes them using a local multimodal vision LLM (`llava`/`llama3.2-vision`) to auto-classify punches, blocks, and stances.
   * The offline AI Coach **"Einstein"** analyzes raw match statistics to generate direct tactical advice.

4. **📄 Automated PDF Dossier Engine (jsPDF + html2canvas)**
   * Instantly compiles interactive charts, historical fighter stats, and annotated fight canvases into a professional, printable PDF report in 3 seconds.

---

## 🏗️ Architecture & Data Flow

This application is built as an **Offline-First desktop-hybrid application** running on **React + Electron** with a real-time cloud backup mechanism.

```mermaid
graph TD
    subgraph Client Application (Electron + React)
        Canvas[Fabric.js Canvas] -->|Save Annotations| DB[(Dexie.js IndexedDB)]
        UI[React UI] -->|Query Stats| DB
        Ollama[Ollama Vision AI] -->|Local Frame Analysis| UI
    end
    subgraph Cloud Infrastructure
        Firebase[Firebase Firestore]
        Auth[Firebase Auth]
    end
    DB <-->|Bidirectional Offline Sync Queue| Firebase
    UI -->|Authorize| Auth
```

---

## 🛠️ Stack & Technologies

* **Frontend:** React, TailwindCSS, Fabric.js, Recharts, Framer Motion, Lucide Icons.
* **Desktop Wrapper:** Electron (cross-platform packaging).
* **Database & Sync:** Dexie.js (IndexedDB wrapper) & Firebase (Firestore, Authentication).
* **Local AI Execution:** Ollama API (`llava` / `llama3.2-vision`).
* **Document Compilation:** jsPDF, html2canvas.
* **Testing:** Vitest (unit tests for synchronization queues).

---

## 📁 Repository Structure Highlights

* [`src/components/editor/VideoTimelineOverlay.jsx`](file:///src/components/editor/VideoTimelineOverlay.jsx): The core visual module managing the overlaying Fabric.js drawing engine, frame navigation, and sync timestamps.
* [`src/components/editor/SidebarAsistenteIA.jsx`](file:///src/components/editor/SidebarAsistenteIA.jsx): Manages local LLM prompts, structured JSON parsing of visual events, and conversation history with "Einstein".
* [`src/components/pdf/DossierTemplate.jsx`](file:///src/components/pdf/DossierTemplate.jsx): The visual structure compiled into print-ready PDF reports.
* [`src/servicios/dexie/`](file:///src/servicios/dexie/): Houses database initialization, transaction wrappers, and conflict-resolution rules for offline sync.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+)
* **Ollama** (running locally with `llava` model pulled: `ollama pull llava`)

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MauricioDaneri/equipo-daneri-plataforma.git
   cd equipo-daneri-plataforma
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 💼 Freelance / Portfolio Note
This repository stands as a testament to modern high-performance engineering. Built within **1.5 weeks**, it demonstrates:
* Clean state management and canvas performance.
* Deep knowledge of local browser storage strategies (IndexedDB transaccional).
* Execution of edge-device AI without relying on cloud-billing.
* Responsive, high-fidelity UI design.

*For hiring inquiries or contract opportunities, please reach out via my **Upwork Profile**.*
