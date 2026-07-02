import React, { useState, useEffect, useCallback } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import {
  Home, Activity, RefreshCw, BedDouble, PawPrint,
  Wrench, CheckCircle, ShieldAlert, ArrowRightLeft,
  LogOut, PlusCircle, X, Eye
} from 'lucide-react';

interface MapaCanilesSCR24Props { currentRole: UserRole; token?: string; }

interface Canil { id: number; nombre: string; capacidadMaxima: number; estado: 'libre'|'llena'|'mantenimiento'; tipoEspecie: 'canino'|'felino'; }
interface ReservaGuarderia { id: number; pacienteId: number; canilId: number; fechaCheckin: string; fechaCheckout: string; costoTotal: number; estado: 'reservada'|'activa'|'completada'|'cancelada'; }
interface Hospitalizacion { id: number; pacienteId: number; salaId: number; fechaIngreso: string; fechaAlta: string|null; costoDia: number; estado: 'activo'|'alta'|'fallecido'; }
interface Paciente { id: number; nombre: string; especie: string; raza: string; propietarioId: number; }

const SALAS = [
  { id: 1, nombre: 'UCI — Cuidados Intensivos', emoji: '🔴' },
  { id: 2, nombre: 'H-1 Recuperación Post-Op',  emoji: '🟡' },
  { id: 3, nombre: 'H-2 Cuarentena / Aislados', emoji: '🟠' },
  { id: 4, nombre: 'H-3 Observación General',   emoji: '🟢' },
];
const COSTO_POR_SALA: Record<number,number> = { 1:35000, 2:22000, 3:18000, 4:12000 };
const salaNombre = (id: number) => SALAS.find(s => s.id === id)?.nombre ?? `Sala ${id}`;

