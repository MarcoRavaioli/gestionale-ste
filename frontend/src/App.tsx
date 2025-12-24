import { useEffect, useState, useCallback } from "react"; // <--- 1. Importa useCallback
import type { Cliente } from "./types/Cliente";
import "./App.css";

function App() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [nuovoNome, setNuovoNome] = useState("");

  // 2. "Congeliamo" la funzione con useCallback
  // Ora questa funzione non viene ricreata a ogni render, ma rimane stabile in memoria
  const fetchClienti = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3000/cliente");
      const data = await response.json();
      setClienti(data);
    } catch (error) {
      console.error("Errore di connessione col server:", error);
    }
  }, []); // Le parentesi quadre vuote dicono: "Questa funzione non dipende da variabili esterne che cambiano"

  // 3. Ora possiamo usarla nell'effetto in sicurezza
  useEffect(() => {
    fetchClienti();
  }, [fetchClienti]); // <--- Aggiungiamo la dipendenza qui per correttezza formale

  const aggiungiCliente = async () => {
    if (!nuovoNome) return;

    await fetch("http://localhost:3000/cliente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nuovoNome,
        email: "test@frontend.com",
        telefono: "000000000",
      }),
    });

    setNuovoNome(""); 
    fetchClienti(); // Possiamo riusarla qui tranquillamente
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Gestionale GS POSE</h1>

      {/* SEZIONE INPUT */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Nome nuovo cliente..."
          value={nuovoNome}
          onChange={(e) => setNuovoNome(e.target.value)}
          style={{ padding: "10px", flexGrow: 1 }}
        />
        <button onClick={aggiungiCliente}>Aggiungi</button>
      </div>

      {/* LISTA CLIENTI */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
        }}
      >
        <h3>Clienti nel Database ({clienti.length})</h3>
        {clienti.length === 0 ? (
          <p>Nessun cliente trovato. Aggiungine uno!</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {clienti.map((c) => (
              <li
                key={c.id}
                style={{ padding: "10px", borderBottom: "1px solid #eee" }}
              >
                <strong>
                  {c.id} - {c.nome}
                </strong>{" "}
                <br />
                <small>
                  {c.email} | {c.telefono}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;