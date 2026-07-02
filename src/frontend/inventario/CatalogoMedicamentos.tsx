import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Plus, Edit2, Trash2, Box, Calendar, Key, RefreshCw, Layers } from 'lucide-react';

interface Lote { id: number; codigoLote: string; medicamentoId: number; compraId: number; cantidadInicial: number; cantidadActual: number; precioCompraUnitario: number; fechaIngreso: string; fechaVencimiento: string; estado: 'disponible' | 'bloqueado' | 'vencido'; }
interface Medicamento { id: number; nombreComercial: string; principioActivo: string; precioVenta: number; stockMinimo: number; categoriaId: number; categoriaNombre: string; stockTotal: number; lotes: Lote[]; }

interface SCR09Props { currentRole: UserRole; }

const roundToNearestTen = (amount: number): number => {
  let rounded = Math.round(amount);
  const residuo = rounded % 10;
  if (residuo >= 5) {
    return rounded + (10 - residuo);
  } else {
    return rounded - residuo;
  }
};

const formatCLP = (amount: number): string => {
  return roundToNearestTen(amount).toLocaleString('es-CL');
};

export const CatalogoMedicamentos: React.FC<SCR09Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Expandir medicamento para ver lotes
  const [medExpandido, setMedExpandido] = useState<number | null>(null);

  // Formulario Medicamento
  const [editMedId, setEditMedId] = useState<number | null>(null);
  const [nombreComercial, setNombreComercial] = useState('');
  const [principioActivo, setPrincipioActivo] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [categoriaId, setCategoriaId] = useState('1'); // Por defecto 'antibiotico' = 1

  // Campos del Lote Inicial del Medicamento
  const [codigoLoteInicial, setCodigoLoteInicial] = useState('');
  const [cantidadInicialLote, setCantidadInicialLote] = useState('');
  const [precioCompraUnitarioLote, setPrecioCompraUnitarioLote] = useState('1000');
  const [fechaVencimientoLote, setFechaVencimientoLote] = useState('');

  // Modal de Eliminación con Criterios
  const [eliminarMedId, setEliminarMedId] = useState<number | null>(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState('');

  // Formulario Lote
  const [editLoteId, setEditLoteId] = useState<number | null>(null);
  const [loteMedicamentoId, setLoteMedicamentoId] = useState<number | null>(null);
  const [codigoLote, setCodigoLote] = useState('');
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [cantidadActual, setCantidadActual] = useState('');
  const [precioCompraUnitario, setPrecioCompraUnitario] = useState('1000');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [loteEstado, setLoteEstado] = useState<'disponible' | 'bloqueado' | 'vencido'>('disponible');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const loadMedicamentos = async () => {
    try {
      const res = await fetch('/api/v1/inventario/medicamentos/stock', { headers });
      if (res.ok) {
        setMedicamentos(await res.json());
      }
    } catch {
      setErrorMsg('Error de conexión al cargar medicamentos.');
    }
  };

  useEffect(() => {
    loadMedicamentos();
  }, []);

  const handleGuardarMedicamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nombreComercial || !principioActivo || !precioVenta || !stockMinimo) {
      setErrorMsg('Faltan campos obligatorios para el medicamento.');
      return;
    }

    if (!editMedId) {
      if (!codigoLoteInicial || !cantidadInicialLote || !precioCompraUnitarioLote || !fechaVencimientoLote) {
        setErrorMsg('Faltan campos obligatorios para el lote inicial del medicamento.');
        return;
      }
    }

    const payload: any = {
      nombreComercial,
      principioActivo,
      precioVenta: Number(precioVenta),
      stockMinimo: Number(stockMinimo),
      categoriaId: Number(categoriaId)
    };

    if (!editMedId) {
      payload.codigoLote = codigoLoteInicial;
      payload.cantidadInicial = Number(cantidadInicialLote);
      payload.precioCompraUnitario = Number(precioCompraUnitarioLote);
      payload.fechaVencimiento = fechaVencimientoLote;
    }

    try {
      const url = editMedId ? `/api/v1/inventario/medicamentos/${editMedId}` : '/api/v1/inventario/medicamentos';
      const method = editMedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(editMedId ? 'Medicamento actualizado con éxito.' : 'Nuevo medicamento registrado con éxito con su lote inicial.');
        setEditMedId(null);
        setNombreComercial('');
        setPrincipioActivo('');
        setPrecioVenta('');
        setStockMinimo('');
        setCodigoLoteInicial('');
        setCantidadInicialLote('');
        setPrecioCompraUnitarioLote('1000');
        setFechaVencimientoLote('');
        loadMedicamentos();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Error al guardar medicamento.');
      }
    } catch {
      setErrorMsg('Error de red al registrar medicamento.');
    }
  };

  const handleEliminarMedicamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eliminarMedId) return;
    if (!motivoEliminacion || motivoEliminacion.trim().length < 5) {
      setErrorMsg('Debe especificar un motivo de eliminación válido (mínimo 5 caracteres).');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/inventario/medicamentos/${eliminarMedId}?motivo=${encodeURIComponent(motivoEliminacion)}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSuccessMsg('Medicamento y sus lotes eliminados del catálogo con constancia de auditoría.');
        setEliminarMedId(null);
        setMotivoEliminacion('');
        loadMedicamentos();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Error al eliminar el medicamento.');
      }
    } catch {
      setErrorMsg('Error de red al eliminar medicamento.');
    }
  };

  const handleGuardarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!codigoLote || !fechaVencimiento || (!editLoteId && !cantidadInicial)) {
      setErrorMsg('Faltan campos para guardar el lote.');
      return;
    }

    try {
      if (editLoteId) {
        // Editar Lote
        const res = await fetch(`/api/v1/inventario/lotes/${editLoteId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            codigoLote,
            cantidadActual: Number(cantidadActual),
            fechaVencimiento,
            estado: loteEstado
          })
        });

        if (res.ok) {
          setSuccessMsg('Lote actualizado correctamente.');
          setEditLoteId(null);
          setLoteMedicamentoId(null);
          setCodigoLote(''); setCantidadInicial(''); setCantidadActual(''); setFechaVencimiento('');
          loadMedicamentos();
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Error al actualizar lote.');
        }
      } else {
        // Registrar Nuevo Lote
        const res = await fetch('/api/v1/inventario/lotes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            medicamentoId: loteMedicamentoId,
            compraId: 1, // Simula compraId por defecto
            codigoLote,
            cantidadInicial: Number(cantidadInicial),
            precioCompraUnitario: Number(precioCompraUnitario),
            fechaVencimiento
          })
        });

        if (res.ok) {
          setSuccessMsg('Lote ingresado con éxito al inventario.');
          setLoteMedicamentoId(null);
          setCodigoLote(''); setCantidadInicial(''); setFechaVencimiento('');
          loadMedicamentos();
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Error al registrar lote.');
        }
      }
    } catch {
      setErrorMsg('Error de conexión al procesar el lote.');
    }
  };

  const handleEliminarLote = async (loteId: number) => {
    if (!window.confirm('¿Desea eliminar este lote de forma permanente del sistema?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/inventario/lotes/${loteId}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccessMsg('Lote eliminado correctamente.');
        loadMedicamentos();
      } else {
        setErrorMsg('Error al eliminar lote.');
      }
    } catch {
      setErrorMsg('Error de conexión al eliminar lote.');
    }
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Administración de Catálogo e Inventario</h1>
          <p className="text-slate-500 text-xs mt-0.5">Control físico de insumos y medicamentos, registro de lotes de expiración y stock crítico (L5).</p>
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* TABLA PRINCIPAL DE MEDICAMENTOS */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">Nombre Comercial</th>
                    <th className="p-3">Principio Activo</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-center">Stock total</th>
                    <th className="p-3 text-right">Precio venta</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicamentos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No hay medicamentos en el inventario.</td>
                    </tr>
                  ) : (
                    medicamentos.map(med => {
                      const isBajoStock = med.stockTotal <= med.stockMinimo;
                      const expandido = medExpandido === med.id;
                      return (
                        <React.Fragment key={med.id}>
                          <tr className="hover:bg-slate-50/50 text-slate-700 font-medium">
                            <td className="p-3">
                              <button onClick={() => setMedExpandido(expandido ? null : med.id)} className="text-left font-bold text-slate-800 hover:text-indigo-600 cursor-pointer">
                                {med.nombreComercial}
                              </button>
                            </td>
                            <td className="p-3 font-mono">{med.principioActivo}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600">{med.categoriaNombre}</span>
                            </td>
                            <td className={`p-3 text-center font-bold ${isBajoStock ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
                              {med.stockTotal} <span className="text-[10px] text-slate-400 font-normal">(Min: {med.stockMinimo})</span>
                            </td>
                            <td className="p-3 text-right text-emerald-600 font-bold">${formatCLP(med.precioVenta)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => {
                                  setEditMedId(med.id);
                                  setNombreComercial(med.nombreComercial);
                                  setPrincipioActivo(med.principioActivo);
                                  setPrecioVenta(med.precioVenta.toString());
                                  setStockMinimo(med.stockMinimo.toString());
                                  setCategoriaId(med.categoriaId.toString());
                                }} className="p-1 hover:bg-slate-100 text-indigo-600 rounded-lg cursor-pointer" title="Editar Medicamento">
                                  <Edit2 className="h-3.5 w-3.5"/>
                                </button>
                                <button onClick={() => {
                                  setEliminarMedId(med.id);
                                  setMotivoEliminacion('');
                                }} className="p-1 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer" title="Eliminar Medicamento">
                                  <Trash2 className="h-3.5 w-3.5"/>
                                </button>
                                <button onClick={() => {
                                  setLoteMedicamentoId(med.id);
                                  setEditLoteId(null);
                                  setCodigoLote(''); setCantidadInicial(''); setFechaVencimiento('');
                                }} className="flex items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer">
                                  <Plus className="h-2.5 w-2.5"/>Lote
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* PANEL EXPANDIDO CON LOS LOTES */}
                          {expandido && (
                            <tr className="bg-slate-50 border-y border-slate-150">
                              <td colSpan={6} className="p-4">
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                    <Layers className="h-3 w-3 text-indigo-500"/> Lotes registrados — ordenados por vencimiento (FEFO):
                                  </h4>
                                  {med.lotes.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">No hay lotes vigentes. Use la opción "+Lote" para ingresar existencias físicas.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {[...med.lotes]
                                        .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
                                        .map((l, idx) => {
                                          const ahora = new Date();
                                          const vence = new Date(l.fechaVencimiento);
                                          const dias = Math.ceil((vence.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
                                          const vencido = dias < 0;
                                          const urgente = !vencido && dias <= 30;
                                          const esFEFO = idx === 0 && l.estado === 'disponible' && !vencido;
                                          return (
                                            <div key={l.id} className={`bg-white border p-3 rounded-xl flex justify-between items-start text-[11px] text-slate-700 ${esFEFO ? 'border-emerald-300 ring-1 ring-emerald-200' : urgente ? 'border-amber-200' : vencido ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}>
                                              <div className="space-y-0.5 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                  {esFEFO && (
                                                    <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">⭐ FEFO</span>
                                                  )}
                                                  <p className="font-bold text-slate-900">{l.codigoLote}</p>
                                                </div>
                                                <p className="text-[10px] text-slate-500">
                                                  Stock: <strong className="text-slate-800">{l.cantidadActual}/{l.cantidadInicial}</strong> · 
                                                  Vence: <span className="font-mono">{new Date(l.fechaVencimiento).toLocaleDateString('es-CL')}</span>
                                                </p>
                                                <p className={`text-[9px] font-semibold ${vencido ? 'text-rose-500' : urgente ? 'text-amber-500' : 'text-slate-400'}`}>
                                                  {vencido ? '⚠ VENCIDO' : urgente ? `⏰ Vence en ${dias} días` : `${dias} días restantes`} · Estado: <span className="uppercase">{l.estado}</span>
                                                </p>
                                              </div>
                                              <div className="flex gap-1.5 ml-2">
                                                <button onClick={() => {
                                                  setEditLoteId(l.id);
                                                  setLoteMedicamentoId(med.id);
                                                  setCodigoLote(l.codigoLote);
                                                  setCantidadInicial(l.cantidadInicial.toString());
                                                  setCantidadActual(l.cantidadActual.toString());
                                                  setFechaVencimiento(l.fechaVencimiento.split('T')[0]);
                                                  setLoteEstado(l.estado);
                                                }} className="p-1 hover:bg-slate-100 text-indigo-600 rounded cursor-pointer"><Edit2 className="h-3 w-3"/></button>
                                                <button onClick={() => handleEliminarLote(l.id)} className="p-1 hover:bg-slate-100 text-rose-600 rounded cursor-pointer"><Trash2 className="h-3 w-3"/></button>
                                              </div>
                                            </div>
                                          );
                                        })
                                      }
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FORMULARIOS DE REGISTRO / EDICION */}
          <div className="space-y-4">
            {/* FORMULARIO MEDICAMENTO */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1 uppercase">
                <Box className="h-4 w-4 text-indigo-600"/> {editMedId ? 'Editar Medicamento' : 'Nuevo Medicamento'}
              </h3>
              <form onSubmit={handleGuardarMedicamento} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Nombre Comercial</label>
                  <input type="text" value={nombreComercial} onChange={e => setNombreComercial(e.target.value)} placeholder="Ej: Fenobarbital 100mg" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Principio Activo</label>
                  <input type="text" value={principioActivo} onChange={e => setPrincipioActivo(e.target.value)} placeholder="Ej: Fenobarbital" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 mb-1">Precio Venta ($)</label>
                    <input type="number" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} placeholder="Ej: 12500" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Stock Mínimo</label>
                    <input type="number" value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} placeholder="Ej: 5" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Categoría</label>
                  <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none">
                    <option value="1">Antibiotico</option>
                    <option value="2">Analgesico</option>
                    <option value="3">Anestesico</option>
                    <option value="4">Vacuna</option>
                    <option value="5">Desparasitante</option>
                    <option value="6">Psicotropico</option>
                  </select>
                </div>

                {!editMedId && (
                  <div className="border-t border-slate-200 pt-3 mt-3 space-y-3">
                    <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Lote Inicial de Origen (Requerido)
                    </h4>
                    <div>
                      <label className="block text-slate-500 mb-1">Código de Lote Inicial</label>
                      <input type="text" value={codigoLoteInicial} onChange={e => setCodigoLoteInicial(e.target.value)} placeholder="Ej: LOT-1002-A" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 mb-1">Cantidad Inicial</label>
                        <input type="number" value={cantidadInicialLote} onChange={e => setCantidadInicialLote(e.target.value)} placeholder="Ej: 50" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Precio Compra Unitario ($)</label>
                        <input type="number" value={precioCompraUnitarioLote} onChange={e => setPrecioCompraUnitarioLote(e.target.value)} placeholder="Ej: 5000" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Fecha de Vencimiento</label>
                      <input type="date" value={fechaVencimientoLote} onChange={e => setFechaVencimientoLote(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg cursor-pointer">
                    {editMedId ? 'Guardar Cambios' : 'Registrar'}
                  </button>
                  {editMedId && (
                    <button type="button" onClick={() => { setEditMedId(null); setNombreComercial(''); setPrincipioActivo(''); setPrecioVenta(''); setStockMinimo(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg cursor-pointer">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* FORMULARIO LOTE */}
            {loteMedicamentoId && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1 uppercase">
                  <Calendar className="h-4 w-4 text-emerald-600"/> {editLoteId ? 'Editar Lote Expiración' : 'Registrar Lote'}
                </h3>
                <form onSubmit={handleGuardarLote} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Código de Lote</label>
                    <input type="text" value={codigoLote} onChange={e => setCodigoLote(e.target.value)} placeholder="Ej: LOT-1029-A" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                  </div>
                  
                  {editLoteId ? (
                    <div>
                      <label className="block text-slate-500 mb-1">Cantidad Actual</label>
                      <input type="number" value={cantidadActual} onChange={e => setCantidadActual(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-500 mb-1">Cantidad Inicial (Stock)</label>
                      <input type="number" value={cantidadInicial} onChange={e => setCantidadInicial(e.target.value)} placeholder="Ej: 50" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 mb-1">Fecha de Vencimiento (Expiración)</label>
                    <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"/>
                  </div>

                  {editLoteId && (
                    <div>
                      <label className="block text-slate-500 mb-1">Estado del Lote</label>
                      <select value={loteEstado} onChange={e => setLoteEstado(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none">
                        <option value="disponible">Disponible</option>
                        <option value="bloqueado">Bloqueado</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg cursor-pointer">
                      {editLoteId ? 'Guardar Lote' : 'Ingresar Stock'}
                    </button>
                    <button type="button" onClick={() => { setLoteMedicamentoId(null); setEditLoteId(null); setCodigoLote(''); setCantidadInicial(''); setFechaVencimiento(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY MODAL: ELIMINACIÓN CON JUSTIFICACIÓN OBLIGATORIA */}
      {eliminarMedId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                <ShieldAlert className="h-5 w-5 text-rose-600"/> Confirmar Eliminación Crítica
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Está a punto de eliminar el medicamento <strong className="text-slate-800">{medicamentos.find(m => m.id === eliminarMedId)?.nombreComercial}</strong> y todos sus lotes asociados de forma permanente del sistema.
              </p>
            </div>

            <form onSubmit={handleEliminarMedicamento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Motivo de la Eliminación (Justificación requerida para auditoría) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={motivoEliminacion}
                  onChange={e => setMotivoEliminacion(e.target.value)}
                  placeholder="Ej: Retirado del mercado por alerta sanitaria del proveedor..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Mínimo 5 caracteres. Esta acción quedará registrada en el log de auditoría del sistema.</p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Confirmar Eliminación
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEliminarMedId(null);
                    setMotivoEliminacion('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StateWrapper>
  );
};