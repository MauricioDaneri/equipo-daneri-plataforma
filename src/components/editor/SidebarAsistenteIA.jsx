import { motion } from "framer-motion";
import { Cpu, Zap } from "lucide-react";

export default function SidebarAsistenteIA({
  ollamaDisponible = false,
  ollamaModelo = "llava",
  setOllamaModelo,
  intervaloEscaneo = "manual",
  setIntervaloEscaneo,
  temperaturaIA = 0.5,
  filtroDeteccion = "balanceado",
  tasaMuestreo = 3,
  guardarAjusteIA,
  analizarFrameActual,
  ollamaEstado = "",
  barriendoIA = false,
  toggleEscaneoIA,
  escaneoActivo = false,
  stepBarrido = 1.0,
  setStepBarrido,
  iniciarBarridoIA,
  progresoBarrido = 0,
  detenerBarridoIA,
  obtenerVeredictoEinstein,
  cargandoVeredicto = false,
  timeline = [],
  veredictoEinstein = "",
  logsIA = [],
}) {
  return (
    <motion.div
      key="ollama"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "16px 16px 32px 16px",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Cpu size={16} color="var(--color-exito)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-texto)", textTransform: "uppercase" }}>
          Asistente Local Einstein (IA)
        </span>
      </div>

      <div
        style={{
          background: "var(--color-superficie)",
          borderRadius: 10,
          padding: 12,
          border: "1px solid var(--color-borde)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyBetween: "space-between", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--color-texto-suave)" }}>Servidor Ollama:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: ollamaDisponible ? "var(--color-exito)" : "var(--color-rojo-suave)" }}>
            {ollamaDisponible ? "🟢 CONECTADO" : "🔴 NO ENCONTRADO"}
          </span>
        </div>

        {/* Selectores */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={estiloLabelIA}>Modelo Multimodal de Visión:</label>
          <select
            value={ollamaModelo}
            onChange={(e) => setOllamaModelo(e.target.value)}
            style={estiloSelectIA}
          >
            <option value="llava">llava (Default Vision)</option>
            <option value="llama3.2-vision">llama3.2-vision</option>
            <option value="moondream">moondream</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={estiloLabelIA}>Intervalo de Fotogramas:</label>
          <select
            value={intervaloEscaneo}
            onChange={(e) => setIntervaloEscaneo(e.target.value)}
            style={estiloSelectIA}
          >
            <option value="manual">Manual (Sólo al presionar botón)</option>
            <option value="1000">Cada 1 Segundo</option>
            <option value="3000">Cada 3 Segundos</option>
            <option value="5000">Cada 5 Segundos</option>
          </select>
        </div>

        {/* AJUSTES AVANZADOS DE IA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderTop: "1px solid var(--color-borde)",
            paddingTop: 10,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Configuración Avanzada
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-texto-suave)" }}>
              <span>Temperatura de la IA:</span>
              <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{temperaturaIA}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={temperaturaIA}
              onChange={(e) => guardarAjusteIA("temperatura", Number(e.target.value))}
              style={{ accentColor: "var(--color-dorado)", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 9, color: "var(--color-texto-suave)" }}>Filtro de Detección:</label>
              <select
                value={filtroDeteccion}
                onChange={(e) => guardarAjusteIA("filtro", e.target.value)}
                style={estiloSelectMiniIA}
              >
                <option value="preciso">Precisión Máxima</option>
                <option value="balanceado">Balanceado</option>
                <option value="sensible">Sensibilidad Extrema</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 9, color: "var(--color-texto-suave)" }}>Tasa de Muestreo:</label>
              <select
                value={tasaMuestreo}
                onChange={(e) => guardarAjusteIA("tasa", Number(e.target.value))}
                style={estiloSelectMiniIA}
              >
                <option value={1}>1 fotograma / s</option>
                <option value={3}>3 fotogramas / s</option>
                <option value={5}>5 fotogramas / s</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={analizarFrameActual}
            disabled={ollamaEstado === "Analizando..." || barriendoIA}
            style={{
              ...estiloBotonIA,
              opacity: barriendoIA ? 0.5 : 1,
            }}
          >
            {ollamaEstado === "Analizando..." ? "Analizando..." : "Analizar Frame"}
          </button>

          <button
            onClick={toggleEscaneoIA}
            disabled={barriendoIA}
            style={{
              flex: 1,
              background: escaneoActivo ? "rgba(231,76,60,0.15)" : "rgba(39,174,96,0.15)",
              border: `1px solid ${escaneoActivo ? "var(--color-rojo-suave)" : "var(--color-exito)"}`,
              color: escaneoActivo ? "var(--color-rojo-suave)" : "var(--color-exito)",
              borderRadius: 6,
              padding: "8px 0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              opacity: barriendoIA ? 0.5 : 1,
            }}
          >
            {escaneoActivo ? "Detener IA" : "Escanear IA"}
          </button>
        </div>

        {/* Barrido Completo de Video */}
        <div
          style={{
            borderTop: "1px solid var(--color-borde)",
            paddingTop: 10,
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Barrido Completo de Video
          </span>

          {!barriendoIA ? (
            <>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "var(--color-texto-suave)", flexShrink: 0 }}>Paso de Barrido:</span>
                <select
                  value={stepBarrido}
                  onChange={(e) => setStepBarrido(Number(e.target.value))}
                  style={estiloSelectMiniIA}
                >
                  <option value="0.5">Cada 0.5 Segundos (Precisión Máxima)</option>
                  <option value="1.0">Cada 1.0 Segundo</option>
                  <option value="2.0">Cada 2.0 Segundos</option>
                  <option value="3.0">Cada 3.0 Segundos</option>
                </select>
              </div>
              <button
                onClick={iniciarBarridoIA}
                disabled={escaneoActivo}
                style={{
                  background: "var(--color-dorado-alfa)",
                  border: "1px solid var(--color-dorado)",
                  color: "var(--color-dorado)",
                  borderRadius: 6,
                  padding: "8px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: escaneoActivo ? 0.5 : 1,
                }}
              >
                🚀 Iniciar Barrido Automático
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-texto)" }}>
                <span>Progreso de Análisis:</span>
                <span style={{ fontWeight: 700 }}>{progresoBarrido}%</span>
              </div>
              <div
                style={{
                  background: "var(--color-superficie-2)",
                  height: 6,
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid var(--color-borde)",
                }}
              >
                <div
                  style={{
                    width: `${progresoBarrido}%`,
                    background: "var(--color-dorado)",
                    height: "100%",
                    borderRadius: 3,
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <button
                onClick={detenerBarridoIA}
                style={{
                  background: "rgba(231,76,60,0.15)",
                  border: "1px solid var(--color-rojo-suave)",
                  color: "var(--color-rojo-suave)",
                  borderRadius: 6,
                  padding: "8px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⏹️ Detener Barrido IA
              </button>
            </div>
          )}
        </div>

        {/* VEREDICTO ESTRATÉGICO EINSTEIN */}
        <div
          style={{
            borderTop: "1px solid var(--color-borde)",
            paddingTop: 10,
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Veredicto Estratégico
          </span>
          <button
            onClick={obtenerVeredictoEinstein}
            disabled={cargandoVeredicto || timeline.length === 0}
            style={{
              background: "var(--color-dorado-alfa)",
              border: "1px solid var(--color-dorado)",
              borderRadius: 6,
              color: "var(--color-dorado)",
              fontSize: 11,
              fontWeight: 700,
              padding: "8px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: timeline.length === 0 ? 0.5 : 1,
            }}
          >
            <Zap size={12} /> {cargandoVeredicto ? "Compilando..." : "Veredicto Estratégico Einstein"}
          </button>

          {veredictoEinstein && (
            <div
              style={{
                background: "var(--color-fondo)",
                border: "1px solid var(--color-borde)",
                borderRadius: 6,
                padding: 10,
                maxHeight: 150,
                overflowY: "auto",
                fontSize: 10,
                lineHeight: 1.5,
                color: "var(--color-texto-suave)",
                whiteSpace: "pre-wrap",
                fontStyle: cargandoVeredicto ? "italic" : "normal",
                fontFamily: "sans-serif",
              }}
            >
              {veredictoEinstein}
            </div>
          )}
        </div>
      </div>

      {/* Consola de Eventos IA */}
      <div
        style={{
          flex: 1,
          minHeight: 180,
          background: "var(--color-fondo)",
          border: "1px solid var(--color-borde)",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-texto-suave)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Consola Asistente IA
        </span>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontFamily: "monospace",
            fontSize: 10,
            color: "var(--color-texto-suave)",
          }}
        >
          {logsIA.length === 0 ? (
            <span style={{ fontStyle: "italic", opacity: 0.5 }}>Consola inactiva. Esperando análisis...</span>
          ) : (
            logsIA.map((log, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                  paddingBottom: 4,
                  color: log.includes("Golpe Detectado") ? "var(--color-exito)" : "var(--color-texto-suave)",
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

const estiloLabelIA = {
  fontSize: 10,
  color: "var(--color-texto-suave)",
  fontWeight: 600,
};

const estiloSelectIA = {
  background: "var(--color-fondo)",
  border: "1px solid var(--color-borde)",
  color: "var(--color-texto)",
  borderRadius: 6,
  padding: 6,
  fontSize: 11,
  outline: "none",
};

const estiloSelectMiniIA = {
  background: "var(--color-fondo)",
  border: "1px solid var(--color-borde)",
  color: "var(--color-texto)",
  borderRadius: 4,
  padding: 4,
  fontSize: 10,
  outline: "none",
};

const estiloBotonIA = {
  flex: 1,
  background: "var(--color-superficie-2)",
  border: "1px solid var(--color-borde)",
  color: "var(--color-texto)",
  borderRadius: 6,
  padding: "8px 0",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
