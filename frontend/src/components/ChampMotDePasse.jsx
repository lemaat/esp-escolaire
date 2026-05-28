import { useState } from 'react';

export default function ChampMotDePasse({ label, value, onChange, placeholder = '' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-esp-ink">{label}</label>
      <div className="relative mt-1">
        <input
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-gray-300 p-2.5 pr-11
            focus:border-esp-green focus:ring-2 focus:ring-esp-green/30 outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-esp-muted
            hover:text-esp-green"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? (
            // œil barré (masquer)
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4 9 7a9.8 9.8 0 01-2.2 3.2M6.2 6.2A9.8 9.8 0 003 12c0 3 4 7 9 7a9.5 9.5 0 003-.5" />
            </svg>
          ) : (
            // œil ouvert (afficher)
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}