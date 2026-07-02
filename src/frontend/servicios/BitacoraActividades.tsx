import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { Calendar, Clock, RefreshCw, AlertCircle, CheckCircle, Search, Plus, Shield, Check, Pill, Activity, User, BookOpen } from 'lucide-react';

interface Cita {
  id: number;
  tipo: "clinica" | "domicilio";
  fecha: string;
  bloque: string;
  motivo: string;
  estado: string;
  veterinarioAsignadoId?: number;
  pacienteNombre: string;
  propietarioNombre: string;
}

interface Veterinario {
  id: number;
  nombre: string;
  licenciaMedica: string;
}

interface TurnoCuidador {
  id: number;
  cuidadorNombre: string;
  rut: string;
  fechaTurno: string;
  turnoTipo: "mañana" | "tarde" | "noche";
}

interface ActividadGuarderia {
  id: number;
  reservaId: number;
  tipoActividad: 'alimentacion' | 'recreacion' | 'medicacion' | 'descanso';
  horaRegistro: string;
  comentario: string | null;
  pacienteNombre: string;
}

interface ReservaGuarderia {
  id: number;
  pacienteId: number;
  estado: string;
  pacienteNombre?: string;
}

interface Paciente {
  id: number;
  nombre: string;
}

interface SCR28Props {
  currentRole: UserRole;
}

const toLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const BitacoraActividades: React.FC<SCR28Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [fechaFiltro, setFechaFiltro] = useState(toLocalDate(new Date()));

  // Listas del Backend
  const [citas, setCitas] = useState<Cita[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [turnos, setTurnos] = useState<TurnoCuidador[]>([]);
  const [actividades, setActividades] = useState<ActividadGuarderia[]>([]);
  const [reservas, setReservas] = useState<ReservaGuarderia[]>([]);

  // Registro de Nueva Actividad en el hotel
  const [selectedReservaId, setSelectedReservaId] = useState('');
  const [tipoActividad, setTipoActividad] = useState<'alimentacion' | 'recreacion' | 'medicacion' | 'descanso'>('alimentacion');
  const [comentario, setComentario] = useState('');

  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const loadData = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resCitas, resVets, resTurnos, resAct, resResv, resPac] = await Promise.all([
        fetch('/api/v1/citas', { headers }),
        fetch('/api/v1/clinica/veterinarios', { headers }),
        fetch('/api/v1/servicios/turnos-cuidadores', { headers }),
        fetch('/api/v1/servicios/actividades', { headers }),
        fetch('/api/v1/servicios/reservas', { headers }),
        fetch('/api/v1/clinica/pacientes', { headers })
      ]);

      if (resCitas.ok) {
        const d = await resCitas.json();
        setCitas(d.citas || []);
      }
      if (resVets.ok) setVets(await resVets.json());
      if (resTurnos.ok) setTurnos(await resTurnos.json());
      if (resAct.ok) setActividades(await resAct.json());
      
      if (resResv.ok && resPac.ok) {
        const listRes: ReservaGuarderia[] = await resResv.json();
        const listPac: Paciente[] = await resPac.json();
        const enrichedRes = listRes.map(r => {
          const pac = listPac.find(p => p.id === r.pacienteId);
          return { ...r, pacienteNombre: pac ? pac.nombre : `Paciente #${r.pacienteId}` };
        });
        setReservas(enrichedRes.filter(r => r.estado === 'activa'));
        if (enrichedRes.length > 0) {
          setSelectedReservaId(enrichedRes[0].id.toString());
        }
      }
    } catch {
      setErrorMsg('Error de red al sincronizar las bitácoras diarias.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegistrarActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedReservaId) {
      setErrorMsg('Debe seleccionar un huésped/reserva de guardería activa.');
      return;
    }

    try {
      setUxState('loading');
      const response = await fetch('/api/v1/servicios/actividades', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reservaId: Number(selectedReservaId),
          tipoActividad,
          comentario
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Error al guardar la actividad.');
        setUxState('data');
        return;
      }

      setSuccessMsg(`Actividad de "${tipoActividad}" registrada con éxito.`);
      setComentario('');
      await loadData();
      setUxState('data');
    } catch (err: any) {
      setErrorMsg(err.message);
      setUxState('data');
    }
  };

  // Filtrado de citas por veterinario en la fecha seleccionada
  const getCitasVeterinario = (vetId: number) => {
    return citas.filter(c => c.veterinarioAsignadoId === vetId && c.fecha === fechaFiltro && c.estado !== 'cancelada');
  };

  // Filtrado de turnos de cuidadores
  const getTurnosCuidadoresDia = () => {
    return turnos.filter(t => t.fechaTurno.split('T')[0] === fechaFiltro);
  };

  // Filtrado de actividades de hotel/guardería registradas en la fecha seleccionada
  const getActividadesDia = () => {
    return actividades.filter(act => act.horaRegistro.startsWith(fechaFiltro));
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="space-y-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Bitácora de Actividades Diarias</h1>
            <p className="text-xs text-slate-500 mt-0.5">Control y planificación unificada de labores clínicas y hoteleras por fecha.</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadData}
              className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} /> Sincronizar
            </button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => setFechaFiltro(toLocalDate(new Date()))}
                className="px-2.5 py-2 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs rounded-lg font-bold hover:bg-indigo-100 transition-colors"
              >
                Hoy
              </button>
            </div>
          </div>
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><AlertCircle className="h-4 w-4" />{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4" />{successMsg}</div>}

        {/* CONTENIDO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA 1: VETERINARIOS DE TURNO (CLÍNICA) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="h-4.5 w-4.5 text-indigo-650" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Actividades Veterinarios</h3>
            </div>

            {vets.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No hay personal médico registrado.</p>
            ) : (
              <div className="space-y-4">
                {vets.map(v => {
                  const citasVet = getCitasVeterinario(v.id);
                  return (
                    <div key={`vet-${v.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-850 flex items-center justify-center text-[10px] font-bold">
                            {v.nombre[0]}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{v.nombre}</h4>
                            <p className="text-[9px] text-slate-450 font-semibold">{v.licenciaMedica}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          citasVet.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {citasVet.length > 0 ? `${citasVet.length} consultas` : 'Disponible'}
                        </span>
                      </div>

                      {citasVet.length === 0 ? (
                        <p className="text-[10px] text-emerald-600 italic bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg text-center font-medium">
                          🟢 Disponible para consultas o cirugías.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {citasVet.map(c => (
                            <div key={`cita-${c.id}`} className="bg-white border border-slate-200 p-2.5 rounded-lg text-[11px] leading-relaxed">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-800">{c.bloque}</span>
                                <span className="text-[8px] font-black px-1.5 py-0.2 rounded border bg-indigo-50 text-indigo-800 border-indigo-100 uppercase">
                                  {c.tipo}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-700">Mascota: <strong className="text-indigo-650 font-black">{c.pacienteNombre}</strong></p>
                              <p className="text-[10px] text-slate-450 truncate">Motivo: {c.motivo}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMNA 2: CUIDADORES Y BITÁCORA DE HÓSPED (GUARDERÍA) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="h-4.5 w-4.5 text-emerald-650" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Actividades Cuidadores y Bitácora Hotel</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Turnos de Cuidadores */}
              <div className="md:col-span-1 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cuidadores de Turno
                </span>
                
                {getTurnosCuidadoresDia().length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                    Sin turnos asignados hoy.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getTurnosCuidadoresDia().map(t => (
                      <div key={`turno-${t.id}`} className="bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-xs leading-relaxed">
                        <div className="font-bold text-slate-800 truncate">{t.cuidadorNombre}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Turno: {t.turnoTipo}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario rápido para registrar actividades en caliente (Hotel) */}
                {reservas.length > 0 && (
                  <form onSubmit={handleRegistrarActividad} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3.5 pt-4 text-xs">
                    <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Registrar Actividad
                    </span>
                    
                    <div>
                      <label className="block text-slate-500 mb-1">Huésped</label>
                      <select
                        value={selectedReservaId}
                        onChange={e => setSelectedReservaId(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded p-1.5 focus:outline-none"
                      >
                        {reservas.map(r => (
                          <option key={`resv-opt-${r.id}`} value={r.id}>{r.pacienteNombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Acción</label>
                      <select
                        value={tipoActividad}
                        onChange={e => setTipoActividad(e.target.value as any)}
                        className="w-full bg-white border border-slate-205 rounded p-1.5 focus:outline-none capitalize"
                      >
                        <option value="alimentacion">Alimentación</option>
                        <option value="recreacion">Recreación</option>
                        <option value="medicacion">Medicación</option>
                        <option value="descanso">Descanso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Comentario</label>
                      <textarea
                        required
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        placeholder="Ej: Ración consumida..."
                        rows={2}
                        className="w-full bg-white border border-slate-205 rounded p-1.5 focus:outline-none text-[11px] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[10px] uppercase flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Guardar
                    </button>
                  </form>
                )}
              </div>

              {/* Bitácora de Labores diarias */}
              <div className="md:col-span-2 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hoja de Ruta y Bitácora Hotelera
                </span>

                {getActividadesDia().length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-xs text-slate-400 italic">
                    Sin actividades de hotel registradas en esta fecha.
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-slate-200 space-y-4 text-xs">
                    {getActividadesDia().map(act => (
                      <div key={`act-${act.id}`} className="relative space-y-0.5">
                        <span className="absolute -left-[29px] top-1 h-3.5 w-3.5 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-[7px] text-emerald-600 font-black">
                          ✓
                        </span>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-450">
                          <span>Hora: {new Date(act.horaRegistro).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-bold text-indigo-650">Huésped: {act.pacienteNombre}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 capitalize text-xs">{act.tipoActividad}</h4>
                          <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1 py-0.2 rounded font-semibold uppercase">
                            Registrado
                          </span>
                        </div>

                        {act.comentario && (
                          <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 border border-slate-100 p-2 rounded-lg">
                            {act.comentario}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </StateWrapper>
  );
};
