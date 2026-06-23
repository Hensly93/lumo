"use client";
import { usePush } from "../hooks/usePush";
import { useAuth } from "../hooks/useAuth";

export default function PushRegistrar() {
  const { token } = useAuth();
  usePush(token ?? null);
  return null;
}
