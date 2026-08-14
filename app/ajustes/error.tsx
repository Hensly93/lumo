"use client";

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
      <h2>Error real capturado:</h2>
      <p>{error.message}</p>
      <p>Stack:</p>
      <p>{error.stack}</p>
    </div>
  );
}
