"use client";
import { useState, useEffect } from "react";

export type AuthUser = {
  id: string;
  email: string;
  negocio: string;
  negocio_id?: string;
  nombre?: string;
  [key: string]: unknown;
};

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("lumo_token"));
    const rawUser = localStorage.getItem("lumo_usuario");
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        setUser(null);
      }
    }
    setReady(true);
  }, []);

  return { token, user, ready };
}
