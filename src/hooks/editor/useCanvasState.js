import { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";

export default function useCanvasState({
  videoRef,
  wrapperRef,
  canvasRef,
  pushStateToHistory,
  actualizarObjetosDibujo,
  enviarActualizacionCanvas,
  isHistoryLoadingRef,
  defaultColor = "#E74C3C",
}) {
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [colorActivo, setColorActivo] = useState(defaultColor);
  const [tamanioLapiz, setTamanioLapiz] = useState(3);
  const [canvasInstance, setCanvasInstance] = useState(null);
  const fabricCanvasRef = useRef(null);

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
      canvas.freeDrawingBrush.width = tamanioLapiz;
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
        if (
          wrapperRef.current &&
          canvas &&
          videoRef.current &&
          videoRef.current.videoWidth
        ) {
          const rect = wrapperRef.current.getBoundingClientRect();
          const videoRatio =
            videoRef.current.videoWidth / videoRef.current.videoHeight;
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
            canvas.wrapperEl.style.position = "absolute";
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
        videoRef.current.addEventListener("loadedmetadata", handleResize);
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
          videoRef.current.removeEventListener(
            "loadedmetadata",
            canvas._handleResize
          );
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
    canvasInstance.freeDrawingBrush.width = tamanioLapiz;

    if (herramientaActiva === "cursor") {
      canvasInstance.defaultCursor = "default";
    } else {
      canvasInstance.defaultCursor = "crosshair";
    }

    // Limpiar eventos previos si los hay
    canvasInstance.off("mouse:down");
    canvasInstance.off("mouse:move");
    canvasInstance.off("mouse:up");

    let isDrawingShape = false;
    let startX = 0;
    let startY = 0;
    let currentShape = null;

    const onMouseDown = (o) => {
      if (herramientaActiva === "lapiz" || herramientaActiva === "cursor")
        return;
      if (o.target && herramientaActiva !== "texto") return; // No dibujar forma si hizo click en un objeto existente

      const pointer = canvasInstance.getPointer(o.e);
      isDrawingShape = true;
      startX = pointer.x;
      startY = pointer.y;

      if (herramientaActiva === "texto") {
        if (o.target && o.target.type === "i-text") return; // Dejar que el usuario edite el texto existente
        const text = new fabric.IText("Texto", {
          left: startX,
          top: startY,
          fill: colorActivo,
          fontSize: 24,
          fontFamily: "Inter",
        });
        canvasInstance.add(text);
        canvasInstance.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        isDrawingShape = false;
        setHerramientaActiva("cursor"); // Auto-switch a cursor para editar tranquilo
      } else if (herramientaActiva === "linea") {
        currentShape = new fabric.Line([startX, startY, startX, startY], {
          stroke: colorActivo,
          strokeWidth: tamanioLapiz,
          selectable: true,
          evented: true,
        });
        canvasInstance.add(currentShape);
      } else if (herramientaActiva === "circulo") {
        currentShape = new fabric.Circle({
          left: startX,
          top: startY,
          radius: 1,
          stroke: colorActivo,
          strokeWidth: tamanioLapiz,
          fill: "transparent",
          originX: "center",
          originY: "center",
          selectable: true,
          evented: true,
        });
        canvasInstance.add(currentShape);
      }
    };

    const onMouseMove = (o) => {
      if (!isDrawingShape || !currentShape) return;
      const pointer = canvasInstance.getPointer(o.e);

      if (herramientaActiva === "linea") {
        currentShape.set({ x2: pointer.x, y2: pointer.y });
      } else if (herramientaActiva === "circulo") {
        const radius = Math.max(
          Math.abs(pointer.x - startX),
          Math.abs(pointer.y - startY)
        );
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

    canvasInstance.on("mouse:down", onMouseDown);
    canvasInstance.on("mouse:move", onMouseMove);
    canvasInstance.on("mouse:up", onMouseUp);
  }, [
    herramientaActiva,
    colorActivo,
    tamanioLapiz,
    canvasInstance,
    pushStateToHistory,
  ]);

  // --- Actualizar color de objeto seleccionado ---
  useEffect(() => {
    if (!canvasInstance || !colorActivo) return;
    const activeObject = canvasInstance.getActiveObject();
    if (activeObject) {
      if (activeObject.type === "i-text" || activeObject.type === "text") {
        activeObject.set("fill", colorActivo);
      } else {
        activeObject.set("stroke", colorActivo);
      }
      canvasInstance.renderAll();
      pushStateToHistory();
    }
  }, [colorActivo, canvasInstance, pushStateToHistory]);

  return {
    herramientaActiva,
    setHerramientaActiva,
    colorActivo,
    setColorActivo,
    tamanioLapiz,
    setTamanioLapiz,
    canvasInstance,
    fabricCanvasRef,
  };
}
