// Guía de venta de LumoBi Partners: qué hace LumoBi (solo lo que el producto ya hace), cómo buscar clientes en la calle
// y por internet, y cómo responder las dudas. La usan la página pública, la formación y la pestaña "Guía" del panel.
// Reglas: nada de promesas de ahorro, nada de spam ni mensajes masivos.

export type Item = { icono: string; titulo: string; texto: string };

// Qué hace LumoBi, en criollo. Mercado Pago no es el centro: es una fuente de datos más.
export const QUE_HACE: Item[] = [
  { icono: "🧾", titulo: "Es la caja del comercio", texto: "Cobra con lector de código de barras o buscando el producto. Efectivo, QR, débito y crédito. Funciona aunque se corte internet." },
  { icono: "💵", titulo: "Controla la caja de cada turno", texto: "Cada empleado entra con su PIN. Al cerrar el turno, LumoBi dice si falta o sobra plata y cuánto, sin acusar a nadie." },
  { icono: "🔔", titulo: "Avisa en el momento", texto: "Le manda al celular del dueño un aviso cuando algo se sale de lo normal: una diferencia de caja, una venta anulada rara, un día flojo." },
  { icono: "📉", titulo: "Encuentra dónde se pierde plata", texto: "Productos que se venden por debajo de lo que cuestan, precios que quedaron viejos, horarios que venden poco." },
  { icono: "🔮", titulo: "Anticipa las ventas", texto: "Dice cuánto va a vender en los próximos días y qué horarios van a estar más fuertes." },
  { icono: "📦", titulo: "Dice qué pedir y cuándo", texto: "Avisa qué productos se están por terminar y arma el pedido para el proveedor." },
];

// Explicación de 30 segundos, para decir en voz alta.
export const EN_30_SEGUNDOS =
  "LumoBi es una caja para tu comercio que además te cuida la plata. Cobrás con ella como con cualquier caja, y LumoBi mira cada venta y cada turno. Si falta plata en la caja, si vendés algo más barato de lo que te costó o si un horario viene flojo, te avisa al celular. Lo probás 5 días gratis, sin tarjeta.";

export const CALLE: Item[] = [
  { icono: "🗺️", titulo: "Elegí una zona y recorrela", texto: "Una avenida o un centro comercial con muchos negocios juntos. Anotá a quién visitaste para volver." },
  { icono: "🕙", titulo: "Andá en horario tranquilo", texto: "Media mañana (10 a 12) o media tarde (15 a 17). Nunca cuando el local está lleno." },
  { icono: "🙋", titulo: "Preguntá por el dueño o el encargado", texto: "Con el empleado no se decide nada. Si no está, preguntá cuándo vuelve." },
  { icono: "❓", titulo: "Arrancá con una pregunta, no con la app", texto: "«¿Te pasó que al cerrar la caja no te dan los números?» Si dice que sí, ya tenés la charla." },
  { icono: "📱", titulo: "Mostralo en tu celular", texto: "Abrí lumobi.com.ar y mostrale la página. Contale lo de los 5 días gratis, sin tarjeta." },
  { icono: "✍️", titulo: "Registralo ahí mismo", texto: "Pedile el WhatsApp, mandale tu link y ayudalo a crear la cuenta en el momento. Son 2 minutos. Si lo dejás para después, se olvida." },
  { icono: "🔁", titulo: "Volvé a los 2 días", texto: "Pasá o escribile: «¿Pudiste hacer la primera venta?». Ayudarlo a arrancar es lo que hace que se quede." },
  { icono: "🙂", titulo: "Si dice que no, agradecé y seguí", texto: "No insistas. Un «no» hoy puede ser un «sí» en un mes, si te fuiste con buena onda." },
];

export const INTERNET: Item[] = [
  { icono: "👥", titulo: "Empezá por tus contactos", texto: "Revisá tu WhatsApp: amigos, parientes y conocidos que tienen comercio. Mandales el mensaje uno por uno." },
  { icono: "📢", titulo: "Publicá en tu estado de WhatsApp", texto: "«Estoy trabajando con LumoBi, una caja que le avisa al dueño dónde pierde plata. Si tenés comercio, escribime y te cuento.»" },
  { icono: "📍", titulo: "Buscá en Google Maps", texto: "Buscá «almacén», «kiosco» o «autoservicio» y tu barrio. Muchos tienen WhatsApp o teléfono. Escribiles uno por uno, con el nombre del local." },
  { icono: "📸", titulo: "Instagram y Facebook de comercios", texto: "Muchos comercios tienen cuenta. Mandá un mensaje privado corto y personalizado, nombrando el local." },
  { icono: "🏘️", titulo: "Grupos de comerciantes de tu zona", texto: "En Facebook hay grupos de comerciantes por barrio. Leé las reglas del grupo antes: si no se permite publicidad, no publiques." },
  { icono: "🚫", titulo: "Nunca mensajes masivos", texto: "No compres listas ni mandes el mismo mensaje a cientos de personas: es spam, WhatsApp te bloquea el número y está prohibido en el programa." },
];

export const DUDAS: { pregunta: string; respuesta: string }[] = [
  { pregunta: "«Ya tengo un sistema»", respuesta: "La mayoría te dice cuánto vendiste. LumoBi te dice dónde se te va la plata y por qué. Probalo 5 días y comparalo." },
  { pregunta: "«Es caro»", respuesta: "Arranca en $45.000 por mes. La idea es que LumoBi te encuentre más plata de la que cuesta, y por eso tenés 5 días gratis para comprobarlo con tus números." },
  { pregunta: "«No tengo tiempo»", respuesta: "Se configura en minutos desde el celular y después trabaja solo: te avisa cuando hay algo para mirar." },
  { pregunta: "«No sé de tecnología»", respuesta: "Está hecho para que lo use cualquiera, desde el celu. Y te ayudo yo a dejarlo andando." },
  { pregunta: "«Lo tengo que pensar»", respuesta: "Dale. ¿Te parece si lo dejamos creado ahora? Los 5 días son gratis y sin tarjeta: si no te sirve, no pagás nada." },
  { pregunta: "«¿Mis datos están seguros?»", respuesta: "Cada comercio ve solo sus datos. Nadie más, ni yo como partner, puede ver tus ventas." },
];