export const MapaCaniles: React.FC<MapaCanilesSCR24Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('loading');
  const [caniles,   setCaniles]   = useState<Canil[]>([]);
  const [reservas,  setReservas]  = useState<ReservaGuarderia[]>([]);
  const [hosps,     setHosps]     = useState<Hospitalizacion[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  // Modals — hospitalización (solo vet)
  const [modalIngreso,  setModalIngreso]  = useState(false);
  const [modalTraslado, setModalTraslado] = useState<Hospitalizacion|null>(null);
  const [modalAlta,     setModalAlta]     = useState<Hospitalizacion|null>(null);
  // Modal — guardería (solo admin)
  const [modalReserva,  setModalReserva]  = useState(false);

  // Formulario ingreso
  const [fPacId, setFPacId] = useState(''); const [fSalaId, setFSalaId] = useState('1'); const [fCosto, setFCosto] = useState(35000);
  // Formulario traslado
  const [fSalaDestino, setFSalaDestino] = useState('2');
  // Formulario alta
  const [fEstadoAlta, setFEstadoAlta] = useState<'alta'|'fallecido'>('alta');
  // Formulario reserva guardería
  const [rPacId, setRPacId] = useState(''); const [rCanilId, setRCanilId] = useState('1');
  const [rCheckin, setRCheckin] = useState(() => new Date().toISOString().slice(0,10));
  const [rCheckout, setRCheckout] = useState(() => { const d=new Date(); d.setDate(d.getDate()+2); return d.toISOString().slice(0,10); });
  const [rCosto, setRCosto] = useState(15000);

  const [msg, setMsg] = useState<{type:'ok'|'err'; text:string}|null>(null);

  const isVet   = currentRole === 'veterinario';
  const isAdmin = currentRole === 'administrador';

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const h = { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' };

  const cargar = useCallback(async () => {
    setUxState('loading'); setMsg(null);
    try {
      const [rC, rR, rH, rP] = await Promise.all([
        fetch('/api/v1/servicios/caniles',         { headers: h }),
        fetch('/api/v1/servicios/reservas',        { headers: h }),
        fetch('/api/v1/clinica/hospitalizaciones', { headers: h }),
        fetch('/api/v1/clinica/pacientes',         { headers: h }),
      ]);
      if (rC.ok) setCaniles(await rC.json());
      if (rR.ok) setReservas(await rR.json());
      if (rH.ok) setHosps(await rH.json());
      if (rP.ok) setPacientes(await rP.json());
      setUxState('data');
    } catch { setUxState('error'); }
  }, [activeToken]);

  useEffect(() => { cargar(); }, []);

  const getPac = (id: number) => pacientes.find(p => p.id === id);
  const activas = hosps.filter(h => h.estado === 'activo');
  const hospPorSala = (salaId: number) => activas.filter(h => h.salaId === salaId);
  const reservasActivasPorCanil = (canilId: number) =>
    reservas.filter(r => r.canilId === canilId && (r.estado === 'activa' || r.estado === 'reservada'));
  const pacientesDisponiblesIngreso = pacientes.filter(p => !activas.some(h => h.pacienteId === p.id));
  const canilSel = caniles.find(c => c.id === Number(rCanilId));
  const pacientesParaGuarderia = pacientes.filter(p => canilSel ? p.especie === canilSel.tipoEspecie : true);

  const ingresarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fPacId) { setMsg({type:'err',text:'Seleccione un paciente.'}); return; }
    const r = await fetch('/api/v1/clinica/hospitalizaciones', { method:'POST', headers:h, body:JSON.stringify({pacienteId:Number(fPacId),salaId:Number(fSalaId),costoDia:fCosto}) });
    const d = await r.json();
    if (!r.ok) { setMsg({type:'err',text:d.error}); return; }
    setMsg({type:'ok',text:`✔ ${getPac(Number(fPacId))?.nombre} ingresado/a a ${salaNombre(Number(fSalaId))}.`});
    setModalIngreso(false); setFPacId(''); cargar();
  };

  const trasladar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTraslado) return;
    const r = await fetch(`/api/v1/clinica/hospitalizaciones/${modalTraslado.id}/sala`, { method:'PUT', headers:h, body:JSON.stringify({salaId:Number(fSalaDestino)}) });
    const d = await r.json();
    if (!r.ok) { setMsg({type:'err',text:d.error}); return; }
    setMsg({type:'ok',text:`✔ ${getPac(modalTraslado.pacienteId)?.nombre} trasladado/a a ${salaNombre(Number(fSalaDestino))}.`});
    setModalTraslado(null); cargar();
  };

  const darAlta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAlta) return;
    const r = await fetch(`/api/v1/clinica/hospitalizaciones/${modalAlta.id}/alta`, { method:'PUT', headers:h, body:JSON.stringify({estado:fEstadoAlta}) });
    const d = await r.json();
    if (!r.ok) { setMsg({type:'err',text:d.error}); return; }
    const emoji = fEstadoAlta==='alta' ? '✔' : '🕊';
    setMsg({type:'ok',text:`${emoji} ${getPac(modalAlta.pacienteId)?.nombre} egresado/a (${fEstadoAlta}).`});
    setModalAlta(null); cargar();
  };

  const crearReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rPacId) { setMsg({type:'err',text:'Seleccione una mascota.'}); return; }
    const pac = getPac(Number(rPacId));
    if (pac && canilSel && pac.especie !== canilSel.tipoEspecie) {
      setMsg({type:'err',text:`❌ ${pac.nombre} es ${pac.especie} y este canil es para ${canilSel.tipoEspecie}s.`}); return;
    }
    const r = await fetch('/api/v1/servicios/reservas', { method:'POST', headers:h, body:JSON.stringify({pacienteId:Number(rPacId),canilId:Number(rCanilId),fechaCheckin:rCheckin,fechaCheckout:rCheckout,costoTotal:rCosto}) });
    const d = await r.json();
    if (!r.ok) { setMsg({type:'err',text:d.error}); return; }
    setMsg({type:'ok',text:`✔ Reserva de ${pac?.nombre} en ${canilSel?.nombre} creada.`});
    setModalReserva(false); setRPacId(''); cargar();
  };

  const roleLabel = isVet
    ? '🩺 Vet: gestión activa de internaciones clínicas'
    : '🏢 Admin: aforo y gestión de guardería';

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState}
      allowedRoles={['administrador','veterinario']} currentRole={currentRole}>
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Aforo del Hotel y Hospitalización</h1>
            <p className="text-slate-500 text-xs mt-0.5">{roleLabel}</p>
          </div>
          <button onClick={cargar} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-colors" title="Refrescar">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-xs p-3 rounded-xl border ${msg.type==='ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            {msg.type==='ok' ? <CheckCircle className="h-4 w-4 flex-shrink-0"/> : <ShieldAlert className="h-4 w-4 flex-shrink-0"/>}
            {msg.text}
            <button onClick={()=>setMsg(null)} className="ml-auto cursor-pointer"><X className="h-3 w-3"/></button>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SECCIÓN 1: HOSPITALIZACIÓN CLÍNICA         */}
        {/* ═══════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-rose-600 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-white"/>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-700">Hospitalización Clínica</h2>
                <p className="text-[10px] text-slate-400">
                  {activas.length} paciente(s) activo(s)
                  {isAdmin && <span className="ml-1 text-slate-300">· Vista de solo lectura para administrador</span>}
                </p>
              </div>
            </div>
            {/* Solo el vet puede ingresar pacientes */}
            {isVet && (
              <button onClick={()=>{setFPacId('');setFSalaId('1');setFCosto(35000);setModalIngreso(true);}}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm">
                <PlusCircle className="h-3.5 w-3.5"/> Ingresar paciente
              </button>
            )}
            {isAdmin && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                <Eye className="h-3 w-3"/> Solo lectura
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SALAS.map(sala => {
              const pacs = hospPorSala(sala.id);
              return (
                <div key={sala.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{sala.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{sala.nombre}</p>
                      <p className="text-[10px] text-slate-400">{pacs.length} paciente(s) · ${COSTO_POR_SALA[sala.id].toLocaleString('es-CL')}/día</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pacs.length===0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {pacs.length===0 ? 'Libre' : 'Ocupada'}
                    </span>
                  </div>

                  {pacs.length > 0 ? (
                    <div className="space-y-2">
                      {pacs.map(hosp => {
                        const pac = getPac(hosp.pacienteId);
                        const dias = Math.max(1, Math.ceil((Date.now()-new Date(hosp.fechaIngreso).getTime())/86400000));
                        return (
                          <div key={hosp.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <BedDouble className="h-3 w-3 text-rose-500"/>
                                {pac?.nombre ?? `Pac.#${hosp.pacienteId}`}
                              </span>
                              <span className="text-[10px] text-slate-500">{pac?.especie} · {pac?.raza}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Ingreso: {new Date(hosp.fechaIngreso).toLocaleDateString('es-CL')}</span>
                              <span>·</span>
                              <span className="text-indigo-600 font-semibold">{dias}d</span>
                              <span>·</span>
                              <span>≈ ${(dias*hosp.costoDia).toLocaleString('es-CL')}</span>
                            </div>
                            {/* Acciones solo para vet */}
                            {isVet && (
                              <div className="flex gap-1.5 pt-0.5">
                                <button onClick={()=>{setModalTraslado(hosp);setFSalaDestino(String(SALAS.find(s=>s.id!==sala.id)?.id??2));}}
                                  className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg cursor-pointer transition-colors">
                                  <ArrowRightLeft className="h-2.5 w-2.5"/> Trasladar
                                </button>
                                <button onClick={()=>{setModalAlta(hosp);setFEstadoAlta('alta');}}
                                  className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg cursor-pointer transition-colors">
                                  <LogOut className="h-2.5 w-2.5"/> Alta / Egreso
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Sala disponible.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECCIÓN 2: GUARDERÍA / HOTEL               */}
        {/* ═══════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center">
                <Home className="h-3.5 w-3.5 text-white"/>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-700">Guardería / Hotel de Mascotas</h2>
                <p className="text-[10px] text-slate-400">Caniles separados por especie — caninos y felinos.</p>
              </div>
            </div>
            {/* Solo admin puede crear reservas de guardería */}
            {isAdmin && (
              <button onClick={()=>{setRPacId('');setRCanilId('1');setModalReserva(true);}}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm">
                <PlusCircle className="h-3.5 w-3.5"/> Nueva reserva
              </button>
            )}
            {isVet && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                <Eye className="h-3 w-3"/> Solo lectura
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {caniles.map(canil => {
              const activas_c = reservasActivasPorCanil(canil.id);
              const pct = Math.min((activas_c.length/canil.capacidadMaxima)*100,100);
              const especieColor = canil.tipoEspecie==='canino'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-purple-50 text-purple-700 border-purple-200';

              return (
                <div key={canil.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{canil.nombre}</p>
                      <p className="text-[10px] text-slate-400">Cap. máx.: {canil.capacidadMaxima}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${especieColor}`}>
                        {canil.tipoEspecie==='canino'?'🐕':'🐈'} Solo {canil.tipoEspecie}s
                      </span>
                      {canil.estado==='mantenimiento' && (
                        <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                          <Wrench className="h-2.5 w-2.5"/> Mantenimiento
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Aforo</span>
                      <span className="font-bold">{activas_c.length}/{canil.capacidadMaxima}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div style={{width:`${pct}%`}} className={`h-2 rounded-full transition-all ${pct>=100?'bg-rose-500':pct>=70?'bg-yellow-400':'bg-emerald-500'}`}/>
                    </div>
                  </div>
                  {activas_c.length > 0 ? (
                    <div className="space-y-1">
                      {activas_c.map(r => {
                        const pac = getPac(r.pacienteId);
                        return (
                          <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 text-[10px]">
                            <span className="font-semibold text-slate-700">
                              <PawPrint className="h-2.5 w-2.5 inline mr-1 text-indigo-400"/>
                              {pac?`${pac.nombre} · ${pac.raza}`:`Pac.#${r.pacienteId}`}
                            </span>
                            <span className={`font-bold px-1.5 py-0.5 rounded ${r.estado==='activa'?'text-emerald-600 bg-emerald-50':'text-indigo-600 bg-indigo-50'}`}>{r.estado}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Sin mascotas alojadas.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ═══ MODAL: Ingresar (solo vet) ════════════════ */}
      {isVet && modalIngreso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BedDouble className="h-4 w-4 text-rose-500"/> Ingresar paciente</h3>
              <button onClick={()=>setModalIngreso(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4"/></button>
            </div>
            <form onSubmit={ingresarPaciente} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Paciente</label>
                <select value={fPacId} onChange={e=>setFPacId(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-rose-400 focus:outline-none">
                  <option value="" disabled>— Seleccione paciente —</option>
                  {pacientesDisponiblesIngreso.map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.especie} · {p.raza}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Sala</label>
                <select value={fSalaId} onChange={e=>{setFSalaId(e.target.value);setFCosto(COSTO_POR_SALA[Number(e.target.value)]);}}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-rose-400 focus:outline-none">
                  {SALAS.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Costo/día ($)</label>
                <input type="number" min={0} value={fCosto} onChange={e=>setFCosto(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-rose-400 focus:outline-none"/>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setModalIngreso(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer shadow-sm">Ingresar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Trasladar (solo vet) ═══════════════ */}
      {isVet && modalTraslado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-indigo-500"/> Trasladar paciente</h3>
              <button onClick={()=>setModalTraslado(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4"/></button>
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{getPac(modalTraslado.pacienteId)?.nombre}</span> actualmente en <span className="font-semibold">{salaNombre(modalTraslado.salaId)}</span>.
            </p>
            <form onSubmit={trasladar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nueva sala</label>
                <select value={fSalaDestino} onChange={e=>setFSalaDestino(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-400 focus:outline-none">
                  {SALAS.filter(s=>s.id!==modalTraslado.salaId).map(s=><option key={s.id} value={s.id}>{s.emoji} {s.nombre}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setModalTraslado(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer shadow-sm">Confirmar traslado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Alta (solo vet) ════════════════════ */}
      {isVet && modalAlta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><LogOut className="h-4 w-4 text-emerald-500"/> Alta / Egreso</h3>
              <button onClick={()=>setModalAlta(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4"/></button>
            </div>
            <p className="text-xs text-slate-500">
              Egreso de <span className="font-semibold text-slate-700">{getPac(modalAlta.pacienteId)?.nombre}</span> desde {salaNombre(modalAlta.salaId)}.
            </p>
            <form onSubmit={darAlta} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={()=>setFEstadoAlta('alta')}
                  className={`text-xs font-bold py-2.5 rounded-xl border-2 cursor-pointer transition-all ${fEstadoAlta==='alta'?'bg-emerald-600 text-white border-emerald-600':'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400'}`}>
                  ✔ Alta médica
                </button>
                <button type="button" onClick={()=>setFEstadoAlta('fallecido')}
                  className={`text-xs font-bold py-2.5 rounded-xl border-2 cursor-pointer transition-all ${fEstadoAlta==='fallecido'?'bg-slate-700 text-white border-slate-700':'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                  🕊 Fallecimiento
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setModalAlta(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className={`flex-1 text-white text-xs font-bold py-2 rounded-xl cursor-pointer shadow-sm ${fEstadoAlta==='alta'?'bg-emerald-600 hover:bg-emerald-700':'bg-slate-700 hover:bg-slate-800'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Reserva guardería (solo admin) ════ */}
      {isAdmin && modalReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Home className="h-4 w-4 text-indigo-500"/> Nueva reserva guardería</h3>
              <button onClick={()=>setModalReserva(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4"/></button>
            </div>
            <form onSubmit={crearReserva} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Canil</label>
                <select value={rCanilId} onChange={e=>{setRCanilId(e.target.value);setRPacId('');}}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-400 focus:outline-none">
                  {caniles.map(c=><option key={c.id} value={c.id}>{c.tipoEspecie==='canino'?'🐕':'🐈'} {c.nombre} — Solo {c.tipoEspecie}s</option>)}
                </select>
                {canilSel && <p className="text-[10px] mt-1 text-indigo-600 font-semibold">Solo se muestran pacientes {canilSel.tipoEspecie==='canino'?'caninos':'felinos'}.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mascota</label>
                <select value={rPacId} onChange={e=>setRPacId(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-400 focus:outline-none">
                  <option value="" disabled>— Seleccione mascota —</option>
                  {pacientesParaGuarderia.map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.raza}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Check-in</label>
                  <input type="date" value={rCheckin} onChange={e=>setRCheckin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-400 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Check-out</label>
                  <input type="date" value={rCheckout} onChange={e=>setRCheckout(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-400 focus:outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Costo total ($)</label>
                <input type="number" min={0} value={rCosto} onChange={e=>setRCosto(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-400 focus:outline-none"/>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setModalReserva(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer shadow-sm">Crear reserva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StateWrapper>
  );
};
