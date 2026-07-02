import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Package, Calendar, AlertTriangle, Star, Check } from 'lucide-react';

interface LoteFEFO {
  id: number;
  codigoLote: string;
  fechaVencimiento: string;
  cantidadActual: number;
  estado: string;
  esFEFO: boolean;
}

interface RecetaInfo {
  id: number;
  medicamento: string;
  medicamentoId: number;
  dosis: string;
  duracionDias: number;
  firma: string;
  fechaEmision: string;
  estado: string;
  pacienteNombre?: string;
  propietarioNombre?: string;
}

interface SCR12Props {
  currentRole: UserRole;
}

const diasHastaVencimiento = (fecha: string) => {
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return dias;
};

export const DispensacionControlados: React.FC<SCR12Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [recetasPendientes, setRecetasPendientes] = useState<any[]>([]);
  
  const [recetaIdManual, setRecetaIdManual] = useState('');
  const [recetaInfo, setRecetaInfo] = useState<RecetaInfo | null>(null);
  const [lotes, setLotes] = useState<LoteFEFO[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cargandoLotes, setCargandoLotes] = useState(false);
  const [advertenciaFEFO, setAdvertenciaFEFO] = useState('');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // Cargar recetas pendientes al montar
  useEffect(() => {
    fetchRecetasPendientes();
  }, []);

  const fetchRecetasPendientes = async () => {
    try {
      const res = await fetch('/api/v1/inventario/recetas', { headers });
      if (res.ok) {
        const data = await res.json();
        // Filtrar recetas que esten en estado 'emitida'
        const pendientes = data.filter((r: any) => r.estado === 'emitida');
        setRecetasPendientes(pendientes);
      }
    } catch (err) {
      console.error('Error al cargar recetas pendientes:', err);
    }
  };

  // Cargar lotes FEFO cuando cambia la receta validada
  const cargarLotesFEFO = async (medicamentoId: number) => {
    setCargandoLotes(true);
    setLotes([]);
    setLoteSeleccionado(null);
    setAdvertenciaFEFO('');
    try {
      const res = await fetch(`/api/v1/inventario/medicamentos/${medicamentoId}/lotes-fefo`, { headers });
      if (res.ok) {
        const data: LoteFEFO[] = await res.json();
        setLotes(data);
        // Pre-seleccionar el lote FEFO automáticamente
        const fefo = data.find(l => l.esFEFO);
        if (fefo) setLoteSeleccionado(fefo.id);
      } else {
        setErrorMsg('No se pudieron cargar los lotes disponibles.');
      }
    } catch {
      setErrorMsg('Error de conexion al cargar lotes.');
    } finally {
      setCargandoLotes(false);
    }
  };

  // Al seleccionar una receta de la lista interactiva
  const seleccionarReceta = async (receta: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    setAdvertenciaFEFO('');
    setRecetaIdManual(String(receta.id));
    
    setRecetaInfo({
      id: receta.id,
      medicamento: receta.medicamentoNombre || `Medicamento #${receta.medicamentoId}`,
      medicamentoId: receta.medicamentoId,
      dosis: receta.dosis,
      duracionDias: receta.duracionDias,
      firma: receta.firmaVeterinario,
      fechaEmision: new Date(receta.fechaEmision).toLocaleDateString('es-CL'),
      estado: receta.estado,
      pacienteNombre: receta.pacienteNombre,
      propietarioNombre: receta.propietarioNombre
    });

    await cargarLotesFEFO(receta.medicamentoId);
  };

  // Validacion de receta por ID manual
  const verificarRecetaManual = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setAdvertenciaFEFO('');
    setRecetaInfo(null);
    setLotes([]);
    setLoteSeleccionado(null);

    const rid = parseInt(recetaIdManual);
    if (isNaN(rid) || rid < 1) {
      setErrorMsg('ID de receta invalido. Ingrese un numero.');
      return;
    }

    try {
      const resReceta = await fetch(`/api/v1/inventario/recetas/${rid}`, { headers });
      if (resReceta.ok) {
        const rec = await resReceta.json();
        setRecetaInfo({
          id: rec.id,
          medicamento: rec.medicamentoNombre || `Medicamento #${rec.medicamentoId}`,
          medicamentoId: rec.medicamentoId,
          dosis: rec.dosis,
          duracionDias: rec.duracionDias,
          firma: rec.firmaVeterinario,
          fechaEmision: new Date(rec.fechaEmision).toLocaleDateString('es-CL'),
          estado: rec.estado,
          pacienteNombre: rec.pacienteNombre,
          propietarioNombre: rec.propietarioNombre
        });

        if (rec.estado === 'emitida') {
          await cargarLotesFEFO(rec.medicamentoId);
        } else {
          setErrorMsg(`Esta receta ya fue procesada (estado: ${rec.estado}).`);
        }
      } else {
        setErrorMsg('Receta no encontrada.');
      }
    } catch {
      setErrorMsg('Error de red al verificar la receta.');
    }
  };

  const dispensar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setAdvertenciaFEFO('');

    if (!recetaInfo) return;

    if (!loteSeleccionado) {
      setErrorMsg('Debe seleccionar un lote para dispensar.');
      return;
    }

    if (cantidad <= 0) {
      setErrorMsg('La cantidad a dispensar debe ser mayor a cero.');
      return;
    }

    const lote = lotes.find(l => l.id === loteSeleccionado);
    if (lote && cantidad > lote.cantidadActual) {
      setErrorMsg(`Stock insuficiente en el lote seleccionado (disponible: ${lote.cantidadActual}).`);
      return;
    }

    try {
      const res = await fetch('/api/v1/inventario/despachos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recetaId: recetaInfo.id,
          loteId: loteSeleccionado,
          cantidadDespachada: cantidad
        })
      });

      const data = await res.json();

      if (res.ok) {
        const loteUsado = data.loteUsado;
        setSuccessMsg(
          `Despacho registrado. Lote: ${loteUsado.codigoLote} — Stock restante: ${loteUsado.stockRestante} unidades.`
        );
        if (data.advertenciaFEFO) setAdvertenciaFEFO(data.advertenciaFEFO);
        
        // Limpiar seleccion
        setRecetaInfo(null);
        setLotes([]);
        setLoteSeleccionado(null);
        setRecetaIdManual('');
        setCantidad(1);

        // Recargar la lista de pendientes
        fetchRecetasPendientes();
      } else {
        setErrorMsg(data.error || 'Error al registrar el despacho.');
      }
    } catch {
      setErrorMsg('Error de red al registrar el despacho.');
    }
  };

  const loteActivo = lotes.find(l => l.id === loteSeleccionado);
  const diasVence = loteActivo ? diasHastaVencimiento(loteActivo.fechaVencimiento) : null;

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ENCABEZADO */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
          <h1 className="text-xl font-bold text-slate-100">Dispensacion de Receta Retenida</h1>
          <p className="text-slate-400 text-xs mt-1">
            Modulo para entrega legal de farmacos controlados. Seleccione una receta de la lista interactiva o ingrese el ID manualmente.
          </p>
        </div>

        {/* ALERTAS */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-start gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {advertenciaFEFO && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{advertenciaFEFO}</span>
          </div>
        )}

        {/* PANEL A DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA 1: LISTADO DE RECETAS PENDIENTES */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-1">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Recetas Pendientes</h2>
            
            {recetasPendientes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay recetas pendientes en este momento.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {recetasPendientes.map(r => {
                  const selected = recetaInfo?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => seleccionarReceta(r)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">
                          ID #{r.id}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(r.fechaEmision).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-bold text-slate-200">{r.medicamentoNombre}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Paciente: <span className="text-slate-300">{r.pacienteNombre}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Dueño: {r.propietarioNombre}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMNA 2 & 3: FORMULARIO Y DETALLES */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6 lg:col-span-2">
            
            {/* BUSQUEDA MANUAL (Por si se requiere buscar por ID especifico) */}
            <div className="space-y-2">
              <label htmlFor="receta-id-input" className="block text-xs font-semibold text-slate-300">
                Buscar por ID Manual de Receta
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="receta-id-input"
                  value={recetaIdManual}
                  onChange={e => setRecetaIdManual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verificarRecetaManual()}
                  placeholder="ID de Receta Retenida (ej: 1)"
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
                />
                <button
                  type="button"
                  id="btn-verificar-receta"
                  onClick={verificarRecetaManual}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold py-2 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Validar Receta
                </button>
              </div>
            </div>

            {/* DETALLES DE LA RECETA SELECCIONADA Y FORMULARIO */}
            {recetaInfo ? (
              <form onSubmit={dispensar} className="space-y-6 border-t border-slate-800 pt-6">
                
                {/* Informacion de la receta seleccionada */}
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4.5 w-4.5 text-emerald-400" />
                      <h3 className="font-bold text-slate-200 text-sm">{recetaInfo.medicamento}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
                      {recetaInfo.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800/50">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Mascota / Paciente</span>
                      <strong className="text-slate-300">{recetaInfo.pacienteNombre}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Propietario / Dueño</span>
                      <strong className="text-slate-300">{recetaInfo.propietarioNombre}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Dosis recomendada: <strong className="text-slate-300">{recetaInfo.dosis}</strong> por un periodo de {recetaInfo.duracionDias} dias.
                  </p>

                  <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-850">
                    <span>Emitida: {recetaInfo.fechaEmision}</span>
                    <span>Vet Firma: {recetaInfo.firma}</span>
                  </div>
                </div>

                {/* Seleccion de lote (Lógica FEFO) */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    Lote de Origen Disponible <span className="text-red-400">*</span>
                    <span className="text-slate-500 font-normal">(ordenados de forma automatica por vencimiento - FEFO)</span>
                  </label>

                  {cargandoLotes ? (
                    <div className="text-slate-500 text-xs italic py-2">Consultando lotes disponibles en bodega...</div>
                  ) : lotes.length === 0 ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-lg">
                      No hay lotes con existencias disponibles para este medicamento. registre una compra o lote antes de dispensar.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lotes.map(l => {
                        const dias = diasHastaVencimiento(l.fechaVencimiento);
                        const selected = loteSeleccionado === l.id;
                        const urgente = dias <= 30;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            id={`lote-btn-${l.id}`}
                            onClick={() => setLoteSeleccionado(l.id)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              selected
                                ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                                : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {l.esFEFO && (
                                  <span className="flex items-center gap-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                    <Star className="h-2.5 w-2.5" /> FEFO
                                  </span>
                                )}
                                <span className="text-sm font-bold text-slate-200">{l.codigoLote}</span>
                              </div>
                              <span className="text-xs text-slate-400">Existencias: <strong className="text-slate-200">{l.cantidadActual}</strong></span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] text-slate-500">
                                Vencimiento: <span className="font-mono text-slate-400">{new Date(l.fechaVencimiento).toLocaleDateString('es-CL')}</span>
                              </span>
                              <span className={`text-[10px] font-semibold ${urgente ? 'text-amber-500' : 'text-slate-500'}`}>
                                {dias} dias restantes
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cantidad a despachar */}
                {loteSeleccionado && lotes.length > 0 && (
                  <div className="space-y-2">
                    <label htmlFor="cant-dispense-input" className="block text-xs font-semibold text-slate-300">
                      Cantidad a Dispensar {loteActivo && <span className="text-slate-500 font-normal">(limite maximo: {loteActivo.cantidadActual})</span>}
                    </label>
                    <input
                      id="cant-dispense-input"
                      type="number"
                      min={1}
                      max={loteActivo?.cantidadActual}
                      value={cantidad}
                      onChange={e => setCantidad(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
                    />
                    {diasVence !== null && diasVence <= 30 && (
                      <p className="text-amber-500 text-[11px] mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Lote proximo a vencer ({diasVence} dias). Confirme autorizacion antes de proceder.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-registrar-despacho"
                  disabled={!loteSeleccionado || lotes.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200 cursor-pointer"
                >
                  Registrar Despacho Legal de Farmaco
                </button>
              </form>
            ) : (
              <div className="bg-slate-900/50 border border-slate-850 p-8 rounded-xl text-center text-xs text-slate-500 italic">
                Seleccione una receta del panel izquierdo o busque una por ID manual para procesar la dispensacion y sugerir lote por FEFO.
              </div>
            )}
          </div>

        </div>

      </div>
    </StateWrapper>
  );
};
