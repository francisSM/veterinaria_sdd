import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR29Props {
  currentRole: UserRole;
}

export const SCR29_AgendaEstetica: React.FC<SCR29Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [pacienteId, setPacienteId] = useState('');
  const [estilistaId, setEstilistaId] = useState('1');
  const [servicioId, setServicioId] = useState('1');
  const [fechaHora, setFechaHora] = useState('2026-06-30T10:00');
  const [costo, setCosto] = useState(18000);
  const [duracion, setDuracion] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const agendarEstetica = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pacienteId || !fechaHora) {
      setErrorMsg('Debe seleccionar o ingresar el ID del paciente y la fecha/hora.');
      return;
    }

    // CH-88 & CH-89: Duracion
    if (duracion < 15 || duracion > 180) {
      setErrorMsg('Error CH-88/89: La duracion estimada del servicio de estética debe estar entre 15 y 180 minutos.');
      return;
    }

    // CH-92: Tarifa / Costo
    if (costo < 0) {
      setErrorMsg('Error CH-92: La tarifa del servicio no puede ser negativa.');
      return;
    }

    setSuccessMsg(`Cita de peluquería/grooming agendada con éxito para la fecha ${fechaHora}.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'recepcionista']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Agenda de Estética y Grooming</h1>
          <p className="text-slate-400 text-xs">Agendamiento de turnos para servicios de baño, corte y peinado de mascotas (L5/BR-54/CH-88).</p>
        </div>

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

        <form onSubmit={agendarEstetica} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="paciente-id-grooming" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Paciente</label>
              <input
                id="paciente-id-grooming"
                type="text"
                value={pacienteId}
                onChange={e => setPacienteId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="estilista-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Estilista / Peluquero</label>
              <select
                id="estilista-select"
                value={estilistaId}
                onChange={e => setEstilistaId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Roberto Jara (Estilista Senior)</option>
                <option value="2">Marta Soto (Estilista Junior)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grooming-service-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Servicio Grooming</label>
              <select
                id="grooming-service-select"
                value={servicioId}
                onChange={e => setServicioId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Baño Completo e Higiene Dental</option>
                <option value="2">Corte de pelo Raza y Estilo</option>
                <option value="3">Corte de Uñas y Limpieza Oídos</option>
              </select>
            </div>
            <div>
              <label htmlFor="grooming-datetime-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Fecha y Hora Cita</label>
              <input
                id="grooming-datetime-input"
                type="datetime-local"
                value={fechaHora}
                onChange={e => setFechaHora(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Duración Estimada (Minutos)</label>
              <input
                id="duration-input"
                type="number"
                value={duracion}
                onChange={e => setDuracion(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="costo-grooming-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Costo Tarifa ($ CLP)</label>
              <input
                id="costo-grooming-input"
                type="number"
                value={costo}
                onChange={e => setCosto(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Agendar Servicio Estético
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
