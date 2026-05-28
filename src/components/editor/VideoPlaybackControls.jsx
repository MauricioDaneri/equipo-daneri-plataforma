import { SkipBack, Play, Pause, SkipForward, ExternalLink } from "lucide-react";

export default function VideoPlaybackControls({
  videoUrl,
  isPlaying,
  togglePlay,
  currentTime,
  saltar,
  visorDetachadoAbierto,
  abrirVisorDetachado,
  capaDibujoVisible,
  setCapaDibujoVisible,
  estilos = {}
}) {

  const formatTime = (segundos) => {
    if (segundos === undefined || segundos === null || isNaN(segundos)) return "0:00";
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        ...estilos.playbackBar,
        opacity: videoUrl ? 1 : 0.5,
        pointerEvents: videoUrl ? "auto" : "none",
      }}
    >
      <button style={estilos.btnPlayback} onClick={() => saltar(-5)}>
        <SkipBack size={20} />
      </button>
      <button style={estilos.btnPlayMain} onClick={togglePlay}>
        {isPlaying ? (
          <Pause size={24} color="var(--color-fondo)" />
        ) : (
          <Play
            size={24}
            color="var(--color-fondo)"
            style={{ marginLeft: 4 }}
          />
        )}
      </button>
      <button style={estilos.btnPlayback} onClick={() => saltar(5)}>
        <SkipForward size={20} />
      </button>
      <div style={estilos.timeDisplay}>{formatTime(currentTime)}</div>

      <div style={{ flex: 1 }}></div>

      {visorDetachadoAbierto && (
        <button
          className="boton-secundario"
          onClick={abrirVisorDetachado}
          style={{
            fontSize: 12,
            padding: "4px 12px",
            marginRight: 8,
            borderColor: "var(--color-dorado)",
            color: "var(--color-dorado)",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          <ExternalLink size={12} style={{ transform: "rotate(180deg)" }} />
          Acoplar Video
        </button>
      )}

      <button
        className="boton-secundario"
        onClick={() => setCapaDibujoVisible(!capaDibujoVisible)}
        style={{ fontSize: 12, padding: "4px 12px" }}
      >
        {capaDibujoVisible ? "Ocultar Trazos" : "Mostrar Trazos"}
      </button>
    </div>
  );
}
