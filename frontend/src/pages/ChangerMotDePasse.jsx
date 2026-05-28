import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChampMotDePasse from '/src/components/ChampMotDePasse';
export default function ChangerMotDePasse() {
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Vérification côté client : les deux nouveaux doivent correspondre
    if (nouveau !== confirmation) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (nouveau.length < 8) {
      setError('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/accounts/api/changer-mdp/', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include', // IMPORTANT : envoie le cookie de session
        body: JSON.stringify({ ancien_mdp: ancien, nouveau_mdp: nouveau }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mot de passe changé : l'admis accède à son espace inscription
        navigate('/espace-inscription');
      } else {
        setError(data.erreur || 'Erreur lors du changement de mot de passe.');
      }
    } catch (err) {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-esp-green-dark px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        <div className="bg-esp-green px-8 pt-8 pb-6 text-center">
          <img src="/logo-esp.png" alt="Logo ESP" className="mx-auto h-16 w-16 object-contain" />
          <h2 className="mt-3 text-2xl font-bold text-white">Changer ton mot de passe</h2>
          <p className="mt-1 text-sm text-esp-green-light">
            Pour ta sécurité, définis un nouveau mot de passe personnel.
          </p>
        </div>

        <div className="px-8 py-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-esp-red/30 p-3 text-sm text-esp-red">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <ChampMotDePasse
              label="Mot de passe temporaire (reçu par email)"
              value={ancien}
              onChange={e => setAncien(e.target.value)}
              />
            <ChampMotDePasse
              label="Nouveau mot de passe"
              value={nouveau}
              onChange={e => setNouveau(e.target.value)}
              placeholder="Au moins 8 caractères"
            />
            <ChampMotDePasse
              label="Confirme le nouveau mot de passe"
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
            />

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-esp-green py-3 font-semibold text-white
                hover:bg-esp-green-dark transition disabled:opacity-50"
            >
              {loading ? 'Changement en cours...' : 'Valider mon nouveau mot de passe'}
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