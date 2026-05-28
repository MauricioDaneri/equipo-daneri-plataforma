import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Timer, Check, X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

// Formatear segundos en formato MM:SS.CC (Minutos:Segundos.Centésimas)
function formatPrecisionTime(seg) {
  if (seg === undefined || seg === null || isNaN(seg)) return "0:00.00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  const c = Math.floor((seg % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${c.toString().padStart(2, "0")}`;
}

export default function PrecisionEditModal({
  evento,
  onSave,
  onClose,
  currentTime = 0,
  duracionVideo = 0,
}) {
  // Estado local para los campos editados
  const [edited, setEdited] = useState(() => {
    const isPunch = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(evento.tipo);
    const defaultMano = isPunch ? (evento.tipo === "Jab" || evento.tipo === "Gancho" || evento.tipo === "Recto" ? "adelantada" : "atrasada") : "";
    return {
      ...evento,
      resultado: evento.resultado || (isPunch ? "Conectado" : ""),
      mano: evento.mano || defaultMano,
      duracion: evento.duracion || 0,
      lugar: evento.lugar || "",
      nota: evento.nota || "",
    };
  });

  // Activo de duración si duracion > 0
  const [hasDuration, setHasDuration] = useState(edited.duracion > 0);

  // Escuchar teclado para atajos (Enter y Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        const activeElement = document.activeElement;
        const inTextarea = activeElement && activeElement.tagName === "TEXTAREA";
        if (!inTextarea || e.ctrlKey) {
          e.preventDefault();
          onSave(edited);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [edited, onClose, onSave]);

  // Manejar cambios de tiempo de inicio (timestamp)
  const adjustTimestamp = (amount) => {
    setEdited((prev) => {
      const nuevoTimestamp = Math.max(0, Math.min(duracionVideo || 99999, (prev.tiempoVideo ?? prev.timestamp) + amount));
      return {
        ...prev,
        timestamp: nuevoTimestamp,
        tiempoVideo: nuevoTimestamp,
      };
    });
  };

  // Manejar cambios de duración
  const adjustDuration = (amount) => {
    setEdited((prev) => {
      const nuevaDuracion = Math.max(0, prev.duracion + amount);
      return {
        ...prev,
        duracion: nuevaDuracion,
      };
    });
  };

  // Sincronizar el inicio con la posición actual del video
  const syncStartToVideo = () => {
    setEdited((prev) => ({
      ...prev,
      timestamp: currentTime,
      tiempoVideo: currentTime,
    }));
  };

  // Sincronizar el final (duración) con la posición actual del video
  const syncEndToVideo = () => {
    const inicio = edited.tiempoVideo ?? edited.timestamp;
    if (currentTime > inicio) {
      const dur = currentTime - inicio;
      setEdited((prev) => ({
        ...prev,
        duracion: dur,
      }));
      setHasDuration(true);
    }
  };

  const esGolpe = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(edited.tipo);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(10,10,10,0.82)",
        backdropFilter: "blur(12px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
        style={{
          background: "var(--color-superficie)",
          border: "1px solid var(--color-borde)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          padding: "24px 28px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🥊</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Edición de Precisión Táctica
              </h3>
              <span style={{ fontSize: 10, color: "var(--color-texto-suave)", fontWeight: 500 }}>
                ID #{edited.id ? String(edited.id).substring(0, 8) : "NUEVO"} — Asalto {edited.round || "—"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              color: "var(--color-texto-suave)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.color = "var(--color-texto-suave)"; }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Fila: Tipo de Acción y Esquina */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 9, color: "var(--color-texto-muted)", fontWeight: 700, letterSpacing: 0.5 }}>TIPO DE ACCIÓN:</label>
              <select
                value={edited.tipo}
                onChange={(e) => {
                  const nuevoTipo = e.target.value;
                  const golpe = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(nuevoTipo);
                  const sugerirMano = golpe ? (nuevoTipo === "Jab" || nuevoTipo === "Gancho" || nuevoTipo === "Recto" ? "adelantada" : "atrasada") : "";
                  setEdited((prev) => ({
                    ...prev,
                    tipo: nuevoTipo,
                    ...(golpe ? { 
                      resultado: prev.resultado || "Conectado",
                      mano: prev.mano || sugerirMano 
                    } : {
                      resultado: "",
                      mano: ""
                    }),
                  }));
                }}
                style={{
                  background: "#1e1e28",
                  border: "1px solid var(--color-borde)",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="Jab">Jab</option>
                <option value="Recto">Recto</option>
                <option value="Cross">Cross</option>
                <option value="Gancho">Gancho</option>
                <option value="Uppercut">Uppercut</option>
                <option value="Swing">Swing</option>
                <option value="Finta">Finta</option>
                <option value="Esquiva">Esquiva</option>
                <option value="Bloqueo">Bloqueo</option>
                <option value="Clinch">Clinch</option>
                <option value="Pivoteo">Pivoteo</option>
                <option value="Marca General">Marca General</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 9, color: "var(--color-texto-muted)", fontWeight: 700, letterSpacing: 0.5 }}>ESQUINA / RINCÓN:</label>
              <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", padding: 3, borderRadius: 8, border: "1px solid var(--color-borde)" }}>
                <button
                  type="button"
                  onClick={() => setEdited((prev) => ({ ...prev, esquina: "roja" }))}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: edited.esquina === "roja" ? "rgba(231,76,60,0.25)" : "transparent",
                    color: edited.esquina === "roja" ? "var(--color-rojo-suave)" : "var(--color-texto-suave)",
                    transition: "all 0.2s",
                  }}
                >
                  🔴 Rojo
                </button>
                <button
                  type="button"
                  onClick={() => setEdited((prev) => ({ ...prev, esquina: "azul" }))}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: edited.esquina === "azul" ? "rgba(52,152,219,0.25)" : "transparent",
                    color: edited.esquina === "azul" ? "var(--color-azul-suave)" : "var(--color-texto-suave)",
                    transition: "all 0.2s",
                  }}
                >
                  🔵 Azul
                </button>
              </div>
            </div>
          </div>

          {/* Resultado del Golpe (Si es ofensivo) */}
          {esGolpe && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Selector de Mano Ejecutora */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 9, color: "var(--color-texto-muted)", fontWeight: 700, letterSpacing: 0.5 }}>MANO EJECUTORA (GOLPE):</label>
                <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", borderRadius: 20, padding: 3, border: "1px solid var(--color-borde)" }}>
                  <button
                    type="button"
                    onClick={() => setEdited((prev) => ({ ...prev, mano: "adelantada" }))}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: edited.mano === "adelantada" ? "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)" : "transparent",
                      color: edited.mano === "adelantada" ? "var(--color-dorado)" : "var(--color-texto-suave)",
                      boxShadow: edited.mano === "adelantada" ? "0 0 0 1px rgba(212, 175, 55, 0.25)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🥊 Mano Adelantada
                  </button>
                  <button
                    type="button"
                    onClick={() => setEdited((prev) => ({ ...prev, mano: "atrasada" }))}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: edited.mano === "atrasada" ? "linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.05) 100%)" : "transparent",
                      color: edited.mano === "atrasada" ? "var(--color-azul-suave)" : "var(--color-texto-suave)",
                      boxShadow: edited.mano === "atrasada" ? "0 0 0 1px rgba(52, 152, 219, 0.25)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ⚡ Mano Atrasada
                  </button>
                </div>
              </div>

              {/* Selector de Resultado */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 9, color: "var(--color-texto-muted)", fontWeight: 700, letterSpacing: 0.5 }}>RESULTADO DEL GOLPE:</label>
                <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", borderRadius: 20, padding: 3, border: "1px solid var(--color-borde)" }}>
                  <button
                    type="button"
                    onClick={() => setEdited((prev) => ({ ...prev, resultado: "Conectado" }))}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: edited.resultado === "Conectado" ? "linear-gradient(135deg, rgba(39, 174, 96, 0.2) 0%, rgba(39, 174, 96, 0.05) 100%)" : "transparent",
                      color: edited.resultado === "Conectado" ? "#2ECC71" : "var(--color-texto-suave)",
                      boxShadow: edited.resultado === "Conectado" ? "0 0 0 1px rgba(46, 204, 113, 0.2)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🟢 Conectado
                  </button>
                  <button
                    type="button"
                    onClick={() => setEdited((prev) => ({ ...prev, resultado: "Errado" }))}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: edited.resultado === "Errado" ? "linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(231, 76, 60, 0.05) 100%)" : "transparent",
                      color: edited.resultado === "Errado" ? "#E74C3C" : "var(--color-texto-suave)",
                      boxShadow: edited.resultado === "Errado" ? "0 0 0 1px rgba(231, 76, 60, 0.2)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🔴 Errado
                  </button>
                  <button
                    type="button"
                    onClick={() => setEdited((prev) => ({ ...prev, resultado: "Finta" }))}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: edited.resultado === "Finta" ? "linear-gradient(135deg, rgba(155, 89, 182, 0.2) 0%, rgba(155, 89, 182, 0.05) 100%)" : "transparent",
                      color: edited.resultado === "Finta" ? "#9B59B6" : "var(--color-texto-suave)",
                      boxShadow: edited.resultado === "Finta" ? "0 0 0 1px rgba(155, 89, 182, 0.25)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🌀 Finta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ⏱️ CONSOLA DE MICRO-PRECISIÓN TEMPORAL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14, background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px solid var(--color-borde)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Clock size={12} color="var(--color-dorado)" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: 0.5 }}>Micro-Ajustes Temporales</span>
            </div>

            {/* Ajustador de Inicio (Timestamp) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "var(--color-texto-suave)", fontWeight: 600 }}>Momento de Inicio:</span>
                <span style={{ fontSize: 13, fontFamily: "monospace", color: "#fff", fontWeight: 700 }}>
                  {formatPrecisionTime(edited.tiempoVideo ?? edited.timestamp)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="button" onClick={() => adjustTimestamp(-0.5)} style={estiloMiniBoton}>-0.5s</button>
                <button type="button" onClick={() => adjustTimestamp(-0.1)} style={estiloMiniBoton}>-0.1s</button>
                <button type="button" onClick={syncStartToVideo} style={{ ...estiloMiniBoton, flex: 2, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "var(--color-dorado)", gap: 4 }}>
                  ⏱️ Capturar Playhead
                </button>
                <button type="button" onClick={() => adjustTimestamp(0.1)} style={estiloMiniBoton}>+0.1s</button>
                <button type="button" onClick={() => adjustTimestamp(0.5)} style={estiloMiniBoton}>+0.5s</button>
              </div>
            </div>

            {/* Toggle de Lapso (Tiene Duración) */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => {
                const active = !hasDuration;
                setHasDuration(active);
                if (!active) setEdited(prev => ({ ...prev, duracion: 0 }));
                else if (edited.duracion === 0) setEdited(prev => ({ ...prev, duracion: 0.5 }));
              }}>
                <span style={{ fontSize: 10, color: "var(--color-texto-suave)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Timer size={11} /> ¿Es un lapso de tiempo? (Duración)
                </span>
                <div style={{
                  width: 32, height: 18, borderRadius: 9, background: hasDuration ? "var(--color-dorado-alfa)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${hasDuration ? "var(--color-dorado)" : "var(--color-borde)"}`, position: "relative", transition: "all 0.2s"
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", background: hasDuration ? "var(--color-dorado)" : "var(--color-texto-suave)",
                    position: "absolute", top: 2, left: hasDuration ? 16 : 2, transition: "all 0.2s"
                  }} />
                </div>
              </div>
            </div>

            {/* Ajustador de Duración */}
            {hasDuration && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: 4, overflow: "hidden", marginTop: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--color-texto-suave)", fontWeight: 600 }}>Duración del Suceso:</span>
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--color-dorado)", fontWeight: 700 }}>
                    {edited.duracion.toFixed(2)}s
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => adjustDuration(-0.5)} style={estiloMiniBoton}>-0.5s</button>
                  <button type="button" onClick={() => adjustDuration(-0.1)} style={estiloMiniBoton}>-0.1s</button>
                  <button type="button" onClick={syncEndToVideo} disabled={currentTime <= (edited.tiempoVideo ?? edited.timestamp)} style={{
                    ...estiloMiniBoton, flex: 2,
                    background: currentTime > (edited.tiempoVideo ?? edited.timestamp) ? "rgba(39,174,96,0.1)" : "rgba(255,255,255,0.02)",
                    border: currentTime > (edited.tiempoVideo ?? edited.timestamp) ? "1px solid rgba(39,174,96,0.3)" : "1px solid rgba(255,255,255,0.03)",
                    color: currentTime > (edited.tiempoVideo ?? edited.timestamp) ? "#2ECC71" : "var(--color-texto-muted)",
                    cursor: currentTime > (edited.tiempoVideo ?? edited.timestamp) ? "pointer" : "not-allowed",
                  }}>
                    ⏱️ Fijar Final Aquí
                  </button>
                  <button type="button" onClick={() => adjustDuration(0.1)} style={estiloMiniBoton}>+0.1s</button>
                  <button type="button" onClick={() => adjustDuration(0.5)} style={estiloMiniBoton}>+0.5s</button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Zona de Impacto */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 9, color: "var(--color-texto-muted)", fontWeight: 700, letterSpacing: 0.5 }}>📍 ZONA DE IMPACTO (LUGAR):</label>
            <input
              type="text"
              value={edited.lugar}
              onChange={(e) => setEdited((prev) => ({ ...prev, lugar: e.target.value }))}
              placeholder="Ej: Mandíbula, Hígado, Sien..."
              style={estiloInput}
            />
          </div>

          {/* Observación Táctica */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 9, color: "var(--color-texto-muted)", fontWeight: 700, letterSpacing: 0.5 }}>OBSERVACIÓN TÁCTICA:</label>
            <textarea
              value={edited.nota}
              onChange={(e) => setEdited((prev) => ({ ...prev, nota: e.target.value }))}
              placeholder="Detalla la combinación o nota de entrenamiento aquí..."
              rows={3}
              style={{ ...estiloInput, resize: "none", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Acciones del Footer */}
        <div style={{ display: "flex", gap: 10, marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
          <button onClick={onClose} style={{ ...estiloBoton, background: "transparent", border: "1px solid var(--color-borde)", color: "var(--color-texto-suave)" }}>
            <X size={13} /> Cancelar
          </button>
          <button onClick={() => onSave(edited)} style={{ ...estiloBoton, background: "var(--color-dorado)", color: "var(--color-fondo)" }}>
            <Check size={13} /> Guardar Cambios
          </button>
        </div>

        <div style={{ fontSize: 8, color: "var(--color-texto-muted)", textAlign: "center", marginTop: 4 }}>
          Atajo: <kbd style={estiloKbd}>Ctrl+Enter</kbd> para guardar · <kbd style={estiloKbd}>Esc</kbd> para cancelar
        </div>
      </motion.div>
    </div>
  );
}

// Estilos rápidos en objetos
const estiloMiniBoton = {
  flex: 1,
  padding: "5px 2px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--color-borde)",
  borderRadius: 6,
  color: "var(--color-texto-suave)",
  fontSize: 10,
  fontFamily: "monospace",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
};

const estiloInput = {
  background: "var(--color-superficie-2)",
  border: "1px solid var(--color-borde)",
  color: "var(--color-texto)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  outline: "none",
  transition: "border-color 0.2s",
};

const estiloBoton = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "all 0.2s",
};

const estiloKbd = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--color-borde)",
  borderRadius: 3,
  padding: "1px 4px",
  fontSize: 9,
  fontFamily: "monospace",
};
