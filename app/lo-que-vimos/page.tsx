"use client";
// Lo primero que ve el dueño después de cargar ventas o conectar Mercado Pago.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import Revelacion from "../components/Revelacion";

export default function LoQueVimos() {
  const router = useRouter();
  const [token, setToken] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/landing"); return; }
    setToken(t);
  }, [router]);
  return (
    <div style={{ paddingBottom: 90 }}>
      <PageHeader title="Lo que vimos en tu negocio" sub="Leímos tus ventas y esto es lo primero que encontramos." />
      <div style={{ padding: "0 16px" }}>
        {token && <Revelacion token={token} esperar onSeguir={() => router.push("/primeros-pasos")} textoSeguir="Seguir con los primeros pasos" />}
      </div>
      <Nav />
    </div>
  );
}
