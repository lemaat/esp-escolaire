// frontend/src/pages/espaces/InscriptionAdmis.jsx
import { useState } from "react";

const ETAPES = [
  {
    titre: "Changer ton mot de passe",
    desc: "Remplace le mot de passe temporaire reçu par email par un mot de passe personnel.",
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
  // À brancher plus tard sur l'API : 0 = étape 1 en cours, 1 = étape 2, etc.
  const [etapeActuelle] = useState(0);

  return (
    <div className="min-h-screen bg-esp-surface px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* === Bandeau Félicitations === */}
        <div className="rounded-2xl bg-esp-green px-8 py-10 text-center text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-esp-gold">
            École Supérieure Polytechnique
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            Félicitations pour ta réussite !
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-esp-green-light">
            Tu fais désormais partie des admis de l'ESP. Il te reste quelques
            étapes simples pour finaliser ton inscription.
          </p>
        </div>

        {/* === Guide des étapes (stepper) === */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-esp-ink">
            Les étapes de ton inscription
          </h2>

          <ol className="mt-6 space-y-4">
            {ETAPES.map((etape, i) => {
              const estFaite = i < etapeActuelle;
              const estActive = i === etapeActuelle;

              return (
                <li
                  key={i}
                  className={`flex gap-4 rounded-xl border bg-white p-5 transition
                    ${estActive ? "border-esp-gold ring-1 ring-esp-gold" : "border-gray-200"}`}
                >
                  {/* Pastille numéro */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-full text-sm font-bold
                      ${estFaite ? "bg-esp-green text-white" : ""}
                      ${estActive ? "bg-esp-gold text-esp-ink" : ""}
                      ${!estFaite && !estActive ? "bg-gray-100 text-esp-muted" : ""}`}
                  >
                    {estFaite ? "✓" : i + 1}
                  </div>

                  {/* Texte */}
                  <div>
                    <h3
                      className={`font-semibold
                        ${estActive ? "text-esp-green-dark" : "text-esp-ink"}`}
                    >
                      {etape.titre}
                    </h3>
                    <p className="mt-1 text-sm text-esp-muted">{etape.desc}</p>

                    {estActive && (
                      <span className="mt-2 inline-block text-xs font-medium text-esp-gold-dark">
                        Étape en cours
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

      </div>
    </div>
  );
}