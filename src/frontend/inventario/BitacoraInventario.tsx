import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { RefreshCw, Search, Calendar, FileText, ShoppingBag, ArrowDownRight, ArrowUpRight, Ban, AlertCircle, X } from 'lucide-react';

interface MovimientoLog {
  id: number;
  medicamentoId: number;
  nombreMedicamento: string;
  principioActivo: string;
  loteId: number;
  codigoLote: string;
  tipo: 'compra' | 'venta' | 'merma' | 'ajuste';
  cantidad: number;
  motivo: string | null;
  fechaMovimiento: string;
}

interface SCRProps {
  currentRole: UserRole;
}

export const BitacoraInventario: React.FC<SCRProps> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [movimientos, setMovimientos] = useState<MovimientoLog[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const loadMovimientos = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/inventario/movimientos', { headers });
      if (res.ok) {
        setMovimientos(await res.json());
      } else {
        setErrorMsg('Error al cargar la bitácora de movimientos.');
      }
    } catch {
      setErrorMsg('Error de conexión al servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadMovimientos();
  }, []);

  // Filtrar movimientos por búsqueda, tipo y fecha
  const filtrados = movimientos.filter(mov => {
    const coincideBusqueda =
      mov.nombreMedicamento.toLowerCase().includes(busqueda.toLowerCase()) ||
      mov.principioActivo.toLowerCase().includes(busqueda.toLowerCase()) ||
      mov.codigoLote.toLowerCase().includes(busqueda.toLowerCase()) ||
      (mov.motivo || '').toLowerCase().includes(busqueda.toLowerCase());

    const coincideTipo = filtroTipo === 'todos' || mov.tipo === filtroTipo;
    const coincideFecha = !filtroFecha || mov.fechaMovimiento.startsWith(filtroFecha);

    return coincideBusqueda && coincideTipo && coincideFecha;
  });

  // Agrupar movimientos por día de forma ordenada
  const agruparPorFecha = () => {
    const grupos: Record<string, MovimientoLog[]> = {};
    filtrados.forEach(mov => {
      const fecha = new Date(mov.fechaMovimiento).toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(mov);
    });
    return grupos;
  };

  const gruposPorFecha = agruparPorFecha();

  // Badge de color por tipo de movimiento
  const renderTipoBadge = (tipo: string, motivo: string | null) => {
    const isEliminacion = motivo && motivo.includes('[ELIMINACIÓN MEDICAMENTO]');
    if (isEliminacion) {
      return (
        <span className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Ban className="h-3 w-3"/> Eliminación
        </span>
      );
    }

    switch (tipo) {
      case 'compra':
        return (
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ShoppingBag className="h-3 w-3"/> Compra
          </span>
        );
      case 'venta':
        return (
          <span className="flex items-center gap-1 bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ArrowDownRight className="h-3 w-3"/> Despacho
          </span>
        );
      case 'merma':
        return (
          <span className="flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3"/> Merma
          </span>
        );
      case 'ajuste':
      default:
        return (
          <span className="flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ArrowUpRight className="h-3 w-3"/> Ajuste
          </span>
        );
    }
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Bitácora de Movimientos de Inventario</h1>
            <p className="text-slate-500 text-xs mt-0.5">Historial completo de auditoría de inventario: ingresos, despachos, mermas, ajustes y eliminaciones de stock.</p>
          </div>
          <button 
            type="button" 
            onClick={loadMovimientos}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Recargar bitácora"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0"/>
            {errorMsg}
          </div>
        )}

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por medicamento, principio activo, lote o motivo..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Fecha:</span>
              <div className="flex gap-1.5 items-center">
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={e => setFiltroFecha(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:bg-white"
                />
                {filtroFecha && (
                  <button
                    type="button"
                    onClick={() => setFiltroFecha('')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg"
                    title="Limpiar fecha"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Clasificar:</span>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none"
              >
                <option value="todos">Todos los movimientos</option>
                <option value="compra">Compras / Ingresos</option>
                <option value="venta">Despachos / Ventas</option>
                <option value="merma">Mermas / Pérdidas</option>
                <option value="ajuste">Ajustes manuales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista del Log agrupado */}
        {Object.keys(gruposPorFecha).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs italic">
            No se encontraron movimientos registrados en la bitácora con los filtros aplicados.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(gruposPorFecha).map(fecha => (
              <div key={fecha} className="space-y-2.5">
                {/* Cabecera de fecha */}
                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider pl-1 pt-2">
                  <Calendar className="h-4 w-4 text-indigo-500"/> {fecha}
                </h3>

                {/* Lista de movimientos del día */}
                <div className="space-y-2">
                  {gruposPorFecha[fecha].map(mov => {
                    const esNegativo = mov.cantidad < 0;
                    return (
                      <div key={mov.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xs transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex-shrink-0">{renderTipoBadge(mov.tipo, mov.motivo)}</div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{mov.nombreMedicamento}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Lote: <strong className="text-slate-600 font-bold">{mov.codigoLote}</strong> · 
                              Hora: {new Date(mov.fechaMovimiento).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {mov.motivo && (
                              <p className="text-[11px] text-slate-500 mt-1.5 italic bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 max-w-lg leading-relaxed">
                                {mov.motivo}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Cantidad/Stock modificado */}
                        <div className="text-right flex-shrink-0 self-end sm:self-center">
                          <span className={`text-sm font-extrabold px-3 py-1 rounded-lg ${esNegativo ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StateWrapper>
  );
};
