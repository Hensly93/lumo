"use client";
// Activá LumoBi: todo lo que el dueño puede activar, qué gana con cada cosa y el botón para hacerlo.
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import { ActivacionLista } from "../components/Activacion";

export default function Activar() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 90 }}>
      <PageHeader title="Activá LumoBi" sub="Cuanto más activás, mejor cuida tu negocio" />
      <ActivacionLista />
      <Nav />
    </div>
  );
}
