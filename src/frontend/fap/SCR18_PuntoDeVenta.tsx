import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR18Props {
  currentRole: UserRole;
}

export const SCR18_PuntoDeVenta: React.FC<SCR18Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [propietarioId, setPropietarioId] = useState('');
  const [items, setItems] = useState<Array<{ id: number; name: string; price: number; qty: number }>>([
    { id: 1, name: 'Consulta Médica de Urgencia', price: 25000, qty: 1 },
    { id: 2, name: 'Fenobarbital 100mg (Caja)', price: 12500, qty: 1 },
  ]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const iva = Math.round(subtotal * 0.19); // IVA 19% Chile
  const total = subtotal + iva;

  const cobrarComprobante = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!propietarioId) {
      setErrorMsg('Debe seleccionar o ingresar un propietario para emitir el comprobante (BR-44).');
      return;
    }

    if (total <= 0) {
      setErrorMsg('El total de la venta debe ser mayor a 0.0.');
      return;
    }

    // CH-63 methods check
    const metodosPermitidos = ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'seguro'];
    if (!metodosPermitidos.includes(metodoPago)) {
      setErrorMsg('Error CH-63: Metodo de pago invalido.');
      return;
    }

    setSuccessMsg(`Venta cobrada con éxito. Emisión de boleta electrónica por $${total} CLP ($${iva} CLP IVA incluido).`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'cajero']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalle Venta */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-200">Terminal de Punto de Venta (POS)</h2>
          
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
                  <span className="text-[10px] text-slate-500">Cantidad: {item.qty} x ${item.price} CLP</span>
                </div>
                <span className="text-sm font-bold text-slate-300">${item.price * item.qty} CLP</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-850 pt-4 space-y-1.5 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal Neto</span>
              <span>${subtotal} CLP</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19% CH-58/72)</span>
              <span>${iva} CLP</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-slate-100">
              <span>Total Comprobante</span>
              <span className="text-emerald-400">${total} CLP</span>
            </div>
          </div>
        </div>

        {/* Datos Facturación e Cobro */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Emitir Comprobante</h3>

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

          <form onSubmit={cobrarComprobante} className="space-y-4">
            <div>
              <label htmlFor="propietario-id-pos" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Propietario / Cliente</label>
              <input
                id="propietario-id-pos"
                type="text"
                value={propietarioId}
                onChange={e => setPropietarioId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="pago-method-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Método de Pago (CH-63)</label>
              <select
                id="pago-method-select"
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_debito">Tarjeta Débito (Transbank)</option>
                <option value="tarjeta_credito">Tarjeta Crédito (Multimétodo)</option>
                <option value="transferencia">Transferencia Electrónica</option>
                <option value="seguro">Seguro Veterinario Cobertura</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Procesar y Emitir Boleta
            </button>
          </form>
        </div>
      </div>
    </StateWrapper>
  );
};
