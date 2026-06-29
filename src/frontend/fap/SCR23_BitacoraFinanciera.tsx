import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR23Props {
  currentRole: UserRole;
}

export const SCR23_BitacoraFinanciera: React.FC<SCR23Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const bitacoraMock = [
    { id: 1, cajaId: 5, tipo: 'ingreso', monto: 44625, comentario: 'Cobro boleta folio #1001', hora: '2026-06-29 16:01' },
    { id: 2, cajaId: 5, tipo: 'egreso', monto: 12000, comentario: 'Retiro sencillo para sencillo caja', hora: '2026-06-29 16:15' }
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Bitácora Financiera Global</h1>
          <p className="text-slate-400 text-sm">Registro continuo de transacciones, ingresos y retiros de efectivo auditados por supervisors (L5).</p>
        </div>

        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-4">Caja ID</th>
                <th className="p-4">Tipo Movimiento</th>
                <th className="p-4">Monto ($)</th>
                <th className="p-4">Descripción / Justificación</th>
                <th className="p-4">Hora Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {bitacoraMock.map(b => (
                <tr key={b.id} className="hover:bg-slate-900/20 text-slate-300">
                  <td className="p-4 font-semibold text-slate-200">#Caja-{b.cajaId}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      b.tipo === 'ingreso'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {b.tipo}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${b.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {b.tipo === 'ingreso' ? '+' : '-'}${b.monto} CLP
                  </td>
                  <td className="p-4 text-slate-300">{b.comentario}</td>
                  <td className="p-4 text-xs text-slate-500">{b.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StateWrapper>
  );
};
