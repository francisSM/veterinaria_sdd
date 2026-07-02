import React, { useState, useMemo } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Sparkles, Clock } from 'lucide-react';
import { BuscadorClientePaciente, Propietario, Paciente } from '../components/BuscadorClientePaciente';

interface SCR29Props { currentRole: UserRole; token?: string; }

// ─────────────────────────────────────────────
// Catálogo de servicios por especie
// ─────────────────────────────────────────────
const SERVICIOS_CANINO = [
  { id: 'c1', label: 'Corte y Baño Completo — Canino',              duracionMin: 90  },
  { id: 'c2', label: 'Baño Higiénico y Secado — Canino',            duracionMin: 60  },
  { id: 'c3', label: 'Corte de Uñas y Limpieza de Oídos — General', duracionMin: 30  },
  { id: 'c4', label: 'Desenredado y Cardado Avanzado — Canino',     duracionMin: 120 },
  { id: 'c5', label: 'Baño Medicado / Anti-pulgas — Canino',        duracionMin: 75  },
];

const SERVICIOS_FELINO = [
  { id: 'f1', label: 'Corte y Baño de Higiene — Felino',                  duracionMin: 75  },
  { id: 'f2', label: 'Baño Higiénico y Secado Silencioso — Felino',       duracionMin: 60  },
  { id: 'f3', label: 'Corte de Uñas y Limpieza de Oídos — General',       duracionMin: 30  },
  { id: 'f4', label: 'Cepillado y Eliminación de Pelo Muerto — Felino',   duracionMin: 45  },
  { id: 'f5', label: 'Tratamiento Anti-enredos y Cardado — Felino',       duracionMin: 90  },
];

const SERVICIOS_GENERAL = [
  { id: 'g1', label: 'Baño Higiénico Básico — General',           duracionMin: 45 },
  { id: 'g2', label: 'Corte de Uñas y Limpieza de Oídos — General', duracionMin: 30 },
];

// ─────────────────────────────────────────────
// Horarios disponibles (09:00 – 18:00, cada 15 min)
// ─────────────────────────────────────────────
const HORA_INICIO_MIN = 9 * 60;   // 09:00
const HORA_FIN_MIN    = 18 * 60;  // 18:00
const PASO_MIN        = 15;
const BUFFER_MIN      = 30;       // buffer de aproximación tras el fin del servicio

const generarSlots = (): string[] => {
  const slots: string[] = [];
  for (let m = HORA_INICIO_MIN; m <= HORA_FIN_MIN; m += PASO_MIN) {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    slots.push(`${h}:${min}`);
  }
  return slots;
};

const SLOTS = generarSlots();

const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number): string => {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
};

// ─────────────────────────────────────────────
// Tipo para reservas internas (sesión)
// ─────────────────────────────────────────────
interface ReservaLocal {
  fecha: string;
  horaInicio: string;
  duracionMin: number;
  pacienteNombre: string;
  servicio: string;
}

