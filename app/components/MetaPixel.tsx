"use client";
// Pixel de Meta (Facebook / Instagram Ads). Solo se carga si en Vercel esta NEXT_PUBLIC_META_PIXEL_ID
// y respeta "No rastrear" del navegador. Lead y CompleteRegistration se envian desde lib/track.ts.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").replace(/\D/g, "");

export default function MetaPixel() {
  const pathname = usePathname();
  const primera = useRef<string | null>(null);

  useEffect(() => {
    if (!ID) return;
    if (primera.current === null) { primera.current = pathname; return; } // la primera visita la cuenta el script
    if (pathname.startsWith("/admin")) return;
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (fbq) fbq("track", "PageView");
  }, [pathname]);

  if (!ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">{`
(function(){if(navigator.doNotTrack==='1'||location.pathname.indexOf('/admin')===0)return;
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${ID}');fbq('track','PageView');})();
`}</Script>
  );
}
