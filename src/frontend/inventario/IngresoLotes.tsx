import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR10Props {
  currentRole: UserRole;
}

export const IngresoLotes: React.FC<SCR10Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [codigoLote, setCodigoLote] = useState('');
  const [medId, setMedId] = useState('1');
  const [compraId, setCompraId] = useState('');
  const [cantidad, setCantidad] = useState(100);
  const [precio, setPrecio] = useState(5000);
  const [vencimiento, setVencimiento] = useState('2026-12-31');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const ingresarLote = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!codigoLote || !compraId || !vencimiento) {
      setErrorMsg('Faltan campos obligatorios para registrar el lote.');
      return;
    }

    // CH-28: Cantidad inicial
    if (cantidad <= 0) {
      setErrorMsg('Error CH-28: La cantidad inicial del lote debe ser mayor a 0.');
      return;
    }

    // CH-42: Precio compra
    if (precio <= 0) {
      setErrorMsg('Error CH-42: El precio de compra unitario debe ser mayor a 0.0.');
      return;
    }

    // CH-31: Fecha vencimiento
    const vDate = new Date(vencimiento);
    if (vDate <= new Date()) {
      setErrorMsg('Error CH-31: La fecha de vencimiento debe ser posterior a la fecha actual.');
      return;
    }

    setSuccessMsg(`Lote '${codigoLote}' recibido e ingresado con éxito. Movimiento de entrada registrado.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Recepción de Compras e Ingreso de Lotes</h1>
          <p className="text-slate-400 text-xs">Carga física de insumos y medicamentos asociados a facturas de proveedores (L5).</p>
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

        <form onSubmit={ingresarLote} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="codigo-lote-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Código Lote</label>
              <input
                id="codigo-lote-input"
                type="text"
                value={codigoLote}
                onChange={e => setCodigoLote(e.target.value)}
                placeholder="Ej: LOTE-FN-992"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="compra-id" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Orden/Factura Compra</label>
              <input
                id="compra-id"
                type="text"
                value={compraId}
                onChange={e => setCompraId(e.target.value)}
                placeholder="Ej: 50"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-select-lote" className="block text-xs font-semibold text-slate-400 mb-1.5">Medicamento / Item</label>
              <select
                id="med-select-lote"
                value={medId}
                onChange={e => setMedId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Fenobarbital 100mg</option>
                <option value="2">Ketamina Solución</option>
                <option value="3">Amoxicilina Suspensión</option>
              </select>
            </div>
            <div>
              <label htmlFor="vencimiento-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Fecha Vencimiento (Lote)</label>
              <input
                id="vencimiento-input"
                type="date"
                value={vencimiento}
                onChange={e => setVencimiento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cantidad-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Cantidad Inicial Recibida</label>
              <input
                id="cantidad-input"
                type="number"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="precio-compra-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Costo Unitario Compra ($)</label>
              <input
                id="precio-compra-input"
                type="number"
                value={precio}
                onChange={e => setPrecio(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Registrar Ingreso de Lote
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
