import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR19Props {
  currentRole: UserRole;
}

export const SCR19_HistorialComprobantes: React.FC<SCR19Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const comprobantesMock = [
    { id: 1001, tipo: 'boleta', cliente: 'Marta Gomez', fecha: '2026-06-29 16:00', total: 44625, estado: 'emitida' },
    { id: 1002, tipo: 'factura', cliente: 'Refugio Huellitas', fecha: '2026-06-29 11:20', total: 119000, estado: 'pagada' },
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'cajero']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Historial de Comprobantes Fiscales</h1>
          <p className="text-slate-400 text-sm">Resumen de boletas y facturas emitidas por la clínica veterinaria (L5).</p>
        </div>

        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-4">Folio / Documento</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Fecha Emisión</th>
                <th className="p-4 text-right">Total Facturado</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {comprobantesMock.map(c => (
                <tr key={c.id} className="hover:bg-slate-900/20 text-slate-300">
                  <td className="p-4">
                    <span className="font-semibold text-slate-200">#{c.id}</span>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 capitalize ml-2">
                      {c.tipo}
                    </span>
                  </td>
                  <td className="p-4">{c.cliente}</td>
                  <td className="p-4 text-xs text-slate-500">{c.fecha}</td>
                  <td className="p-4 text-right font-medium text-emerald-400">${c.total} CLP</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                      c.estado === 'pagada'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StateWrapper>
  );
};