export const AgendaEstetica: React.FC<SCR29Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);
  const [selectedPac, setSelectedPac] = useState<Paciente | null>(null);

  // Formulario
  const [estilistaId, setEstilistaId] = useState('1');
  const [servicioId, setServicioId]   = useState('');
  const [fecha, setFecha]             = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [costo, setCosto]           = useState(18000);

  const [errorMsg, setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reservas guardadas en sesión para calcular bloqueos
  const [reservasLocales, setReservasLocales] = useState<ReservaLocal[]>([]);

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  // ─── Catálogo de servicios según especie ───────────────
  const catalogoServicios = useMemo(() => {
    if (!selectedPac) return SERVICIOS_GENERAL;
    if (selectedPac.especie === 'canino') return SERVICIOS_CANINO;
    if (selectedPac.especie === 'felino') return SERVICIOS_FELINO;
    return SERVICIOS_GENERAL;
  }, [selectedPac]);

  // Reiniciar servicio seleccionado cuando cambia la mascota
  const handleSelectPaciente = (prop: Propietario | null, pac: Paciente | null) => {
    setSelectedProp(prop);
    setSelectedPac(pac);
    setServicioId('');   // limpiar selección previa
    setErrorMsg('');
  };

  const servicioSeleccionado = catalogoServicios.find(s => s.id === servicioId);
  const duracionMin = servicioSeleccionado?.duracionMin ?? 60;

  // ─── Calcular slots bloqueados para la fecha seleccionada ──
  const slotsOcupados = useMemo(() => {
    const reservasDelDia = reservasLocales.filter(r => r.fecha === fecha);
    const bloqueados = new Set<string>();
    for (const r of reservasDelDia) {
      const ini = timeToMinutes(r.horaInicio);
      const fin = ini + r.duracionMin + BUFFER_MIN;
      for (let m = ini; m < fin; m += PASO_MIN) {
        bloqueados.add(minutesToTime(m));
      }
    }
    return bloqueados;
  }, [reservasLocales, fecha]);

  // Calcular hora estimada de fin del servicio que se está agendando
  const horaFinEstimada = useMemo(() => {
    if (!servicioSeleccionado) return '';
    const finMin = timeToMinutes(horaInicio) + duracionMin;
    return minutesToTime(Math.min(finMin, HORA_FIN_MIN));
  }, [horaInicio, duracionMin, servicioSeleccionado]);

  // ─── Handler del formulario ────────────────────────────
  const agendarEstetica = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedPac) {
      setErrorMsg('Debe seleccionar una mascota.');
      return;
    }
    if (!servicioId) {
      setErrorMsg('Debe seleccionar un servicio de estética.');
      return;
    }
    if (slotsOcupados.has(horaInicio)) {
      setErrorMsg(`El horario ${horaInicio} ya está ocupado para el ${fecha}. Seleccione otra hora.`);
      return;
    }
    if (costo < 0) {
      setErrorMsg('El costo del servicio no puede ser negativo (CH-92).');
      return;
    }

    // Guardar reserva local
    const nueva: ReservaLocal = {
      fecha,
      horaInicio,
      duracionMin,
      pacienteNombre: selectedPac.nombre,
      servicio: servicioSeleccionado?.label ?? '',
    };
    setReservasLocales(prev => [...prev, nueva]);

    setSuccessMsg(
      `✔ Cita agendada: ${selectedPac.nombre} — "${servicioSeleccionado?.label}" el ${fecha} a las ${horaInicio} ` +
      `(fin estimado: ~${horaFinEstimada}).`
    );
    // Reset
    setSelectedProp(null);
    setSelectedPac(null);
    setServicioId('');
  };

  const especieLabel: Record<string, string> = {
    canino: '🐕 Canino',
    felino: '🐈 Felino',
    exotico: '🦜 Exótico',
    equino: '🐴 Equino',
  };

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">

        {/* CABECERA */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Agenda de Peluquería y Estética</h1>
            <p className="text-slate-500 text-xs">Reserva de turno con servicios filtrados por especie y horarios con control de disponibilidad.</p>
          </div>
        </div>

        {errorMsg   && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        <form onSubmit={agendarEstetica} className="space-y-5">

          {/* BUSCADOR CLIENTE / MASCOTA */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <BuscadorClientePaciente token={activeToken} onSelect={handleSelectPaciente} />
            {selectedPac && (
              <div className="mt-2 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs text-indigo-700 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Mascota: <span className="font-bold">{selectedPac.nombre}</span>
                &nbsp;·&nbsp;
                {especieLabel[selectedPac.especie] ?? selectedPac.especie}
                &nbsp;·&nbsp;{selectedPac.raza}
                <span className="ml-auto text-[10px] font-medium text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Servicios para {selectedPac.especie}
                </span>
              </div>
            )}
          </div>

          {/* SERVICIO según especie */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Servicio de Estética
              {selectedPac && (
                <span className="ml-2 normal-case font-medium text-indigo-500">
                  ({especieLabel[selectedPac.especie] ?? selectedPac.especie})
                </span>
              )}
            </label>
            <select
              value={servicioId}
              onChange={e => setServicioId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="" disabled>— Seleccione un servicio —</option>
              {catalogoServicios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}  ({s.duracionMin} min)
                </option>
              ))}
            </select>
            {!selectedPac && (
              <p className="text-[10px] text-slate-400 mt-1 italic">Seleccione primero una mascota para ver los servicios disponibles para su especie.</p>
            )}
          </div>

          {/* ESTILISTA */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Estilista / Esteticista</label>
            <select
              value={estilistaId}
              onChange={e => setEstilistaId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="1">Carlos R. — Especialista en Felinos</option>
              <option value="2">Marta V. — Cortes de Raza Canina</option>
              <option value="3">Juan P. — Baños, Cardados y General</option>
            </select>
          </div>

          {/* FECHA + HORA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Fecha de la Reserva</label>
              <input
                type="date"
                value={fecha}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => { setFecha(e.target.value); setHoraInicio('09:00'); }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Hora con control de disponibilidad */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Hora de Inicio
              </label>
              <select
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
              >
                {SLOTS.map(slot => {
                  const ocupado = slotsOcupados.has(slot);
                  return (
                    <option key={slot} value={slot} disabled={ocupado}>
                      {slot}{ocupado ? '  ✖ No disponible' : ''}
                    </option>
                  );
                })}
              </select>
              {servicioSeleccionado && (
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duración: <strong>{duracionMin} min</strong>
                  &nbsp;→&nbsp;Fin estimado: <strong>{horaFinEstimada}</strong>
                  &nbsp;·&nbsp;Próximo slot disponible: <strong>{minutesToTime(timeToMinutes(horaInicio) + duracionMin + BUFFER_MIN)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* COSTO */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Costo del Servicio ($) (CH-92)</label>
            <input
              type="number"
              value={costo}
              min={0}
              onChange={e => setCosto(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* RESERVAS DEL DÍA (panel informativo) */}
          {reservasLocales.filter(r => r.fecha === fecha).length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Citas ya agendadas para el {fecha}</p>
              {reservasLocales.filter(r => r.fecha === fecha).map((r, i) => {
                const finMin = timeToMinutes(r.horaInicio) + r.duracionMin;
                const bloqHasta = minutesToTime(finMin + BUFFER_MIN);
                return (
                  <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px]">
                    <span className="font-semibold text-slate-700">{r.horaInicio} — {r.pacienteNombre}</span>
                    <span className="text-slate-500">{r.servicio}</span>
                    <span className="text-rose-500 font-semibold">Bloq. hasta {bloqHasta}</span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedPac || !servicioId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Agendar Servicio de Estética
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};