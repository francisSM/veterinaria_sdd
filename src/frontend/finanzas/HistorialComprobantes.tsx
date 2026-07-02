import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShieldAlert, CheckCircle, Search, FileText, Printer, Check, Eye } from 'lucide-react';

interface ItemDetalle { id: number; descripcion: string; cantidadItems: number; precioUnitario: number; descuentoItem: number; }
interface Comprobante { id: number; propietarioId: number; cajaDiariaId: number; tipoDocumento: string; folioFactura: string | null; montoTotal: number; estado: string; fechaEmision: string; propietarioNombre: string; propietarioRut: string; propietarioEmail: string; items: ItemDetalle[]; }

interface SCR19Props { currentRole: UserRole; token?: string; }

const roundToNearestTen = (amount: any): number => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return 0;
  let rounded = Math.round(num);
  const residuo = rounded % 10;
  if (residuo >= 5) {
    return rounded + (10 - residuo);
  } else {
    return rounded - residuo;
  }
};

const formatCLP = (amount: any): string => {
  return roundToNearestTen(amount).toLocaleString('es-CL');
};

export const HistorialComprobantes: React.FC<SCR19Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal de visualización PDF
  const [comprobantePDF, setComprobantePDF] = useState<Comprobante | null>(null);

  // Registro de pago manual (Confirmación de pago)
  const [pagoMetodoId, setPagoMetodoId] = useState('1'); // Efectivo por defecto

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeToken}` };

  const loadComprobantes = async () => {
    try {
      const res = await fetch('/api/v1/finanzas/comprobantes', { headers });
      if (res.ok) {
        setComprobantes(await res.json());
      } else {
        setErrorMsg('Error al cargar historial de comprobantes.');
      }
    } catch {
      setErrorMsg('Error de red al consultar comprobantes.');
    }
  };

  useEffect(() => {
    loadComprobantes();
  }, []);

  const confirmarPagoFactura = async (comprobante: Comprobante) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/v1/finanzas/pagos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          boletaId: comprobante.id,
          metodoPagoId: Number(pagoMetodoId),
          montoPagado: roundToNearestTen(comprobante.montoTotal)
        })
      });
      if (res.ok) {
        setSuccessMsg(`Pago confirmado para el comprobante #${comprobante.id}. Se ha emitido la Boleta oficial.`);
        loadComprobantes();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Error al confirmar pago.');
      }
    } catch {
      setErrorMsg('Error al procesar el pago.');
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const filtrados = comprobantes.filter(c => {
    const cumpleTexto =
      c.id.toString().includes(filtroTexto) ||
      c.propietarioNombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.propietarioRut.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (c.folioFactura && c.folioFactura.toLowerCase().includes(filtroTexto.toLowerCase()));
    
    const cumpleEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    return cumpleTexto && cumpleEstado;
  });

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario', 'cliente']} currentRole={currentRole}>
      <div className="space-y-6">
        
        {/* CSS para Impresión limpia sin elementos de UI */}
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body * {
              visibility: hidden;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 0px !important;
              border: none !important;
              box-shadow: none !important;
            }
            .fixed {
              position: absolute !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .bg-white.w-full.max-w-2xl {
              border: none !important;
              box-shadow: none !important;
              max-height: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}</style>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Historial de Comprobantes Fiscales</h1>
            <p className="text-slate-500 text-xs mt-0.5">Consulta de facturas y boletas oficiales de la veterinaria (L5).</p>
          </div>

          {currentRole !== 'cliente' && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Método Pago Confirmación:</label>
              <select value={pagoMetodoId} onChange={e => setPagoMetodoId(e.target.value)} className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2 focus:outline-none">
                <option value="1">Efectivo</option>
                <option value="2">Tarjeta Débito</option>
                <option value="3">Tarjeta Crédito</option>
                <option value="4">Transferencia</option>
              </select>
            </div>
          )}
        </div>

        {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

        {/* BARRA DE FILTROS */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input type="text" placeholder="Buscar por Folio, Cliente o RUT..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-400 focus:outline-none"/>
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 focus:outline-none">
            <option value="todos">Todos los estados</option>
            <option value="emitida">Emitida (Factura Pendiente)</option>
            <option value="pagada">Pagada (Boleta Generada)</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">Folio / Documento</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Fecha Emisión</th>
                  <th className="p-4 text-right">Monto Total</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No hay comprobantes fiscales que coincidan con la búsqueda.</td>
                  </tr>
                ) : (
                  filtrados.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 text-slate-700 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Folio #{c.id}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            c.tipoDocumento === 'boleta' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                          }`}>{c.tipoDocumento}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{c.propietarioNombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.propietarioRut}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(c.fechaEmision).toLocaleString('es-CL')}</td>
                      <td className="p-4 text-right font-bold text-slate-900">${formatCLP(c.montoTotal)} CLP</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          c.estado === 'pagada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          c.estado === 'anulada' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{c.estado}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setComprobantePDF(c)} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer" title="Ver Boleta PDF">
                            <Eye className="h-3 w-3"/><span>Ver PDF</span>
                          </button>
                          
                          {currentRole !== 'cliente' && c.estado === 'emitida' && (
                            <button onClick={() => confirmarPagoFactura(c)} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer" title="Confirmar Pago Externo">
                              <Check className="h-3 w-3"/><span>Confirmar Pago</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DE VISTA PDF / COMPROBANTE OFICIAL IMPRIMIBLE */}
        {comprobantePDF && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Encabezado del Modal */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0 no-print">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500"/> Visor de Comprobante PDF Oficial
                </span>
                <div className="flex gap-2">
                  <button onClick={handleImprimir} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs">
                    <Printer className="h-3.5 w-3.5"/><span>Imprimir / Guardar PDF</span>
                  </button>
                  <button onClick={() => setComprobantePDF(null)} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Área Imprimible de la Boleta */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50" id="invoice-print-area">
                <div className="border border-slate-200 p-8 rounded-xl bg-white space-y-8 shadow-xs max-w-lg mx-auto">
                  {/* Header Boleta */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">VG</div>
                        <h2 className="text-lg font-bold text-slate-900">VETGUARD LIMITADA</h2>
                      </div>
                      <p className="text-[10px] text-slate-500">Giro: Centro Clínico Veterinario y Farmacia</p>
                      <p className="text-[10px] text-slate-500">Dirección: Av. Diagonal Central #409, Santiago</p>
                      <p className="text-[10px] text-slate-500">Fono: +56 2 2841 9000</p>
                    </div>

                    <div className="border-2 border-rose-600 p-4 rounded-xl text-center bg-rose-50/50 space-y-1 min-w-[200px]">
                      <h3 className="text-rose-600 font-extrabold text-xs tracking-wider">R.U.T. 76.882.490-K</h3>
                      <h4 className="text-rose-700 font-black text-sm uppercase tracking-wide">
                        {comprobantePDF.estado === 'pagada' ? 'BOLETA ELECTRÓNICA' : 'FACTURA DE VENTA'}
                      </h4>
                      <p className="text-rose-600 font-bold text-xs">N° FOLIO: {comprobantePDF.id}</p>
                    </div>
                  </div>

                  {/* Datos del Cliente */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2 grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <p><strong>Señor(a):</strong> {comprobantePDF.propietarioNombre}</p>
                      <p><strong>R.U.T.:</strong> {comprobantePDF.propietarioRut}</p>
                    </div>
                    <div>
                      <p><strong>Fecha Emisión:</strong> {new Date(comprobantePDF.fechaEmision).toLocaleString('es-CL')}</p>
                      <p><strong>Email:</strong> {comprobantePDF.propietarioEmail}</p>
                    </div>
                  </div>

                  {/* Tabla de Items */}
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="p-3">Descripción del Servicio / Producto</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3 text-right">P. Unitario</th>
                          <th className="p-3 text-right">Desc.</th>
                          <th className="p-3 text-right text-slate-900">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {comprobantePDF.items.map((item, idx) => {
                          const sub = (item.precioUnitario - item.descuentoItem) * item.cantidadItems;
                          return (
                            <tr key={idx} className="text-slate-600">
                              <td className="p-3 font-medium text-slate-900">{item.descripcion}</td>
                              <td className="p-3 text-center">{item.cantidadItems}</td>
                              <td className="p-3 text-right">${formatCLP(item.precioUnitario)}</td>
                              <td className="p-3 text-right text-rose-500">-${formatCLP(item.descuentoItem)}</td>
                              <td className="p-3 text-right text-slate-900 font-semibold">${formatCLP(sub)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales y Forma de Pago */}
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                      <p>El pago de este comprobante ha sido confirmado a través de caja operativa.</p>
                      <p>El IVA correspondiente a esta operación comercial está contemplado en el monto final facturado.</p>
                      <div className="mt-2 flex items-center gap-1.5 text-slate-700">
                        <strong>Estado de Pago:</strong>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                          comprobantePDF.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {comprobantePDF.estado === 'pagada' ? 'BOLETA PAGADA' : 'PENDIENTE DE PAGO / FACTURA'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 w-64 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Neto Facturado:</span>
                        <span>${formatCLP(comprobantePDF.montoTotal * 0.81)} CLP</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>IVA (19%):</span>
                        <span>${formatCLP(comprobantePDF.montoTotal * 0.19)} CLP</span>
                      </div>
                      <div className="h-px bg-slate-200 my-1"></div>
                      <div className="flex justify-between text-base font-black text-slate-900">
                        <span>TOTAL A PAGAR:</span>
                        <span>${formatCLP(comprobantePDF.montoTotal)} CLP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StateWrapper>
  );
};