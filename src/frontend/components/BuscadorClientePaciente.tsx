import React, { useState, useEffect } from "react";
import { Search, UserPlus, ShieldAlert, CheckCircle, Heart } from "lucide-react";

export interface Propietario {
  id: number;
  nombre: string;
  rut: string;
  email?: string | null;
  telefono: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  propietarioId: number;
}

interface BuscadorClientePacienteProps {
  token: string;
  onSelect: (propietario: Propietario | null, paciente: Paciente | null) => void;
  showPaciente?: boolean;
  labelPropietario?: string;
  labelPaciente?: string;
  allowMeshRegistration?: boolean; // Permite registrar al cliente físicamente desde el buscador
}

export const BuscadorClientePaciente: React.FC<BuscadorClientePacienteProps> = ({
  token,
  onSelect,
  showPaciente = true,
  labelPropietario = "Buscar Propietario / Cliente",
  labelPaciente = "Mascota / Paciente",
  allowMeshRegistration = true
}) => {
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  // Búsqueda y selecciones
  const [busquedaProp, setBusquedaProp] = useState("");
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  // Formulario registro físico
  const [mostrarRegistroProp, setMostrarRegistroProp] = useState(false);
  const [propNombre, setPropNombre] = useState("");
  const [propRut, setPropRut] = useState("");
  const [propEmail, setPropEmail] = useState("");
  const [propTelefono, setPropTelefono] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeToken = token || localStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  const loadMasters = async () => {
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
      console.error("Error al cargar maestros del buscador:", err);
    }
  };

  useEffect(() => {
    if (activeToken) {
      loadMasters();
    }
  }, [activeToken]);

  // Manejar el cambio de propietario seleccionado
  const handleSelectPropietario = (prop: Propietario | null) => {
    setSelectedProp(prop);
    setSelectedPac(null);
    setBusquedaProp(prop ? prop.nombre : "");
    onSelect(prop, null);
  };

  // Manejar el cambio de mascota seleccionada
  const handleSelectPaciente = (pacId: string) => {
    if (!pacId) {
      setSelectedPac(null);
      onSelect(selectedProp, null);
      return;
    }
    const pac = pacientes.find(p => p.id === Number(pacId)) || null;
    setSelectedPac(pac);
    onSelect(selectedProp, pac);
  };

  const registrarPropietarioFisico = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!propNombre || !propRut || !propTelefono) {
      setErrorMsg("Nombre, RUT y teléfono son obligatorios.");
      return;
    }

    try {
      const r = await fetch("/api/v1/clinica/propietarios", {
        method: "POST",
        headers,
        body: JSON.stringify({
          nombre: propNombre,
          rut: propRut,
          email: propEmail || null,
          telefono: propTelefono
        })
      });

      const d = await r.json();
      if (!r.ok) {
        setErrorMsg(d.error || "Error al registrar cliente.");
        return;
      }

      setSuccessMsg(`Cliente '${propNombre}' registrado físicamente con éxito.`);
      setPropNombre(""); setPropRut(""); setPropEmail(""); setPropTelefono("");
      setMostrarRegistroProp(false);

      // Recargar maestros, actualizar listado y auto-seleccionar
      await loadMasters();
      handleSelectPropietario(d);
    } catch (err: any) {
      setErrorMsg("Error de conexión: " + err.message);
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
    <div className="space-y-4">
      {/* Mensajes del Formulario de Registro */}
      {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
      {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUSCADOR O REGISTRO DE PROPIETARIO */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-slate-500 uppercase">{labelPropietario}</label>
            {allowMeshRegistration && (
              <button
                type="button"
                onClick={() => setMostrarRegistroProp(!mostrarRegistroProp)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <UserPlus className="h-3 w-3" /> {mostrarRegistroProp ? "Volver a buscar" : "Registrar Cliente"}
              </button>
            )}
          </div>

          {mostrarRegistroProp ? (
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Ingreso de Propietario Físico (Urgencias / Sin Cuenta Web)</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre Completo"
                  value={propNombre}
                  onChange={e => setPropNombre(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="RUT / ID"
                  value={propRut}
                  onChange={e => setPropRut(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email (Opcional)"
                  value={propEmail}
                  onChange={e => setPropEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Teléfono"
                  value={propTelefono}
                  onChange={e => setPropTelefono(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={registrarPropietarioFisico}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
              >
                Guardar y Seleccionar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
              <input
                value={busquedaProp}
                onChange={e => {
                  setBusquedaProp(e.target.value);
                  if (selectedProp) handleSelectPropietario(null);
                }}
                placeholder="Escribe nombre o RUT del cliente..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />

              {busquedaProp && !selectedProp && (
                <div className="absolute z-20 left-0 right-0 border border-slate-100 rounded-xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-50 bg-white mt-1 shadow-md">
                  {propietariosFiltrados.length === 0 ? (
                    <p className="p-2 text-xs text-slate-400 text-center">No se encontraron clientes.</p>
                  ) : (
                    propietariosFiltrados.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleSelectPropietario(p)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                      >
                        <span className="font-bold text-slate-800">{p.nombre}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{p.rut}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PACIENTE / MASCOTA */}
        {showPaciente && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">{labelPaciente}</label>
            {!selectedProp ? (
              <select disabled className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-xs rounded-xl p-2.5 cursor-not-allowed">
                <option value="">Selecciona dueño primero...</option>
              </select>
            ) : mascotasDelPropietario.length === 0 ? (
              <div className="text-xs text-rose-500 font-medium pt-2 flex items-center gap-1">
                <span>Cliente sin mascotas registradas.</span>
              </div>
            ) : (
              <select
                value={selectedPac ? selectedPac.id : ""}
                onChange={e => handleSelectPaciente(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Mascota --</option>
                {mascotasDelPropietario.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.especie} · {m.raza})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {selectedProp && (
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-indigo-900 text-xs flex justify-between items-center">
          <div>
            <p><strong>Cliente Seleccionado:</strong> {selectedProp.nombre}</p>
            <p className="text-[10px] text-indigo-700">RUT: {selectedProp.rut} | Fono: {selectedProp.telefono}</p>
          </div>
          {selectedPac && (
            <div className="text-right border-l border-indigo-200 pl-4">
              <p><strong>Mascota:</strong> {selectedPac.nombre}</p>
              <p className="text-[10px] text-indigo-700 capitalize">Especie: {selectedPac.especie} · {selectedPac.raza}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
