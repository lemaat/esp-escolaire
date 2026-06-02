import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';

/* ── SVG Icons ── */
const Icon = {
  dashboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  building: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  folder: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>,
  bed: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 10V6a1 1 0 011-1h16a1 1 0 011 1v4M3 10v8m18-8v8m0 0H3m0 0h18" /></svg>,
  megaphone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  logout: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const DEPT_LABELS = {
  IRT: 'Informatique & Réseaux Télécom', GE: 'Génie Électrique',
  GM: 'Génie Mécanique', MPG: 'Maths & Physique Ingénieur',
  SID: 'Systèmes Info & Décision', GC: 'Génie Civil', TC: 'Tronc Commun',
};

const STATUT_BADGE = {
  BROUILLON: 'bg-gray-100 text-gray-600 border-gray-200',
  SOUMIS:    'bg-esp-green-light/30 text-esp-green border-amber-200',
  EXAMEN:    'bg-blue-500/30 text-esp-ink border-blue-200',
  ACCEPTE:   'bg-emerald-600/20 text-emerald-600 border-emerald-600',
  REFUSE:    'bg-red-50 text-red-600 border-red-300',
  AFFECTE:   'bg-white/10 text-esp-ink border-gray-200',
};

const NIVEAU_LABELS = {
  1: 'L1 / Année 1', 2: 'L2 / Année 2', 3: 'L3 / Année 3',
  4: 'M1 / Année 4', 5: 'M2 / Année 5',
};

export default function LogementAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const TABS = [
    ['stats',        'Tableau de bord', Icon.dashboard],
    ['blocs',        'Blocs & Chambres', Icon.building],
    ['dossiers',     'Demandes',         Icon.folder],
    ['affectations', 'Affectations',     Icon.bed],
    ['annonces',     'Annonces',         Icon.megaphone],
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
              <h1 className="text-lg font-bold text-white leading-tight">Gestion du Logement</h1>
              <p className="text-xs text-gray-400 mt-0.5">Administration</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {TABS.map(([key, label, icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 text-left py-2.5 px-3 rounded-lg transition-all text-sm font-medium ${
                tab === key
                  ? 'bg-esp-green text-white'
                  : 'text-white hover:bg-white/10 hover:text-white'
              }`}>
              {icon}
              {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-esp-green/20">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 text-left py-2.5 px-3 text-gray-400 hover:bg-white/10 hover:text-red-400 rounded-lg transition text-sm">
            {Icon.logout} Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto p-8">
        {tab === 'stats'        && <TabStats />}
        {tab === 'blocs'        && <TabBlocs />}
        {tab === 'dossiers'     && <TabDossiers />}
        {tab === 'affectations' && <TabAffectations />}
        {tab === 'annonces'     && <TabAnnonces />}
      </main>
    </div>
  );
}

/* ═══════════════════════ TAB : Statistiques ═══════════════════════ */
function TabStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/logement/api/admin/stats/').then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <Empty text="Erreur de chargement des statistiques." />;

  const g = stats.general;
  const d = stats.dossiers;

  return (
    <div className="space-y-8">
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble du logement étudiant" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          ['Blocs',         g.blocs,           'border-gray-200 text-esp-ink'],
          ['Chambres',      g.chambres,        'border-gray-200 text-esp-ink'],
          ['Total places',  g.total_places,    'border-blue-200 text-esp-ink'],
          ['Occupées',      g.places_occupees, 'border-amber-200 text-esp-green'],
          ['Libres',        g.places_libres,   'border-emerald-600 text-emerald-600'],
          ['Étudiants logés', g.etudiants_loges, 'border-gray-200 text-esp-ink'],
        ].map(([label, value, cls]) => (
          <div key={label} className={`bg-white border rounded-xl p-5 shadow-sm ${cls} hover:shadow-md transition`}>
            <div className="text-3xl font-extrabold">{value}</div>
            <div className="text-xs font-medium mt-1 opacity-70">{label}</div>
          </div>
        ))}
      </div>

      {/* Dossiers */}
      <Card title="État des dossiers">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ['Total',       d.total,    'bg-slate-50  text-esp-ink  border-gray-200'],
            ['Brouillon',   d.brouillon,'bg-gray-50   text-gray-600   border-gray-200'],
            ['Soumis',      d.soumis,   'bg-esp-green-light/30  text-esp-green  border-amber-200'],
            ['En examen',   d.examen,   'bg-blue-500/30   text-esp-ink   border-blue-200'],
            ['Acceptés',    d.acceptes, 'bg-emerald-600/20 text-emerald-600 border-emerald-600'],
            ['Refusés',     d.refuses,  'bg-red-50    text-red-600    border-red-300'],
            ['Affectés',    d.affectes, 'bg-white/10 text-esp-ink border-gray-200'],
          ].map(([label, value, cls]) => (
            <div key={label} className={`border rounded-xl p-4 text-center ${cls}`}>
              <div className="text-2xl font-extrabold">{value}</div>
              <div className="text-xs font-medium mt-1">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Répartition par sexe">
          <BarItem label="Hommes" value={stats.par_sexe.hommes} max={g.etudiants_loges || 1} color="bg-blue-500" />
          <BarItem label="Femmes" value={stats.par_sexe.femmes} max={g.etudiants_loges || 1} color="bg-esp-green-light" />
        </Card>
        <Card title="Répartition par âge">
          {Object.entries(stats.par_age).map(([tranche, nb]) => (
            <BarItem key={tranche} label={tranche} value={nb} max={g.etudiants_loges || 1} color="bg-violet-500" />
          ))}
        </Card>
        <Card title="Répartition par filière">
          {stats.par_filiere.map(r => (
            <BarItem key={r.departement} label={DEPT_LABELS[r.departement] || r.departement}
              value={r.nombre} max={g.etudiants_loges || 1} color="bg-emerald-600" />
          ))}
          {stats.par_filiere.length === 0 && <p className="text-sm text-gray-400">Aucune donnée</p>}
        </Card>
        <Card title="Répartition par niveau">
          {stats.par_niveau.map(r => (
            <BarItem key={r.annee} label={NIVEAU_LABELS[r.annee] || `Année ${r.annee}`}
              value={r.nombre} max={g.etudiants_loges || 1} color="bg-esp-green-light" />
          ))}
          {stats.par_niveau.length === 0 && <p className="text-sm text-gray-400">Aucune donnée</p>}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════ TAB : Blocs & Chambres ═══════════════════════ */
function TabBlocs() {
  const [blocs, setBlocs] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBloc, setSelectedBloc] = useState(null);
  const [chambreDetail, setChambreDetail] = useState(null);
  const [newBloc, setNewBloc] = useState({ nom: '', sexe: 'M', description: '' });
  const [newChambre, setNewChambre] = useState({ bloc: '', numero: '', capacite: 2, etat: 'DISPONIBLE' });
  const [msg, setMsg] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        apiFetch('/logement/api/admin/blocs/'),
        apiFetch('/logement/api/admin/chambres/'),
      ]);
      setBlocs(b); setChambres(c);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const ajouterBloc = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/logement/api/admin/blocs/', { method: 'POST', body: JSON.stringify(newBloc) });
      setNewBloc({ nom: '', sexe: 'M', description: '' });
      setMsg('Bloc créé avec succès.');
      loadAll();
    } catch (er) { setMsg(er.data?.nom?.[0] || 'Erreur lors de la création.'); }
  };

  const supprimerBloc = async (id) => {
    if (!confirm('Supprimer ce bloc et toutes ses chambres ?')) return;
    await apiFetch(`/logement/api/admin/blocs/${id}/`, { method: 'DELETE' });
    setMsg('Bloc supprimé.'); loadAll();
  };

  const ajouterChambre = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/logement/api/admin/chambres/', { method: 'POST', body: JSON.stringify(newChambre) });
      setNewChambre({ bloc: '', numero: '', capacite: 2, etat: 'DISPONIBLE' });
      setMsg('Chambre créée avec succès.');
      loadAll();
    } catch (er) { setMsg(JSON.stringify(er.data) || 'Erreur.'); }
  };

  const supprimerChambre = async (id) => {
    if (!confirm('Supprimer cette chambre ?')) return;
    await apiFetch(`/logement/api/admin/chambres/${id}/`, { method: 'DELETE' });
    setMsg('Chambre supprimée.'); setChambreDetail(null); loadAll();
  };

  const voirChambre = async (id) => {
    const data = await apiFetch(`/logement/api/admin/chambres/${id}/`);
    setChambreDetail(data);
  };

  if (loading) return <Loader />;
  const filteredChambres = selectedBloc ? chambres.filter(c => c.bloc === selectedBloc) : chambres;

  return (
    <div className="space-y-6">
      <PageHeader title="Blocs & Chambres" subtitle="Gestion du parc immobilier de la résidence" />
      {msg && <Alert msg={msg} onClose={() => setMsg('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ajouter un bloc">
          <form onSubmit={ajouterBloc} className="space-y-3">
            <input value={newBloc.nom} onChange={e => setNewBloc({ ...newBloc, nom: e.target.value })}
              placeholder="Nom du bloc (ex : Bloc A)" required className="input-field" />
            <select value={newBloc.sexe} onChange={e => setNewBloc({ ...newBloc, sexe: e.target.value })} className="input-field">
              <option value="M">Hommes</option>
              <option value="F">Femmes</option>
            </select>
            <textarea value={newBloc.description} onChange={e => setNewBloc({ ...newBloc, description: e.target.value })}
              placeholder="Description (optionnel)" className="input-field" rows={2} />
            <button type="submit" className="btn-primary w-full">Créer le bloc</button>
          </form>
        </Card>

        <Card title="Ajouter une chambre">
          <form onSubmit={ajouterChambre} className="space-y-3">
            <select value={newChambre.bloc} onChange={e => setNewChambre({ ...newChambre, bloc: e.target.value })} required className="input-field">
              <option value="">— Choisir un bloc —</option>
              {blocs.map(b => <option key={b.id} value={b.id}>{b.nom} ({b.sexe === 'M' ? 'Hommes' : 'Femmes'})</option>)}
            </select>
            <input value={newChambre.numero} onChange={e => setNewChambre({ ...newChambre, numero: e.target.value })}
              placeholder="Numéro (ex : 101)" required className="input-field" />
            <input type="number" min={1} value={newChambre.capacite}
              onChange={e => setNewChambre({ ...newChambre, capacite: parseInt(e.target.value) || 1 })}
              className="input-field" placeholder="Capacité" />
            <button type="submit" className="btn-primary w-full">Créer la chambre</button>
          </form>
        </Card>
      </div>

      {/* Blocs */}
      <Card title="Liste des blocs résidentiels">
        {blocs.length === 0 ? <Empty text="Aucun bloc créé." /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blocs.map(b => (
              <div key={b.id} onClick={() => setSelectedBloc(selectedBloc === b.id ? null : b.id)}
                className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                  selectedBloc === b.id ? 'border-esp-green bg-esp-green-light' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-esp-ink">{b.nom}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    b.sexe === 'M' ? 'bg-blue-500/30 text-esp-ink border-blue-200' : 'bg-esp-green-light/30 text-esp-green border-amber-200'
                  }`}>{b.sexe === 'M' ? 'Hommes' : 'Femmes'}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{b.description || '—'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{b.nombre_chambres} chambre(s)</span>
                  <button onClick={e => { e.stopPropagation(); supprimerBloc(b.id); }}
                    className="text-xs text-red-500 hover:text-red-600 font-medium transition">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chambres */}
      <Card title={`Chambres${selectedBloc ? ` — ${blocs.find(b => b.id === selectedBloc)?.nom}` : ' (tous les blocs)'}`}>
        <DataTable
          headers={['Bloc', 'N°', 'Capacité', 'Occupées', 'Libres', 'État', 'Actions']}
          empty={filteredChambres.length === 0}
        >
          {filteredChambres.map(c => (
            <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-medium text-esp-ink">{c.bloc_nom}</td>
              <td className="py-3 px-4">{c.numero}</td>
              <td className="py-3 px-4">{c.capacite}</td>
              <td className="py-3 px-4">{c.places_occupees}</td>
              <td className="py-3 px-4">{c.places_restantes}</td>
              <td className="py-3 px-4">
                <StatutBadge value={c.etat} map={{
                  DISPONIBLE: 'bg-emerald-600/20 text-emerald-600 border-emerald-600',
                  COMPLETE:   'bg-esp-green-light/30 text-esp-green border-amber-200',
                  HORS_SERVICE: 'bg-red-50 text-red-600 border-red-300',
                }} />
              </td>
              <td className="py-3 px-4 text-right space-x-3">
                <button onClick={() => voirChambre(c.id)} className="text-xs text-esp-green hover:underline font-medium">Détails</button>
                <button onClick={() => supprimerChambre(c.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      {chambreDetail && (
        <Modal onClose={() => setChambreDetail(null)} title={`Chambre ${chambreDetail.numero} — ${chambreDetail.bloc_nom}`}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <InfoBox label="Bloc" value={chambreDetail.bloc_nom} />
            <InfoBox label="Sexe" value={chambreDetail.bloc_sexe === 'M' ? 'Hommes' : 'Femmes'} />
            <InfoBox label="Capacité" value={chambreDetail.capacite} />
            <InfoBox label="Occupées" value={chambreDetail.places_occupees} />
            <InfoBox label="Libres" value={chambreDetail.places_restantes} />
            <InfoBox label="État" value={chambreDetail.etat} />
          </div>
          {chambreDetail.occupants?.length > 0 && (
            <>
              <h4 className="font-semibold text-esp-ink text-sm mb-2">Occupants</h4>
              <DataTable headers={['Matricule', 'Nom', 'Âge', 'Filière', 'Niveau']} empty={false}>
                {chambreDetail.occupants.map((o, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 px-3 font-mono text-xs">{o.matricule}</td>
                    <td className="py-2 px-3">{o.nom_complet}</td>
                    <td className="py-2 px-3">{o.age ?? '—'}</td>
                    <td className="py-2 px-3">{o.departement_display}</td>
                    <td className="py-2 px-3">{o.annee}</td>
                  </tr>
                ))}
              </DataTable>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════ TAB : Dossiers ═══════════════════════ */
function TabDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ statut: '', departement: '', annee: '', sexe: '', q: '' });
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [decision, setDecision] = useState({ type: '', commentaire: '' });
  const [msg, setMsg] = useState('');

  const loadDossiers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const data = await apiFetch(`/logement/api/admin/dossiers/?${params}`);
      setDossiers(data);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadDossiers(); }, [loadDossiers]);

  const voirDossier = async (id) => {
    const data = await apiFetch(`/logement/api/admin/dossiers/${id}/`);
    setSelectedDossier(data);
    setDecision({ type: '', commentaire: '' });
  };

  const envoyerDecision = async () => {
    if (!decision.type) return;
    try {
      await apiFetch(`/logement/api/admin/dossiers/${selectedDossier.id}/decision/`, {
        method: 'POST',
        body: JSON.stringify({ decision: decision.type, commentaire: decision.commentaire }),
      });
      setMsg(`Dossier ${decision.type === 'ACCEPTE' ? 'accepté' : 'refusé'} avec succès.`);
      setSelectedDossier(null);
      loadDossiers();
    } catch (e) { setMsg(e.data?.erreur || 'Erreur lors de la décision.'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Demandes de logement" subtitle="Validation et suivi des dossiers étudiants" />
      {msg && <Alert msg={msg} onClose={() => setMsg('')} />}

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
        <input value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          placeholder="Rechercher par nom ou matricule" className="input-field flex-1 min-w-[200px]" />
        <select value={filters.statut} onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))} className="input-field w-40">
          <option value="">Tous les statuts</option>
          <option value="SOUMIS">Soumis</option>
          <option value="EXAMEN">En examen</option>
          <option value="ACCEPTE">Accepté</option>
          <option value="REFUSE">Refusé</option>
          <option value="AFFECTE">Affecté</option>
        </select>
        <select value={filters.sexe} onChange={e => setFilters(f => ({ ...f, sexe: e.target.value }))} className="input-field w-32">
          <option value="">Tous</option>
          <option value="M">Homme</option>
          <option value="F">Femme</option>
        </select>
        <select value={filters.departement} onChange={e => setFilters(f => ({ ...f, departement: e.target.value }))} className="input-field w-36">
          <option value="">Toutes filières</option>
          {Object.entries(DEPT_LABELS).map(([k]) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <Card>
          <DataTable
            headers={['Matricule', 'Nom', 'Filière', 'Niveau', 'Sexe', 'Statut', 'Date', 'Action']}
            empty={dossiers.length === 0}
            emptyText="Aucun dossier correspondant aux filtres."
          >
            {dossiers.map(d => {
              const info = d.etudiant_info || {};
              return (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">{info.matricule}</td>
                  <td className="py-3 px-4 font-medium text-esp-ink">{info.prenom} {info.nom}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{info.departement_display || info.departement || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{info.annee ?? '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{info.sexe === 'M' ? 'M' : info.sexe === 'F' ? 'F' : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUT_BADGE[d.statut] || 'bg-gray-100 text-gray-600'}`}>
                      {d.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">{new Date(d.date_creation).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => voirDossier(d.id)} className="text-xs text-esp-green hover:underline font-semibold">Consulter</button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      )}

      {selectedDossier && (
        <Modal onClose={() => setSelectedDossier(null)} title="Dossier de logement — détail" wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(selectedDossier.etudiant_info || {}).map(([k, v]) => (
                <InfoBox key={k} label={k.replace(/_/g, ' ')} value={v || '—'} />
              ))}
            </div>

            <h4 className="font-semibold text-esp-ink text-sm pt-2 border-t">Documents déposés</h4>
            {!selectedDossier.documents?.length ? (
              <p className="text-sm text-gray-400">Aucun document déposé.</p>
            ) : (
              <div className="space-y-2">
                {selectedDossier.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-slate-50 border border-esp-green/20 p-3 rounded-lg">
                    <span className="text-sm font-medium text-esp-ink flex-1">{doc.type_document}</span>
                    <span className="text-xs text-gray-400">{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</span>
                    {doc.fichier_url && (
                      <a href={doc.fichier_url} target="_blank" rel="noreferrer"
                        className="text-xs text-esp-green hover:underline font-medium">Voir le fichier</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedDossier.commentaire_admin && (
              <div className="p-3 bg-esp-green-light/30 border border-amber-200 rounded-lg text-sm text-esp-green">
                <span className="font-semibold">Commentaire précédent :</span> {selectedDossier.commentaire_admin}
              </div>
            )}

            {['SOUMIS', 'EXAMEN'].includes(selectedDossier.statut) && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-esp-ink text-sm">Décision administrative</h4>
                <div className="flex gap-3">
                  <button onClick={() => setDecision(d => ({ ...d, type: 'ACCEPTE' }))}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm border transition-all ${
                      decision.type === 'ACCEPTE'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-600 border-emerald-600/50 hover:bg-emerald-600/20'
                    }`}>Accepter</button>
                  <button onClick={() => setDecision(d => ({ ...d, type: 'REFUSE' }))}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm border transition-all ${
                      decision.type === 'REFUSE'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                    }`}>Refuser</button>
                </div>
                <textarea value={decision.commentaire}
                  onChange={e => setDecision(d => ({ ...d, commentaire: e.target.value }))}
                  placeholder="Motif de la décision (optionnel)"
                  className="input-field w-full" rows={3} />
                <button onClick={envoyerDecision} disabled={!decision.type}
                  className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
                  Confirmer la décision
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════ TAB : Affectations ═══════════════════════ */
function TabAffectations() {
  const [affectations, setAffectations] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ etudiant: '', chambre: '' });
  const [msg, setMsg] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aff, dos, ch] = await Promise.all([
        apiFetch('/logement/api/admin/affectations/'),
        apiFetch('/logement/api/admin/dossiers/?statut=ACCEPTE'),
        apiFetch('/logement/api/admin/chambres/'),
      ]);
      setAffectations(aff);
      setDossiers(dos);
      setChambres(ch.filter(c => c.est_disponible));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selectedDossier = dossiers.find(d => d.etudiant_info?.matricule === form.etudiant);
  const etudiantSexe = selectedDossier?.etudiant_info?.sexe;
  const chambresDisponibles = etudiantSexe ? chambres.filter(c => c.bloc_sexe === etudiantSexe) : chambres;

  const affecter = async (e) => {
    e.preventDefault();
    const dossier = dossiers.find(d => d.etudiant_info?.matricule === form.etudiant);
    if (!dossier) { setMsg("Étudiant introuvable dans les dossiers acceptés."); return; }
    try {
      const fullDossier = await apiFetch(`/logement/api/admin/dossiers/${dossier.id}/`);
      await apiFetch('/logement/api/admin/affectations/', {
        method: 'POST',
        body: JSON.stringify({ etudiant: fullDossier.etudiant, chambre: form.chambre }),
      });
      setMsg('Affectation enregistrée avec succès.');
      setForm({ etudiant: '', chambre: '' });
      loadAll();
    } catch (er) { setMsg(er.data?.erreur || "Erreur lors de l'affectation."); }
  };

  const desaffecter = async (id) => {
    if (!confirm('Retirer cet étudiant de sa chambre ?')) return;
    try {
      await apiFetch(`/logement/api/admin/affectations/${id}/`, { method: 'DELETE' });
      setMsg('Désaffectation effectuée.');
      loadAll();
    } catch (er) { setMsg(er.data?.erreur || 'Erreur.'); }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Affectations" subtitle="Assignation des chambres aux étudiants" />
      {msg && <Alert msg={msg} onClose={() => setMsg('')} />}

      <Card title="Nouvelle affectation">
        {dossiers.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun dossier accepté en attente d'affectation.</p>
        ) : (
          <form onSubmit={affecter} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Étudiant (dossier accepté)</label>
              <select value={form.etudiant} onChange={e => setForm({ ...form, etudiant: e.target.value, chambre: '' })} required className="input-field w-full">
                <option value="">— Sélectionner un étudiant —</option>
                {dossiers.map(d => (
                  <option key={d.id} value={d.etudiant_info?.matricule}>
                    {d.etudiant_info?.matricule} — {d.etudiant_info?.prenom} {d.etudiant_info?.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Chambre disponible</label>
              <select value={form.chambre} onChange={e => setForm({ ...form, chambre: e.target.value })} required className="input-field w-full">
                <option value="">— Sélectionner une chambre —</option>
                {chambresDisponibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.bloc_nom} / N°{c.numero} — {c.places_restantes} place(s) disponible(s)
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">Affecter</button>
          </form>
        )}
      </Card>

      <Card title={`Affectations en cours (${affectations.length})`}>
        <DataTable
          headers={['Matricule', 'Nom complet', 'Bloc', 'Chambre', 'Date', 'Action']}
          empty={affectations.length === 0}
          emptyText="Aucune affectation active."
        >
          {affectations.map(a => (
            <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-mono text-xs text-gray-600">{a.etudiant_info?.matricule}</td>
              <td className="py-3 px-4 font-medium text-esp-ink">{a.etudiant_info?.prenom} {a.etudiant_info?.nom}</td>
              <td className="py-3 px-4">{a.chambre_info?.bloc_nom}</td>
              <td className="py-3 px-4">N°{a.chambre_info?.numero}</td>
              <td className="py-3 px-4 text-xs text-gray-400">{new Date(a.date_affectation).toLocaleDateString('fr-FR')}</td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => desaffecter(a.id)} className="text-xs text-red-500 hover:underline font-medium">Désaffecter</button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </div>
  );
}

/* ═══════════════════════ TAB : Annonces ═══════════════════════ */
function TabAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titre: '', contenu: '' });
  const [msg, setMsg] = useState('');

  const loadAnnonces = useCallback(async () => {
    setLoading(true);
    try { const data = await apiFetch('/logement/api/annonces/'); setAnnonces(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAnnonces(); }, [loadAnnonces]);

  const publier = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/logement/api/admin/annonces/', { method: 'POST', body: JSON.stringify(form) });
      setForm({ titre: '', contenu: '' });
      setMsg('Annonce publiée avec succès.');
      loadAnnonces();
    } catch (er) { setMsg(er.data?.titre?.[0] || 'Erreur lors de la publication.'); }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    await apiFetch(`/logement/api/admin/annonces/${id}/`, { method: 'DELETE' });
    setMsg('Annonce supprimée.'); loadAnnonces();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Annonces" subtitle="Diffusion d'informations aux étudiants résidents" />
      {msg && <Alert msg={msg} onClose={() => setMsg('')} />}

      <Card title="Publier une annonce">
        <form onSubmit={publier} className="space-y-3">
          <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
            placeholder="Titre de l'annonce" required className="input-field w-full" />
          <textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })}
            placeholder="Contenu de l'annonce" required className="input-field w-full" rows={4} />
          <button type="submit" className="btn-primary">Publier</button>
        </form>
      </Card>

      {loading ? <Loader /> : (
        <div className="space-y-3">
          {annonces.length === 0 ? <Empty text="Aucune annonce publiée." /> : annonces.map(a => (
            <article key={a.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-esp-ink">{a.titre}</h4>
                  <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{a.contenu}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{new Date(a.date_publication).toLocaleDateString('fr-FR')}</span>
                  <button onClick={() => supprimer(a.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════ UI Primitives ══════════════════ */
function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Empty({ text = 'Aucun élément.' }) {
  return <p className="text-sm text-gray-400 text-center py-6">{text}</p>;
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <h2 className="text-xl font-bold text-esp-ink font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {title && (
        <div className="px-6 py-3.5 border-b border-esp-green/20 bg-slate-50">
          <h3 className="text-sm font-semibold text-esp-ink">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

function Alert({ msg, onClose }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-emerald-600/20 border border-emerald-600/50 text-emerald-600 text-sm rounded-lg">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="text-emerald-600 hover:text-emerald-600/80 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function Modal({ onClose, title, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'} w-full max-h-[85vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b border-esp-green/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold text-esp-ink">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-slate-50 border border-esp-green/20 rounded-lg p-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-esp-ink">{String(value)}</div>
    </div>
  );
}

function StatutBadge({ value, map }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${map[value] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {value}
    </span>
  );
}

function DataTable({ headers, children, empty, emptyText = 'Aucun élément.', ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-esp-green/20 bg-slate-50">
            {headers.map(h => <th key={h} className="text-left py-3 px-4 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr><td colSpan={headers.length} className="text-center py-10 text-gray-400">{emptyText}</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

function BarItem({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-400">{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
