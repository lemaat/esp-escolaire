// frontend/src/pages/espaces/FormulaireUpload.jsx
import { useState, useEffect } from "react";

const DOCUMENTS = [
  { cle: "CNI_RECTO",        label: "Carte d'identité — Recto" },
  { cle: "CNI_VERSO",        label: "Carte d'identité — Verso" },
  { cle: "ACTE_NAISSANCE",   label: "Attestation de naissance" },
  { cle: "ATTESTATION_CNIM", label: "Attestation CNIM" },
];

const FORMATS = "image/jpeg,image/png,application/pdf";

const STATUT = {
  VIDE: "VIDE",
  CHOISI: "CHOISI",
  EN_ATTENTE: "EN_ATTENTE",
  VALIDE: "VALIDE",
  REFUSE: "REFUSE",
};

// Helper pour lire le cookie CSRF (déjà utilisé ailleurs)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export default function FormulaireUpload() {
  // État local : une entrée par type de document
  const [pieces, setPieces] = useState(() => {
    const init = {};
    DOCUMENTS.forEach((d) => {
      init[d.cle] = { fichier: null, statut: STATUT.VIDE, motif: "" };
    });
    return init;
  });

  const [chargement, setChargement] = useState(true);
  const [erreurGlobale, setErreurGlobale] = useState("");

  // === Au montage, charger l'état réel depuis l'API ===
  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch("http://localhost:8000/inscriptions/api/mon-dossier/", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Impossible de charger le dossier.");
        const data = await res.json();

        // Mettre à jour l'état avec les documents déjà téléversés
        setPieces((prec) => {
          const maj = { ...prec };
          data.documents.forEach((doc) => {
            maj[doc.type_document] = {
              fichier: { name: doc.fichier_url ? doc.fichier_url.split("/").pop() : "" },
              statut: doc.statut,
              motif: doc.motif_refus || "",
            };
          });
          return maj;
        });
      } catch (e) {
        setErreurGlobale(e.message);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  // Sélection locale d'un fichier (avant envoi)
  const choisirFichier = (cle, file) => {
    setPieces((prec) => ({
      ...prec,
      [cle]: { ...prec[cle], fichier: file, statut: STATUT.CHOISI, motif: "" },
    }));
  };

  // Envoi réel vers l'API
  const envoyerPiece = async (cle) => {
    const piece = pieces[cle];
    if (!piece.fichier) return;

    const formData = new FormData();
    formData.append("type_document", cle);
    formData.append("fichier", piece.fichier);

    try {
      const res = await fetch("http://localhost:8000/inscriptions/api/mon-dossier/documents/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: formData, // PAS de Content-Type : le navigateur le met avec le boundary
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erreur || "Erreur lors de l'envoi.");
      }

      const data = await res.json();
      setPieces((prec) => ({
        ...prec,
        [cle]: { ...prec[cle], statut: data.statut },
      }));
    } catch (e) {
      setPieces((prec) => ({
        ...prec,
        [cle]: { ...prec[cle], motif: e.message },
      }));
    }
  };

  if (chargement) {
    return (
      <div className="mt-6 text-center text-esp-muted">
        Chargement de ton dossier...
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-esp-muted">
        Formats acceptés : JPG, PNG ou PDF. Chaque pièce est validée séparément
        par le service des inscriptions.
      </p>

      {erreurGlobale && (
        <div className="rounded-lg bg-red-50 border border-esp-red/30 p-3 text-sm text-esp-red">
          {erreurGlobale}
        </div>
      )}

      {DOCUMENTS.map((doc) => (
        <CartePiece
          key={doc.cle}
          label={doc.label}
          piece={pieces[doc.cle]}
          onChoisir={(file) => choisirFichier(doc.cle, file)}
          onEnvoyer={() => envoyerPiece(doc.cle)}
        />
      ))}
    </div>
  );
}

/* === Une carte par document === */
function CartePiece({ label, piece, onChoisir, onEnvoyer }) {
  const { fichier, statut, motif } = piece;

  const bordureClasse = {
    [STATUT.VIDE]:       "border-gray-200",
    [STATUT.CHOISI]:     "border-esp-gold",
    [STATUT.EN_ATTENTE]: "border-esp-gold",
    [STATUT.VALIDE]:     "border-esp-green",
    [STATUT.REFUSE]:     "border-esp-red",
    
  }[statut];

  const fichierModifiable = statut === STATUT.VIDE
  || statut === STATUT.CHOISI
  || statut === STATUT.EN_ATTENTE   // ← ajouter cette ligne
  || statut === STATUT.REFUSE;

  const peutEnvoyer = statut === STATUT.CHOISI;

  return (
    <div className={`rounded-xl border bg-white p-5 transition ${bordureClasse}`}>
      <div className="flex items-start justify-between gap-4">

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-esp-ink">{label}</h3>

          {fichier && (
            <p className="mt-1 text-xs text-esp-muted truncate">
              📎 {fichier.name}
            </p>
          )}

          <BadgeStatut statut={statut} />
          {statut === STATUT.EN_ATTENTE && (
            <p className="mt-1 text-xs text-esp-muted">
              Tu peux encore remplacer ce document tant qu'il n'est pas validé.
            </p>
          )}
          {statut === STATUT.REFUSE && motif && (
            <p className="mt-2 text-xs text-esp-red">
              <strong>Motif du refus :</strong> {motif}
            </p>
          )}
          
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {fichierModifiable && (
            <label className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2
                text-center text-sm font-medium text-esp-ink hover:bg-gray-200">
              {fichier ? "Changer" : "Choisir"}
              <input
                type="file"
                accept={FORMATS}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) onChoisir(e.target.files[0]);
                }}
              />
            </label>
          )}

          {peutEnvoyer && (
            <button
              onClick={onEnvoyer}
              className="rounded-lg bg-esp-green px-4 py-2 text-sm font-medium
                text-white hover:bg-esp-green-dark"
            >
              Envoyer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BadgeStatut({ statut }) {
  if (statut === STATUT.VIDE) return null;

  const styles = {
    [STATUT.CHOISI]:     { bg: "bg-esp-gold/20",  text: "text-esp-gold-dark",   label: "Prêt à envoyer" },
    [STATUT.EN_ATTENTE]: { bg: "bg-esp-gold/20",  text: "text-esp-gold-dark",   label: "En attente de validation" },
    [STATUT.VALIDE]:     { bg: "bg-esp-green/10", text: "text-esp-green-dark",  label: "✓ Validé" },
    [STATUT.REFUSE]:     { bg: "bg-red-50",       text: "text-esp-red",         label: "✗ Refusé" },
  }[statut];

  return (
    <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${styles.bg} ${styles.text}`}>
      {styles.label}
    </span>
  );
}