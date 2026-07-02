import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR14Props {
  currentRole: UserRole;
}

export const GestionProveedores: React.FC<SCR14Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [razonSocial, setRazonSocial] = useState('');
  const [rut, setRut] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [proveedores, setProveedores] = useState([
    { id: 1, razonSocial: 'Droguería Central S.A.', rut: '77291884-3' },
    { id: 2, razonSocial: 'Fármacos Veterinarios Chile Ltda.', rut: '88392019-K' }
  ]);

  const registrarProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!razonSocial || !rut) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    // CH-45: RUT length >= 9
    if (rut.trim().length < 9) {
      setErrorMsg('Error CH-45: El RUT del proveedor debe poseer al menos 9 caracteres de longitud.');
      return;
    }

    const nuevo = {
      id: proveedores.length + 1,
      razonSocial,
      rut
    };

    setProveedores([...proveedores, nuevo]);
    setSuccessMsg(`Proveedor '${razonSocial}' registrado exitosamente.`);
    setRazonSocial('');
    setRut('');
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registro Proveedor */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Registrar Proveedor</h2>
          <p className="text-slate-500 text-xs">Crea fichas de laboratorios y distribuidores autorizados en la clínica (L5).</p>

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

          <form onSubmit={registrarProveedor} className="space-y-4">
            <div>
              <label htmlFor="razon-social-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Razón Social</label>
              <input
                id="razon-social-input"
                type="text"
                value={razonSocial}
                onChange={e => setRazonSocial(e.target.value)}
                placeholder="Ej: Laboratorio PetCare"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prov-rut-input" className="block text-xs font-semibold text-slate-400 mb-1.5">RUT Proveedor</label>
              <input
                id="prov-rut-input"
                type="text"
                value={rut}
                onChange={e => setRut(e.target.value)}
                placeholder="Ej: 76543210-9"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Registrar Proveedor
            </button>
          </form>
        </div>

        {/* Proveedores Registrados */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-200">Proveedores Registrados</h2>
          <div className="space-y-2">
            {proveedores.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{p.razonSocial}</h3>
                  <span className="text-[10px] text-slate-500">RUT: {p.rut}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded uppercase">
                  ID: {p.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
