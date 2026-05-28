import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, PenTool, Trash2, ChevronDown, Filter } from "lucide-react";

// Formatear segundos a formato MM:SS
function formatTime(seg) {
  if (seg === undefined || seg === null || isNaN(seg)) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SidebarTimeline({
  timeline = [],
  eventosFiltrados = [],
  eventoSeleccionadoId,
  setEventoSeleccionadoId,
  setEventoMapeoGuiadoId,
  videoRef,
  setCurrentTime,
  fabricCanvasRef,
  actualizarObjetosDibujo,
  isHistoryLoadingRef,
  setEventoAEditar,
  pushStateToHistory,
  setTimeline,
  tieneDibujo,
  terminoBusqueda,
  setTerminoBusqueda,
  filtroRound,
  setFiltroRound,
  totalRounds = 12,
  filtroAislamiento,
  setFiltroAislamiento,
  boxeadoresDb = [],
  boxeadorRojoId,
  boxeadorAzulId,
  setPanelActivo,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const filterOptions = [
    { value: null, label: "Mostrar Todo", icon: "🔥" },
    { value: "Jab", label: "Jab", icon: "🥊" },
    { value: "Recto", label: "Recto", icon: "🥊" },
    { value: "Cross", label: "Cross", icon: "🥊" },
    { value: "Gancho", label: "Gancho", icon: "🥊" },
    { value: "Uppercut", label: "Uppercut", icon: "🥊" },
    { value: "Swing", label: "Swing", icon: "🥊" },
    { value: "Finta", label: "Finta", icon: "⚡" },
    { value: "Esquiva", label: "Esquiva", icon: "🛡️" },
    { value: "Bloqueo", label: "Bloqueo", icon: "🛡️" },
    { value: "Clinch", label: "Clinch", icon: "🛡️" },
    { value: "Pivoteo", label: "Pivoteo", icon: "⚡" },
    { value: "Marca General", label: "Marca General", icon: "📍" }
  ];

  const selectedOpt = filterOptions.find(opt => opt.value === filtroAislamiento) || filterOptions[0];

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 14px",
          background: "rgba(255, 255, 255, 0.02)",
          borderBottom: "1px solid var(--color-borde)",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Buscar golpes, notas..."
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          style={{
            flex: 1,
            background: "var(--color-superficie-2)",
            border: "1px solid var(--color-borde)",
            borderRadius: 16,
            color: "var(--color-texto)",
            fontSize: 11,
            padding: "6px 12px",
            outline: "none",
          }}
        />
        <select
          value={filtroRound}
          onChange={(e) => setFiltroRound(e.target.value)}
          style={{
            background: "var(--color-superficie-2)",
            border: "1px solid var(--color-borde)",
            borderRadius: 16,
            color: "var(--color-texto)",
            fontSize: 11,
            padding: "6px 10px",
            outline: "none",
            cursor: "pointer",
            maxWidth: 100,
          }}
        >
          <option value="todos">Todos Rnd</option>
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => (
            <option key={r} value={r.toString()}>
              Round {r}
            </option>
          ))}
        </select>
      </div>

      {/* FILTROS DE AISLAMIENTO TÁCTICO (MODO ENFOQUE DROPDOWN) */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "8px 14px",
          background: "rgba(0,0,0,0.15)",
          borderBottom: "1px solid var(--color-borde)",
          alignItems: "center",
          position: "relative",
          zIndex: 20,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-texto-suave)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
          <Filter size={11} color="var(--color-dorado)" /> Enfoque:
        </span>

        <div style={{ position: "relative", flex: 1 }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--color-borde)",
              borderRadius: 12,
              padding: "5px 12px",
              color: "var(--color-texto)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-dorado)"}
            onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.borderColor = "var(--color-borde)"; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>{selectedOpt.icon}</span>
              <span>{selectedOpt.label}</span>
            </span>
            <ChevronDown size={12} style={{
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              color: "var(--color-texto-suave)"
            }} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                {/* Backdrop invisible para cerrar al hacer clic fuera */}
                <div 
                  onClick={() => setDropdownOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 999 }}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "rgba(23, 23, 30, 0.96)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid var(--color-borde)",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                    zIndex: 1000,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 4,
                  }}
                >
                  {filterOptions.map((opt) => {
                    const isSelected = opt.value === filtroAislamiento;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setFiltroAislamiento(opt.value);
                          setDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: isSelected ? "var(--color-dorado-alfa)" : "transparent",
                          color: isSelected ? "var(--color-dorado)" : "var(--color-texto-suave)",
                          fontSize: 11,
                          fontWeight: isSelected ? 800 : 500,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.color = "#fff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--color-texto-suave)";
                          }
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* LISTA DE EVENTOS */}
      <div style={estilos.timelineLista}>
        <AnimatePresence>
          {timeline.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 16px",
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(10px)",
                borderRadius: 12,
                border: "1px dashed var(--color-borde)",
                textAlign: "center",
                margin: "24px 0",
                gap: 16,
              }}
            >
              <Video size={36} color="var(--color-dorado)" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-texto)" }}>
                  Línea de Tiempo Vacía
                </h4>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-texto-suave)", lineHeight: 1.5 }}>
                  Carga un video táctico y utiliza los atajos del teclado o haz clic en las acciones inferiores para registrar golpes y eventos.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  background: "rgba(0, 0, 0, 0.2)",
                  padding: "10px 14px",
                  borderRadius: 8,
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                  Consejos rápidos:
                </div>
                <div style={estiloConsejo}><span>🥊</span> Tecla <strong>J</strong> para Jab del rincón activo</div>
                <div style={estiloConsejo}><span>⚡</span> Teclas <strong>Q / W</strong> cambian Rincón Rojo/Azul</div>
                <div style={estiloConsejo}><span>🎙️</span> Activa la Narración por Voz para manos libres</div>
              </div>
            </div>
          ) : (
            eventosFiltrados.map((ev) => (
              <motion.div
                key={ev.id}
                id={`ev-list-item-${ev.id}`}
                onClick={() => {
                  setEventoSeleccionadoId(ev.id);
                  if (videoRef.current) {
                    videoRef.current.currentTime = ev.timestamp;
                    setCurrentTime(ev.timestamp);
                  }
                  if (fabricCanvasRef.current) {
                    if (ev.canvasData) {
                      try {
                        isHistoryLoadingRef.current = true;
                        fabricCanvasRef.current.loadFromJSON(JSON.parse(ev.canvasData), () => {
                          fabricCanvasRef.current.renderAll();
                          isHistoryLoadingRef.current = false;
                          actualizarObjetosDibujo();
                        });
                      } catch (e) {
                        isHistoryLoadingRef.current = false;
                      }
                    } else {
                      fabricCanvasRef.current.clear();
                      actualizarObjetosDibujo();
                    }
                  }
                }}
                onDoubleClick={() => setEventoAEditar(ev)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEventoSeleccionadoId(ev.id);
                  if (videoRef.current) {
                    videoRef.current.currentTime = ev.timestamp;
                    setCurrentTime(ev.timestamp);
                  }
                  const esMappable = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(ev.tipo);
                  if (esMappable) {
                    setEventoMapeoGuiadoId?.(ev.id);
                    setPanelActivo("mapa");
                  }
                }}
                style={{
                  ...estilos.eventoItem,
                  cursor: "pointer",
                  borderColor: eventoSeleccionadoId === ev.id ? "var(--color-dorado)" : "var(--color-borde)",
                  background: eventoSeleccionadoId === ev.id ? "rgba(212,175,55,0.08)" : "var(--color-superficie)",
                  boxShadow: eventoSeleccionadoId === ev.id ? "0 0 8px rgba(212,175,55,0.2)" : "none",
                  transition: "all 0.2s ease",
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {ev.snapshot ? (
                  <div style={{ position: "relative", width: 44, height: 28, borderRadius: 4, overflow: "hidden", border: "1px solid var(--color-borde)", flexShrink: 0 }}>
                    <img src={ev.snapshot} alt="Snap" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 1, right: 2, fontSize: 8, fontFamily: "monospace", color: "#fff", textShadow: "1px 1px 2px #000", background: "rgba(0,0,0,0.4)", padding: "0 2px", borderRadius: 2 }}>
                      {formatTime(ev.timestamp)}
                    </div>
                  </div>
                ) : (
                  <div style={estilos.eventoTiempo}>{formatTime(ev.timestamp)}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dorado)", background: "rgba(212, 175, 55, 0.15)", padding: "2px 6px", borderRadius: 4, marginRight: 4, whiteSpace: "nowrap" }}>
                      #{ev._numero}
                    </span>
                    <select
                      value={ev.tipo}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        pushStateToHistory();
                        const nuevo = [...timeline];
                        const idx = nuevo.findIndex((t) => t.id === ev.id);
                        nuevo[idx].tipo = e.target.value;
                        setTimeline(nuevo);
                      }}
                      style={estilos.selectTipo}
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
                    {ev.lugar ? (
                      <div style={{ fontSize: 9, color: "var(--color-dorado)", marginTop: 2 }}>
                        📍 {ev.lugar}
                      </div>
                    ) : (
                      ev.esquina !== "general" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventoSeleccionadoId(ev.id);
                            setEventoMapeoGuiadoId?.(ev.id);
                            setPanelActivo("mapa");
                          }}
                          style={{
                            marginTop: 4,
                            background: "rgba(212,175,55,0.1)",
                            color: "var(--color-dorado)",
                            border: "1px solid rgba(212,175,55,0.3)",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 9,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span>📍</span> Mapear
                        </button>
                      )
                    )}
                    {tieneDibujo(ev) && (
                      <span title="Dibujo táctico asociado" style={{ color: "var(--color-dorado)", display: "flex", alignItems: "center" }}>
                        <PenTool size={11} />
                      </span>
                    )}
                  </div>
                  {ev.esquina !== "general" && (
                    <div style={estilos.eventoEsquina(ev.esquina)}>
                      Rincón {ev.esquina === "roja" ? "Rojo" : "Azul"}
                    </div>
                  )}
                  {ev.lugar && (
                    <div style={{ fontSize: 9, color: "var(--color-dorado)", marginTop: 2 }}>
                      📍 {ev.lugar} {ev.coordX ? `(${ev.coordX}, ${ev.coordY})` : ""}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventoAEditar(ev);
                      setEventoSeleccionadoId(ev.id);
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--color-texto-suave)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Editar detalles precisos"
                  >
                    <PenTool size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pushStateToHistory();
                      setTimeline(timeline.filter((t) => t.id !== ev.id));
                    }}
                    style={estilos.btnBorrarEvento}
                    title="Borrar evento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const estiloConsejo = {
  fontSize: 10,
  color: "var(--color-texto-suave)",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const estilos = {
  timelineLista: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  eventoItem: {
    background: "var(--color-superficie)",
    border: "1px solid var(--color-borde)",
    borderRadius: 6,
    padding: "8px 10px",
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  eventoTiempo: {
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--color-texto-suave)",
    background: "var(--color-superficie-2)",
    padding: "4px 8px",
    borderRadius: 4,
    flexShrink: 0,
  },
  selectTipo: {
    background: "#1e1e28",
    color: "#ffffff",
    border: "none",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: 11,
    fontWeight: 600,
  },
  eventoEsquina: (esquina) => ({
    fontSize: 9,
    color: esquina === "roja" ? "var(--color-rojo-suave)" : "var(--color-azul-suave)",
    fontWeight: 700,
    marginTop: 2,
    textTransform: "uppercase",
  }),
  btnBorrarEvento: {
    background: "transparent",
    border: "none",
    color: "var(--color-texto-muted)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
};
