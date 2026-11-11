"use client";
// PostHog (embudos, grabaciones de sesion y retencion). Solo se activa si en Vercel estan
//   NEXT_PUBLIC_POSTHOG_KEY   (la clave del proyecto, empieza con phc_)
//   NEXT_PUBLIC_POSTHOG_HOST  (opcional: https://us.i.posthog.com por defecto, o https://eu.i.posthog.com)
// Privacidad: no manda textos ni montos, solo nombres de eventos y rutas. Las grabaciones se hacen solo en las
// paginas publicas (landing, login, soluciones) con los campos de texto enmascarados; dentro de la app no se graba.
// Respeta "No rastrear" y no corre en /admin. A quien tiene cuenta lo identifica solo con el numero de negocio.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY || "").trim().replace(/[^A-Za-z0-9_]/g, "");
const HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").trim().replace(/\/+$/, "");

type PH = {
  identify: (id: string) => void;
  startSessionRecording: () => void;
  stopSessionRecording: () => void;
  get_distinct_id?: () => string;
};

function esPublica(p: string): boolean {
  return p === "/landing" || p.startsWith("/login") || p.startsWith("/soluciones") || p.startsWith("/terminos") || p.startsWith("/privacidad");
}

export default function PostHogInit() {
  const pathname = usePathname();
  const identificado = useRef<string>("");
  const grabando = useRef<boolean | null>(null);

  useEffect(() => {
    if (!KEY) return;
    const ph = (window as unknown as { posthog?: PH }).posthog;
    if (!ph || typeof ph.identify !== "function") return;
    if (pathname.startsWith("/admin")) return;
    try {
      const u = JSON.parse(localStorage.getItem("lumo_usuario") || "{}") || {};
      const id = u.negocio_id != null ? "negocio_" + String(u.negocio_id) : "";
      if (id && identificado.current !== id) { ph.identify(id); identificado.current = id; }
    } catch { /* sin sesion */ }
    const quiere = esPublica(pathname);
    if (grabando.current !== quiere) {
      grabando.current = quiere;
      try { if (quiere) ph.startSessionRecording(); else ph.stopSessionRecording(); } catch { /* sin grabacion */ }
    }
  }, [pathname]);

  if (!KEY) return null;

  return (
    <Script id="posthog-init" strategy="afterInteractive">{`
(function(){
if(navigator.doNotTrack==='1'||location.pathname.indexOf('/admin')===0)return;
try{if(localStorage.getItem('lb_ignorar')==='1')return;}catch(e){}
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
var p=location.pathname;
var publica=p==='/landing'||p.indexOf('/login')===0||p.indexOf('/soluciones')===0||p.indexOf('/terminos')===0||p.indexOf('/privacidad')===0;
posthog.init('${KEY}',{api_host:'${HOST}',person_profiles:'identified_only',autocapture:false,capture_pageview:false,capture_pageleave:false,respect_dnt:true,disable_session_recording:!publica,session_recording:{maskAllInputs:true},loaded:function(ph){
try{var u=JSON.parse(localStorage.getItem('lumo_usuario')||'{}')||{};if(u.negocio_id!=null)ph.identify('negocio_'+String(u.negocio_id));}catch(e){}
var q=window.__phq||[];for(var i=0;i<q.length;i++){try{ph.capture(q[i][0],q[i][1]);}catch(e){}}window.__phq=[];
}});
})();
`}</Script>
  );
}
