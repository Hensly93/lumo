// Guía de venta de LumoBi Partners: el dolor del comercio, qué hace LumoBi (solo lo que el producto ya hace), cómo buscar clientes en la calle
// y por internet, y cómo responder las dudas. La usan la página pública, la formación y la pestaña "Guía" del panel.
// Reglas: nada de promesas de ahorro, nada de spam ni mensajes masivos.

export type Item = { icono: string; titulo: string; texto: string };

// El dolor: lo que le pasa a casi todo comercio y el dueño no ve. Sin cifras inventadas.
export const DOLOR: Item[] = [
  { icono: "🕳️", titulo: "Pierde plata todos los meses y no se entera", texto: "No es un robo grande: son fugas chicas, todos los días, que nadie ve." },
  { icono: "💵", titulo: "La caja no cierra y nadie sabe por qué", texto: "Un faltante acá, un vuelto mal dado allá. Sumado a fin de mes, es mucha plata." },
  { icono: "🏷️", titulo: "Vende productos por debajo de lo que le cuestan", texto: "El proveedor aumentó, el precio quedó viejo, y cada venta le hace perder plata sin darse cuenta." },
  { icono: "📦", titulo: "Se queda sin lo que más vende", texto: "Cada día sin stock es plata que se va a otro comercio." },
  { icono: "👀", titulo: "No puede estar en todos lados", texto: "Si tiene empleados, turnos o más de un local, no sabe qué pasa cuando no está." },
  { icono: "📒", titulo: "Ve cuánto vendió, pero no cuánto ganó", texto: "Ni dónde se le fue la plata, ni qué hacer para que no vuelva a pasar." },
];

// La solución: LumoBi es inteligencia de negocio (Business Intelligence), no una caja más.
// La caja es solo la forma de juntar los datos. Mercado Pago no es el centro.
export const QUE_HACE: Item[] = [
  { icono: "🧠", titulo: "Aprende cómo funciona su negocio", texto: "Cada venta, cada turno, cada empleado y cada producto. Sabe qué es lo normal para ESE comercio." },
  { icono: "🚨", titulo: "Detecta cuando algo se sale de lo normal", texto: "Y le avisa al celular en el momento, no a fin de mes cuando ya es tarde." },
  { icono: "🔎", titulo: "Le muestra dónde se le va la plata", texto: "Cuánta, dónde y por qué, con la prueba en pesos: la caja de un turno, un producto mal cobrado, un precio viejo." },
  { icono: "✅", titulo: "Le dice qué hacer", texto: "Subir un precio, armar el pedido, revisar un turno, armar un combo. Con un botón." },
  { icono: "🔮", titulo: "Le anticipa lo que viene", texto: "Cuánto va a vender en los próximos días, qué horarios van a ser fuertes y qué se va a terminar." },
  { icono: "🧾", titulo: "Y todo sale de su propia caja", texto: "El comercio cobra con LumoBi (lector de códigos, efectivo, QR y tarjeta). Cada venta es un dato más para cuidarle la plata." },
];

// Explicación de 30 segundos, para decir en voz alta: dolor → solución → prueba.
export const EN_30_SEGUNDOS =
  "Casi todos los comercios pierden plata todos los meses sin enterarse: la caja que no cierra, productos vendidos por debajo del costo, mercadería que se termina. LumoBi aprende cómo funciona tu negocio, detecta cuando algo se sale de lo normal y te avisa al celular en el momento, con lo que tenés que hacer. Cobrás con LumoBi como con cualquier caja y él hace el resto. Lo probás 5 días gratis, sin tarjeta.";

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
  { pregunta: "«Ya tengo un sistema»", respuesta: "Tu sistema te dice cuánto vendiste. LumoBi te dice cuánto perdiste, dónde y por qué, y qué hacer. No es una caja más: es el que mira tu negocio cuando vos no estás. Probalo 5 días y comparalo." },
  { pregunta: "«Es caro»", respuesta: "Arranca en $45.000 por mes. La idea es que LumoBi te encuentre más plata de la que cuesta, y por eso tenés 5 días gratis para comprobarlo con tus números." },
  { pregunta: "«No tengo tiempo»", respuesta: "Se configura en minutos desde el celular y después trabaja solo: te avisa cuando hay algo para mirar." },
  { pregunta: "«No sé de tecnología»", respuesta: "Está hecho para que lo use cualquiera, desde el celu. Y te ayudo yo a dejarlo andando." },
  { pregunta: "«Lo tengo que pensar»", respuesta: "Dale. ¿Te parece si lo dejamos creado ahora? Los 5 días son gratis y sin tarjeta: si no te sirve, no pagás nada." },
  { pregunta: "«¿Mis datos están seguros?»", respuesta: "Cada comercio ve solo sus datos. Nadie más, ni yo como partner, puede ver tus ventas." },
];
