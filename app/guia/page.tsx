"use client";
// Guía dentro de LumoBi: "¿qué querés hacer?" y te lleva, con pasos cortos y el botón que hace falta.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import LinkCaja from "../components/LinkCaja";

type Tarea = {
  id: string; titulo: string; pasos: string[]; boton?: { texto: string; ir: string }; linkCaja?: boolean;
};

const TAREAS: Tarea[] = [
  {
    id: "empleado", titulo: "Que mi empleado venda desde su celu o compu",
    pasos: [
      "Creá a tu empleado con nombre y PIN en Equipo → Caja del local.",
      "Mandale este link por WhatsApp, o abrí el QR desde el aparato donde se vende.",
      "Tu empleado abre el link, elige su nombre y pone su PIN. Ya puede abrir el turno y cobrar.",
    ],
    linkCaja: true, boton: { texto: "Crear o editar empleados", ir: "/mi-local" },
  },
  {
    id: "productos", titulo: "Cargar mis productos",
    pasos: [
      "Entrá a Productos.",
      "Cargá con la pistola lectora, con la cámara del celu o con la foto de una lista del proveedor.",
      "Ponele el costo a cada producto: sin costo LumoBi no puede calcular cuánto ganás.",
    ],
    boton: { texto: "Ir a Productos", ir: "/catalogo" },
  },
  {
    id: "stock", titulo: "Saber qué tengo y qué se vende",
    pasos: [
      "En Productos, abrí Stock.",
      "\"Qué tengo\" muestra lo que hay y lo que te falta reponer.",
      "\"Qué se vende\" muestra lo que más rota, lo que más ganancia deja y lo que casi no se mueve.",
    ],
    boton: { texto: "Ver el stock", ir: "/catalogo" },
  },
  {
    id: "mp", titulo: "Conectar Mercado Pago y cobrar con QR",
    pasos: [
      "Entrá a Cuenta → Ajustes → Mercado Pago y tocá Conectar.",
      "Desde ahí, en la caja de tu empleado aparece el botón de QR con el monto exacto.",
      "Cuando el cliente paga, la venta se cierra sola.",
    ],
    boton: { texto: "Ir a Ajustes", ir: "/ajustes" },
  },
  {
    id: "factura", titulo: "Cargar una factura de proveedor",
    pasos: [
      "Entrá a Plata → Facturas de proveedores.",
      "Sacale una foto: LumoBi la lee y te muestra lo que entendió.",
      "Confirmás o corregís. La foto no se guarda, solo queda lo que confirmás.",
    ],
    boton: { texto: "Ir a Facturas", ir: "/compras" },
  },
  {
    id: "fugas", titulo: "Ver dónde pierdo plata",
    pasos: [
      "Entrá a Plata → Fugas.",
      "Cada fuga dice cuánta plata es, dónde está y cómo cerrarla.",
      "Cuando la resolvés, tocá Resuelto: a los 28 días LumoBi mide cuánto recuperaste.",
    ],
    boton: { texto: "Ver las fugas", ir: "/fugas" },
  },
  {
    id: "avisos", titulo: "Recibir avisos en el celu",
    pasos: ["Activá los avisos en tu celu.", "LumoBi te avisa cuando detecta algo, con un toque vas directo a la pantalla correcta."],
    boton: { texto: "Activar avisos", ir: "/primeros-pasos?paso=avisos" },
  },
  {
    id: "instalar", titulo: "Instalar LumoBi en el celu",
    pasos: ["Entrá a Cuenta (el icono de persona, arriba a la derecha).", "Tocá Instalar la app y seguí los pasos."],
    boton: { texto: "Instalar la app", ir: "/mas" },
  },
  {
    id: "pin", titulo: "Cambiar el PIN o sacar a un empleado",
    pasos: ["Entrá a Equipo → Caja del local.", "Tocá al empleado: ahí cambiás el PIN, el permiso de precios o lo das de baja."],
    boton: { texto: "Ir a Caja del local", ir: "/mi-local" },
  },
  {
    id: "equipo", titulo: "Ver cómo trabaja mi equipo",
    pasos: ["Entrá a Equipo → Control del equipo.", "Ves el rendimiento, las autorizaciones y la actividad de la caja de cada turno."],
    boton: { texto: "Ir a Control del equipo", ir: "/empleados" },
  },
  {
    id: "nicole", titulo: "Preguntarle algo a NICOLE",
    pasos: ["Tocá NICOLE, el botón del medio de la barra de abajo.", "Preguntale con tus palabras: \"¿cómo me fue esta semana?\"."],
    boton: { texto: "Hablar con NICOLE", ir: "/nicole" },
  },
  {
    id: "plan", titulo: "Ver o cambiar mi plan y mi pago",
    pasos: ["Entrá a Cuenta → Ajustes → Mi Suscripción."],
    boton: { texto: "Ir a Ajustes", ir: "/ajustes" },
  },
];

export default function GuiaPage() {
  const router = useRouter();
  const [abierta, setAbierta] = useState<string | null>("empleado");

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Guía" sub="¿Qué querés hacer? Tocá y te mostramos cómo" />
      <div style={{ padding: "0 12px" }}>
        {TAREAS.map((t) => {
          const on = abierta === t.id;
          return (
            <div key={t.id} style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
              <div
                onClick={() => setAbierta(on ? null : t.id)}
                style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              >
                <div style={{ flex: 1, fontFamily: "var(--font-instrument), sans-serif", fontSize: 15, fontWeight: 600, color: "var(--tinta)" }}>{t.titulo}</div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ transform: on ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                  <path d="M9 18l6-6-6-6" stroke="var(--tinta-apagada)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {on && (
                <div style={{ padding: "0 18px 18px" }}>
                  <ol style={{ margin: "0 0 14px", paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: "var(--tinta)" }}>
                    {t.pasos.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
                  </ol>
                  {t.linkCaja && <div style={{ marginBottom: 12 }}><LinkCaja /></div>}
                  {t.boton && (
                    <button
                      onClick={() => router.push(t.boton!.ir)}
                      style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1px solid var(--linea)", background: "transparent", color: "var(--tinta)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                    >
                      {t.boton.texto}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Nav />
    </main>
  );
}
