import React, { useState, useEffect } from "react";
import { StateWrapper, UXState } from "../StateWrapper";
import { UserRole } from "../Layout";
import { ShieldAlert, CheckCircle, Clipboard, Printer, X, Eye } from "lucide-react";
import { BuscadorClientePaciente, Propietario, Paciente } from "../components/BuscadorClientePaciente";

interface SCR08Props { currentRole: UserRole; token?: string; }

export const ConsentimientoFirmado: React.FC<SCR08Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>("data");
  
  // Selección
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  // Formulario consentimiento
  const [tipo, setTipo] = useState("cirugia");
  const [justificacion, setJustificacion] = useState("");
  const [firmaOwner, setFirmaOwner] = useState("");

  // Historial de consentimientos
  const [historial, setHistorial] = useState<any[]>([]);

  // Modal de impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [consentForPrint, setConsentForPrint] = useState<any | null>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeToken = token || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  // Cargar historial al montar
  useEffect(() => {
    fetchConsentimientos();
  }, []);

  const fetchConsentimientos = async () => {
    try {
      const response = await fetch("/api/v1/clinica/consentimientos", { headers });
      if (response.ok) {
        setHistorial(await response.json());
      }
    } catch (err) {
      console.error("Error al cargar consentimientos:", err);
    }
  };

  // Autogenerar justificación al cambiar tipo de procedimiento o paciente
  useEffect(() => {
    if (selectedPac) {
      let texto = "";
      if (tipo === "cirugia") {
        texto = `Se requiere el consentimiento informado para la realizacion de una intervencion quirurgica de caracter invasivo en el paciente de nombre ${selectedPac.nombre}. El procedimiento conlleva riesgos anestesicos y post-operatorios que han sido debidamente informados al propietario responsable.`;
      } else if (tipo === "eutanasia") {
        texto = `Se solicita la autorizacion expresa del propietario para proceder con el protocolo humanitario de eutanasia asistida para el paciente de nombre ${selectedPac.nombre}, con el fin de evitar sufrimiento innecesario debido a su diagnostico clinico terminal.`;
      } else {
        texto = `Se requiere consentimiento informado para el ingreso y permanencia del paciente ${selectedPac.nombre} en el area de hospitalizacion prolongada de la clinica, autorizando tratamientos criticos continuos y toma de signos vitales.`;
      }
      setJustificacion(texto);
    }
  }, [tipo, selectedPac?.id]);

  const handlePacienteSelected = (prop: Propietario | null, pac: Paciente | null) => {
    setSelectedProp(prop);
    setSelectedPac(pac);
  };

  const firmarConsentimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedProp || !selectedPac || !firmaOwner.trim() || !justificacion.trim()) {
      setErrorMsg("Debe rellenar todos los campos del consentimiento.");
      return;
    }

    try {
      setUxState("loading");
      const response = await fetch("/api/v1/clinica/consentimientos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          propietarioId: selectedProp.id,
          pacienteId: selectedPac.id,
          tipo: tipo,
          detallesIntervencion: justificacion,
          firmaPropietario: firmaOwner
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || "Error al guardar consentimiento.");
        setUxState("data");
        return;
      }

      setSuccessMsg(`Consentimiento firmado digitalmente con exito.`);
      setUxState("data");

      // Abrir vista previa inmediatamente
      setConsentForPrint({
        ...data,
        propietarioNombre: selectedProp.nombre,
        propietarioRut: selectedProp.rut,
        pacienteNombre: selectedPac.nombre
      });
      setShowPrintModal(true);

      // Limpiar selección
      setSelectedProp(null);
      setSelectedPac(null);
      setFirmaOwner("");
      setJustificacion("");

      // Recargar historial
      fetchConsentimientos();
    } catch (err: any) {
      setErrorMsg("Error de conexion: " + err.message);
      setUxState("data");
    }
  };

  const handleShowPrint = (consent: any) => {
    setConsentForPrint(consent);
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

        {/* CONTENEDOR PRINCIPAL DEL FORMULARIO */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
              <Clipboard className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Firma de Consentimiento Informado</h1>
          </div>
          <p className="text-slate-500 text-xs">Aprobacion legal obligatoria del propietario para cirugias criticas, hospitalizaciones o eutanasia.</p>

          {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

          <form onSubmit={firmarConsentimiento} className="space-y-4">
            {/* BUSCADOR DE CLIENTE Y MASCOTA INTEGRADO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <BuscadorClientePaciente
                token={activeToken}
                onSelect={handlePacienteSelected}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TIPO DE PROCEDIMIENTO */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Tipo de Procedimiento</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none">
                  <option value="cirugia">Cirugia Mayor Invasiva</option>
                  <option value="eutanasia">Consentimiento de Eutanasia (BR-08)</option>
                  <option value="hospitalizacion">Hospitalizacion Prolongada</option>
                </select>
              </div>

              {/* FIRMA ESCRITA */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Firma Escrita (Nombre Titular)</label>
                <input type="text" value={firmaOwner} onChange={e => setFirmaOwner(e.target.value)} placeholder="Ej: Fabian Sanhueza" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none" required/>
              </div>
            </div>

            {/* JUSTIFICACIÓN / DETALLES DE INTERVENCIÓN */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Justificacion y Evidencia de la Labor</label>
              <textarea rows={4} value={justificacion} onChange={e => setJustificacion(e.target.value)} placeholder="Describa por que se necesita el consentimiento y detalles del procedimiento..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none resize-none" required/>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-800">DECLARACION DE RESPONSABILIDAD:</p>
              <p>
                Por la presente firma declaro estar plenamente informado de los riesgos asociados,
                complicaciones quirurgicas, efectos anestesicos e implicaciones clinicas descritos por el
                veterinario tratante. Doy mi autorizacion expresa para proceder con el protocolo medico asignado.
              </p>
            </div>

            <button type="submit" disabled={!selectedProp || !selectedPac} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
              Firmar Digitalmente Consentimiento
            </button>
          </form>
        </div>

        {/* HISTORIAL DE CONSENTIMIENTOS */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Historial de Consentimientos Firmados</h2>
          </div>

          {historial.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay consentimientos registrados en el sistema aun.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Fecha Firma</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Dueño / Paciente</th>
                    <th className="p-3">Firma Digital</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {historial.map((c: any) => (
                    <tr key={c.id}>
                      <td className="p-3 font-semibold text-indigo-600">ID #{c.id}</td>
                      <td className="p-3">{new Date(c.fechaFirma).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                          {c.tipo}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{c.pacienteNombre}</div>
                        <div className="text-[10px] text-slate-400">Propietario: {c.propietarioNombre}</div>
                      </td>
                      <td className="p-3 font-mono font-medium">{c.firmaPropietario}</td>
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => handleShowPrint(c)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-[11px] mx-auto transition-colors cursor-pointer border border-slate-200">
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
        {showPrintModal && consentForPrint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
              
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vista Previa de Consentimiento Informado</span>
                <button type="button" onClick={() => { setShowPrintModal(false); setConsentForPrint(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                <div id="printable-consent-area" className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm space-y-6 text-slate-800 max-w-lg mx-auto text-xs">
                  
                  <div className="border-b-2 border-slate-800 pb-4 text-center">
                    <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900">Clinica Veterinaria VetGuard</h2>
                    <p className="text-[10px] text-slate-500">Documento Oficial de Consentimiento Medico Informado</p>
                  </div>

                  <div className="space-y-1">
                    <p><strong>Fecha de Emision:</strong> {new Date(consentForPrint.fechaFirma).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Registro Consentimiento:</strong> ID #{consentForPrint.id}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Paciente</span>
                      <strong className="text-slate-800">{consentForPrint.pacienteNombre}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Propietario / Dueño</span>
                      <strong className="text-slate-800">{consentForPrint.propietarioNombre}</strong>
                      <span className="text-[10px] text-slate-500 block">RUT: {consentForPrint.propietarioRut}</span>
                    </div>
                  </div>

                  <div className="space-y-2 leading-relaxed">
                    <p className="font-bold text-slate-700">Justificacion Quirurgica / Procedimiento:</p>
                    <p className="text-justify bg-slate-50/50 p-3 rounded border border-slate-100">{consentForPrint.detallesIntervencion}</p>
                  </div>

                  <div className="bg-slate-50/30 border border-slate-100 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed text-justify">
                    El propietario declara haber comprendido explicitamente los diagnosticos, pronosticos y riesgos de la intervencion detallada anteriormente, autorizando al personal veterinario a proceder.
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                    <div className="max-w-[220px] text-[9px] text-slate-400 italic">
                      Documento emitido digitalmente para constancia de firma autorizada de la clinica.
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

      </div>
    </StateWrapper>
  );
};