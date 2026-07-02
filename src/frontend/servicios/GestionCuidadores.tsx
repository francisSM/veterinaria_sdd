import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR30Props {
  currentRole: UserRole;
}

export const GestionCuidadores: React.FC<SCR30Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [cargo, setCargo] = useState('cuidador');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [personal, setPersonal] = useState([
    { id: 1, nombre: 'Carlos Ruiz', rut: '18392019-K', cargo: 'cuidador' },
    { id: 2, nombre: 'Roberto Jara', rut: '17291837-2', cargo: 'estilista' }
  ]);

  const registrarPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nombre || !rut) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    // CH-96: RUT personal len >= 9
    if (rut.trim().length < 9) {
      setErrorMsg('Error CH-96: El RUT del personal debe poseer al menos 9 caracteres de longitud.');
      return;
    }

    // CH-87: cargo check
    const cargosValidos = ['cuidador', 'estilista', 'mixto'];
    if (!cargosValidos.includes(cargo)) {
      setErrorMsg('Error CH-87: Cargo del cuidador/estilista invalido.');
      return;
    }

    const nuevo = {
      id: personal.length + 1,
      nombre,
      rut,
      cargo
    };

    setPersonal([...personal, nuevo]);
    setSuccessMsg(`Personal '${nombre}' registrado con éxito en la guardería.`);
    setNombre('');
    setRut('');
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registro Personal */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Registrar Cuidadores / Estilistas</h2>
          <p className="text-slate-500 text-xs">Crea fichas del personal del hotel y salón de estética (L5/CH-87/96).</p>

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

          <form onSubmit={registrarPersonal} className="space-y-4">
            <div>
              <label htmlFor="staff-name-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre Completo</label>
              <input
                id="staff-name-input"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Carlos Ruiz"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="staff-rut-input" className="block text-xs font-semibold text-slate-400 mb-1.5">RUT Personal (CH-96)</label>
              <input
                id="staff-rut-input"
                type="text"
                value={rut}
                onChange={e => setRut(e.target.value)}
                placeholder="Ej: 18392019-K"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cargo-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Cargo (CH-87)</label>
              <select
                id="cargo-select"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="cuidador">Cuidador de Hotel</option>
                <option value="estilista">Estilista de Peluquería</option>
                <option value="mixto">Mixto (Ambas funciones)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Registrar Personal
            </button>
          </form>
        </div>

        {/* Listado Personal */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-200">Personal Registrado</h2>
          <p className="text-slate-500 text-xs">Para resguardar el bienestar, se debe respetar el límite de aforo de 1 cuidador por cada 8 mascotas (BR-51).</p>
          <div className="space-y-2">
            {personal.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{p.nombre}</h3>
                  <span className="text-[10px] text-slate-500">RUT: {p.rut}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded uppercase">
                  Cargo: {p.cargo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
