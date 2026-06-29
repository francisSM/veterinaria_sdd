import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR09Props {
  currentRole: UserRole;
}

export const SCR09_CatalogoMedicamentos: React.FC<SCR09Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const medicamentosMock = [
    { id: 1, nombre: 'Fenobarbital 100mg', principio: 'Fenobarbital', categoria: 'psicotropico', stock: 15, min: 10, precio: 12500 },
    { id: 2, nombre: 'Ketamina Solución', principio: 'Ketamina', categoria: 'anestesico', stock: 5, min: 8, precio: 35000 },
    { id: 3, nombre: 'Amoxicilina Suspensión', principio: 'Amoxicilina', categoria: 'antibiotico', stock: 50, min: 15, precio: 8900 },
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'farmaceutico', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Catálogo de Medicamentos e Insumos</h1>
          <p className="text-slate-400 text-sm">Control físico de existencias, precios y umbrales mínimos de stock (L5).</p>
        </div>

        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-4">Medicamento</th>
                <th className="p-4">Principio Activo</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-center">Stock Disponible</th>
                <th className="p-4 text-center">Mínimo Requerido</th>
                <th className="p-4 text-right">Precio Venta</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {medicamentosMock.map(m => {
                const isUnderMin = m.stock <= m.min;
                return (
                  <tr key={m.id} className="hover:bg-slate-900/20 text-slate-300">
                    <td className="p-4 font-semibold text-slate-200">{m.nombre}</td>
                    <td className="p-4">{m.principio}</td>
                    <td className="p-4">
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 capitalize">
                        {m.categoria}
                      </span>
                    </td>
                    <td className={`p-4 text-center font-bold ${isUnderMin ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                      {m.stock}
                    </td>
                    <td className="p-4 text-center text-slate-400">{m.min}</td>
                    <td className="p-4 text-right font-medium text-emerald-400">${m.precio}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isUnderMin
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isUnderMin ? 'Reponer' : 'Óptimo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </StateWrapper>
  );
};
