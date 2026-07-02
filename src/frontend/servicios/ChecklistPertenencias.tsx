import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR26Props {
  currentRole: UserRole;
}

export const ChecklistPertenencias: React.FC<SCR26Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [itemNombre, setItemNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState('nuevo');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [pertenencias, setPertenencias] = useState([
    { id: 1, item: 'Correa de cuero café', cantidad: 1, estado: 'usado' },
    { id: 2, item: 'Juguete mordedor goma', cantidad: 2, estado: 'semi_nuevo' }
  ]);

  const agregarItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!itemNombre) {
      setErrorMsg('El nombre de la pertenencia es obligatorio.');
      return;
    }

    if (cantidad <= 0) {
      setErrorMsg('La cantidad de artículos debe ser mayor a 0.');
      return;
    }

    const nuevo = {
      id: pertenencias.length + 1,
      item: itemNombre,
      cantidad,
      estado
    };

    setPertenencias([...pertenencias, nuevo]);
    setSuccessMsg(`Pertenencia '${itemNombre}' registrada en el checklist de ingreso.`);
    setItemNombre('');
    setCantidad(1);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registro Item */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Registrar Pertenencia</h2>
          <p className="text-slate-500 text-xs">Crea fichas de los artículos personales del huésped entregados en custodia (L5).</p>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg">
              {successMsg}
            </div>
          )}

          <form onSubmit={agregarItem} className="space-y-4">
            <div>
              <label htmlFor="pertenencia-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Descripción Pertenencia</label>
              <input
                id="pertenencia-input"
                type="text"
                value={itemNombre}
                onChange={e => setItemNombre(e.target.value)}
                placeholder="Ej: Manta polar azul con huellas"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="item-qty-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Cantidad</label>
                <input
                  id="item-qty-input"
                  type="number"
                  value={cantidad}
                  onChange={e => setCantidad(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="item-state-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Estado</label>
                <select
                  id="item-state-select"
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="semi_nuevo">Semi-nuevo</option>
                  <option value="usado">Usado</option>
                  <option value="desgastado">Desgastado</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Agregar Item
            </button>
          </form>
        </div>

        {pertenencias-list}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-200">Custodia de Pertenencias</h2>
          <div className="space-y-2">
            {pertenencias.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{p.item}</h3>
                  <span className="text-[10px] text-slate-500">Cantidad: {p.cantidad} unidades</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded uppercase">
                  Estado: {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
