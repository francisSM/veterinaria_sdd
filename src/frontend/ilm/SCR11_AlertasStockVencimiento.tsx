import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR11Props {
  currentRole: UserRole;
}

export const SCR11_AlertasStockVencimiento: React.FC<SCR11Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const alertasVencimientoMock = [
    { id: 1, lote: 'LOTE-KB-110', medicamento: 'Ketamina Solución', vencimiento: '2026-07-10', diasRestantes: 11, estado: 'vencido_proximo' },
    { id: 2, lote: 'LOTE-AM-445', medicamento: 'Amoxicilina Suspensión', vencimiento: '2026-06-25', diasRestantes: -4, estado: 'vencido' }
  ];

  const alertasMinimosMock = [
    { id: 101, medicamento: 'Ketamina Solución', stock: 5, minimo: 8, nivel: 'critico' }
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'farmaceutico']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de Vencimiento FEFO */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Lotes Próximos a Vencer o Vencidos (FEFO)</h2>
          <p className="text-slate-500 text-xs">Mecanismos de control automático. Los lotes ya vencidos se inhabilitan para despacho (BR-16).</p>
          <div className="space-y-3">
            {alertasVencimientoMock.map(a => (
              <div key={a.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{a.medicamento}</h3>
                  <p className="text-xs text-slate-500 mt-1">Lote: {a.lote} | Expiración: {a.vencimiento}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                    a.estado === 'vencido'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {a.estado === 'vencido' ? 'Vencido - Bloqueado' : `${a.diasRestantes} días`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Stock Mínimo */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Alertas de Stock Mínimo Crítico</h2>
          <p className="text-slate-500 text-xs">Productos cuyas existencias cayeron por debajo de los niveles de seguridad requeridos.</p>
          <div className="space-y-3">
            {alertasMinimosMock.map(am => (
              <div key={am.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{am.medicamento}</h3>
                  <p className="text-xs text-slate-500 mt-1">Stock Físico: {am.stock} | Umbral Mínimo: {am.minimo}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20 uppercase animate-pulse">
                    Crítico
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
