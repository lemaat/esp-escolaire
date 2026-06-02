import { useNavigate } from 'react-router-dom';

export default function RespLogementDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-cyan-950 text-white p-6 space-y-6">
        <h1 className="text-xl font-bold border-b border-cyan-900 pb-4">Portail Administration</h1>
        <nav className="space-y-2">
          <button onClick={() => navigate('/logement-admin')} className="w-full text-left py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 transition font-semibold">
            Module Logement 🏠
          </button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left py-2.5 px-4 text-red-400 hover:bg-red-950 rounded transition mt-auto">
          Déconnexion
        </button>
      </div>
      <div className="flex-1 p-10 bg-slate-50">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Accueil du Responsable Logement</h2>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Bienvenue. Le nouveau module de gestion intégrée du logement est désormais disponible. Cliquez sur le bouton ci-dessous pour accéder au tableau de bord complet (gestion des dossiers, des infrastructures et des affectations).
        </p>
        <button onClick={() => navigate('/logement-admin')} className="bg-emerald-600 text-white px-8 py-3 rounded-xl shadow hover:bg-emerald-700 hover:shadow-md transition font-semibold text-lg flex items-center gap-2">
          Ouvrir le Module Logement
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
}