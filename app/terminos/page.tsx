// Términos y condiciones públicos de LumoBi.
import type { Metadata } from "next";
import PaginaLegal, { Seccion } from "../components/PaginaLegal";

export const metadata: Metadata = {
  title: "Términos y condiciones | LumoBi",
  description: "Las condiciones de uso de LumoBi: cuenta, planes y pagos, uso permitido, responsabilidades y baja del servicio.",
  alternates: { canonical: "/terminos" },
};

export default function Terminos() {
  return (
    <PaginaLegal titulo="Términos y condiciones" actualizado="13 de noviembre de 2026"
      intro="Estos términos regulan el uso de LumoBi. Al crear una cuenta o usar el servicio, los aceptás. Si no estás de acuerdo, no lo uses.">
      <Seccion titulo="El servicio">
        <p style={{ margin: 0 }}>LumoBi ofrece herramientas para comercios y gastronomía: caja, catálogo, stock, control del equipo y análisis que señalan dónde el negocio puede estar perdiendo plata. El servicio está en versión beta: puede tener errores, cambios y interrupciones.</p>
      </Seccion>
      <Seccion titulo="Tu cuenta">
        <p style={{ margin: 0 }}>Tenés que dar datos verdaderos y mantener tu contraseña y los PIN de tu equipo en reserva. Sos responsable de lo que se haga con tu cuenta y con los accesos que crees para tus empleados.</p>
      </Seccion>
      <Seccion titulo="Planes, pagos y baja">
        <p style={{ margin: 0 }}>Hay una prueba gratis, que cada negocio puede usar una sola vez. Después, el servicio se paga por suscripción a través de Mercado Pago, según el plan y el precio vigentes al contratar. Podés cancelar cuando quieras desde Ajustes: la cancelación frena los cobros futuros y no devuelve períodos ya pagados, salvo lo que exija la ley.</p>
        <p style={{ margin: 0 }}>Podés pedir la baja de tu cuenta y de tus datos en cualquier momento, desde Ajustes o por email.</p>
      </Seccion>
      <Seccion titulo="Uso permitido">
        <p style={{ margin: 0 }}>No podés usar LumoBi para actividades ilegales, intentar acceder a datos de otros negocios, vulnerar la seguridad del servicio, copiarlo o revenderlo sin autorización. Podemos suspender cuentas que incumplan estas reglas.</p>
      </Seccion>
      <Seccion titulo="Tus datos">
        <p style={{ margin: 0 }}>Los datos de tu negocio son tuyos. Nos autorizás a usarlos para prestarte el servicio, como explica la política de privacidad. Sos responsable de que los datos que cargues, incluidos los de tu equipo, se hayan obtenido y se usen de forma legal.</p>
      </Seccion>
      <Seccion titulo="Alcance de los análisis">
        <p style={{ margin: 0 }}>Los avisos, estimaciones y recomendaciones de LumoBi se calculan con los datos que cargaste o conectaste y sirven de ayuda para decidir. No son asesoramiento contable, legal ni impositivo, y los resultados dependen de que los datos estén completos y bien cargados. Las señales sobre el equipo son inconsistencias para revisar, no acusaciones: la decisión y la responsabilidad son tuyas.</p>
        <p style={{ margin: 0 }}>LumoBi no reemplaza la facturación electrónica ni tus obligaciones ante ARCA.</p>
      </Seccion>
      <Seccion titulo="Responsabilidad">
        <p style={{ margin: 0 }}>Hacemos lo razonable para que el servicio funcione, pero no garantizamos que no tenga interrupciones o errores. En la medida que la ley lo permita, no respondemos por pérdidas indirectas ni por lucro cesante, y nuestra responsabilidad total se limita a lo que hayas pagado por el servicio en los últimos 3 meses. Esto no afecta los derechos que la ley te reconoce como consumidor o usuario.</p>
      </Seccion>
      <Seccion titulo="Propiedad intelectual">
        <p style={{ margin: 0 }}>El software, la marca LumoBi, el diseño y los textos pertenecen a sus titulares. Te damos una licencia limitada, no exclusiva e intransferible para usar el servicio mientras tu cuenta esté activa.</p>
      </Seccion>
      <Seccion titulo="Cambios y ley aplicable">
        <p style={{ margin: 0 }}>Podemos modificar estos términos; si el cambio es importante, te avisamos con anticipación. Si seguís usando el servicio después, se entiende que lo aceptás. Rige la ley argentina y, ante un conflicto, serán competentes los tribunales ordinarios de la República Argentina que correspondan según la ley.</p>
      </Seccion>
    </PaginaLegal>
  );
}
