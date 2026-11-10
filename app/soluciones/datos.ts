// Páginas públicas de LumoBi pensadas para que Google (y los buscadores con IA) entiendan qué hace y para quién. (seo-lumobi)
// Se usan en /soluciones/[slug], en el sitemap y en los links de la landing.
// Regla: acá solo se escribe lo que LumoBi hace hoy. No se inventan funciones ni números.

export const SITIO = "https://lumobi.com.ar";

export type Bloque = { h: string; p?: string; items?: string[] };
export type Pagina = {
  slug: string;
  corto: string;        // texto del link en la landing y el pie
  resumen: string;      // una línea para la tarjeta de la landing
  title: string;        // título de la pestaña (se le agrega " | LumoBi")
  description: string;  // descripción para Google (hasta ~160 caracteres)
  keywords: string[];
  h1: string;
  intro: string;
  bloques: Bloque[];
  faqs: { q: string; a: string }[];
  relacionadas: string[];
};

export const PAGINAS: Pagina[] = [
  {
    slug: "control-de-caja",
    corto: "Control de caja",
    resumen: "Arqueo, cierre de turno y faltantes de caja, cruzados con tus ventas y cobros.",
    title: "Control de caja: arqueo, cierre de turno y faltantes",
    description: "Controlá la caja de tu negocio: cierre de turno con PIN, arqueo cruzado con ventas y cobros digitales, y aviso cuando falta plata. Probalo 5 días gratis.",
    keywords: ["control de caja", "arqueo de caja", "cierre de caja", "faltante de caja", "descuadre de caja", "caja diaria", "control de efectivo", "programa para controlar la caja"],
    h1: "Control de caja que te dice si la plata da, turno por turno",
    intro: "Cerrar la caja y que falte plata es de lo más común en un negocio, y casi nunca se sabe por qué. LumoBi cruza cada cierre de caja con tus ventas y tus cobros para que veas la diferencia en pesos, el mismo día.",
    bloques: [
      { h: "Qué es el arqueo de caja y por qué importa", p: "El arqueo de caja es contar el efectivo al cerrar y compararlo con lo que debería haber según las ventas registradas. Si no coincide, hay un faltante o un sobrante. Hacerlo a mano, en una planilla o de memoria lleva tiempo, y es fácil que pase de largo una diferencia chica que se repite todos los días." },
      { h: "Cómo lo resuelve LumoBi", items: [
        "Cada empleado abre y cierra su turno con su PIN.",
        "El cierre se cruza con las ventas y con los cobros digitales de Mercado Pago.",
        "Ves la diferencia en pesos, por turno y por día.",
        "Si una diferencia se repite, te llega un aviso al celular.",
        "Cada diferencia viene con pasos concretos para cerrarla.",
      ] },
      { h: "Hechos, no acusaciones", p: "LumoBi muestra qué turno, qué día y cuánta diferencia hay. No dice quién tiene la culpa ni por qué: lo que hacés con esa información lo decidís vos." },
      { h: "Para qué negocios sirve", p: "Para locales con una o varias cajas: kioscos, almacenes, tiendas, restaurantes, bares, cafeterías, panaderías y comercios en general." },
    ],
    faqs: [
      { q: "¿Qué es un faltante de caja?", a: "Es cuando el efectivo contado al cerrar es menor que el que debería haber según las ventas registradas. Puede venir de errores en el vuelto, ventas sin registrar, retiros sin anotar u otras causas. LumoBi te muestra la diferencia en pesos y en qué turno apareció." },
      { q: "¿LumoBi reemplaza mi caja registradora o mi sistema de ventas?", a: "No. LumoBi no reemplaza tu sistema de ventas ni emite facturas: interpreta tus ventas, tus cobros y los cierres de turno. Las ventas las cargás desde un Excel, un PDF o una foto, o conectando Mercado Pago." },
      { q: "¿Funciona con más de una caja o más de un local?", a: "Sí. Cada local y cada caja se ven en una sola pantalla, cada uno con su propia referencia de lo que es normal." },
    ],
    relacionadas: ["perdidas-de-dinero-en-negocios", "mercado-pago", "gastronomia"],
  },
  {
    slug: "perdidas-de-dinero-en-negocios",
    corto: "Pérdidas de dinero en negocios",
    resumen: "Detectá por dónde se escapa la plata: faltantes, costos que suben y ventas que no cierran.",
    title: "Pérdidas de dinero en negocios: cómo detectarlas a tiempo",
    description: "Detectá por dónde se escapa la plata en tu comercio o restaurante: faltantes de caja, costos que subieron sin cambiar precios y diferencias de cobros. LumoBi te avisa a tiempo.",
    keywords: ["pérdidas de dinero en negocios", "fugas de dinero", "dónde se pierde la plata en mi negocio", "cómo detectar faltantes", "faltantes de caja", "diferencias de caja", "control de pérdidas comercio", "rentabilidad pyme"],
    h1: "Descubrí por dónde se escapa la plata de tu negocio",
    intro: "Las pérdidas grandes se notan. Las chicas no aparecen en ningún reporte, pero se repiten todos los meses y juntas pesan mucho. Casi nunca es que vendas poco: es que la información está repartida entre la caja, Mercado Pago, un Excel y la cabeza de tu encargado.",
    bloques: [
      { h: "Las fugas de plata más comunes", items: [
        "Faltantes de caja que se repiten en un mismo turno.",
        "Mercadería que sube de precio mientras el precio de venta queda igual.",
        "Márgenes que se achican de a poco y se notan cuando ya se perdieron.",
        "Compras de más o de menos por no saber cuánto vas a vender.",
        "Cobros digitales que no coinciden con las ventas registradas.",
      ] },
      { h: "Cómo detecta LumoBi las fugas", p: "LumoBi aprende cómo funciona tu negocio: tus turnos, tus horarios y tus días fuertes. Con esa referencia propia detecta lo que se sale de lo normal y te lo muestra en pesos, con el turno o el costo donde ocurre y los pasos para cerrar cada fuga." },
      { h: "Antes de que crezca", p: "Te avisamos al celular en el momento, no a fin de mes. Una fuga chica que se corta a tiempo vale más que una grande que descubrís tarde." },
    ],
    faqs: [
      { q: "¿Cómo sé si mi negocio está perdiendo plata sin darme cuenta?", a: "Algunas señales son: la caja no cierra seguido, vendés bien pero a fin de mes no queda, o los costos subieron y no tocaste los precios. LumoBi cruza tu caja, tus ventas y tus cobros para mostrarte esas diferencias en pesos." },
      { q: "¿LumoBi acusa a mis empleados?", a: "No. LumoBi habla de hechos: qué turno, qué día y cuánta diferencia hay. No dice quién tiene la culpa." },
      { q: "¿Cuánto cuesta?", a: "Desde $45.000 + IVA por mes, con 1 local y hasta 3 cajas. Si tenés más locales, cajas o empleados, el precio se ajusta y lo ves antes de pagar." },
    ],
    relacionadas: ["control-de-caja", "business-intelligence-pymes", "comercio-minorista"],
  },
  {
    slug: "gastronomia",
    corto: "Restaurantes, bares y cafeterías",
    resumen: "Caja por turno, pérdidas y predicción de ventas para gastronomía.",
    title: "Control para restaurantes, bares y cafeterías",
    description: "Controlá la caja, los turnos y las pérdidas de tu restaurante, bar o cafetería. Cierre de turno con PIN, avisos al celular y predicción de ventas. 5 días gratis.",
    keywords: ["control de caja restaurante", "sistema de control para restaurantes", "gestión de bar", "control de caja cafetería", "gastronomía", "pérdidas en restaurantes", "predicción de ventas gastronomía"],
    h1: "Control de caja y pérdidas para restaurantes, bares y cafeterías",
    intro: "En gastronomía se mueve mucho efectivo, hay turnos y varias personas pasan por la caja. LumoBi te muestra si la caja da en cada turno y por dónde se escapa la plata, sin que tengas que estar en el local.",
    bloques: [
      { h: "Qué hace LumoBi en un local gastronómico", items: [
        "Cierre de caja por turno con el PIN de cada empleado.",
        "Cruce del cierre con las ventas y los cobros de Mercado Pago.",
        "Aviso al celular cuando un turno termina con plata de menos.",
        "Predicción de ventas según clima, feriados, quincena y tu propio historial, para comprar mercadería y armar los turnos.",
        "Varios locales en una sola pantalla.",
      ] },
      { h: "Preguntale a NICOLE", p: "NICOLE es la inteligencia de LumoBi: responde con tus números, por ejemplo qué turno rinde menos o cómo viene el mes." },
      { h: "Para qué locales sirve", p: "Restaurantes, bares, cafeterías, panaderías, rotiserías y casas de comidas, con un local o con varios." },
    ],
    faqs: [
      { q: "¿Sirve para un bar o una cafetería chica?", a: "Sí. LumoBi está pensado para pymes: funciona desde un local con una caja hasta varios locales." },
      { q: "¿Tengo que cambiar mi sistema de ventas o de comandas?", a: "No. LumoBi no lo reemplaza: lo interpreta. Cargás tus ventas desde un Excel, un PDF o una foto, o con Mercado Pago, y tu equipo cierra los turnos en LumoBi." },
      { q: "¿Puedo controlar varios locales desde el celular?", a: "Sí. Ves cada local, cada turno y cada caja en una sola pantalla y te llegan los avisos al celular." },
    ],
    relacionadas: ["control-de-caja", "perdidas-de-dinero-en-negocios", "mercado-pago"],
  },
  {
    slug: "comercio-minorista",
    corto: "Comercio minorista",
    resumen: "Kioscos, almacenes y tiendas: caja que cierra y ventas bajo control.",
    title: "Control de caja y ventas para comercios minoristas",
    description: "Para kioscos, almacenes, tiendas y comercios minoristas: controlá la caja, detectá faltantes y mirá ventas y cobros digitales en un solo lugar. 5 días gratis.",
    keywords: ["comercio minorista", "software para comercio minorista", "control de caja kiosco", "control de caja almacén", "venta minorista", "gestión de comercio", "control de ventas"],
    h1: "Control de caja y ventas para comercios minoristas",
    intro: "En el comercio minorista se vende todo el día, con mucho efectivo y muchas operaciones chicas. Un faltante de pocos pesos por turno parece poco, pero a fin de mes suma. LumoBi te muestra esas diferencias y te avisa cuando se repiten.",
    bloques: [
      { h: "Para qué rubros", items: [
        "Kioscos y almacenes.",
        "Tiendas de ropa y calzado.",
        "Ferreterías y librerías.",
        "Farmacias y perfumerías.",
        "Panaderías y rotiserías.",
        "Cualquier local con atención al público y caja.",
      ] },
      { h: "Lo que ves en LumoBi", items: [
        "Si la caja cierra, turno por turno.",
        "Tus ventas y tus cobros de Mercado Pago juntos.",
        "Avisos al celular cuando algo se sale de lo normal.",
        "Cuánto vas a vender los próximos días, para comprar mercadería con más criterio.",
      ] },
    ],
    faqs: [
      { q: "¿Sirve para un kiosco o un almacén?", a: "Sí. Está pensado para pymes de comercio: un solo local con una caja ya puede usarlo." },
      { q: "¿LumoBi hace facturación?", a: "No. LumoBi no emite facturas ni mueve dinero: sigue usando tu sistema de facturación. LumoBi interpreta lo que pasa en tu negocio y te anticipa lo que viene." },
    ],
    relacionadas: ["control-de-caja", "comercio-mayorista", "perdidas-de-dinero-en-negocios"],
  },
  {
    slug: "comercio-mayorista",
    corto: "Comercio mayorista",
    resumen: "Distribuidoras y mayoristas: cierres, cobros y fugas bajo control.",
    title: "Control de caja y cobros para comercios mayoristas",
    description: "Para distribuidoras y comercios mayoristas: controlá cierres de caja, cobros y ventas, detectá fugas de plata y anticipá cuánto vas a vender. 5 días gratis.",
    keywords: ["comercio mayorista", "software para mayoristas", "distribuidora", "venta mayorista", "control de caja mayorista", "control de cobros", "gestión de distribuidora"],
    h1: "Control de caja, cobros y fugas para comercios mayoristas",
    intro: "En un mayorista cada operación mueve más plata, así que una diferencia chica en la caja o en un cobro pesa más. LumoBi cruza tus cierres de caja con tus ventas y tus cobros para que veas dónde no coincide.",
    bloques: [
      { h: "Qué hace LumoBi por un mayorista", items: [
        "Cierre de caja por turno y por caja.",
        "Cruce del cierre con las ventas y los cobros digitales.",
        "Avisos al celular cuando una diferencia se sale de lo normal.",
        "Predicción de ventas según tu propio historial, el clima, los feriados y la quincena.",
        "Varios locales o puntos de venta en una sola pantalla.",
      ] },
      { h: "Qué no hace", p: "LumoBi no emite facturas ni mueve dinero, y no reemplaza tu sistema de gestión. Lo complementa: interpreta tus ventas, tus cobros y tus cierres para mostrarte las fugas de plata." },
    ],
    faqs: [
      { q: "¿LumoBi reemplaza mi sistema de gestión?", a: "No. Cargás tus ventas desde un Excel, un PDF o una foto, o con Mercado Pago, y LumoBi las interpreta junto con los cierres de caja." },
      { q: "¿Cuánto cuesta para un mayorista?", a: "Desde $45.000 + IVA por mes, con 1 local y hasta 3 cajas. Si tenés más locales, cajas o empleados, el precio se ajusta. Para grandes superficies o muchos locales, escribinos." },
    ],
    relacionadas: ["comercio-minorista", "control-de-caja", "business-intelligence-pymes"],
  },
  {
    slug: "business-intelligence-pymes",
    corto: "Business intelligence para pymes",
    resumen: "Inteligencia de negocios simple: qué pasó, qué está pasando y qué viene.",
    title: "Business intelligence para pymes, sin tableros complicados",
    description: "Inteligencia de negocios simple para pymes argentinas: LumoBi junta caja, ventas y Mercado Pago, detecta fugas de plata y predice tus ventas.",
    keywords: ["business intelligence para pymes", "inteligencia de negocios", "inteligencia artificial para negocios", "analizar ventas", "tablero de control pyme", "predicción de ventas", "reportes de ventas", "BI Argentina"],
    h1: "Business intelligence para pymes, sin tableros complicados",
    intro: "La inteligencia de negocios (business intelligence, o BI) es juntar los datos de tu negocio para decidir mejor. En una pyme el problema casi nunca es la falta de datos sino que están dispersos. LumoBi los junta y te dice qué hacer, en lugar de dejarte frente a un tablero lleno de gráficos.",
    bloques: [
      { h: "Lo que pasó, lo que está pasando, lo que viene", items: [
        "Lo que pasó: cada cierre de caja se cruza con tus ventas y tus cobros, y ves la diferencia en pesos.",
        "Lo que está pasando: si algo se sale de lo normal, te llega un aviso al celular en el momento.",
        "Lo que viene: cuánto vas a vender los próximos días, según el clima, los feriados, la quincena y la historia de tu propio negocio.",
      ] },
      { h: "Inteligencia artificial con tus propios números", p: "NICOLE es la inteligencia de LumoBi. Aprende cómo funciona tu negocio y responde con tus datos: qué turno rinde menos, cómo viene el mes, dónde hay una fuga." },
      { h: "Cada pantalla sirve para decidir", p: "No es un tablero lleno de gráficos. Es lo que necesitás saber hoy para frenar una pérdida o aprovechar un buen día." },
    ],
    faqs: [
      { q: "¿Qué es business intelligence?", a: "Es el conjunto de herramientas y métodos para juntar los datos de un negocio y convertirlos en información útil para decidir. LumoBi lo hace para pymes de comercio y gastronomía, con foco en detectar pérdidas de dinero y anticipar ventas." },
      { q: "¿Necesito saber de datos o de informática?", a: "No. LumoBi está pensado para dueños de pymes: cada pantalla te muestra qué pasó y qué hacer." },
      { q: "¿Qué datos usa LumoBi?", a: "Los cierres de caja de tu equipo, tus ventas (desde un Excel, un PDF, una foto o Mercado Pago) y tus cobros. Cada negocio ve únicamente su información." },
    ],
    relacionadas: ["perdidas-de-dinero-en-negocios", "mercado-pago", "gastronomia"],
  },
  {
    slug: "mercado-pago",
    corto: "Control de cobros con Mercado Pago",
    resumen: "Cruzá tus cobros de Mercado Pago con ventas y cierres de caja.",
    title: "Control de cobros y pagos con Mercado Pago para negocios",
    description: "Conectá Mercado Pago a LumoBi y cruzá tus cobros digitales con ventas y cierres de caja para detectar diferencias. Control de pagos para pymes y comercios.",
    keywords: ["control de cobros Mercado Pago", "conciliación de pagos", "control de pagos digitales", "Mercado Pago para negocios", "cobros y ventas", "control de ventas Mercado Pago"],
    h1: "Controlá tus cobros de Mercado Pago junto con tu caja",
    intro: "Cuando una parte de las ventas entra por Mercado Pago y otra por efectivo, es difícil saber si todo coincide. LumoBi conecta tu cuenta de Mercado Pago y cruza los cobros con tus ventas y con los cierres de caja.",
    bloques: [
      { h: "Qué ves al conectar Mercado Pago", items: [
        "Tus cobros digitales junto a tus ventas y tu caja.",
        "La diferencia en pesos cuando algo no coincide.",
        "Avisos al celular cuando una diferencia se sale de lo normal.",
      ] },
      { h: "Qué no hace", p: "LumoBi no mueve dinero ni emite facturas. Lee y interpreta lo que pasa en tu negocio para mostrarte las fugas y anticipar lo que viene." },
    ],
    faqs: [
      { q: "¿LumoBi mueve mi plata o accede a mi dinero?", a: "No. LumoBi no mueve dinero ni emite facturas: interpreta lo que pasa en tu negocio." },
      { q: "¿Puedo usar LumoBi si no uso Mercado Pago?", a: "Sí. También podés cargar tus ventas desde un Excel, un PDF o una foto, y tu equipo cierra los turnos en LumoBi." },
    ],
    relacionadas: ["control-de-caja", "perdidas-de-dinero-en-negocios", "business-intelligence-pymes"],
  },
];

export const buscar = (slug: string) => PAGINAS.find((p) => p.slug === slug);
