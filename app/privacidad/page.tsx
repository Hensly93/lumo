// Política de privacidad pública de LumoBi.
import type { Metadata } from "next";
import PaginaLegal, { Seccion } from "../components/PaginaLegal";

export const metadata: Metadata = {
  title: "Política de privacidad | LumoBi",
  description: "Qué datos usa LumoBi, para qué, con quién se comparten y cómo pedir que los corrijamos o los borremos.",
  alternates: { canonical: "/privacidad" },
};

export default function Privacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad" actualizado="13 de noviembre de 2026"
      intro="LumoBi es una herramienta para comercios y gastronomía que muestra dónde el negocio pierde plata. Para eso usa los datos de tu negocio. Acá te contamos cuáles, para qué y qué control tenés sobre ellos.">
      <Seccion titulo="Qué datos usamos">
        <p style={{ margin: 0 }}><strong>De tu cuenta:</strong> nombre, email, celular, nombre del negocio, rubro, zona y, si lo cargás, CUIT.</p>
        <p style={{ margin: 0 }}><strong>De tu operación:</strong> productos, precios y costos, stock, ventas, turnos de caja, movimientos de la caja, facturas de proveedores y los nombres y PIN de tu equipo.</p>
        <p style={{ margin: 0 }}><strong>Si conectás Mercado Pago:</strong> los movimientos de tu cuenta, con tu autorización. Podés desconectarlo cuando quieras.</p>
        <p style={{ margin: 0 }}><strong>De uso del sitio:</strong> páginas visitadas, eventos de uso y el origen de la visita (por ejemplo, un anuncio). No registramos el contenido de lo que escribís ni los montos en las métricas de uso.</p>
      </Seccion>
      <Seccion titulo="Para qué los usamos">
        <p style={{ margin: 0 }}>Para prestarte el servicio: registrar ventas, calcular márgenes, detectar fugas de plata, avisarte de lo que conviene revisar y controlar la caja de tu equipo. También para cobrar la suscripción, darte soporte, cuidar la seguridad del servicio y mejorarlo.</p>
        <p style={{ margin: 0 }}>No vendemos tus datos ni los usamos para publicidad de terceros.</p>
      </Seccion>
      <Seccion titulo="Con quién los compartimos">
        <p style={{ margin: 0 }}>Usamos proveedores que procesan datos por cuenta nuestra, solo para hacer funcionar el servicio: alojamiento y base de datos (Vercel, Render), cobros (Mercado Pago), envío de emails, métricas de uso (PostHog) y medición de anuncios (Meta). Para leer facturas y generar análisis usamos modelos de inteligencia artificial (Anthropic): se les envía únicamente lo necesario para esa tarea.</p>
        <p style={{ margin: 0 }}>Para las comparaciones entre locales usamos datos agregados y anonimizados: nunca se muestra información identificable de otro negocio.</p>
        <p style={{ margin: 0 }}>Podemos entregar información si una autoridad competente nos lo exige por ley.</p>
      </Seccion>
      <Seccion titulo="Datos de tu equipo">
        <p style={{ margin: 0 }}>Vos cargás a tus empleados y sos responsable de avisarles que la caja registra quién hace cada venta, cada cambio de precio y cada movimiento. Usamos esos datos solo para el control de tu negocio.</p>
      </Seccion>
      <Seccion titulo="Cuánto tiempo los guardamos">
        <p style={{ margin: 0 }}>Mientras tu cuenta esté activa. Si la eliminás desde Ajustes, borramos los datos de tu negocio, salvo lo que debamos conservar por obligación legal o para resolver un reclamo.</p>
      </Seccion>
      <Seccion titulo="Tus derechos">
        <p style={{ margin: 0 }}>Según la Ley 25.326 de Protección de Datos Personales podés acceder a tus datos, corregirlos, actualizarlos y pedir su supresión. Escribinos y te respondemos dentro de los plazos legales.</p>
        <p style={{ margin: 0 }}>La Agencia de Acceso a la Información Pública es el órgano de control de la ley y recibe denuncias y reclamos por incumplimientos.</p>
      </Seccion>
      <Seccion titulo="Cookies y almacenamiento">
        <p style={{ margin: 0 }}>Usamos almacenamiento del navegador para mantener tu sesión y recordar preferencias, y herramientas de medición para saber qué páginas funcionan y de dónde llegan las visitas.</p>
      </Seccion>
      <Seccion titulo="Seguridad">
        <p style={{ margin: 0 }}>Las conexiones están cifradas y el acceso a cada negocio está separado. Ningún sistema es infalible: si hubiera un incidente que te afecte, te avisamos.</p>
      </Seccion>
      <Seccion titulo="Menores y cambios">
        <p style={{ margin: 0 }}>LumoBi es para comercios y no está dirigido a menores de 18 años. Si cambiamos esta política, actualizamos la fecha de arriba y, si el cambio es importante, te avisamos.</p>
      </Seccion>
    </PaginaLegal>
  );
}
