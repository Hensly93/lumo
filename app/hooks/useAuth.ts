"use client";
import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("lumo_token"));
    setReady(true);
  }, []);

  return { token, ready };
}
