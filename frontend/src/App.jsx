import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import EtudiantDashboard from './pages/espaces/EtudiantDashboard';
import ProfesseurDashboard from './pages/espaces/ProfesseurDashboard';
import ChefDeptDashboard from './pages/espaces/ChefDeptDashboard';
import RespPoleDashboard from './pages/espaces/RespPoleDashboard';
import RespInscriptionDashboard from './pages/espaces/RespInscriptionDashboard';
import RespLogementDashboard from './pages/espaces/RespLogementDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/espace-etudiant" element={<EtudiantDashboard />} />
        <Route path="/espace-professeur" element={<ProfesseurDashboard />} />
        <Route path="/espace-chef-departement" element={<ChefDeptDashboard />} />
        <Route path="/espace-responsable-pole" element={<RespPoleDashboard />} />
        <Route path="/espace-responsable-inscription" element={<RespInscriptionDashboard />} />
        <Route path="/espace-responsable-logement" element={<RespLogementDashboard />} />
        <Route path="/inscription-admis" element={<InscriptionAdmis />} />
      </Routes>
    </Router>
  );
}