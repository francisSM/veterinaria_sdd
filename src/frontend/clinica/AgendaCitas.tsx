import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, MapPin, Home, Stethoscope, CheckCircle, XCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, User, ClipboardList, RefreshCw, Check, X, Shield, Users, Briefcase } from "lucide-react";
import { StateWrapper } from "../StateWrapper";

interface CitaEnriquecida {
  id: number;
  propietarioId: number;
  pacienteId: number;
  tipo: "clinica" | "domicilio";
  fecha: string;
  bloque: string;
  motivo: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  veterinarioAsignadoId?: number;
  motivoCancelacion?: string;
  tarifaEstimada: number;
  creadaEn: string;
  pacienteNombre: string;
  pacienteEspecie: string;
  propietarioNombre: string;
  propietarioEmail: string;
  veterinarioNombre?: string | null;
}

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
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

interface Props {
  currentRole: "administrador" | "veterinario" | "cliente";
  token: string;
  currentUser: { id: number; nombre: string; email: string; rol: string } | null;
}

const ESTADO_BADGE: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmada: { label: "Confirmada", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  cancelada: { label: "Cancelada", cls: "bg-rose-50 text-rose-700 border border-rose-200" },
  completada: { label: "Completada", cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" }
};

const fmt = (fecha: any) => {
  if (!fecha) return "(sin fecha)";
  let d: Date;
  if (fecha instanceof Date) {
    d = fecha;
  } else {
    const str = String(fecha).trim();
    if (str.includes("T")) {
      d = new Date(str);
    } else {
      d = new Date(str + "T12:00:00");
    }
  }
  if (isNaN(d.getTime())) {
    d = new Date(fecha);
  }
  if (isNaN(d.getTime())) {
    return String(fecha);
  }
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
};

const fmtShort = (fecha: string) => {
  const d = new Date(fecha + "T12:00:00");
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
};

const toLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatCLP = (amount: number): string => {
  return Math.round(amount).toLocaleString('es-CL');
};

export const AgendaCitas: React.FC<Props> = ({ currentRole, token, currentUser }) => {
  const isCliente = currentRole === "cliente";
  const isStaff = currentRole === "administrador" || currentRole === "veterinario";
  
  const [activeTab, setActiveTab] = useState<"personal" | "calendario" | "citas">(isCliente ? "calendario" : "personal");

  const [citas, setCitas] = useState<CitaEnriquecida[]>([]);
  const [selectedCalendarCita, setSelectedCalendarCita] = useState<CitaEnriquecida | null>(null);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [turnosCuidadores, setTurnosCuidadores] = useState<TurnoCuidador[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Creación de cita
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [fTipo, setFTipo] = useState<"clinica" | "domicilio">("clinica");
  const [fFecha, setFFecha] = useState("");
  const [fBloque, setFBloque] = useState("");
  const [fMascota, setFMascota] = useState("");
  const [fMotivo, setFMotivo] = useState("");
  const [disponibles, setDisponibles] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Modales Staff
  const [confirmModal, setConfirmModal] = useState<CitaEnriquecida | null>(null);
  const [vetAsig, setVetAsig] = useState("");
  const [cancelModal, setCancelModal] = useState<CitaEnriquecida | null>(null);
  const [motivoCancel, setMotivoCancel] = useState("");

  // Filtro de fecha para Agenda de Personal
  const [fechaAgenda, setFechaAgenda] = useState(toLocalDate(new Date()));

  // Calendario Semanal Cliente
  const [clientWeekStart, setClientWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    mon.setHours(0,0,0,0);
    return mon;
  });

  const DIAS_SEMANA_NOM = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const clientWeekDates = DIAS_SEMANA_NOM.map((_, i) => {
    const d = new Date(clientWeekStart);
    d.setDate(clientWeekStart.getDate() + i);
    return toLocalDate(d);
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const today = toLocalDate(new Date());
  const [calMes, setCalMes] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rCitas, rVets, rTurnos] = await Promise.all([
        fetch("/api/v1/citas", { headers }),
        fetch("/api/v1/clinica/veterinarios", { headers }),
        fetch("/api/v1/servicios/turnos-cuidadores", { headers })
      ]);

      let cirugias: any[] = [];
      if (isCliente) {
        try {
          const rc = await fetch("/api/v1/clinica/cirugias", { headers });
          if (rc.ok) {
            const dc = await rc.json();
            cirugias = dc.cirugias || [];
          }
        } catch (e) {
          console.error("Error al cargar cirugías del cliente:", e);
        }
      }

      if (rCitas.ok) {
        const d = await rCitas.json();
        const all: CitaEnriquecida[] = d.citas || [];
        
        // Map client's surgeries into citations array for weekly calendar
        const mappedCirugias: CitaEnriquecida[] = [];
        cirugias.forEach((c: any) => {
          if (!c.fechaHoraCirugia) return;
          const parts = c.fechaHoraCirugia.split(" ");
          if (parts.length < 2) return;
          const fechaStr = parts[0];
          const horaStr = parts[1];
          
          let bloquesOcupados: string[] = [];
          if (horaStr === "09:00") bloquesOcupados = ["09:00-10:00", "10:00-11:00"];
          else if (horaStr === "11:30") bloquesOcupados = ["11:00-12:00", "13:00-14:00"];
          else if (horaStr === "14:00") bloquesOcupados = ["14:00-15:00", "15:00-16:00"];
          else if (horaStr === "16:00") bloquesOcupados = ["16:00-17:00", "17:00-18:00"];
          else if (horaStr === "18:00") bloquesOcupados = ["17:00-18:00"];
          
          bloquesOcupados.forEach((bl, idx) => {
            mappedCirugias.push({
              id: 900000 + c.id * 10 + idx,
              propietarioId: c.propietarioId || 0,
              pacienteId: c.pacienteId || 0,
              tipo: "clinica",
              fecha: fechaStr,
              bloque: bl,
              motivo: `Cirugía: ${c.intervencion || "Procedimiento Quirúrgico"}`,
              estado: "confirmada",
              veterinarioAsignadoId: c.veterinarioId,
              veterinarioNombre: c.veterinarioNombre,
              pacienteNombre: `[Quirófano] ${c.pacienteNombre || "Paciente"}`,
              pacienteEspecie: "",
              propietarioNombre: c.propietarioNombre || "",
              propietarioEmail: "",
              tarifaEstimada: c.costoAdicional || 0,
              creadaEn: new Date().toISOString()
            });
          });
        });

        setCitas([...all, ...mappedCirugias]);
      }
      if (rVets.ok) {
        setVets(await rVets.json());
      }
      if (rTurnos.ok) {
        setTurnosCuidadores(await rTurnos.json());
      }
    } catch (err: any) {
      setError("Error al cargar la información: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isCliente]);

  const fetchMascotas = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/clinica/propietario/perfil", { headers });
      const d = await r.json();
      if (r.ok) setMascotas(d.pacientes || []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    if (isCliente) fetchMascotas();
  }, [isCliente]);

  const fetchDisponibilidad = async (fecha: string) => {
    if (!fecha) return;
    setLoadingSlots(true);
    try {
      const r = await fetch(`/api/v1/citas/disponibilidad?fecha=${fecha}`, { headers });
      const d = await r.json();
      if (r.ok) setDisponibles(d.disponibles || []);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleFechaChange = (f: string) => {
    setFFecha(f);
    setFBloque("");
    if (f) fetchDisponibilidad(f);
  };

  const handleSubmitCita = async () => {
    if (!fMascota || !fFecha || !fBloque || !fMotivo) {
      setError("Completa todos los campos.");
      return;
    }
    setError("");
    try {
      const r = await fetch("/api/v1/citas", {
        method: "POST",
        headers,
        body: JSON.stringify({
          pacienteId: Number(fMascota),
          tipo: fTipo,
          fecha: fFecha,
          bloque: fBloque,
          motivo: fMotivo
        })
      });
      const d = await r.json();
      if (r.ok) {
        setSuccess("Cita agendada. Pendiente de confirmación por el equipo veterinario.");
        setShowForm(false);
        setStep(1);
        setFTipo("clinica");
        setFFecha("");
        setFBloque("");
        setFMascota("");
        setFMotivo("");
        fetchData();
      } else {
        setError(d.error || "Error al agendar cita");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  const handleConfirmar = async () => {
    if (!confirmModal || !vetAsig) {
      setError("Debes seleccionar un veterinario.");
      return;
    }
    setError("");
    try {
      const r = await fetch(`/api/v1/citas/${confirmModal.id}/confirmar`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ veterinarioAsignadoId: Number(vetAsig) })
      });
      const d = await r.json();
      if (r.ok) {
        setSuccess(`Cita confirmada y asignada a ${d.veterinarioNombre}.`);
        setConfirmModal(null);
        setVetAsig("");
        fetchData();
      } else {
        setError(d.error || "Error al confirmar");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  const handleCancelar = async () => {
    if (!cancelModal) return;
    setError("");
    try {
      const r = await fetch(`/api/v1/citas/${cancelModal.id}/cancelar`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ motivoCancelacion: motivoCancel })
      });
      const d = await r.json();
      if (r.ok) {
        setSuccess("Cita cancelada.");
        setCancelModal(null);
        setMotivoCancel("");
        fetchData();
      } else {
        setError(d.error || "Error al cancelar");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  const renderCalendar = () => {
    const firstDay = new Date(calMes.year, calMes.month, 1);
    const lastDay = new Date(calMes.year, calMes.month + 1, 0);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: (number | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 select-none">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setCalMes((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 })} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700">{`${meses[calMes.month]} ${calMes.year}`}</span>
          <button type="button" onClick={() => setCalMes((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 })} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
            <div key={d} className="text-[10px] font-semibold text-slate-400 py-1">{d}</div>
          ))}
          {days.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const dateStr = `${calMes.year}-${String(calMes.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isPast = dateStr < today;
            const isSel = fFecha === dateStr;
            const isToday = dateStr === today;
            return (
              <button
                type="button"
                key={dateStr}
                disabled={isPast}
                onClick={() => { if (!isPast) handleFechaChange(dateStr); }}
                className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isPast ? "text-slate-300 cursor-not-allowed" : ""
                } ${
                  isSel ? "bg-indigo-600 text-white shadow-sm" : isToday ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Obtener citas del veterinario en una fecha seleccionada
  const getCitasVeterinario = (vetId: number) => {
    return citas.filter(c => c.veterinarioAsignadoId === vetId && c.fecha === fechaAgenda && c.estado !== 'cancelada');
  };

  // Obtener turnos de cuidadores en una fecha seleccionada
  const getTurnosCuidadoresDia = () => {
    return turnosCuidadores.filter(t => {
      const tFecha = t.fechaTurno.split('T')[0];
      return tFecha === fechaAgenda;
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Agenda Diaria de Actividades</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCliente ? "Gestiona tus citas veterinarias" : "Planificación y actividades del personal clínico y cuidadores"}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="button" onClick={fetchData} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-3 py-2 rounded-lg transition-colors cursor-pointer">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button type="button" onClick={() => { setShowForm(true); setStep(1); setError(""); }} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Agendar Cita
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0" />{success}</div>}

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-slate-200">
        {isStaff ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex-1 sm:flex-none px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "personal"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Agenda Diaria del Personal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("citas")}
              className={`flex-1 sm:flex-none px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "citas"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Listado General de Citas</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("calendario")}
              className={`flex-1 sm:flex-none px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "calendario"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Mi Calendario Semanal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("citas")}
              className={`flex-1 sm:flex-none px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "citas"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Mis Citas Agendadas</span>
            </button>
          </>
        )}
      </div>

      {/* VISTA CLIENTE: CALENDARIO SEMANAL */}
      {isCliente && activeTab === "calendario" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-100 pb-3 bg-slate-50/20 -mx-5 -mt-5 p-5">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-500"/> Agenda de Actividades de Mis Mascotas
              </h3>
              <p className="text-slate-450 text-[10px] mt-0.5">Visualiza en tiempo real las citas médicas y reservas de quirófano de tus mascotas.</p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-xl">
              <button type="button" onClick={() => setClientWeekStart(p => { const d = new Date(p); d.setDate(d.getDate() - 7); return d; })} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              <span className="font-bold text-slate-700 text-xs px-2 select-none">
                {clientWeekStart.toLocaleDateString("es-CL",{day:"numeric",month:"short"})} – {
                  (() => {
                    const end = new Date(clientWeekStart);
                    end.setDate(clientWeekStart.getDate() + 4);
                    return end.toLocaleDateString("es-CL",{day:"numeric",month:"short",year:"numeric"});
                  })()
                }
              </span>
              <button type="button" onClick={() => setClientWeekStart(p => { const d = new Date(p); d.setDate(d.getDate() + 7); return d; })} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150">
                  <th className="w-24 px-3 py-3 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wide">Horario</th>
                  {DIAS_SEMANA_NOM.map((dia, i) => {
                    const fecha = clientWeekDates[i];
                    const isHoy = fecha === today;
                    return (
                      <th key={dia} className={`px-2 py-3 text-center font-semibold text-[10px] uppercase tracking-wide border-l border-slate-150 ${isHoy ? "text-indigo-600 bg-indigo-50/10" : "text-slate-500"}`}>
                        <div>{dia}</div>
                        <div className={`text-xs font-bold mt-0.5 ${isHoy ? "text-indigo-600" : "text-slate-700"}`}>{fmtShort(fecha)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"].map((bloque, bi) => (
                  <tr key={bloque}>
                    <td className="px-3 py-2.5 text-[10px] text-slate-400 font-mono whitespace-nowrap align-top pt-3">
                      <Clock className="h-3.5 w-3.5 inline mr-1 text-slate-300"/>{bloque}
                    </td>
                    {clientWeekDates.map((fecha) => {
                      const c = citas.find(cita => cita.fecha === fecha && cita.bloque === bloque && cita.estado !== 'cancelada');
                      if (!c) {
                        return (
                          <td key={fecha} className="px-1.5 py-1.5 align-top border-l border-slate-150">
                            <div className="h-12 rounded-lg border border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center">
                              <span className="text-[9px] text-slate-300">Libre</span>
                            </div>
                          </td>
                        );
                      }
                      const isCir = c.pacienteNombre.startsWith("[Quirófano]");
                      const isConf = c.estado === "confirmada";
                      return (
                        <td key={fecha} className="px-1.5 py-1.5 align-top border-l border-slate-150">
                          <button
                            type="button"
                            onClick={() => setSelectedCalendarCita(c)}
                            className={`w-full h-12 rounded-lg border p-1.5 text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 block ${
                              isCir
                                ? "bg-indigo-600 border-indigo-700 text-white"
                                : (isConf ? "bg-emerald-600 border-emerald-700 text-white" : "bg-amber-500 border-amber-600 text-white")
                            }`}
                          >
                            <div className="text-[10px] font-black truncate">{c.pacienteNombre}</div>
                            <div className="text-[8px] truncate opacity-95">{c.motivo}</div>
                            <div className="mt-0.5">
                              {isCir ? (
                                <span className="text-[7px] font-black uppercase bg-indigo-800 text-indigo-100 px-1 py-0.2 rounded">Quirófano</span>
                              ) : (
                                <span className={`text-[7px] font-bold uppercase px-1 py-0.2 rounded ${isConf ? "bg-emerald-800 text-emerald-100" : "bg-amber-800 text-amber-100"}`}>
                                  {c.estado}
                                </span>
                              )}
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 text-[10px] font-semibold text-slate-500 pt-1">
            <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-200"/><span className="text-slate-600">Cita Confirmada</span></div>
            <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-indigo-100 border border-indigo-200"/><span className="text-slate-600">Cirugía / Quirófano</span></div>
            <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-200"/><span className="text-slate-600">Cita Pendiente</span></div>
          </div>
        </div>
      )}

      {/* VISTA 1: AGENDA DIARIA DEL PERSONAL (STAFF) */}
      {isStaff && activeTab === "personal" && (
        <div className="space-y-4 animate-fade-in">
          {/* Selector de Fecha */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-semibold">Mostrando actividades programadas para el:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={fechaAgenda}
                onChange={e => setFechaAgenda(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:bg-white font-bold"
              />
              <button
                type="button"
                onClick={() => setFechaAgenda(toLocalDate(new Date()))}
                className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Grid de Actividades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMNA 1: VETERINARIOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Stethoscope className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Veterinarios de Turno</h3>
              </div>

              {vets.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No hay veterinarios registrados.</p>
              ) : (
                <div className="space-y-4">
                  {vets.map(v => {
                    const citasVet = getCitasVeterinario(v.id);
                    return (
                      <div key={`vet-agenda-${v.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-bold">
                              {v.nombre[4] || v.nombre[0]}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{v.nombre}</h4>
                              <p className="text-[9px] text-slate-450 font-medium">Licencia: {v.licenciaMedica}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            citasVet.length > 0 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {citasVet.length > 0 ? `${citasVet.length} citas` : 'Disponible'}
                          </span>
                        </div>

                        {/* Listado de bloques del veterinario */}
                        {citasVet.length === 0 ? (
                          <p className="text-[10px] text-emerald-600 italic bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg text-center font-medium">
                            🟢 Libre / Disponible para consultas o cirugías de urgencia.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {citasVet.map(c => (
                              <div key={`cita-vet-${c.id}`} className="bg-white border border-slate-200 p-2.5 rounded-lg flex justify-between items-start gap-2 text-[11px]">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-bold text-slate-800">{c.bloque}</span>
                                    <span className={`text-[8px] font-bold px-1 rounded ${
                                      c.tipo === 'clinica' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    }`}>
                                      {c.tipo === 'clinica' ? 'Clínica' : 'Domicilio'}
                                    </span>
                                  </div>
                                  <p className="text-slate-650 leading-relaxed font-semibold">
                                    Mascota: <strong className="text-indigo-650 font-bold">{c.pacienteNombre}</strong> ({c.pacienteEspecie})
                                  </p>
                                  <p className="text-[10px] text-slate-450 truncate">Motivo: {c.motivo}</p>
                                </div>
                                <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${ESTADO_BADGE[c.estado].cls}`}>
                                  {ESTADO_BADGE[c.estado].label}
                                </span>
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

            {/* COLUMNA 2: CUIDADORES DE GUARDERÍA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cuidadores de Turno</h3>
              </div>

              {getTurnosCuidadoresDia().length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 italic">
                  No hay turnos de cuidadores programados para este día.
                  <p className="text-[10px] text-slate-400 font-normal mt-1">Registra los turnos de cuidadores en "Personal Hotel".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTurnosCuidadoresDia().map(t => (
                    <div key={`cuidador-agenda-${t.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                            {t.cuidadorNombre[0]}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{t.cuidadorNombre}</h4>
                            <p className="text-[9px] text-slate-450 font-semibold font-mono">{t.rut}</p>
                          </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-850 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Turno: {t.turnoTipo}
                        </span>
                      </div>

                      <div className="bg-white border border-slate-150 rounded-lg p-2.5 text-[11px] leading-relaxed space-y-1">
                        <p className="text-slate-700 font-semibold flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Asignado a: Cuidado de Aforo de Guardería y Alimentación diaria</span>
                        </p>
                        <p className="text-[10px] text-slate-450">
                          Respeta el aforo máximo de bienestar animal: <strong>máximo 8 mascotas asignadas</strong> (BR-51).
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VISTA 2: LISTADO DE CITAS GENERAL */}
      {activeTab === "citas" && (
        <div className="space-y-3">
          {isStaff && citas.some((c: CitaEnriquecida) => c.estado === "pendiente") && (
            <div>
              <h2 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Pendientes de Aprobación ({citas.filter((c: CitaEnriquecida) => c.estado === "pendiente").length})
              </h2>
              <div className="space-y-2">
                {citas.filter((c: CitaEnriquecida) => c.estado === "pendiente").map((c: CitaEnriquecida) => (
                  <div key={c.id} className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{c.pacienteNombre}</span>
                        <span className="text-[10px] text-slate-500 capitalize">({c.pacienteEspecie})</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_BADGE[c.estado].cls}`}>{ESTADO_BADGE[c.estado].label}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{fmt(c.fecha)} - {c.bloque}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Propietario: {c.propietarioNombre} - {c.tipo === "clinica" ? "Clínica" : "Domicilio"}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">Motivo: {c.motivo}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => { setConfirmModal(c); setError(""); }} className="text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"><Check className="h-3 w-3" /> Confirmar</button>
                      <button type="button" onClick={() => { setCancelModal(c); setError(""); }} className="text-[10px] font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"><X className="h-3 w-3" /> Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {isStaff && citas.some((c: CitaEnriquecida) => c.estado !== "pendiente") && (
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Historial de Citas</h2>
            )}
            {citas.filter((c: CitaEnriquecida) => isCliente || c.estado !== "pendiente").map((c: CitaEnriquecida) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {c.tipo === "clinica" ? <Stethoscope className="h-4 w-4 text-indigo-500" /> : <Home className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{c.pacienteNombre}</span>
                      {isStaff && <span className="text-[10px] text-slate-400">- {c.propietarioNombre}</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_BADGE[c.estado].cls}`}>{ESTADO_BADGE[c.estado].label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{fmt(c.fecha)} - {c.bloque}</p>
                    {c.veterinarioNombre && <p className="text-[10px] text-indigo-600 mt-0.5">Vet: {c.veterinarioNombre}</p>}
                    {c.motivoCancelacion && <p className="text-[10px] text-rose-500 mt-0.5">Cancel.: {c.motivoCancelacion}</p>}
                    <p className="text-[11px] text-slate-500 mt-0.5 font-bold text-slate-700">Tarifa: ${c.tarifaEstimada.toLocaleString("es-CL")} CLP</p>
                  </div>
                </div>
                {["pendiente", "confirmada"].includes(c.estado) && (
                  <button type="button" onClick={() => { setCancelModal(c); setError(""); }} className="text-[10px] font-medium text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0">Cancelar</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULARIO DE NUEVA CITA */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div><h2 className="text-base font-bold text-slate-800">Nueva Cita Veterinaria</h2><p className="text-xs text-slate-500 mt-0.5">Paso {step} de 4</p></div>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 pt-4 flex gap-2">{[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-indigo-500" : "bg-slate-100"}`} />)}</div>
            <div className="p-6 space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Tipo de atención</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {([{ val: "clinica", label: "Consulta en Clínica", desc: "Visita presencial", icon: Stethoscope, tarifa: "$12.000" }, { val: "domicilio", label: "Atención a Domicilio", desc: "El veterinario va a tu hogar", icon: Home, tarifa: "$22.000" }] as const).map((opt) => {
                      const Icon = opt.icon;
                      return <button type="button" key={opt.val} onClick={() => setFTipo(opt.val)} className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${fTipo === opt.val ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}><Icon className={`h-5 w-5 mb-2 ${fTipo === opt.val ? "text-indigo-600" : "text-slate-400"}`} /><div className="text-xs font-bold text-slate-800">{opt.label}</div><div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div><div className={`text-[11px] font-semibold mt-2 ${fTipo === opt.val ? "text-indigo-600" : "text-slate-500"}`}>Base: {opt.tarifa}</div></button>;
                    })}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Selecciona fecha y horario</h3>
                  {renderCalendar()}
                  {fFecha && <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Bloques disponibles — {fmt(fFecha)}</p>
                    {loadingSlots ? <p className="text-xs text-slate-400">Cargando...</p> : disponibles.length === 0 ? <p className="text-xs text-rose-500">No hay bloques disponibles.</p> : (
                      <div className="grid grid-cols-3 gap-2">
                        {disponibles.map((b: string) => <button type="button" key={b} onClick={() => setFBloque(b)} className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${fBloque === b ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"}`}><Clock className="h-3 w-3" />{b}</button>)}
                      </div>
                    )}
                  </div>}
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Mascota y motivo</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Mascota</label>
                    {mascotas.length === 0 ? <p className="text-xs text-rose-500">No tienes mascotas registradas.</p> : (
                      <div className="space-y-2">{mascotas.map((m: Mascota) => <button type="button" key={m.id} onClick={() => setFMascota(String(m.id))} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${fMascota === String(m.id) ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}><div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${fMascota === String(m.id) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{m.nombre[0]}</div><div><div className="text-xs font-bold text-slate-800">{m.nombre}</div><div className="text-[10px] text-slate-500 capitalize">{m.especie} · {m.raza}</div></div></button>)}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Motivo</label>
                    <textarea value={fMotivo} onChange={(e) => setFMotivo(e.target.value)} rows={3} placeholder="Describe el motivo o síntomas..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:border-indigo-400 focus:outline-none resize-none" />
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Confirma tu cita</h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    {[{ label: "Tipo", value: fTipo === "clinica" ? "Consulta en Clínica" : "Atención a Domicilio" }, { label: "Fecha", value: fFecha ? fmt(fFecha) : "-" }, { label: "Horario", value: fBloque || "-" }, { label: "Mascota", value: mascotas.find((m: Mascota) => String(m.id) === fMascota)?.nombre || "-" }, { label: "Motivo", value: fMotivo }, { label: "Tarifa estimada", value: fTipo === "clinica" ? "$12.000" : "$22.000" }].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs"><span className="font-semibold text-slate-500">{label}</span><span className="text-slate-800 font-medium text-right max-w-[60%]">{value}</span></div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700"><AlertCircle className="h-3.5 w-3.5 inline mr-1" />La cita quedará <strong>pendiente</strong> hasta confirmación del equipo veterinario.</div>
                  {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg">{error}</div>}
                </div>
              )}
            </div>
            <div className="flex justify-between p-6 border-t border-slate-100">
              <button type="button" onClick={() => step > 1 ? setStep((s) => s - 1) : setShowForm(false)} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer">{step === 1 ? "Cancelar" : "Anterior"}</button>
              {step < 4 ? (
                <button type="button" onClick={() => setStep((s) => s + 1)} disabled={(step === 2 && !fBloque) || (step === 3 && (!fMascota || !fMotivo))} className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2 rounded-lg transition-colors cursor-pointer">Siguiente</button>
              ) : (
                <button type="button" onClick={handleSubmitCita} className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Confirmar Cita</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR CITA MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Confirmar Cita #{confirmModal.id}</h2>
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2">
              {[{ l: "Paciente", v: confirmModal.pacienteNombre }, { l: "Propietario", v: confirmModal.propietarioNombre }, { l: "Fecha", v: `${fmt(confirmModal.fecha)} - ${confirmModal.bloque}` }, { l: "Tipo", v: confirmModal.tipo }, { l: "Motivo", v: confirmModal.motivo }].map(({ l, v }) => <div key={l} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-semibold text-right max-w-[60%]">{v}</span></div>)}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Veterinario Responsable *</label>
              <select value={vetAsig} onChange={(e) => setVetAsig(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:outline-none">
                <option value="">Seleccionar veterinario...</option>
                {vets.map((v) => <option key={v.id} value={v.id}>{v.nombre} ({v.licenciaMedica})</option>)}
              </select>
            </div>
            {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setConfirmModal(null); setVetAsig(""); setError(""); }} className="text-xs font-medium text-slate-500 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50">Cerrar</button>
              <button type="button" onClick={handleConfirmar} className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELAR CITA MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Cancelar Cita #{cancelModal.id}</h2>
            <p className="text-xs text-slate-500">Paciente: <strong>{cancelModal.pacienteNombre}</strong> · {fmt(cancelModal.fecha)} · {cancelModal.bloque}</p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Motivo (opcional)</label>
              <textarea value={motivoCancel} onChange={(e) => setMotivoCancel(e.target.value)} rows={3} placeholder="Motivo de cancelación..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:border-rose-400 focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setCancelModal(null); setMotivoCancel(""); }} className="text-xs font-medium text-slate-500 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50">Volver</button>
              <button type="button" onClick={handleCancelar} className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Cancelar Cita</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Cita Calendario (Cliente) */}
      {selectedCalendarCita && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCalendarCita(null); }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalle del Evento</h3>
              <button
                type="button"
                onClick={() => setSelectedCalendarCita(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white ${
                  selectedCalendarCita.pacienteNombre.startsWith("[Quirófano]") ? "bg-indigo-600" : "bg-emerald-600"
                }`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{selectedCalendarCita.pacienteNombre}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedCalendarCita.tipo === "domicilio" ? "Visita a Domicilio" : "Consulta en Clínica"}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha</span>
                  <span className="font-semibold">{fmt(selectedCalendarCita.fecha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horario</span>
                  <span className="font-mono font-semibold">{selectedCalendarCita.bloque}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Veterinario</span>
                  <span className="font-semibold">{selectedCalendarCita.veterinarioNombre || "Por asignar"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Estimado</span>
                  <span className="font-semibold text-slate-800">${formatCLP(selectedCalendarCita.tarifaEstimada)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                    selectedCalendarCita.estado === "confirmada" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {selectedCalendarCita.estado}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-[9px] text-slate-400 block font-bold uppercase mb-0.5">Motivo / Intervención</span>
                <p className="text-slate-700 leading-relaxed font-medium">{selectedCalendarCita.motivo}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCalendarCita(null)}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 rounded-xl text-center cursor-pointer transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};