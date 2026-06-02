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
      // 1. Obtenir le cookie CSRF depuis Django
      await fetch('http://localhost:8000/accounts/api/csrf/', {
        credentials: 'include',
      });

      // 2. Lire le cookie et envoyer le login
      const response = await fetch('http://localhost:8000/accounts/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('username', data.username);

        if (data.doit_changer_mdp) {
          navigate('/changer-mot-de-passe');
          return;
        }

        if (data.role === 'ETUDIANT') navigate('/espace-etudiant');
        else if (data.role === 'PROFESSEUR') navigate('/espace-professeur');
        else if (data.role === 'CHEF_DEPT') navigate('/espace-chef-departement');
        else if (data.role === 'RESP_POLE') navigate('/espace-responsable-pole');
        else if (data.role === 'RESP_INSCRIPTION') navigate('/espace-responsable-inscription');
        else if (data.role === 'RESP_LOGEMENT') navigate('/espace-responsable-logement');
        else if (data.role === 'ADMIS') navigate('/espace-inscription');
        else alert(`Connecté en tant que ${data.role}. Espace en cours de développement.`);
      } else {
        setError(data.erreur || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Impossible de joindre le serveur Django. Lance "python manage.py runserver".');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-esp-green-dark px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Bandeau supérieur vert avec logo */}
        <div className="bg-esp-green px-8 pt-8 pb-6 text-center">
          <img
            src="/logo-esp.png"
            alt="Logo ESP"
            className="mx-auto h-20 w-20 object-contain"
          />
          <h2 className="mt-4 text-2xl font-bold text-white">Escolaire ESP</h2>
          <p className="mt-1 text-sm text-esp-green-light">
            Gestion Académique Intégrée
          </p>
        </div>

        {/* Corps du formulaire */}
        <div className="px-8 py-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-esp-red/30 p-3 text-sm text-esp-red">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-esp-ink">
                Matricule CNIM / ESP
              </label>
              <input
                type="text" required value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5
                  focus:border-esp-green focus:ring-2 focus:ring-esp-green/30 outline-none"
                placeholder="Ex: 251023"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-esp-ink">
                Mot de passe
              </label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5
                  focus:border-esp-green focus:ring-2 focus:ring-esp-green/30 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-esp-green py-3 font-semibold text-white
                hover:bg-esp-green-dark transition"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}