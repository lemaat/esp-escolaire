// frontend/src/pages/espaces/ChefDeptDashboard.jsx
import { useEffect, useState } from "react";
import EspaceLayout from "../../components/EspaceLayout";

const API = "http://localhost:8000";

export default function ChefDeptDashboard() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(API + "/academique/api/chef/notes/", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setChargement(false));
  }, []);

  const menu = [{ label: "Notes du département", route: "/espace-chef-departement", icone: "🏛️" }];

  return (
    <EspaceLayout titre="Chef de Département" sousTitre="Module Académique" menu={menu}>
      <ConsultationNotes
        chargement={chargement}
        data={data}
        titre="Suivi des notes du département"
        etiquette={data?.departement ? `Département ${data.departement}` : null}
      />
    </EspaceLayout>
  );
}

/* Composant de consultation partagé (chef de dept & resp pôle) */
export function ConsultationNotes({ chargement, data, titre, etiquette }) {
  if (chargement) return <p className="text-esp-muted">Chargement…</p>;
  if (!data || data.erreur) {
    return (
      <div className="rounded-xl border border-esp-red/30 bg-red-50 p-4 text-esp-red text-sm">
        {data?.erreur || "Impossible de charger les notes."}
      </div>
    );
  }
  const matieres = data.matieres || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-esp-ink dark:text-white">{titre}</h1>
        {etiquette && (
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-esp-green-light text-esp-green-dark">
            {etiquette}
          </span>
        )}
      </div>
      <p className="text-esp-muted dark:text-gray-400 mt-1">
        Consultation en lecture seule des évaluations publiées.
      </p>

      <div className="mt-6 space-y-3">
        {matieres.map((m) => (
          <div key={m.code} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-esp-card-dark overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-esp-ink dark:text-white">{m.code}</span>
                <span className="text-esp-muted dark:text-gray-400 text-sm ml-2">{m.nom}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-esp-green-light text-esp-green-dark">
                {m.pole || m.departement}
              </span>
            </div>

            {m.evaluations.length === 0 ? (
              <p className="px-5 py-3 text-sm text-esp-muted">Aucune évaluation publiée.</p>
            ) : (
              m.evaluations.map((ev, i) => (
                <div key={i} className="px-5 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-esp-ink dark:text-white">{ev.titre}</span>
                    <span className="text-xs text-esp-muted">coef {ev.coefficient}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ev.notes.length === 0 ? (
                      <span className="text-xs text-esp-muted">Pas encore de notes.</span>
                    ) : (
                      ev.notes.map((n, j) => (
                        <span key={j} className={`text-xs px-2.5 py-1 rounded-lg ${classeNote(n.valeur)}`}>
                          {n.etudiant} : <strong>{n.valeur}</strong>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function classeNote(v) {
  if (v < 8) return "bg-red-50 text-esp-red";
  if (v >= 10) return "bg-esp-green-light text-esp-green-dark";
  return "bg-amber-50 text-esp-gold-dark";
}