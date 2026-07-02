import React, { useState, useEffect, useCallback } from "react";
import { StateWrapper, UXState } from "../StateWrapper";
import { UserRole } from "../Layout";
import { AlertCircle, UserPlus, Heart, RefreshCw, Search, Plus, User } from "lucide-react";

interface SCR03Props {
  currentRole: UserRole;
  currentUser?: { id: number; nombre: string; email: string; rol: UserRole } | null;
  token?: string;
}

interface Propietario { id: number; nombre: string; rut: string; email: string; telefono: string; }
interface Paciente {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  edadMeses?: number | null;
  pesoKg: number;
  propietarioId: number;
  fechaNacimiento?: string | null;
  fechaNacimientoTipo?: "estimada" | "precisa" | null;
  sexo?: string | null;
  chipNumero?: string | null;
  colorMarcas?: string | null;
  alergias?: string | null;
  notas?: string | null;
}

export const FichaMascota: React.FC<SCR03Props> = ({ currentRole, currentUser, token }) => {
  const isCliente = currentRole === "cliente";
  const isStaff = currentRole === "administrador" || currentRole === "veterinario";

  const [uxState, setUxState] = useState<UXState>("data");
  
  // Listas generales (Staff)
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busquedaPropietario, setBusquedaPropietario] = useState("");

  // Selecciones activas
  const [selectedPropietario, setSelectedPropietario] = useState<Propietario | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Formulario nueva mascota
  const [nombreMascota, setNombreMascota] = useState("");
  const [especieMascota, setEspecieMascota] = useState("canino");
  const [razaMascota, setRazaMascota] = useState("");
  const [fechaNacimientoMascota, setFechaNacimientoMascota] = useState("");
  const [fechaNacimientoTipoMascota, setFechaNacimientoTipoMascota] = useState<"estimada" | "precisa">("precisa");
  const [pesoMascota, setPesoMascota] = useState(10);
  const [sexoMascota, setSexoMascota] = useState("macho");
  const [chipMascota, setChipMascota] = useState("");
  const [colorMascota, setColorMascota] = useState("");
  const [alergiasMascota, setAlergiasMascota] = useState("");
  const [notasMascota, setNotasMascota] = useState("");
  const [registrando, setRegistrando] = useState(false);

  // Formulario nuevo propietario (registro físico en mesón)
  const [registrandoPropietario, setRegistrandoPropietario] = useState(false);
  const [propNombre, setPropNombre] = useState("");
  const [propRut, setPropRut] = useState("");
  const [propEmail, setPropEmail] = useState("");
  const [propTelefono, setPropTelefono] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeToken = token || localStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  // Cargar datos según rol
  const cargarDatos = useCallback(async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (isCliente) {
        // Cargar perfil del cliente logueado
        const r = await fetch("/api/v1/clinica/propietario/perfil", { headers });
        const d = await r.json();
        if (r.ok) {
          setSelectedPropietario(d.propietario);
          setPacientes(d.pacientes || []);
          if (d.pacientes && d.pacientes.length > 0) {
            setSelectedPaciente(d.pacientes[0]);
          }
        } else {
          setErrorMsg(d.error || "No se pudo cargar el perfil del propietario.");
        }
      } else {
        // Staff: Cargar todos los propietarios y todos los pacientes
        const [rProp, rPac] = await Promise.all([
          fetch("/api/v1/clinica/propietarios", { headers }),
          fetch("/api/v1/clinica/pacientes", { headers })
        ]);
        const dProp = await rProp.json();
        const dPac = await rPac.json();

        if (rProp.ok && rPac.ok) {
          setPropietarios(dProp || []);
          setPacientes(dPac || []);
          
          // Si ya había una selección activa, refrescar sus datos
          if (selectedPropietario) {
            const updatedProp = dProp.find((p: Propietario) => p.id === selectedPropietario.id);
            if (updatedProp) setSelectedPropietario(updatedProp);
          }
          if (selectedPaciente) {
            const updatedPac = dPac.find((p: Paciente) => p.id === selectedPaciente.id);
            if (updatedPac) setSelectedPaciente(updatedPac);
          }
        } else {
          setErrorMsg("Error al obtener listado de propietarios o pacientes.");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de red al conectar con el servidor.");
    }
  }, [activeToken, isCliente, selectedPropietario?.id, selectedPaciente?.id]);

  useEffect(() => { cargarDatos(); }, []);

  const registrarPropietarioMeson = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!propNombre || !propRut || !propEmail || !propTelefono) {
      setErrorMsg("Todos los campos del cliente son obligatorios.");
      return;
    }

    try {
      setUxState("loading");
      const r = await fetch("/api/v1/clinica/propietarios", {
        method: "POST",
        headers,
        body: JSON.stringify({
          nombre: propNombre,
          rut: propRut,
          email: propEmail,
          telefono: propTelefono
        })
      });

      const d = await r.json();
      if (!r.ok) {
        setErrorMsg(d.error || "Error al registrar cliente.");
        setUxState("data");
        return;
      }

      setSuccessMsg(`Cliente '${propNombre}' registrado físicamente con éxito.`);
      setPropNombre(""); setPropRut(""); setPropEmail(""); setPropTelefono("");
      setRegistrandoPropietario(false);
      setUxState("data");

      // Recargar datos y seleccionar el nuevo propietario
      await cargarDatos();
      setSelectedPropietario(d);
      setSelectedPaciente(null);
    } catch (err: any) {
      setErrorMsg("Error de conexión: " + err.message);
      setUxState("data");
    }
  };

  const calculateAgeInMonths = (birthDateStr: string): number => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr + "T12:00:00");
    if (isNaN(birth.getTime())) return 0;
    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += now.getMonth();
    return months <= 0 ? 0 : months;
  };

  const registrarMascota = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (!nombreMascota || !razaMascota || !selectedPropietario || !fechaNacimientoMascota) {
      setErrorMsg("Completa los campos obligatorios (nombre, raza, fecha de nacimiento).");
      return;
    }

    try {
      setUxState("loading");
      const calculatedMonths = calculateAgeInMonths(fechaNacimientoMascota);
      const r = await fetch("/api/v1/clinica/pacientes", {
        method: "POST", headers,
        body: JSON.stringify({
          nombre: nombreMascota,
          especie: especieMascota,
          raza: razaMascota,
          edadMeses: calculatedMonths,
          pesoKg: pesoMascota,
          propietarioId: selectedPropietario.id,
          fechaNacimiento: fechaNacimientoMascota,
          fechaNacimientoTipo: fechaNacimientoTipoMascota,
          sexo: sexoMascota,
          chipNumero: chipMascota,
          colorMarcas: colorMascota,
          alergias: alergiasMascota,
          notas: notasMascota
        })
      });
      const d = await r.json();
      if (!r.ok) { setErrorMsg(d.error || "Error al registrar mascota"); setUxState("data"); return; }
      
      setSuccessMsg(`Mascota '${nombreMascota}' registrada con éxito.`);
      setNombreMascota("");
      setRazaMascota("");
      setFechaNacimientoMascota("");
      setFechaNacimientoTipoMascota("precisa");
      setSexoMascota("macho");
      setChipMascota("");
      setColorMascota("");
      setAlergiasMascota("");
      setNotasMascota("");
      setRegistrando(false);
      setUxState("data");
      
      // Recargar y seleccionar la nueva mascota
      await cargarDatos();
      if (d) setSelectedPaciente(d);
    } catch (err: any) {
      setErrorMsg("Error de conexión: " + err.message); setUxState("data");
    }
  };

  // Filtrar propietarios por búsqueda (Staff)
  const propietariosFiltrados = propietarios.filter(p =>
    p.nombre.toLowerCase().includes(busquedaPropietario.toLowerCase()) ||
    p.rut.toLowerCase().includes(busquedaPropietario.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(busquedaPropietario.toLowerCase())
  );

  // Filtrar pacientes del propietario seleccionado
  const mascotasDelPropietario = selectedPropietario
    ? pacientes.filter(p => p.propietarioId === selectedPropietario.id)
    : [];

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={["administrador", "veterinario", "cliente"]} currentRole={currentRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Ficha Clinica Integral del Paciente</h1>
            <p className="text-slate-500 text-xs mt-0.5">Resumen completo de la mascota, propietario e historial clinico registrado en el backend.</p>
          </div>
          <button onClick={cargarDatos} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg cursor-pointer" title="Refrescar datos">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2 max-w-2xl"><AlertCircle className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2 max-w-2xl"><Heart className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        {/* BÚSQUEDA DE CLIENTE O REGISTRO FISICO DE CLIENTE (Solo para el Staff) */}
        {isStaff && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seleccionar Propietario / Cliente</h3>
              <button onClick={() => setRegistrandoPropietario(!registrandoPropietario)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                <UserPlus className="h-3.5 w-3.5"/> {registrandoPropietario ? "Cancelar Registro" : "Registrar Nuevo Cliente"}
              </button>
            </div>

            {registrandoPropietario ? (
              <form onSubmit={registrarPropietarioMeson} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs max-w-2xl">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Registrar Cliente Físico en Clínicas (Sin Cuenta Web Inicial)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nombre Completo</label>
                    <input type="text" required value={propNombre} onChange={e => setPropNombre(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">RUT / Identificación</label>
                    <input type="text" required value={propRut} onChange={e => setPropRut(e.target.value)} placeholder="Ej: 12345678-9" className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Email de Notificación</label>
                    <input type="email" required value={propEmail} onChange={e => setPropEmail(e.target.value)} placeholder="correo@ejemplo.com" className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Teléfono de Contacto</label>
                    <input type="tel" required value={propTelefono} onChange={e => setPropTelefono(e.target.value)} placeholder="Ej: 988887766" className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
                  Guardar Propietario en Clínicas
                </button>
              </form>
            ) : (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
                  <input value={busquedaPropietario} onChange={e => setBusquedaPropietario(e.target.value)} placeholder="Buscar por Nombre, RUT o Email..." className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-indigo-400 focus:outline-none"/>
                </div>
              </div>
            )}
            
            {busquedaPropietario && !registrandoPropietario && (
              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-slate-50">
                {propietariosFiltrados.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">No se encontraron clientes.</p>
                ) : (
                  propietariosFiltrados.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPropietario(p); setSelectedPaciente(null); setBusquedaPropietario(""); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 flex justify-between items-center transition-colors cursor-pointer">
                      <span className="font-bold text-slate-800">{p.nombre}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{p.rut} · {p.email}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Lateral: Mascotas del Propietario seleccionado */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mascotas Asociadas</h3>
              {selectedPropietario && (isStaff || isCliente) && !registrando && (
                <button onClick={() => setRegistrando(true)} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                  <Plus className="h-3 w-3"/> Agregar
                </button>
              )}
            </div>

            {registrando && selectedPropietario ? (
              <form onSubmit={registrarMascota} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nombre de Mascota</label>
                  <input type="text" required value={nombreMascota} onChange={e => setNombreMascota(e.target.value)} placeholder="Ej: Rocky" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Especie</label>
                    <select value={especieMascota} onChange={e => setEspecieMascota(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none">
                      <option value="canino">Canino</option><option value="felino">Felino</option><option value="exotico">Exotico</option><option value="equino">Equino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Raza</label>
                    <input type="text" required value={razaMascota} onChange={e => setRazaMascota(e.target.value)} placeholder="Ej: Pug" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Fecha de Nacimiento</label>
                    <input type="date" required value={fechaNacimientoMascota} onChange={e => setFechaNacimientoMascota(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Precisión de Fecha</label>
                    <select value={fechaNacimientoTipoMascota} onChange={e => setFechaNacimientoTipoMascota(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none">
                      <option value="precisa">Fecha Precisa</option>
                      <option value="estimada">Fecha Estimada</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Sexo</label>
                    <select value={sexoMascota} onChange={e => setSexoMascota(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none">
                      <option value="macho">Macho</option>
                      <option value="hembra">Hembra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Peso (Kg)</label>
                    <input type="number" required value={pesoMascota} onChange={e => setPesoMascota(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">N° Chip / Identificación (Opcional)</label>
                  <input type="text" value={chipMascota} onChange={e => setChipMascota(e.target.value)} placeholder="Ej: 900110001234567" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Color y Señas Particulares (Opcional)</label>
                  <input type="text" value={colorMascota} onChange={e => setColorMascota(e.target.value)} placeholder="Ej: Negro con manchas blancas en el pecho" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Alergias o Contraindicaciones (Opcional)</label>
                  <input type="text" value={alergiasMascota} onChange={e => setAlergiasMascota(e.target.value)} placeholder="Ej: Alérgico a la Penicilina" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Observaciones Clínicas (Opcional)</label>
                  <textarea value={notasMascota} onChange={e => setNotasMascota(e.target.value)} placeholder="Notas internas sobre comportamiento, dieta especial, etc." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:border-indigo-500 focus:outline-none h-16 resize-none"/>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer">Guardar Mascota</button>
                  <button type="button" onClick={() => setRegistrando(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer">Cancelar</button>
                </div>
              </form>
            ) : !selectedPropietario ? (
              <p className="text-xs text-slate-400 text-center py-4">Selecciona un cliente para ver sus mascotas.</p>
            ) : mascotasDelPropietario.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Este cliente no posee mascotas registradas.</p>
            ) : (
              <div className="space-y-2">
                {mascotasDelPropietario.map(m => (
                  <button key={m.id} onClick={() => setSelectedPaciente(m)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer hover:border-slate-300 ${selectedPaciente?.id === m.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${selectedPaciente?.id === m.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{m.nombre[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{m.nombre}</div>
                      <div className="text-[10px] text-slate-500 capitalize truncate">{m.especie} · {m.raza}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta de Mascota Activa y Propietario */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPaciente ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detalles de Mascota */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <Heart className="h-5 w-5"/>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">{selectedPaciente.nombre}</h2>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedPaciente.especie} · {selectedPaciente.raza}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fecha Nacimiento</span>
                      <span className="font-semibold flex items-center gap-1.5">
                        {selectedPaciente.fechaNacimiento ? (
                          <>
                            <span>{new Date(selectedPaciente.fechaNacimiento + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}</span>
                            <span className={`text-[8px] font-bold px-1 rounded uppercase ${selectedPaciente.fechaNacimientoTipo === "precisa" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                              {selectedPaciente.fechaNacimientoTipo}
                            </span>
                          </>
                        ) : (
                          "No registrada"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Edad Estimada</span>
                      <span className="font-semibold">
                        {selectedPaciente.fechaNacimiento ? (
                          (() => {
                            const months = calculateAgeInMonths(selectedPaciente.fechaNacimiento);
                            const years = Math.floor(months / 12);
                            const remMonths = months % 12;
                            return `${years} años, ${remMonths} meses`;
                          })()
                        ) : (
                          selectedPaciente.edadMeses ? `${selectedPaciente.edadMeses} meses (${Math.floor(selectedPaciente.edadMeses/12)} años)` : "No especificado"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-400">Sexo</span><span className="font-semibold capitalize">{selectedPaciente.sexo || "No especificado"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">N° de Chip</span><span className="font-mono font-semibold">{selectedPaciente.chipNumero || "Sin microchip"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Color y Señas</span><span className="font-semibold text-slate-700 truncate max-w-[120px]" title={selectedPaciente.colorMarcas || ""}>{selectedPaciente.colorMarcas || "No especificados"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Peso</span><span className="font-semibold">{selectedPaciente.pesoKg} kg</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">ID Mascota</span><span className="font-mono font-bold text-indigo-600">{selectedPaciente.id}</span></div>
                    
                    {selectedPaciente.alergias && (
                      <div className="bg-rose-50 border border-rose-100/60 p-2 rounded-lg text-rose-700 font-bold mt-2 text-[10px]">
                        ⚠️ Alergias: {selectedPaciente.alergias}
                      </div>
                    )}
                    {selectedPaciente.notas && (
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-600 italic mt-2 text-[10px]">
                        Obs: {selectedPaciente.notas}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles del Dueño */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Información del Propietario</h3>
                  <div className="space-y-2 text-xs">
                    <div><span className="text-[9px] text-slate-400 block font-bold uppercase mb-0.5">Nombre</span><span className="font-bold text-slate-800">{selectedPropietario?.nombre}</span></div>
                    <div><span className="text-[9px] text-slate-400 block font-bold uppercase mb-0.5">RUT / Email</span><span className="text-slate-600">{selectedPropietario?.rut} · {selectedPropietario?.email}</span></div>
                    <div><span className="text-[9px] text-slate-400 block font-bold uppercase mb-0.5">Contacto</span><span className="text-slate-600">{selectedPropietario?.telefono}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-10">
                <User className="h-8 w-8 text-slate-300 mx-auto mb-2"/>
                <p className="text-xs text-slate-500">Selecciona una mascota del listado para ver su ficha clinica completa o agrega un nuevo paciente.</p>
              </div>
            )}

            {/* Historial Clínico de Consultas */}
            {selectedPaciente && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Historial Clinico (Consultas y Diagnosticos en Vivo)</h3>
                <HistorialClinicoSeccion pacienteId={selectedPaciente.id} token={activeToken} />
              </div>
            )}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};

const formatCLP = (amount: number): string => {
  let rounded = Math.round(amount);
  const residuo = rounded % 10;
  if (residuo >= 5) {
    rounded = rounded + (10 - residuo);
  } else {
    rounded = rounded - residuo;
  }
  return rounded.toLocaleString('es-CL');
};

interface EventoHistorial {
  id: string;
  tipo: "consulta" | "triaje" | "cirugia" | "hospitalizacion";
  fecha: Date;
  data: any;
}

const HistorialClinicoSeccion: React.FC<{ pacienteId: number, token: string }> = ({ pacienteId, token }) => {
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistorial = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/clinica/pacientes/${pacienteId}/historial`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const list: EventoHistorial[] = [];
          
          if (data.consultas) {
            data.consultas.forEach((c: any) => {
              list.push({
                id: `consulta-${c.id}`,
                tipo: "consulta",
                fecha: new Date(c.fechaConsulta),
                data: c
              });
            });
          }

          if (data.triajes) {
            data.triajes.forEach((t: any) => {
              list.push({
                id: `triaje-${t.id}`,
                tipo: "triaje",
                fecha: new Date(t.fechaRegistro || t.fechaCreacion || Date.now()),
                data: t
              });
            });
          }

          if (data.cirugias) {
            data.cirugias.forEach((cir: any) => {
              list.push({
                id: `cirugia-${cir.id}`,
                tipo: "cirugia",
                fecha: new Date(cir.fechaCirugia || cir.fechaHoraCirugia),
                data: cir
              });
            });
          }

          if (data.hospitalizaciones) {
            data.hospitalizaciones.forEach((h: any) => {
              list.push({
                id: `hosp-${h.id}`,
                tipo: "hospitalizacion",
                fecha: new Date(h.fechaIngreso),
                data: h
              });
            });
          }

          list.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
          setEventos(list);
        }
      } catch (err) {
        console.error("Error al cargar historial:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [pacienteId, token]);

  if (loading) return <div className="text-slate-400 text-xs py-4 text-center">Cargando historial clinico...</div>;
  if (eventos.length === 0) return <div className="text-center py-6 text-slate-400 text-xs">No se registran consultas ni procedimientos en el historial clinico de este paciente.</div>;

  return (
    <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
      {eventos.map((e) => {
        let title = "";
        let colorClasses = "";
        let details = null;

        switch (e.tipo) {
          case "consulta":
            title = "Consulta Clinica Externa";
            colorClasses = "border-emerald-500 text-emerald-600 bg-emerald-50";
            details = (
              <div className="space-y-1 mt-1 text-slate-600">
                <p><strong>Motivo:</strong> {e.data.motivo}</p>
                <p><strong>Diagnostico:</strong> {e.data.diagnostico || "Sin diagnostico registrado"}</p>
                <p className="text-[10px] text-slate-500">Costo Base: ${formatCLP(e.data.costoBase)} CLP · Vet ID: {e.data.veterinarioId}</p>
              </div>
            );
            break;
          case "triaje":
            title = "Control de Constantes y Triaje";
            colorClasses = "border-amber-500 text-amber-600 bg-amber-50";
            const urgenciaColorMap: Record<string, string> = {
              rojo: "bg-red-500/10 text-red-600 border border-red-500/20",
              naranja: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
              amarillo: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
              verde: "bg-green-500/10 text-green-600 border border-green-500/20",
              azul: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
            };
            details = (
              <div className="space-y-1 mt-1 text-slate-600">
                <div className="flex gap-2 items-center">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${urgenciaColorMap[e.data.nivelUrgencia] || 'bg-slate-100'}`}>
                    Urgencia: {e.data.nivelUrgencia}
                  </span>
                  <span className="text-[10px] text-slate-500">Vet ID: {e.data.veterinarioId}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-500">
                  <div>T°: <strong>{e.data.temperaturaC} °C</strong></div>
                  <div>F.C.: <strong>{e.data.frecuenciaCardiaca} lpm</strong></div>
                  <div>F.R.: <strong>{e.data.frecuenciaRespiratoria} rpm</strong></div>
                  <div>Dolor: <strong>{e.data.escalaDolor}/10</strong></div>
                </div>
              </div>
            );
            break;
          case "cirugia":
            title = "Reserva Quirurgica / Operacion";
            colorClasses = "border-rose-500 text-rose-600 bg-rose-50";
            details = (
              <div className="space-y-1 mt-1 text-slate-600">
                <p><strong>Cirugia:</strong> {e.data.tipoCirugia} · Sala: {e.data.quirofanoSalaId || e.data.salaId || '101'}</p>
                <div className="flex gap-2 items-center">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${e.data.consentimientoFirmado ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                    {e.data.consentimientoFirmado ? 'Consentimiento Firmado' : 'Sin Consentimiento'}
                  </span>
                  <span className="text-[10px] text-slate-500">Cirujano ID: {e.data.veterinarioId}</span>
                </div>
              </div>
            );
            break;
          case "hospitalizacion":
            title = "Ingreso a Hospitalizacion / Aforo";
            colorClasses = "border-blue-500 text-blue-600 bg-blue-50";
            details = (
              <div className="space-y-2 mt-1 text-slate-600">
                <div className="flex justify-between text-xs">
                  <span><strong>Sala/Canil:</strong> Sala {e.data.salaId}</span>
                  <span className="font-semibold text-blue-600 uppercase text-[10px]">Estado: {e.data.estado}</span>
                </div>
                {e.data.fechaAlta && (
                  <p className="text-[11px] text-slate-500"><strong>Alta:</strong> {new Date(e.data.fechaAlta).toLocaleDateString('es-CL')}</p>
                )}
                {e.data.signos && e.data.signos.length > 0 && (
                  <div className="border-t border-slate-100 pt-1.5 mt-1.5 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signos Vitales Tomados en Sala:</p>
                    <div className="space-y-1 pl-2 border-l border-slate-200">
                      {e.data.signos.map((s: any) => (
                        <div key={s.id} className="text-[10px] text-slate-500">
                          {new Date(s.fechaRegistro).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })} · SatO2: <strong>{s.saturacionOxigeno}%</strong> · P.A: <strong>{s.presionArterialSistolica}/{s.presionArterialDiastolica} mmHg</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
            break;
        }

        return (
          <div key={e.id} className="relative space-y-1 border border-slate-100 p-4 rounded-xl hover:bg-slate-50/50 transition-colors bg-white">
            <span className={`absolute -left-[35px] top-4 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${colorClasses}`}>
              {e.tipo[0].toUpperCase()}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                {e.fecha.toLocaleDateString("es-CL", { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                {e.tipo}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800">{title}</h4>
            {details}
          </div>
        );
      })}
    </div>
  );
};