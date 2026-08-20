"use client";
import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Localidad = {
  id: string;
  nombre: string;
  departamento: string | null;
};

type Props = {
  provinciaId: string | null;
  value: string;
  onSelect: (localidad: { id: string; nombre: string } | null) => void;
  placeholder?: string;
};

function inp(): React.CSSProperties {
  return {
    width: "100%",
    padding: "11px 14px",
    background: "var(--card2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--text)",
    fontSize: 14,
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };
}

export default function LocalidadAutocomplete({ provinciaId, value, onSelect, placeholder }: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [sugerencias, setSugerencias] = useState<Localidad[]>([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState<{ id: string; nombre: string } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Limpiar cuando cambia provinciaId
  useEffect(() => {
    setInputValue("");
    setSugerencias([]);
    setMostrarLista(false);
    setLocalidadSeleccionada(null);
    onSelect(null);
  }, [provinciaId]);

  // Sincronizar con prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cerrar lista al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrarLista(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar con debounce
  useEffect(() => {
    if (!provinciaId) {
      setSugerencias([]);
      return;
    }

    const texto = inputValue.trim();
    if (texto.length < 2) {
      setSugerencias([]);
      setMostrarLista(false);
      return;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Esperar 300ms antes de buscar
    timeoutRef.current = setTimeout(async () => {
      // Cancelar fetch anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo AbortController para esta búsqueda
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      try {
        const url = `${API}/api/geo/localidades?provincia_id=${provinciaId}&q=${encodeURIComponent(texto)}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (resp.ok) {
          const data: Localidad[] = await resp.json();
          setSugerencias(data);
          setMostrarLista(data.length > 0);
        } else {
          setSugerencias([]);
          setMostrarLista(false);
        }
      } catch (error) {
        // No mostrar error si fue abortado (es comportamiento esperado)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Error buscando localidades:", error);
        setSugerencias([]);
        setMostrarLista(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, provinciaId]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevoValor = e.target.value;
    setInputValue(nuevoValor);

    // Si había una selección y el usuario editó el texto, invalidarla
    if (localidadSeleccionada && nuevoValor !== localidadSeleccionada.nombre) {
      setLocalidadSeleccionada(null);
      onSelect(null);
    }
  }

  function handleSelect(loc: Localidad) {
    const selected = { id: loc.id, nombre: loc.nombre };
    setInputValue(loc.nombre);
    setLocalidadSeleccionada(selected);
    setMostrarLista(false);
    setSugerencias([]);
    onSelect(selected);
  }

  const disabled = !provinciaId;
  const placeholderText = disabled ? "Elegí la provincia primero" : (placeholder || "Buscar localidad...");

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholderText}
        disabled={disabled}
        style={{
          ...inp(),
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />

      {mostrarLista && sugerencias.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            maxHeight: 240,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {sugerencias.map((loc) => (
            <div
              key={loc.id}
              onClick={() => handleSelect(loc)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 14,
                color: "var(--text)",
                borderBottom: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--card)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {loc.nombre}
              {loc.departamento && (
                <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                  ({loc.departamento})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          ...
        </div>
      )}
    </div>
  );
}
