// frontend/src/pages/espaces/ProfesseurDashboard.jsx
import { useEffect, useState } from "react";
import EspaceLayout from "../../components/EspaceLayout";

const API = "http://localhost:8000";

export default function ProfesseurDashboard() {
  const [matieres, setMatieres] = useState([]);
  const [matiere, setMatiere] = useState(null);       // matiere selectionnee
  const [evaluations, setEvaluations] = useState([]);
  const [evaluation, setEvaluation] = useState(null); // evaluation ouverte (grille)
  const [grille, setGrille] = useState([]);           // lignes etudiants
  const [valeurs, setValeurs] = useState({});         // { etudiant_id: "16" }
  const [chargement, setChargement] = useState(true);
  const [feedback, setFeedback] = useState(null);     // { type: "ok"|"err", texte }

  // Formulaire "nouvelle evaluation"
  const [nouvelle, setNouvelle] = useState({ titre: "", type_evaluation: "DEVOIR", date: "", coefficient: "1" });
  const [creationOuverte, setCreationOuverte] = useState(false);

  // --- Chargement initial : les matieres du prof ---
  useEffect(() => {
    apiGet("/academique/api/prof/matieres/")
      .then((d) => setMatieres(d.matieres || []))
      .finally(() => setChargement(false));
  }, []);

  // --- Selectionner une matiere -> charger ses evaluations ---
  const ouvrirMatiere = async (m) => {
    setMatiere(m);
    setEvaluation(null);
    setGrille([]);
    setFeedback(null);
    setCreationOuverte(false);
    const d = await apiGet(`/academique/api/prof/matieres/${m.id}/evaluations/`);
    setEvaluations(d.evaluations || []);
  };

  // --- Ouvrir la grille de notes d'une evaluation ---
  const ouvrirGrille = async (ev) => {
    setEvaluation(ev);
    setFeedback(null);
    const d = await apiGet(`/academique/api/prof/evaluations/${ev.id}/notes/`);
    setGrille(d.etudiants || []);
    const init = {};
    (d.etudiants || []).forEach((e) => {
      init[e.etudiant_id] = e.valeur != null ? String(e.valeur) : "";
    });
    setValeurs(init);
  };

  // --- Enregistrer les notes saisies ---
  const enregistrer = async () => {
    const notes = Object.entries(valeurs)
      .filter(([, v]) => v !== "")
      .map(([id, v]) => ({ etudiant_id: Number(id), valeur: Number(v) }));
    const { status, data } = await apiPost(
      `/academique/api/prof/evaluations/${evaluation.id}/notes/`,
      { notes }
    );
    if (status === 200 && (data.erreurs || []).length === 0) {
      setFeedback({ type: "ok", texte: data.message });
    } else {
      const txt = (data.erreurs || []).join(" • ") || data.erreur || "Erreur lors de l'enregistrement.";
      setFeedback({ type: "err", texte: txt });
    }
    await rafraichirEvaluations();
  };

  // --- Publier l'evaluation (rend les notes visibles aux etudiants) ---
  const publier = async () => {
    const { status, data } = await apiPost(
      `/academique/api/prof/evaluations/${evaluation.id}/publier/`, {}
    );
    if (status === 200) {
      setEvaluation({ ...evaluation, publiee: true });
      setFeedback({ type: "ok", texte: "Évaluation publiée — visible par les étudiants." });
      await rafraichirEvaluations();
    } else {
      setFeedback({ type: "err", texte: data.erreur || "Échec de la publication." });
    }
  };

  // --- Creer une nouvelle evaluation ---
  const creerEvaluation = async () => {
    if (!nouvelle.titre || !nouvelle.date) {
      setFeedback({ type: "err", texte: "Titre et date sont requis." });
      return;
    }
    const { status, data } = await apiPost("/academique/api/prof/evaluations/", {
      matiere_id: matiere.id,
      titre: nouvelle.titre,
      type_evaluation: nouvelle.type_evaluation,
      date: nouvelle.date,
      coefficient: nouvelle.coefficient || 1,
    });
    if (status === 201) {
      setNouvelle({ titre: "", type_evaluation: "DEVOIR", date: "", coefficient: "1" });
      setCreationOuverte(false);
      await rafraichirEvaluations();
      setFeedback({ type: "ok", texte: "Évaluation créée." });
    } else {
      setFeedback({ type: "err", texte: data.erreur || "Échec de la création." });
    }
  };

  const rafraichirEvaluations = async () => {
    if (!matiere) return;
    const d = await apiGet(`/academique/api/prof/matieres/${matiere.id}/evaluations/`);
    setEvaluations(d.evaluations || []);
  };

  const menu = [{ label: "Saisir les notes", route: "/espace-professeur", icone: "📝" }];

  return (
    <EspaceLayout titre="Portail Enseignant" sousTitre="Module Académique" menu={menu}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-esp-ink dark:text-white">Saisie des notes</h1>
        <p className="text-esp-muted dark:text-gray-400 mt-1">
          Choisissez une matière, ouvrez une évaluation, saisissez puis publiez les notes.
        </p>

        {feedback && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm border ${
              feedback.type === "ok"
                ? "bg-esp-green-light border-esp-green/30 text-esp-green-dark"
                : "bg-red-50 border-esp-red/30 text-esp-red"
            }`}
          >
            {feedback.texte}
          </div>
        )}

        {/* === Étape 1 : matières === */}
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-esp-muted">Mes matières</h2>
          {chargement ? (
            <p className="mt-3 text-esp-muted">Chargement…</p>
          ) : matieres.length === 0 ? (
            <p className="mt-3 text-esp-muted">Aucune matière ne vous est attribuée.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {matieres.map((m) => (
                <button
                  key={m.id}
                  onClick={() => ouvrirMatiere(m)}
                  className={`text-left rounded-xl p-4 border transition shadow-sm hover:shadow-md
                    ${matiere?.id === m.id
                      ? "bg-esp-green text-white border-esp-green"
                      : "bg-white dark:bg-esp-card-dark border-gray-200 dark:border-gray-700 hover:border-esp-green"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{m.code}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      matiere?.id === m.id ? "bg-white/20" : "bg-esp-green-light text-esp-green-dark"
                    }`}>
                      {m.pole || m.departement}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 truncate ${matiere?.id === m.id ? "text-white/90" : "text-esp-muted dark:text-gray-400"}`}>
                    {m.nom}
                  </p>
                  <p className={`text-xs mt-2 ${matiere?.id === m.id ? "text-white/70" : "text-esp-muted"}`}>
                    {m.nb_evaluations} évaluation{m.nb_evaluations > 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* === Étape 2 : évaluations de la matière === */}
        {matiere && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-esp-muted">
                Évaluations — {matiere.code}
              </h2>
              <button
                onClick={() => setCreationOuverte(!creationOuverte)}
                className="text-sm font-semibold text-esp-green hover:text-esp-green-dark"
              >
                {creationOuverte ? "Annuler" : "+ Nouvelle évaluation"}
              </button>
            </div>

            {creationOuverte && (
              <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-esp-card-dark p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  placeholder="Titre (ex. Devoir 2)" value={nouvelle.titre}
                  onChange={(e) => setNouvelle({ ...nouvelle, titre: e.target.value })}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 text-sm md:col-span-2"
                />
                <select
                  value={nouvelle.type_evaluation}
                  onChange={(e) => setNouvelle({ ...nouvelle, type_evaluation: e.target.value })}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 text-sm"
                >
                  <option value="DEVOIR">Devoir</option>
                  <option value="EXAMEN">Examen</option>
                  <option value="TP">TP</option>
                </select>
                <input
                  type="date" value={nouvelle.date}
                  onChange={(e) => setNouvelle({ ...nouvelle, date: e.target.value })}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 text-sm"
                />
                <input
                  type="number" step="0.5" min="0" placeholder="Coefficient" value={nouvelle.coefficient}
                  onChange={(e) => setNouvelle({ ...nouvelle, coefficient: e.target.value })}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 text-sm"
                />
                <button
                  onClick={creerEvaluation}
                  className="md:col-span-1 rounded-lg bg-esp-green text-white text-sm font-semibold py-2 hover:bg-esp-green-dark transition"
                >
                  Créer
                </button>
              </div>
            )}

            {evaluations.length === 0 ? (
              <p className="mt-3 text-esp-muted">Aucune évaluation. Créez-en une pour commencer.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {evaluations.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => ouvrirGrille(ev)}
                    className={`rounded-lg px-4 py-2.5 text-sm border transition flex items-center gap-2
                      ${evaluation?.id === ev.id
                        ? "bg-esp-gold text-esp-ink border-esp-gold"
                        : "bg-white dark:bg-esp-card-dark border-gray-200 dark:border-gray-700 hover:border-esp-gold text-esp-ink dark:text-white"
                      }`}
                  >
                    <span className="font-semibold">{ev.titre}</span>
                    <span className="text-xs opacity-70">· coef {ev.coefficient}</span>
                    {ev.publiee
                      ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-esp-green-light text-esp-green-dark">Publiée</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-esp-muted">Brouillon</span>}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* === Étape 3 : grille de saisie === */}
        {evaluation && (
          <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-esp-card-dark overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-bold text-esp-ink dark:text-white">
                  {matiere.code} · {evaluation.titre}
                </h3>
                <p className="text-xs text-esp-muted">
                  Saisissez les notes sur 20. Les notes éliminatoires (&lt; 8) apparaissent en rouge.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={enregistrer}
                  className="rounded-lg bg-esp-green text-white text-sm font-semibold px-4 py-2 hover:bg-esp-green-dark transition"
                >
                  Enregistrer
                </button>
                {!evaluation.publiee && (
                  <button
                    onClick={publier}
                    className="rounded-lg bg-esp-gold text-esp-ink text-sm font-semibold px-4 py-2 hover:bg-esp-gold-dark hover:text-white transition"
                  >
                    Publier
                  </button>
                )}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-esp-muted border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-2 font-medium">Étudiant</th>
                  <th className="px-5 py-2 font-medium w-40">Note / 20</th>
                </tr>
              </thead>
              <tbody>
                {grille.map((e) => {
                  const v = valeurs[e.etudiant_id];
                  const num = v === "" || v == null ? null : Number(v);
                  const eliminatoire = num != null && num < 8;
                  return (
                    <tr key={e.etudiant_id} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="px-5 py-2.5 text-esp-ink dark:text-white">{e.nom_complet}</td>
                      <td className="px-5 py-2.5">
                        <input
                          type="number" step="0.25" min="0" max="20"
                          value={v ?? ""}
                          onChange={(ev) => setValeurs({ ...valeurs, [e.etudiant_id]: ev.target.value })}
                          className={`w-24 rounded-lg border p-1.5 text-center outline-none focus:ring-2
                            ${eliminatoire
                              ? "border-esp-red text-esp-red focus:ring-esp-red/30"
                              : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-esp-green/30 focus:border-esp-green"
                            }`}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </EspaceLayout>
  );
}

/* === Helpers API (memes conventions que login.jsx / EspaceLayout) === */
async function apiGet(path) {
  const r = await fetch(API + path, { credentials: "include" });
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(API + path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}