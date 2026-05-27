import { useNavigate } from 'react-router-dom';

export default function EtudiantDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Étudiant';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Barre latérale (Sidebar) */}
      <div className="w-64 bg-indigo-950 text-white p-6 space-y-6">
        <h1 className="text-xl font-bold border-b border-indigo-800 pb-4">Portail Étudiant</h1>
        <nav className="space-y-2">
          <a href="#" className="block py-2.5 px-4 rounded bg-indigo-900">Tableau de bord</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-indigo-900 transition">Mes Notes</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-indigo-900 transition">Demande de Logement</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-indigo-900 transition">Réclamations</a>
        </nav>
        <button onClick={handleLogout} className="w-full text-left py-2.5 px-4 text-red-400 hover:bg-red-950 rounded transition">
          Déconnexion
        </button>
      </div>

      {/* Zone de contenu principale */}
      <div className="flex-1 p-10">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Bienvenue, {username} 👋</h2>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">Année 1 - Tronc Commun</span>
        </header>

        {/* Grille d'actions rapides (Sprint 2 préliminaire) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="font-bold text-lg text-gray-700 mb-2">Suivi Académique</h3>
            <p className="text-gray-500 text-sm mb-4">Consultez vos notes de devoirs et d'examens.</p>
            <button className="text-indigo-600 font-semibold text-sm hover:underline">Voir mes notes →</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="font-bold text-lg text-gray-700 mb-2">Campus & Hébergement</h3>
            <p className="text-gray-500 text-sm mb-4">Vérifiez le statut de votre affectation de chambre.</p>
            <button className="text-indigo-600 font-semibold text-sm hover:underline">Gérer mon logement →</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="font-bold text-lg text-gray-700 mb-2">Secrétariat Numérique</h3>
            <p className="text-gray-500 text-sm mb-4">Téléchargez vos attestations scolaires officielles.</p>
            <button className="text-indigo-600 font-semibold text-sm hover:underline">Faire une demande →</button>
          </div>
        </div>
      </div>
    </div>
  );
}