"use client";
import { useEffect } from "react";
export default function Salir() {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }, []);
  return null;
}
