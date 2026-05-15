import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Hallownest · Lengua 2º ESO" },
      {
        name: "description",
        content:
          "App educativa de gramática española con temática Hollow Knight para 2º ESO. Coliseo, Alquimista, Jefes y más.",
      },
    ],
  }),
});

function Index() {
  // The whole vanilla app lives at /hallownest/index.html with its own
  // CSS, JS and localStorage state. We mount it full-screen inside an
  // iframe so the existing logic, animations and persistence keep
  // working untouched while the rest of the project can grow around it.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <iframe
      src="/hallownest/index.html"
      title="Hallownest · Lengua 2º ESO"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        border: "none",
        background: "#000",
      }}
      // allow localStorage, fullscreen and touch behaviours
      allow="fullscreen; clipboard-write"
    />
  );
}
