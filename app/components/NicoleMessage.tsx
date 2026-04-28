"use client";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Definidos como strings — se crean instancias frescas de RegExp por cada llamada
// para evitar que el lastIndex compartido crashee en React Concurrent Mode.
const LINK_DEFS: Array<{ source: string; ruta: string }> = [
  { source: "tus alertas de hoy",   ruta: "/alertas"      },
  { source: "el turno de la tarde", ruta: "/equipo"        },
  { source: "tus predicciones",     ruta: "/predicciones"  },
  { source: "las predicciones",     ruta: "/predicciones"  },
  { source: "el catálogo",          ruta: "/catalogo"      },
  { source: "tus ajustes",          ruta: "/ajustes"       },
  { source: "tus ventas",           ruta: "/historial"     },
  { source: "el historial",         ruta: "/historial"     },
  { source: "tu equipo",            ruta: "/equipo"        },
  { source: "los empleados",        ruta: "/equipo"        },
  { source: "los turnos",           ruta: "/equipo"        },
  { source: "tu red",               ruta: "/red"           },
  { source: "las alertas",          ruta: "/alertas"       },
  { source: "tu negocio",           ruta: "/ajustes"       },
];

function parseLinks(texto: string, accentColor: string): ReactNode[] {
  if (!texto) return [];

  try {
    type Match = { start: number; end: number; texto: string; ruta: string };
    const matches: Match[] = [];

    for (const { source, ruta } of LINK_DEFS) {
      const re = new RegExp(source, "gi"); // instancia nueva — sin estado compartido
      let m: RegExpExecArray | null;
      while ((m = re.exec(texto)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, texto: m[0], ruta });
      }
    }

    if (matches.length === 0) return [texto];

    // Ordenar por posición, eliminar overlaps (gana el primero)
    matches.sort((a, b) => a.start - b.start);
    const clean: Match[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        clean.push(m);
        lastEnd = m.end;
      }
    }

    const nodes: ReactNode[] = [];
    let cursor = 0;
    for (const m of clean) {
      if (m.start > cursor) nodes.push(texto.slice(cursor, m.start));
      nodes.push(
        <Link
          key={m.start}
          href={m.ruta}
          style={{
            color: accentColor,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            fontWeight: 500,
          }}
        >
          {m.texto}
        </Link>
      );
      cursor = m.end;
    }
    if (cursor < texto.length) nodes.push(texto.slice(cursor));

    return nodes;
  } catch {
    return [texto]; // fallback a texto plano si algo falla
  }
}

export default function NicoleMessage({
  texto,
  accentColor,
  style,
}: {
  texto: string;
  accentColor: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 14,
        lineHeight: 1.65,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        ...style,
      }}
    >
      {parseLinks(texto, accentColor)}
    </div>
  );
}
