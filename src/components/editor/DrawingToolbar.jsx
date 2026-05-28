import { MousePointer2, PenTool, Minus, Circle, Type, Trash2 } from "lucide-react";

export default function DrawingToolbar({
  videoUrl,
  herramientaActiva,
  setHerramientaActiva,
  colorActivo,
  setColorActivo,
  tamanioLapiz,
  setTamanioLapiz,
  canvasInstance,
  colores = [],
  estilos = {},
}) {
  return (
    <div
      style={{
        ...estilos.barraDibujo,
        opacity: videoUrl ? 1 : 0.5,
        pointerEvents: videoUrl ? "auto" : "none",
      }}
    >
      <div style={estilos.grupoHerramientas}>
        <button
          style={
            herramientaActiva === "cursor"
              ? estilos.btnHerramientactivo || estilos.btnHerramientaActivo
              : estilos.btnHerramienta
          }
          onClick={() => setHerramientaActiva("cursor")}
          title="Cursor (1)"
        >
          <MousePointer2 size={18} />
        </button>
        <button
          style={
            herramientaActiva === "lapiz"
              ? estilos.btnHerramientactivo || estilos.btnHerramientaActivo
              : estilos.btnHerramienta
          }
          onClick={() => setHerramientaActiva("lapiz")}
          title="Lápiz (2)"
        >
          <PenTool size={18} />
        </button>
        <button
          style={
            herramientaActiva === "linea"
              ? estilos.btnHerramientactivo || estilos.btnHerramientaActivo
              : estilos.btnHerramienta
          }
          onClick={() => setHerramientaActiva("linea")}
          title="Línea"
        >
          <Minus size={18} />
        </button>
        <button
          style={
            herramientaActiva === "circulo"
              ? estilos.btnHerramientactivo || estilos.btnHerramientaActivo
              : estilos.btnHerramienta
          }
          onClick={() => setHerramientaActiva("circulo")}
          title="Círculo"
        >
          <Circle size={18} />
        </button>
        <button
          style={
            herramientaActiva === "texto"
              ? estilos.btnHerramientactivo || estilos.btnHerramientaActivo
              : estilos.btnHerramienta
          }
          onClick={() => setHerramientaActiva("texto")}
          title="Texto"
        >
          <Type size={18} />
        </button>
      </div>
      <div style={estilos.divisor}></div>
      <div style={estilos.grupoColores}>
        {colores.map((color) => (
          <button
            key={color}
            style={{
              ...estilos.btnColor,
              background: color,
              border:
                colorActivo === color ? "2px solid var(--color-texto)" : "none",
            }}
            onClick={() => setColorActivo(color)}
          />
        ))}
      </div>
      <div style={estilos.divisor}></div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 8px",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--color-texto-suave)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Grosor
        </span>
        <input
          type="range"
          min="1"
          max="20"
          value={tamanioLapiz}
          onChange={(e) => setTamanioLapiz(Number(e.target.value))}
          style={{
            width: 80,
            accentColor: "var(--color-dorado)",
            cursor: "pointer",
          }}
          title={`Grosor actual: ${tamanioLapiz}px`}
        />
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: "var(--color-dorado)",
            minWidth: 24,
            fontWeight: 700,
          }}
        >
          {tamanioLapiz}px
        </span>
      </div>
      <div style={estilos.divisor}></div>
      <button
        style={estilos.btnHerramienta}
        onClick={() => canvasInstance?.clear()}
        title="Limpiar Canvas"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
