import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { RefreshCw, Percent, Plus, Tag, ShieldAlert, CheckCircle, Search, X, Grid, Pill, Activity, Check } from 'lucide-react';

interface ServicioTarifa {
  id: number;
  nombre: string;
  categoria: string;
  tipo: string;
  tarifaBase: number;
}

interface Medicamento {
  id: number;
  nombreComercial: string;
  principioActivo: string;
  precioVenta: number;
}

interface Campana {
  id: number;
  motivo: string;
  porcentaje: number;
  activo: boolean;
  tipoDescuento?: 'general' | 'especifico';
  serviciosIds?: string;
  medicamentosIds?: string;
}

interface SCR22Props {
  currentRole: UserRole;
}

export const DescuentosCampanas: React.FC<SCR22Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [servicios, setServicios] = useState<ServicioTarifa[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  const [motivo, setMotivo] = useState('');
  const [porcentaje, setPorcentaje] = useState(15);
  const [tipoDescuento, setTipoDescuento] = useState<'general' | 'especifico'>('general');

  // Coberturas específicas de la campaña
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]); // IDs o nombres
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
      const [resCamp, resServ, resMed] = await Promise.all([
        fetch('/api/v1/finanzas/campanas', { headers }),
        fetch('/api/v1/clinica/tarifas', { headers }),
        fetch('/api/v1/inventario/medicamentos/stock', { headers })
      ]);

      if (resCamp.ok) setCampanas(await resCamp.json());
      if (resServ.ok) setServicios(await resServ.json());
      if (resMed.ok) setMedicamentos(await resMed.json());
    } catch {
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const aplicarDescuento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!motivo) {
      setErrorMsg('Debe escribir el motivo o nombre de la campaña.');
      return;
    }

    if (porcentaje < 0.0 || porcentaje > 50.0) {
      setErrorMsg('Error CH-68/69: El porcentaje de descuento no puede ser menor al 0% ni superar el 50% (BR-39).');
      return;
    }

    if (tipoDescuento === 'especifico' && serviciosSeleccionados.length === 0 && medicamentosSeleccionados.length === 0) {
      setErrorMsg('Debe seleccionar al menos un servicio o medicamento para una campaña de cobertura específica.');
      return;
    }

    try {
      setUxState('loading');
      const response = await fetch('/api/v1/finanzas/campanas', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          motivo,
          porcentaje,
          tipoDescuento,
          serviciosIds: tipoDescuento === 'especifico' ? serviciosSeleccionados.join(',') : '',
          medicamentosIds: tipoDescuento === 'especifico' ? medicamentosSeleccionados.join(',') : ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Error al guardar la campaña.');
        setUxState('data');
        return;
      }

      setSuccessMsg(`Campaña de descuento "${motivo}" (${porcentaje}%) configurada con éxito.`);
      setMotivo('');
      setPorcentaje(15);
      setTipoDescuento('general');
      setServiciosSeleccionados([]);
      setMedicamentosSeleccionados([]);
      
      await loadData();
      setUxState('data');
    } catch (err: any) {
      setErrorMsg('Error de conexión: ' + err.message);
      setUxState('data');
    }
  };

  const toggleSeleccionServicio = (nombre: string) => {
    if (serviciosSeleccionados.includes(nombre)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(item => item !== nombre));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, nombre]);
    }
  };

  const toggleSeleccionMedicamento = (id: string) => {
    if (medicamentosSeleccionados.includes(id)) {
      setMedicamentosSeleccionados(medicamentosSeleccionados.filter(item => item !== id));
    } else {
      setMedicamentosSeleccionados([...medicamentosSeleccionados, id]);
    }
  };

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

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Percent className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Crear Campaña Descuento</h2>
          </div>

          {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0" />{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0" />{successMsg}</div>}

          <form onSubmit={aplicarDescuento} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">Motivo / Nombre Campaña</label>
              <input
                type="text"
                required
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: Descuento Esterilización Invierno"
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-semibold">Porcentaje Descuento (%) (Máx 50%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                required
                value={porcentaje}
                onChange={e => setPorcentaje(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl p-2.5 focus:outline-none font-bold text-indigo-650"
              />
            </div>

            {/* TIPO DE CAMPAÑA */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
              <label className="block text-slate-700 font-bold">Alcance del Descuento</label>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="tipoDescuento"
                    checked={tipoDescuento === 'general'}
                    onChange={() => setTipoDescuento('general')}
                    className="accent-indigo-600"
                  />
                  <span>Descuento General</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="tipoDescuento"
                    checked={tipoDescuento === 'especifico'}
                    onChange={() => setTipoDescuento('especifico')}
                    className="accent-indigo-600"
                  />
                  <span>Especificar Conceptos</span>
                </label>
              </div>

              {/* Selectores de catálogo para descuento específico */}
              {tipoDescuento === 'especifico' && (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  
                  {/* Servicios */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-semibold text-[10px] uppercase">Servicios Cubiertos</label>
                    <button
                      type="button"
                      onClick={() => { setSelectorTab('servicio'); setMostrarSelector(true); }}
                      className="w-full bg-white hover:bg-slate-55 border border-slate-200 text-slate-700 p-2 rounded-lg text-left flex justify-between items-center transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {serviciosSeleccionados.length > 0
                          ? `${serviciosSeleccionados.length} servicios seleccionados`
                          : '-- Seleccionar servicios --'
                        }
                      </span>
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    {serviciosSeleccionados.length > 0 && (
                      <p className="text-[9px] text-slate-450 italic leading-relaxed truncate">
                        Seleccionados: {serviciosSeleccionados.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Medicamentos */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-semibold text-[10px] uppercase">Fármacos Cubiertos</label>
                    <button
                      type="button"
                      onClick={() => { setSelectorTab('medicamento'); setMostrarSelector(true); }}
                      className="w-full bg-white hover:bg-slate-55 border border-slate-200 text-slate-700 p-2 rounded-lg text-left flex justify-between items-center transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {medicamentosSeleccionados.length > 0
                          ? `${medicamentosSeleccionados.length} fármacos seleccionados`
                          : '-- Seleccionar fármacos --'
                        }
                      </span>
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    {medicamentosSeleccionados.length > 0 && (
                      <p className="text-[9px] text-slate-450 italic leading-relaxed truncate">
                        Fármacos IDs: {medicamentosSeleccionados.join(', ')}
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer">
              Configurar Campaña
            </button>
          </form>
        </div>

        {/* LISTADO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Campañas Registradas</h2>
              <p className="text-slate-500 text-xs mt-0.5">Listado de campañas promocionales vigentes en caja.</p>
            </div>
            <button type="button" onClick={loadData} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-colors">
              <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid gap-3">
            {campanas.map(c => (
              <div key={`campana-item-${c.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:shadow-xs transition-shadow">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{c.motivo}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      c.tipoDescuento === 'especifico' ? 'bg-pink-100 text-pink-850 border-pink-200' : 'bg-indigo-100 text-indigo-850 border-indigo-200'
                    }`}>
                      {c.tipoDescuento === 'especifico' ? 'Específico' : 'Descuento General'}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    {c.tipoDescuento === 'especifico' ? (
                      <>
                        {c.serviciosIds && <p>✓ Servicios: <span className="font-medium text-slate-600">{c.serviciosIds}</span></p>}
                        {c.medicamentosIds && <p>✓ Medicamentos IDs: <span className="font-medium text-slate-600">{c.medicamentosIds}</span></p>}
                      </>
                    ) : (
                      <p>Aplica descuento en el subtotal consolidado de todo el comprobante fiscal.</p>
                    )}
                  </div>
                </div>

                <span className="font-extrabold text-indigo-650 text-sm">{c.porcentaje}% Desc</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* OVERLAY SELECTOR DE CATÁLOGO */}
      {mostrarSelector && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full h-[80vh] shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                {selectorTab === 'servicio' ? 'Seleccionar Servicios Promocionados' : 'Seleccionar Fármacos Promocionados'}
              </h3>
              <button onClick={() => { setMostrarSelector(false); setFiltroTexto(''); }} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

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
              
              {selectorTab === 'servicio' && (
                <div className="w-1/4 pr-4 border-r border-slate-100 overflow-y-auto hidden sm:block text-xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Categorías</span>
                  <button type="button" onClick={() => setFiltroCatServicio('Todos')} className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold mb-1 ${filtroCatServicio === 'Todos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'}`}>Todos</button>
                  {serviciosCategorias.map(cat => (
                    <button key={cat} type="button" onClick={() => setFiltroCatServicio(cat)} className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold mb-1 ${filtroCatServicio === cat ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'}`}>{cat}</button>
                  ))}
                </div>
              )}

              <div className="flex-1 pl-0 sm:pl-4 overflow-y-auto min-h-0 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                  {conceptosFiltrados().map(item => {
                    const esServ = selectorTab === 'servicio';
                    const isSelected = esServ 
                      ? serviciosSeleccionados.includes(item.nombre)
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
                          <span className="text-[10px] text-slate-455 block truncate">
                            {esServ ? (item as ServicioTarifa).categoria : `Tarifa: ${(item as Medicamento).precioVenta}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-indigo-650 border-indigo-650 text-white' : 'bg-white border-slate-300'
                          }`}>
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <button
              type="button"
              onClick={() => { setMostrarSelector(false); setFiltroTexto(''); }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors text-center text-xs"
            >
              Confirmar Selección ({
                selectorTab === 'servicio' ? serviciosSeleccionados.length : medicamentosSeleccionados.length
              } seleccionados)
            </button>

          </div>
        </div>
      )}
    </StateWrapper>
  );
};
