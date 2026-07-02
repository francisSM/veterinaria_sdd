import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Search, Shield, Trash2, Activity, RefreshCw, X, Grid, Pill, Plus, Check } from 'lucide-react';

interface Propietario {
  id: number;
  nombre: string;
  rut: string;
}

interface Paciente {
  id: number;
  nombre: string;
  especie: string;
  propietarioId: number;
}

interface ServicioTarifa {
  id: number;
  nombre: string;
  categoria: string;
  tipo: string;
  tarifaBase: number;
  notas?: string;
}

interface Medicamento {
  id: number;
  nombreComercial: string;
  principioActivo: string;
  precioVenta: number;
  stockTotal: number;
}

interface ConvenioLog {
  id: number;
  propietarioId: number;
  compania: string;
  polizaNumero: string;
  pacienteId?: number;
  coberturaPorcentaje?: number;
  cubreCirugias?: boolean;
  cubreMedicamentos?: boolean;
  medicamentosCobertura?: string;
  cirugiasCobertura?: string;
  propietarioNombre?: string;
  pacienteNombre?: string;
}

interface SCR21Props {
  currentRole: UserRole;
}

export const ConveniosSeguros: React.FC<SCR21Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [convenios, setConvenios] = useState<ConvenioLog[]>([]);

  // Catálogo completo
  const [servicios, setServicios] = useState<ServicioTarifa[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  // Búsqueda de Propietario
  const [busquedaProp, setBusquedaProp] = useState('');
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);

  // Mascotas asociadas al propietario seleccionado
  const [mascotasAsociadas, setMascotasAsociadas] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState('');

  // Póliza y Cobertura
  const [compania, setCompania] = useState('Bupa Pets Cobertura');
  const [poliza, setPoliza] = useState('');
  const [coberturaGlobal, setCoberturaGlobal] = useState(80);

  // Coberturas específicas
  const [cubreCirugias, setCubreCirugias] = useState(false);
  const [cirugiasSeleccionadas, setCirugiasSeleccionadas] = useState<string[]>([]); // Nombres o IDs

  const [cubreMedicamentos, setCubreMedicamentos] = useState(false);
  const [medicamentosSeleccionados, setMedicamentosSeleccionados] = useState<string[]>([]); // IDs

  // Modal selector de catálogo
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'servicio' | 'medicamento'>('servicio');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCatServicio, setFiltroCatServicio] = useState('Todos');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const loadData = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resProp, resPac, resConv, resServ, resMed] = await Promise.all([
        fetch('/api/v1/clinica/propietarios', { headers }),
        fetch('/api/v1/clinica/pacientes', { headers }),
        fetch('/api/v1/finanzas/convenios', { headers }),
        fetch('/api/v1/clinica/tarifas', { headers }),
        fetch('/api/v1/inventario/medicamentos/stock', { headers })
      ]);

      if (resProp.ok) setPropietarios(await resProp.json());
      if (resPac.ok) setPacientes(await resPac.json());
      if (resServ.ok) setServicios(await resServ.json());
      if (resMed.ok) setMedicamentos(await resMed.json());
      if (resConv.ok) {
        setConvenios(await resConv.json());
      } else {
        setErrorMsg('Error al recuperar los convenios.');
      }
    } catch {
      setErrorMsg('Error de red al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cargar mascotas del propietario
  useEffect(() => {
    if (selectedProp) {
      const filtered = pacientes.filter(p => p.propietarioId === selectedProp.id);
      setMascotasAsociadas(filtered);
      if (filtered.length > 0) {
        setSelectedPacienteId(filtered[0].id.toString());
      } else {
        setSelectedPacienteId('');
      }
    } else {
      setMascotasAsociadas([]);
      setSelectedPacienteId('');
    }
  }, [selectedProp, pacientes]);

  const registrarSeguro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProp) {
      setErrorMsg('Debe seleccionar un cliente/propietario.');
      return;
    }

    if (!selectedPacienteId) {
      setErrorMsg('Debe seleccionar una mascota/paciente.');
      return;
    }

    if (!poliza) {
      setErrorMsg('Debe ingresar el número de póliza.');
      return;
    }

    if (poliza.trim().length < 5) {
      setErrorMsg('Validación CH-65: El número de póliza debe tener al menos 5 caracteres.');
      return;
    }

    try {
      setUxState('loading');
      const response = await fetch('/api/v1/finanzas/convenios', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propietarioId: selectedProp.id,
          compania,
          polizaNumero: poliza,
          pacienteId: Number(selectedPacienteId),
          coberturaPorcentaje: coberturaGlobal,
          cubreCirugias,
          cubreMedicamentos,
          medicamentosCobertura: cubreMedicamentos ? medicamentosSeleccionados.join(',') : '',
          cirugiasCobertura: cubreCirugias ? cirugiasSeleccionadas.join(',') : ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Error al vincular el seguro.');
        setUxState('data');
        return;
      }

      setSuccessMsg(`Póliza de seguro vinculada con éxito. Compañía: ${compania}.`);
      
      // Limpiar
      setSelectedProp(null);
      setBusquedaProp('');
      setPoliza('');
      setCubreCirugias(false);
      setCubreMedicamentos(false);
      setCirugiasSeleccionadas([]);
      setMedicamentosSeleccionados([]);
      
      await loadData();
      setUxState('data');
    } catch (err: any) {
      setErrorMsg('Error de red: ' + err.message);
      setUxState('data');
    }
  };

  const handleEliminarConvenio = async (id: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setUxState('loading');
      const response = await fetch(`/api/v1/finanzas/convenios/${id}`, { method: 'DELETE', headers });
      if (!response.ok) {
        const data = await response.json();
        setErrorMsg(data.error || 'Error al eliminar el convenio.');
        setUxState('data');
        return;
      }
      setSuccessMsg('Convenio eliminado con éxito.');
      await loadData();
      setUxState('data');
    } catch (err: any) {
      setErrorMsg(err.message);
      setUxState('data');
    }
  };

  const toggleSeleccionServicio = (nombre: string) => {
    if (cirugiasSeleccionadas.includes(nombre)) {
      setCirugiasSeleccionadas(cirugiasSeleccionadas.filter(item => item !== nombre));
    } else {
      setCirugiasSeleccionadas([...cirugiasSeleccionadas, nombre]);
    }
  };

  const toggleSeleccionMedicamento = (id: string) => {
    if (medicamentosSeleccionados.includes(id)) {
      setMedicamentosSeleccionados(medicamentosSeleccionados.filter(item => item !== id));
    } else {
      setMedicamentosSeleccionados([...medicamentosSeleccionados, id]);
    }
  };

  // Filtrados del catálogo en el modal
  const serviciosCategorias = Array.from(new Set(servicios.map(s => s.categoria)));
  
  const conceptosFiltrados = () => {
    if (selectorTab === 'servicio') {
      return servicios.filter(s => {
        const matchText = s.nombre.toLowerCase().includes(filtroTexto.toLowerCase());
        const matchCat = filtroCatServicio === 'Todos' || s.categoria === filtroCatServicio;
        return matchText && matchCat;
      });
    } else {
      return medicamentos.filter(m => 
        m.nombreComercial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        m.principioActivo.toLowerCase().includes(filtroTexto.toLowerCase())
      );
    }
  };

  const propietariosFiltrados = propietarios.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProp.toLowerCase()) ||
    p.rut.toLowerCase().includes(busquedaProp.toLowerCase())
  );

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO DE REGISTRO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 lg:col-span-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Vincular Convenio Seguro</h2>
          </div>

          {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0" />{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0" />{successMsg}</div>}

          <form onSubmit={registrarSeguro} className="space-y-4 text-xs">
            {/* BUSQUEDA PROPIETARIO */}
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">1. Buscar Propietario (Cliente)</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={busquedaProp}
                  onChange={e => { setBusquedaProp(e.target.value); if (selectedProp) setSelectedProp(null); }}
                  placeholder="Escriba nombre o RUT..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {busquedaProp && !selectedProp && (
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-50 bg-white mt-1">
                  {propietariosFiltrados.map(p => (
                    <button
                      type="button"
                      key={`prop-${p.id}`}
                      onClick={() => { setSelectedProp(p); setBusquedaProp(p.nombre); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                    >
                      <span className="font-bold text-slate-800">{p.nombre}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{p.rut}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProp && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl space-y-3">
                <div className="text-[10px] text-indigo-900 leading-relaxed">
                  <p><strong>Cliente:</strong> {selectedProp.nombre}</p>
                  <p><strong>RUT:</strong> {selectedProp.rut}</p>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">2. Mascota (Paciente)</label>
                  {mascotasAsociadas.length === 0 ? (
                    <p className="text-[10px] text-rose-500 italic">El cliente no tiene mascotas registradas.</p>
                  ) : (
                    <select
                      value={selectedPacienteId}
                      onChange={e => setSelectedPacienteId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded-lg p-2 focus:outline-none"
                    >
                      {mascotasAsociadas.map(p => (
                        <option key={`pac-${p.id}`} value={p.id}>{p.nombre} ({p.especie})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* COBERTURA */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Aseguradora</label>
                <select value={compania} onChange={e => setCompania(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2 focus:outline-none">
                  <option value="Bupa Pets Cobertura">Bupa Pets Cobertura</option>
                  <option value="Sura Seguros Caninos">Sura Seguros Caninos</option>
                  <option value="Consorcio Mascotas">Consorcio Mascotas</option>
                  <option value="Colmena Vet Protection">Colmena Vet Protection</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Póliza (CH-65)</label>
                  <input type="text" value={poliza} onChange={e => setPoliza(e.target.value)} placeholder="Ej: POL-10291" className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Cobertura Base (%)</label>
                  <input type="number" min="1" max="100" value={coberturaGlobal} onChange={e => setCoberturaGlobal(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2 focus:outline-none"/>
                </div>
              </div>
            </div>

            {/* REGLAS COBERTURA CON BOTÓN SELECTOR DE CATÁLOGO */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <label className="block text-slate-700 font-semibold mb-1">Reglas de Cobertura Específicas</label>

              {/* Cirugías */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-650 cursor-pointer select-none">
                  <input type="checkbox" checked={cubreCirugias} onChange={e => setCubreCirugias(e.target.checked)} className="accent-indigo-600 h-4 w-4 bg-white border border-slate-250 rounded"/>
                  <span>¿Cubre Cirugías y Operaciones?</span>
                </label>

                {cubreCirugias && (
                  <div>
                    <button
                      type="button"
                      onClick={() => { setSelectorTab('servicio'); setMostrarSelector(true); }}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-lg text-left text-[11px] flex justify-between items-center transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {cirugiasSeleccionadas.length > 0 
                          ? `${cirugiasSeleccionadas.length} cirugías seleccionadas` 
                          : '-- Seleccionar cirugías del catálogo --'
                        }
                      </span>
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    {cirugiasSeleccionadas.length > 0 && (
                      <p className="text-[9px] text-slate-450 mt-1 italic leading-relaxed truncate">
                        Seleccionadas: {cirugiasSeleccionadas.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Medicamentos */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-slate-650 cursor-pointer select-none">
                  <input type="checkbox" checked={cubreMedicamentos} onChange={e => setCubreMedicamentos(e.target.checked)} className="accent-indigo-600 h-4 w-4 bg-white border border-slate-250 rounded"/>
                  <span>¿Cubre Fármacos y Medicamentos?</span>
                </label>

                {cubreMedicamentos && (
                  <div>
                    <button
                      type="button"
                      onClick={() => { setSelectorTab('medicamento'); setMostrarSelector(true); }}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-lg text-left text-[11px] flex justify-between items-center transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {medicamentosSeleccionados.length > 0 
                          ? `${medicamentosSeleccionados.length} fármacos seleccionados` 
                          : '-- Seleccionar fármacos del catálogo --'
                        }
                      </span>
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    {medicamentosSeleccionados.length > 0 && (
                      <p className="text-[9px] text-slate-450 mt-1 italic leading-relaxed truncate">
                        Fármacos IDs: {medicamentosSeleccionados.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={!selectedProp || !selectedPacienteId} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer">
              Vincular Póliza de Seguro
            </button>
          </form>
        </div>

        {/* LISTADO DE CONVENIOS ACTIVOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Convenios de Seguros Registrados</h2>
              <p className="text-slate-500 text-xs mt-0.5">Listado de pólizas autorizadas asociadas a las fichas clínicas de pacientes.</p>
            </div>
            <button type="button" onClick={loadData} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-colors">
              <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {convenios.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-10 bg-slate-50 rounded-xl border border-slate-100">No hay convenios activos registrados.</p>
          ) : (
            <div className="grid gap-3">
              {convenios.map(c => {
                return (
                  <div key={`conv-item-${c.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-start hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                          {c.compania}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">Póliza: {c.polizaNumero}</span>
                      </div>

                      <div className="text-xs">
                        <p className="font-bold text-slate-800">
                          Titular: <span className="font-semibold text-slate-650">{c.propietarioNombre || 'Desconocido'}</span>
                        </p>
                        <p className="font-bold text-slate-850 mt-0.5">
                          Paciente Cubierto: <span className="font-semibold text-slate-650 text-indigo-650">{c.pacienteNombre || 'General'}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Activity className="h-3 w-3" /> Cobertura Base: {c.coberturaPorcentaje}%
                        </span>

                        {c.cubreCirugias && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold px-2 py-0.5 rounded-full" title={c.cirugiasCobertura}>
                            ✓ Cirugías ({c.cirugiasCobertura || 'Todas'})
                          </span>
                        )}

                        {c.cubreMedicamentos && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full" title={c.medicamentosCobertura}>
                            ✓ Fármacos ({c.medicamentosCobertura || 'Todos'})
                          </span>
                        )}
                      </div>
                    </div>

                    <button type="button" onClick={() => handleEliminarConvenio(c.id)} className="p-1.5 hover:bg-rose-50 text-rose-600 border border-rose-100 hover:border-rose-200 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY SELECTOR DE CATÁLOGO PARA REGLAS DE COBERTURA */}
      {mostrarSelector && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full h-[80vh] shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                {selectorTab === 'servicio' ? 'Seleccionar Cirugías Cubiertas' : 'Seleccionar Fármacos Cubiertos'}
              </h3>
              <button onClick={() => { setMostrarSelector(false); setFiltroTexto(''); }} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filtroTexto}
                onChange={e => setFiltroTexto(e.target.value)}
                placeholder="Escriba término de búsqueda..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
              />
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* Categorías laterales (sólo para servicios) */}
              {selectorTab === 'servicio' && (
                <div className="w-1/4 pr-4 border-r border-slate-100 overflow-y-auto hidden sm:block text-xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Categorías</span>
                  <button type="button" onClick={() => setFiltroCatServicio('Todos')} className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold mb-1 ${filtroCatServicio === 'Todos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'}`}>Todos</button>
                  {serviciosCategorias.map(cat => (
                    <button key={cat} type="button" onClick={() => setFiltroCatServicio(cat)} className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold mb-1 ${filtroCatServicio === cat ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'}`}>{cat}</button>
                  ))}
                </div>
              )}

              {/* Grid de Ítems */}
              <div className="flex-1 pl-0 sm:pl-4 overflow-y-auto min-h-0 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                  {conceptosFiltrados().length === 0 ? (
                    <p className="col-span-full py-10 text-center text-slate-400 italic">No se encontraron ítems.</p>
                  ) : (
                    conceptosFiltrados().map(item => {
                      const esServ = selectorTab === 'servicio';
                      const isSelected = esServ 
                        ? cirugiasSeleccionadas.includes(item.nombre)
                        : medicamentosSeleccionados.includes(item.id.toString());
                      
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => {
                            if (esServ) {
                              toggleSeleccionServicio(item.nombre);
                            } else {
                              toggleSeleccionMedicamento(item.id.toString());
                            }
                          }}
                          className={`w-full text-left border p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-3xs' 
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="space-y-1 pr-3 truncate">
                            <span className="font-bold block truncate">
                              {esServ ? (item as ServicioTarifa).nombre : (item as Medicamento).nombreComercial}
                            </span>
                            <span className="text-[10px] text-slate-450 block truncate">
                              {esServ ? (item as ServicioTarifa).categoria : `Principio: ${(item as Medicamento).principioActivo}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-[11px] font-mono text-indigo-650">
                              ${(esServ ? (item as ServicioTarifa).tarifaBase : (item as Medicamento).precioVenta).toLocaleString()}
                            </span>
                            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-indigo-650 border-indigo-650 text-white' : 'bg-white border-slate-300'
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            <button
              type="button"
              onClick={() => { setMostrarSelector(false); setFiltroTexto(''); }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-center text-xs"
            >
              Confirmar Selección ({
                selectorTab === 'servicio' ? cirugiasSeleccionadas.length : medicamentosSeleccionados.length
              } seleccionados)
            </button>

          </div>
        </div>
      )}
    </StateWrapper>
  );
};
