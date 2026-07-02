import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { Activity, ShieldAlert, Heart, Calendar, Home, Search, Clipboard } from 'lucide-react';

interface SCR05Props {
  currentRole: UserRole;
}

interface PacienteHosp {
  id: number;
  paciente: string;
  especie: string;
  sala: string;
  estado: 'crítico' | 'estable';
  ingreso: string;
  diagnostico: string;
  encargado: string;
  signosPrevios: { fecha: string; sat: number; sis: number; dia: number; temp: number }[];
}

export const MonitoreoHospitalizacion: React.FC<SCR05Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [selectedHospId, setSelectedHospId] = useState<string>('');
  
  // Signos vitales del formulario
  const [sat, setSat] = useState(98);
  const [sis, setSis] = useState(120);
  const [dia, setDia] = useState(80);
  const [temp, setTemp] = useState(38.5);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pacientes reales hospitalizados semilla
  const [pacientesHosp, setPacientesHosp] = useState<PacienteHosp[]>([
    {
      id: 1,
      paciente: 'Thor',
      especie: 'Canino (Husky)',
      sala: 'Box Emergencia 1',
      estado: 'crítico',
      ingreso: '2026-06-29 15:30',
      diagnostico: 'Trauma torácico severo y shock hipovolémico secundario a atropello.',
      encargado: 'Dr. John Doe',
      signosPrevios: [
        { fecha: '2026-07-01 10:30', sat: 95, sis: 110, dia: 70, temp: 38.2 },
        { fecha: '2026-07-01 12:30', sat: 97, sis: 115, dia: 75, temp: 38.4 }
      ]
    },
    {
      id: 2,
      paciente: 'Mimi',
      especie: 'Felino (Siamés)',
      sala: 'Box Felinos',
      estado: 'estable',
      ingreso: '2026-06-29 11:00',
      diagnostico: 'Insuficiencia renal crónica reagudizada. Deshidratación severa.',
      encargado: 'Dra. Jane Smith',
      signosPrevios: [
        { fecha: '2026-07-01 09:00', sat: 99, sis: 120, dia: 80, temp: 37.9 },
        { fecha: '2026-07-01 13:00', sat: 98, sis: 122, dia: 82, temp: 38.1 }
      ]
    },
    {
      id: 3,
      paciente: 'Coco',
      especie: 'Canino (Poodle)',
      sala: 'Sala Recuperación A',
      estado: 'estable',
      ingreso: '2026-06-30 08:15',
      diagnostico: 'Monitoreo post-quirúrgico inmediato tras enterectomía por cuerpo extraño.',
      encargado: 'Dr. John Doe',
      signosPrevios: [
        { fecha: '2026-07-01 08:30', sat: 97, sis: 125, dia: 85, temp: 38.8 }
      ]
    }
  ]);

  const selectedPaciente = pacientesHosp.find(p => p.id.toString() === selectedHospId);

  const registrarSignos = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedHospId) {
      setErrorMsg('Por favor, selecciona un paciente de la lista primero.');
      return;
    }

    // CH-20 & CH-21: Saturacion
    if (sat < 50 || sat > 100) {
      setErrorMsg('Error CH-20/21: Saturación de oxígeno fuera de rango permitido (50% - 100%).');
      return;
    }

    // CH-22 & CH-23: Presión sistólica
    if (sis < 50 || sis > 250) {
      setErrorMsg('Error CH-22/23: Presión sistólica fuera de rango permitido (50 - 250 mmHg).');
      return;
    }

    // CH-24 & CH-25: Presión diastólica
    if (dia < 30 || dia > 180) {
      setErrorMsg('Error CH-24/25: Presión diastólica fuera de rango permitido (30 - 180 mmHg).');
      return;
    }

    // Registrar en memoria
    const nuevoRegistro = {
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sat,
      sis,
      dia,
      temp
    };

    setPacientesHosp(prev =>
      prev.map(p =>
        p.id.toString() === selectedHospId
          ? { ...p, signosPrevios: [nuevoRegistro, ...p.signosPrevios] }
          : p
      )
    );

    setSuccessMsg(`Signos vitales guardados exitosamente para ${selectedPaciente?.paciente}. Monitoreo registrado.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        {/* Selector Superior */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5.5 w-5.5 text-indigo-600" />
              <span>Monitoreo y Aforo Clínico</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Control de aforo clínico de hospitalización y monitoreo de pacientes críticos en tiempo real.</p>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="hosp-select" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Seleccionar Paciente:</label>
            <select
              id="hosp-select"
              value={selectedHospId}
              onChange={e => {
                setSelectedHospId(e.target.value);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="">-- Selecciona un Paciente --</option>
              {pacientesHosp.map(p => (
                <option key={p.id} value={p.id}>{p.paciente} ({p.sala})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedPaciente ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Detalles del Paciente */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2 text-left">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {selectedPaciente.paciente[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{selectedPaciente.paciente}</h2>
                      <p className="text-xs text-slate-400">{selectedPaciente.especie}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    selectedPaciente.estado === 'crítico'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {selectedPaciente.estado}
                  </span>
                </div>
              </div>

              {/* Grid Información */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Sala Asignada</span>
                  <span className="text-slate-700 font-semibold text-sm mt-0.5 block flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-slate-400" />
                    {selectedPaciente.sala}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Fecha y Hora de Ingreso</span>
                  <span className="text-slate-700 font-semibold text-sm mt-0.5 block flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {selectedPaciente.ingreso}
                  </span>
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Diagnóstico Médico</span>
                <p className="text-slate-650 text-xs leading-relaxed font-medium">{selectedPaciente.diagnostico}</p>
              </div>

              {/* Historial de Signos */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clipboard className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Bitácora de Monitoreo Reciente</span>
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-250">
                      <tr>
                        <th className="px-4 py-2.5">Fecha</th>
                        <th className="px-4 py-2.5">Saturación O₂</th>
                        <th className="px-4 py-2.5">Presión</th>
                        <th className="px-4 py-2.5">Temperatura</th>
                        <th className="px-4 py-2.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedPaciente.signosPrevios.map((sig, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium">{sig.fecha}</td>
                          <td className="px-4 py-2.5">{sig.sat}%</td>
                          <td className="px-4 py-2.5">{sig.sis}/{sig.dia} mmHg</td>
                          <td className="px-4 py-2.5">{sig.temp} °C</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${sig.sat < 90 || sig.temp > 39.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              <Heart className="h-3 w-3 fill-current" />
                              {sig.sat < 90 || sig.temp > 39.5 ? 'Alerta' : 'Estable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Registrar Signos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Heart className="h-4.5 w-4.5 text-rose-500" />
                <span>Registrar Signos Vitales</span>
              </h3>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-xl">
                  {successMsg}
                </div>
              )}

              <form onSubmit={registrarSignos} className="space-y-4 text-left">
                <div>
                  <label htmlFor="saturacion-input" className="block text-xs font-semibold text-slate-550 mb-1">Saturación O₂ (%)</label>
                  <input
                    id="saturacion-input"
                    type="number"
                    required
                    value={sat}
                    onChange={e => setSat(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="presion-sis-input" className="block text-xs font-semibold text-slate-550 mb-1">P. Sistólica (mmHg)</label>
                    <input
                      id="presion-sis-input"
                      type="number"
                      required
                      value={sis}
                      onChange={e => setSis(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="presion-dia-input" className="block text-xs font-semibold text-slate-550 mb-1">P. Diastólica (mmHg)</label>
                    <input
                      id="presion-dia-input"
                      type="number"
                      required
                      value={dia}
                      onChange={e => setDia(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="temperatura-input" className="block text-xs font-semibold text-slate-550 mb-1">Temperatura (°C)</label>
                  <input
                    id="temperatura-input"
                    type="number"
                    step="0.1"
                    required
                    value={temp}
                    onChange={e => setTemp(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Activity className="h-4 w-4" />
                  <span>Guardar Monitoreo</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Ningún paciente seleccionado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Selecciona un paciente internado en el menú superior para ver su historial médico y registrar nuevos monitoreos de signos vitales.</p>
            </div>
          </div>
        )}
      </div>
    </StateWrapper>
  );
};
