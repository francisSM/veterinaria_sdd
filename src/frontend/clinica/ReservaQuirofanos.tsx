import React, { useState, useEffect, useCallback } from "react";
import { StateWrapper, UXState } from "../StateWrapper";
import { UserRole } from "../Layout";
import { ShieldAlert, CheckCircle, Scissors, Calendar, FileText, Plus, X, Printer, Check, Search, Grid } from "lucide-react";
import { BuscadorClientePaciente, Propietario, Paciente } from "../components/BuscadorClientePaciente";

const roundToNearestTen = (amount: any): number => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return 0;
  let rounded = Math.round(num);
  const residuo = rounded % 10;
  if (residuo >= 5) {
    return rounded + (10 - residuo);
  } else {
    return rounded - residuo;
  }
};

const formatCLP = (amount: any): string => {
  return roundToNearestTen(amount).toLocaleString('es-CL');
};

interface SCR04Props {
  currentRole: UserRole;
  token?: string;
  currentUser?: { id: number; nombre: string; email: string; rol: string } | null;
}
interface Veterinario { id: number; nombre: string; licenciaMedica: string; }
interface Consulta { id: number; motivo: string; fechaConsulta: string; }
interface Tarifa { id: number; nombre: string; categoria: string; tarifaBase: number; }

