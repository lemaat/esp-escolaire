// frontend/src/pages/espaces/RespPoleDashboard.jsx
import { useEffect, useState } from "react";
import EspaceLayout from "../../components/EspaceLayout";
import { ConsultationNotes } from "./ChefDeptDashboard";

const API = "http://localhost:8000";

export default function RespPoleDashboard() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(API + "/academique/api/resp-pole/notes/", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setChargement(false));
  }, []);

  const menu = [{ label: "Notes du pôle", route: "/espace-responsable-pole", icone: "🎓" }];

  return (
    <EspaceLayout titre="Responsable de Pôle" sousTitre="Module Académique" menu={menu}>
      <ConsultationNotes
        chargement={chargement}
        data={data}
        titre="Suivi des notes du pôle"
        etiquette={data?.pole ? `Pôle ${data.pole}` : null}
      />
    </EspaceLayout>
  );
}