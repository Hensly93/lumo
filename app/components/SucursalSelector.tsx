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

  const seleccionada = sucursales.find(s => s.id === sucursalId);
  const label = sucursalId ? seleccionada?.nombre || "Local" : "Todas las sucursales";

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <select
        value={sucursalId ?? ""}
        onChange={e => setSucursal(e.target.value === "" ? null : parseInt(e.target.value))}
        style={{
          padding: "6px 28px 6px 12px",
          background: "var(--blanco)",
          border: "1px solid var(--linea)",
          borderRadius: 8,
          color: "var(--tinta)",
          fontSize: 13,
          fontFamily: "var(--font-instrument), sans-serif",
          fontWeight: 500,
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%235F6E85' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        <option value="" style={{ background: "var(--blanco)", color: "var(--tinta)" }}>
          Todas las sucursales
        </option>
        {sucursales.map(s => (
          <option key={s.id} value={s.id} style={{ background: "var(--blanco)", color: "var(--tinta)" }}>
            {s.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
