"use client";
// Link corto de un partner: lumobi.com.ar/p/CODIGO → guarda el código (60 días) y abre la landing de LumoBi.
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { guardarRefPartner } from "../../components/PartnerRef";

export default function LinkPartner() {
  const { codigo } = useParams<{ codigo: string }>();
  const router = useRouter();
  useEffect(() => {
    guardarRefPartner(String(codigo || ""));
    router.replace("/landing");
  }, [codigo, router]);
  return <main style={{ minHeight: "100vh", background: "#EEF1F5" }} />;
}
