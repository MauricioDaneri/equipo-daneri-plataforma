import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({ label, value, onChange, boxeadores = [], cornerColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedBoxer = boxeadores.find(
    (b) => b.id.toString() === value?.toString()
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
