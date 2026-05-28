import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ExternalLink, 
  Undo, 
  Redo, 
  HelpCircle, 
  Maximize2, 
  FileText, 
  Timer
} from "lucide-react";
import CustomDropdown from "../ui/CustomDropdown";

export default function SessionHeader({
  id,
  navigate,
  boxeadoresDb = [],
  boxeadorRojoId,
  setBoxeadorRojoId,
  boxeadorAzulId,
  setBoxeadorAzulId,
  historialPasado = [],
  historialFuturo = [],
  handleUndo,
  handleRedo,
  setMostrarManual,
  setManualTab,
  setAnalisisLimpio,
  analisisLimpio,
  videoUrl,
  videoRef,
  isPlaying,
  setIsPlaying,
  roundActual,
  setRoundActual,
  duracionRound,
  totalRounds,
  roundStarts = {},
  tiempoRound,
  setTiempoRound,
  cronActivo,
  setCronActivo,
  estadoRound,
  setEstadoRound,
  sonarCampana,
  registrarEvento,
  herramientaActiva,
  setHerramientaActiva,
  colorActivo,
  setColorActivo,
  tamanioLapiz,
  setTamanioLapiz,
  canvasInstance,
  colores = [],
  estilos = {},
  setCurrentTime
}) {

  const formatTimeMinutes = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const resetCronometro = () => {
    setCronActivo(false);
    if (videoRef.current) {
      const tStart = roundStarts[1] || 0;
      videoRef.current.currentTime = tStart;
      if (setCurrentTime) setCurrentTime(tStart);
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setTiempoRound(duracionRound);
      setRoundActual(1);
      setEstadoRound("BOX");
    }
  };

  const handleCronometroPlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setCronActivo(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        setCronActivo(true);
      }
    } else {
      setCronActivo(!cronActivo);
    }
  };

  return (
    <>
      {/* TOP HEADER - Hidden in Clean Mode */}
      {!analisisLimpio && (
        <header style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 1vh, 10px)", marginBottom: "clamp(8px, 1.2vh, 14px)" }}>
          {/* Fila 1: Título y Botones Generales */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/sesiones")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-texto-suave)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  padding: 0
                }}
              >
                <ChevronLeft size={16} /> Volver
              </button>
              <h1 style={{ ...estilos.tituloSeccion, margin: 0 }}>EDITOR TÁCTICO</h1>
              <button
                className="boton-secundario"
                style={{ padding: "4px 8px", fontSize: 11 }}
                onClick={() =>
                  window.open(
                    `/#/panel-control/${id || "nuevo"}`,
                    "_blank",
                    "width=450,height=800,menubar=no,toolbar=no"
                  )
                }
                title="Abrir panel en segundo monitor"
              >
                <ExternalLink size={14} /> Desacoplar Panel
              </button>

              {/* Undo / Redo controls */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "var(--color-superficie)",
                  borderRadius: 6,
                  padding: 2,
                  border: "1px solid var(--color-borde)",
                }}
              >
                <button
                  onClick={handleUndo}
                  disabled={historialPasado.length === 0}
                  style={{
                    background: "transparent",
                    border: "none",
                    color:
                      historialPasado.length > 0
                        ? "var(--color-texto)"
                        : "var(--color-texto-muted)",
                    cursor: "pointer",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Deshacer (Ctrl+Z)"
                >
                  <Undo size={14} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historialFuturo.length === 0}
                  style={{
                    background: "transparent",
                    border: "none",
                    color:
                      historialFuturo.length > 0
                        ? "var(--color-texto)"
                        : "var(--color-texto-muted)",
                    cursor: "pointer",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Rehacer (Ctrl+Y)"
                >
                  <Redo size={14} />
                </button>
              </div>

              {/* Manual/Ayuda button */}
              <button
                onClick={() => {
                  setMostrarManual(true);
                  setManualTab("timeline");
                }}
                className="boton-secundario"
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  borderColor: "var(--color-texto-muted)",
                }}
                title="Manual del Analista Táctico"
              >
                <HelpCircle size={12} /> Ayuda Táctica
              </button>

              {/* Clean analysis mode button */}
              <button
                onClick={() => setAnalisisLimpio(true)}
                className="boton-secundario"
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
                title="Maximizar pantalla táctica"
              >
                <Maximize2 size={12} /> Modo Limpio
              </button>

              {id && (
                <button
                  className="boton-secundario"
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    borderColor: "var(--color-dorado)",
                    color: "var(--color-dorado)",
                    fontWeight: 600,
                  }}
                  onClick={() => navigate(`/informe/${id}`)}
                >
                  <FileText size={14} /> Generar Informe
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: Contexto y Herramientas */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            {/* Selectores de Boxeadores */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <CustomDropdown
                label="Rincón Rojo"
                value={boxeadorRojoId}
                onChange={setBoxeadorRojoId}
                boxeadores={boxeadoresDb.filter(
                  (b) => !b.archivado || b.id.toString() === boxeadorRojoId
                )}
                cornerColor="var(--color-rojo-suave)"
              />
              <span
                style={{
                  color: "var(--color-texto-suave)",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                VS
              </span>
              <CustomDropdown
                label="Rincón Azul"
                value={boxeadorAzulId}
                onChange={setBoxeadorAzulId}
                boxeadores={boxeadoresDb.filter(
                  (b) => !b.archivado || b.id.toString() === boxeadorAzulId
                )}
                cornerColor="var(--color-azul-suave)"
              />
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* CRONÓMETRO DE ROUND */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--color-superficie-2)",
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${cronActivo ? "var(--color-rojo-suave)" : "var(--color-borde)"}`,
                    transition: "border 0.3s",
                  }}
                >
                  <Timer
                    size={16}
                    color={
                      cronActivo
                        ? "var(--color-rojo-suave)"
                        : "var(--color-texto-suave)"
                    }
                  />

                  {estadoRound === "DESCANSO" ? (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: "var(--color-rojo-suave)",
                        background: "rgba(231,76,60,0.15)",
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: "1px solid rgba(231,76,60,0.3)",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      DESCANSO
                    </motion.span>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-texto-suave)",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Rnd
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 18,
                          fontWeight: 700,
                          color: cronActivo
                            ? "var(--color-rojo-suave)"
                            : "var(--color-texto)",
                        }}
                      >
                        {roundActual}
                      </span>
                      <div
                        style={{
                          width: 1,
                          height: 16,
                          background: "var(--color-borde)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "var(--color-texto)",
                          minWidth: 46,
                        }}
                      >
                        {formatTimeMinutes(tiempoRound)}
                      </span>
                    </>
                  )}

                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: "var(--color-borde)",
                    }}
                  />

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={handleCronometroPlayPause}
                      className="boton-primario"
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {cronActivo ? "PAUSA" : "INICIAR"}
                    </button>
                    <button
                      onClick={resetCronometro}
                      className="boton-secundario"
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
    </>
  );
}
