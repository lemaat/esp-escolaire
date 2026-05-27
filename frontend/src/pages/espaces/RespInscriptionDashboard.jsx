import { useNavigate } from 'react-router-dom';

export default function RespInscriptionDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-amber-950 text-white p-6 space-y-6">
        <h1 className="text-xl font-bold border-b border-amber-900 pb-4">Service Inscriptions</h1>
        <nav className="space-y-2">
          <a href="#" className="block py-2.5 px-4 rounded bg-amber-900">Dossiers en attente</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-amber-900 transition">Statistiques admis</a>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left py-2.5 px-4 text-red-400 hover:bg-red-950 rounded transition">
          Déconnexion
        </button>
      </div>
      <div className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Validation des Dossiers CNIM / ESP</h2>
      </div>
    </div>
  );
}