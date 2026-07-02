import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Stethoscope, Home, AlertCircle, RefreshCw } from "lucide-react";

interface CitaEnriquecida { id: number; pacienteId: number; tipo: "clinica" | "domicilio"; fecha: string; bloque: string; motivo: string; estado: "pendiente" | "confirmada" | "cancelada" | "completada"; veterinarioAsignadoId?: number; veterinarioNombre?: string | null; pacienteNombre: string; pacienteEspecie: string; propietarioNombre: string; tarifaEstimada: number; }

interface Props { currentRole: "administrador" | "veterinario" | "cliente"; token: string; currentUser: { id: number; nombre: string; email: string; rol: string } | null; }

const BLOQUES = ["08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00"];
const DIAS_SEMANA = ["Lunes","Martes","Miercoles","Jueves","Viernes"];

const getMonday = (d: Date) => {
  const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff); mon.setHours(0,0,0,0); return mon;
};
const toLocalDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtShort = (fecha: string) => { const d = new Date(fecha+"T12:00:00"); return d.toLocaleDateString("es-CL", {day:"numeric",month:"short"}); };

export const HorarioVeterinario: React.FC<Props> = ({ currentRole, token, currentUser }) => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [citas, setCitas] = useState<CitaEnriquecida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CitaEnriquecida | null>(null);
  const headers: Record<string,string> = { "Content-Type":"application/json", "Authorization":`Bearer ${token}` };

  const weekDates = DIAS_SEMANA.map((_,i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return toLocalDate(d); });

  const fetchCitas = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/v1/citas", { headers });
      const d = await r.json();
      
      let cirugias: any[] = [];
      try {
        const rc = await fetch("/api/v1/clinica/cirugias", { headers });
        if (rc.ok) {
          const dc = await rc.json();
          cirugias = dc.cirugias || [];
        }
      } catch (e) {
        console.error("Error al obtener cirugías", e);
      }

      if (r.ok) {
        const all: CitaEnriquecida[] = d.citas || [];
        
        // Map surgeries to fake appointments
        const userId = currentUser?.id;
        const mappedCirugias: CitaEnriquecida[] = [];
        
        cirugias.forEach((c: any) => {
          if (currentRole === "veterinario" && c.veterinarioId !== userId) return;
          
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
              pacienteId: 0,
              tipo: "clinica",
              fecha: fechaStr,
              bloque: bl,
              motivo: `Cirugía: ${c.intervencion || "Procedimiento Quirúrgico"}`,
              estado: "confirmada",
              veterinarioAsignadoId: c.veterinarioId,
              veterinarioNombre: c.veterinarioNombre,
              pacienteNombre: `[Cirugía] ${c.pacienteNombre || "Paciente"}`,
              pacienteEspecie: "",
              propietarioNombre: c.propietarioNombre || "",
              tarifaEstimada: c.costoAdicional || 0
            });
          });
        });
        
        const combined = [...all, ...mappedCirugias];
        const filtered = currentRole === "veterinario"
          ? combined.filter((c: CitaEnriquecida) => c.veterinarioAsignadoId === userId || c.estado === "pendiente")
          : combined;
        setCitas(filtered.filter((c: CitaEnriquecida) => ["confirmada","pendiente"].includes(c.estado)));
      } else setError(d.error || "Error al cargar agenda");
    } finally { setLoading(false); }
  }, [token, currentUser, currentRole]);

  useEffect(() => { fetchCitas(); }, []);

  const getCita = (fecha: string, bloque: string) => citas.find((c: CitaEnriquecida) => c.fecha === fecha && c.bloque === bloque);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday = () => setWeekStart(getMonday(new Date()));

  const todayStr = toLocalDate(new Date());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 4);

  const citasSemana = citas.filter((c: CitaEnriquecida) => weekDates.includes(c.fecha));
  const confirmadas = citasSemana.filter((c: CitaEnriquecida) => c.estado === "confirmada").length;
  const pendientes = citasSemana.filter((c: CitaEnriquecida) => c.estado === "pendiente").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mi Horario Semanal</h1>
          <p className="text-sm text-slate-500 mt-0.5">{currentUser?.nombre || "Veterinario"} — Agenda de consultas asignadas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-3">
            <div className="text-center bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2"><div className="text-sm font-bold text-emerald-700">{confirmadas}</div><div className="text-[10px] text-emerald-600">Confirmadas</div></div>
            <div className="text-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-2"><div className="text-sm font-bold text-amber-700">{pendientes}</div><div className="text-[10px] text-amber-600">Pendientes</div></div>
          </div>
          <button onClick={fetchCitas} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><RefreshCw className="h-4 w-4"/></button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0"/>{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"><ChevronLeft className="h-4 w-4"/></button>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">
              {weekStart.toLocaleDateString("es-CL",{day:"numeric",month:"long"})} – {weekEnd.toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"})}
            </p>
            <button onClick={goToday} className="text-[10px] text-indigo-500 hover:underline cursor-pointer mt-0.5">Ir a hoy</button>
          </div>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"><ChevronRight className="h-4 w-4"/></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="w-28 px-3 py-3 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wide">Horario</th>
                  {DIAS_SEMANA.map((dia, i) => {
                    const fecha = weekDates[i];
                    const isHoy = fecha === todayStr;
                    return (
                      <th key={dia} className={`px-2 py-3 text-center font-semibold text-[10px] uppercase tracking-wide ${isHoy ? "text-indigo-600" : "text-slate-500"}`}>
                        <div>{dia}</div>
                        <div className={`text-sm font-bold mt-0.5 ${isHoy ? "text-indigo-600" : "text-slate-700"}`}>{fmtShort(fecha)}</div>
                        {isHoy && <div className="h-1 w-4 bg-indigo-500 rounded-full mx-auto mt-1"/>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {BLOQUES.map((bloque, bi) => (
                  <tr key={bloque} className={bi === 3 ? "border-t-2 border-dashed border-slate-200" : ""}>
                    <td className="px-3 py-2 text-[10px] text-slate-400 font-mono whitespace-nowrap align-top pt-3">
                      <Clock className="h-3 w-3 inline mr-1 text-slate-300"/>{bloque}
                      {bi === 3 && <div className="text-[9px] text-slate-300 mt-0.5">Almuerzo</div>}
                    </td>
                    {weekDates.map((fecha, di) => {
                      const cita = getCita(fecha, bloque);
                      const isHoy = fecha === todayStr;
                      if (!cita) {
                        return (
                          <td key={fecha} className={`px-1.5 py-1.5 align-top ${isHoy ? "bg-indigo-50/30" : ""}`}>
                            <div className="h-14 rounded-lg border border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center">
                              <span className="text-[9px] text-slate-300">Libre</span>
                            </div>
                          </td>
                        );
                      }
                      const isConf = cita.estado === "confirmada";
                      const isCirugia = cita.motivo.startsWith("Cirugía:");
                      return (
                        <td key={fecha} className={`px-1.5 py-1.5 align-top ${isHoy ? "bg-indigo-50/30" : ""}`}>
                          <button onClick={() => setSelected(cita)} className={`w-full h-14 rounded-lg border p-1.5 text-left cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5 block ${
                            isCirugia
                              ? "bg-indigo-600 border-indigo-700 text-white"
                              : (isConf ? "bg-emerald-600 border-emerald-700 text-white" : "bg-amber-500 border-amber-600 text-white")
                          }`}>
                            <div className="text-[10px] font-extrabold truncate text-white">{cita.pacienteNombre}</div>
                            <div className="text-[9px] truncate text-white/90">{cita.propietarioNombre}</div>
                            <div className="mt-0.5">
                              {isCirugia ? (
                                <span className="text-[8px] font-black uppercase bg-indigo-800 text-indigo-100 px-1 py-0.2 rounded">Quirófano</span>
                              ) : (
                                cita.tipo === "clinica" ? <Stethoscope className="h-2.5 w-2.5 inline text-white"/> : <Home className="h-2.5 w-2.5 inline text-white"/>
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
        )}
      </div>

      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-emerald-200 border border-emerald-300"/><span className="text-slate-600">Cita Confirmada</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-indigo-200 border border-indigo-300"/><span className="text-slate-600">Quirófano / Cirugía</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-amber-200 border border-amber-300"/><span className="text-slate-600">Cita Pendiente</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-slate-100 border border-dashed border-slate-200"/><span className="text-slate-600">Libre</span></div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-base font-bold text-slate-800">Detalle de Actividad</h2>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${
                selected.motivo.startsWith("Cirugía:")
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : (selected.estado === "confirmada" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")
              }`}>{selected.motivo.startsWith("Cirugía:") ? "Ocupado" : selected.estado}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs">
              {[
                {label:"Paciente", value:`${selected.pacienteNombre} ${selected.pacienteEspecie ? `(${selected.pacienteEspecie})` : ""}`},
                {label:"Propietario", value:selected.propietarioNombre},
                {label:"Tipo", value:selected.motivo.startsWith("Cirugía:") ? "Reserva de Quirófano" : (selected.tipo === "clinica" ? "Consulta en Clinica" : "Atencion a Domicilio")},
                {label:"Fecha", value:new Date(selected.fecha+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})},
                {label:"Horario", value:selected.bloque},
                {label:"Motivo / Cirugía", value:selected.motivo},
                {label:"Costo Quirófano", value:selected.motivo.startsWith("Cirugía:") ? "$0 CLP (Instalaciones Propias)" : `$${selected.tarifaEstimada.toLocaleString("es-CL")} CLP`},
              ].map(({label,value}) => (
                <div key={label} className="flex justify-between gap-3 border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                  <span className="font-semibold text-slate-500 flex-shrink-0">{label}</span>
                  <span className="text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="w-full text-xs font-semibold text-slate-600 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};