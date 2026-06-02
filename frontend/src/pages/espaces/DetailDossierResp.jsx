// frontend/src/pages/espaces/DetailDossierResp.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EspaceLayout from "../../components/EspaceLayout";

const MENU = [
  { label: "Dossiers", route: "/espace-responsable-inscription", icone: "📋" },
  { label: "Statistiques", route: "/espace-responsable-inscription/stats", icone: "📊" },
];

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function DetailDossierResp() {
  const { matricule } = useParams();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [actionEnCours, setActionEnCours] = useState(false);

  // Modal de refus
  const [modalRefus, setModalRefus] = useState(null); // { document_id, libelle }
  const [motifRefus, setMotifRefus] = useState("");

  // Modal validation finale
  const [modalFinaliser, setModalFinaliser] = useState(false);

  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const res = await fetch(
        `http://localhost:8000/inscriptions/api/resp/dossiers/${matricule}/`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erreur || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setDossier(data);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [matricule]);

  // === Actions ===
  const validerDocument = async (documentId) => {
    setActionEnCours(true);
    try {
      const res = await fetch(
        "http://localhost:8000/inscriptions/api/resp/documents/valider/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ document_id: documentId }),
        },
      );
      if (!res.ok) throw new Error("Erreur lors de la validation.");
      await charger(); // Recharger pour avoir les nouveaux statuts
    } catch (e) {
      alert(e.message);
    } finally {
      setActionEnCours(false);
    }
  };

  const confirmerRefus = async () => {
    if (!motifRefus.trim()) {
      alert("Le motif du refus est obligatoire.");
      return;
    }
    setActionEnCours(true);
    try {
      const res = await fetch(
        "http://localhost:8000/inscriptions/api/resp/documents/refuser/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({
            document_id: modalRefus.document_id,
            motif: motifRefus,
          }),
        },
      );
      if (!res.ok) throw new Error("Erreur lors du refus.");
      setModalRefus(null);
      setMotifRefus("");
      await charger();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionEnCours(false);
    }
  };

  const finaliserDossier = async () => {
    setActionEnCours(true);
    try {
      const res = await fetch(
        "http://localhost:8000/inscriptions/api/resp/dossiers/finaliser/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ matricule }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.erreur || "Erreur lors de la validation finale.");

      // Succes : message et retour a la liste
      alert(
        `Dossier validé !\n\n` +
        `${matricule} est désormais ÉTUDIANT.\n` +
        `Email institutionnel : ${data.email_institutionnel}`,
      );
      navigate("/espace-responsable-inscription");
    } catch (e) {
      alert(e.message);
    } finally {
      setActionEnCours(false);
      setModalFinaliser(false);
    }
  };

  // === Rendu ===
  if (chargement) {
    return (
      <EspaceLayout titre="ESP" sousTitre="Service Inscriptions" menu={MENU}>
        <p className="text-center text-esp-muted dark:text-gray-400 py-12">
          Chargement du dossier...
        </p>
      </EspaceLayout>
    );
  }

  if (erreur) {
    return (
      <EspaceLayout titre="ESP" sousTitre="Service Inscriptions" menu={MENU}>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-esp-red/30 p-4 text-esp-red">
          {erreur}
        </div>
        <button
          onClick={() => navigate("/espace-responsable-inscription")}
          className="mt-4 text-sm text-esp-green-dark hover:underline"
        >
          ← Retour aux dossiers
        </button>
      </EspaceLayout>
    );
  }

  if (!dossier) return null;

  const { admis, dossier: infoDossier, documents } = dossier;
  const nbValides = documents.filter((d) => d.statut === "VALIDE").length;
  const nbRefuses = documents.filter((d) => d.statut === "REFUSE").length;
  const nbEnAttente = documents.filter((d) => d.statut === "EN_ATTENTE").length;

  return (
    <EspaceLayout titre="ESP" sousTitre="Service Inscriptions" menu={MENU}>

      {/* Lien retour */}
      <button
        onClick={() => navigate("/espace-responsable-inscription")}
        className="mb-4 text-sm text-esp-green-dark dark:text-esp-gold hover:underline flex items-center gap-1"
      >
        ← Retour aux dossiers
      </button>

      {/* === En-tete : infos admis === */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="text-5xl">📋</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-esp-ink dark:text-white">
              Dossier de {admis.matricule}
            </h1>
            <p className="text-esp-muted dark:text-gray-400 mt-1">
              {admis.prenom} {admis.nom} {admis.voie && `• Voie ${admis.voie}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-esp-muted dark:text-gray-400">
              {admis.email && <span>📧 {admis.email}</span>}
              {admis.telephone && <span>📞 {admis.telephone}</span>}
            </div>
          </div>
          {infoDossier.deja_finalise && (
            <span className="bg-esp-green/10 text-esp-green-dark px-3 py-1 rounded-full text-sm font-semibold">
              ✓ Dossier validé
            </span>
          )}
        </div>
      </div>

      {/* === Compteurs progression === */}
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="bg-esp-green/10 text-esp-green-dark px-3 py-1.5 rounded-lg text-sm font-semibold">
          ✓ {nbValides} validé{nbValides > 1 ? "s" : ""}
        </span>
        <span className="bg-esp-gold/20 text-esp-gold-dark px-3 py-1.5 rounded-lg text-sm font-semibold">
          ⏳ {nbEnAttente} en attente
        </span>
        <span className="bg-red-50 text-esp-red px-3 py-1.5 rounded-lg text-sm font-semibold">
          ✗ {nbRefuses} refusé{nbRefuses > 1 ? "s" : ""}
        </span>
      </div>

      {/* === Liste des documents === */}
      <div className="mt-6 space-y-4">
        {documents.map((doc) => (
          <CarteDocument
            key={doc.id}
            doc={doc}
            actionEnCours={actionEnCours}
            dejaFinalise={infoDossier.deja_finalise}
            onValider={() => validerDocument(doc.id)}
            onRefuser={() => {
              setModalRefus({ document_id: doc.id, libelle: doc.type_document_libelle });
              setMotifRefus(doc.motif_refus || "");
            }}
          />
        ))}
      </div>

      {/* === Bouton final === */}
      {!infoDossier.deja_finalise && (
        <div className="mt-8 rounded-xl border-2 p-6
          border-esp-green bg-esp-green-light dark:bg-esp-green/10">
          <h3 className="font-bold text-esp-green-dark dark:text-white">
            Validation finale du dossier
          </h3>
          <p className="text-sm text-esp-muted dark:text-gray-300 mt-1">
            {infoDossier.tous_documents_valides
              ? `Tous les documents sont validés. Tu peux finaliser pour basculer ${admis.matricule} en ÉTUDIANT et générer son email institutionnel.`
              : `${nbValides}/4 documents validés. Tu dois valider les 4 documents avant de pouvoir finaliser.`
            }
          </p>
          <button
            onClick={() => setModalFinaliser(true)}
            disabled={!infoDossier.tous_documents_valides || actionEnCours}
            className="mt-4 px-6 py-3 rounded-lg font-semibold text-white
              bg-esp-green hover:bg-esp-green-dark
              disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ✓ Valider définitivement le dossier
          </button>
        </div>
      )}

      {/* === Modal Refus === */}
      {modalRefus && (
        <ModalRefus
          libelle={modalRefus.libelle}
          motif={motifRefus}
          setMotif={setMotifRefus}
          actionEnCours={actionEnCours}
          onAnnuler={() => { setModalRefus(null); setMotifRefus(""); }}
          onConfirmer={confirmerRefus}
        />
      )}

      {/* === Modal Validation Finale === */}
      {modalFinaliser && (
        <ModalConfirmation
          titre="Valider définitivement le dossier ?"
          message={`Cette action va basculer ${admis.matricule} (${admis.prenom} ${admis.nom}) en ÉTUDIANT et générer son email institutionnel ${admis.matricule}@esp.mr. Cette action est définitive.`}
          texteConfirmation="Oui, valider"
          actionEnCours={actionEnCours}
          onAnnuler={() => setModalFinaliser(false)}
          onConfirmer={finaliserDossier}
        />
      )}
    </EspaceLayout>
  );
}

/* === Carte d'un document === */
function CarteDocument({ doc, actionEnCours, dejaFinalise, onValider, onRefuser }) {
  const bordureClasse = {
    EN_ATTENTE: "border-esp-gold",
    VALIDE: "border-esp-green",
    REFUSE: "border-esp-red",
  }[doc.statut];

  const estPDF = doc.fichier_url?.toLowerCase().endsWith(".pdf");

  return (
    <div className={`rounded-xl border-2 ${bordureClasse} bg-white dark:bg-gray-800 p-5`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-esp-ink dark:text-white">
            {doc.type_document_libelle}
          </h3>
          <p className="text-xs text-esp-muted dark:text-gray-400 mt-1 truncate">
            📎 {doc.fichier_nom}
          </p>
          <BadgeStatut statut={doc.statut} />
          {doc.motif_refus && (
            <p className="mt-2 text-xs text-esp-red">
              <strong>Motif :</strong> {doc.motif_refus}
            </p>
          )}
        </div>
      </div>

      {/* Aperçu du document */}
      <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {estPDF ? (
          
            <a href={doc.fichier_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 p-8 bg-gray-50 dark:bg-gray-900
              hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <span className="text-4xl">📄</span>
            <span className="text-sm font-medium text-esp-ink dark:text-white">
              Ouvrir le PDF dans un nouvel onglet
            </span>
          </a>
        ) : (
          <img
            src={doc.fichier_url}
            alt={doc.type_document_libelle}
            className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
          />
        )}
      </div>

      {/* Actions */}
      {!dejaFinalise && (
        <div className="mt-4 flex gap-2">
          {doc.statut !== "VALIDE" && (
            <button
              onClick={onValider}
              disabled={actionEnCours}
              className="px-4 py-2 rounded-lg bg-esp-green hover:bg-esp-green-dark
                text-white text-sm font-medium disabled:opacity-50"
            >
              ✓ Valider
            </button>
          )}
          {doc.statut !== "REFUSE" && (
            <button
              onClick={onRefuser}
              disabled={actionEnCours}
              className="px-4 py-2 rounded-lg bg-esp-red hover:opacity-90
                text-white text-sm font-medium disabled:opacity-50"
            >
              ✗ Refuser
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BadgeStatut({ statut }) {
  const styles = {
    EN_ATTENTE: { bg: "bg-esp-gold/20", text: "text-esp-gold-dark", label: "⏳ En attente" },
    VALIDE: { bg: "bg-esp-green/10", text: "text-esp-green-dark", label: "✓ Validé" },
    REFUSE: { bg: "bg-red-50", text: "text-esp-red", label: "✗ Refusé" },
  }[statut];
  return (
    <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${styles.bg} ${styles.text}`}>
      {styles.label}
    </span>
  );
}

/* === Modal de refus === */
function ModalRefus({ libelle, motif, setMotif, actionEnCours, onAnnuler, onConfirmer }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onAnnuler}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-esp-ink dark:text-white">
          Refuser le document
        </h3>
        <p className="text-sm text-esp-muted dark:text-gray-400 mt-1">
          {libelle}
        </p>
        <label className="block mt-4 text-sm font-medium text-esp-ink dark:text-white">
          Motif du refus <span className="text-esp-red">*</span>
        </label>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder="Explique pourquoi le document est refusé, pour que l'admis puisse corriger..."
          rows={4}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-900 text-esp-ink dark:text-white p-3 text-sm
            focus:outline-none focus:border-esp-red"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onAnnuler}
            disabled={actionEnCours}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700
              text-esp-ink dark:text-white text-sm font-medium hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={onConfirmer}
            disabled={actionEnCours || !motif.trim()}
            className="px-4 py-2 rounded-lg bg-esp-red hover:opacity-90
              text-white text-sm font-medium disabled:opacity-50"
          >
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}

/* === Modal de confirmation générique === */
function ModalConfirmation({ titre, message, texteConfirmation, actionEnCours, onAnnuler, onConfirmer }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onAnnuler}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-esp-ink dark:text-white">{titre}</h3>
        <p className="text-sm text-esp-muted dark:text-gray-400 mt-3">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onAnnuler}
            disabled={actionEnCours}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700
              text-esp-ink dark:text-white text-sm font-medium hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={onConfirmer}
            disabled={actionEnCours}
            className="px-5 py-2 rounded-lg bg-esp-green hover:bg-esp-green-dark
              text-white text-sm font-semibold disabled:opacity-50"
          >
            {actionEnCours ? "..." : texteConfirmation}
          </button>
        </div>
      </div>
    </div>
  );
}