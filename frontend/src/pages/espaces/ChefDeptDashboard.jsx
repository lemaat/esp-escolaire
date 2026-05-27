import { useNavigate } from 'react-router-dom';

export default function ChefDeptDashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-slate-900 text-white p-6 space-y-6">
        <h1 className="text-xl font-bold border-b border-slate-800 pb-4">Espace Chef Dept</h1>
        <nav className="space-y-2">
          <a href="#" className="block py-2.5 px-4 rounded bg-slate-800">Vue d'ensemble</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-slate-800 transition">Validation des Notes</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-slate-800 transition">Gestion des Modules</a>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left py-2.5 px-4 text-red-400 hover:bg-red-950 rounded transition">
          Déconnexion
        </button>
      </div>

      <div className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Direction des Départements de Spécialité</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
          <p className="text-yellow-700 text-sm font-medium">Session de validation des délibérations du Semestre 1 ouverte.</p>
        </div>
      </div>
    </div>
  );
}