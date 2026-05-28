import { motion } from "framer-motion";
import { Mic, MicOff, ExternalLink } from "lucide-react";

const ACCIONES_FILA_1 = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"];
const ACCIONES_FILA_2 = [
  "Finta",
  "Esquiva",
  "Bloqueo",
  "Clinch",
  "Pivoteo",
  "Marca General",
];

const formatearTecla = (code) => {
  if (!code) return "";
  if (code.startsWith("Key")) return code.replace("Key", "");
  if (code.startsWith("Digit")) return code.replace("Digit", "");
  if (code === "Space") return "Espacio";
  if (code === "ArrowLeft") return "←";
  if (code === "ArrowRight") return "→";
  return code;
};

export default function TactileKeyboard({
  esquinaDestino,
  setEsquinaDestino,
  listening,
  toggleVoice,
  registrarEvento,
  teclaActiva,
  hotkeys = {},
  panelAccionesDesacoplado,
  setPanelAccionesDesacoplado,
}) {
  return (
    <div
      style={{
        ...estilos.panelAcciones,
        minHeight: panelAccionesDesacoplado ? 200 : "auto",
      }}
    >
      {panelAccionesDesacoplado ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "100%",
            height: "100%",
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(212,175,55,0.1)",
              border: "1px dashed var(--color-dorado)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ExternalLink size={20} color="var(--color-dorado)" />
          </div>
          <div>
            <h4 style={{ color: "var(--color-texto)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Panel de Acciones Desacoplado
            </h4>
            <p style={{ color: "var(--color-texto-suave)", fontSize: 11, lineHeight: 1.4, maxWidth: 280 }}>
              Las acciones tácticas se están registrando y controlando desde la ventana secundaria.
            </p>
          </div>
          <button
            onClick={() => setPanelAccionesDesacoplado(false)}
            className="boton-secundario"
            style={{ fontSize: 10, padding: "5px 12px", marginTop: 4 }}
          >
            Acoplar Panel Localmente
          </button>
        </div>
      ) : (
        <>
          {/* Selector de Foco de Rincón y Botón de Voz */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 4,
              gap: 10,
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ ...estilos.toggleFocoWrapper, flex: 1 }}>
              <button
                style={{ ...estilos.btnFoco("roja", esquinaDestino), flex: 1 }}
                onClick={() => setEsquinaDestino("roja")}
              >
                <span style={{ fontSize: 10, opacity: 0.6, marginRight: 5 }}>
                  [{formatearTecla(hotkeys.RinconRojo)}]
                </span>
                Rincón Rojo
              </button>
              <button
                style={{ ...estilos.btnFoco("azul", esquinaDestino), flex: 1 }}
                onClick={() => setEsquinaDestino("azul")}
              >
                <span style={{ fontSize: 10, opacity: 0.6, marginRight: 5 }}>
                  [{formatearTecla(hotkeys.RinconAzul)}]
                </span>
                Rincón Azul
              </button>
            </div>

            <button
              onClick={toggleVoice}
              style={{
                background: listening ? "rgba(231,76,60,0.15)" : "var(--color-superficie)",
                border: `1px solid ${listening ? "var(--color-rojo-suave)" : "var(--color-borde)"}`,
                borderRadius: 10,
                padding: "5px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: listening ? "var(--color-rojo-suave)" : "var(--color-texto-suave)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}
            >
              {listening ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
              <span style={{ fontSize: 10, fontWeight: 800 }}>
                {listening ? "VOZ ACTIVA" : "ACTIVAR VOZ"}
              </span>
            </button>
          </div>

          {/* ── GRUPO 1: GOLPES OFENSIVOS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            <span style={estilos.labelGrupo}>🥊 Golpes Ofensivos</span>
            <div style={estilos.gridFila1}>
              {ACCIONES_FILA_1.map((act) => (
                <motion.button
                  key={act}
                  style={{
                    ...estilos.btnAccionPrincipal(esquinaDestino),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    padding: "4px 4px",
                    minHeight: 42,
                  }}
                  onClick={() => registrarEvento(act, esquinaDestino)}
                  animate={{
                    scale: teclaActiva === act ? 0.95 : 1,
                    backgroundColor:
                      teclaActiva === act
                        ? "var(--color-dorado-alfa)"
                        : estilos.btnAccionPrincipal(esquinaDestino).background,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.02em" }}>{act}</span>
                  <span style={estilos.hotkeyHint}>[{formatearTecla(hotkeys[act])}]</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── GRUPO 2: DEFENSA Y MOVIMIENTO ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            <span style={estilos.labelGrupo}>🛡️ Defensa / Movimiento / Otros</span>
            <div style={estilos.gridFila2}>
              {ACCIONES_FILA_2.map((act) => (
                <motion.button
                  key={act}
                  style={{
                    ...estilos.btnAccionSecundaria,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    minHeight: 34,
                    padding: "4px 4px",
                  }}
                  onClick={() => registrarEvento(act, esquinaDestino)}
                  animate={{
                    scale: teclaActiva === act ? 0.95 : 1,
                    backgroundColor:
                      teclaActiva === act
                        ? "var(--color-dorado-alfa)"
                        : estilos.btnAccionSecundaria.background,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{act}</span>
                  {hotkeys[act] && (
                    <span style={estilos.hotkeyHint}>[{formatearTecla(hotkeys[act])}]</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Estilos del panel (copiados exactamente del diseño monolítico)
const estilos = {
  panelAcciones: {
    background: "var(--color-superficie-2)",
    borderRadius: 8,
    padding: "10px 16px",
    border: "1px solid var(--color-borde)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  toggleFocoWrapper: {
    display: "flex",
    background: "var(--color-superficie)",
    borderRadius: 8,
    padding: 3,
    border: "1px solid var(--color-borde)",
  },
  btnFoco: (esquina, activo) => ({
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    background:
      activo === esquina
        ? esquina === "roja"
          ? "rgba(192, 57, 43, 0.2)"
          : "rgba(41, 128, 185, 0.2)"
        : "transparent",
    color:
      activo === esquina
        ? esquina === "roja"
          ? "var(--color-rojo-suave)"
          : "var(--color-azul-suave)"
        : "var(--color-texto-suave)",
  }),
  hotkeyHint: {
    opacity: 0.45,
    fontSize: 9,
    fontWeight: 500,
    display: "block",
    lineHeight: 1,
    letterSpacing: "0.02em",
  },
  labelGrupo: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--color-texto-suave)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingBottom: 3,
    borderBottom: "1px solid var(--color-borde)",
    marginBottom: 0,
  },
  gridFila1: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  gridFila2: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  btnAccionPrincipal: (foco) => ({
    background: "var(--color-superficie)",
    border: `2px solid ${foco === "roja" ? "rgba(192, 57, 43, 0.45)" : "rgba(41, 128, 185, 0.45)"}`,
    color:
      foco === "roja" ? "var(--color-rojo-suave)" : "var(--color-azul-suave)",
    padding: "8px 6px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.15s",
  }),
  btnAccionSecundaria: {
    background: "var(--color-superficie)",
    border: "1px solid var(--color-borde)",
    color: "var(--color-texto)",
    padding: "6px 4px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    transition: "all 0.15s",
  },
};
