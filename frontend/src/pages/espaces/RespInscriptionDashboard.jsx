// frontend/src/pages/espaces/RespInscriptionDashboard.jsx
import { useState, useEffect } from "react";
import EspaceLayout from "../../components/EspaceLayout";
import { useNavigate } from "react-router-dom";


const MENU = [
  { label: "Dossiers", route: "/espace-responsable-inscription", icone: "📋" },
  { label: "Statistiques", route: "/espace-responsable-inscription/stats", icone: "📊" },
];

const ONGLETS = [
  { cle: "en_attente", label: "En attente",  couleur: "gold" },
  { cle: "valides",    label: "Validés",     couleur: "green" },
  { cle: "manquants",  label: "Manquants",   couleur: "red" },
];

export default function RespInscriptionDashboard() {
  const [ongletActif, setOngletActif] = useState("en_attente");
  const [dossiers, setDossiers] = useState([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      setErreur("");
      try {
        const res = await fetch(
          `http://localhost:8000/inscriptions/api/resp/dossiers/?statut=${ongletActif}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Erreur lors du chargement.");
        const data = await res.json();
        setDossiers(data.dossiers);
        setTotal(data.total);
      } catch (e) {
        setErreur(e.message);
        setDossiers([]);
        setTotal(0);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [ongletActif]);

  return (
    <EspaceLayout titre="ESP" sousTitre="Service Inscriptions" menu={MENU}>

      {/* Titre de la page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-esp-ink dark:text-white">
          Validation des dossiers
        </h1>
        <p className="text-sm text-esp-muted dark:text-gray-400 mt-1">
          Examinez et validez les dossiers d'inscription des admis
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-8">
        {ONGLETS.map((o) => {
          const actif = ongletActif === o.cle;
          const couleurClasses = {
            gold:  "border-esp-gold text-esp-gold-dark",
            green: "border-esp-green text-esp-green-dark",
            red:   "border-esp-red text-esp-red",
          }[o.couleur];

          return (
            <button
              key={o.cle}
              onClick={() => setOngletActif(o.cle)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition
                ${actif ? couleurClasses : "border-transparent text-esp-muted hover:text-esp-ink dark:hover:text-white"}`}
            >
              {o.label}
              {actif && total > 0 && (
                <span className={`ml-2 inline-block min-w-[1.5rem] px-2 py-0.5 text-xs rounded-full text-white bg-esp-${o.couleur === "gold" ? "gold-dark" : o.couleur === "green" ? "green" : "red"}`}>
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      {chargement && (
        <p className="text-center text-esp-muted dark:text-gray-400 py-12">
          Chargement...
        </p>
      )}

      {erreur && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-esp-red/30 p-4 text-esp-red">
          {erreur}
        </div>
      )}

      {!chargement && !erreur && dossiers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-6xl mb-3">📂</p>
          <p className="text-esp-muted dark:text-gray-400">
            Aucun dossier dans cet onglet
          </p>
        </div>
      )}

      {!chargement && !erreur && dossiers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {dossiers.map((d) => (
            <CarteDossier key={d.matricule} dossier={d} type={ongletActif} />
          ))}
        </div>
      )}
    </EspaceLayout>
  );
}

/* === Carte d'un dossier === */
function CarteDossier({ dossier, type }) {
  const cliquable = type !== "manquants";
  const couleurIcone = type === "valides" ? "green" : type === "manquants" ? "red" : "gold";
  const navigate = useNavigate();
  
  const contenu = (
    <>
      <IconeDossier couleur={couleurIcone} />
      <p className="mt-3 font-bold text-esp-ink dark:text-white text-lg">{dossier.matricule}</p>
      <p className="text-sm text-esp-muted dark:text-gray-400 truncate">
        {dossier.prenom} {dossier.nom}
      </p>

      {type === "en_attente" && (
        <div className="mt-3 flex flex-wrap gap-1 text-xs">
          {dossier.nb_docs_valides > 0 && (
            <span className="bg-esp-green/10 text-esp-green-dark px-2 py-0.5 rounded font-semibold">
              ✓ {dossier.nb_docs_valides}
            </span>
          )}
          {dossier.nb_docs_en_attente > 0 && (
            <span className="bg-esp-gold/20 text-esp-gold-dark px-2 py-0.5 rounded font-semibold">
              ⏳ {dossier.nb_docs_en_attente}
            </span>
          )}
          {dossier.nb_docs_refuses > 0 && (
            <span className="bg-red-50 text-esp-red px-2 py-0.5 rounded font-semibold">
              ✗ {dossier.nb_docs_refuses}
            </span>
          )}
        </div>
      )}

      {type === "valides" && dossier.email_institutionnel && (
        <p className="mt-3 text-xs text-esp-green-dark font-semibold truncate">
          ✉ {dossier.email_institutionnel}
        </p>
      )}

      {type === "manquants" && (
        <div className="mt-3 space-y-1 text-xs text-esp-muted dark:text-gray-400">
          {dossier.email && <p className="truncate">📧 {dossier.email}</p>}
          {dossier.telephone && <p>📞 {dossier.telephone}</p>}
          {dossier.voie && <p>🎓 Voie {dossier.voie}</p>}
          <p className="mt-2 inline-block text-xs font-semibold bg-red-50 text-esp-red px-2 py-0.5 rounded">
            {dossier.statut_detail}
          </p>
        </div>
      )}
    </>
  );

  const classesCommunes = `rounded-xl border bg-white dark:bg-gray-800 p-5 transition
    border-gray-200 dark:border-gray-700`;

  if (cliquable) {
    return (
      <button
        onClick={() => navigate(`/espace-responsable-inscription/dossier/${dossier.matricule}`)}
        className={`${classesCommunes} hover:shadow-md hover:border-esp-gold text-left w-full`}
      >
        {contenu}
      </button>
    );
  }
  return <div className={classesCommunes}>{contenu}</div>;
}

/* === Icône dossier style Windows === */
function IconeDossier({ couleur = "gold" }) {
  const couleurs = {
    gold:  { principal: "#e3a72f", ombre: "#b8841f", reflet: "#f4c97a" },
    green: { principal: "#1f7a3d", ombre: "#14572a", reflet: "#4ea676" },
    red:   { principal: "#c0392b", ombre: "#922d22", reflet: "#dc6c5f" },
  }[couleur];

  return (
    <svg viewBox="0 0 64 56" className="w-16 h-14">
      <path d="M 4 8 L 24 8 L 28 14 L 60 14 L 60 18 L 4 18 Z" fill={couleurs.ombre} />
      <path d="M 4 14 L 60 14 L 60 50 L 4 50 Z" fill={couleurs.principal} />
      <path d="M 4 14 L 60 14 L 60 20 L 4 20 Z" fill={couleurs.reflet} opacity="0.6" />
    </svg>
  );
}