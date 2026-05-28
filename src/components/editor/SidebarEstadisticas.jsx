import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export default function SidebarEstadisticas({
  statsBoxeador = { resumen: { eficacia: 0, volumen: 0, defensas: 0 }, counts: {} },
  filtroEstadisticasRound,
  setFiltroEstadisticasRound,
  totalRounds = 12,
}) {
  return (
    <motion.div
      key="stats"
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
        gap: 16,
      }}
    >
      {/* SELECTOR DE ROUND PARA ESTADÍSTICAS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.02)",
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--color-borde)",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dorado)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Filtrar Asalto:
        </span>
        <select
          value={filtroEstadisticasRound}
          onChange={(e) => setFiltroEstadisticasRound(e.target.value)}
          style={{
            background: "var(--color-superficie-2)",
            border: "1px solid var(--color-borde)",
            borderRadius: 6,
            color: "var(--color-texto)",
            fontSize: 11,
            padding: "4px 8px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="todos">Combate Completo</option>
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => (
            <option key={r} value={r.toString()}>
              Round {r}
            </option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        <div style={estiloKpiCard}>
          <div style={estiloKpiLabel}>Eficacia Ofensiva</div>
          <div style={{ ...estiloKpiValor, color: "var(--color-exito)" }}>
            {statsBoxeador.resumen.eficacia}%
          </div>
        </div>
        <div style={estiloKpiCard}>
          <div style={estiloKpiLabel}>Volumen Golpes</div>
          <div style={estiloKpiValor}>{statsBoxeador.resumen.volumen}</div>
        </div>
        <div style={estiloKpiCard}>
          <div style={estiloKpiLabel}>Defensas Totales</div>
          <div style={estiloKpiValor}>{statsBoxeador.resumen.defensas}</div>
        </div>
      </div>

      {/* ANÁLISIS DE MANOS */}
      <div
        style={{
          background: "var(--color-superficie)",
          border: "1px solid var(--color-borde)",
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 800,
            color: "var(--color-dorado)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            paddingBottom: 6,
          }}
        >
          🥊 Análisis Táctico de Manos
        </h4>

        {(() => {
          const adel = statsBoxeador.counts?.adelantadaLanzados || 0;
          const atras = statsBoxeador.counts?.atrasadaLanzados || 0;
          const totalManos = adel + atras;
          const pctAdel = totalManos > 0 ? Math.round((adel / totalManos) * 100) : 50;
          const pctAtras = totalManos > 0 ? Math.round((atras / totalManos) * 100) : 50;

          // Eficacia por mano
          const adelCon = statsBoxeador.counts?.adelantadaConectados || 0;
          const adelErr = statsBoxeador.counts?.adelantadaErrados || 0;
          const adelEfic = (adelCon + adelErr) > 0 ? Math.round((adelCon / (adelCon + adelErr)) * 100) : 0;

          const atrasCon = statsBoxeador.counts?.atrasadaConectados || 0;
          const atrasErr = statsBoxeador.counts?.atrasadaErrados || 0;
          const atrasEfic = (atrasCon + atrasErr) > 0 ? Math.round((atrasCon / (atrasCon + atrasErr)) * 100) : 0;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Barra Dual Estilo Premium */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700 }}>
                  <span style={{ color: "var(--color-dorado)" }}>Adelantada ({pctAdel}%)</span>
                  <span style={{ color: "var(--color-azul-suave)" }}>Atrasada ({pctAtras}%)</span>
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--color-borde)",
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pctAdel}%`,
                      background: "linear-gradient(90deg, var(--color-dorado) 0%, #B3923B 100%)",
                      height: "100%",
                      transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                  <div
                    style={{
                      width: `${pctAtras}%`,
                      background: "linear-gradient(90deg, #1f72b6 0%, var(--color-azul-suave) 100%)",
                      height: "100%",
                      transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
              </div>

              {/* Detalles por Mano */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: 10 }}>
                {/* Mano Adelantada */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--color-texto-muted)", textTransform: "uppercase" }}>Mano Adelantada</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-texto)" }}>{adel}</span>
                    <span style={{ fontSize: 9, color: "var(--color-texto-suave)" }}>lanzados</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", fontSize: 9, color: "var(--color-texto-suave)", gap: 1 }}>
                    <div>Conectados: <strong style={{ color: "var(--color-exito)" }}>{adelCon}</strong></div>
                    <div>Eficacia: <strong style={{ color: "var(--color-exito)" }}>{adelEfic}%</strong></div>
                    {statsBoxeador.counts?.adelantadaFintas > 0 && (
                      <div>Fintas: <strong style={{ color: "#9B59B6" }}>{statsBoxeador.counts?.adelantadaFintas}</strong></div>
                    )}
                  </div>
                </div>

                {/* Mano Atrasada */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: 12 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--color-texto-muted)", textTransform: "uppercase" }}>Mano Atrasada</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-texto)" }}>{atras}</span>
                    <span style={{ fontSize: 9, color: "var(--color-texto-suave)" }}>lanzados</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", fontSize: 9, color: "var(--color-texto-suave)", gap: 1 }}>
                    <div>Conectados: <strong style={{ color: "var(--color-exito)" }}>{atrasCon}</strong></div>
                    <div>Eficacia: <strong style={{ color: "var(--color-exito)" }}>{atrasEfic}%</strong></div>
                    {statsBoxeador.counts?.atrasadaFintas > 0 && (
                      <div>Fintas: <strong style={{ color: "#9B59B6" }}>{statsBoxeador.counts?.atrasadaFintas}</strong></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <hr
        style={{
          borderColor: "var(--color-borde)",
          borderStyle: "solid",
          borderWidth: "1px 0 0 0",
        }}
      />

      <h4
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--color-dorado)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Conteo de Acciones
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {[
          { label: "Jab", val: statsBoxeador.counts?.Jab || 0, color: "var(--color-dorado)" },
          { label: "Recto", val: statsBoxeador.counts?.Recto || 0, color: "var(--color-dorado)" },
          { label: "Cross", val: statsBoxeador.counts?.Cross || 0, color: "var(--color-dorado)" },
          { label: "Gancho", val: statsBoxeador.counts?.Gancho || 0, color: "var(--color-dorado)" },
          { label: "Uppercut", val: statsBoxeador.counts?.Uppercut || 0, color: "var(--color-dorado)" },
          { label: "Swing", val: statsBoxeador.counts?.Swing || 0, color: "var(--color-dorado)" },
          { label: "Finta", val: statsBoxeador.counts?.Finta || 0, color: "var(--color-azul-suave)" },
          { label: "Esquiva", val: statsBoxeador.counts?.Esquiva || 0, color: "var(--color-azul-suave)" },
          { label: "Bloqueo", val: statsBoxeador.counts?.Bloqueo || 0, color: "var(--color-azul-suave)" },
          { label: "Clinch", val: statsBoxeador.counts?.Clinch || 0, color: "var(--color-azul-suave)" },
          { label: "Pivoteo", val: statsBoxeador.counts?.Pivoteo || 0, color: "var(--color-azul-suave)" },
          { label: "Marca General", val: statsBoxeador.counts?.["Marca General"] || 0, color: "var(--color-azul-suave)" },
        ].map((action) => (
          <div
            key={action.label}
            style={{
              background: "var(--color-superficie)",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-borde)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--color-texto-suave)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {action.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: action.color,
                }}
              >
                {action.val}
              </span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                height: 4,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: action.color,
                  width: `${Math.min((action.val / Math.max(statsBoxeador.resumen.volumen, 1)) * 100, 100)}%`,
                  height: "100%",
                  borderRadius: 2,
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 10,
          color: "var(--color-texto-suave)",
          fontStyle: "italic",
          textAlign: "center",
          marginTop: 10,
        }}
      >
        💡 Las métricas de volumen, eficacia y el conteo de acciones se actualizan dinámicamente en tiempo real a medida que etiquetas eventos en la línea de tiempo.
      </div>
    </motion.div>
  );
}

const estiloKpiCard = {
  background: "var(--color-superficie)",
  padding: 10,
  borderRadius: 8,
  textAlign: "center",
  border: "1px solid var(--color-borde)",
};

const estiloKpiLabel = {
  fontSize: 9,
  color: "var(--color-texto-suave)",
  textTransform: "uppercase",
};

const estiloKpiValor = {
  fontSize: 20,
  fontWeight: 900,
  color: "var(--color-texto)",
  marginTop: 4,
};
