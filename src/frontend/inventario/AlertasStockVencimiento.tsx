import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Calendar, Package } from 'lucide-react';

interface Lote { id: number; codigoLote: string; cantidadActual: number; fechaVencimiento: string; estado: string; }
interface Medicamento { id: number; nombreComercial: string; principioActivo: string; stockMinimo: number; stockTotal: number; lotes: Lote[]; }

interface SCR11Props { currentRole: UserRole; token?: string; }

export const AlertasStockVencimiento: React.FC<SCR11Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeToken}` };

  const loadData = async () => {
    try {
      const res = await fetch('/api/v1/inventario/medicamentos/stock', { headers });
      if (res.ok) {
        setMedicamentos(await res.json());
      } else {
        setErrorMsg('Error al consultar stock para generar alertas.');
      }
    } catch {
      setErrorMsg('Error de red al consultar alertas.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular alertas de vencimiento (FEFO)
  const alertasVencimiento: Array<{ id: string; lote: string; medicamento: string; vencimiento: string; diasRestantes: number; estado: string }> = [];
  
  medicamentos.forEach(med => {
    med.lotes.forEach(l => {
      const diffTime = new Date(l.fechaVencimiento).getTime() - new Date().getTime();
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Mostrar si está vencido o vence en menos de 30 días
      if (diasRestantes <= 30 || l.estado === 'vencido') {
        alertasVencimiento.push({
          id: `vence-${l.id}`,
          lote: l.codigoLote,
          medicamento: med.nombreComercial,
          vencimiento: new Date(l.fechaVencimiento).toLocaleDateString(),
          diasRestantes,
          estado: diasRestantes < 0 || l.estado === 'vencido' ? 'vencido' : 'vencido_proximo'
        });
      }
    });
  });

  // Calcular alertas de stock mínimo
  const alertasMinimos = medicamentos.filter(med => med.stockTotal <= med.stockMinimo);

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Alertas de Inventario & Vencimiento (FEFO)</h1>
          <p className="text-slate-500 text-xs mt-0.5">Control automático de expiración de lotes y niveles críticos de fármacos en tiempo real.</p>
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0" />{errorMsg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ALERTAS DE VENCIMIENTO FEFO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <Calendar className="h-4 w-4 text-rose-500"/> Lotes Próximos a Vencer o Vencidos
            </h2>
            <p className="text-slate-500 text-[11px] leading-relaxed">Mecanismos de control automático. Los lotes ya vencidos se inhabilitan para despacho (BR-16).</p>
            <div className="space-y-2.5">
              {alertasVencimiento.length === 0 ? (
                <p className="text-xs text-slate-450 italic text-center p-6 bg-slate-50 rounded-xl">No hay alertas de vencimiento pendientes.</p>
              ) : (
                alertasVencimiento.map(a => (
                  <div key={a.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">{a.medicamento}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Lote: <strong className="text-slate-700">{a.lote}</strong> | Expiración: <span className="font-mono">{a.vencimiento}</span></p>
                    </div>
                    <div>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        a.estado === 'vencido'
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {a.estado === 'vencido' ? 'Vencido - Bloqueado' : `${a.diasRestantes} días`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ALERTAS DE STOCK MÍNIMO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <Package className="h-4 w-4 text-amber-500"/> Alertas de Stock Mínimo Crítico
            </h2>
            <p className="text-slate-500 text-[11px] leading-relaxed">Medicamentos e insumos cuyas existencias físicas totales en almacén están bajo el umbral de seguridad.</p>
            <div className="space-y-2.5">
              {alertasMinimos.length === 0 ? (
                <p className="text-xs text-slate-450 italic text-center p-6 bg-slate-50 rounded-xl">No hay productos en estado crítico de stock.</p>
              ) : (
                alertasMinimos.map(am => (
                  <div key={am.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">{am.nombreComercial}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Stock Físico: <strong className="text-slate-800">{am.stockTotal}</strong> | Umbral Mínimo: <span className="font-semibold">{am.stockMinimo}</span>
                      </p>
                    </div>
                    <div>
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-600 border-rose-100 uppercase animate-pulse">
                        {am.stockTotal === 0 ? 'Sin Stock' : 'Bajo Stock'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};