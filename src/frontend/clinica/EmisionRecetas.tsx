import React, { useState, useEffect } from "react";
import { StateWrapper, UXState } from "../StateWrapper";
import { UserRole } from "../Layout";
import { ShieldAlert, CheckCircle, FileText, Trash2, Printer, X, Eye, Plus } from "lucide-react";
import { BuscadorClientePaciente, Propietario, Paciente } from "../components/BuscadorClientePaciente";

interface SCR07Props { currentRole: UserRole; token?: string; }
interface Consulta { id: number; motivo: string; fechaConsulta: string; }
interface Lote { id: number; codigoLote: string; cantidadActual: number; fechaVencimiento: string; }
interface Medicamento { id: number; nombreComercial: string; principioActivo: string; stockTotal: number; lotes: Lote[]; }

interface PrescripcionItem {
  idTemp: string;
  medicamentoId: number;
  nombreComercial: string;
  principioActivo: string;
  dosis: string;
  duracionDias: number;
}

export const EmisionRecetas: React.FC<SCR07Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>("data");
  
  // Listas de la API
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [recetasHistoricas, setRecetasHistoricas] = useState<any[]>([]);

  // Selección
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  // Lista de consultas del paciente seleccionado
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedConsultaId, setSelectedConsultaId] = useState("");
  const [loadingConsultas, setLoadingConsultas] = useState(false);

  // Formulario item receta (medicamento a agregar)
  const [selectedMedId, setSelectedMedId] = useState("");
  const [dosis, setDosis] = useState("");
  const [duracion, setDuracion] = useState(7);
  const [firma, setFirma] = useState("");

  // Lista de items en la receta actual
  const [items, setItems] = useState<PrescripcionItem[]>([]);

  // Modal de impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [recipeForPrint, setRecipeForPrint] = useState<any | null>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeToken = token || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  // Cargar medicamentos y recetas históricas al montar
  useEffect(() => {
    fetchMedStock();
    fetchHistorialRecetas();
  }, []);

  const fetchMedStock = async () => {
    try {
      const response = await fetch("/api/v1/inventario/medicamentos/stock", { headers });
      if (response.ok) {
        setMedicamentos(await response.json());
      }
    } catch (err) {
      console.error("Error al cargar medicamentos:", err);
    }
  };

  const fetchHistorialRecetas = async () => {
    try {
      const response = await fetch("/api/v1/inventario/recetas", { headers });
      if (response.ok) {
        setRecetasHistoricas(await response.json());
      }
    } catch (err) {
      console.error("Error al cargar historial de recetas:", err);
    }
  };

  // Cargar consultas al cambiar paciente
  const handlePacienteSelected = async (prop: Propietario | null, pac: Paciente | null) => {
    setSelectedProp(prop);
    setSelectedPac(pac);
    setItems([]);
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
    } catch {
      setErrorMsg("Error al obtener consultas asociadas.");
    } finally {
      setLoadingConsultas(false);
    }
  };

  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedMedId) {
      setErrorMsg("Debe seleccionar un medicamento.");
      return;
    }
    if (!dosis.trim() || dosis.trim().length < 2) {
      setErrorMsg("Error CH-35: La dosis debe tener al menos 2 caracteres.");
      return;
    }
    if (!duracion || duracion < 1 || duracion > 365) {
      setErrorMsg("Error CH-43/44: La duracion de la receta debe estar entre 1 y 365 dias.");
      return;
    }

    const med = medicamentos.find(m => m.id === Number(selectedMedId));
    if (!med) return;

    // Verificar si ya existe este medicamento en la lista temporal
    if (items.some(item => item.medicamentoId === med.id)) {
      setErrorMsg("Este medicamento ya ha sido agregado a la receta.");
      return;
    }

    const newItem: PrescripcionItem = {
      idTemp: Math.random().toString(36).substring(2, 9),
      medicamentoId: med.id,
      nombreComercial: med.nombreComercial,
      principioActivo: med.principioActivo,
      dosis: dosis.trim(),
      duracionDias: Number(duracion)
    };

    setItems(prev => [...prev, newItem]);
    // Limpiar campos de medicamento
    setSelectedMedId("");
    setDosis("");
    setDuracion(7);
  };

  const handleRemoveItem = (idTemp: string) => {
    setItems(prev => prev.filter(item => item.idTemp !== idTemp));
  };

  const emitirReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedConsultaId) {
      setErrorMsg("Debe seleccionar una consulta asociada.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Debe agregar al menos un medicamento a la receta.");
      return;
    }
    if (!firma.trim()) {
      setErrorMsg("Debe ingresar la firma digital del veterinario.");
      return;
    }

    try {
      setUxState('loading');
      const idsCreados: number[] = [];

      for (const item of items) {
        const response = await fetch('/api/v1/inventario/recetas', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consultaId: Number(selectedConsultaId),
            medicamentoId: Number(item.medicamentoId),
            dosis: item.dosis,
            duracionDias: Number(item.duracionDias),
            firmaVeterinario: firma
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Error al emitir el medicamento ${item.nombreComercial}`);
        }
        idsCreados.push(data.id);
      }

      setSuccessMsg(`Receta emitida con exito (${items.length} medicamentos registrados).`);
      setUxState('data');

      // Preparar detalles para el modal de impresion
      const patientName = selectedPac ? selectedPac.nombre : '';
      const patientEspecie = selectedPac ? selectedPac.especie : '';
      const ownerName = selectedProp ? selectedProp.nombre : '';
      const ownerRut = selectedProp ? selectedProp.rut : '';
      const consultInfo = consultas.find(c => c.id === Number(selectedConsultaId));

      const recipeDetails = {
        consultaId: Number(selectedConsultaId),
        fechaEmision: new Date().toISOString(),
        firmaVeterinario: firma,
        pacienteNombre: patientName,
        pacienteEspecie: patientEspecie,
        propietarioNombre: ownerName,
        propietarioRut: ownerRut,
        motivoConsulta: consultInfo ? consultInfo.motivo : '',
        items: items.map((item, index) => ({
          id: idsCreados[index],
          medicamentoNombre: item.nombreComercial,
          medicamentoPrincipioActivo: item.principioActivo,
          dosis: item.dosis,
          duracionDias: item.duracionDias
        }))
      };

      setRecipeForPrint(recipeDetails);
      setShowPrintModal(true);

      // Limpiar selección de emisión
      setItems([]);
      setSelectedProp(null);
      setSelectedPac(null);
      setConsultas([]);
      setSelectedConsultaId("");
      setDosis("");
      setFirma("");
      setDuracion(7);
      setSelectedMedId("");

      // Refrescar historial
      fetchHistorialRecetas();
    } catch (err: any) {
      setErrorMsg("Error al emitir receta: " + err.message);
      setUxState('data');
    }
  };

  // Agrupar recetas historicas por consultaId
  const recetasAgrupadas = React.useMemo(() => {
    const groups: { [key: number]: any } = {};
    recetasHistoricas.forEach(r => {
      if (!groups[r.consultaId]) {
        groups[r.consultaId] = {
          consultaId: r.consultaId,
          fechaEmision: r.fechaEmision,
          firmaVeterinario: r.firmaVeterinario,
          pacienteNombre: r.pacienteNombre,
          pacienteEspecie: r.pacienteEspecie,
          propietarioNombre: r.propietarioNombre,
          propietarioRut: r.propietarioRut,
          estado: r.estado,
          items: []
        };
      }
      groups[r.consultaId].items.push({
        id: r.id,
        medicamentoId: r.medicamentoId,
        medicamentoNombre: r.medicamentoNombre,
        medicamentoPrincipioActivo: r.medicamentoPrincipioActivo,
        dosis: r.dosis,
        duracionDias: r.duracionDias,
        estado: r.estado
      });
    });

    // Ordenar de más reciente a más antigua
    return Object.values(groups).sort((a: any, b: any) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());
  }, [recetasHistoricas]);

  const handlePrintRecipe = () => {
    window.print();
  };

  const handleShowHistoricalPrint = (recetaAgrupada: any) => {
    setRecipeForPrint({
      consultaId: recetaAgrupada.consultaId,
      fechaEmision: recetaAgrupada.fechaEmision,
      firmaVeterinario: recetaAgrupada.firmaVeterinario,
      pacienteNombre: recetaAgrupada.pacienteNombre,
      pacienteEspecie: recetaAgrupada.pacienteEspecie,
      propietarioNombre: recetaAgrupada.propietarioNombre,
      propietarioRut: recetaAgrupada.propietarioRut,
      motivoConsulta: '',
      items: recetaAgrupada.items
    });
    setShowPrintModal(true);
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={["administrador", "veterinario"]} currentRole={currentRole}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Estilo CSS especifico para impresion limpia sin elementos de UI */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-recipe-area, #printable-recipe-area * {
              visibility: visible;
            }
            #printable-recipe-area {
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

        {/* CONTENEDOR PRINCIPAL DEL FORMULARIO */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Emision de Receta Retenida</h1>
          </div>
          <p className="text-slate-500 text-xs">Formulario para registrar recetas multiproposito de psicotropicos y farmacos controlados.</p>

          {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

          <form onSubmit={emitirReceta} className="space-y-6">
            {/* BUSCADOR DE CLIENTE Y MASCOTA INTEGRADO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <BuscadorClientePaciente
                token={activeToken}
                onSelect={handlePacienteSelected}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SELECCIÓN DE CONSULTA */}
              <div>
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

              {/* FIRMA DIGITAL DEL VETERINARIO */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Firma Digital del Veterinario</label>
                <input type="text" value={firma} onChange={e => setFirma(e.target.value)} placeholder="Ej: VET-JOHN-DOE" required className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
              </div>
            </div>

            {/* SECCIÓN AÑADIR MEDICAMENTO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Agregar Medicamento a la Receta</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Medicamento</label>
                  <select value={selectedMedId} onChange={e => setSelectedMedId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none">
                    <option value="">Seleccionar...</option>
                    {medicamentos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombreComercial} ({m.principioActivo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Dosificacion (Dosis)</label>
                  <input type="text" value={dosis} onChange={e => setDosis(e.target.value)} placeholder="Ej: 1 tableta cada 8 horas" className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none"/>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Duracion (Dias)</label>
                    <input type="number" min={1} max={365} value={duracion} onChange={e => setDuracion(parseInt(e.target.value) || 1)} className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none"/>
                  </div>
                  <button type="button" onClick={handleAddItem} className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 rounded-xl p-2.5 flex items-center justify-center cursor-pointer transition-colors shadow-sm self-end h-[38px]">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA DE ITEMS AGREGADOS A LA RECETA ACTUAL */}
            {items.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="p-3">Medicamento</th>
                      <th className="p-3">Dosificacion</th>
                      <th className="p-3">Duracion</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map(item => (
                      <tr key={item.idTemp}>
                        <td className="p-3 font-medium">{item.nombreComercial} <span className="text-slate-400 font-normal">({item.principioActivo})</span></td>
                        <td className="p-3">{item.dosis}</td>
                        <td className="p-3">{item.duracionDias} dias</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => handleRemoveItem(item.idTemp)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                            <Trash2 className="h-4 w-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button type="submit" disabled={!selectedConsultaId || items.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
              Emitir y Guardar Receta Completa
            </button>
          </form>
        </div>

        {/* HISTORIAL DE RECETAS EMITIDAS */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Historial de Recetas Emitidas</h2>
          </div>

          {recetasAgrupadas.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No se han registrado recetas en el sistema aun.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="p-3">Ref Consulta</th>
                    <th className="p-3">Fecha Emision</th>
                    <th className="p-3">Veterinario</th>
                    <th className="p-3">Receptor (Paciente / Dueño)</th>
                    <th className="p-3">Medicamentos</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recetasAgrupadas.map((r: any) => (
                    <tr key={r.consultaId}>
                      <td className="p-3 font-semibold text-indigo-600">ID #{r.consultaId}</td>
                      <td className="p-3">{new Date(r.fechaEmision).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-3 font-medium">{r.firmaVeterinario}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{r.pacienteNombre}</div>
                        <div className="text-[10px] text-slate-400">Dueño: {r.propietarioNombre}</div>
                      </td>
                      <td className="p-3 max-w-[200px] truncate">
                        {r.items.map((item: any) => item.medicamentoNombre).join(", ")}
                      </td>
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => handleShowHistoricalPrint(r)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-[11px] mx-auto transition-colors cursor-pointer border border-slate-200">
                          <Printer className="h-3.5 w-3.5" /> Ver / Imprimir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL DE VISTA PREVIA E IMPRESIÓN */}
        {showPrintModal && recipeForPrint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
              
              {/* Encabezado del modal */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vista Previa de Receta Medica</span>
                <button type="button" onClick={() => { setShowPrintModal(false); setRecipeForPrint(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Área Imprimible */}
              <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
                <div id="printable-recipe-area" className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm space-y-6 max-w-xl mx-auto text-slate-800">
                  
                  {/* Header de la clinica */}
                  <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">CLINICA VETERINARIA VETGUARD</h2>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Salud Animal · Farmacia de Controlados</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <p>Fecha: {new Date(recipeForPrint.fechaEmision).toLocaleDateString('es-CL')}</p>
                      <p>Consulta Ref: #{recipeForPrint.consultaId}</p>
                    </div>
                  </div>

                  {/* Informacion de Receptor */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5">Paciente</span>
                      <strong className="text-slate-800">{recipeForPrint.pacienteNombre}</strong>
                      <span className="text-[10px] text-slate-500 block">Especie: {recipeForPrint.pacienteEspecie}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5">Propietario</span>
                      <strong className="text-slate-800">{recipeForPrint.propietarioNombre}</strong>
                      <span className="text-[10px] text-slate-500 block">RUT: {recipeForPrint.propietarioRut}</span>
                    </div>
                  </div>

                  {/* Lista de medicamentos */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">Prescripcion Medica</h3>
                    <div className="space-y-4">
                      {recipeForPrint.items.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="p-3 border border-slate-100 rounded-lg bg-slate-50/30 flex justify-between items-start text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{idx + 1}. {item.medicamentoNombre}</div>
                            <div className="text-[10px] text-slate-500">Principio Activo: {item.medicamentoPrincipioActivo}</div>
                            <div className="mt-1 text-slate-700 font-medium">Instrucciones: {item.dosis}</div>
                          </div>
                          <div className="text-right font-semibold text-slate-600">
                            {item.duracionDias} dias
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pie de Receta / Firmas */}
                  <div className="pt-8 border-t border-slate-100 flex justify-between items-end text-xs">
                    <div className="max-w-[300px] text-[10px] text-slate-400 italic">
                      Documento emitido digitalmente para la adquisicion de medicamentos retenidos. Valido por la duracion indicada a partir de su fecha de emision.
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-400 pb-1 px-4 font-mono font-bold text-slate-800">
                        {recipeForPrint.firmaVeterinario}
                      </div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold mt-1">Firma Veterinario</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Acciones del modal */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowPrintModal(false); setRecipeForPrint(null); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer">
                  Cerrar
                </button>
                <button type="button" onClick={handlePrintRecipe} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
                  <Printer className="h-4 w-4" /> Imprimir Receta
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </StateWrapper>
  );
};