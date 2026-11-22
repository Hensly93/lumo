// Formación de LumoBi Partners: 7 lecciones cortas. Frases cortas, una idea por pantalla, sin palabras técnicas.
// Los montos salen de las reglas reales del programa (backend), así nunca quedan desactualizados.
import type { Reglas } from "./comun";
import { DOLOR, QUE_HACE, CALLE, INTERNET } from "./guia";

export type Pantalla = { icono: string; titulo: string; texto?: string; color?: string };
export type Pregunta = { texto: string; opciones: string[]; correcta: number; porque: string };
export type Leccion = { id: string; titulo: string; minutos: string; icono: string; pantallas: Pantalla[]; pregunta: Pregunta };

const $ = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function lecciones(R: Reglas): Leccion[] {
  const alta = R.alta_monto;
  const mes = R.cartera_monto;
  return [
    {
      id: "que-es", titulo: "El problema y la solución", minutos: "2 min", icono: "🧠",
      pantallas: [
        { icono: "🏪", titulo: "Casi todos los comercios tienen el mismo problema", texto: "Kioscos medianos y grandes, autoservicios, minimercados, supermercados y mayoristas." },
        ...DOLOR.map((x) => ({ icono: x.icono, titulo: x.titulo, texto: x.texto })),
        { icono: "💡", titulo: "LumoBi es la solución", texto: "No es una caja más: es la inteligencia que cuida la plata del comercio." },
        ...QUE_HACE.map((x) => ({ icono: x.icono, titulo: x.titulo, texto: x.texto })),
      ],
      pregunta: {
        texto: "¿Cuál es el problema que resuelve LumoBi?",
        opciones: ["El comercio pierde plata y no sabe dónde", "El comercio no tiene dónde cobrar", "El comercio no tiene página web"],
        correcta: 0, porque: "LumoBi aprende el negocio, detecta cuándo se pierde plata, avisa al dueño en el momento y le dice qué hacer. La caja es solo la forma de juntar los datos.",
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
        { icono: "🛒", titulo: "Comercios que venden productos", texto: "Kioscos medianos y grandes, autoservicios, minimercados, supermercados y mayoristas." },
        { icono: "👥", titulo: "Desde 3 empleados en adelante", texto: "3, 10, 50 o más. Cuantos más empleados, turnos o locales, más plata se le puede escapar al dueño." },
        { icono: "🚫", titulo: "No es para", texto: "El kiosco chico que atiende el dueño solo, restaurantes, bares y cafés." },
        { icono: "🤝", titulo: "Empezá por los que ya conocés", texto: "Un autoservicio o un supermercado de tu zona, un amigo o un pariente con negocio." },
      ],
      pregunta: {
        texto: "¿Cuál es el mejor cliente para LumoBi?",
        opciones: ["Un autoservicio con 6 empleados", "Un kiosco chico que atiende el dueño solo", "Un bar"],
        correcta: 0, porque: "Vende productos y tiene varios empleados: el dueño no puede ver todo, y LumoBi le muestra lo que pasa en cada turno."
      },
    },
    {
      id: "calle", titulo: "Buscar clientes en la calle", minutos: "2 min", icono: "🚶",
      pantallas: CALLE.map((x) => ({ icono: x.icono, titulo: x.titulo, texto: x.texto })),
      pregunta: {
        texto: "Entrás a un autoservicio y está lleno de gente. ¿Qué hacés?",
        opciones: ["Vuelvo en un horario tranquilo", "Le hablo al dueño igual, mientras cobra", "Le dejo el link al empleado y me voy"],
        correcta: 0, porque: "Con el local lleno, el dueño no te va a escuchar. Volvé a media mañana o media tarde.",
      },
    },
    {
      id: "internet", titulo: "Buscar clientes por internet", minutos: "2 min", icono: "🌐",
      pantallas: INTERNET.map((x) => ({ icono: x.icono, titulo: x.titulo, texto: x.texto })),
      pregunta: {
        texto: "¿Cuál es la mejor forma de escribirle a comercios que encontraste en Google Maps?",
        opciones: ["Uno por uno, con el nombre del local", "El mismo mensaje a 300 números juntos", "Comprar una lista de teléfonos"],
        correcta: 0, porque: "Un mensaje personalizado se lee. Los mensajes masivos son spam: WhatsApp te bloquea y está prohibido en el programa.",
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
