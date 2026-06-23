"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSucursal } from "../hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Sucursal = { id: number; nombre: string };

export default function SucursalSelector() {
  const { token } = useAuth();
  const { sucursalId, setSucursal } = useSucursal();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/multilocal/red`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const lista: Sucursal[] = (d?.sucursales || []).map((s: Sucursal) => ({
          id: s.id,
          nombre: s.nombre,
        }));
        setSucursales(lista);
        // Si hay exactamente 1 sucursal, seleccionarla automáticamente
        if (lista.length === 1) setSucursal(lista[0].id);
      })
      .catch(() => {});
  }, [token]);

  // Si tiene 0 o 1 sucursal no mostrar selector
  if (sucursales.length <= 1) return null;

  return (
    <div style={{ marginTop: 10, position: "relative", zIndex: 1 }}>
      <select
        value={sucursalId ?? ""}
        onChange={e => setSucursal(e.target.value === "" ? null : parseInt(e.target.value))}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 10,
          color: "#FFFFFF",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 32,
        }}
      >
        <option value="" style={{ background: "#0055CC", color: "#fff" }}>
          📍 Todos los locales
        </option>
        {sucursales.map(s => (
          <option key={s.id} value={s.id} style={{ background: "#0055CC", color: "#fff" }}>
            {s.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
