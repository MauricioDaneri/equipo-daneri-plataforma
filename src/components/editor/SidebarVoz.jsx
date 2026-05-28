import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Cpu, Download } from "lucide-react";

// Formatear segundos a formato MM:SS
function formatTime(seg) {
  if (seg === undefined || seg === null || isNaN(seg)) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SidebarVoz({
  vozSoportada = false,
  escuchando = false,
  detenerEscucha,
  iniciarEscucha,
  totalFrases = 0,
  totalChunks = 0,
  ultimaFrase = "",
  ultimoComando = "",
  generarResumenPorRound = () => ({}),
  obtenerLogCompleto = () => [],
  sugerirEtiquetasDeAudio = () => [],
  registrarEvento,
  esquinaDestino,
  videoRef,
  setCurrentTime,
  exportarSesion,
  limpiarLog,
}) {
  return (
    <motion.div
      key="voz"
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
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid var(--color-borde)",
          flexShrink: 0,
        }}
      >
        {!vozSoportada ? (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-rojo-suave)",
              textAlign: "center",
              padding: 8,
            }}
          >
            Usa Chrome o Edge para activar el control por voz.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <button
              onClick={() => (escuchando ? detenerEscucha() : iniciarEscucha())}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${escuchando ? "rgba(192, 57, 43, 0.4)" : "rgba(41, 128, 185, 0.3)"}`,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.2s",
                background: escuchando
                  ? "rgba(192, 57, 43, 0.12)"
                  : "rgba(41, 128, 185, 0.08)",
                color: escuchando
                  ? "var(--color-rojo-suave)"
                  : "var(--color-azul-suave)",
              }}
            >
              {escuchando ? <MicOff size={18} /> : <Mic size={18} />}
              {escuchando ? "Grabando — Detener" : "Iniciar Narración de Voz"}
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--color-superficie-2)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--color-texto)",
                  }}
                >
                  {totalFrases}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--color-texto-suave)",
                  }}
                >
                  Frases
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "var(--color-superficie-2)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--color-dorado)",
                  }}
                >
                  {totalChunks}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--color-texto-suave)",
                  }}
                >
                  Bloques 5min
                </div>
              </div>
            </div>
            {ultimaFrase && (
              <div
                style={{
                  background: "var(--color-superficie-2)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    color: "var(--color-texto-suave)",
                    fontWeight: 600,
                  }}
                >
                  Escuché:{" "}
                </span>
                <span
                  style={{
                    color: "var(--color-texto)",
                    fontStyle: "italic",
                  }}
                >
                  "{ultimaFrase}"
                </span>
              </div>
            )}
            <AnimatePresence>
              {ultimoComando && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "var(--color-dorado-alfa)",
                    border: "1px solid var(--color-dorado)",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-dorado)",
                    textAlign: "center",
                  }}
                >
                  Comando: {ultimoComando}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-borde)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--color-texto-suave)",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Comandos Disponibles
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {[
            '"Play"',
            '"Pausa"',
            '"Jab"',
            '"Cross"',
            '"Gancho"',
            '"Uppercut"',
            '"Esquiva"',
            '"Bloqueo"',
            '"Finta"',
            '"Rojo"',
            '"Azul"',
            '"Conectado"',
            '"Errado"',
          ].map((cmd) => (
            <span
              key={cmd}
              style={{
                fontSize: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--color-borde)",
                borderRadius: 4,
                padding: "2px 6px",
                color: "var(--color-texto-suave)",
                fontFamily: "monospace",
              }}
            >
              {cmd}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* AI Audio Tagging Panel */}
        <div
          style={{
            background: "rgba(155,89,182,0.06)",
            border: "1px solid rgba(155,89,182,0.2)",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Cpu size={14} color="#9b59b6" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9b59b6",
                textTransform: "uppercase",
              }}
            >
              AI Audio Tagging
            </span>
          </div>
          <p
            style={{
              fontSize: 10,
              color: "var(--color-texto-suave)",
              margin: "0 0 8px 0",
              lineHeight: 1.3,
            }}
          >
            Etiquetas sugeridas automáticamente según la narración de audio detectada:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sugerirEtiquetasDeAudio().map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  registrarEvento(tag, esquinaDestino);
                  if (window.api?.sonido?.reproducir) {
                    window.api.sonido.reproducir({
                      frecuencia: 800,
                      duracion: 0.05,
                    });
                  }
                }}
                style={{
                  fontSize: 10,
                  background: "rgba(155,89,182,0.12)",
                  border: "1px solid rgba(155,89,182,0.4)",
                  color: "#e0b0ff",
                  padding: "3px 8px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>+</span> {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Historial de Transcripción (Clickable) */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-texto-suave)",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Historial de Narración
          </div>
          {(() => {
            const logCompleto = obtenerLogCompleto ? obtenerLogCompleto() : [];
            if (logCompleto.length === 0) {
              return (
                <p
                  style={{
                    color: "var(--color-texto-suave)",
                    fontSize: 12,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Las frases y anotaciones de voz aparecerán aquí en tiempo real.
                </p>
              );
            }
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 180,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {logCompleto.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = item.tiempoVideo;
                        setCurrentTime(item.tiempoVideo);
                      }
                    }}
                    style={{
                      padding: "8px 10px",
                      background: item.esComando
                        ? "rgba(212,175,55,0.06)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${item.esComando ? "var(--color-dorado-alfa)" : "var(--color-borde)"}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = item.esComando
                        ? "rgba(212,175,55,0.06)"
                        : "rgba(255,255,255,0.03)")
                    }
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        color: "var(--color-dorado)",
                        background: "rgba(0,0,0,0.2)",
                        padding: "2px 4px",
                        borderRadius: 4,
                      }}
                    >
                      {formatTime(item.tiempoVideo)}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 11,
                        color: "var(--color-texto)",
                      }}
                    >
                      {item.esComando ? (
                        <span>
                          ⚡ Comando: <strong>{item.accionDetectada}</strong>
                        </span>
                      ) : (
                        <span>"{item.texto}"</span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--color-texto-muted)",
                      }}
                    >
                      R{item.round}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Resumen por Round */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-texto-suave)",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Resumen por Round
          </div>
          {(() => {
            const resumen = generarResumenPorRound();
            const rounds = Object.keys(resumen);
            if (rounds.length === 0) {
              return (
                <p
                  style={{
                    color: "var(--color-texto-suave)",
                    fontSize: 12,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Activá el micrófono y comenzá a narrar. El resumen se agrupará aquí.
                </p>
              );
            }
            return rounds.map((r) => (
              <div key={r} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-dorado)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Round {r}</span>
                  <span
                    style={{
                      color: "var(--color-texto-suave)",
                      fontWeight: 400,
                    }}
                  >
                    {resumen[r].totalComandos} comandos
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--color-superficie-2)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "var(--color-texto)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    fontStyle: resumen[r].notes.startsWith("Sin notas")
                      ? "italic"
                      : "normal",
                    borderLeft: "2px solid var(--color-dorado)",
                  }}
                >
                  {resumen[r].notes}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--color-borde)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => exportarSesion("Sesion_Daneri")}
          disabled={totalFrases === 0}
          style={{
            flex: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px",
            background: totalFrases > 0 ? "rgba(52,152,219,0.08)" : "transparent",
            border: "1px solid rgba(52,152,219,0.3)",
            borderRadius: 6,
            color: totalFrases > 0 ? "var(--color-azul-suave)" : "var(--color-texto-muted)",
            fontSize: 11,
            fontWeight: 600,
            cursor: totalFrases > 0 ? "pointer" : "not-allowed",
          }}
        >
          <Download size={14} /> Exportar .md
        </button>
        <button
          className="boton-secundario"
          style={{ flex: 1, fontSize: 11, padding: "10px" }}
          onClick={limpiarLog}
        >
          Limpiar Log
        </button>
      </div>
    </motion.div>
  );
}
