// frontend/src/components/EspaceLayout.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Layout commun à tous les espaces (étudiant, prof, resp, etc.)
 * Props :
 * - titre : nom de l'espace affiché dans la sidebar
 * - sousTitre : sous-titre sous le logo (ex. "Service Inscriptions")
 * - menu : tableau d'items [{ label, route, icone }]
 * - children : le contenu de la page (la zone principale)
 */
export default function EspaceLayout({ titre, sousTitre, menu = [], children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // === Profil utilisateur (chargé une fois) ===
  const [utilisateur, setUtilisateur] = useState(null);
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);

  // === Mode sombre ===
  const [sombre, setSombre] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (sombre) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [sombre]);

  // === Charger profil au montage ===
  useEffect(() => {
    fetch("http://localhost:8000/accounts/api/me/", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setUtilisateur(data))
      .catch(() => setUtilisateur(null));
  }, []);

  // === Déconnexion ===
  const seDeconnecter = async () => {
    try {
      await fetch("http://localhost:8000/accounts/api/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
    } catch (e) { /* on continue quand meme */ }
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-esp-surface dark:bg-gray-900 transition-colors">

      {/* === Sidebar === */}
      <aside className="w-64 bg-esp-green-dark text-white flex flex-col">
        {/* Logo + sous-titre */}
        <div className="p-6 border-b border-esp-green/40">
          <div className="flex items-center gap-3">
            <img src="/logo-esp.png" alt="ESP" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-bold text-lg leading-tight">{titre}</p>
              {sousTitre && (
                <p className="text-xs text-esp-gold leading-tight">{sousTitre}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => {
            const actif = location.pathname === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`w-full text-left py-2.5 px-4 rounded-lg text-sm font-medium
                  transition flex items-center gap-3
                  ${actif
                    ? "bg-esp-gold text-esp-ink"
                    : "text-white/90 hover:bg-esp-green hover:text-white"
                  }`}
              >
                {item.icone && <span className="text-base">{item.icone}</span>}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Pied de sidebar */}
        <div className="p-4 border-t border-esp-green/40 space-y-2">
          {/* Toggle mode sombre */}
          <button
            onClick={() => setSombre(!sombre)}
            className="w-full text-left py-2 px-4 rounded-lg text-sm text-white/80
              hover:bg-esp-green hover:text-white transition flex items-center gap-3"
          >
            <span>{sombre ? "☀️" : "🌙"}</span>
            {sombre ? "Mode clair" : "Mode sombre"}
          </button>

          <button
            onClick={seDeconnecter}
            className="w-full text-left py-2 px-4 rounded-lg text-sm
              text-esp-red hover:bg-esp-red hover:text-white transition flex items-center gap-3"
          >
            <span>🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* === Zone principale === */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-end transition-colors">
          {utilisateur && (
            <div className="relative">
              <button
                onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
                className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-3 py-1.5 transition"
              >
                <Avatar utilisateur={utilisateur} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-esp-ink dark:text-white leading-tight">
                    {utilisateur.first_name || utilisateur.username}
                  </p>
                  <p className="text-xs text-esp-muted dark:text-gray-400 leading-tight">
                    {libelleRole(utilisateur.role)}
                  </p>
                </div>
                <span className="text-esp-muted dark:text-gray-400 text-xs">▼</span>
              </button>

              {/* Menu déroulant profil */}
              {menuProfilOuvert && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => { setMenuProfilOuvert(false); navigate("/profil"); }}
                    className="w-full text-left px-4 py-2 text-sm text-esp-ink dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    👤 Mon profil
                  </button>
                  <button
                    onClick={() => { setMenuProfilOuvert(false); seDeconnecter(); }}
                    className="w-full text-left px-4 py-2 text-sm text-esp-red hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/* === Avatar (photo si dispo, sinon initiales) === */
function Avatar({ utilisateur }) {
  if (utilisateur.photo_profil) {
    return (
      <img
        src={utilisateur.photo_profil}
        alt="Profil"
        className="h-9 w-9 rounded-full object-cover border-2 border-esp-gold"
      />
    );
  }
  const initiales = (utilisateur.first_name?.[0] || utilisateur.username[0] || "?").toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-esp-gold text-esp-ink font-bold flex items-center justify-center border-2 border-esp-gold">
      {initiales}
    </div>
  );
}

/* === Helpers === */
function libelleRole(role) {
  return {
    ADMIS: "Admis",
    ETUDIANT: "Étudiant",
    PROFESSEUR: "Professeur",
    CHEF_DEPT: "Chef de département",
    RESP_POLE: "Responsable de pôle",
    RESP_INSCRIPTION: "Service Inscriptions",
    RESP_LOGEMENT: "Service Logement",
  }[role] || role;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}