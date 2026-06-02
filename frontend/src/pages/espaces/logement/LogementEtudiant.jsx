import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';

/* ── SVG Icons ── */
const Icon = {
  folder:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>,
  key:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  bell:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  back:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  logout:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  upload:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  check:   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  document:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  info:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

/* ── Constants ── */
const TYPE_LABELS = {
  SCOLARITE:     'Justificatif de scolarité',
  CNI:           'Copie de la CNI',
  PHOTO:         "Photo d'identité",
  COMPLEMENTAIRE:'Document complémentaire',
};
const TYPES_OBLIGATOIRES = ['SCOLARITE', 'CNI', 'PHOTO'];

const STATUT_CONFIG = {
  BROUILLON: { cls: 'bg-white/10 text-gray-600 border-gray-200',   label: 'Brouillon' },
  SOUMIS:    { cls: 'bg-esp-green-light/30 text-esp-green border-amber-200',     label: 'Soumis' },
  EXAMEN:    { cls: 'bg-blue-500/30 text-esp-ink border-blue-200',        label: 'En cours d\'examen' },
  ACCEPTE:   { cls: 'bg-emerald-600/20 text-emerald-600 border-emerald-600', label: 'Accepté' },
  REFUSE:    { cls: 'bg-red-50 text-red-600 border-red-300',           label: 'Refusé' },
  AFFECTE:   { cls: 'bg-white/10 text-esp-ink border-gray-200',  label: 'Affecté à une chambre' },
};

export default function LogementEtudiant() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Étudiant';

  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [affectation, setAffectation] = useState(null);
  const [annonces, setAnnonces] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState({});
  const [tab, setTab] = useState('dossier');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [demande, aff, ann] = await Promise.all([
        apiFetch('/logement/api/demande/'),
        apiFetch('/logement/api/demande/affectation/'),
        apiFetch('/logement/api/annonces/'),
      ]);
      setProfil(demande.profil);
      setDossier(demande.dossier);
      setAffectation(aff.affectation);
      setAnnonces(ann);
    } catch {
      setErr('Impossible de charger vos données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const creerDossier = async () => {
    try {
      setErr('');
      const data = await apiFetch('/logement/api/demande/', { method: 'POST' });
      setDossier(data);
      setMsg('Dossier créé avec succès.');
    } catch (e) { setErr(e.data?.erreur || 'Erreur lors de la création du dossier.'); }
  };

  const soumettre = async () => {
    try {
      setErr('');
      await apiFetch('/logement/api/demande/soumettre/', { method: 'POST' });
      setMsg('Demande soumise avec succès. L\'administration examinera votre dossier.');
      load();
    } catch (e) { setErr(e.data?.erreur || 'Erreur lors de la soumission.'); }
  };

  const uploadDoc = async (typeDoc, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [typeDoc]: true }));
    setErr('');
    try {
      const fd = new FormData();
      fd.append('type_document', typeDoc);
      fd.append('fichier', file);
      await apiFetch('/logement/api/demande/documents/', {
        method: 'POST', body: fd, headers: {},
      });
      setMsg(`${TYPE_LABELS[typeDoc]} téléversé avec succès.`);
      load();
    } catch (e) { setErr(e.data?.erreur || 'Erreur lors du téléversement.'); }
    finally { setUploading(u => ({ ...u, [typeDoc]: false })); }
  };

  const docByType = (type) => dossier?.documents?.find(d => d.type_document === type);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement en cours…</p>
        </div>
      </div>
    );
  }

  const TABS = [
    ['dossier',     'Mon dossier',    Icon.folder],
    ['affectation', 'Mon affectation', Icon.key],
    ['annonces',    'Annonces',       Icon.bell],
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-esp-green-dark text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-esp-green/20">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg shrink-0 shadow-sm">
              <img src="/logo-esp.png" alt="Logo ESP" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Module</p>
              <h1 className="text-lg font-bold text-white leading-tight">Mon Logement</h1>
              <p className="text-xs text-gray-400 mt-0.5">{username}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {TABS.map(([key, label, icon]) => (
            <button key={key} onClick={() => { setTab(key); setMsg(''); setErr(''); }}
              className={`w-full flex items-center gap-3 text-left py-2.5 px-3 rounded-lg transition-all text-sm font-medium ${
                tab === key ? 'bg-emerald-600 text-white' : 'text-white hover:bg-white/10 hover:text-white'
              }`}>
              {icon} {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-esp-green/20 space-y-0.5">
          <button onClick={() => navigate('/espace-etudiant')}
            className="w-full flex items-center gap-3 text-left py-2.5 px-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition text-sm">
            {Icon.back} Retour au portail
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/'); }}
            className="w-full flex items-center gap-3 text-left py-2.5 px-3 text-gray-400 hover:bg-white/10 hover:text-red-400 rounded-lg transition text-sm">
            {Icon.logout} Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Flash messages */}
        {msg && (
          <div className="mb-5 flex items-center gap-3 p-3 bg-emerald-600/20 border border-emerald-600/50 text-emerald-600 text-sm rounded-lg">
            {Icon.info}<span className="flex-1">{msg}</span>
            <button onClick={() => setMsg('')} className="text-emerald-600 hover:text-emerald-600/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {err && (
          <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="flex-1">{err}</span>
            <button onClick={() => setErr('')} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* ─── TAB: Mon dossier ─── */}
        {tab === 'dossier' && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-esp-ink font-bold">Demande de logement</h2>
              <p className="text-sm text-gray-500 mt-0.5">Constituez votre dossier et déposez les documents requis.</p>
            </div>

            {/* Informations personnelles */}
            {profil && (
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-3.5 border-b border-esp-green/20 bg-slate-50">
                  <h3 className="text-sm font-semibold text-esp-ink">Informations personnelles</h3>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ['Matricule',       profil.matricule],
                    ['Nom',            profil.nom],
                    ['Prénom',         profil.prenom],
                    ['Sexe',           profil.sexe_display || '—'],
                    ['Date de naissance', profil.date_naissance || '—'],
                    ['Âge',            profil.age != null ? `${profil.age} ans` : '—'],
                    ['Email',          profil.email],
                    ['Téléphone',      profil.telephone || '—'],
                    ['Filière',        profil.departement_display || '—'],
                    ['Niveau',         profil.annee ? `Année ${profil.annee}` : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-medium text-esp-ink bg-slate-50 border border-esp-green/20 rounded-lg px-3 py-2">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pas de dossier */}
            {!dossier && (
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-esp-ink mb-1">Aucune demande en cours</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                  Créez votre dossier de logement pour commencer. Vous pourrez ensuite y joindre vos documents et le soumettre à l'administration.
                </p>
                <button onClick={creerDossier}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-600/90 transition shadow-sm hover:shadow">
                  Créer mon dossier
                </button>
              </section>
            )}

            {/* Dossier existant */}
            {dossier && (
              <>
                {/* Statut */}
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Statut du dossier</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                        STATUT_CONFIG[dossier.statut]?.cls || 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {STATUT_CONFIG[dossier.statut]?.label || dossier.statut}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Créé le {new Date(dossier.date_creation).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  {dossier.commentaire_admin && (
                    <div className="mt-4 p-3 bg-esp-green-light/30 border border-amber-200 rounded-lg text-sm text-esp-green">
                      <p className="font-semibold mb-0.5">Commentaire de l'administration</p>
                      <p>{dossier.commentaire_admin}</p>
                    </div>
                  )}
                </section>

                {/* Documents */}
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-esp-green/20 bg-slate-50">
                    <h3 className="text-sm font-semibold text-esp-ink">Documents à fournir</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Formats acceptés : PDF, JPG, PNG</p>
                  </div>
                  <div className="p-6 space-y-3">
                    {Object.entries(TYPE_LABELS).map(([type, label]) => {
                      const doc = docByType(type);
                      const obligatoire = TYPES_OBLIGATOIRES.includes(type);
                      const canUpload = ['BROUILLON', 'REFUSE'].includes(dossier.statut);
                      return (
                        <div key={type} className="flex items-center gap-4 p-4 bg-slate-50 border border-esp-green/20 rounded-xl hover:border-gray-200 transition">
                          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                            {Icon.document}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-esp-ink">{label}</span>
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                obligatoire
                                  ? 'bg-red-50 text-red-600 border-red-300'
                                  : 'bg-white/10 text-gray-400 border-gray-200'
                              }`}>
                                {obligatoire ? 'Obligatoire' : 'Optionnel'}
                              </span>
                            </div>
                            {doc ? (
                              <div className="flex items-center gap-3 text-xs">
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                  {Icon.check} Déposé le {new Date(doc.date_upload).toLocaleDateString('fr-FR')}
                                </span>
                                {doc.fichier_url && (
                                  <a href={doc.fichier_url} target="_blank" rel="noreferrer"
                                    className="text-esp-green hover:underline">Consulter</a>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Non déposé</p>
                            )}
                          </div>
                          {canUpload && (
                            <label className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                              uploading[type]
                                ? 'bg-white/10 text-gray-400 border-gray-200 cursor-wait'
                                : 'bg-white text-esp-ink border-gray-300 hover:border-slate-400 hover:bg-slate-50'
                            }`}>
                              {uploading[type] ? (
                                <><div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />Envoi…</>
                              ) : (
                                <>{Icon.upload}{doc ? 'Remplacer' : 'Téléverser'}</>
                              )}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                disabled={uploading[type]}
                                onChange={e => uploadDoc(type, e.target.files[0])} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Soumission */}
                {dossier.statut === 'BROUILLON' && (
                  <div className="flex justify-end">
                    <button onClick={soumettre}
                      className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-600/90 transition shadow-sm hover:shadow">
                      Soumettre ma demande
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── TAB: Mon affectation ─── */}
        {tab === 'affectation' && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-esp-ink font-bold">Mon affectation</h2>
              <p className="text-sm text-gray-500 mt-0.5">Détails de votre chambre et colocataires.</p>
            </div>

            {!affectation ? (
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 10V6a1 1 0 011-1h16a1 1 0 011 1v4M3 10v8m18-8v8m0 0H3" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-esp-ink mb-1">Pas encore affecté</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Votre affectation apparaîtra ici une fois que l'administration aura validé votre dossier et vous aura assigné une chambre.
                </p>
              </section>
            ) : (
              <>
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-esp-green/20 bg-slate-50">
                    <h3 className="text-sm font-semibold text-esp-ink">Ma chambre</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      ['Bloc',           affectation.chambre_info?.bloc_nom],
                      ['Numéro',         affectation.chambre_info?.numero],
                      ['Capacité',       affectation.chambre_info?.capacite],
                      ['Occupants',      affectation.chambre_info?.places_occupees],
                      ['Places libres',  affectation.chambre_info?.places_restantes],
                      ['Affecté le',     new Date(affectation.date_affectation).toLocaleDateString('fr-FR')],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 border border-esp-green/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-semibold text-esp-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {affectation.colocataires?.length > 0 && (
                  <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-3.5 border-b border-esp-green/20 bg-slate-50">
                      <h3 className="text-sm font-semibold text-esp-ink">Colocataires</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-esp-green/20 bg-slate-50">
                            <th className="text-left py-3 px-6 font-semibold">Nom</th>
                            <th className="text-left py-3 px-6 font-semibold">Âge</th>
                            <th className="text-left py-3 px-6 font-semibold">Filière</th>
                            <th className="text-left py-3 px-6 font-semibold">Niveau</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affectation.colocataires.map((c, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                              <td className="py-3 px-6 font-medium text-esp-ink">{c.nom_complet}</td>
                              <td className="py-3 px-6 text-gray-600">{c.age ?? '—'}</td>
                              <td className="py-3 px-6 text-gray-600">{c.departement}</td>
                              <td className="py-3 px-6 text-gray-600">{c.annee}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── TAB: Annonces ─── */}
        {tab === 'annonces' && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-esp-ink font-bold">Annonces</h2>
              <p className="text-sm text-gray-500 mt-0.5">Informations diffusées par l'administration du logement.</p>
            </div>

            {annonces.length === 0 ? (
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-esp-ink mb-1">Aucune annonce</h3>
                <p className="text-gray-400 text-sm">Il n'y a aucune annonce pour le moment.</p>
              </section>
            ) : (
              <div className="space-y-3">
                {annonces.map(a => (
                  <article key={a.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-esp-ink">{a.titre}</h3>
                      <time className="text-xs text-gray-400 shrink-0">
                        {new Date(a.date_publication).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">{a.contenu}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
