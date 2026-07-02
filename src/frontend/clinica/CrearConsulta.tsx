import React, { useState, useEffect } from "react";
import { StateWrapper, UXState } from "../StateWrapper";
import { UserRole } from "../Layout";
import { ShieldAlert, CheckCircle, Clipboard } from "lucide-react";
import { BuscadorClientePaciente, Propietario, Paciente } from "../components/BuscadorClientePaciente";

interface SCR06Props { currentRole: UserRole; token?: string; }
interface Veterinario { id: number; nombre: string; licenciaMedica: string; }

export const CrearConsulta: React.FC<SCR06Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>("data");
  
  // Listas de la API
  const [vets, setVets] = useState<Veterinario[]>([]);

  // Selección de propietario y paciente
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  // Historial ID obtenido en background
  const [historialId, setHistorialId] = useState<number | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Formulario de consulta
  const [veterinarioId, setVeterinarioId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [costo, setCosto] = useState(25000);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeToken = token || localStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  // Cargar veterinarios al montar
  useEffect(() => {
    const fetchVets = async () => {
      try {
        const response = await fetch("/api/v1/clinica/veterinarios", { headers });
        if (response.ok) {
          const listVets = await response.json();
          setVets(listVets || []);
          if (listVets && listVets.length > 0) {
            setVeterinarioId(String(listVets[0].id));
          }
        }
      } catch (err) {
        console.error("Error al cargar veterinarios:", err);
      }
    };
    fetchVets();
  }, []);

  // Buscar historial al cambiar paciente
  const handlePacienteSelected = async (prop: Propietario | null, pac: Paciente | null) => {
    setSelectedProp(prop);
    setSelectedPac(pac);
    if (!pac) {
      setHistorialId(null);
      return;
    }

    setLoadingHistorial(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/v1/clinica/pacientes/${pac.id}/historial`, { headers });
      const data = await response.json();
      if (response.ok && data.historial) {
        setHistorialId(data.historial.id);
      } else {
        setErrorMsg("No se encontró historial clínico para esta mascota.");
        setHistorialId(null);
      }
    } catch {
      setErrorMsg("Error al consultar el historial clínico.");
      setHistorialId(null);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const registrarConsulta = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");

    if (!historialId) { setErrorMsg("Se requiere un historial clínico válido."); return; }
    if (!motivo || !diagnostico || !veterinarioId) { setErrorMsg("Completa todos los campos obligatorios."); return; }
    if (motivo.trim().length < 5) { setErrorMsg("El motivo debe tener al menos 5 caracteres."); return; }
    if (costo < 0) { setErrorMsg("El costo no puede ser negativo."); return; }

    try {
      setUxState("loading");
      const response = await fetch("/api/v1/clinica/consultas", {
        method: "POST", headers,
        body: JSON.stringify({
          historialId: Number(historialId),
          veterinarioId: Number(veterinarioId),
          motivo: motivo,
          costoBase: costo,
          diagnostico: diagnostico
        })
      });

      const data = await response.json();
      if (!response.ok) { setErrorMsg(data.error || "Error al registrar la consulta."); setUxState("data"); return; }

      setSuccessMsg("Consulta externa y diagnostico guardados exitosamente.");
      setUxState("data");

      // Limpiar formulario
      setSelectedProp(null); setSelectedPac(null); setHistorialId(null);
      setMotivo(""); setDiagnostico(""); setCosto(25000);
    } catch (err: any) {
      setErrorMsg("Error de conexion: " + err.message); setUxState("data");
    }
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={["administrador", "veterinario"]} currentRole={currentRole}>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
            <Clipboard className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Creacion de Consulta y Diagnostico</h1>
        </div>
        <p className="text-slate-500 text-xs">Formulario para el registro de consultas veterinarias y emision de diagnosticos (L5).</p>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        <form onSubmit={registrarConsulta} className="space-y-4">
          {/* BUSCADOR DE CLIENTE Y MASCOTA INTEGRADO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <BuscadorClientePaciente
              token={activeToken}
              onSelect={handlePacienteSelected}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VETERINARIO */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Veterinario Tratante</label>
              <select value={veterinarioId} onChange={e => setVeterinarioId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none">
                {vets.map((v:Veterinario) => (
                  <option key={v.id} value={v.id}>{v.nombre} ({v.licenciaMedica})</option>
                ))}
              </select>
            </div>

            {/* COSTO BASE */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Costo Base Consulta ($)</label>
              <input type="number" value={costo} onChange={e => setCosto(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
            </div>
          </div>

          {loadingHistorial && <p className="text-[10px] text-slate-400 animate-pulse">Obteniendo historial clínico de la mascota...</p>}
          
          {historialId && (
            <p className="text-[10px] text-emerald-600 font-medium">✓ Historial Clínico Vinculado (ID: {historialId})</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Motivo de Consulta</label>
            <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Control general o síntomas del paciente..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Diagnostico Clinico</label>
            <textarea rows={3} value={diagnostico} onChange={e => setDiagnostico(e.target.value)} placeholder="Escriba los hallazgos detallados y el diagnóstico definitivo..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none resize-none"/>
          </div>

          <button type="submit" disabled={!historialId} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
            Registrar Consulta Externa
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};