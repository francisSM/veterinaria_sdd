import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Utensils } from 'lucide-react';
import { BuscadorClientePaciente, Propietario, Paciente } from '../components/BuscadorClientePaciente';

interface SCR27Props { currentRole: UserRole; token?: string; }

export const DietasEspeciales: React.FC<SCR27Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  // Formulario
  const [tipoAlimento, setTipoAlimento] = useState('hipoalergenico');
  const [porcionGramos, setPorcionGramos] = useState(250);
  const [alergias, setAlergias] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  const registrarDieta = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedPac) {
      setErrorMsg('Debe seleccionar una mascota para registrar su dieta.');
      return;
    }

    // CH-90 & CH-91: Porcionamiento y limites
    if (porcionGramos <= 0 || porcionGramos > 2000) {
      setErrorMsg('Error CH-90/91: La porcion de alimento debe estar entre 1 y 2000 gramos.');
      return;
    }

    setSuccessMsg(`Ficha de dieta especial configurada exitosamente para ${selectedPac.nombre}.`);

    // Limpiar formulario
    setSelectedProp(null);
    setSelectedPac(null);
    setAlergias('');
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dietas Especiales y Alergias</h1>
            <p className="text-slate-500 text-xs">Asignación de porciones y tipos de alimentos según indicaciones de veterinario (L5/CH-90).</p>
          </div>
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        <form onSubmit={registrarDieta} className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TIPO ALIMENTO */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Tipo de Alimento</label>
              <select value={tipoAlimento} onChange={e => setTipoAlimento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none">
                <option value="hipoalergenico">Hipoalergénico H/D</option>
                <option value="renal">Renal R/D</option>
                <option value="gastrointestinal">Gastrointestinal G/D</option>
                <option value="barf">Dieta Cruda BARF</option>
                <option value="senior">Senior Receta Light</option>
              </select>
            </div>

            {/* PORCION */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Porción por Ración (Gramos) (CH-90)</label>
              <input type="number" value={porcionGramos} onChange={e => setPorcionGramos(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"/>
            </div>
          </div>

          {/* ALERGIAS */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Alergias o Restricciones Clínicas</label>
            <textarea rows={2} value={alergias} onChange={e => setAlergias(e.target.value)} placeholder="Ej: Alérgico a proteína de pollo, restricción de sodio..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none resize-none"/>
          </div>

          <button type="submit" disabled={!selectedPac} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm">
            Registrar Dieta y Alergias
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};