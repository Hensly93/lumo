// guiaPantallas.ts — qué es cada pantalla de LumoBi, en simple (14/11/2026)
// Para cada pantalla: qué hace LumoBi acá, qué hacés vos, y qué tiene que estar listo para que funcione
// (los requisitos se calculan en vivo con /api/guia/estado).

export type Guia = {
  titulo: string;
  lumobi: string;     // qué hace LumoBi en esta pantalla
  vos: string;        // qué hace el dueño
  requisitos: string[];
  accion?: { texto: string; ir: string };
};

export const GUIAS: Record<string, Guia> = {
  "/": {
    titulo: "Tu inicio",
    lumobi: "Junta todo lo importante de tu negocio en una pantalla: cuánto llevás hoy, cuánto esperás vender, el último turno, las alertas y lo que encontró NICOLE.",
    vos: "Miralo una vez por día. Tocá cualquier tarjeta para ver de dónde sale el número y qué hacer.",
    requisitos: ["empleados", "caja", "avisos", "dias3"],
  },
  "/negocio": {
    titulo: "Plata",
    lumobi: "Todo lo que tiene que ver con plata: dónde se va, cuánto te deja, cómo cambió y qué viene.",
    vos: "Elegí qué querés ver. Si no sabés por dónde empezar, empezá por Fugas.",
    requisitos: ["ventas", "costos", "gastos"],
  },
  "/fugas": {
    titulo: "Fugas: dónde se va la plata",
    lumobi: "Busca solo dónde perdés plata: diferencias de caja, productos que te dejan poco margen, cosas que se dejaron de vender, comisiones. Cada fuga trae el monto y cómo cerrarla.",
    vos: "Abrí cada fuga y hacé lo que dice. Cuando la arreglás, tocá \"La resolví\": LumoBi mide cuánta plata recuperaste. Si no es una fuga, tocá \"No es una fuga\" y aprende.",
    requisitos: ["caja", "costos", "mp"],
  },
  "/periodos": {
    titulo: "Comparar períodos",
    lumobi: "Compara tus ventas entre días, semanas y meses, y te muestra qué subió y qué bajó.",
    vos: "Elegí el período que querés mirar y contra cuál compararlo.",
    requisitos: ["ventas", "dias3"],
  },
  "/rentabilidad": {
    titulo: "Cuánto ganás de verdad",
    lumobi: "Calcula tu ganancia real: lo que vendiste, menos lo que te costó la mercadería, menos los gastos del mes. Te dice cuánto tenés que vender para no perder.",
    vos: "Cargá una vez por mes los gastos fijos (alquiler, sueldos, luz) y el costo de tus productos.",
    requisitos: ["ventas", "costos", "gastos"],
  },
  "/compras": {
    titulo: "Facturas de proveedores",
    lumobi: "Lee la foto de la factura, actualiza tus costos y te avisa si un proveedor te subió el precio y a cuánto tenés que vender para no perder margen.",
    vos: "Sacale una foto a cada factura cuando llega el pedido y confirmá lo que leyó. La foto no se guarda.",
    requisitos: ["productos"],
  },
  "/predicciones": {
    titulo: "Predicciones",
    lumobi: "Predice cuánto vas a vender cada día de los próximos 7, con el clima, los feriados y el principio de mes. Mientras aprende, te da una estimación preliminar.",
    vos: "Usala para decidir pedidos y cuánta gente poner en cada turno. Cada día que pasa se afina sola.",
    requisitos: ["ventas", "dias3"],
  },
  "/nicole": {
    titulo: "NICOLE, tu analista",
    lumobi: "Contesta cualquier pregunta sobre tu negocio con tus propios números: cuánto vendiste, qué pasó, qué conviene hacer.",
    vos: "Escribile como a una persona. Ej: \"¿por qué vendí menos el martes?\" o \"¿qué combo me conviene?\".",
    requisitos: ["ventas"],
  },
  "/catalogo": {
    titulo: "Productos",
    lumobi: "Guarda tus productos con precio y costo, lleva el stock solo con cada venta y te muestra qué se vende más, qué deja más plata y qué no se mueve.",
    vos: "Cargá tus productos con la pistola lectora o la foto de la lista del proveedor, y ponele el costo a cada uno. También se dan de alta en la caja mientras vendés.",
    requisitos: ["productos", "costos"],
  },
  "/equipo": {
    titulo: "Equipo",
    lumobi: "Todo sobre tu gente: quién atiende, cómo entra a la caja y cómo trabaja cada uno.",
    vos: "En Caja del local creás a cada empleado con su PIN. En Control del equipo ves cómo le va a cada uno.",
    requisitos: ["empleados", "caja"],
  },
  "/empleados": {
    titulo: "Control del equipo",
    lumobi: "Analiza a cada empleado con hechos: diferencias de caja de sus turnos, cuánto vende y qué ticket hace, conteos sorpresa. Si un patrón se repite, lo marca en amarillo o rojo.",
    vos: "Revisá a los que estén en amarillo o rojo, mirá el detalle y respondé si había un problema o estaba todo bien: con eso LumoBi aprende.",
    requisitos: ["empleados", "caja", "turnos_emp"],
  },
  "/mi-local": {
    titulo: "Caja del local",
    lumobi: "Arma la caja de tu local: cada empleado entra con su nombre y su PIN, y todo lo que cobra queda a su nombre.",
    vos: "Creá a cada persona con un PIN de 4 números y mandale el link de la caja (o abrilo en la compu del local).",
    requisitos: ["empleados", "caja"],
  },
  "/alertas": {
    titulo: "Alertas",
    lumobi: "Te avisa cuando algo se sale de lo normal en tu negocio: un turno que vendió mucho menos, una caja que cierra mal varias veces, un cambio raro en los pagos. Siempre con el monto y la evidencia.",
    vos: "Revisá cada alerta y marcá si era un problema real o no: LumoBi aprende de tu respuesta y no te molesta con lo que no importa.",
    requisitos: ["caja", "turnos5", "avisos"],
  },
  "/benchmark": {
    titulo: "Comparación con tu rubro",
    lumobi: "Compara tu negocio con negocios parecidos de tu rubro y tu zona. Nadie ve tus datos ni vos los de otros: solo promedios.",
    vos: "Mirá en qué estás mejor y en qué peor que el resto.",
    requisitos: ["ventas", "dias3"],
  },
  "/red": {
    titulo: "Tus locales",
    lumobi: "Si tenés más de un local, LumoBi analiza cada uno por separado y todos juntos.",
    vos: "Cargá la dirección de cada local. Con uno solo, alcanza con cargarlo una vez.",
    requisitos: ["locales"],
  },
  "/ajustes": {
    titulo: "Ajustes",
    lumobi: "Acá decidís qué avisos te llegan y conectás Mercado Pago.",
    vos: "Activá los avisos en este celu y probá que lleguen con \"Mandarme un aviso de prueba\".",
    requisitos: ["avisos", "mp"],
  },
};

// Qué es cada requisito, en simple (se muestra con ✓ o con lo que falta)
export const REQUISITO_NOMBRE: Record<string, string> = {
  empleados: "Alguien creado para la caja",
  caja: "La caja abierta y un turno cerrado",
  ventas: "Ventas en LumoBi",
  dias3: "3 días de ventas",
  turnos5: "5 turnos cerrados",
  turnos_emp: "3 turnos por empleado",
  productos: "Productos cargados",
  costos: "Costo de tus productos",
  gastos: "Gastos fijos del mes",
  facturas: "Una factura de proveedor",
  avisos: "Avisos activados en tu celu",
  locales: "Tu local cargado",
  mp: "Mercado Pago conectado (opcional)",
};
