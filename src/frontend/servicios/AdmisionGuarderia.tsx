import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Clipboard } from 'lucide-react';
import { BuscadorClientePaciente, Propietario, Paciente } from '../components/BuscadorClientePaciente';

interface SCR25Props { currentRole: UserRole; token?: string; }

export const AdmisionGuarderia: React.FC<SCR25Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  const [temperatura, setTemperatura] = useState(38.2);
  const [peso, setPeso] = useState(15.5);
  const [vacunasAlDia, setVacunasAlDia] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  const realizarCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedPac) {
      setErrorMsg('Debe seleccionar una mascota para el check-in.');
      return;
    }

    // BR-46: Vacunas al día
    if (!vacunasAlDia) {
      setErrorMsg('Error BR-46: No se permite el check-in de una mascota en guarderia/hotel sin vacunas obligatorias al dia.');
      return;
    }

    // CH-81 & CH-82: Temperatura ingreso
    if (temperatura < 35.0 || temperatura > 42.0) {
      setErrorMsg('Error CH-81/82: Temperatura de ingreso fuera de limites fisiologicos (35.0 - 42.0 C).');
      return;
    }

    // CH-97: Peso ingreso > 0
    if (peso <= 0.0) {
      setErrorMsg('Error CH-97: El peso de ingreso de la mascota debe ser mayor a 0.0.');
      return;
    }

    setSuccessMsg(`Check-in de hotel completado con éxito para ${selectedPac.nombre}. Admisión registrada en sistema.`);

    // Limpiar formulario
    setSelectedProp(null);
    setSelectedPac(null);
    setVacunasAlDia(false);
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Clipboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Admisión y Check-in de Guardería</h1>
            <p className="text-slate-500 text-xs">Registro y control de constantes biológicas al ingreso del hotel (L5/BR-46/CH-81).</p>
          </div>
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        <form onSubmit={realizarCheckin} className="space-y-4">
          {/* BUSCADOR DE CLIENTE Y MASCOTA INTEGRADO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <BuscadorClientePaciente
              token={activeToken}
              onSelect={(prop, pac) => {
                setSelectedProp(prop);
                setSelectedPac(pac);
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* CONSTANTE: TEMPERATURA */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Temperatura de Ingreso (°C) (CH-81)</label>
              <input type="number" step="0.1" value={temperatura} onChange={e => setTemperatura(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
            </div>

            {/* CONSTANTE: PESO */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Peso de Ingreso (kg) (CH-97)</label>
              <input type="number" step="0.1" value={peso} onChange={e => setPeso(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
            </div>
          </div>

          {/* VACUNAS CHECKBOX */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold select-none cursor-pointer">
              <input type="checkbox" checked={vacunasAlDia} onChange={e => setVacunasAlDia(e.target.checked)} className="accent-indigo-600 h-4 w-4 bg-slate-50 border border-slate-200 rounded"/>
              ¿Vacunas obligatorias al día? (BR-46)
            </label>
          </div>

          <button type="submit" disabled={!selectedPac} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
            Completar Check-in de Guardería
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};