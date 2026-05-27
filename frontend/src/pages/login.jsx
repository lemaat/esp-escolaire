import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Appel à l'API Django que tu as configurée dans accounts/urls.py
      const response = await fetch('http://127.0.0.1:8000/accounts/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Enregistre le nom et le rôle localement dans le navigateur
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('username', data.username);

        // Redirection intelligente selon le rôle de l'ESP
        if (data.role === 'ETUDIANT') navigate('/espace-etudiant');
        else if (data.role === 'PROFESSEUR') navigate('/espace-professeur');
        else if (data.role === 'CHEF_DEPT') navigate('/espace-chef-departement');
        else if (data.role === 'RESP_POLE') navigate('/espace-responsable-pole');
        else if (data.role === 'RESP_INSCRIPTION') navigate('/espace-responsable-inscription');
        else if (data.role === 'RESP_LOGEMENT') navigate('/espace-responsable-logement');
        else alert(`Connecté en tant que ${data.role}. Espace en cours de développement.`);
      } else {
        setError(data.erreur || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Impossible de joindre le serveur Django. Lance "python manage.py runserver".');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-indigo-900 mb-2">Escolaire ESP</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Gestion Académique Intégrée</p>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Matricule CNIM / ESP</label>
            <input 
              type="text" required value={username} onChange={e => setUsername(e.target.value)}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: 22045"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-950 text-white p-3 rounded-md font-semibold hover:bg-indigo-900 transition">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}