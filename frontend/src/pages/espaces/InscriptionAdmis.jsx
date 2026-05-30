// frontend/src/pages/espaces/InscriptionAdmis.jsx
import { useState, useEffect } from "react";
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
  const [chargement, setChargement] = useState(true);

  // === Au montage, on derive l'etape reelle depuis l'API ===
  useEffect(() => {
    const charger = async () => {
      try {
        // 1. Recuperer le profil pour connaitre le role et doit_changer_mdp
        const resMe = await fetch("http://localhost:8000/accounts/api/me/", {
          credentials: "include",
        });
        if (!resMe.ok) {
          setChargement(false);
          return;
        }
        const me = await resMe.json();

        // Si deja etudiant -> etape finale
        if (me.role === "ETUDIANT") {
          setEtapeActuelle(3);
          setChargement(false);
          return;
        }

        // Si encore admis mais mdp pas change -> etape 0 (mais cas rare vu la redirection)
        if (me.doit_changer_mdp) {
          setEtapeActuelle(0);
          setChargement(false);
          return;
        }

        // 2. Recuperer l'etat du dossier pour savoir si tous les docs sont la
        const resDossier = await fetch(
          "http://localhost:8000/inscriptions/api/mon-dossier/",
          { credentials: "include" },
        );
        if (resDossier.ok) {
          const data = await resDossier.json();
          const nbDocs = data.documents?.length || 0;

          if (data.statut_dossier === "VALIDE") {
            setEtapeActuelle(3);
          } else if (nbDocs >= 4) {
            // 4 documents televersees, en attente de validation resp
            setEtapeActuelle(2);
          } else {
            // moins de 4 docs : encore en train de televersee
            setEtapeActuelle(1);
          }
        } else {
          setEtapeActuelle(1);
        }
      } catch (e) {
        // En cas d'erreur, on suppose etape 1
        setEtapeActuelle(1);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const progression = (etapeActuelle / 3) * 100;

  if (chargement) {
    return (
      <div className="min-h-screen bg-esp-surface flex items-center justify-center">
        <p className="text-esp-muted">Chargement de ton dossier...</p>
      </div>
    );
  }

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
        {etapeActuelle === 1 && (
          <div className="mt-12 rounded-xl bg-white border border-esp-gold p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-esp-gold-dark">
              Étape en cours
            </p>
            <h3 className="mt-2 text-xl font-bold text-esp-green-dark">
              {ETAPES[1].titre}
            </h3>
            <p className="mt-2 text-esp-muted">
              {ETAPES[1].desc}
            </p>
            <FormulaireUpload />
          </div>
        )}

        {etapeActuelle === 2 && (
          <div className="mt-12 rounded-xl bg-white border border-esp-gold p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-esp-gold-dark">
              Étape en cours
            </p>
            <h3 className="mt-2 text-xl font-bold text-esp-green-dark">
              {ETAPES[2].titre}
            </h3>
            <p className="mt-2 text-esp-muted">
              Tu as bien soumis les 4 documents. Le service des inscriptions est
              en train de les examiner. Tu seras notifié dès que ton dossier sera validé.
            </p>
            <p className="mt-3 text-sm text-esp-muted">
              Tu peux toujours <strong>remplacer un document non encore validé</strong> en
              revenant à l'étape précédente.
            </p>

            {/* On affiche quand meme le formulaire pour qu'il puisse modifier */}
            <div className="mt-6">
              <FormulaireUpload />
            </div>
          </div>
        )}

        {/* Message final si dossier valide */}
        {etapeActuelle >= 3 && (
          <div className="mt-12 rounded-xl bg-esp-green text-white p-6 shadow-sm text-center">
            <h3 className="text-xl font-bold">
              🎉 Inscription terminée !
            </h3>
            <p className="mt-2 text-esp-green-light">
              Tu es désormais officiellement étudiant de l'ESP.
            </p>
            <p className="mt-4 text-sm text-esp-green-light">
              Reconnecte-toi pour accéder à ton espace étudiant.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}