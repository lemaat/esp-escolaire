// frontend/src/pages/espaces/InscriptionAdmis.jsx
import { useState } from "react";
import FormulaireUpload from "./FormulaireUpload";

const ETAPES = [
  {
    titre: "Mot de passe changé",
    desc: "Tu as défini ton mot de passe personnel. Ton compte est sécurisé.",
  },
  {
    titre: "Téléverser tes documents",
    desc: "Dépose les pièces justificatives obligatoires demandées pour ton dossier.",
  },
  {
    titre: "Validation du dossier",
    desc: "Le service des inscriptions vérifie ton dossier. Tu seras notifié dès qu'il est validé.",
  },
];

export default function InscriptionAdmis() {
  const [etapeActuelle, setEtapeActuelle] = useState(1);
  const progression = (etapeActuelle / 3) * 100;

  return (
    <div className="min-h-screen bg-esp-surface px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* === Bandeau Félicitations === */}
        <div className="rounded-2xl bg-esp-green px-8 py-10 text-center text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-esp-gold">
            École Supérieure Polytechnique
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            Félicitations pour ta réussite !
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-esp-green-light">
            Tu fais désormais partie des admis de l'ESP. Suis les étapes ci-dessous
            pour finaliser ton inscription.
          </p>
        </div>

        {/* === Boutons de test temporaires === */}
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setEtapeActuelle((e) => Math.max(0, e - 1))}
            className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-esp-ink hover:bg-gray-300"
          >
            ← Précédent
          </button>
          <button
            onClick={() => setEtapeActuelle((e) => Math.min(3, e + 1))}
            className="rounded-lg bg-esp-gold px-3 py-1 text-xs text-esp-ink hover:bg-esp-gold-dark"
          >
            Étape suivante →
          </button>
        </div>

        {/* === Stepper avec 4 points équidistants === */}
        <div className="mt-10">
          <div className="relative">

            {/* Rail gris : du centre du 1er point au centre du dernier */}
            <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />

            {/* Rail vert qui se remplit */}
            <div
              className="absolute top-5 left-5 h-1 bg-esp-green rounded-full transition-all duration-700 ease-out"
              style={{ width: `calc((100% - 2.5rem) * ${progression / 100})` }}
            />

            {/* Les 4 points répartis uniformément */}
            <div className="relative flex justify-between items-start">

              {/* Les 3 étapes-pastilles */}
              {ETAPES.map((etape, i) => {
                const estFaite = i < etapeActuelle;
                const estActive = i === etapeActuelle;

                return (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center
                        rounded-full text-sm font-bold border-4 border-white shadow
                        transition-all duration-300
                        ${estFaite ? "bg-esp-green text-white" : ""}
                        ${estActive ? "bg-esp-gold text-esp-ink ring-4 ring-esp-gold/30 scale-110" : ""}
                        ${!estFaite && !estActive ? "bg-gray-200 text-esp-muted" : ""}`}
                    >
                      {estFaite ? "✓" : i + 1}
                    </div>
                    <p
                      className={`mt-3 text-xs font-semibold text-center max-w-[8rem]
                        ${estActive ? "text-esp-green-dark" : "text-esp-muted"}`}
                    >
                      {etape.titre}
                    </p>
                  </div>
                );
              })}

              {/* Le drapeau — le 4e point */}
              <div className="flex flex-col items-center">
                <div className="relative h-10 w-10 flex items-end justify-center">
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-esp-ink/70 -translate-x-1/2" />
                  <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-esp-ink/70" />
                  <svg
                    className="absolute top-0 left-1/2 h-5 w-7 animate-wave"
                    viewBox="0 0 28 16"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 0 L 28 8 L 0 16 Z"
                      fill="var(--color-esp-red)"
                      stroke="var(--color-esp-gold)"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-xs font-semibold text-center text-esp-red max-w-[5rem]">
                  Étudiant !
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* === Détail de l'étape en cours === */}
        {etapeActuelle < ETAPES.length && (
          <div className="mt-12 rounded-xl bg-white border border-esp-gold p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-esp-gold-dark">
              Étape en cours
            </p>
            <h3 className="mt-2 text-xl font-bold text-esp-green-dark">
              {ETAPES[etapeActuelle].titre}
            </h3>
            <p className="mt-2 text-esp-muted">
              {ETAPES[etapeActuelle].desc}
            </p>

            {etapeActuelle === 1 && <FormulaireUpload />}
          </div>
        )}

        {/* Message final */}
        {etapeActuelle >= ETAPES.length && (
          <div className="mt-12 rounded-xl bg-esp-green text-white p-6 shadow-sm text-center">
            <h3 className="text-xl font-bold">
              🎉 Inscription terminée !
            </h3>
            <p className="mt-2 text-esp-green-light">
              Tu es désormais officiellement étudiant de l'ESP.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}