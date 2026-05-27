// frontend/src/pages/espaces/UploadDocuments.jsx
import { useState } from "react";

const DOCUMENTS = [
  { cle: "cni_recto",      label: "Carte d'identité — Recto" },
  { cle: "cni_verso",      label: "Carte d'identité — Verso" },
  { cle: "acte_naissance", label: "Acte de naissance" },
  { cle: "attestation_cnim", label: "Attestation CNIM" },
];

const FORMATS = "image/jpeg,image/png,application/pdf";

export default function UploadDocuments() {
  // { cni_recto: File, ... } — rempli au fur et à mesure
  const [fichiers, setFichiers] = useState({});

  const choisirFichier = (cle, file) => {
    setFichiers((prec) => ({ ...prec, [cle]: file }));
  };

  const tousFournis = DOCUMENTS.every((d) => fichiers[d.cle]);

  return (
    <div className="min-h-screen bg-esp-surface px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-2xl font-bold text-esp-ink">
          Téléverser tes documents
        </h1>
        <p className="mt-2 text-sm text-esp-muted">
          Dépose les 4 pièces justificatives obligatoires. Formats acceptés :
          JPG, PNG ou PDF.
        </p>

        <div className="mt-8 space-y-4">
          {DOCUMENTS.map((doc) => {
            const fichier = fichiers[doc.cle];

            return (
              <div
                key={doc.cle}
                className={`rounded-xl border bg-white p-5 transition
                  ${fichier ? "border-esp-green" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Pastille état */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-full text-sm font-bold
                        ${fichier
                          ? "bg-esp-green text-white"
                          : "bg-gray-100 text-esp-muted"}`}
                    >
                      {fichier ? "✓" : "•"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-esp-ink">{doc.label}</h3>
                      {fichier && (
                        <p className="mt-0.5 text-xs text-esp-muted">
                          {fichier.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bouton choisir : label déguisé en bouton */}
                  <label
                    className="cursor-pointer rounded-lg bg-esp-green px-4 py-2
                      text-sm font-medium text-white hover:bg-esp-green-dark"
                  >
                    {fichier ? "Changer" : "Choisir"}
                    <input
                      type="file"
                      accept={FORMATS}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          choisirFichier(doc.cle, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton de soumission */}
        <button
          disabled={!tousFournis}
          className={`mt-8 w-full rounded-xl px-6 py-3 font-semibold transition
            ${tousFournis
              ? "bg-esp-green text-white hover:bg-esp-green-dark"
              : "cursor-not-allowed bg-gray-200 text-esp-muted"}`}
        >
          {tousFournis
            ? "Soumettre mon dossier"
            : "Ajoute les 4 documents pour continuer"}
        </button>

      </div>
    </div>
  );
}