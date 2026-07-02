import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, RefreshCw, FileText } from 'lucide-react';

interface Lote {
  id: number;
  codigoLote: string;
  cantidadActual: number;
  fechaVencimiento: string;
  estado: string;
}

interface Medicamento {
  id: number;
  nombreComercial: string;
  principioActivo: string;
  stockTotal: number;
  lotes: Lote[];
}

interface SCR13Props {
  currentRole: UserRole;
}

export const RegistroMovimientos: React.FC<SCR13Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medId, setMedId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [tipo, setTipo] = useState('merma');
  const [cantidad, setCantidad] = useState(-1);
  const [motivo, setMotivo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const loadData = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/inventario/medicamentos/stock', { headers });
      if (res.ok) {
        const data: Medicamento[] = await res.json();
        setMedicamentos(data);
        if (data.length > 0) {
          // Pre-seleccionar el primer medicamento
          setMedId(data[0].id.toString());
          const lotesMed = data[0].lotes || [];
          if (lotesMed.length > 0) {
            setLoteId(lotesMed[0].id.toString());
          } else {
            setLoteId('');
          }
        }
      } else {
        setErrorMsg('Error al obtener el stock de medicamentos.');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Al cambiar el medicamento seleccionado, filtrar y preseleccionar el primer lote correspondiente
  useEffect(() => {
    if (medId) {
      const selectedMed = medicamentos.find(m => m.id.toString() === medId);
      if (selectedMed) {
        const lotesMed = selectedMed.lotes || [];
        if (lotesMed.length > 0) {
          setLoteId(lotesMed[0].id.toString());
        } else {
          setLoteId('');
        }
      }
    }
  }, [medId, medicamentos]);

  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!medId || !loteId) {
      setErrorMsg('Debe seleccionar un medicamento y su lote correspondiente.');
      return;
    }

    // CH-34: Cantidad != 0
    if (cantidad === 0) {
      setErrorMsg('Error CH-34: La cantidad a mover del inventario no puede ser cero.');
      return;
    }

    // CH-47: Motivo para merma/ajuste
    if (['merma', 'ajuste'].includes(tipo) && (!motivo || motivo.trim().length < 5)) {
      setErrorMsg('Error CH-47: Se exige un motivo descriptivo (mínimo 5 caracteres) para registrar una merma o ajuste.');
      return;
    }

    const payload = {
      medicamentoId: Number(medId),
      loteId: Number(loteId),
      tipo,
      cantidad,
      motivo
    };

    try {
      const res = await fetch('/api/v1/inventario/movimientos', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(`Movimiento de tipo '${tipo}' registrado con éxito. Inventario físico actualizado.`);
        setMotivo('');
        // Recargar datos para actualizar los stocks en pantalla
        loadData();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Error al registrar el movimiento.');
      }
    } catch {
      setErrorMsg('Error de red al registrar el movimiento de inventario.');
    }
  };

  // Obtener los lotes del medicamento seleccionado para renderizar en el dropdown
  const selectedMedObj = medicamentos.find(m => m.id.toString() === medId);
  const lotesFiltrados = selectedMedObj ? selectedMedObj.lotes || [] : [];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Registro de Movimientos de Inventario</h1>
            <p className="text-slate-400 text-xs mt-1">Formulario para registrar mermas por rotura, vencimiento o ajustes manuales de stock (L5).</p>
          </div>
          <button 
            type="button" 
            onClick={loadData}
            className="p-2 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0"/>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0"/>
            {successMsg}
          </div>
        )}

        <form onSubmit={registrarMovimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-select-movement" className="block text-xs font-semibold text-slate-300 mb-1.5">Medicamento</label>
              <select
                id="med-select-movement"
                value={medId}
                onChange={e => setMedId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {medicamentos.length === 0 ? (
                  <option value="">Cargando medicamentos...</option>
                ) : (
                  medicamentos.map(m => (
                    <option key={m.id} value={m.id}>{m.nombreComercial} ({m.principioActivo})</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label htmlFor="lote-select-movement" className="block text-xs font-semibold text-slate-300 mb-1.5">Lote correspondiente</label>
              <select
                id="lote-select-movement"
                value={loteId}
                onChange={e => setLoteId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {lotesFiltrados.length === 0 ? (
                  <option value="">Sin lotes vigentes disponibles</option>
                ) : (
                  lotesFiltrados.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.codigoLote} (Stock: {l.cantidadActual} · Vence: {new Date(l.fechaVencimiento).toLocaleDateString('es-CL')})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tipo-select-movement" className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Movimiento</label>
              <select
                id="tipo-select-movement"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="merma">Merma (Rotura, vencimiento)</option>
                <option value="ajuste">Ajuste Manual</option>
              </select>
            </div>
            <div>
              <label htmlFor="cantidad-movement-input" className="block text-xs font-semibold text-slate-300 mb-1.5">Cantidad (Valor negativo para egreso)</label>
              <input
                id="cantidad-movement-input"
                type="number"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="motivo-movement-input" className="block text-xs font-semibold text-slate-300 mb-1.5">Justificación / Motivo del Movimiento</label>
            <input
              id="motivo-movement-input"
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Rotura de ampolla al descargar lote"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!loteId}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200 cursor-pointer"
          >
            Registrar Movimiento en Inventario
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
