import React, { useState, useEffect } from "react";
import { StateWrapper, UXState } from "../StateWrapper";
import { UserRole } from "../Layout";
import { ShieldAlert, CheckCircle, Flame, Search, User } from "lucide-react";

interface SCR02Props { currentRole: UserRole; token: string; }
interface Propietario { id: number; nombre: string; rut: string; email: string; }
interface Paciente { id: number; nombre: string; especie: string; raza: string; propietarioId: number; }

export const TriajeEmergencias: React.FC<SCR02Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>("data");
  
  // Listas cargadas de la API
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  // Selección de propietario y paciente
  const [busquedaProp, setBusquedaProp] = useState("");
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPacId, setSelectedPacId] = useState("");

  // Datos del triaje
  const [urgencia, setUrgencia] = useState("rojo");
  const [temperatura, setTemperatura] = useState(38.5);
  const [frecuenciaC, setFrecuenciaC] = useState(120);
  const [frecuenciaR, setFrecuenciaR] = useState(30);
  const [escalaDolor, setEscalaDolor] = useState(5);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  // Cargar clientes y pacientes al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rProp, rPac] = await Promise.all([
          fetch("/api/v1/clinica/propietarios", { headers }),
          fetch("/api/v1/clinica/pacientes", { headers })
        ]);
        if (rProp.ok && rPac.ok) {
          setPropietarios(await rProp.json());
          setPacientes(await rPac.json());
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    fetchData();
  }, []);

  const registrarTriaje = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (!selectedPacId) { setErrorMsg("Debe seleccionar un paciente."); return; }

    try {
      setUxState("loading");
      const response = await fetch("/api/v1/clinica/triajes", {
        method: "POST", headers,
        body: JSON.stringify({
          pacienteId: parseInt(selectedPacId),
          veterinarioId: 2, // Por defecto Dr. John Doe (ID 2 en el backend)
          nivelUrgencia: urgencia,
          temperaturaC: temperatura,
          frecuenciaCardiaca: frecuenciaC,
          frecuenciaRespiratoria: frecuenciaR,
          escalaDolor: escalaDolor,
          tiempoEsperaMinutos: urgencia === "rojo" ? 0 : urgencia === "naranja" ? 15 : 45
        })
      });

      const data = await response.json();
      if (!response.ok) { setErrorMsg(data.error || "Error al registrar triaje."); setUxState("data"); return; }

      setSuccessMsg(`Triaje registrado exitosamente. Clasificación '${urgencia.toUpperCase()}' asignada.`);
      setUxState("data");
      
      // Limpiar selección
      setSelectedProp(null); setSelectedPacId(""); setBusquedaProp("");
    } catch (err: any) {
      setErrorMsg("Error de conexion: " + err.message); setUxState("data");
    }
  };

  const propietariosFiltrados = propietarios.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProp.toLowerCase()) ||
    p.rut.toLowerCase().includes(busquedaProp.toLowerCase())
  );

  const mascotasDelPropietario = selectedProp
    ? pacientes.filter(p => p.propietarioId === selectedProp.id)
    : [];

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={["administrador", "veterinario"]} currentRole={currentRole}>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
            <Flame className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Ingreso y Triaje de Emergencias</h1>
        </div>
        <p className="text-slate-500 text-xs">Clasificación cromática del paciente basada en constantes y signos vitales inmediatos registrados en el backend.</p>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        <form onSubmit={registrarTriaje} className="space-y-4">
          {/* SELECCIÓN DE PROPIETARIO */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Buscar Propietario / Cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
              <input value={busquedaProp} onChange={e => { setBusquedaProp(e.target.value); if(selectedProp) setSelectedProp(null); }} placeholder="Escribe nombre o RUT del cliente..." className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-indigo-400 focus:outline-none"/>
            </div>
            
            {busquedaProp && !selectedProp && (
              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-50 bg-white mt-1">
                {propietariosFiltrados.length === 0 ? (
                  <p className="p-2 text-xs text-slate-400 text-center">No se encontraron clientes.</p>
                ) : (
                  propietariosFiltrados.map(p => (
                    <button type="button" key={p.id} onClick={() => { setSelectedProp(p); setBusquedaProp(p.nombre); setSelectedPacId(""); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer">
                      <span className="font-bold text-slate-800">{p.nombre}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{p.rut}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* SELECCIÓN DE PACIENTE */}
          {selectedProp && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Mascota del Cliente</label>
              {mascotasDelPropietario.length === 0 ? (
                <p className="text-xs text-rose-500 font-medium">Este cliente no posee mascotas registradas. Regístrala en la Ficha Paciente.</p>
              ) : (
                <select value={selectedPacId} onChange={e => setSelectedPacId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none">
                  <option value="">Seleccionar mascota...</option>
                  {mascotasDelPropietario.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.especie} · {m.raza})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Nivel de Urgencia (CH-08)</label>
            <select value={urgencia} onChange={e => setUrgencia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5">
              <option value="rojo">🔴 ROJO (Emergencia Vital Directa)</option>
              <option value="naranja">🟠 NARANJA (Muy Grave)</option>
              <option value="amarillo">🟡 AMARILLO (Grave)</option>
              <option value="verde">🟢 VERDE (Menos Grave)</option>
              <option value="azul">🔵 AZUL (No Urgente)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Temperatura (°C)</label>
              <input type="number" step="0.1" value={temperatura} onChange={e => setTemperatura(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Frecuencia Cardiaca (lpm)</label>
              <input type="number" value={frecuenciaC} onChange={e => setFrecuenciaC(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Frecuencia Respiratoria (rpm)</label>
              <input type="number" value={frecuenciaR} onChange={e => setFrecuenciaR(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Escala de Dolor (1-10)</label>
              <input type="number" min="1" max="10" value={escalaDolor} onChange={e => setEscalaDolor(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5"/>
            </div>
          </div>

          <button type="submit" disabled={!selectedPacId} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
            Guardar Triaje en Clinica
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};