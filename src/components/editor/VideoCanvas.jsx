export default function VideoCanvas({
  videoUrl,
  capaDibujoVisible,
  panelActivo,
  herramientaActiva,
  canvasRef,
  estilos = {},
}) {
  return (
    <div
      style={{
        ...estilos.canvasElement,
        display: videoUrl ? "block" : "none",
        pointerEvents:
          videoUrl &&
          capaDibujoVisible &&
          panelActivo !== "mapa" &&
          herramientaActiva !== "cursor"
            ? "auto"
            : "none",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
