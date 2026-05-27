import { useNavigate } from 'react-router-dom';

export default function RespLogementDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-cyan-950 text-white p-6 space-y-6">
        <h1 className="text-xl font-bold border-b border-cyan-900 pb-4">Gestion Logement</h1>
        <nav className="space-y-2">
          <a href="#" className="block py-2.5 px-4 rounded bg-cyan-900">Affectation lits</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-cyan-900 transition">Annonces / Blocs</a>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left py-2.5 px-4 text-red-400 hover:bg-red-950 rounded transition">
          Déconnexion
        </button>
      </div>
      <div className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Administration du Campus Militaire</h2>
      </div>
    </div>
  );
}