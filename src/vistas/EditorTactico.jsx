import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fabric } from "fabric";
import {
  FileText,
  Play,
  Pause,
  Save,
  SkipBack,
  SkipForward,
  Trash2,
  Video,
  Maximize,
  ExternalLink,
  Target,
  Zap,
  MousePointer2,
  PenTool,
  Minus,
  Circle,
  Type,
  Timer,
  Download,
  Upload,
  Mic,
  MicOff,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  Cpu,
  BarChart3,
  Database,
  HelpCircle,
  ChevronDown,
  History,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, realizarRespaldoAutomatico } from "../servicios/db";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechControl } from "../hooks/useSpeechControl";
import { useModal } from "../context/ModalContext";
import VideoTimelineOverlay from "../components/editor/VideoTimelineOverlay";
import MapaImpactos from "../components/graficos/MapaImpactos";
import { clasificarPerfiles } from "../utils/perfilesBoxeo";
import {
  analizarFrameConOllama,
  verificarOllama,
  consultarVeredictoEinstein,
} from "../servicios/ollama";

const ACCIONES_FILA_1 = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"];
const ACCIONES_FILA_2 = [
  "Finta",
  "Esquiva",
  "Bloqueo",
  "Clinch",
  "Pivoteo",
  "Marca General",
];
const ESTADOS_FISICOS = [];
const COLORES = [
  "#E74C3C", // Rojo
  "#D4AF37", // Dorado
  "#F0F0F0", // Blanco / Texto
  "#3498DB", // Azul
];

const defaultHotkeys = {
  RinconRojo: "KeyQ",
  RinconAzul: "KeyW",
  Jab: "KeyJ",
  Recto: "KeyR",
  Cross: "KeyC",
  Gancho: "KeyG",
  Uppercut: "KeyU",
  Swing: "KeyS",
  Finta: "KeyF",
  Esquiva: "KeyE",
  Bloqueo: "KeyB",
  Clinch: "KeyK",
  Pivoteo: "KeyP",
  "Marca General": "KeyM",
  PlayPause: "Space",
  Atras: "ArrowLeft",
  Adelante: "ArrowRight",
  Cursor: "Digit1",
  Lapiz: "Digit2",
};

const formatearTecla = (code) => {
  if (!code) return "";
  if (code.startsWith("Key")) return code.replace("Key", "");
  if (code.startsWith("Digit")) return code.replace("Digit", "");
  if (code === "Space") return "Espacio";
  if (code === "ArrowLeft") return "←";
  if (code === "ArrowRight") return "→";
  return code;
};

function CustomDropdown({ label, value, onChange, boxeadores, cornerColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedBoxer = boxeadores.find(
    (b) => b.id.toString() === value?.toString(),
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--color-superficie-2)",
          padding: "6px 14px",
          borderRadius: 20,
          border: `1px solid ${isOpen ? cornerColor : "var(--color-borde)"}`,
          boxShadow: isOpen ? `0 0 8px ${cornerColor}30` : "none",
          color: "var(--color-texto)",
          cursor: "pointer",
          transition: "all 0.25s ease",
          outline: "none",
          minWidth: 180,
          textAlign: "left",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: cornerColor,
              boxShadow: `0 0 5px ${cornerColor}`,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 8,
                color: "var(--color-texto-suave)",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>
              {selectedBoxer ? selectedBoxer.nombre : "Seleccionar..."}
            </span>
          </div>
        </div>
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s ease",
            color: "var(--color-texto-suave)",
          }}
        />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "115%",
              left: 0,
              right: 0,
              background: "rgba(20, 20, 20, 0.96)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--color-borde)",
              borderRadius: 10,
              padding: 4,
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              zIndex: 999,
              maxHeight: 220,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                color: "var(--color-texto-suave)",
                transition: "background 0.2s",
                background: !value ? "rgba(255,255,255,0.04)" : "transparent",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "rgba(255,255,255,0.06)")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = !value
                  ? "rgba(255,255,255,0.04)"
                  : "transparent")
              }
            >
              Seleccionar Boxeador...
            </div>
            {boxeadores.map((b) => {
              const isSel = b.id.toString() === value?.toString();
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    onChange(b.id.toString());
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    background: isSel ? `${cornerColor}15` : "transparent",
                    borderLeft: `2.5px solid ${isSel ? cornerColor : "transparent"}`,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = isSel
                      ? `${cornerColor}25`
                      : "rgba(255,255,255,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isSel
                      ? `${cornerColor}15`
                      : "transparent")
                  }
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isSel
                        ? "var(--color-texto)"
                        : "var(--color-texto-suave)",
                    }}
                  >
                    {b.nombre}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--color-texto-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {b.categoriaPeso} {b.estancia ? `· ${b.estancia}` : ""}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}

