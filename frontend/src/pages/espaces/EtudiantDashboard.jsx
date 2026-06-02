// frontend/src/pages/espaces/EtudiantDashboard.jsx
import { useEffect, useState } from "react";
import EspaceLayout from "../../components/EspaceLayout";

const API = "http://localhost:8000";

export default function EtudiantDashboard() {
  const [semestres, setSemestres] = useState({});
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(API + "/academique/api/etudiant/notes/", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSemestres(d.semestres || {}))
      .finally(() => setChargement(false));
  }, []);

  const menu = [{ label: "Mes notes", route: "/espace-etudiant", icone: "📊" }];
  const aDesNotes = Object.keys(semestres).length > 0;

  return (
    <EspaceLayout titre="Portail Étudiant" sousTitre="Module Académique" menu={menu}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-esp-ink dark:text-white">Mes notes</h1>
        <p className="text-esp-muted dark:text-gray-400 mt-1">
          Vos notes publiées, regroupées par semestre. Les notes non publiées n'apparaissent pas.
        </p>

        {chargement ? (
          <p className="mt-6 text-esp-muted">Chargement…</p>
        ) : !aDesNotes ? (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
            <p className="text-esp-muted">Aucune note publiée pour le moment.</p>
            <p className="text-sm text-esp-muted mt-1">Vos notes apparaîtront ici dès qu'un enseignant les aura publiées.</p>
          </div>
        ) : (
          Object.entries(semestres).map(([sem, bloc]) => (
            <section key={sem} className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-esp-ink dark:text-white">
                  Semestre {sem.replace("S", "")}
                </h2>
                {bloc.moyenne_semestre != null && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${classeNote(bloc.moyenne_semestre)}`}>
                    Moyenne : {bloc.moyenne_semestre.toFixed(2)} / 20
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {bloc.matieres.map((m) => (
                  <div
                    key={m.code}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-esp-card-dark overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <span className="font-bold text-esp-ink dark:text-white">{m.code}</span>
                        <span className="text-esp-muted dark:text-gray-400 text-sm ml-2">{m.nom}</span>
                      </div>
                      {m.moyenne != null && (
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${classeNote(m.moyenne)}`}>
                          {m.moyenne.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {m.notes.map((n, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                            <td className="px-5 py-2.5 text-esp-ink dark:text-white">{n.evaluation}</td>
                            <td className="px-5 py-2.5 text-esp-muted text-xs">{libelleType(n.type)}</td>
                            <td className="px-5 py-2.5 text-esp-muted text-xs">coef {n.coefficient}</td>
                            <td className="px-5 py-2.5 text-right">
                              <span className={`font-semibold px-2.5 py-1 rounded-lg ${classeNote(n.valeur)}`}>
                                {n.valeur} / 20
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </EspaceLayout>
  );
}

/* Couleur de la note : rouge si eliminatoire (<8), vert si >=10, or entre les deux */
function classeNote(v) {
  if (v < 8) return "bg-red-50 text-esp-red";
  if (v >= 10) return "bg-esp-green-light text-esp-green-dark";
  return "bg-amber-50 text-esp-gold-dark";
}
function libelleType(t) {
  return { DEVOIR: "Devoir", EXAMEN: "Examen", TP: "TP" }[t] || t;
}