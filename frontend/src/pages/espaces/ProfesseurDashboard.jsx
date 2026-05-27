import { useNavigate } from 'react-router-dom';

export default function ProfesseurDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Enseignant';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-emerald-950 text-white p-6 space-y-6">
        <h1 className="text-xl font-bold border-b border-emerald-800 pb-4">Portail Enseignant</h1>
        <nav className="space-y-2">
          <a href="#" className="block py-2.5 px-4 rounded bg-emerald-900">Tableau de bord</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-emerald-900 transition">Saisir les Notes</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-emerald-900 transition">Dépôt de Ressources</a>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left py-2.5 px-4 text-red-400 hover:bg-red-950 rounded transition">
          Déconnexion
        </button>
      </div>
      <div className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Espace Académique — Prof. {username}</h2>
        <p className="text-gray-600">Sélectionnez une matière pour saisir les notes de devoirs ou d'examens.</p>
      </div>
    </div>
  );
}