export default function EditorTactico() {
  const { mostrarConfirmacion, mostrarAlerta } = useModal()
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);

  // Navegación y Parámetros
  const { id } = useParams();
  const navigate = useNavigate();

  // Datos de Boxeadores y Configuración de la DB
  const boxeadoresDb = useLiveQuery(() => db.boxeadores.toArray()) || [];
  const configuracion = useLiveQuery(() => db.configuracion.get(1));
  const hotkeys = { ...defaultHotkeys, ...(configuracion?.hotkeys || {}) };

  // Ajustes de IA persistentes
  useEffect(() => {
    if (configuracion) {
      if (configuracion.temperaturaIA !== undefined)
        setTemperaturaIA(configuracion.temperaturaIA);
      if (configuracion.filtroDeteccion !== undefined)
        setFiltroDeteccion(configuracion.filtroDeteccion);
      if (configuracion.tasaMuestreo !== undefined)
        setTasaMuestreo(configuracion.tasaMuestreo);
    }
  }, [configuracion]);

  // Guardar última sesión activa en localStorage para persistencia en barra lateral
  useEffect(() => {
    if (id) {
      localStorage.setItem('equipo_daneri_last_active_session_id', id);
    }
  }, [id]);

  const guardarAjusteIA = async (tipo, valor) => {
    if (!configuracion) return;
    try {
      if (tipo === "temperatura") {
        setTemperaturaIA(valor);
        await db.configuracion.update(1, { temperaturaIA: valor });
      } else if (tipo === "filtro") {
        setFiltroDeteccion(valor);
        await db.configuracion.update(1, { filtroDeteccion: valor });
      } else if (tipo === "tasa") {
        setTasaMuestreo(valor);
        await db.configuracion.update(1, { tasaMuestreo: valor });
      }
    } catch (e) {
      console.error("[Configuracion] Error al guardar ajuste de IA:", e);
    }
  };

  // Estado de Sesión
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoAbsolutePath, setVideoAbsolutePath] = useState("");
  const [videoNombre, setVideoNombre] = useState("");
  const [videoFaltante, setVideoFaltante] = useState(false);
  const [boxeadorRojoId, setBoxeadorRojoId] = useState("");
  const [boxeadorAzulId, setBoxeadorAzulId] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Estados del Reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [bucleRango, setBucleRango] = useState(null); // { start, end } de bucle táctico de 10s around marker
  const [bucleEventoId, setBucleEventoId] = useState(null); // ID del evento que está en bucle táctico

  // Estados de Dibujo
  const [canvasInstance, setCanvasInstance] = useState(null);
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [colorActivo, setColorActivo] = useState(COLORES[0]);
  const [teclaActiva, setTeclaActiva] = useState(null);
  const [capaDibujoVisible, setCapaDibujoVisible] = useState(true);
  const [panelActivo, setPanelActivo] = useState("timeline");
  const [sidebarExpandido, setSidebarExpandido] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // --- Undo/Redo History States ---
  const [historialPasado, setHistorialPasado] = useState([]);
  const [historialFuturo, setHistorialFuturo] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const timelineRef = useRef([]);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(null);
  const eventoSeleccionadoIdRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isHistoryLoadingRef = useRef(false);
  const isSyncingFromViewerRef = useRef(false);

  useEffect(() => {
    eventoSeleccionadoIdRef.current = eventoSeleccionadoId;
  }, [eventoSeleccionadoId]);

  // Redirigir a "timeline" si se selecciona un evento que no sea golpe (no-mappable) y el panel "mapa" está activo
  useEffect(() => {
    if (eventoSeleccionadoId) {
      const ev = timeline.find(e => e.id === eventoSeleccionadoId);
      if (ev) {
        const esGolpe = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(ev.tipo);
        if (!esGolpe && panelActivo === "mapa") {
          setPanelActivo("timeline");
        }
      }
    }
  }, [eventoSeleccionadoId, timeline, panelActivo]);

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  const [tamanioLapiz, setTamanioLapiz] = useState(4);
  const [objetosDibujo, setObjetosDibujo] = useState([]);

  const eventosConNumero = useMemo(() => {
    const ordenados = [...timeline].sort((a, b) => a.timestamp - b.timestamp);
    const conteo = {};
    return ordenados.map((ev) => {
      if (!conteo[ev.tipo]) conteo[ev.tipo] = 0;
      conteo[ev.tipo]++;
      return { ...ev, _numero: conteo[ev.tipo] };
    });
  }, [timeline]);

  // --- Clean Analysis Mode ---
  const [analisisLimpio, setAnalisisLimpio] = useState(false);

  // --- Ollama Vision HUD & Scanning ---
  const [ollamaModelo, setOllamaModelo] = useState("llava");
  const [ollamaEstado, setOllamaEstado] = useState("Inactivo");
  const [ollamaDisponible, setOllamaDisponible] = useState(false);
  const [intervaloEscaneo, setIntervaloEscaneo] = useState("manual");
  const [logsIA, setLogsIA] = useState([]);
  const timerIA = useRef(null);
  const escaneoActivoRef = useRef(false);

  // --- Ollama Full-Video Batch Sweep ---
  const [barriendoIA, setBarriendoIA] = useState(false);
  const [progresoBarrido, setProgresoBarrido] = useState(0);
  const [stepBarrido, setStepBarrido] = useState(1.0);
  const barriendoRef = useRef(false);

  // --- Sincronización de Rondas y Video ---
  const [totalRounds, setTotalRounds] = useState(12);
  const [roundStarts, setRoundStarts] = useState({
    1: 0,
    2: 240,
    3: 480,
    4: 720,
    5: 960,
    6: 1200,
    7: 1440,
    8: 1680,
    9: 1920,
    10: 2160,
    11: 2400,
    12: 2640,
  });
  const [mostrarMenuSincronizacion, setMostrarMenuSincronizacion] =
    useState(false);
  const [estadoRound, setEstadoRound] = useState("COMBATE"); // 'COMBATE' | 'DESCANSO'

  // --- Popup de Edición Interactiva ---
  const [eventoAEditar, setEventoAEditar] = useState(null);
  const [mostrarModalBorrador, setMostrarModalBorrador] = useState(false);
  const [borradorGuardado, setBorradorGuardado] = useState(null);

  // --- Modales Personalizados (sin alert/confirm nativos) ---
  const [modalInfo, setModalInfo] = useState(null); // { tipo, titulo, mensaje, onConfirm, onCancel, extra }
  const [guardandoProgreso, setGuardandoProgreso] = useState(false);
  const [confirmarFinalizarPendiente, setConfirmarFinalizarPendiente] = useState(false);

  // --- Asistente Einstein Ajustes Avanzados ---
  const [temperaturaIA, setTemperaturaIA] = useState(0.4);
  const [filtroDeteccion, setFiltroDeteccion] = useState("balanceado");
  const [tasaMuestreo, setTasaMuestreo] = useState(3);
  const [cargandoVeredicto, setCargandoVeredicto] = useState(false);
  const [veredictoEinstein, setVeredictoEinstein] = useState("");

  // --- Manual del Analista Táctico ---
  const [mostrarManual, setMostrarManual] = useState(false);
  const [manualTab, setManualTab] = useState("timeline");

  // --- Speech Narrator ---
  const [esquinaDestino, setEsquinaDestino] = useState("roja"); // 'roja' | 'azul'

  // --- Capture base64 snapshot from video player ---
  const capturarFrameBase64 = () => {
    if (!videoRef.current) return "";
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.6); // 60% quality
      }
    } catch (err) {
      console.error("Error al capturar frame:", err);
    }
    return "";
  };

  // --- Save drawing to event ---
  const guardarDibujoEnEvento = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const selId = eventoSeleccionadoIdRef.current;
    const actualTimeline = timelineRef.current || [];

    if (selId) {
      setTimeline(
        actualTimeline.map((ev) => {
          if (ev.id === selId) {
            return { ...ev, canvasData: json };
          }
          return ev;
        }),
      );
    } else {
      const tiempoReal = videoRef.current ? videoRef.current.currentTime : 0;
      let closest = null;
      let minDiff = 2; // max 2 segundos

      actualTimeline.forEach((ev) => {
        const diff = Math.abs(ev.timestamp - tiempoReal);
        if (diff < minDiff) {
          minDiff = diff;
          closest = ev.id;
        }
      });

      if (closest) {
        setTimeline(
          actualTimeline.map((ev) => {
            if (ev.id === closest) {
              return { ...ev, canvasData: json };
            }
            return ev;
          }),
        );
      }
    }
  }, []);

  // --- Check if event has drawings ---
  const tieneDibujo = (ev) => {
    if (!ev.canvasData) return false;
    try {
      const data = JSON.parse(ev.canvasData);
      return data.objects && data.objects.length > 0;
    } catch (e) {
      return false;
    }
  };

  // --- Suggest tags based on comments ---
  const sugerirEtiquetasDeAudio = () => {
    const log = obtenerLogCompleto ? obtenerLogCompleto() : [];
    const sugeradas = new Set();

    log.forEach((item) => {
      const text = item.texto.toLowerCase();
      if (text.includes("jab")) sugeradas.add("Jab");
      if (text.includes("recto")) sugeradas.add("Recto");
      if (text.includes("cross") || text.includes("cruzado"))
        sugeradas.add("Cross");
      if (text.includes("gancho") || text.includes("hook"))
        sugeradas.add("Gancho");
      if (text.includes("uppercut") || text.includes("upper"))
        sugeradas.add("Uppercut");
      if (text.includes("swing")) sugeradas.add("Swing");
      if (text.includes("finta")) sugeradas.add("Finta");
      if (text.includes("esquiva") || text.includes("esquiv"))
        sugeradas.add("Esquiva");
      if (text.includes("bloqueo") || text.includes("bloque"))
        sugeradas.add("Bloqueo");
      if (text.includes("clinch")) sugeradas.add("Clinch");
      if (text.includes("pivote")) sugeradas.add("Pivoteo");
    });

    // Si no hay, sugerimos algunas por defecto
    if (sugeradas.size === 0) {
      sugeradas.add("Jab");
      sugeradas.add("Cross");
      sugeradas.add("Esquiva");
      sugeradas.add("Clinch");
    }

    return Array.from(sugeradas);
  };

  // --- Push state to Undo/Redo stack ---
  const pushStateToHistory = useCallback((customTimeline = null) => {
    const currentTimeline = customTimeline || timelineRef.current || [];
    const currentCanvasData = fabricCanvasRef.current
      ? JSON.stringify(fabricCanvasRef.current.toJSON())
      : null;

    setHistorialPasado((prev) =>
      [
        ...prev,
        {
          timeline: JSON.parse(JSON.stringify(currentTimeline)),
          canvasData: currentCanvasData,
        },
      ].slice(-50),
    );
    setHistorialFuturo([]);
  }, []);

  const [visorDetachadoAbierto, setVisorDetachadoAbierto] = useState(false);
  const [panelAccionesDesacoplado, setPanelAccionesDesacoplado] = useState(false);

  const abrirVisorDetachado = async () => {
    if (window?.api?.video) {
      if (visorDetachadoAbierto) {
        if (window.api.video.cerrarVisorDetachado) {
          await window.api.video.cerrarVisorDetachado();
        }
        setVisorDetachadoAbierto(false);
      } else {
        if (window.api.video.abrirVisorDetachado) {
          const result = await window.api.video.abrirVisorDetachado();
          if (result?.ok) setVisorDetachadoAbierto(true);
        }
      }
    }
  };
  const handleUndo = useCallback(() => {
    if (historialPasado.length === 0) return;

    const currentTimeline = timelineRef.current || [];
    const currentCanvasData = fabricCanvasRef.current
      ? JSON.stringify(fabricCanvasRef.current.toJSON())
      : null;

    const anterior = historialPasado[historialPasado.length - 1];
    setHistorialPasado((prev) => prev.slice(0, -1));
    setHistorialFuturo((prev) => [
      ...prev,
      {
        timeline: JSON.parse(JSON.stringify(currentTimeline)),
        canvasData: currentCanvasData,
      },
    ]);

    setTimeline(anterior.timeline);

    if (fabricCanvasRef.current && anterior.canvasData) {
      isHistoryLoadingRef.current = true;
      fabricCanvasRef.current.loadFromJSON(
        JSON.parse(anterior.canvasData),
        () => {
          fabricCanvasRef.current.renderAll();
          isHistoryLoadingRef.current = false;
          actualizarObjetosDibujo();
        },
      );
    }

    playFeedbackSound(600, 0.08);
  }, [historialPasado]);

  const handleRedo = useCallback(() => {
    if (historialFuturo.length === 0) return;

    const currentTimeline = timelineRef.current || [];
    const currentCanvasData = fabricCanvasRef.current
      ? JSON.stringify(fabricCanvasRef.current.toJSON())
      : null;

    const siguiente = historialFuturo[historialFuturo.length - 1];
    setHistorialFuturo((prev) => prev.slice(0, -1));
    setHistorialPasado((prev) => [
      ...prev,
      {
        timeline: JSON.parse(JSON.stringify(currentTimeline)),
        canvasData: currentCanvasData,
      },
    ]);

    setTimeline(siguiente.timeline);

    if (fabricCanvasRef.current && siguiente.canvasData) {
      isHistoryLoadingRef.current = true;
      fabricCanvasRef.current.loadFromJSON(
        JSON.parse(siguiente.canvasData),
        () => {
          fabricCanvasRef.current.renderAll();
          isHistoryLoadingRef.current = false;
          actualizarObjetosDibujo();
        },
      );
    }

    playFeedbackSound(1000, 0.08);
  }, [historialFuturo]);

  // --- Real-time statistics derived state ---
  const statsBoxeador = useMemo(() => {
    return clasificarPerfiles(timeline, esquinaDestino);
  }, [timeline, esquinaDestino]);

  // --- Speech (STT) Setup ---
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "es-ES";

      recognition.onresult = (event) => {
        const text =
          event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("[STT] Reconocido:", text);

        const esquina = text.includes("azul") ? "azul" : "roja";

        if (text.includes("jab")) registrarEvento("Jab", esquina);
        else if (text.includes("cross") || text.includes("recto"))
          registrarEvento("Cross", esquina);
        else if (text.includes("gancho")) registrarEvento("Gancho", esquina);
        else if (text.includes("upper") || text.includes("ascendente"))
          registrarEvento("Uppercut", esquina);
        else if (text.includes("clinch")) registrarEvento("Clinch", esquina);
        else if (text.includes("esquiva")) registrarEvento("Esquiva", esquina);
      };

      recognition.onend = () => {
        if (listening) recognition.start();
      };

      recognitionRef.current = recognition;
    }
  }, [listening]);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  // --- Synthetic Audio Feedback ---
  const playFeedbackSound = (freq = 880, duration = 0.05) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + duration,
      );

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext no soportado o bloqueado");
    }
  };

  // --- Real-time Intensity Indicator ---
  const intensidadRT = useMemo(() => {
    if (timeline.length < 2) return { intensidad: 0, epm: 0, fase: "N/A" };

    const ultimoT =
      timeline[timeline.length - 1].timestamp ||
      timeline[timeline.length - 1].tiempoVideo;
    const ventana = timeline.filter((ev) => {
      const t = ev.timestamp || ev.tiempoVideo;
      return t > ultimoT - 60;
    });

    const epm = ventana.length;
    const intensidad = Math.min(Math.round((epm / 40) * 100), 100);

    return {
      intensidad,
      epm,
      fase:
        intensidad > 70
          ? "Alta Presión"
          : intensidad > 40
            ? "Estable"
            : "Estudio",
    };
  }, [timeline]);

  // Cronómetro de Round
  const [duracionRound, setDuracionRound] = useState(180);
  const [tiempoRound, setTiempoRound] = useState(180);
  const [roundActual, setRoundActual] = useState(1);
  const [cronActivo, setCronActivo] = useState(false);
  const cronRef = useRef(null);

  // --- Sincronización de video con visor desacoplado por Electron IPC ---
  // Refs de estado para evitar cierres de ámbito (React closures) en el callback de IPC
  const videoUrlRef = useRef("");
  const videoFileRef = useRef(null);
  const roundActualRef = useRef(1);
  const timelineRefTemp = useRef([]);
  const herramientaActivaRef = useRef("cursor");
  const colorActivoRef = useRef("#e74c3c");

  useEffect(() => { 
    videoUrlRef.current = videoUrl; 
    if (!videoUrl) setVideoDuration(0);
  }, [videoUrl]);
  useEffect(() => { videoFileRef.current = videoFile; }, [videoFile]);
  useEffect(() => { roundActualRef.current = roundActual; }, [roundActual]);
  useEffect(() => { timelineRefTemp.current = timeline; }, [timeline]);
  useEffect(() => { herramientaActivaRef.current = herramientaActiva; }, [herramientaActiva]);
  useEffect(() => { colorActivoRef.current = colorActivo; }, [colorActivo]);

  const canvasSyncTimeoutRef = useRef(null);
  const enviarActualizacionCanvas = useCallback(() => {
    if (isSyncingFromViewerRef.current) return;
    if (canvasSyncTimeoutRef.current) clearTimeout(canvasSyncTimeoutRef.current);
    canvasSyncTimeoutRef.current = setTimeout(() => {
      if (isSyncingFromViewerRef.current) return;
      if (window.api && window.api.video && fabricCanvasRef.current) {
        window.api.video.enviarMensajeSync({
          type: 'CANVAS_UPDATE',
          payload: { 
            canvasData: JSON.stringify(fabricCanvasRef.current.toJSON()),
            width: fabricCanvasRef.current.width,
            height: fabricCanvasRef.current.height
          }
        });
      }
    }, 50);
  }, []);

  const actualizarObjetosDibujo = useCallback(() => {
    if (fabricCanvasRef.current) {
      const objs = fabricCanvasRef.current.getObjects().map((obj, i) => {
        if (!obj.id) obj.id = `stroke_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`;
        if (!obj.label) {
          obj.label = obj.type === 'path'
            ? `Trazado ${i + 1}`
            : obj.type === 'text'
              ? `Texto: "${obj.text.substring(0, 10)}..."`
              : `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)} ${i + 1}`;
        }
        return {
          id: obj.id,
          label: obj.label,
          type: obj.type,
          visible: obj.visible !== false,
          color: obj.stroke || obj.fill || '#fff'
        };
      });
      setObjetosDibujo(objs);
    } else {
      setObjetosDibujo([]);
    }
  }, []);

  const toggleVisibilidadObjeto = useCallback((id) => {
    if (fabricCanvasRef.current) {
      const obj = fabricCanvasRef.current.getObjects().find(o => o.id === id);
      if (obj) {
        obj.visible = !obj.visible;
        fabricCanvasRef.current.renderAll();
        pushStateToHistory();
        enviarActualizacionCanvas();
        actualizarObjetosDibujo();
      }
    }
  }, [pushStateToHistory, enviarActualizacionCanvas, actualizarObjetosDibujo]);

  const eliminarObjetoDibujo = useCallback((id) => {
    if (fabricCanvasRef.current) {
      const obj = fabricCanvasRef.current.getObjects().find(o => o.id === id);
      if (obj) {
        fabricCanvasRef.current.remove(obj);
        fabricCanvasRef.current.renderAll();
        pushStateToHistory();
        enviarActualizacionCanvas();
        actualizarObjetosDibujo();
      }
    }
  }, [pushStateToHistory, enviarActualizacionCanvas, actualizarObjetosDibujo]);

  const renombrarObjetoDibujo = useCallback((id, nuevoNombre) => {
    if (fabricCanvasRef.current) {
      const obj = fabricCanvasRef.current.getObjects().find(o => o.id === id);
      if (obj) {
        obj.label = nuevoNombre;
        pushStateToHistory();
        enviarActualizacionCanvas();
        actualizarObjetosDibujo();
      }
    }
  }, [pushStateToHistory, enviarActualizacionCanvas, actualizarObjetosDibujo]);


  useEffect(() => {
    if (!window.api || !window.api.video) return;

    // Escuchar mensajes del visor desacoplado
    const limpiarListener = window.api.video.onMensajeDesdeViewer((message) => {
      const { type, payload } = message;
      if (type === 'VIEWER_READY') {
        // El visor está listo, enviamos el estado actual
        if (videoUrlRef.current) {
          window.api.video.enviarMensajeSync({
            type: 'VIDEO_LOADED',
            payload: { url: videoUrlRef.current, nombre: videoFileRef.current?.name || 'Video' },
          });
        }
        window.api.video.enviarMensajeSync({
          type: 'ROUND_UPDATE',
          payload: { round: roundActualRef.current },
        });
        window.api.video.enviarMensajeSync({
          type: 'EVENTOS_UPDATE',
          payload: { eventos: timelineRefTemp.current },
        });
        window.api.video.enviarMensajeSync({
          type: 'DRAWING_TOOL_UPDATE',
          payload: { 
            herramientaActiva: herramientaActivaRef.current, 
            colorActivo: colorActivoRef.current 
          }
        });
        // Si el canvas tiene objetos, sincronizarlos
        if (fabricCanvasRef.current) {
          window.api.video.enviarMensajeSync({
            type: 'CANVAS_UPDATE',
            payload: {
              canvasData: JSON.stringify(fabricCanvasRef.current.toJSON()),
              width: fabricCanvasRef.current.width,
              height: fabricCanvasRef.current.height
            }
          });
        }
        setVisorDetachadoAbierto(true);
      }
      if (type === 'SEEK_FROM_VIEWER') {
        if (videoRef.current) {
          console.log("[EditorTactico] SEEK_FROM_VIEWER payload:", payload);
          videoRef.current.currentTime = payload.currentTime;
          setCurrentTime(payload.currentTime);
          const { round, estado, tiempoRestante } = calcularRoundYRestoConVideo(payload.currentTime);
          setRoundActual(round);
          setEstadoRound(estado);
          setTiempoRound(tiempoRestante);
        }
      }
      if (type === 'CANVAS_UPDATE_FROM_VIEWER') {
        if (fabricCanvasRef.current) {
          isSyncingFromViewerRef.current = true;
          fabricCanvasRef.current.loadFromJSON(payload.canvasData, () => {
            fabricCanvasRef.current.renderAll();
            isSyncingFromViewerRef.current = false;
            actualizarObjetosDibujo();
          });
        }
      }
    });

    const limpiarVisorCerrado = window.api.video.onVisorCerrado(() => {
      setVisorDetachadoAbierto(false);
    });

    return () => {
      limpiarListener();
      limpiarVisorCerrado();
    };
  }, []);

  // Sincronizar URL de video con el visor cuando cambia
  useEffect(() => {
    if (!window.api || !window.api.video) return;
    if (videoUrl) {
      window.api.video.enviarMensajeSync({
        type: 'VIDEO_LOADED',
        payload: { url: videoUrl, nombre: videoFile?.name || 'Video' },
      });
    } else {
      window.api.video.enviarMensajeSync({ type: 'VIDEO_UNLOADED' });
    }
  }, [videoUrl, videoFile]);

  // Sincronizar eventos cuando cambia el timeline
  useEffect(() => {
    if (window.api && window.api.video) {
      window.api.video.enviarMensajeSync({ type: 'EVENTOS_UPDATE', payload: { eventos: timeline } });
    }
  }, [timeline]);

  // Sincronizar herramienta, color y grosor de pincel local
  useEffect(() => {
    if (canvasInstance && canvasInstance.freeDrawingBrush) {
      canvasInstance.freeDrawingBrush.width = tamanioLapiz;
      canvasInstance.freeDrawingBrush.color = colorActivo;
    }
  }, [canvasInstance, tamanioLapiz, colorActivo]);

  // Sincronizar herramienta, color, grosor de dibujo y round con el visor desacoplado cuando cambian
  useEffect(() => {
    if (window.api && window.api.video) {
      window.api.video.enviarMensajeSync({
        type: 'DRAWING_TOOL_UPDATE',
        payload: { herramientaActiva, colorActivo, tamanioLapiz }
      });
      window.api.video.enviarMensajeSync({
        type: 'ROUND_UPDATE',
        payload: { round: roundActual }
      });
    }
  }, [herramientaActiva, colorActivo, tamanioLapiz, roundActual]);

  // Método auxiliar para calcular round y descanso según la posición del playhead del video
  const calcularRoundYRestoConVideo = useCallback(
    (t) => {
      let activeRound = 1;
      for (let r = totalRounds; r >= 1; r--) {
        if (t >= (roundStarts[r] ?? 999999)) {
          activeRound = r;
          break;
        }
      }
      const start = roundStarts[activeRound] ?? 0;
      const finalRound = t >= start + duracionRound;
      if (finalRound) {
        // Estamos en descanso si hay un round siguiente definido
        const nextStart = roundStarts[activeRound + 1];
        if (nextStart && t < nextStart) {
          return {
            round: activeRound,
            estado: "DESCANSO",
            tiempoRestante: Math.max(0, Math.ceil(nextStart - t)),
          };
        } else if (!nextStart) {
          // Descanso por defecto de 60 segundos
          return {
            round: activeRound,
            estado: "DESCANSO",
            tiempoRestante: Math.max(
              0,
              Math.ceil(start + duracionRound + 60 - t),
            ),
          };
        }
      }
      return {
        round: activeRound,
        estado: "COMBATE",
        tiempoRestante: Math.max(0, Math.ceil(start + duracionRound - t)),
      };
    },
    [roundStarts, duracionRound, totalRounds],
  );

  const sonarCampana = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  }, []);

  useEffect(() => {
    // Si hay un video, el avance del tiempo del reproductor gestiona el cronómetro
    if (videoUrl) {
      clearInterval(cronRef.current);
      return;
    }

    if (cronActivo) {
      cronRef.current = setInterval(() => {
        setTiempoRound((prev) => {
          if (prev <= 1) {
            sonarCampana();
            setCronActivo(false);
            setRoundActual((r) => r + 1);
            registrarEvento(`Fin Round ${roundActual}`, "general");
            return duracionRound;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(cronRef.current);
    }
    return () => clearInterval(cronRef.current);
  }, [cronActivo, duracionRound, roundActual, sonarCampana, videoUrl]);

  const resetCronometro = () => {
    setCronActivo(false);
    if (videoRef.current) {
      const tStart = roundStarts[1] || 0;
      videoRef.current.currentTime = tStart;
      setCurrentTime(tStart);
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setTiempoRound(duracionRound);
      setRoundActual(1);
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
      setCronActivo((a) => !a);
    }
  };

  const formatRound = (seg) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- Voice Control Narrator (Web Speech API) ---
  const {
    soportado: vozSoportada,
    escuchando,
    ultimaFrase,
    ultimoComando,
    iniciarEscucha,
    detenerEscucha,
    limpiarLog,
    generarResumenPorRound,
    obtenerLogCompleto,
    exportarSesion,
    totalFrases,
    totalChunks,
  } = useSpeechControl({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    getCurrentRound: () => roundActual,
    onComando: (accion, texto) => {
      if (accion === "PLAY") {
        if (!isPlaying) togglePlay();
      } else if (accion === "PAUSE") {
        if (isPlaying) togglePlay();
      } else if (accion === "RINCON_ROJO") setEsquinaDestino("roja");
      else if (accion === "RINCON_AZUL") setEsquinaDestino("azul");
      else registrarEvento(accion, esquinaDestino);
    },
  });

  // --- Load Session ---
  useEffect(() => {
    if (id) {
      const cargarSesion = async () => {
        const sesion = await db.sesiones.get(Number(id));
        if (sesion) {
          setBoxeadorRojoId(sesion.boxeadorRojoId.toString());
          setBoxeadorAzulId(sesion.boxeadorAzulId.toString());

          let cleanPath = sesion.videoPath || "";
          if (cleanPath.startsWith("daneri-file:///")) {
            cleanPath = decodeURIComponent(cleanPath.replace("daneri-file:///", ""));
          } else if (cleanPath.startsWith("daneri-file://")) {
            cleanPath = decodeURIComponent(cleanPath.replace("daneri-file://", ""));
          }

          setVideoAbsolutePath(cleanPath);
          setVideoNombre(cleanPath.split(/[/\\]/).pop());

          if (cleanPath && !cleanPath.startsWith("blob:") && window.api?.video?.cargarDesdeRuta) {
            const res = await window.api.video.cargarDesdeRuta(cleanPath);
            if (res.ok) {
              setVideoUrl(res.url);
              setVideoNombre(res.nombre);
              setVideoFaltante(false);
            } else {
              setVideoFaltante(true);
              setVideoUrl("");
            }
          } else if (cleanPath && cleanPath.startsWith("blob:")) {
            // En web, las URLs blob se vencen al recargar, así que se fuerza a vincular de nuevo
            setVideoFaltante(true);
            setVideoUrl("");
          } else {
            setVideoFaltante(true);
            setVideoUrl("");
          }

          if (sesion.roundStarts) {
            setRoundStarts(sesion.roundStarts);
          }

          if (sesion.rounds) {
            setTotalRounds(Number(sesion.rounds));
          }

          const eventos = await db.eventos
            .where("sesionId")
            .equals(Number(id))
            .toArray();
          setTimeline(eventos.sort((a, b) => b.timestamp - a.timestamp));
        }
      };
      cargarSesion();
    }
  }, [id]);

  // --- Autosave Draft ---
  useEffect(() => {
    if (!id && timeline.length > 0) {
      const borrador = {
        boxeadorRojoId,
        boxeadorAzulId,
        videoPath: videoUrl || (videoFile ? videoFile.name : ""),
        timeline,
        roundStarts,
        timestamp: Date.now(),
      };
      localStorage.setItem("daneri_sesion_borrador", JSON.stringify(borrador));
    }
  }, [
    timeline,
    boxeadorRojoId,
    boxeadorAzulId,
    videoUrl,
    videoFile,
    roundStarts,
    id,
  ]);

  // --- Restore Draft ---
  useEffect(() => {
    if (!id) {
      const guardado = localStorage.getItem("daneri_sesion_borrador");
      if (guardado) {
        try {
          const borrador = JSON.parse(guardado);
          if (
            borrador.timeline &&
            borrador.timeline.length > 0 &&
            Date.now() - borrador.timestamp < 24 * 60 * 60 * 1000
          ) {
            setBorradorGuardado(borrador);
            setMostrarModalBorrador(true);
          }
        } catch (e) {
          console.error("Error al restaurar borrador:", e);
        }
      }
    }
  }, [id]);

  const handleAceptarBorrador = () => {
    if (borradorGuardado) {
      setBoxeadorRojoId(borradorGuardado.boxeadorRojoId || "");
      setBoxeadorAzulId(borradorGuardado.boxeadorAzulId || "");
      if (borradorGuardado.videoPath) {
        if (
          borradorGuardado.videoPath.startsWith("daneri-file://") ||
          borradorGuardado.videoPath.startsWith("blob:")
        ) {
          setVideoUrl(borradorGuardado.videoPath);
          setVideoFaltante(false);
        } else if (window.api?.video?.cargarDesdeRuta) {
          window.api.video
            .cargarDesdeRuta(borradorGuardado.videoPath)
            .then((res) => {
              if (res.ok) {
                setVideoUrl(res.url);
                setVideoFaltante(false);
              } else {
                setVideoFaltante(true);
              }
            })
            .catch((err) => {
              console.error("Error al cargar video de borrador:", err);
              setVideoFaltante(true);
            });
        } else {
          setVideoFaltante(true);
        }
      }
      setTimeline(borradorGuardado.timeline);
      if (borradorGuardado.roundStarts) {
        setRoundStarts(borradorGuardado.roundStarts);
      }
    }
    setMostrarModalBorrador(false);
    setBorradorGuardado(null);
  };

  const handleCancelarBorrador = () => {
    localStorage.removeItem("daneri_sesion_borrador");
    setMostrarModalBorrador(false);
    setBorradorGuardado(null);
  };

  // --- Monitor Sync ---
  useEffect(() => {
    const channel = new BroadcastChannel("daneri-editor");
    channel.onmessage = (msg) => {
      const { cmd, payload } = msg.data;
      if (cmd === "togglePlay") togglePlay();
      if (cmd === "saltar") saltar(payload);
      if (cmd === "registrarEvento")
        registrarEvento(payload.tipo, payload.esquina);
      if (cmd === "setEsquinaDestino") setEsquinaDestino(payload);
      if (cmd === "panelReady") setPanelAccionesDesacoplado(true);
      if (cmd === "panelClosed") setPanelAccionesDesacoplado(false);
    };
    return () => channel.close();
  }, [isPlaying]);

  // Sincronizar estado local con el panel de acciones remoto
  useEffect(() => {
    const channel = new BroadcastChannel("daneri-editor");
    channel.postMessage({
      cmd: "stateUpdate",
      payload: { isPlaying, esquinaDestino }
    });
    channel.close();
  }, [isPlaying, esquinaDestino]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoNombre(file.name);

      let url = URL.createObjectURL(file);
      let path = file.path || file.name;
      if (file.path && window.api?.video?.cargarDesdeRuta) {
        try {
          const res = await window.api.video.cargarDesdeRuta(file.path);
          if (res.ok) {
            url = res.url;
            path = file.path;
          }
        } catch (err) {
          console.error("Error al cargar video por ruta:", err);
        }
      }

      setVideoAbsolutePath(path);
      setVideoUrl(url);
      setVideoFaltante(false);

      let currentSesionId = Number(id);
      if (currentSesionId) {
        try {
          await db.sesiones.update(currentSesionId, {
            videoPath: path,
            videoNombre: file.name,
            updatedAt: Date.now()
          });
        } catch (err) {
          console.error("Error actualizando DB al cargar video:", err);
        }
      }
    }
  };

  const seleccionarVideoNativo = async () => {
    if (window.api?.dialogo?.abrirVideo) {
      try {
        const path = await window.api.dialogo.abrirVideo();
        if (path) {
          const res = await window.api.video.cargarDesdeRuta(path);
          const vNombre = res.ok ? res.nombre : path.split(/[/\\]/).pop();
          const vUrl = res.ok ? res.url : "daneri-file:///" + path.replace(/\\/g, "/");

          setVideoUrl(vUrl);
          setVideoAbsolutePath(path);
          setVideoNombre(vNombre);
          setVideoFaltante(false);

          let currentSesionId = Number(id);
          if (currentSesionId) {
            await db.sesiones.update(currentSesionId, {
              videoPath: path,
              videoNombre: vNombre,
              updatedAt: Date.now()
            });
          }
        }
      } catch (err) {
        console.error("Error cargando video nativo:", err);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  // --- Fabric.js Initialization ---
  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return;

    let canvas = null;

    const initCanvas = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      
      canvas = new fabric.Canvas(canvasRef.current, {
        width: rect.width || 800,
        height: rect.height || 450,
        isDrawingMode: false,
        selection: true,
      });

      canvas.freeDrawingBrush.color = colorActivo;
      canvas.freeDrawingBrush.width = 3;
      setCanvasInstance(canvas);
      fabricCanvasRef.current = canvas;

      // Add drawing event listeners to canvas
      canvas.on("object:added", () => {
        if (!isHistoryLoadingRef.current) {
          pushStateToHistory();
        }
        actualizarObjetosDibujo();
      });
      canvas.on("object:modified", () => {
        if (!isHistoryLoadingRef.current) {
          pushStateToHistory();
        }
        actualizarObjetosDibujo();
      });
      canvas.on("object:removed", () => {
        if (!isHistoryLoadingRef.current) {
          pushStateToHistory();
        }
        actualizarObjetosDibujo();
      });
      canvas.on("after:render", () => {
        enviarActualizacionCanvas();
      });

      const handleResize = () => {
        if (wrapperRef.current && canvas && videoRef.current && videoRef.current.videoWidth) {
          const rect = wrapperRef.current.getBoundingClientRect();
          const videoRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
          const containerRatio = rect.width / rect.height;

          let w, h;
          if (containerRatio > videoRatio) {
            h = rect.height;
            w = h * videoRatio;
          } else {
            w = rect.width;
            h = w / videoRatio;
          }

          canvas.setWidth(w);
          canvas.setHeight(h);
          
          if (canvas.wrapperEl) {
            canvas.wrapperEl.style.position = 'absolute';
            canvas.wrapperEl.style.left = `${(rect.width - w) / 2}px`;
            canvas.wrapperEl.style.top = `${(rect.height - h) / 2}px`;
          }
          canvas.renderAll();
        }
      };
      
      // Llamar al resize inicial para acomodar el canvas si el video ya está listo
      setTimeout(handleResize, 100);
      window.addEventListener("resize", handleResize);
      // También reaccionar cuando el video dispara loadedmetadata
      if (videoRef.current) {
        videoRef.current.addEventListener('loadedmetadata', handleResize);
      }

      // Guardar el handler para limpieza
      canvas._handleResize = handleResize;
    };

    const timeout = setTimeout(initCanvas, 100);

    return () => {
      clearTimeout(timeout);
      if (canvas) {
        window.removeEventListener("resize", canvas._handleResize);
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', canvas._handleResize);
        }
        try {
          canvas.dispose();
        } catch (e) {}
      }
    };
  }, [pushStateToHistory]);

  // --- Brush Settings y Manejo de Textos/Formas ---
  useEffect(() => {
    if (!canvasInstance) return;

    canvasInstance.isDrawingMode = herramientaActiva === "lapiz";
    canvasInstance.freeDrawingBrush.color = colorActivo;

    if (herramientaActiva === "cursor") {
      canvasInstance.defaultCursor = "default";
    } else {
      canvasInstance.defaultCursor = "crosshair";
    }

    // Limpiar eventos previos si los hay
    canvasInstance.off('mouse:down');
    canvasInstance.off('mouse:move');
    canvasInstance.off('mouse:up');

    let isDrawingShape = false;
    let startX = 0;
    let startY = 0;
    let currentShape = null;

    const onMouseDown = (o) => {
      if (herramientaActiva === 'lapiz' || herramientaActiva === 'cursor') return;
      if (o.target && herramientaActiva !== 'texto') return; // No dibujar forma si hizo click en un objeto existente

      const pointer = canvasInstance.getPointer(o.e);
      isDrawingShape = true;
      startX = pointer.x;
      startY = pointer.y;

      if (herramientaActiva === 'texto') {
        if (o.target && o.target.type === 'i-text') return; // Dejar que el usuario edite el texto existente
        const text = new fabric.IText('Texto', {
          left: startX,
          top: startY,
          fill: colorActivo,
          fontSize: 24,
          fontFamily: 'Inter',
        });
        canvasInstance.add(text);
        canvasInstance.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        isDrawingShape = false; 
        setHerramientaActiva('cursor'); // Auto-switch a cursor para editar tranquilo
      } else if (herramientaActiva === 'linea') {
        currentShape = new fabric.Line([startX, startY, startX, startY], {
          stroke: colorActivo,
          strokeWidth: 4,
          selectable: true,
          evented: true,
        });
        canvasInstance.add(currentShape);
      } else if (herramientaActiva === 'circulo') {
        currentShape = new fabric.Circle({
          left: startX,
          top: startY,
          radius: 1,
          stroke: colorActivo,
          strokeWidth: 4,
          fill: 'transparent',
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
        });
        canvasInstance.add(currentShape);
      }
    };

    const onMouseMove = (o) => {
      if (!isDrawingShape || !currentShape) return;
      const pointer = canvasInstance.getPointer(o.e);

      if (herramientaActiva === 'linea') {
        currentShape.set({ x2: pointer.x, y2: pointer.y });
      } else if (herramientaActiva === 'circulo') {
        const radius = Math.max(Math.abs(pointer.x - startX), Math.abs(pointer.y - startY));
        currentShape.set({ radius: radius });
      }
      canvasInstance.renderAll();
    };

    const onMouseUp = () => {
      if (!isDrawingShape) return;
      isDrawingShape = false;
      currentShape = null;
      if (!isHistoryLoadingRef.current) {
        pushStateToHistory();
      }
    };

    canvasInstance.on('mouse:down', onMouseDown);
    canvasInstance.on('mouse:move', onMouseMove);
    canvasInstance.on('mouse:up', onMouseUp);

  }, [herramientaActiva, colorActivo, canvasInstance, pushStateToHistory]);

  // --- Actualizar color de objeto seleccionado ---
  useEffect(() => {
    if (!canvasInstance || !colorActivo) return;
    const activeObject = canvasInstance.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text' || activeObject.type === 'text') {
        activeObject.set('fill', colorActivo);
      } else {
        activeObject.set('stroke', colorActivo);
      }
      canvasInstance.renderAll();
      pushStateToHistory();
    }
  }, [colorActivo, canvasInstance, pushStateToHistory]);

  // --- Video Playback ---
  const togglePlay = () => {
    if (videoRef.current) {
      console.log("[EditorTactico] togglePlay. isPlaying =", isPlaying, "videoRef.current.paused =", videoRef.current.paused);
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.warn("[EditorTactico] Play request interrupted/blocked:", err);
        });
      }
      setIsPlaying(!isPlaying);
    } else {
      console.warn("[EditorTactico] togglePlay called but videoRef.current is null");
    }
  };

  const handlePlay = () => {
    console.log("[EditorTactico] handlePlay triggered on video element");
    setIsPlaying(true);
    if (window.api && window.api.video) {
      window.api.video.enviarMensajeSync({ type: 'PLAY' });
    }
  };

  const handlePause = () => {
    console.log("[EditorTactico] handlePause triggered on video element");
    setIsPlaying(false);
    setBucleRango(null);
    setBucleEventoId(null);
    if (window.api && window.api.video) {
      window.api.video.enviarMensajeSync({ type: 'PAUSE' });
    }
  };

  const saltar = (segundos) => {
    if (videoRef.current) {
      console.log("[EditorTactico] saltar:", segundos, "s. CurrentTime before =", videoRef.current.currentTime);
      videoRef.current.currentTime += segundos;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      console.log("[EditorTactico] Loaded video metadata: duration =", dur);
      if (dur && !isNaN(dur)) {
        setVideoDuration(dur);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;

      // Control de bucle táctico de 10s (5s antes, 5s después del marcador)
      if (bucleRango) {
        if (t >= bucleRango.end) {
          videoRef.current.currentTime = bucleRango.start;
          setCurrentTime(bucleRango.start);
          return;
        }
        if (t < bucleRango.start) {
          videoRef.current.currentTime = bucleRango.start;
          setCurrentTime(bucleRango.start);
          return;
        }
      }

      console.log("[EditorTactico] handleTimeUpdate: currentTime =", t, "duration =", videoRef.current.duration);
      setCurrentTime(t);
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && dur !== videoDuration) {
        setVideoDuration(dur);
      }
      const { round, estado, tiempoRestante } = calcularRoundYRestoConVideo(t);
      setRoundActual(round);
      setEstadoRound(estado);
      setTiempoRound(tiempoRestante);
      // Sincronizar con visor desacoplado (incluye round para evitar useEffect TDZ)
      if (window.api && window.api.video) {
        window.api.video.enviarMensajeSync({
          type: 'TIME_UPDATE',
          payload: { currentTime: t, duracion: dur, round },
        });
      }
    } else {
      console.warn("[EditorTactico] handleTimeUpdate triggered but videoRef.current is null");
    }
  };

  // --- Event Recording ---
  // Helper: map zona anatómica detectada por IA a coordenadas SVG estándar (200x380)
  const obtenerCoordenadasDeZona = (zona) => {
    const mapa = {
      'Cabeza Izquierda':              { x: 45,  y: 55  },
      'Cabeza Derecha':                { x: 155, y: 55  },
      'Cabeza Centro':                 { x: 100, y: 55  },
      'Cuerpo Izquierdo (Hígado)':     { x: 42,  y: 195 },
      'Cuerpo Derecho (Bazo)':         { x: 158, y: 195 },
      'Cuerpo Centro':                 { x: 100, y: 195 },
      'Cuerpo General':                { x: 100, y: 195 },
    };
    return mapa[zona] || null;
  };

  const registrarEvento = (tipo, esquina = "general") => {
    pushStateToHistory();
    const tiempoReal = videoRef.current ? videoRef.current.currentTime : 0;
    const snap = capturarFrameBase64();
    const esGolpe = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(tipo);
    const nuevoEvento = {
      id: Date.now(),
      timestamp: tiempoReal,
      tiempoVideo: tiempoReal,
      tipo,
      esquina,
      round: roundActual,
      nota: "",
      snapshot: snap,
      canvasData: "",
      ...(esGolpe ? { resultado: "Conectado" } : {})
    };
    setTimeline((prev) => [nuevoEvento, ...prev]);
    setTeclaActiva(tipo);
    setTimeout(() => setTeclaActiva(null), 200);
    // Si el panel de mapa está activo, activar modo mapeo guiado inmediatamente
    if (panelActivo === 'mapa') {
      setTimeout(() => setEventoSeleccionadoId(nuevoEvento.id), 50);
    }
  };

  // --- Heatmap Interactions ---
  const handleAddImpacto = (impacto) => {
    try {
      // pushStateToHistory puede fallar si Fabric está en estado inconsistente
      // Lo envolvemos para que no bloquee el guardado del evento
      try {
        pushStateToHistory();
      } catch (historyErr) {
        console.warn('[Heatmap] pushStateToHistory falló, continuando sin historia:', historyErr);
      }
      const tiempoReal = videoRef.current ? videoRef.current.currentTime : 0;
      let snap = "";
      try {
        snap = capturarFrameBase64();
      } catch (snapErr) {
        console.warn('[Heatmap] No se pudo capturar frame:', snapErr);
      }
      const esGolpe = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(impacto.tipo);
      const nuevoEvento = {
        id: Date.now(),
        timestamp: tiempoReal,
        tiempoVideo: tiempoReal,
        tipo: impacto.tipo,
        esquina: esquinaDestino,
        round: roundActual,
        nota: "",
        coordX: impacto.coordX,
        coordY: impacto.coordY,
        lugar: impacto.lugar,
        tipoSilueta: impacto.tipoSilueta,
        snapshot: snap,
        canvasData: "",
        ...(esGolpe ? { resultado: "Conectado" } : {})
      };
      console.log('[Heatmap] Agregando evento:', nuevoEvento.tipo, nuevoEvento.esquina, nuevoEvento.coordX, nuevoEvento.coordY);
      setTimeline((prev) => [nuevoEvento, ...prev]);
    } catch (err) {
      console.error('[Heatmap] Error en handleAddImpacto:', err);
    }
  };

  const handleRemoveImpacto = (id) => {
    pushStateToHistory();
    setTimeline((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleUpdateNota = (id, nota) => {
    pushStateToHistory();
    setTimeline((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, nota } : ev)),
    );
  };

  const handleSelectEvento = (ev) => {
    if (videoRef.current) {
      videoRef.current.currentTime = ev.timestamp;
      setCurrentTime(ev.timestamp);
    }
  };

  const handleUpdateImpactoCoords = (id, coordX, coordY, lugar, tipoSilueta) => {
    try {
      pushStateToHistory();
    } catch (err) { }
    setTimeline((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, coordX, coordY, lugar, tipoSilueta } : ev)),
    );
  };

  const formatTime = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- Save / Finalize Session ---
  const _ejecutarFinalizarSesion = async () => {
    if (escuchando) detenerEscucha();

    const nombreSesion = (() => {
      const rojo =
        boxeadoresDb?.find((b) => b.id === Number(boxeadorRojoId))?.nombre ||
        "Rojo";
      const azul =
        boxeadoresDb?.find((b) => b.id === Number(boxeadorAzulId))?.nombre ||
        "Azul";
      return `${rojo} vs ${azul}`;
    })();
    exportarSesion(nombreSesion);

    const resumenVoz = generarResumenPorRound();
    const logVoz = obtenerLogCompleto();
    const resumenTexto = Object.entries(resumenVoz)
      .map(([r, data]) => `Round ${r}:\n${data.notas}`)
      .join("\n\n");

    setGuardando(true);
    setModalInfo(null);
    try {
      let currentSesionId = Number(id);

      if (currentSesionId) {
        await db.sesiones.update(currentSesionId, {
          boxeadorRojoId: Number(boxeadorRojoId),
          boxeadorAzulId: Number(boxeadorAzulId),
          videoPath: videoAbsolutePath || (videoFile ? videoFile.name : "Video Local (Reabierto)"),
          resumenVoz: resumenTexto || "",
          logVoz: JSON.stringify(logVoz),
          roundStarts,
          rounds: totalRounds,
          esBorrador: false,
          updatedAt: Date.now(),
        });
        await db.eventos.where("sesionId").equals(currentSesionId).delete();
      } else {
        currentSesionId = await db.sesiones.add({
          fecha: new Date().toISOString().split('T')[0],
          boxeadorRojoId: Number(boxeadorRojoId),
          boxeadorAzulId: Number(boxeadorAzulId),
          rounds: totalRounds,
          sintesis: "",
          videoPath: videoAbsolutePath || (videoFile ? videoFile.name : "Video Local"),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          resumenVoz: resumenTexto || "",
          logVoz: JSON.stringify(logVoz),
          roundStarts,
          esBorrador: false,
        });
      }

      const eventosDb = timeline.map((ev) => ({
        sesionId: currentSesionId,
        timestamp: ev.timestamp,
        tipo: ev.tipo,
        esquina: ev.esquina,
        nota: ev.nota,
        round: ev.round,
        coordX: ev.coordX,
        coordY: ev.coordY,
        lugar: ev.lugar,
        tipoSilueta: ev.tipoSilueta,
        snapshot: ev.snapshot || "",
        canvasData: ev.canvasData || "",
      }));
      await db.eventos.bulkAdd(eventosDb);

      localStorage.removeItem("daneri_sesion_borrador");
      realizarRespaldoAutomatico();

      // Generar y guardar dataset de entrenamiento automáticamente
      const eventosConCoords = eventosDb.filter(
        (ev) =>
          ev.coordX !== undefined && ev.coordY !== undefined && ev.snapshot,
      );
      if (eventosConCoords.length > 0 && window.api?.backup?.guardar) {
        try {
          const rojoName =
            boxeadoresDb?.find((b) => b.id === Number(boxeadorRojoId))
              ?.nombre || "Desconocido";
          const azulName =
            boxeadoresDb?.find((b) => b.id === Number(boxeadorAzulId))
              ?.nombre || "Desconocido";
          const dataset = {
            peleaId: currentSesionId,
            fecha: new Date().toISOString(),
            boxeadorRojo: rojoName,
            boxeadorAzul: azulName,
            snapshots: eventosConCoords.map((ev) => ({
              tiempoVideo: ev.timestamp,
              round: ev.round,
              imagen: ev.snapshot,
              etiquetas: [
                {
                  tipo: ev.tipo,
                  esquina: ev.esquina,
                  zona: ev.lugar,
                  coordX: ev.coordX,
                  coordY: ev.coordY,
                  nota: ev.nota,
                },
              ],
            })),
          };
          await window.api.backup.guardar(
            `dataset_entrenamiento_daneri_${currentSesionId}.json`,
            JSON.stringify(dataset, null, 2),
          );
          console.log(
            `[Dataset] Dataset guardado automáticamente para la sesión ${currentSesionId}`,
          );
        } catch (e) {
          console.error("[Dataset] Error al guardar dataset automático:", e);
        }
      }

      setModalInfo({
        tipo: "exito",
        titulo: id ? "¡Sesión Actualizada!" : "¡Sesión Finalizada!",
        mensaje: id
          ? `La sesión fue actualizada exitosamente con ${timeline.length} eventos registrados.`
          : `La sesión fue guardada permanentemente. Se registraron ${timeline.length} eventos tácticos.`,
        onConfirm: () => {
          setModalInfo(null);
          if (id) {
            navigate("/sesiones");
          } else {
            setTimeline([]);
            setVideoFile(null);
            setVideoUrl("");
            if (videoUrl) URL.revokeObjectURL(videoUrl);
            setBoxeadorRojoId("");
            setBoxeadorAzulId("");
          }
        },
      });
    } catch (error) {
      console.error(error);
      setModalInfo({
        tipo: "error",
        titulo: "Error al Guardar",
        mensaje:
          "No se pudo guardar la sesión. Verificá el almacenamiento e intentá de nuevo.",
        onConfirm: () => setModalInfo(null),
      });
    } finally {
      setGuardando(false);
    }
  };

  const finalizarSesion = async () => {
    if (!boxeadorRojoId || !boxeadorAzulId) {
      setModalInfo({
        tipo: "error",
        titulo: "Boxeadores Requeridos",
        mensaje:
          "Para finalizar la sesión necesitás seleccionar los boxeadores del Rincón Rojo y Rincón Azul. Podés guardar el progreso sin esta información.",
        onConfirm: () => setModalInfo(null),
      });
      return;
    }
    if (timeline.length === 0) {
      setModalInfo({
        tipo: "confirmacion",
        titulo: "Sesión Sin Eventos",
        mensaje:
          "No registraste ningún evento táctico en esta sesión. ¿Querés guardarla de todas formas?",
        onConfirm: () => _ejecutarFinalizarSesion(),
        onCancel: () => setModalInfo(null),
      });
      return;
    }
    await _ejecutarFinalizarSesion();
  };

  // --- Guardar Progreso (borrador parcial, sin requerir boxeadores) ---
  const guardarProgreso = async () => {
    setGuardandoProgreso(true);
    try {
      const rojoNombre =
        boxeadoresDb?.find((b) => b.id === Number(boxeadorRojoId))?.nombre ||
        null;
      const azulNombre =
        boxeadoresDb?.find((b) => b.id === Number(boxeadorAzulId))?.nombre ||
        null;
      const nombreSesion =
        rojoNombre && azulNombre
          ? `${rojoNombre} vs ${azulNombre}`
          : "Sesión en Borrador";

      let currentSesionId = Number(id);

      if (currentSesionId) {
        await db.sesiones.update(currentSesionId, {
          boxeadorRojoId: boxeadorRojoId ? Number(boxeadorRojoId) : null,
          boxeadorAzulId: boxeadorAzulId ? Number(boxeadorAzulId) : null,
          videoPath: videoAbsolutePath || (videoFile ? videoFile.name : ""),
          roundStarts,
          rounds: totalRounds,
          updatedAt: Date.now(),
          esBorrador: true,
        });
        await db.eventos.where("sesionId").equals(currentSesionId).delete();
      } else {
        currentSesionId = await db.sesiones.add({
          fecha: new Date().toISOString().split('T')[0],
          boxeadorRojoId: boxeadorRojoId ? Number(boxeadorRojoId) : null,
          boxeadorAzulId: boxeadorAzulId ? Number(boxeadorAzulId) : null,
          rounds: totalRounds,
          sintesis: "",
          videoPath: videoAbsolutePath || (videoFile ? videoFile.name : ""),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          resumenVoz: "",
          logVoz: "",
          roundStarts,
          esBorrador: true,
        });
      }

      const eventosDb = timeline.map((ev) => ({
        sesionId: currentSesionId,
        timestamp: ev.timestamp,
        tipo: ev.tipo,
        esquina: ev.esquina,
        nota: ev.nota,
        round: ev.round,
        coordX: ev.coordX,
        coordY: ev.coordY,
        lugar: ev.lugar,
        tipoSilueta: ev.tipoSilueta,
        snapshot: ev.snapshot || "",
        canvasData: ev.canvasData || "",
      }));
      await db.eventos.bulkAdd(eventosDb);

      localStorage.removeItem("daneri_sesion_borrador");

      setModalInfo({
        tipo: "exito",
        titulo: "¡Progreso Guardado!",
        mensaje: `La sesión "${nombreSesion}" fue guardada exitosamente con ${timeline.length} eventos. Podés retomar el trabajo desde el historial de sesiones cuando quieras.`,
        onConfirm: () => setModalInfo(null),
      });
    } catch (error) {
      console.error("[GuardarProgreso]", error);
      setModalInfo({
        tipo: "error",
        titulo: "Error al Guardar",
        mensaje:
          "No se pudo guardar el progreso. Verificá el almacenamiento e intentá de nuevo.",
        onConfirm: () => setModalInfo(null),
      });
    } finally {
      setGuardandoProgreso(false);
    }
  };

  // --- Ollama Capture & Scan Engine ---
  const capturarFrame = () => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const verificarEstadoOllama = async () => {
    const isUp = await verificarOllama();
    setOllamaDisponible(isUp);
    return isUp;
  };

  useEffect(() => {
    verificarEstadoOllama();
  }, []);

  const analizarFrameActual = async () => {
    const base64 = capturarFrame();
    if (!base64) return;

    const prevEstado = ollamaEstado;
    setOllamaEstado("Analizando...");
    try {
      const res = await analizarFrameConOllama(base64, ollamaModelo);
      const tiempoReal = videoRef.current ? videoRef.current.currentTime : 0;

      if (res && res.golpeDetectado) {
        pushStateToHistory();
        // Auto-popular coordenadas desde zona detectada por IA
        const coordsAutoIA = res.zona ? obtenerCoordenadasDeZona(res.zona) : null;
        const nuevoEvento = {
          id: Date.now(),
          timestamp: tiempoReal,
          tiempoVideo: tiempoReal,
          tipo: res.tipo || "Golpe Conectado",
          esquina: res.esquina || esquinaDestino,
          round: roundActual,
          nota: res.nota || "Etiquetado local por Ollama Vision",
          lugar: res.zona ?? undefined,
          coordX: coordsAutoIA?.x ?? res.coordX ?? undefined,
          coordY: coordsAutoIA?.y ?? res.coordY ?? undefined,
          tipoSilueta: [
            "Jab",
            "Recto",
            "Cross",
            "Gancho",
            "Uppercut",
            "Swing",
            "Golpe Conectado",
          ].includes(res.tipo)
            ? "ataque"
            : "defensa",
        };
        setTimeline((prev) => [nuevoEvento, ...prev]);
        setLogsIA((prev) =>
          [
            `[${formatTime(tiempoReal)}] 🥊 Golpe Detectado: ${res.tipo} (${res.esquina}) en ${res.zona || "Cuerpo"}`,
            ...prev,
          ].slice(0, 8),
        );
        playFeedbackSound(880, 0.15);
      } else {
        setLogsIA((prev) =>
          [
            `[${formatTime(tiempoReal)}] 💤 Sin acción relevante`,
            ...prev,
          ].slice(0, 8),
        );
      }
    } catch (err) {
      console.error(err);
      setLogsIA((prev) =>
        [
          `[ERROR] ${err.message || "Error de conexión con Ollama"}`,
          ...prev,
        ].slice(0, 8),
      );
    } finally {
      setOllamaEstado(
        prevEstado === "Escaneando..." ? "Escaneando..." : "Inactivo",
      );
    }
  };

  const obtenerVeredictoEinstein = async () => {
    if (timeline.length === 0) {
      mostrarAlerta({ titulo: "Faltan Eventos", mensaje: "Registra al menos algunos eventos en la línea de tiempo antes de consultar el veredicto.", tipo: "advertencia" });
      return;
    }
    setCargandoVeredicto(true);
    setVeredictoEinstein(
      "Analizando datos de la sesión y compilando veredicto...",
    );

    const totalGolpes = timeline.length;
    const tieneLegados = timeline.some(e => e.tipo === 'Golpe Conectado' || e.tipo === 'Golpe Errado');
    let conectados = 0;
    let errados = 0;
    if (tieneLegados) {
      conectados = timeline.filter(e => e.tipo === 'Golpe Conectado').length;
      errados = timeline.filter(e => e.tipo === 'Golpe Errado').length;
    } else {
      const golpesOfensivos = timeline.filter(e => ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(e.tipo));
      conectados = golpesOfensivos.filter(e => e.resultado !== 'Errado').length;
      errados = golpesOfensivos.filter(e => e.resultado === 'Errado').length;
    }
    const eficOfensiva =
      conectados + errados > 0
        ? Math.round((conectados / (conectados + errados)) * 100)
        : 0;

    const prompt = `
      Eres Einstein, el analista táctico de boxeo de nivel élite del Equipo Daneri.
      Analiza los datos de esta sesión de entrenamiento de boxeo y proporciona un veredicto técnico y consejos tácticos de 3-4 párrafos concisos en español.
      
      Métricas de la sesión actual:
      - Volumen total de golpes etiquetados: ${totalGolpes}
      - Eficacia ofensiva estimada: ${eficOfensiva}% (${conectados} conectados, ${errados} errados)
      - Rincón Rojo: ${statsBoxeador.resumen.volumen} golpes registrados, eficacia: ${statsBoxeador.resumen.eficacia}%
      
      Notas manuales anotadas por el entrenador:
      ${timeline
        .filter((e) => e.nota)
        .map((e) => `[${formatTime(e.timestamp)}] ${e.tipo}: ${e.nota}`)
        .join("\\n")}
      
      Escribe un veredicto estructurado con:
      1. Resumen Estratégico (estilo del púgil, ritmo).
      2. Observaciones Tácticas Críticas (errores recurrentes, fallos defensivos).
      3. Plan de Ajuste Inmediato para la esquina.
      
      Responde directamente en español con un tono profesional, técnico y directo de entrenador de boxeo élite.
    `;

    try {
      const veredicto = await consultarVeredictoEinstein(prompt, temperaturaIA);
      setVeredictoEinstein(
        veredicto ||
          "No se recibió respuesta del Asistente Einstein. Verifica el estado de Ollama.",
      );
      setLogsIA((prev) =>
        [
          `[INFO] Veredicto Estratégico Einstein recibido con éxito.`,
          ...prev,
        ].slice(0, 8),
      );
    } catch (err) {
      console.error(err);
      setVeredictoEinstein(
        `Error de conexión con el Asistente Einstein: ${err.message}`,
      );
      setLogsIA((prev) =>
        [
          `[ERROR] Error al consultar Veredicto Einstein: ${err.message}`,
          ...prev,
        ].slice(0, 8),
      );
    } finally {
      setCargandoVeredicto(false);
    }
  };

  const toggleEscaneoIA = () => {
    if (escaneoActivoRef.current) {
      escaneoActivoRef.current = false;
      setOllamaEstado("Inactivo");
      clearInterval(timerIA.current);
    } else {
      if (intervaloEscaneo === "manual") {
        analizarFrameActual();
        return;
      }
      escaneoActivoRef.current = true;
      setOllamaEstado("Escaneando...");
      const ms = Number(intervaloEscaneo);
      timerIA.current = setInterval(async () => {
        if (
          videoRef.current &&
          !videoRef.current.paused &&
          ollamaEstado !== "Analizando..."
        ) {
          await analizarFrameActual();
        }
      }, ms);
    }
  };

  useEffect(() => {
    return () => clearInterval(timerIA.current);
  }, []);

  // --- Ollama Resilient Full-Video Batch Sweep ---
  const iniciarBarridoIA = async () => {
    const video = videoRef.current;
    if (!video) {
      mostrarAlerta({ titulo: "Falta Video", mensaje: "Carga un video para poder iniciar el barrido con IA.", tipo: "advertencia" });
      return;
    }
    const duration = video.duration;
    if (!duration || isNaN(duration)) {
      mostrarAlerta({ titulo: "Error de Video", mensaje: "La duración del video no es válida.", tipo: "peligro" });
      return;
    }

    const confirmado = await mostrarConfirmacion({
      titulo: "Iniciar Barrido Automático",
      mensaje: `¿Iniciar barrido automático del video completo? Esto procesará el video cada ${stepBarrido} segundos y etiquetará automáticamente los golpes usando el modelo local '${ollamaModelo}'. Puede tomar varios minutos.`,
      textoConfirmar: "Iniciar",
      tipo: "info"
    });
    if (!confirmado) return;

    setBarriendoIA(true);
    barriendoRef.current = true;
    setProgresoBarrido(0);

    const originalTime = video.currentTime;
    const originalPaused = video.paused;
    if (!originalPaused) video.pause();

    setLogsIA((prev) =>
      [
        `[INFO] Iniciando barrido completo con ${ollamaModelo}...`,
        ...prev,
      ].slice(0, 8),
    );

    let t = 0;
    const step = Number(stepBarrido);

    // Función de reintento exponencial para máxima resiliencia
    const llamarConReintentos = async (base64, model, maxRetries = 3) => {
      let delay = 1000;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!barriendoRef.current) throw new Error("Barrido cancelado");
        try {
          return await analizarFrameConOllama(base64, model);
        } catch (err) {
          if (attempt === maxRetries) throw err;
          setLogsIA((prev) =>
            [
              `[WARN] Reintento ${attempt}/${maxRetries} en ${formatTime(t)} despues de ${delay}ms...`,
              ...prev,
            ].slice(0, 8),
          );
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2; // Retroceso exponencial
        }
      }
    };

    try {
      while (t <= duration && barriendoRef.current) {
        // 1. Seek a la posición t
        await new Promise((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            // Retardo para asegurar decodificación en Electron/DOM
            setTimeout(resolve, 150);
          };
          video.addEventListener("seeked", onSeeked);
          video.currentTime = t;
        });

        // 2. Capturar y analizar
        const base64 = capturarFrame();
        if (base64) {
          setOllamaEstado("Analizando...");
          try {
            const res = await llamarConReintentos(base64, ollamaModelo);
            if (res && res.golpeDetectado) {
              pushStateToHistory();
              const nuevoEvento = {
                id: Date.now() + Math.random(),
                timestamp: t,
                tiempoVideo: t,
                tipo: res.tipo || "Golpe Conectado",
                esquina: res.esquina || esquinaDestino,
                round: Math.floor(t / 180) + 1, // Estimación simple del round de 3 min
                nota: res.nota || "Barrido local por Ollama Vision",
                lugar: res.zona ?? undefined,
                coordX: res.coordX ?? undefined,
                coordY: res.coordY ?? undefined,
                tipoSilueta: [
                  "Jab",
                  "Recto",
                  "Cross",
                  "Gancho",
                  "Uppercut",
                  "Swing",
                  "Golpe Conectado",
                ].includes(res.tipo)
                  ? "ataque"
                  : "defensa",
              };
              setTimeline((prev) => [nuevoEvento, ...prev]);
              setLogsIA((prev) =>
                [
                  `[${formatTime(t)}] 🥊 Golpe Detectado: ${res.tipo} en ${res.zona || "Cuerpo"}`,
                  ...prev,
                ].slice(0, 8),
              );
              playFeedbackSound(880, 0.15);
            } else {
              setLogsIA((prev) =>
                [`[${formatTime(t)}] 💤 Sin acción`, ...prev].slice(0, 8),
              );
            }
          } catch (err) {
            console.error(err);
            setLogsIA((prev) =>
              [
                `[ERROR ${formatTime(t)}] ${err.message || "Error de conexión"}`,
                ...prev,
              ].slice(0, 8),
            );
          }
        }

        // 3. Incrementar progreso
        const pct = Math.min(100, Math.round((t / duration) * 100));
        setProgresoBarrido(pct);
        t += step;
      }

      if (!barriendoRef.current) {
        setLogsIA((prev) =>
          [`[INFO] Barrido detenido por el usuario.`, ...prev].slice(0, 8),
        );
      } else {
        setLogsIA((prev) =>
          [`[INFO] ¡Barrido completo finalizado con éxito!`, ...prev].slice(
            0,
            8,
          ),
        );
        mostrarAlerta({ titulo: "Barrido Finalizado", mensaje: "¡El barrido automático de video con IA local ha finalizado con éxito!", tipo: "exito" });
      }
    } catch (e) {
      console.error(e);
      setLogsIA((prev) => [`[ERROR GLOBAL] ${e.message}`, ...prev].slice(0, 8));
    } finally {
      setBarriendoIA(false);
      barriendoRef.current = false;
      setOllamaEstado("Inactivo");
      video.currentTime = originalTime;
      if (!originalPaused) video.play();
    }
  };

  const detenerBarridoIA = () => {
    barriendoRef.current = false;
    setBarriendoIA(false);
  };

  // --- Export Training Dataset as JSON ---
  const [exportandoDataset, setExportandoDataset] = useState(false);
  const [progresoExportacion, setProgresoExportacion] = useState(0);

  const exportarDataset = async () => {
    const video = videoRef.current;
    if (!video) {
      mostrarAlerta({ titulo: "Falta Video", mensaje: "Carga un video para poder exportar el dataset.", tipo: "advertencia" });
      return;
    }

    const eventosConCoords = timeline.filter(
      (ev) => ev.coordX !== undefined && ev.coordY !== undefined,
    );
    if (eventosConCoords.length === 0) {
      mostrarAlerta({
        titulo: "Sin Coordenadas",
        mensaje: "No hay golpes etiquetados con coordenadas en el mapa de calor para exportar. Registra impactos en la pestaña 'Mapa de Calor' primero.",
        tipo: "advertencia"
      });
      return;
    }

    setExportandoDataset(true);
    setProgresoExportacion(0);

    const originalTime = video.currentTime;
    const originalPaused = video.paused;
    if (!originalPaused) video.pause();

    const snapshots = [];

    const captureEvent = async (ev, index) => {
      return new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          setTimeout(() => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL("image/jpeg", 0.8);

            snapshots.push({
              tiempoVideo: ev.timestamp,
              round: ev.round,
              imagen: base64,
              etiquetas: [
                {
                  tipo: ev.tipo,
                  esquina: ev.esquina,
                  zona: ev.lugar,
                  coordX: ev.coordX,
                  coordY: ev.coordY,
                  nota: ev.nota,
                },
              ],
            });

            setProgresoExportacion(
              Math.round(((index + 1) / eventosConCoords.length) * 100),
            );
            resolve();
          }, 150);
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = ev.timestamp;
      });
    };

    for (let i = 0; i < eventosConCoords.length; i++) {
      await captureEvent(eventosConCoords[i], i);
    }

    video.currentTime = originalTime;
    if (!originalPaused) video.play();

    const dataset = {
      peleaId: id || `sesion-${Date.now()}`,
      boxeadorRojo:
        boxeadoresDb?.find((b) => b.id === Number(boxeadorRojoId))?.nombre ||
        "Desconocido",
      boxeadorAzul:
        boxeadoresDb?.find((b) => b.id === Number(boxeadorAzulId))?.nombre ||
        "Desconocido",
      snapshots,
    };

    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset_entrenamiento_daneri_${id || "nueva"}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportandoDataset(false);
    mostrarAlerta({
      titulo: "Dataset Generado",
      mensaje: `¡Dataset de entrenamiento generado exitosamente con ${snapshots.length} capturas etiquetadas!`,
      tipo: "exito"
    });
  };

  // --- Keyboard Shortcuts & Hotkeys ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      )
        return;

      const registrar = (tipo) => {
        e.preventDefault();
        registrarEvento(tipo, esquinaDestino);
      };

      // Ctrl + Z / Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      switch (e.code) {
        case hotkeys.PlayPause:
          e.preventDefault();
          togglePlay();
          break;
        case hotkeys.Atras:
          e.preventDefault();
          saltar(-2);
          break;
        case hotkeys.Adelante:
          e.preventDefault();
          saltar(2);
          break;
        case hotkeys.Cursor:
          e.preventDefault();
          setHerramientaActiva("cursor");
          break;
        case hotkeys.Lapiz:
          e.preventDefault();
          setHerramientaActiva("lapiz");
          break;

        case hotkeys.RinconRojo:
          e.preventDefault();
          setEsquinaDestino("roja");
          break;
        case hotkeys.RinconAzul:
          e.preventDefault();
          setEsquinaDestino("azul");
          break;

        case hotkeys.Jab:
          registrar("Jab");
          break;
        case hotkeys.Recto:
          registrar("Recto");
          break;
        case hotkeys.Cross:
          registrar("Cross");
          break;
        case hotkeys.Gancho:
          registrar("Gancho");
          break;
        case hotkeys.Uppercut:
          registrar("Uppercut");
          break;
        case hotkeys.Swing:
          registrar("Swing");
          break;

        case hotkeys.Finta:
          registrar("Finta");
          break;
        case hotkeys.Esquiva:
          registrar("Esquiva");
          break;
        case hotkeys.Bloqueo:
          registrar("Bloqueo");
          break;
        case hotkeys.Clinch:
          registrar("Clinch");
          break;
        case hotkeys.Pivoteo:
          registrar("Pivoteo");
          break;
        case hotkeys["Marca General"]:
          registrar("Marca General");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, esquinaDestino, hotkeys, handleUndo, handleRedo]);

  useEffect(() => {
    if (!eventoAEditar) return;
    const handleKeyDownModal = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEventoAEditar(null);
      }
      if (e.key === "Enter") {
        const activeElement = document.activeElement;
        const inTextarea =
          activeElement && activeElement.tagName === "TEXTAREA";
        if (!inTextarea || e.ctrlKey) {
          e.preventDefault();
          pushStateToHistory();
          setTimeline((prev) =>
            prev.map((ev) => (ev.id === eventoAEditar.id ? eventoAEditar : ev)),
          );
          setEventoAEditar(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDownModal);
    return () => window.removeEventListener("keydown", handleKeyDownModal);
  }, [eventoAEditar, pushStateToHistory]);

  return (
    <div style={estilos.pagina}>
      {/* HUD DE MODO LIMPIO FLOTANTE */}
      {analisisLimpio && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: "var(--color-superficie)",
            backdropFilter: "blur(10px)",
            border: "1px solid var(--color-dorado)",
            borderRadius: 8,
            padding: "8px 16px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-dorado)",
              letterSpacing: 1,
            }}
          >
            MODO ANÁLISIS LIMPIO
          </span>
          <button
            onClick={() => setAnalisisLimpio(false)}
            style={{
              background: "var(--color-dorado)",
              border: "none",
              borderRadius: 4,
              color: "var(--color-fondo)",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Minimize2 size={12} /> Salir
          </button>
        </div>
      )}

      {/* TOP HEADER - Hidden in Clean Mode */}
      {!analisisLimpio && (
        <header style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {/* Fila 1: Título y Botones Generales */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <h1 style={{ ...estilos.tituloSeccion, margin: 0 }}>EDITOR TÁCTICO</h1>
              <button
                className="boton-secundario"
                style={{ padding: "4px 8px", fontSize: 11 }}
                onClick={() =>
                  window.open(
                    `/#/panel-control/${id || "nuevo"}`,
                    "_blank",
                    "width=450,height=800,menubar=no,toolbar=no",
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
                  (b) => !b.archivado || b.id.toString() === boxeadorRojoId,
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
                  (b) => !b.archivado || b.id.toString() === boxeadorAzulId,
                )}
                cornerColor="var(--color-azul-suave)"
              />
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>

          {/* Controles de Dibujo Top Bar */}
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
                    ? estilos.btnHerramientaActivo
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
                    ? estilos.btnHerramientaActivo
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
                    ? estilos.btnHerramientaActivo
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
                    ? estilos.btnHerramientaActivo
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
                    ? estilos.btnHerramientaActivo
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
              {COLORES.map((color) => (
                <button
                  key={color}
                  style={{
                    ...estilos.btnColor,
                    background: color,
                    border:
                      colorActivo === color
                        ? "2px solid var(--color-texto)"
                        : "none",
                  }}
                  onClick={() => setColorActivo(color)}
                />
              ))}
            </div>
            <div style={estilos.divisor}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
              <span style={{ fontSize: 10, color: 'var(--color-texto-suave)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grosor</span>
              <input
                type="range"
                min="1"
                max="20"
                value={tamanioLapiz}
                onChange={(e) => setTamanioLapiz(Number(e.target.value))}
                style={{
                  width: 80,
                  accentColor: 'var(--color-dorado)',
                  cursor: 'pointer'
                }}
                title={`Grosor actual: ${tamanioLapiz}px`}
              />
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-dorado)', minWidth: 24, fontWeight: 700 }}>
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
                      letterSpacing: 2,
                      minWidth: 52,
                      textAlign: "center",
                    }}
                  >
                    {roundActual}
                  </span>
                </>
              )}

              <div style={estilos.divisor}></div>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 22,
                  fontWeight: 700,
                  color:
                    estadoRound === "DESCANSO"
                      ? "var(--color-dorado)"
                      : tiempoRound <= 10
                        ? "var(--color-rojo-suave)"
                        : "var(--color-texto)",
                  letterSpacing: 2,
                  minWidth: 60,
                  textAlign: "center",
                }}
              >
                {formatRound(tiempoRound)}
              </span>
              <div style={estilos.divisor}></div>
              <button
                onClick={handleCronometroPlayPause}
                style={{
                  ...estilos.btnHerramienta,
                  color: cronActivo
                    ? "var(--color-rojo-suave)"
                    : "var(--color-dorado)",
                }}
              >
                {cronActivo ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={resetCronometro}
                style={{ ...estilos.btnHerramienta, fontSize: 11 }}
                title="Reiniciar"
              >
                <SkipBack size={16} />
              </button>
              <select
                value={duracionRound}
                onChange={(e) => {
                  setDuracionRound(Number(e.target.value));
                  setTiempoRound(Number(e.target.value));
                }}
                style={{
                  background: "#1e1e28",
                  border: "none",
                  color: "var(--color-texto-suave)",
                  fontSize: 11,
                  outline: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                <option value={60} style={{ background: "#1e1e28", color: "#ffffff" }}>1 min</option>
                <option value={120} style={{ background: "#1e1e28", color: "#ffffff" }}>2 min</option>
                <option value={180} style={{ background: "#1e1e28", color: "#ffffff" }}>3 min</option>
                <option value={300} style={{ background: "#1e1e28", color: "#ffffff" }}>5 min</option>
              </select>
              <div style={estilos.divisor}></div>
              <button
                onClick={() =>
                  setMostrarMenuSincronizacion(!mostrarMenuSincronizacion)
                }
                style={{
                  ...estilos.btnHerramienta,
                  color: mostrarMenuSincronizacion
                    ? "var(--color-dorado)"
                    : "var(--color-texto-suave)",
                }}
                title="Vincular Rondas con Video"
              >
                <Zap size={16} />
              </button>
            </div>

            {/* MENÚ DE VINCULACIÓN DE RONDAS FLOTANTE */}
            {mostrarMenuSincronizacion && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  background: "var(--color-superficie)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--color-dorado)",
                  borderRadius: 12,
                  padding: 16,
                  zIndex: 999,
                  width: 320,
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: 12,
                    color: "var(--color-dorado)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Vincular Rondas con Video
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => {
                    const startVal = roundStarts[r] ?? 0;
                    return (
                      <div
                        key={r}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 11,
                          background: "var(--color-superficie-2)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--color-borde)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--color-texto)",
                          }}
                        >
                          Rnd {r}
                        </span>
                        <input
                          type="text"
                          value={formatRound(startVal)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parts = val.split(":");
                            let secs = 0;
                            if (parts.length === 2) {
                              secs =
                                parseInt(parts[0], 10) * 60 +
                                parseInt(parts[1], 10);
                            } else {
                              secs = parseInt(val, 10) || 0;
                            }
                            setRoundStarts((prev) => ({ ...prev, [r]: secs }));
                          }}
                          style={{
                            background: "var(--color-fondo)",
                            border: "1px solid var(--color-borde)",
                            color: "var(--color-texto)",
                            borderRadius: 4,
                            width: 60,
                            textAlign: "center",
                            fontSize: 10,
                            padding: "2px 0",
                          }}
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => {
                              const t = videoRef.current
                                ? Math.floor(videoRef.current.currentTime)
                                : 0;
                              setRoundStarts((prev) => ({ ...prev, [r]: t }));
                            }}
                            style={{
                              background: "var(--color-dorado-alfa)",
                              border: "none",
                              color: "var(--color-dorado)",
                              borderRadius: 4,
                              padding: "4px 6px",
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            title="Usar posición actual del video"
                          >
                            Fijar
                          </button>
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = startVal;
                                setCurrentTime(startVal);
                              }
                            }}
                            style={{
                              background: "var(--color-superficie)",
                              border: "1px solid var(--color-borde)",
                              color: "var(--color-texto-suave)",
                              borderRadius: 4,
                              padding: "4px 6px",
                              fontSize: 9,
                              cursor: "pointer",
                            }}
                          >
                            Ir a
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </div>
          </div>
        </header>
      )}

      {/* PROGRESS OVERLAY FOR TRAINING DATASET */}
      {exportandoDataset && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(20,20,20,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <Cpu size={48} color="var(--color-dorado)" className="animate-spin" />
          <h2
            style={{
              color: "var(--color-texto)",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Generando Dataset de Entrenamiento Táctico...
          </h2>
          <div
            style={{
              width: "80%",
              maxWidth: 400,
              background: "var(--color-superficie)",
              height: 10,
              borderRadius: 5,
              overflow: "hidden",
              border: "1px solid var(--color-borde)",
            }}
          >
            <div
              style={{
                background: "var(--color-dorado)",
                width: `${progresoExportacion}%`,
                height: "100%",
                transition: "width 0.2s",
              }}
            ></div>
          </div>
          <span
            style={{
              color: "var(--color-dorado)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {progresoExportacion}% completado
          </span>
        </div>
      )}

      <div style={estilos.layoutPrincipal}>
        {/* ZONA IZQUIERDA: Video + Canvas + Botones */}
        <div style={{ ...estilos.zonaVideo, flex: analisisLimpio ? "1" : "3" }}>
          <div style={{ ...estilos.reproductorWrapper, display: visorDetachadoAbierto ? 'none' : 'block' }} ref={wrapperRef}>
            {/* Placeholder si no hay video */}
            {!videoUrl && (
              <div style={{
                ...estilos.videoPlaceholder,
                background: "rgba(26, 26, 36, 0.75)",
                backdropFilter: "blur(12px)",
                border: videoFaltante ? "1px solid rgba(231,76,60,0.3)" : "1px solid rgba(212,175,55,0.2)",
                boxShadow: videoFaltante ? "0 8px 32px rgba(231,76,60,0.15)" : "0 8px 32px rgba(0,0,0,0.3)",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "480px",
                margin: "40px auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <Video size={48} color={videoFaltante ? "var(--color-rojo-suave)" : "var(--color-texto-suave)"} />
                <p
                  style={{
                    marginTop: 16,
                    color: "var(--color-texto)",
                    fontWeight: 600,
                    fontSize: "15px",
                  }}
                >
                  {videoFaltante
                    ? "Sesión Recuperada. Carga el video de nuevo:"
                    : "No hay video seleccionado"}
                </p>
                {videoFaltante && videoAbsolutePath && (
                  <div style={{
                    marginTop: 14,
                    marginBottom: 8,
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.05)",
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "var(--color-texto-suave)",
                    wordBreak: "break-all",
                    textAlign: "left",
                    width: "100%"
                  }}>
                    <div style={{ color: "var(--color-dorado)", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Ruta Guardada del Archivo:</div>
                    📁 {videoAbsolutePath}
                  </div>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                <button
                  className="boton-primario"
                  style={{
                    marginTop: 20,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    backgroundColor: videoFaltante
                      ? "var(--color-rojo-suave)"
                      : "var(--color-dorado)",
                    padding: "10px 20px",
                    borderRadius: "6px"
                  }}
                  onClick={seleccionarVideoNativo}
                >
                  <Upload size={18} />{" "}
                  {videoFaltante
                    ? "Enlazar Video Original"
                    : "Cargar Archivo Local"}
                </button>
              </div>
            )}
            {/* Botones cuando hay video: Desacoplar */}
            {videoUrl && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  zIndex: 15,
                  display: 'flex',
                  gap: 6,
                }}
              >
                <button
                  onClick={abrirVisorDetachado}
                  title="Abrir el video en una ventana separada (segundo monitor)"
                  style={{
                    padding: '5px 10px',
                    background: visorDetachadoAbierto
                      ? 'rgba(212,175,55,0.2)'
                      : 'rgba(20,20,20,0.85)',
                    border: visorDetachadoAbierto
                      ? '1px solid var(--color-dorado)'
                      : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    color: visorDetachadoAbierto ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    letterSpacing: '0.03em',
                    transition: 'all 0.2s',
                  }}
                >
                  <ExternalLink size={12} />
                  {visorDetachadoAbierto ? 'Visor Activo' : 'Desacoplar Video'}
                </button>
              </div>
            )}

            {/* Video real */}
            {videoUrl && (
              <>
                {/* GESTOR DE CAPAS VECTORIALES FLOTANTE (STROKE LAYER MANAGER) */}
                {videoUrl && !analisisLimpio && objetosDibujo.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      top: 20,
                      bottom: 70, // deja espacio para barra de controles inferior
                      width: 220,
                      background: "rgba(20, 20, 20, 0.8)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 12,
                      padding: 16,
                      zIndex: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-dorado)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anotaciones</span>
                      <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 10, color: 'var(--color-texto-suave)', fontWeight: 700 }}>
                        {objetosDibujo.length}
                      </span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                      {objetosDibujo.map((obj) => (
                        <div
                          key={obj.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '6px 10px',
                            borderRadius: 8,
                            transition: 'background 0.2s',
                          }}
                        >
                          {/* Indicador de Color */}
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: obj.color, flexShrink: 0 }} />
                          
                          {/* Input de Nombre editable */}
                          <input
                            type="text"
                            value={obj.label}
                            onChange={(e) => renombrarObjetoDibujo(obj.id, e.target.value)}
                            style={{
                              flex: 1,
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              fontSize: 11,
                              outline: 'none',
                              padding: '2px 4px',
                              fontFamily: 'inherit',
                              minWidth: 0,
                            }}
                          />
                          
                          {/* Conmutador de Visibilidad */}
                          <button
                            onClick={() => toggleVisibilidadObjeto(obj.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: obj.visible ? 'var(--color-dorado)' : 'var(--color-texto-muted)',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={obj.visible ? "Ocultar trazo" : "Mostrar trazo"}
                          >
                            {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          
                          {/* Eliminar quirúrgico */}
                          <button
                            onClick={() => eliminarObjetoDibujo(obj.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-texto-muted)',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-rojo-suave)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-texto-muted)'}
                            title="Eliminar trazo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={{
                    ...estilos.videoElement,
                    opacity: visorDetachadoAbierto ? 0 : 1,
                    pointerEvents: visorDetachadoAbierto ? 'none' : 'auto'
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={() => setIsPlaying(false)}
                />
                
                {visorDetachadoAbierto && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-texto-muted)",
                    background: "rgba(10,10,10,0.9)",
                    zIndex: 5
                  }}>
                    <ExternalLink size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <h3 style={{ margin: 0, fontWeight: 600, color: "var(--color-texto)" }}>Visor Desacoplado Activo</h3>
                    <p style={{ margin: "8px 0 0", fontSize: 13, maxWidth: 320, textAlign: "center", lineHeight: 1.5 }}>
                      El video se está visualizando en la ventana externa para liberar espacio en el editor.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* HUD DE INTENSIDAD EN TIEMPO REAL */}
            {videoUrl && !analisisLimpio && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 0.2,
                  repeat: intensidadRT.intensidad > 80 ? Infinity : 0,
                }}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "rgba(20,20,20,0.85)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${intensidadRT.intensidad > 70 ? "var(--color-rojo-suave)" : "var(--color-dorado)"}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  zIndex: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  pointerEvents: "none",
                  minWidth: 160,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid var(--color-superficie)",
                    borderTop: `3px solid ${intensidadRT.intensidad > 70 ? "var(--color-rojo-suave)" : "var(--color-dorado)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 900,
                    color: "var(--color-texto)",
                  }}
                >
                  {intensidadRT.intensidad}%
                </div>
                <div>
                  <div
                    style={{
                      color: "var(--color-dorado)",
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Intensidad RT
                  </div>
                  <div
                    style={{
                      color: "var(--color-texto)",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {intensidadRT.fase}
                  </div>
                  <div
                    style={{ color: "var(--color-texto-suave)", fontSize: 9 }}
                  >
                    {intensidadRT.epm} EPM (Últ. minuto)
                  </div>
                </div>
              </motion.div>
            )}

            {/* Canvas siempre en el DOM para evitar que React haga crash con Fabric.js */}
            <div
              style={{
                ...estilos.canvasElement,
                display: videoUrl ? "block" : "none",
                pointerEvents:
                  videoUrl && capaDibujoVisible && panelActivo !== "mapa" && herramientaActiva !== "cursor"
                    ? "auto"
                    : "none",
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>

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

          {/* VIDEO TIMELINE OVERLAY — se muestra si hay video */}
          {videoUrl && (
            <VideoTimelineOverlay
              eventos={eventosConNumero}
              eventoSeleccionadoId={eventoSeleccionadoId}
              duracion={videoDuration || (videoRef.current && !isNaN(videoRef.current.duration) ? videoRef.current.duration : 0)}
              tiempoActual={currentTime}
              expanded={visorDetachadoAbierto}
              style={{
                flex: visorDetachadoAbierto ? 1 : 'none',
              }}
              onSeek={(t, keepLoop = false) => {
                if (!keepLoop) {
                  setBucleRango(null); // Cancelar bucle en búsqueda manual
                  setBucleEventoId(null);
                }
                if (videoRef.current) {
                  videoRef.current.currentTime = t;
                  setCurrentTime(t);
                }
              }}
              onSeekLoop={(t, id) => {
                // Iniciar bucle táctico de 4s (2s antes, 2s después del marcador)
                const start = Math.max(0, t - 2);
                const end = t + 2;
                setBucleRango({ start, end });
                setBucleEventoId(id || null);
                if (videoRef.current) {
                  videoRef.current.currentTime = start;
                  setCurrentTime(start);
                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }}
              onCompare={({ a, b }) => console.log("[Comparar]", a, b)}
              onEditEvento={(ev) => {
                setEventoAEditar(ev);
                setSidebarExpandido(true);
                setPanelActivo("mapa");
                setEventoSeleccionadoId(ev.id);
              }}
              onUpdateEvento={(id, campos) => {
                setTimeline(prev => prev.map(ev => ev.id === id ? { ...ev, ...campos } : ev));
                if (bucleEventoId === id && campos.timestamp !== undefined) {
                  const t = campos.timestamp;
                  const start = Math.max(0, t - 2);
                  const end = t + 2;
                  setBucleRango({ start, end });
                }
              }}
            />
          )}

          {/* TAC-TECLADO ACCIONES (Hiding in clean mode makes drawing workspace extremely immersive) */}
          {!analisisLimpio && (
            <div
              style={{
                ...estilos.panelAcciones,
                opacity: videoUrl ? 1 : 0.5,
                pointerEvents: videoUrl ? "auto" : "none",
                minHeight: panelAccionesDesacoplado ? 200 : 'auto',
              }}
            >
              {panelAccionesDesacoplado ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    width: '100%',
                    height: '100%',
                    padding: '24px 16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px dashed var(--color-dorado)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <ExternalLink size={20} color="var(--color-dorado)" />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-texto)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Panel de Acciones Desacoplado</h4>
                    <p style={{ color: 'var(--color-texto-suave)', fontSize: 11, lineHeight: 1.4, maxWidth: 280 }}>
                      Las acciones tácticas se están registrando y controlando desde la ventana secundaria.
                    </p>
                  </div>
                  <button
                    onClick={() => setPanelAccionesDesacoplado(false)}
                    className="boton-secundario"
                    style={{ fontSize: 10, padding: '5px 12px', marginTop: 4 }}
                  >
                    Acoplar Panel Localmente
                  </button>
                </div>
              ) : (
                <>
                  {/* Selector de Foco */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 4,
                      gap: 10,
                      alignItems: "center",
                      width: '100%',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                <span style={estilos.labelGrupo}>🥊 Golpes Ofensivos</span>
                <div style={estilos.gridFila1}>
                  {ACCIONES_FILA_1.map((act) => (
                    <motion.button
                      key={act}
                      style={{
                        ...estilos.btnAccionPrincipal(esquinaDestino),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        padding: '6px 4px',
                        minHeight: 46,
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
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.02em' }}>{act}</span>
                      <span style={estilos.hotkeyHint}>[{formatearTecla(hotkeys[act])}]</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── GRUPO 2: DEFENSA Y MOVIMIENTO ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                <span style={estilos.labelGrupo}>🛡️ Defensa / Movimiento / Otros</span>
                <div style={estilos.gridFila2}>
                  {ACCIONES_FILA_2.map((act) => (
                    <motion.button
                      key={act}
                      style={{
                        ...estilos.btnAccionSecundaria,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        minHeight: 38,
                        padding: '5px 4px',
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
      )}
    </div>

        {/* ZONA DERECHA: Timeline + Heatmaps + Stats + Voz (Hiding completely in clean mode) */}
        {!analisisLimpio && (
          <div
            style={{
              ...estilos.zonaTimeline,
              maxWidth: sidebarExpandido ? 880 : 660,
              width: sidebarExpandido ? 880 : 660,
              opacity: 1,
              pointerEvents: "auto",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* ENCABEZADO Y TABS TÁCTICOS */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                borderBottom: "1px solid var(--color-borde)",
                background: "var(--color-superficie-1)",
              }}
            >
              {/* Header con botón Ampliar/Contraer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--color-borde)",
                  background: "rgba(255, 255, 255, 0.01)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--color-texto-suave)",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  Panel de Análisis{" "}
                  {sidebarExpandido ? "Extendido" : "Compacto"}
                </span>
                <button
                  onClick={() => setSidebarExpandido(!sidebarExpandido)}
                  style={{
                    background: sidebarExpandido
                      ? "rgba(212, 175, 55, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--color-borde)",
                    borderRadius: 6,
                    color: sidebarExpandido
                      ? "var(--color-dorado)"
                      : "var(--color-texto-suave)",
                    padding: "3px 8px",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: sidebarExpandido
                      ? "0 0 10px rgba(212, 175, 55, 0.2)"
                      : "none",
                  }}
                  title={
                    sidebarExpandido
                      ? "Volver a vista compacta (660px)"
                      : "Ampliar espacio de trabajo (880px)"
                  }
                >
                  {sidebarExpandido ? (
                    <Minimize2 size={10} />
                  ) : (
                    <Maximize2 size={10} />
                  )}
                  {sidebarExpandido ? "COMPACTAR" : "AMPLIAR"}
                </button>
              </div>

              {/* Pestañas (Tabs) tipo píldoras horizontales */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "6px",
                  margin: "0 8px 8px 8px",
                  background: "var(--color-superficie-2)",
                  borderRadius: 10,
                  border: "1px solid var(--color-borde)",
                  overflowX: sidebarExpandido ? "auto" : "visible",
                  whiteSpace: "nowrap",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {(() => {
                  const evSel = timeline.find(e => e.id === eventoSeleccionadoId);
                  const esGolpeSeleccionado = evSel && ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(evSel.tipo);
                  
                  return [
                    {
                      id: "timeline",
                      icon: Video,
                      label: sidebarExpandido ? "Línea Tiempo" : "Línea",
                      badge: timeline.length > 0 ? timeline.length : null,
                      color: "var(--color-texto)",
                      activeColor: "var(--color-dorado)",
                    },
                    {
                      id: "mapa",
                      icon: Target,
                      label: sidebarExpandido ? "Mapa Calor" : "Mapa",
                      badge: eventoSeleccionadoId ? "📍" : null,
                      color: "var(--color-texto)",
                      activeColor: "var(--color-rojo-suave)",
                    },
                    {
                      id: "stats",
                      icon: BarChart3,
                      label: "Estadísticas",
                      color: "var(--color-texto)",
                      activeColor: "var(--color-dorado-suave)",
                    },
                    {
                      id: "ollama",
                      icon: Cpu,
                      label: sidebarExpandido ? "Asistente IA" : "IA",
                      color: "var(--color-texto)",
                      activeColor: "var(--color-exito)",
                    },
                    {
                      id: "voz",
                      icon: Mic,
                      label: "Voz",
                      color: "var(--color-texto)",
                      activeColor: "var(--color-azul-suave)",
                    },
                  ].map((tab) => {
                    const isDisabled = tab.id === "mapa" && !esGolpeSeleccionado;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (isDisabled) return;
                          setPanelActivo(tab.id);
                        }}
                        disabled={isDisabled}
                        style={{
                          position: "relative",
                          flex: sidebarExpandido ? "0 0 auto" : 1,
                          display: "flex",
                          flexDirection: sidebarExpandido ? "row" : "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: sidebarExpandido ? "10px 16px" : "10px 6px",
                          borderRadius: 8,
                          background: panelActivo === tab.id ? "var(--color-superficie)" : "transparent",
                          color: isDisabled
                            ? "rgba(255, 255, 255, 0.15)"
                            : panelActivo === tab.id
                              ? tab.activeColor
                              : "var(--color-texto-suave)",
                          boxShadow: panelActivo === tab.id ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
                          border: "none",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          outline: "none",
                          opacity: isDisabled ? 0.3 : 1,
                        }}
                      >
                        {panelActivo === tab.id && (
                          <motion.div
                            layoutId="activeTabPill"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: 6,
                              border: `1px solid ${tab.activeColor}40`,
                              zIndex: 0,
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            flexDirection: sidebarExpandido ? "row" : "column",
                            alignItems: "center",
                            gap: sidebarExpandido ? 6 : 4,
                          }}
                        >
                          <div style={{ position: "relative" }}>
                            <tab.icon size={sidebarExpandido ? 16 : 18} strokeWidth={panelActivo === tab.id ? 2.5 : 2} />
                            {!sidebarExpandido && tab.badge && (
                              <div style={{
                                position: "absolute", top: -6, right: -10,
                                background: "var(--color-dorado)", color: "#000",
                                fontSize: 10, fontWeight: 800, padding: "2px 5px",
                                borderRadius: 12, lineHeight: 1
                              }}>
                                {tab.badge}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ 
                              fontSize: sidebarExpandido ? 13 : 11, 
                              fontWeight: panelActivo === tab.id ? 600 : 500,
                              letterSpacing: sidebarExpandido ? "normal" : "0.02em",
                              whiteSpace: "nowrap"
                            }}>
                              {tab.label}
                            </span>
                            {sidebarExpandido && tab.badge && (
                              <span style={{ 
                                background: panelActivo === tab.id ? `${tab.activeColor}20` : "rgba(255,255,255,0.1)", 
                                color: panelActivo === tab.id ? tab.activeColor : "var(--color-texto-suave)",
                                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 
                              }}>
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          {sidebarExpandido && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setMostrarManual(true);
                                setManualTab(tab.id);
                              }}
                              style={{
                                marginLeft: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.1)",
                                fontSize: 8,
                                color: "var(--color-texto)",
                                transition: "background 0.2s",
                              }}
                              title="Ayuda"
                            >
                              ?
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <AnimatePresence mode="wait">
                {panelActivo === "timeline" && (
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
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "var(--color-texto)",
                                }}
                              >
                                Línea de Tiempo Vacía
                              </h4>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "var(--color-texto-suave)",
                                  lineHeight: 1.5,
                                }}
                              >
                                Carga un video táctico y utiliza los atajos del
                                teclado o haz clic en las acciones inferiores
                                para registrar golpes y eventos.
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
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "var(--color-dorado)",
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                  marginBottom: 2,
                                }}
                              >
                                Consejos rápidos:
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--color-texto-suave)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>🥊</span> Tecla <strong>J</strong> para
                                Jab del rincón activo
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--color-texto-suave)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>⚡</span> Teclas <strong>Q / W</strong>{" "}
                                cambian Rincón Rojo/Azul
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--color-texto-suave)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>🎙️</span> Activa la Narración por Voz para
                                manos libres
                              </div>
                            </div>
                          </div>
                        ) : (
                          eventosConNumero.map((ev) => (
                            <motion.div
                              key={ev.id}
                              onClick={() => {
                                setEventoSeleccionadoId(ev.id);
                                if (videoRef.current) {
                                  videoRef.current.currentTime = ev.timestamp;
                                  setCurrentTime(ev.timestamp);
                                }
                                // Focus corresponding panel tab (exclusivity for punches)
                                const esMappable = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(ev.tipo);
                                if (esMappable) {
                                  setPanelActivo("mapa");
                                } else if (panelActivo === "mapa") {
                                  setPanelActivo("timeline");
                                }
                                // Restore drawing if available
                                if (fabricCanvasRef.current) {
                                  if (ev.canvasData) {
                                    try {
                                      isHistoryLoadingRef.current = true;
                                      fabricCanvasRef.current.loadFromJSON(
                                        JSON.parse(ev.canvasData),
                                        () => {
                                          fabricCanvasRef.current.renderAll();
                                          isHistoryLoadingRef.current = false;
                                          actualizarObjetosDibujo();
                                        },
                                      );
                                    } catch (e) {
                                      isHistoryLoadingRef.current = false;
                                    }
                                  } else {
                                    fabricCanvasRef.current.clear();
                                    actualizarObjetosDibujo();
                                  }
                                }
                              }}
                              style={{
                                ...estilos.eventoItem,
                                cursor: "pointer",
                                borderColor:
                                  eventoSeleccionadoId === ev.id
                                    ? "var(--color-dorado)"
                                    : "var(--color-borde)",
                                background:
                                  eventoSeleccionadoId === ev.id
                                    ? "rgba(212,175,55,0.08)"
                                    : "var(--color-superficie)",
                                boxShadow:
                                  eventoSeleccionadoId === ev.id
                                    ? "0 0 8px rgba(212,175,55,0.2)"
                                    : "none",
                                transition: "all 0.2s ease",
                              }}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                            >
                              {ev.snapshot ? (
                                <div
                                  style={{
                                    position: "relative",
                                    width: 44,
                                    height: 28,
                                    borderRadius: 4,
                                    overflow: "hidden",
                                    border: "1px solid var(--color-borde)",
                                    flexShrink: 0,
                                  }}
                                >
                                  <img
                                    src={ev.snapshot}
                                    alt="Snap"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: 1,
                                      right: 2,
                                      fontSize: 8,
                                      fontFamily: "monospace",
                                      color: "#fff",
                                      textShadow: "1px 1px 2px #000",
                                      background: "rgba(0,0,0,0.4)",
                                      padding: "0 2px",
                                      borderRadius: 2,
                                    }}
                                  >
                                    {formatTime(ev.timestamp)}
                                  </div>
                                </div>
                              ) : (
                                <div style={estilos.eventoTiempo}>
                                  {formatTime(ev.timestamp)}
                                </div>
                              )}
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "var(--color-dorado)",
                                    background: "rgba(212, 175, 55, 0.15)",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    marginRight: 4,
                                    whiteSpace: "nowrap"
                                  }}>
                                    #{ev._numero}
                                  </span>
                                  <select
                                    value={ev.tipo}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      pushStateToHistory();
                                      const nuevo = [...timeline];
                                      const idx = nuevo.findIndex(
                                        (t) => t.id === ev.id,
                                      );
                                      nuevo[idx].tipo = e.target.value;
                                      setTimeline(nuevo);
                                    }}
                                    style={{
                                      ...estilos.eventoTipo,
                                      background: "#1e1e28",
                                      color: "#ffffff",
                                      border: "none",
                                      outline: "none",
                                      cursor: "pointer",
                                      appearance: "none",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    <option value="Jab" style={{ background: "#1e1e28", color: "#ffffff" }}>Jab</option>
                                    <option value="Recto" style={{ background: "#1e1e28", color: "#ffffff" }}>Recto</option>
                                    <option value="Cross" style={{ background: "#1e1e28", color: "#ffffff" }}>Cross</option>
                                    <option value="Gancho" style={{ background: "#1e1e28", color: "#ffffff" }}>Gancho</option>
                                    <option value="Uppercut" style={{ background: "#1e1e28", color: "#ffffff" }}>Uppercut</option>
                                    <option value="Swing" style={{ background: "#1e1e28", color: "#ffffff" }}>Swing</option>
                                    <option value="Finta" style={{ background: "#1e1e28", color: "#ffffff" }}>Finta</option>
                                    <option value="Esquiva" style={{ background: "#1e1e28", color: "#ffffff" }}>Esquiva</option>
                                    <option value="Bloqueo" style={{ background: "#1e1e28", color: "#ffffff" }}>Bloqueo</option>
                                    <option value="Clinch" style={{ background: "#1e1e28", color: "#ffffff" }}>Clinch</option>
                                    <option value="Pivoteo" style={{ background: "#1e1e28", color: "#ffffff" }}>Pivoteo</option>
                                    <option value="Marca General" style={{ background: "#1e1e28", color: "#ffffff" }}>Marca General</option>
                                  </select>
                                  {ev.lugar ? (
                                    <div
                                      style={{
                                        fontSize: 9,
                                        color: "var(--color-dorado)",
                                        marginTop: 2,
                                      }}
                                    >
                                      📍 {ev.lugar}{" "}
                                    </div>
                                  ) : (
                                    ev.esquina !== "general" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEventoSeleccionadoId(ev.id);
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
                                          gap: 4
                                        }}
                                      >
                                        <span>📍</span> Mapear
                                      </button>
                                    )
                                  )}
                                  {tieneDibujo(ev) && (
                                    <span
                                      title="Dibujo táctico asociado"
                                      style={{
                                        color: "var(--color-dorado)",
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <PenTool size={11} />
                                    </span>
                                  )}
                                </div>
                                {ev.esquina !== "general" && (
                                  <div
                                    style={estilos.eventoEsquina(ev.esquina)}
                                  >
                                    Rincón{" "}
                                    {ev.esquina === "roja" ? "Rojo" : "Azul"}
                                  </div>
                                )}
                                {ev.lugar && (
                                  <div
                                    style={{
                                      fontSize: 9,
                                      color: "var(--color-dorado)",
                                      marginTop: 2,
                                    }}
                                  >
                                    📍 {ev.lugar}{" "}
                                    {ev.coordX
                                      ? `(${ev.coordX}, ${ev.coordY})`
                                      : ""}
                                  </div>
                                )}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEventoAEditar(ev);
                                    setSidebarExpandido(true);
                                    setPanelActivo("mapa");
                                    setEventoSeleccionadoId(ev.id);
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--color-texto-suave)",
                                    cursor: "pointer",
                                    padding: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title="Editar detalles precisos"
                                >
                                  <PenTool size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pushStateToHistory();
                                    setTimeline(
                                      timeline.filter((t) => t.id !== ev.id),
                                    );
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
                )}

                {/* TAB MAPA DE CALOR */}
                {panelActivo === "mapa" && (
                  <motion.div
                    key="mapa"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      padding: "10px 10px 0 10px",
                      gap: 8,
                    }}
                  >
                    {/* Mapa de impactos (ocupa el espacio disponible) */}
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <MapaImpactos
                        eventos={timeline}
                        onAddImpacto={handleAddImpacto}
                        onRemoveImpacto={handleRemoveImpacto}
                        onUpdateNota={handleUpdateNota}
                        onSelectEvento={handleSelectEvento}
                        onDeselectEvento={() => setEventoSeleccionadoId(null)}
                        onUpdateImpactoCoords={handleUpdateImpactoCoords}
                        eventoMapeoActivo={timeline.find(e => e.id === eventoSeleccionadoId)}
                        editable={true}
                        esquinaFiltro={esquinaDestino}
                      />
                    </div>


                  </motion.div>
                )}

                {/* TAB ESTADÍSTICAS EN TIEMPO REAL */}
                {panelActivo === "stats" && (
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


                    {/* KPIs */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          background: "var(--color-superficie)",
                          padding: 10,
                          borderRadius: 8,
                          textAlign: "center",
                          border: "1px solid var(--color-borde)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--color-texto-suave)",
                            textTransform: "uppercase",
                          }}
                        >
                          Eficacia Ofensiva
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: "var(--color-exito)",
                            marginTop: 4,
                          }}
                        >
                          {statsBoxeador.resumen.eficacia}%
                        </div>
                      </div>
                      <div
                        style={{
                          background: "var(--color-superficie)",
                          padding: 10,
                          borderRadius: 8,
                          textAlign: "center",
                          border: "1px solid var(--color-borde)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--color-texto-suave)",
                            textTransform: "uppercase",
                          }}
                        >
                          Volumen Golpes
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: "var(--color-texto)",
                            marginTop: 4,
                          }}
                        >
                          {statsBoxeador.resumen.volumen}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "var(--color-superficie)",
                          padding: 10,
                          borderRadius: 8,
                          textAlign: "center",
                          border: "1px solid var(--color-borde)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--color-texto-suave)",
                            textTransform: "uppercase",
                          }}
                        >
                          Defensas Totales
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: "var(--color-texto)",
                            marginTop: 4,
                          }}
                        >
                          {statsBoxeador.resumen.defensas}
                        </div>
                      </div>
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
                        {
                          label: "Jab",
                          val: statsBoxeador.counts?.Jab || 0,
                          color: "var(--color-dorado)",
                        },
                        {
                          label: "Recto",
                          val: statsBoxeador.counts?.Recto || 0,
                          color: "var(--color-dorado)",
                        },
                        {
                          label: "Cross",
                          val: statsBoxeador.counts?.Cross || 0,
                          color: "var(--color-dorado)",
                        },
                        {
                          label: "Gancho",
                          val: statsBoxeador.counts?.Gancho || 0,
                          color: "var(--color-dorado)",
                        },
                        {
                          label: "Uppercut",
                          val: statsBoxeador.counts?.Uppercut || 0,
                          color: "var(--color-dorado)",
                        },
                        {
                          label: "Swing",
                          val: statsBoxeador.counts?.Swing || 0,
                          color: "var(--color-dorado)",
                        },
                        {
                          label: "Finta",
                          val: statsBoxeador.counts?.Finta || 0,
                          color: "var(--color-azul-suave)",
                        },
                        {
                          label: "Esquiva",
                          val: statsBoxeador.counts?.Esquiva || 0,
                          color: "var(--color-azul-suave)",
                        },
                        {
                          label: "Bloqueo",
                          val: statsBoxeador.counts?.Bloqueo || 0,
                          color: "var(--color-azul-suave)",
                        },
                        {
                          label: "Clinch",
                          val: statsBoxeador.counts?.Clinch || 0,
                          color: "var(--color-azul-suave)",
                        },
                        {
                          label: "Pivoteo",
                          val: statsBoxeador.counts?.Pivoteo || 0,
                          color: "var(--color-azul-suave)",
                        },
                        {
                          label: "Marca General",
                          val: statsBoxeador.counts?.["Marca General"] || 0,
                          color: "var(--color-azul-suave)",
                        },
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
                      💡 Las métricas de volumen, eficacia y el conteo de acciones se
                      actualizan dinámicamente en tiempo real a medida que
                      etiquetas eventos en la línea de tiempo.
                    </div>
                  </motion.div>
                )}

                {/* TAB OLLAMA IA FRAME-BY-FRAME */}
                {panelActivo === "ollama" && (
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
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Cpu size={16} color="var(--color-exito)" />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--color-texto)",
                          textTransform: "uppercase",
                        }}
                      >
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--color-texto-suave)",
                          }}
                        >
                          Servidor Ollama:
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: ollamaDisponible
                              ? "var(--color-exito)"
                              : "var(--color-rojo-suave)",
                          }}
                        >
                          {ollamaDisponible
                            ? "🟢 CONECTADO"
                            : "🔴 NO ENCONTRADO"}
                        </span>
                      </div>

                      {/* Selectores */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 10,
                            color: "var(--color-texto-suave)",
                            fontWeight: 600,
                          }}
                        >
                          Modelo Multimodal de Visión:
                        </label>
                        <select
                          value={ollamaModelo}
                          onChange={(e) => setOllamaModelo(e.target.value)}
                          style={{
                            background: "var(--color-fondo)",
                            border: "1px solid var(--color-borde)",
                            color: "var(--color-texto)",
                            borderRadius: 6,
                            padding: 6,
                            fontSize: 11,
                            outline: "none",
                          }}
                        >
                          <option value="llava">llava (Default Vision)</option>
                          <option value="llama3.2-vision">
                            llama3.2-vision
                          </option>
                          <option value="moondream">moondream</option>
                        </select>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 10,
                            color: "var(--color-texto-suave)",
                            fontWeight: 600,
                          }}
                        >
                          Intervalo de Fotogramas:
                        </label>
                        <select
                          value={intervaloEscaneo}
                          onChange={(e) => setIntervaloEscaneo(e.target.value)}
                          style={{
                            background: "var(--color-fondo)",
                            border: "1px solid var(--color-borde)",
                            color: "var(--color-texto)",
                            borderRadius: 6,
                            padding: 6,
                            fontSize: 11,
                            outline: "none",
                          }}
                        >
                          <option value="manual">
                            Manual (Sólo al presionar botón)
                          </option>
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
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--color-dorado)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Configuración Avanzada
                        </span>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 10,
                              color: "var(--color-texto-suave)",
                            }}
                          >
                            <span>Temperatura de la IA:</span>
                            <span
                              style={{
                                fontWeight: 700,
                                fontFamily: "monospace",
                              }}
                            >
                              {temperaturaIA}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={temperaturaIA}
                            onChange={(e) =>
                              guardarAjusteIA(
                                "temperatura",
                                Number(e.target.value),
                              )
                            }
                            style={{
                              accentColor: "var(--color-dorado)",
                              cursor: "pointer",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <label
                              style={{
                                fontSize: 9,
                                color: "var(--color-texto-suave)",
                              }}
                            >
                              Filtro de Detección:
                            </label>
                            <select
                              value={filtroDeteccion}
                              onChange={(e) =>
                                guardarAjusteIA("filtro", e.target.value)
                              }
                              style={{
                                background: "var(--color-fondo)",
                                border: "1px solid var(--color-borde)",
                                color: "var(--color-texto)",
                                borderRadius: 4,
                                padding: 4,
                                fontSize: 10,
                                outline: "none",
                              }}
                            >
                              <option value="preciso">Precisión Máxima</option>
                              <option value="balanceado">Balanceado</option>
                              <option value="sensible">
                                Sensibilidad Extrema
                              </option>
                            </select>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <label
                              style={{
                                fontSize: 9,
                                color: "var(--color-texto-suave)",
                              }}
                            >
                              Tasa de Muestreo:
                            </label>
                            <select
                              value={tasaMuestreo}
                              onChange={(e) =>
                                guardarAjusteIA("tasa", Number(e.target.value))
                              }
                              style={{
                                background: "var(--color-fondo)",
                                border: "1px solid var(--color-borde)",
                                color: "var(--color-texto)",
                                borderRadius: 4,
                                padding: 4,
                                fontSize: 10,
                                outline: "none",
                              }}
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
                          disabled={
                            ollamaEstado === "Analizando..." || barriendoIA
                          }
                          style={{
                            flex: 1,
                            background: "var(--color-superficie-2)",
                            border: "1px solid var(--color-borde)",
                            color: "var(--color-texto)",
                            borderRadius: 6,
                            padding: "8px 0",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: barriendoIA ? 0.5 : 1,
                          }}
                        >
                          {ollamaEstado === "Analizando..."
                            ? "Analizando..."
                            : "Analizar Frame"}
                        </button>

                        <button
                          onClick={toggleEscaneoIA}
                          disabled={barriendoIA}
                          style={{
                            flex: 1,
                            background: escaneoActivoRef.current
                              ? "rgba(231,76,60,0.15)"
                              : "rgba(39,174,96,0.15)",
                            border: `1px solid ${escaneoActivoRef.current ? "var(--color-rojo-suave)" : "var(--color-exito)"}`,
                            color: escaneoActivoRef.current
                              ? "var(--color-rojo-suave)"
                              : "var(--color-exito)",
                            borderRadius: 6,
                            padding: "8px 0",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            opacity: barriendoIA ? 0.5 : 1,
                          }}
                        >
                          {escaneoActivoRef.current
                            ? "Detener IA"
                            : "Escanear IA"}
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
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--color-dorado)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Barrido Completo de Video
                        </span>

                        {!barriendoIA ? (
                          <>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--color-texto-suave)",
                                  flexShrink: 0,
                                }}
                              >
                                Paso de Barrido:
                              </span>
                              <select
                                value={stepBarrido}
                                onChange={(e) =>
                                  setStepBarrido(Number(e.target.value))
                                }
                                style={{
                                  flex: 1,
                                  background: "var(--color-fondo)",
                                  border: "1px solid var(--color-borde)",
                                  color: "var(--color-texto)",
                                  borderRadius: 6,
                                  padding: "4px 6px",
                                  fontSize: 10,
                                  outline: "none",
                                }}
                              >
                                <option value="0.5">
                                  Cada 0.5 Segundos (Precisión Máxima)
                                </option>
                                <option value="1.0">Cada 1.0 Segundo</option>
                                <option value="2.0">Cada 2.0 Segundos</option>
                                <option value="3.0">Cada 3.0 Segundos</option>
                              </select>
                            </div>
                            <button
                              onClick={iniciarBarridoIA}
                              disabled={escaneoActivoRef.current}
                              style={{
                                background: "var(--color-dorado-alfa)",
                                border: "1px solid var(--color-dorado)",
                                color: "var(--color-dorado)",
                                borderRadius: 6,
                                padding: "8px 0",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                opacity: escaneoActivoRef.current ? 0.5 : 1,
                              }}
                            >
                              🚀 Iniciar Barrido Automático
                            </button>
                          </>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 10,
                                color: "var(--color-texto)",
                              }}
                            >
                              <span>Progreso de Análisis:</span>
                              <span style={{ fontWeight: 700 }}>
                                {progresoBarrido}%
                              </span>
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
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--color-dorado)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
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
                          <Zap size={12} />{" "}
                          {cargandoVeredicto
                            ? "Compilando..."
                            : "Veredicto Estratégico Einstein"}
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
                              fontStyle: cargandoVeredicto
                                ? "italic"
                                : "normal",
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
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--color-texto-suave)",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
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
                          <span style={{ fontStyle: "italic", opacity: 0.5 }}>
                            Consola inactiva. Esperando análisis...
                          </span>
                        ) : (
                          logsIA.map((log, i) => (
                            <div
                              key={i}
                              style={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.02)",
                                paddingBottom: 4,
                                color: log.includes("Golpe Detectado")
                                  ? "var(--color-exito)"
                                  : "var(--color-texto-suave)",
                              }}
                            >
                              {log}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PANEL VOZ */}
                {panelActivo === "voz" && (
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
                            onClick={() =>
                              escuchando ? detenerEscucha() : iniciarEscucha()
                            }
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
                            {escuchando ? (
                              <MicOff size={18} />
                            ) : (
                              <Mic size={18} />
                            )}
                            {escuchando
                              ? "Grabando — Detener"
                              : "Iniciar Narración de Voz"}
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
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                      >
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
                          Etiquetas sugeridas automáticamente según la narración
                          de audio detectada:
                        </p>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
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
                          const logCompleto = obtenerLogCompleto
                            ? obtenerLogCompleto()
                            : [];
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
                                Las frases y anotaciones de voz aparecerán aquí
                                en tiempo real.
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
                                      videoRef.current.currentTime =
                                        item.tiempoVideo;
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
                                    (e.currentTarget.style.background =
                                      "rgba(255,255,255,0.08)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      item.esComando
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
                                        ⚡ Comando:{" "}
                                        <strong>{item.accionDetectada}</strong>
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
                                Activá el micrófono y comenzá a narrar. El
                                resumen se agrupará aquí.
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
                                  fontStyle: resumen[r].notes.startsWith(
                                    "Sin notas",
                                  )
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
                          background:
                            totalFrases > 0
                              ? "rgba(52,152,219,0.08)"
                              : "transparent",
                          border: "1px solid rgba(52,152,219,0.3)",
                          borderRadius: 6,
                          color:
                            totalFrases > 0
                              ? "var(--color-azul-suave)"
                              : "var(--color-texto-muted)",
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
                )}
              </AnimatePresence>
            </div>

            {/* PERSISTENT FOOTER FOR SIDEBAR */}
            <div
              style={{
                padding: "12px 10px",
                borderTop: "1px solid var(--color-borde)",
                background: "var(--color-superficie-2)",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Fila compacta de botones principales */}
              <div style={{ display: "flex", gap: 6, width: "100%" }}>
                {/* Guardar Progreso */}
                <button
                  style={{
                    flex: 1,
                    display: "flex",
                    gap: 5,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "8px 6px",
                    fontSize: 11,
                    borderRadius: 6,
                    fontWeight: 700,
                    background: "rgba(212, 175, 55, 0.08)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    color: "var(--color-dorado)",
                    cursor: guardandoProgreso ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: guardandoProgreso ? 0.7 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onClick={guardarProgreso}
                  disabled={guardandoProgreso}
                  title="Guarda el progreso actual como borrador. Podés retomarlo más tarde sin perder nada."
                >
                  <Database size={13} />{" "}
                  {guardandoProgreso ? "Guardando..." : "Guardar"}
                </button>

                {/* Finalizar Sesión */}
                <button
                  className="boton-primario"
                  style={{
                    flex: 1,
                    display: "flex",
                    gap: 5,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "8px 6px",
                    fontSize: 11,
                    borderRadius: 6,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                  onClick={finalizarSesion}
                  disabled={guardando}
                  title="Finaliza y guarda la sesión de forma permanente. Requiere seleccionar ambos boxeadores."
                >
                  <Save size={13} />{" "}
                  {guardando ? "Guardando..." : "Finalizar"}
                </button>

                {id && (
                  /* Ver Informe */
                  <button
                    className="boton-secundario"
                    style={{
                      flex: 1,
                      display: "flex",
                      gap: 5,
                      justifyContent: "center",
                      alignItems: "center",
                      borderColor: "var(--color-dorado)",
                      color: "var(--color-dorado)",
                      padding: "8px 6px",
                      fontSize: 11,
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => navigate(`/informe/${id}`)}
                  >
                    <FileText size={13} /> Informe
                  </button>
                )}
              </div>

              {/* Fila compacta secundaria para exportar dataset AI */}
              <button
                onClick={exportarDataset}
                style={{
                  width: "100%",
                  display: "flex",
                  gap: 6,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  background: "transparent",
                  border: "1px dashed rgba(212, 175, 55, 0.4)",
                  borderRadius: 6,
                  color: "var(--color-dorado)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Exporta el dataset etiquetado con capturas de golpes e impactos en formato JSON para el entrenamiento de modelos de inteligencia artificial."
              >
                <Database size={11} /> Dataset Entrenamiento AI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PRECISION EDIT POPUP */}
      {eventoAEditar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10,10,10,0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--color-superficie)",
              border: "1px solid var(--color-borde)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 420,
              padding: 24,
              boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--color-dorado)",
                }}
              >
                Edición de Precisión Táctica
              </h3>
              <button
                onClick={() => setEventoAEditar(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-texto-suave)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Tipo de Golpe/Acción */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--color-texto-suave)",
                    fontWeight: 600,
                  }}
                >
                  TIPO DE ACCIÓN:
                </label>
                <select
                  value={eventoAEditar.tipo}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value;
                    const esGolpe = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(nuevoTipo);
                    setEventoAEditar({ 
                      ...eventoAEditar, 
                      tipo: nuevoTipo,
                      ...(esGolpe && !eventoAEditar.hasOwnProperty("resultado") ? { resultado: "Conectado" } : {})
                    });
                  }}
                  style={{
                    background: "#1e1e28",
                    border: "1px solid var(--color-borde)",
                    color: "#ffffff",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    outline: "none",
                  }}
                >
                  <option value="Jab" style={{ background: "#1e1e28", color: "#ffffff" }}>Jab</option>
                  <option value="Recto" style={{ background: "#1e1e28", color: "#ffffff" }}>Recto</option>
                  <option value="Cross" style={{ background: "#1e1e28", color: "#ffffff" }}>Cross</option>
                  <option value="Gancho" style={{ background: "#1e1e28", color: "#ffffff" }}>Gancho</option>
                  <option value="Uppercut" style={{ background: "#1e1e28", color: "#ffffff" }}>Uppercut</option>
                  <option value="Swing" style={{ background: "#1e1e28", color: "#ffffff" }}>Swing</option>
                  <option value="Finta" style={{ background: "#1e1e28", color: "#ffffff" }}>Finta</option>
                  <option value="Esquiva" style={{ background: "#1e1e28", color: "#ffffff" }}>Esquiva</option>
                  <option value="Bloqueo" style={{ background: "#1e1e28", color: "#ffffff" }}>Bloqueo</option>
                  <option value="Clinch" style={{ background: "#1e1e28", color: "#ffffff" }}>Clinch</option>
                  <option value="Pivoteo" style={{ background: "#1e1e28", color: "#ffffff" }}>Pivoteo</option>
                  <option value="Marca General" style={{ background: "#1e1e28", color: "#ffffff" }}>Marca General</option>
                  {/* Eventos Legados */}
                  <option value="Golpe Conectado" style={{ background: "#1e1e28", color: "#ffffff" }}>Golpe Conectado (Legacy)</option>
                  <option value="Golpe Errado" style={{ background: "#1e1e28", color: "#ffffff" }}>Golpe Errado (Legacy)</option>
                </select>
              </div>

              {/* Resultado del Golpe (Exclusivo para Golpes Ofensivos con diseño Premium Glassmorphic) */}
              {["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(eventoAEditar.tipo) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label
                    style={{
                      fontSize: 10,
                      color: "var(--color-texto-suave)",
                      fontWeight: 600,
                    }}
                  >
                    RESULTADO DEL GOLPE:
                  </label>
                  <div
                    style={{
                      display: "flex",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 20,
                      padding: 4,
                      border: "1px solid var(--color-borde)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setEventoAEditar({ ...eventoAEditar, resultado: "Conectado" })
                      }
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        background:
                          eventoAEditar.resultado !== "Errado"
                            ? "linear-gradient(135deg, rgba(39, 174, 96, 0.25) 0%, rgba(39, 174, 96, 0.05) 100%)"
                            : "transparent",
                        color:
                          eventoAEditar.resultado !== "Errado"
                            ? "#2ECC71"
                            : "var(--color-texto-suave)",
                        border:
                          eventoAEditar.resultado !== "Errado"
                            ? "1px solid rgba(46, 204, 113, 0.3)"
                            : "1px solid transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      🟢 Conectado
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEventoAEditar({ ...eventoAEditar, resultado: "Errado" })
                      }
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        background:
                          eventoAEditar.resultado === "Errado"
                            ? "linear-gradient(135deg, rgba(231, 76, 60, 0.25) 0%, rgba(231, 76, 60, 0.05) 100%)"
                            : "transparent",
                        color:
                          eventoAEditar.resultado === "Errado"
                            ? "#E74C3C"
                            : "var(--color-texto-suave)",
                        border:
                          eventoAEditar.resultado === "Errado"
                            ? "1px solid rgba(231, 76, 60, 0.3)"
                            : "1px solid transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      🔴 Errado
                    </button>
                  </div>
                </div>
              )}

              {/* Esquina / Rincón */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--color-texto-suave)",
                    fontWeight: 600,
                  }}
                >
                  ESQUINA:
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() =>
                      setEventoAEditar({ ...eventoAEditar, esquina: "roja" })
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      border:
                        eventoAEditar.esquina === "roja"
                          ? "2px solid var(--color-rojo-suave)"
                          : "1px solid var(--color-borde)",
                      background:
                        eventoAEditar.esquina === "roja"
                          ? "rgba(231,76,60,0.15)"
                          : "transparent",
                      color:
                        eventoAEditar.esquina === "roja"
                          ? "var(--color-rojo-suave)"
                          : "var(--color-texto-suave)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Rincón Rojo
                  </button>
                  <button
                    onClick={() =>
                      setEventoAEditar({ ...eventoAEditar, esquina: "azul" })
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      border:
                        eventoAEditar.esquina === "azul"
                          ? "2px solid var(--color-azul-suave)"
                          : "1px solid var(--color-borde)",
                      background:
                        eventoAEditar.esquina === "azul"
                          ? "rgba(52,152,219,0.15)"
                          : "transparent",
                      color:
                        eventoAEditar.esquina === "azul"
                          ? "var(--color-azul-suave)"
                          : "var(--color-texto-suave)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Rincón Azul
                  </button>
                </div>
              </div>

              {/* Zona de Impacto (Lugar) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--color-texto-suave)",
                    fontWeight: 600,
                  }}
                >
                  📍 ZONA DE IMPACTO (LUGAR):
                </label>
                <input
                  type="text"
                  value={eventoAEditar.lugar || ""}
                  onChange={(e) =>
                    setEventoAEditar({ ...eventoAEditar, lugar: e.target.value })
                  }
                  placeholder="Añade zona de impacto (ej: Sien, Hígado, Mandíbula - opcional)..."
                  style={{
                    background: "var(--color-superficie-2)",
                    border: "1px solid var(--color-borde)",
                    color: "var(--color-texto)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--color-dorado)";
                    e.target.style.boxShadow = "0 0 5px rgba(212, 175, 55, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--color-borde)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Nota / Observación */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--color-texto-suave)",
                    fontWeight: 600,
                  }}
                >
                  OBSERVACIÓN TÁCTICA:
                </label>
                <textarea
                  value={eventoAEditar.nota || ""}
                  onChange={(e) =>
                    setEventoAEditar({ ...eventoAEditar, nota: e.target.value })
                  }
                  placeholder="Añade detalles del impacto o nota técnica..."
                  rows={3}
                  style={{
                    background: "var(--color-superficie-2)",
                    border: "1px solid var(--color-borde)",
                    color: "var(--color-texto)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setEventoAEditar(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--color-borde)",
                  color: "var(--color-texto-suave)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  pushStateToHistory();
                  setTimeline((prev) =>
                    prev.map((ev) =>
                      ev.id === eventoAEditar.id ? eventoAEditar : ev,
                    ),
                  );
                  setEventoAEditar(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  background: "var(--color-dorado)",
                  border: "none",
                  color: "var(--color-fondo)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Guardar Cambios
              </button>
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--color-texto-muted)",
                textAlign: "center",
              }}
            >
              Atajo: <kbd>Enter</kbd> para guardar · <kbd>Esc</kbd> para
              cancelar
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN BORRADOR RESTAURACIÓN */}
      {mostrarModalBorrador && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 100%)",
              border: "1px solid var(--color-dorado)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 420,
              padding: 28,
              boxShadow: "0 24px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.1)",
                  border: "2px dashed var(--color-dorado)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(212,175,55,0.15)",
                }}
              >
                <History size={26} color="var(--color-dorado)" />
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--color-dorado)",
                  letterSpacing: "0.02em",
                }}
              >
                Restaurar Progreso
              </h3>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: "1.6",
                color: "var(--color-texto)",
              }}
            >
              Se detectó una sesión de análisis inconclusa guardada automáticamente. ¿Deseas recuperar tu borrador para continuar con el trabajo sin perder progreso?
            </p>

            {borradorGuardado && (
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--color-borde)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-texto-suave)" }}>Golpes Registrados:</span>
                  <span style={{ color: "var(--color-texto)", fontWeight: 700 }}>
                    {borradorGuardado.timeline?.length || 0}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-texto-suave)" }}>Fecha de guardado:</span>
                  <span style={{ color: "var(--color-texto)", fontWeight: 700 }}>
                    {new Date(borradorGuardado.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <button
                onClick={handleAceptarBorrador}
                style={{
                  background: "linear-gradient(135deg, var(--color-dorado) 0%, #b8860b 100%)",
                  border: "none",
                  borderRadius: 8,
                  color: "#111",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(212,175,55,0.3)",
                  transition: "transform 0.2s, filter 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              >
                Restaurar Sesión
              </button>
              <button
                onClick={handleCancelarBorrador}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(231,76,60,0.4)",
                  borderRadius: 8,
                  color: "var(--color-rojo-suave)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(231,76,60,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Descartar Borrador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL DEL ANALISTA TÁCTICO */}
      {mostrarManual && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--color-superficie)",
              border: "1px solid var(--color-dorado)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              padding: 24,
              boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle size={18} color="var(--color-dorado)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-dorado)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Manual del Analista Táctico
                </h3>
              </div>
              <button
                onClick={() => setMostrarManual(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-texto-suave)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {/* Selector de Manual Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--color-borde)",
                gap: 4,
              }}
            >
              {[
                { id: "timeline", label: "Línea de Tiempo" },
                { id: "mapa", label: "Mapa" },
                { id: "stats", label: "Estadísticas" },
                { id: "ollama", label: "Asistente Einstein" },
                { id: "voz", label: "Narración de Voz" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setManualTab(tab.id)}
                  style={{
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      manualTab === tab.id
                        ? "2px solid var(--color-dorado)"
                        : "2px solid transparent",
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      manualTab === tab.id
                        ? "var(--color-dorado)"
                        : "var(--color-texto-suave)",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido Dinámico de la Guía */}
            <div
              style={{
                flex: 1,
                minHeight: 200,
                maxHeight: 300,
                overflowY: "auto",
                fontSize: 12,
                color: "var(--color-texto)",
                lineHeight: 1.6,
              }}
            >
              {manualTab === "timeline" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 13,
                      color: "var(--color-texto)",
                    }}
                  >
                    ⏱️ Control y Registro Temporal
                  </h4>
                  <p>
                    La <strong>Línea de Tiempo</strong> centraliza todas las
                    acciones capturadas durante la pelea. Puedes usar atajos
                    rápidos de teclado para registrar eventos con las manos en
                    la guardia:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <li>
                      <strong>Espacio:</strong> Reproducir / Pausar el video
                      táctico.
                    </li>
                    <li>
                      <strong>Q / W:</strong> Cambiar rincón activo (Rojo o
                      Azul).
                    </li>
                    <li>
                      <strong>J:</strong> Registrar un Jab del boxeador activo.
                    </li>
                    <li>
                      <strong>C:</strong> Registrar un Cross / Recto del
                      boxeador activo.
                    </li>
                    <li>
                      <strong>G / U:</strong> Registrar Gancho o Uppercut.
                    </li>
                  </ul>
                  <p>
                    Al hacer clic en cualquier tarjeta de la línea de tiempo
                    lateral, el reproductor de video retrocederá de forma
                    instantánea al segundo exacto de la acción para revisión
                    técnica.
                  </p>
                </div>
              )}

              {manualTab === "mapa" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 13,
                      color: "var(--color-texto)",
                    }}
                  >
                    🎯 Mapeo de Impactos en la Silueta
                  </h4>
                  <p>
                    El <strong>Mapa de Calor</strong> permite registrar
                    coordenadas precisas de impacto en una silueta anatómica
                    tridimensional:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <li>
                      Haz clic en cualquier área de la silueta tridimensional
                      del boxeador (Cabeza, Pecho, Hombro, Cuerpo) para
                      registrar una marca de impacto en ese fotograma exacto.
                    </li>
                    <li>
                      Filtra visualmente entre impactos del Rincón Rojo o Azul
                      para ver patrones defensivos y ofensivos claros.
                    </li>
                    <li>
                      Utiliza el botón <strong>Exportar Dataset JSON</strong>{" "}
                      para guardar fotogramas tácticos con coordenadas listas
                      para alimentar modelos de entrenamiento del Equipo Daneri.
                    </li>
                  </ul>
                </div>
              )}

              {manualTab === "stats" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 13,
                      color: "var(--color-texto)",
                    }}
                  >
                    📊 Estadísticas del Boxeador
                  </h4>
                  <p>
                    El panel de <strong>Estadísticas</strong> analiza en tiempo
                    real las etiquetas registradas en la sesión activa:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <li>
                      <strong>Eficacia Ofensiva:</strong> Relaciona los golpes
                      conectados sobre los errados para medir la precisión.
                    </li>
                    <li>
                      <strong>Volumen de Trabajo:</strong> Contabiliza los
                      intercambios de golpes y las defensas ejecutadas por
                      round.
                    </li>
                  </ul>
                </div>
              )}

              {manualTab === "ollama" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 13,
                      color: "var(--color-texto)",
                    }}
                  >
                    🧠 Asistente Local Einstein (IA)
                  </h4>
                  <p>
                    El <strong>Asistente Einstein</strong> es una inteligencia
                    artificial local autónoma que analiza la pelea fotograma por
                    fotograma:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <li>
                      <strong>Barrido de Video:</strong> El asistente puede
                      recorrer todo el video de manera autónoma, aplicando
                      visión artificial para detectar y registrar de forma
                      inteligente golpes y esquivas.
                    </li>
                    <li>
                      <strong>Veredicto Estratégico Einstein:</strong> Genera un
                      veredicto estructurado de 3 párrafos directamente en la
                      consola analítica detallando el estilo del boxeador,
                      fallos recurrentes y plan táctico inmediato.
                    </li>
                    <li>
                      <strong>Configuraciones de IA:</strong> Calibra la
                      temperatura y filtros de precisión de la IA local según el
                      contraste y calidad del video.
                    </li>
                  </ul>
                </div>
              )}

              {manualTab === "voz" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 13,
                      color: "var(--color-texto)",
                    }}
                  >
                    🎙️ Narración y Control por Voz
                  </h4>
                  <p>
                    La pestaña de <strong>Narración por Voz</strong> permite un
                    análisis 100% manos libres, ideal para entrenadores en plena
                    sesión activa de guanteo:
                  </p>
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <li>
                      Presiona "Iniciar Narración de Voz" para activar la
                      transcripción continua por voz.
                    </li>
                    <li>
                      Di comandos verbales naturales como:{" "}
                      <em>"Rincón Rojo Jab"</em>,{" "}
                      <em>"Rincón Azul Cross Conectado"</em> o{" "}
                      <em>"Esquiva del Rojo"</em>. El sistema los registrará
                      automáticamente en la línea de tiempo.
                    </li>
                    <li>
                      Usa comandos de reproducción: <em>"Play"</em> o{" "}
                      <em>"Pausa"</em> para guiar el reproductor sin tocar el
                      ratón.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <button
                onClick={() => setMostrarManual(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "var(--color-dorado)",
                  border: "none",
                  color: "var(--color-fondo)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Entendido, ¡a Trabajar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFORMATIVO / CONFIRMACIÓN PREMIUM (reemplaza alert y confirm nativos) */}
      <AnimatePresence>
        {modalInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5, 5, 8, 0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999999,
              padding: 16,
            }}
            onClick={modalInfo.tipo !== "confirmacion" ? modalInfo.onConfirm : undefined}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, #1a1a1f 0%, #111115 100%)",
                border: `2px solid ${
                  modalInfo.tipo === "exito"
                    ? "rgba(212, 175, 55, 0.8)"
                    : modalInfo.tipo === "error"
                    ? "rgba(231, 76, 60, 0.8)"
                    : "rgba(52, 152, 219, 0.8)"
                }`,
                borderRadius: 22,
                padding: "32px 28px",
                width: "100%",
                maxWidth: 420,
                boxShadow: `0 40px 100px rgba(0,0,0,0.95), 0 0 60px ${
                  modalInfo.tipo === "exito"
                    ? "rgba(212, 175, 55, 0.18)"
                    : modalInfo.tipo === "error"
                    ? "rgba(231, 76, 60, 0.18)"
                    : "rgba(52, 152, 219, 0.18)"
                }, inset 0 1px 0 rgba(255,255,255,0.08)`,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                textAlign: "center",
              }}
            >
              {/* Icono */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background:
                    modalInfo.tipo === "exito"
                      ? "rgba(212, 175, 55, 0.12)"
                      : modalInfo.tipo === "error"
                      ? "rgba(231, 76, 60, 0.12)"
                      : "rgba(52, 152, 219, 0.12)",
                  border: `1.5px solid ${
                    modalInfo.tipo === "exito"
                      ? "rgba(212, 175, 55, 0.4)"
                      : modalInfo.tipo === "error"
                      ? "rgba(231, 76, 60, 0.4)"
                      : "rgba(52, 152, 219, 0.4)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  fontSize: 26,
                }}
              >
                {modalInfo.tipo === "exito"
                  ? "✓"
                  : modalInfo.tipo === "error"
                  ? "✕"
                  : "?"}
              </div>

              {/* Texto */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                    color:
                      modalInfo.tipo === "exito"
                        ? "var(--color-dorado)"
                        : modalInfo.tipo === "error"
                        ? "var(--color-rojo-suave)"
                        : "var(--color-azul-suave)",
                  }}
                >
                  {modalInfo.tipo === "exito"
                    ? "Operación Exitosa"
                    : modalInfo.tipo === "error"
                    ? "Error del Sistema"
                    : "Confirmación Requerida"}
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--color-texto)",
                    lineHeight: 1.2,
                  }}
                >
                  {modalInfo.titulo}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--color-texto-suave)",
                    lineHeight: 1.6,
                  }}
                >
                  {modalInfo.mensaje}
                </p>
              </div>

              {/* Botones */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection:
                    modalInfo.tipo === "confirmacion" ? "row" : "column",
                }}
              >
                {modalInfo.tipo === "confirmacion" && (
                  <button
                    onClick={modalInfo.onCancel}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.07)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "var(--color-texto)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.07)";
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={modalInfo.onConfirm}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 10,
                    background:
                      modalInfo.tipo === "exito"
                        ? "var(--color-dorado)"
                        : modalInfo.tipo === "error"
                        ? "rgba(231, 76, 60, 0.2)"
                        : "rgba(52, 152, 219, 0.85)",
                    border:
                      modalInfo.tipo === "error"
                        ? "1px solid var(--color-rojo-suave)"
                        : "none",
                    color:
                      modalInfo.tipo === "exito"
                        ? "var(--color-fondo)"
                        : modalInfo.tipo === "error"
                        ? "var(--color-rojo-suave)"
                        : "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow:
                      modalInfo.tipo === "exito"
                        ? "0 4px 16px rgba(212,175,55,0.35)"
                        : "none",
                  }}
                >
                  {modalInfo.tipo === "exito"
                    ? "¡Perfecto!"
                    : modalInfo.tipo === "error"
                    ? "Entendido"
                    : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const estilos = {
  pagina: {
    padding: "32px 40px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--color-texto)",
    letterSpacing: "-0.02em",
    margin: "0 0 4px 0",
  },
  selectorRincon: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--color-superficie-2)",
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid var(--color-borde)",
  },
  labelRincon: { fontSize: 11, fontWeight: 700, textTransform: "uppercase" },
  selectBoxeador: {
    background: "var(--color-superficie)",
    border: "none",
    color: "var(--color-texto)",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: 4,
  },
  barraDibujo: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "var(--color-superficie-2)",
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid var(--color-borde)",
  },
  grupoHerramientas: { display: "flex", gap: 4 },
  btnHerramienta: {
    background: "transparent",
    border: "none",
    color: "var(--color-texto-suave)",
    width: 32,
    height: 32,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  btnHerramientaActivo: {
    background: "var(--color-dorado-alfa)",
    border: "none",
    color: "var(--color-dorado)",
    width: 32,
    height: 32,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  divisor: { width: 1, height: 24, background: "var(--color-borde)" },
  grupoColores: { display: "flex", gap: 8 },
  btnColor: { width: 20, height: 20, borderRadius: "50%", cursor: "pointer" },
  layoutPrincipal: {
    display: "flex",
    flex: 1,
    gap: 24,
    minHeight: 0,
    overflow: "hidden",
  },
  zonaVideo: {
    flex: 3,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
  },
  reproductorWrapper: {
    flex: 1,
    background: "var(--color-fondo)",
    borderRadius: 8,
    border: "1px solid var(--color-borde)",
    position: "relative",
    overflow: "hidden",
  },
  videoPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-superficie-2)",
  },
  videoElement: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  canvasElement: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 },
  playbackBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "var(--color-superficie-2)",
    padding: "12px 24px",
    borderRadius: 8,
    border: "1px solid var(--color-borde)",
  },
  btnPlayback: {
    background: "transparent",
    border: "none",
    color: "var(--color-texto)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPlayMain: {
    background: "var(--color-dorado)",
    border: "none",
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 0 15px var(--color-dorado-alfa)",
  },
  timeDisplay: {
    fontFamily: "monospace",
    fontSize: 18,
    fontWeight: 600,
    color: "var(--color-texto)",
    letterSpacing: "1px",
    marginLeft: 8,
  },
  panelAcciones: {
    background: "var(--color-superficie-2)",
    borderRadius: 8,
    padding: '10px 16px',
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
    display: 'block',
    lineHeight: 1,
    letterSpacing: '0.02em',
  },
  labelGrupo: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-texto-suave)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 3,
    borderBottom: '1px solid var(--color-borde)',
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
  btnEstado: {
    background: "transparent",
    border: "1px dashed var(--color-texto-suave)",
    color: "var(--color-texto-suave)",
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    transition: "all 0.15s",
  },
  zonaTimeline: {
    flex: 1,
    background: "var(--color-superficie-2)",
    borderRadius: 8,
    border: "1px solid var(--color-borde)",
    display: "flex",
    flexDirection: "column",
    maxWidth: 660,
  },
  timelineHeader: {
    padding: "20px",
    borderBottom: "1px solid var(--color-borde)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineLista: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  eventoItem: {
    background: "var(--color-superficie)",
    border: "1px solid var(--color-borde)",
    borderRadius: 6,
    padding: "12px",
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  eventoTiempo: {
    fontFamily: "monospace",
    color: "var(--color-texto-suave)",
    fontSize: 13,
    fontWeight: 600,
    background: "rgba(255,255,255,0.05)",
    padding: "4px 8px",
    borderRadius: 4,
  },
  eventoTipo: { fontSize: 13, fontWeight: 700, color: "var(--color-texto)" },
  eventoEsquina: (esquina) => ({
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    color:
      esquina === "roja"
        ? "var(--color-rojo-suave)"
        : "var(--color-azul-suave)",
    marginTop: 2,
  }),
  btnBorrarEvento: {
    background: "transparent",
    border: "none",
    color: "var(--color-texto-suave)",
    cursor: "pointer",
    padding: 4,
  },
};
