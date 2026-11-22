// Formación de LumoBi Partners: 5 lecciones cortas. Frases cortas, una idea por pantalla, sin palabras técnicas.
// Los montos salen de las reglas reales del programa (backend), así nunca quedan desactualizados.
import type { Reglas } from "./comun";

export type Pantalla = { icono: string; titulo: string; texto?: string; color?: string };
export type Pregunta = { texto: string; opciones: string[]; correcta: number; porque: string };
export type Leccion = { id: string; titulo: string; minutos: string; icono: string; pantallas: Pantalla[]; pregunta: Pregunta };

const $ = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function lecciones(R: Reglas): Leccion[] {
  const base = R.precio_base || 45000;
  const alta = base * R.alta_pct;
  const mes = base * R.cartera_pct;
  return [
    {
      id: "que-es", titulo: "Qué es LumoBi", minutos: "1 min", icono: "🏪",
      pantallas: [
        { icono: "🏪", titulo: "LumoBi es una app para comercios", texto: "Kioscos, almacenes, autoservicios, ropa, electrónica, ferreterías." },
        { icono: "🧾", titulo: "El comercio cobra con LumoBi", texto: "Es su caja: ahí pasa cada venta." },
        { icono: "👀", titulo: "Y LumoBi mira todo lo que pasa", texto: "Cada venta, cada turno, cada empleado." },
        { icono: "🔔", titulo: "Le avisa al dueño cuando pierde plata", texto: "Falta plata en la caja. Vende algo más barato de lo que le costó. Un horario que vende poco." },
        { icono: "🙌", titulo: "Ayuda al dueño que no puede estar siempre", texto: "Porque tiene empleados, turnos o más de un local." },
      ],
      pregunta: {
        texto: "¿Qué hace LumoBi?",
        opciones: ["Le avisa al dueño dónde pierde plata", "Hace envíos a domicilio", "Presta plata"],
        correcta: 0, porque: "LumoBi es la caja del comercio y le avisa al dueño cuando algo no cierra.",
      },
    },
    {
      id: "como-ganas", titulo: "Cómo ganás plata", minutos: "1 min", icono: "💰",
      pantallas: [
        { icono: "🔗", titulo: "Tenés un link que es solo tuyo", texto: "Lo encontrás en tu panel." },
        { icono: "📲", titulo: "Se lo mandás a un comercio", texto: "Por WhatsApp. El mensaje ya está escrito." },
        { icono: "✅", titulo: "Si se registra con tu link, es tu cliente", texto: "Queda en tu cartera para siempre." },
        { icono: "🎉", titulo: `Paga su primer mes: cobrás ${$(alta)}`, texto: "Una vez." },
        { icono: "🔁", titulo: `Y cada mes que sigue pagando: ${$(mes)}`, texto: "Todos los meses. Mientras siga usando LumoBi." },
        { icono: "1️⃣", titulo: "Es por comercio, no por local", texto: "Si tiene 1 local o 10, cobrás lo mismo." },
      ],
      pregunta: {
        texto: "Un cliente tuyo paga LumoBi durante 6 meses. ¿Cuántas veces cobrás?",
        opciones: ["6 veces", "1 vez", "Ninguna"],
        correcta: 0, porque: `El primer mes cobrás ${$(alta)} y los otros 5 meses, ${$(mes)} cada uno. Cobrás mientras él pague.`,
      },
    },
    {
      id: "a-quien", titulo: "A quién buscar", minutos: "1 min", icono: "🎯",
      pantallas: [
        { icono: "🛒", titulo: "Comercios que venden productos", texto: "Kiosco, almacén, autoservicio, ropa, electrónica, bazar, ferretería." },
        { icono: "👥", titulo: "Mejor si el dueño tiene empleados", texto: "O más de un local. Es al que más le sirve." },
        { icono: "🚫", titulo: "Por ahora, no", texto: "Restaurantes, bares, cafés y mayoristas." },
        { icono: "🤝", titulo: "Empezá por los que ya conocés", texto: "El almacén de tu barrio, un amigo, un pariente con negocio." },
      ],
      pregunta: {
        texto: "¿Cuál es el mejor cliente para LumoBi?",
        opciones: ["Un almacén con 2 empleados", "Un bar", "Un mayorista"],
        correcta: 0, porque: "Vende productos y tiene empleados: LumoBi le muestra lo que pasa en cada turno.",
      },
    },
    {
      id: "mandar", titulo: "Cómo mandar tu link", minutos: "1 min", icono: "📲",
      pantallas: [
        { icono: "👆", titulo: "En tu panel, tocá «Mandar por WhatsApp»", texto: "Se abre WhatsApp con el mensaje listo." },
        { icono: "👤", titulo: "Elegí el contacto y enviá", texto: "Nada más. Tu link ya va adentro del mensaje." },
        { icono: "🆓", titulo: "Contale que tiene 5 días gratis", texto: "Sin tarjeta. Si no le sirve, no paga nada." },
        { icono: "⚠️", titulo: "Nunca prometas cuánta plata va a ahorrar", texto: "Cada negocio es distinto. Decile que lo pruebe y lo vea con sus números." },
      ],
      pregunta: {
        texto: "¿Qué NO tenés que hacer?",
        opciones: ["Prometerle que va a ahorrar $100.000", "Mandarle tu link", "Contarle que tiene 5 días gratis"],
        correcta: 0, porque: "No sabemos cuánto va a encontrar LumoBi en cada negocio. Prometer montos está prohibido en el programa.",
      },
    },
    {
      id: "despues", titulo: "Cuando se registra", minutos: "1 min", icono: "🚀",
      pantallas: [
        { icono: "📩", titulo: "Te llega un mail", texto: "Y lo ves en tu panel, en «Mis clientes»." },
        { icono: "⏳", titulo: "Tiene 5 días de prueba gratis", texto: "En esos días decide si se queda." },
        { icono: "🧾", titulo: "Lo más importante: que use la caja", texto: "Que haga su primera venta y cierre un turno." },
        { icono: "💬", titulo: "Si no arrancó, escribile", texto: "En tu panel ves si ya vendió. Si no, dale una mano." },
        { icono: "💸", titulo: "Cuando paga, cobrás", texto: `La plata queda ${R.retencion_dias} días en espera y después te la transferimos.` },
      ],
      pregunta: {
        texto: "Tu cliente lleva 2 días sin usar LumoBi. ¿Qué hacés?",
        opciones: ["Le escribo para ayudarlo a arrancar", "Nada, que se arregle", "Le digo que lo borre"],
        correcta: 0, porque: "El que arranca a usar la caja en la prueba es el que se queda. Y si se queda, vos cobrás todos los meses.",
      },
    },
  ];
}
