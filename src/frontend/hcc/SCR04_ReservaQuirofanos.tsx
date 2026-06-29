import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR04Props {
  currentRole: UserRole;
}

export const SCR04_ReservaQuirofanos: React.FC<SCR04Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [consultaId, setConsultaId] = useState('');
  const [cirujanoId, setCirujanoId] = useState('1');
  const [salaId, setSalaId] = useState('101');
  const [fecha, setFecha] = useState('2026-06-29');
  const [bloque, setBloque] = useState('18:00');
  const [tipoCirugia, setTipoCirugia] = useState('mayor');
  const [consentimiento, setConsentimiento] = useState(false);
  const [costo, setCosto] = useState(150000);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Simulación de reservas pesimistas hechas por otros usuarios
  const [reservas, setReservas] = useState<Array<{ salaId: number; bloque: string }>>([
    { salaId: 101, bloque: '2026-06-29 16:00' },
  ]);

  const reservar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!consultaId) {
      setErrorMsg('El ID de la consulta asociada es obligatorio.');
      return;
    }

    if (!consentimiento) {
      setErrorMsg('Debe adjuntar o verificar que el consentimiento informado este firmado BR-08.');
      return;
    }

    const bloqueCompleto = `${fecha} ${bloque}`;
    const salaInt = parseInt(salaId);

    // Lógica de bloqueo pesimista en UI
    const conflicto = reservas.some(r => r.salaId === salaInt && r.bloque === bloqueCompleto);
    if (conflicto) {
      setErrorMsg(`Conflicto de bloqueo: La sala de quirofano ${salaId} ya esta reservada para el bloque ${bloqueCompleto}.`);
      return;
    }

    // Agregar reserva pesimista
    const nuevaReserva = { salaId: salaInt, bloque: bloqueCompleto };
    setReservas([...reservas, nuevaReserva]);
    setSuccessMsg(`Quirófano reservado y bloqueado exitosamente para el bloque ${bloqueCompleto}. Expiración del bloqueo temporal: 10 minutos.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'cirujano']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Reserva */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Reserva de Quirófanos y Gestión de Cirugías</h1>
            <p className="text-slate-400 text-xs">Mecanismo de bloqueo pesimista en tiempo real para agendar cirugías críticas.</p>
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

          <form onSubmit={reservar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="consulta-id" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Consulta Asociada</label>
                <input
                  id="consulta-id"
                  type="text"
                  value={consultaId}
                  onChange={e => setConsultaId(e.target.value)}
                  placeholder="Ej: 102"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cirugia-tipo-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Cirugía</label>
                <select
                  id="cirugia-tipo-select"
                  value={tipoCirugia}
                  onChange={e => setTipoCirugia(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="mayor">Mayor (Anestesia general, invasiva)</option>
                  <option value="menor">Menor (Suturas, castración)</option>
                  <option value="emergencia">Emergencia (Accidente, torsión)</option>
                  <option value="estetica">Estética (Limpieza dental avanzada)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="quirofano-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Quirófano / Sala</label>
                <select
                  id="quirofano-select"
                  value={salaId}
                  onChange={e => setSalaId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="101">Sala Quirúrgica A (Mayor)</option>
                  <option value="102">Sala Quirúrgica B (Menor)</option>
                </select>
              </div>
              <div>
                <label htmlFor="fecha-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Fecha</label>
                <input
                  id="fecha-input"
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="bloque-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Bloque Horario</label>
                <select
                  id="bloque-select"
                  value={bloque}
                  onChange={e => setBloque(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="09:00">09:00 - 11:00</option>
                  <option value="11:30">11:30 - 13:30</option>
                  <option value="14:00">14:00 - 16:00</option>
                  <option value="16:00">16:00 - 18:00</option>
                  <option value="18:00">18:00 - 20:00</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="costo-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Costo Adicional Quirófano ($)</label>
                <input
                  id="costo-input"
                  type="number"
                  value={costo}
                  onChange={e => setCosto(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-sm text-slate-300 font-medium select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={e => setConsentimiento(e.target.checked)}
                    className="accent-emerald-500 h-4 w-4 bg-slate-900 border border-slate-700 rounded"
                  />
                  Consentimiento firmado verificado
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Confirmar y Bloquear Quirófano
            </button>
          </form>
        </div>

        {/* Reservas Activas (Bloqueo Pesimista) */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Reservas Bloqueadas (Hoy)</h3>
          <p className="text-slate-500 text-xs">Estas salas se encuentran retenidas y bloquean cualquier solapamiento horario (BR-10 desinfección incluida).</p>
          <div className="space-y-2">
            {reservas.map((r, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">Sala Quirófano {r.salaId}</h4>
                  <span className="text-[10px] text-slate-500">{r.bloque}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  Reservado
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