export const ReservaQuirofanos: React.FC<SCR04Props> = ({ currentRole, token, currentUser }) => {
  const [uxState, setUxState] = useState<UXState>("data");
  
  // Listas de la API
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);

  // Selección
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);
  
  // Lista de consultas del paciente seleccionado
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsultaId, setSelectedConsultaId] = useState("");
  const [loadingConsultas, setLoadingConsultas] = useState(false);

  // Formulario reserva
  const [cirujanoId, setCirujanoId] = useState("");
  const [salaId, setSalaId] = useState("101");
  const [fecha, setFecha] = useState("2026-07-02");
  const [bloque, setBloque] = useState("18:00");
  const [tipoCirugia, setTipoCirugia] = useState("mayor");
  
  // Selector de intervenciones / pre-servicios
  const [selectedTarifaId, setSelectedTarifaId] = useState("");
  const [intervencionManual, setIntervencionManual] = useState("");

  // Consentimiento
  const [consentimiento, setConsentimiento] = useState(false);
  const [consentimientosMascota, setConsentimientosMascota] = useState<any[]>([]);
  const [selectedConsentId, setSelectedConsentId] = useState("");

  // Modales
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [consentForPrint, setConsentForPrint] = useState<any | null>(null);

  // Catálogo Interactivo de Servicios de Quirófano
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [busquedaServicio, setBusquedaServicio] = useState("");
  const [catFiltro, setCatFiltro] = useState("Todos");

  // Formulario nuevo consentimiento inmediato
  const [justificacionConsentimiento, setJustificacionConsentimiento] = useState("");
  const [firmaOwner, setFirmaOwner] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cirugiasList, setCirugiasList] = useState<any[]>([]);

  // Simulación de reservas pesimistas en UI
  const [reservas, setReservas] = useState<Array<{ salaId: number; bloque: string }>>([
    { salaId: 101, bloque: "2026-07-02 16:00" },
  ]);

  const activeToken = token || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  const fetchCirugias = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/clinica/cirugias", { headers });
      if (r.ok) {
        const d = await r.json();
        setCirugiasList(d.cirugias || []);
      }
    } catch (e) {
      console.error("Error al obtener cirugías", e);
    }
  }, [activeToken]);

  const eliminarCirugia = async (id: number) => {
    if (!window.confirm("¿Está seguro que desea cancelar esta reserva de quirófano?")) return;
    try {
      setUxState("loading");
      const r = await fetch(`/api/v1/clinica/cirugias/${id}`, {
        method: "DELETE",
        headers
      });
      const d = await r.json();
      if (r.ok) {
        setSuccessMsg("Reserva de quirófano cancelada exitosamente.");
        fetchCirugias();
      } else {
        setErrorMsg(d.error || "Error al cancelar la reserva.");
      }
      setUxState("data");
    } catch (err: any) {
      setErrorMsg("Error de conexion: " + err.message);
      setUxState("data");
    }
  };

  // Cargar veterinarios, tarifas y reservas al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rVets, rTarifas] = await Promise.all([
          fetch("/api/v1/clinica/veterinarios", { headers }),
          fetch("/api/v1/clinica/tarifas", { headers })
        ]);

        if (rVets.ok) {
          const listVets = await rVets.json();
          setVets(listVets);
          if (listVets.length > 0 && currentRole === "veterinario") {
            const matchVet = listVets.find((v: any) => v.nombre.toLowerCase().includes(currentUser?.nombre?.toLowerCase() || ""));
            if (matchVet) setCirujanoId(String(matchVet.id));
            else setCirujanoId(String(listVets[0].id));
          } else if (listVets.length > 0) {
            setCirujanoId(String(listVets[0].id));
          }
        }

        if (rTarifas.ok) {
          setTarifas(await rTarifas.json());
        }

        await fetchCirugias();
      } catch (err) {
        console.error("Error fetching clinical data:", err);
      }
    };

    fetchData();
  }, [activeToken, fetchCirugias]);

  // Cargar consultas y consentimientos al cambiar paciente
  const handlePacienteSelected = async (prop: Propietario | null, pac: Paciente | null) => {
    setSelectedProp(prop);
    setSelectedPac(pac);
    setConsentimientosMascota([]);
    setSelectedConsentId("");
    setConsentimiento(false);

    if (!pac) {
      setConsultas([]);
      setSelectedConsultaId("");
      return;
    }

    setLoadingConsultas(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/v1/clinica/pacientes/${pac.id}/historial`, { headers });
      const data = await response.json();
      if (response.ok && data.consultas) {
        setConsultas(data.consultas);
      } else {
        setConsultas([]);
      }

      // Cargar consentimientos firmados para esta mascota
      const resConsents = await fetch("/api/v1/clinica/consentimientos", { headers });
      if (resConsents.ok) {
        const listConsents = await resConsents.json();
        const filtrados = listConsents.filter((c: any) => c.pacienteId === pac.id);
        setConsentimientosMascota(filtrados);
        if (filtrados.length > 0) {
          setSelectedConsentId(String(filtrados[0].id));
          setConsentimiento(true);
        }
      }
    } catch {
      setErrorMsg("Error al obtener datos asociados de la mascota.");
    } finally {
      setLoadingConsultas(false);
    }
  };

  // Cargar justificación por defecto al cambiar el procedimiento
  useEffect(() => {
    if (selectedPac) {
      const intervencionStr = getNombreIntervencion();
      setJustificacionConsentimiento(
        `Se requiere consentimiento informado para realizar el procedimiento de ${intervencionStr} (${tipoCirugia}) en el paciente de nombre ${selectedPac.nombre}. El propietario declara conocer los riesgos asociados a la anestesia y la intervencion quirurgica, autorizando a proceder.`
      );
    }
  }, [selectedTarifaId, intervencionManual, tipoCirugia, selectedPac?.id]);

  const getNombreIntervencion = () => {
    if (selectedTarifaId === "otro") {
      return intervencionManual.trim() || "Procedimiento Quirurgico Personalizado";
    }
    const tar = tarifas.find(t => t.id === Number(selectedTarifaId));
    return tar ? tar.nombre : "Procedimiento Quirurgico";
  };

  const allowedCategories = ["Cirugia", "Procedimientos"];
  const surgicalTarifas = tarifas.filter(t => allowedCategories.includes(t.categoria));

  const filteredTarifas = surgicalTarifas.filter(t => {
    const coincideBusqueda = t.nombre.toLowerCase().includes(busquedaServicio.toLowerCase()) || 
                             t.categoria.toLowerCase().includes(busquedaServicio.toLowerCase());
    const coincideCat = catFiltro === "Todos" || t.categoria === catFiltro;
    return coincideBusqueda && coincideCat;
  });

  const categoriasUnicas = Array.from(new Set(surgicalTarifas.map(t => t.categoria)));

  const seleccionarServicio = (id: string) => {
    setSelectedTarifaId(id);
    if (id !== "otro") {
      setIntervencionManual("");
    }
    setMostrarCatalogo(false);
    setBusquedaServicio("");
  };

  const handleFirmarConsentimientoInmediato = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedProp || !selectedPac) {
      setErrorMsg("Mascota y Propietario obligatorios.");
      return;
    }
    if (!firmaOwner.trim()) {
      setErrorMsg("Firma escrita obligatoria.");
      return;
    }
    if (!justificacionConsentimiento.trim()) {
      setErrorMsg("Detalle del procedimiento obligatorio.");
      return;
    }

    try {
      setUxState("loading");
      const res = await fetch("/api/v1/clinica/consentimientos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          propietarioId: selectedProp.id,
          pacienteId: selectedPac.id,
          tipo: tipoCirugia,
          detallesIntervencion: justificacionConsentimiento,
          firmaPropietario: firmaOwner
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al registrar el consentimiento.");
        setUxState("data");
        return;
      }

      // Consentimiento guardado, agregarlo y seleccionarlo
      const enrichedConsent = {
        ...data,
        propietarioNombre: selectedProp.nombre,
        propietarioRut: selectedProp.rut,
        pacienteNombre: selectedPac.nombre
      };

      setConsentimientosMascota(prev => [enrichedConsent, ...prev]);
      setSelectedConsentId(String(data.id));
      setConsentimiento(true);
      setShowSignModal(false);
      setFirmaOwner("");
      setSuccessMsg("Consentimiento firmado digitalmente con exito para esta intervencion.");
      setUxState("data");
    } catch (err: any) {
      setErrorMsg("Error al conectar: " + err.message);
      setUxState("data");
    }
  };

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");

    if (!selectedConsultaId) { setErrorMsg("El ID de la consulta asociada es obligatorio."); return; }
    if (!consentimiento || !selectedConsentId) { setErrorMsg("Debe verificar o firmar el consentimiento informado."); return; }

    const bloqueCompleto = `${fecha} ${bloque}`;
    const salaInt = parseInt(salaId);
    const nombreIntervencion = getNombreIntervencion();

    try {
      setUxState("loading");
      const response = await fetch("/api/v1/clinica/cirugias", {
        method: "POST", headers,
        body: JSON.stringify({
          consultaId: Number(selectedConsultaId),
          veterinarioId: Number(cirujanoId),
          tipoCirugia,
          intervencion: nombreIntervencion,
          quirofanoSalaId: salaInt,
          fechaHoraCirugia: bloqueCompleto,
          consentimientoFirmado: consentimiento,
          costoAdicional: 0 // Quirófano propio costo $0
        })
      });

      const data = await response.json();
      if (!response.ok) { setErrorMsg(data.error || "Error al realizar la reserva."); setUxState("data"); return; }

      await fetchCirugias();
      setSuccessMsg(`Quirofano reservado y bloqueado exitosamente para ${nombreIntervencion} el ${bloqueCompleto}. Expiracion del bloqueo temporal: 10 minutos.`);
      setUxState("data");

      // Limpiar selección
      setSelectedProp(null); setSelectedPac(null); setConsultas([]); setSelectedConsultaId("");
      setSelectedTarifaId(""); setIntervencionManual(""); setConsentimiento(false); setSelectedConsentId("");
    } catch (err: any) {
      setErrorMsg("Error de conexion: " + err.message); setUxState("data");
    }
  };

  const verConsentimientoParaImprimir = () => {
    const consent = consentimientosMascota.find(c => String(c.id) === selectedConsentId);
    if (!consent) return;

    setConsentForPrint(consent);
    setShowPrintModal(true);
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={["administrador", "veterinario"]} currentRole={currentRole}>
      <div className="space-y-6">
        
        {/* Estilo CSS de impresion limpia */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-consent-area, #printable-consent-area * {
              visibility: visible;
            }
            #printable-consent-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              color: black;
              padding: 24px;
              border: none;
              box-shadow: none;
            }
          }
        `}</style>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Reserva */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
                <Scissors className="h-5 w-5"/>
              </div>
              <h1 className="text-xl font-bold text-slate-800">Reserva de Quirofanos y Cirugias</h1>
            </div>
            <p className="text-slate-500 text-xs">Agendamiento quirurgico de pacientes. El uso de la instalacion de quirofano no conlleva costo adicional.</p>

            {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
            {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

            <form onSubmit={reservar} className="space-y-4">
              {/* BUSCADOR DE CLIENTE Y MASCOTA INTEGRADO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <BuscadorClientePaciente
                  token={activeToken}
                  onSelect={handlePacienteSelected}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SELECCIÓN DE CONSULTA */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Consulta Asociada</label>
                  {!selectedPac ? (
                    <select disabled className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-xs rounded-xl p-2.5 cursor-not-allowed">
                      <option value="">Selecciona mascota primero...</option>
                    </select>
                  ) : loadingConsultas ? (
                    <p className="text-xs text-slate-400 animate-pulse pt-2.5">Buscando...</p>
                  ) : consultas.length === 0 ? (
                    <p className="text-xs text-rose-500 font-medium pt-2">Sin consultas previas.</p>
                  ) : (
                    <select value={selectedConsultaId} onChange={e => setSelectedConsultaId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none">
                      <option value="">Seleccionar consulta...</option>
                      {consultas.map(c => (
                        <option key={c.id} value={c.id}>ID {c.id} · {c.motivo}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SELECCIÓN DE CIRUJANO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Cirujano</label>
                  <select value={cirujanoId} onChange={e => setCirujanoId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none">
                    {vets.map((v:Veterinario) => (
                      <option key={v.id} value={v.id}>{v.nombre} ({v.licenciaMedica})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SELECTORES DE PROCEDIMIENTO E INTERVENCIÓN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Categoria Quirurgica</label>
                  <select value={tipoCirugia} onChange={e => setTipoCirugia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none">
                    <option value="mayor">Mayor (Anestesia general, invasiva)</option>
                    <option value="menor">Menor (Suturas, castracion)</option>
                    <option value="emergencia">Emergencia (Accidente, torsion)</option>
                    <option value="estetica">Estetica (Limpieza dental avanzada)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Intervencion / Servicio</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMostrarCatalogo(true)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none text-left flex justify-between items-center cursor-pointer font-medium"
                    >
                      <span className="truncate">
                        {selectedTarifaId === "otro"
                          ? "Otro (especificar por escrito)"
                          : selectedTarifaId
                          ? tarifas.find(t => String(t.id) === selectedTarifaId)?.nombre || "-- Seleccionar Procedimiento --"
                          : "-- Seleccionar Procedimiento --"}
                      </span>
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    </button>
                    {selectedTarifaId && (
                      <button
                        type="button"
                        onClick={() => { setSelectedTarifaId(""); setIntervencionManual(""); }}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl px-3 py-2.5 transition-colors cursor-pointer flex items-center justify-center"
                        title="Limpiar selección"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* INPUT DE INTERVENCION MANUAL */}
              {selectedTarifaId === "otro" && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Detalle Intervencion Personalizada</label>
                  <input type="text" value={intervencionManual} onChange={e => setIntervencionManual(e.target.value)} placeholder="Ej: Esterilizacion de emergencia por piometra" required className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Quirofano / Sala</label>
                  <select value={salaId} onChange={e => setSalaId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none">
                    <option value="101">Sala Quirurgica A (Mayor)</option>
                    <option value="102">Sala Quirurgica B (Menor)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bloque Horario</label>
                    <select value={bloque} onChange={e => setBloque(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none">
                      <option value="09:00">09:00 - 11:00</option><option value="11:30">11:30 - 13:30</option><option value="14:00">14:00 - 16:00</option><option value="16:00">16:00 - 18:00</option><option value="18:00">18:00 - 20:00</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* INTEGRACION DE CONSENTIMIENTO */}
              {selectedPac && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Documento de Consentimiento</label>
                    
                    {consentimientosMascota.length === 0 ? (
                      <button type="button" onClick={() => setShowSignModal(true)} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                        Firmar Consentimiento en Linea
                      </button>
                    ) : (
                      <button type="button" onClick={() => setShowSignModal(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                        Firmar Otro Consentimiento
                      </button>
                    )}
                  </div>

                  {consentimientosMascota.length > 0 ? (
                    <div className="flex gap-2 items-center text-xs">
                      <select value={selectedConsentId} onChange={e => { setSelectedConsentId(e.target.value); setConsentimiento(true); }} className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2">
                        {consentimientosMascota.map(c => (
                          <option key={c.id} value={c.id}>ID #{c.id} · Procedimiento {c.tipo} ({new Date(c.fechaFirma).toLocaleDateString()})</option>
                        ))}
                      </select>
                      <button type="button" onClick={verConsentimientoParaImprimir} className="bg-slate-200 hover:bg-slate-350 p-2 rounded-xl text-slate-700 transition-colors cursor-pointer">
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-600 font-semibold p-1">
                      Este paciente no cuenta con ningun consentimiento firmado. Es obligatorio firmar uno para proceder con el bloqueo de quirofano.
                    </div>
                  )}

                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold select-none cursor-pointer">
                      <input type="checkbox" checked={consentimiento} onChange={e => setConsentimiento(e.target.checked)} disabled={consentimientosMascota.length === 0} className="accent-indigo-600 h-4 w-4 bg-white border border-slate-200 rounded disabled:opacity-50"/>
                      Consentimiento firmado verificado
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" disabled={!selectedConsultaId || !consentimiento} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
                Confirmar y Bloquear Quirofano
              </button>
            </form>
          </div>

          {/* Reservas Activas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Calendar className="h-4 w-4"/> Quirófanos Reservados
            </h3>
            <p className="text-slate-500 text-[10px]">Listado de quirófanos reservados y bloqueados (BR-10 desinfección incluida).</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {cirugiasList.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-6">
                  No hay reservas de quirófano programadas.
                </div>
              ) : (
                cirugiasList.map((c) => (
                  <div key={c.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Quirófano: Sala {c.quirofanoSalaId || c.salaId || 101}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.fechaHoraCirugia || (c.fechaCirugia ? new Date(c.fechaCirugia).toLocaleString() : "")}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded uppercase">
                        {c.tipoCirugia}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-550 border-t border-dashed border-slate-200/80 pt-2 space-y-1">
                      <div><strong>Paciente:</strong> {c.pacienteNombre}</div>
                      <div><strong>Propietario:</strong> {c.propietarioNombre}</div>
                      <div><strong>Cirujano:</strong> {c.veterinarioNombre}</div>
                      <div><strong>Intervención:</strong> {c.intervencion || "Sin especificar"}</div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => eliminarCirugia(c.id)}
                        className="text-[9px] font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100/60 rounded px-2 py-1 transition-colors cursor-pointer"
                      >
                        Cancelar Reserva
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL PARA FIRMAR CONSENTIMIENTO INMEDIATO */}
        {showSignModal && selectedProp && selectedPac && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
              
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Firma Inmediata de Consentimiento</span>
                <button type="button" onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleFirmarConsentimientoInmediato} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs space-y-1">
                  <p><strong>Paciente (Mascota):</strong> {selectedPac.nombre} ({selectedPac.especie})</p>
                  <p><strong>Propietario (Dueño):</strong> {selectedProp.nombre} (RUT: {selectedProp.rut})</p>
                  <p><strong>Procedimiento Quirurgico:</strong> {getNombreIntervencion()} ({tipoCirugia})</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Explicacion de Motivo e Intervencion</label>
                  <textarea rows={4} value={justificacionConsentimiento} onChange={e => setJustificacionConsentimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none resize-none" required/>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[10px] text-slate-600 leading-relaxed space-y-1">
                  <p className="font-bold text-slate-800 uppercase">Declaracion de Aceptacion de Riesgos:</p>
                  <p>
                    Por medio del presente documento, yo, el propietario responsable de la mascota individualizada, autorizo expresamente la realizacion de los procedimientos quirurgicos y la administracion de protocolos anestesicos necesarios. He sido informado de los riesgos clinicos inherentes a la operacion.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Firma Digital (Nombre Titular)</label>
                  <input type="text" value={firmaOwner} onChange={e => setFirmaOwner(e.target.value)} placeholder="Ej: Fabian Sanhueza" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none" required/>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowSignModal(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
                    Guardar y Confirmar Firma
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MODAL DE VISTA PREVIA E IMPRESION DE CONSENTIMIENTO */}
        {showPrintModal && consentForPrint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
              
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Documento Consentimiento Informado</span>
                <button type="button" onClick={() => { setShowPrintModal(false); setConsentForPrint(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                <div id="printable-consent-area" className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm space-y-6 text-slate-800 max-w-lg mx-auto text-xs">
                  
                  <div className="border-b-2 border-slate-800 pb-4 text-center">
                    <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900">Clinica Veterinaria VetGuard</h2>
                    <p className="text-[10px] text-slate-500">Documento de Consentimiento Medico Legal</p>
                  </div>

                  <div className="space-y-1">
                    <p><strong>Fecha de Firma:</strong> {new Date(consentForPrint.fechaFirma).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Codigo Registro:</strong> CONSENT-#{consentForPrint.id}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <p><strong>Propietario:</strong> {consentForPrint.propietarioNombre}</p>
                    <p><strong>RUT:</strong> {consentForPrint.propietarioRut}</p>
                    <p><strong>Paciente (Mascota):</strong> {consentForPrint.pacienteNombre}</p>
                  </div>

                  <div className="space-y-2 leading-relaxed">
                    <p className="font-bold text-slate-700">Declaracion Quirurgica y Motivo:</p>
                    <p className="text-justify bg-slate-50/50 p-2.5 rounded border border-slate-100">{consentForPrint.detallesIntervencion}</p>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                    <div className="max-w-[220px] text-[9px] text-slate-400 italic">
                      Este documento certifica legalmente la aprobacion firmada por parte del propietario tratante.
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-400 pb-1 px-4 font-mono font-bold text-slate-800">
                        {consentForPrint.firmaPropietario}
                      </div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold mt-1">Firma Propietario</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowPrintModal(false); setConsentForPrint(null); }} className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer">
                  Cerrar
                </button>
                <button type="button" onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
                  <Printer className="h-4 w-4" /> Imprimir Documento
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL DE CATÁLOGO DE SERVICIOS Y PROCEDIMIENTOS */}
        {mostrarCatalogo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full h-[90vh] sm:h-[80vh] shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
              
              {/* Encabezado */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Grid className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                    Catálogo de Procedimientos y Cirugías
                  </h3>
                </div>
                <button 
                  onClick={() => { setMostrarCatalogo(false); setBusquedaServicio(''); }} 
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={busquedaServicio}
                  onChange={e => setBusquedaServicio(e.target.value)}
                  placeholder="Buscar procedimiento por nombre o categoría..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-400 focus:outline-none focus:bg-white text-slate-700 font-medium"
                />
              </div>

              {/* Contenido con panel lateral */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                
                {/* Menu Lateral de Categorías */}
                <div className="w-1/4 pr-4 border-r border-slate-100 overflow-y-auto hidden sm:block">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
                    Categorías
                  </span>
                  
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setCatFiltro('Todos')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        catFiltro === 'Todos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'
                      }`}
                    >
                      Todos
                    </button>
                    {categoriasUnicas.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCatFiltro(cat)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                          catFiltro === cat ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Conceptos */}
                <div className="flex-1 pl-0 sm:pl-4 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                    {filteredTarifas.length === 0 && busquedaServicio && (
                      <div className="col-span-full py-16 text-center text-xs text-slate-400 italic">
                        No se encontraron procedimientos que coincidan con la búsqueda.
                      </div>
                    )}
                    
                    {/* Opción Manual "Otro" siempre visible */}
                    <button
                      type="button"
                      onClick={() => seleccionarServicio("otro")}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-dashed border-indigo-300 p-3 rounded-xl flex flex-col justify-between transition-all cursor-pointer shadow-3xs"
                    >
                      <div className="space-y-1 w-full">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-indigo-700 text-xs">
                            Otro Procedimiento
                          </span>
                          <span className="bg-indigo-100/60 text-indigo-800 border border-indigo-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                            Manual
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-relaxed">
                          Escribir manualmente el nombre de la intervención si no está listada en las tarifas oficiales.
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2 w-full text-[10px]">
                        <span className="text-slate-455 font-semibold">Intervención Personalizada</span>
                        <span className="text-xs font-black text-indigo-650 font-mono">
                          Costo Quirófano: $0
                        </span>
                      </div>
                    </button>

                    {filteredTarifas.map(t => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => seleccionarServicio(String(t.id))}
                        className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-xl flex flex-col justify-between transition-all hover:border-indigo-300 cursor-pointer shadow-3xs"
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-800 text-xs">
                              {t.nombre}
                            </span>
                            <span className="bg-indigo-100/60 text-indigo-800 border border-indigo-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                              {t.categoria}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 leading-relaxed truncate">
                            Procedimiento veterinario oficial.
                          </p>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2 w-full text-[10px]">
                          <span className="text-slate-400 font-semibold">Tarifa Base Oficial</span>
                          <span className="text-xs font-black text-indigo-650 font-mono">
                            ${formatCLP(t.tarifaBase)} CLP
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </StateWrapper>
  );
};