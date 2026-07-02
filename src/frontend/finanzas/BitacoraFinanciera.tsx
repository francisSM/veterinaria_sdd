import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { RefreshCw, Search, Calendar, Landmark, ArrowDownRight, ArrowUpRight, ShieldAlert, CheckCircle, HelpCircle, X } from 'lucide-react';

interface TransaccionLog {
  id: number;
  cajaDiariaId: number;
  descripcion: string;
  monto: number;
  tipoTransaccion: 'ingreso' | 'egreso' | 'ajuste';
  fechaRegistro: string;
  operadorNombre: string;
  operadorRol: string;
}

interface SCR23Props {
  currentRole: UserRole;
}

export const BitacoraFinanciera: React.FC<SCR23Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [transacciones, setTransacciones] = useState<TransaccionLog[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const loadBitacora = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/finanzas/bitacora-global', { headers });
      if (res.ok) {
        setTransacciones(await res.json());
      } else {
        setErrorMsg('Error al cargar el historial de transacciones financieras.');
      }
    } catch {
      setErrorMsg('Error de conexión al servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadBitacora();
  }, []);

  // Filtrar transacciones por búsqueda, tipo y fecha
  const filtradas = transacciones.filter(t => {
    const coincideBusqueda =
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.operadorNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.cajaDiariaId.toString().includes(busqueda) ||
      t.operadorRol.toLowerCase().includes(busqueda.toLowerCase());

    const coincideTipo = filtroTipo === 'todos' || t.tipoTransaccion === filtroTipo;
    const coincideFecha = !filtroFecha || t.fechaRegistro.startsWith(filtroFecha);

    return coincideBusqueda && coincideTipo && coincideFecha;
  });

  // Agrupar transacciones por fecha/día
  const agruparPorFecha = () => {
    const grupos: Record<string, TransaccionLog[]> = {};
    filtradas.forEach(t => {
      const fecha = new Date(t.fechaRegistro).toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(t);
    });
    return grupos;
  };

  const gruposPorFecha = agruparPorFecha();

  // Renderizar tipo de transacción badge
  const renderTipoBadge = (tipo: string, descripcion: string) => {
    const esAuditoria = descripcion.includes('[AUDITORÍA]');
    if (esAuditoria) {
      return (
        <span className="flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          ⚠ Auditoría
        </span>
      );
    }

    switch (tipo) {
      case 'ingreso':
        return (
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ArrowUpRight className="h-3 w-3"/> Ingreso
          </span>
        );
      case 'egreso':
        return (
          <span className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ArrowDownRight className="h-3 w-3"/> Egreso / Retiro
          </span>
        );
      case 'ajuste':
      default:
        return (
          <span className="flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <HelpCircle className="h-3 w-3"/> Ajuste
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
            <h1 className="text-xl font-bold text-slate-800">Bitácora Financiera Global</h1>
            <p className="text-slate-500 text-xs mt-0.5">Registro continuo de transacciones, ingresos, egresos de efectivo y arqueos diarios en el centro de caja (L5).</p>
          </div>
          <button 
            type="button" 
            onClick={loadBitacora}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Recargar bitácora"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0"/>
            {errorMsg}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por descripción, caja ID, operador o rol..."
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
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Filtro Tipo:</span>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none"
              >
                <option value="todos">Todos los movimientos</option>
                <option value="ingreso">Ingresos / Ventas</option>
                <option value="egreso">Egresos / Cierres</option>
                <option value="ajuste">Ajustes / Arqueos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listado agrupado */}
        {Object.keys(gruposPorFecha).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs italic">
            No se encontraron transacciones financieras con los filtros aplicados.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(gruposPorFecha).map(fecha => (
              <div key={fecha} className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider pl-1 pt-2">
                  <Calendar className="h-4 w-4 text-indigo-500"/> {fecha}
                </h3>

                <div className="space-y-2">
                  {gruposPorFecha[fecha].map(t => {
                    const esNegativo = t.tipoTransaccion === 'egreso' || t.descripcion.includes('descuadre') || t.descripcion.includes('Diferencia');
                    return (
                      <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xs transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex-shrink-0">{renderTipoBadge(t.tipoTransaccion, t.descripcion)}</div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{t.descripcion}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Caja Diaria: <strong className="text-slate-600 font-bold">#Caja-{t.cajaDiariaId}</strong> · 
                              Operador: <span className="font-semibold text-slate-500">{t.operadorNombre} ({t.operadorRol})</span> · 
                              Hora: {new Date(t.fechaRegistro).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {/* Monto de la transacción */}
                        <div className="text-right flex-shrink-0 self-end sm:self-center">
                          <span className={`text-sm font-extrabold px-3 py-1 rounded-lg ${t.tipoTransaccion === 'egreso' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {t.tipoTransaccion === 'egreso' ? '-' : '+'}${t.monto.toLocaleString('es-CL')} CLP
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
