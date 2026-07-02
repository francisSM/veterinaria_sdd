import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { ShoppingCart, ShieldAlert, CheckCircle, Search, Plus, Trash2, Tag, Percent, DollarSign, Calendar, AlertCircle, X, Grid, Layers, Pill, Activity, Shield } from 'lucide-react';

const roundToNearestTen = (amount: number): number => {
  let rounded = Math.round(amount);
  const residuo = rounded % 10;
  if (residuo >= 5) {
    return rounded + (10 - residuo);
  } else {
    return rounded - residuo;
  }
};

const formatCLP = (amount: number): string => {
  return roundToNearestTen(amount).toLocaleString('es-CL');
};

interface SCR18Props {
  currentRole: UserRole;
}

interface Propietario {
  id: number;
  nombre: string;
  rut: string;
  email: string;
}

interface Paciente {
  id: number;
  nombre: string;
  especie: string;
  propietarioId: number;
}

interface Medicamento {
  id: number;
  nombreComercial: string;
  principioActivo: string;
  precioVenta: number;
  stockTotal: number;
}

interface ServicioTarifa {
  id: number;
  nombre: string;
  categoria: string;
  tipo: string;
  tarifaBase: number;
  tarifaMax?: number | null;
  notas?: string;
}

interface Campana {
  id: number;
  motivo: string;
  porcentaje: number;
  activo: boolean;
}

interface ConvenioSeguro {
  id: number;
  propietarioId: number;
  compania: string;
  polizaNumero: string;
  pacienteId?: number;
  coberturaPorcentaje?: number;
  cubreCirugias?: boolean;
  cubreMedicamentos?: boolean;
  medicamentosCobertura?: string;
  cirugiasCobertura?: string;
}

interface Hospitalizacion {
  id: number;
  pacienteId: number;
  salaId: number;
  fechaIngreso: string;
  fechaAlta: string | null;
  costoDia: number;
  estado: 'activo' | 'alta' | 'fallecido';
}

interface CartItem {
  id: string; // único para el carro
  type: 'servicio' | 'medicamento';
  refId: number;
  name: string;
  price: number;
  qty: number;
  descuentoSeguro: number;
}

export const PuntoDeVenta: React.FC<SCR18Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [servicios, setServicios] = useState<ServicioTarifa[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [convenios, setConvenios] = useState<ConvenioSeguro[]>([]);

  // Búsqueda de Propietario (Cliente)
  const [busquedaProp, setBusquedaProp] = useState('');
  const [selectedProp, setSelectedProp] = useState<Propietario | null>(null);

  // Mascotas asociadas al propietario seleccionado
  const [mascotasAsociadas, setMascotasAsociadas] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Hospitalización y Seguro activos
  const [hospActiva, setHospActiva] = useState<Hospitalizacion | null>(null);
  const [seguroActivo, setSeguroActivo] = useState<ConvenioSeguro | null>(null);

  // Carrito de compras
  const [cart, setCart] = useState<CartItem[]>([]);

  // Lógica de Selección a través de Catalogo Overlay
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [catalogoTab, setCatalogoTab] = useState<'servicio' | 'medicamento'>('servicio');
  
  // Filtros internos del Catálogo
  const [filtroCatTexto, setFiltroCatTexto] = useState('');
  const [filtroCatServicio, setFiltroCatServicio] = useState('Todos');
  const [filtroCatMedicamento, setFiltroCatMedicamento] = useState('Todos');

  // Item seleccionado listo para ser agregado en el POS
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<{
    id: string;
    type: 'servicio' | 'medicamento';
    refId: number;
    name: string;
    price: number;
  } | null>(null);

  const [precioEditable, setPrecioEditable] = useState(0);
  const [cantidadItem, setCantidadItem] = useState(1);

  // Campaña de Descuento
  const [selectedCampanaId, setSelectedCampanaId] = useState('');

  // Lógica de Abonos parciales
  const [pagoParcial, setPagoParcial] = useState(false);
  const [montoAbonado, setMontoAbonado] = useState('');
  const [plazoDias, setPlazoDias] = useState(30);

  const [tipoDocumento, setTipoDocumento] = useState('boleta');
  const [metodoPagoId, setMetodoPagoId] = useState('1'); // Efectivo
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cargandoHospitalizacion, setCargandoHospitalizacion] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  const serviciosCategorias = Array.from(new Set(servicios.map(s => s.categoria)));

  // Cargar maestros de la API real (cero mock)
  const loadMasterData = async () => {
    try {
      const [rProp, rPac, rMed, rServ, rCamp, rConv] = await Promise.all([
        fetch('/api/v1/clinica/propietarios', { headers }),
        fetch('/api/v1/clinica/pacientes', { headers }),
        fetch('/api/v1/inventario/medicamentos/stock', { headers }),
        fetch('/api/v1/clinica/tarifas', { headers }),
        fetch('/api/v1/finanzas/campanas', { headers }),
        fetch('/api/v1/finanzas/convenios', { headers })
      ]);

      if (rProp.ok) setPropietarios(await rProp.json());
      if (rPac.ok) setPacientes(await rPac.json());
      if (rMed.ok) setMedicamentos(await rMed.json());
      if (rServ.ok) setServicios(await rServ.json());
      if (rCamp.ok) setCampanas(await rCamp.json());
      if (rConv.ok) setConvenios(await rConv.json());
    } catch (err) {
      console.error('Error POS load:', err);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Al cambiar el Propietario seleccionado, cargar sus pacientes
  useEffect(() => {
    if (selectedProp) {
      const filtered = pacientes.filter(p => p.propietarioId === selectedProp.id);
      setMascotasAsociadas(filtered);
      if (filtered.length > 0) {
        setSelectedPaciente(filtered[0]);
      } else {
        setSelectedPaciente(null);
      }
    } else {
      setMascotasAsociadas([]);
      setSelectedPaciente(null);
      setHospActiva(null);
      setSeguroActivo(null);
    }
  }, [selectedProp, pacientes]);

  // Buscar convenio de seguro y hospitalización activa
  useEffect(() => {
    const checkPacienteEvents = async () => {
      if (selectedPaciente) {
        const seguro = convenios.find(c => c.pacienteId === selectedPaciente.id);
        setSeguroActivo(seguro || null);

        try {
          const res = await fetch('/api/v1/clinica/hospitalizaciones', { headers });
          if (res.ok) {
            const list: Hospitalizacion[] = await res.json();
            const activa = list.find(h => h.pacienteId === selectedPaciente.id && h.estado === 'activo');
            setHospActiva(activa || null);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setHospActiva(null);
        setSeguroActivo(null);
      }
    };
    checkPacienteEvents();
  }, [selectedPaciente, convenios]);

  // Recalcular descuentos de seguros en el carro si cambia el seguro activo
  useEffect(() => {
    if (cart.length > 0) {
      const updatedCart = cart.map(item => {
        let descSeguro = 0;
        if (seguroActivo) {
          const cobPorc = seguroActivo.coberturaPorcentaje || 0;
          if (item.type === 'servicio' && seguroActivo.cubreCirugias) {
            const cirugiasCubiertas = seguroActivo.cirugiasCobertura ? seguroActivo.cirugiasCobertura.toLowerCase() : '';
            const esCubierta = cirugiasCubiertas.includes(item.name.toLowerCase()) || seguroActivo.coberturaPorcentaje;
            if (esCubierta) {
              descSeguro = Math.round(item.price * item.qty * (cobPorc / 100));
            }
          } else if (item.type === 'medicamento' && seguroActivo.cubreMedicamentos) {
            const medsCubiertos = seguroActivo.medicamentosCobertura ? seguroActivo.medicamentosCobertura.split(',') : [];
            const esCubierta = medsCubiertos.includes(item.refId.toString()) || seguroActivo.coberturaPorcentaje;
            if (esCubierta) {
              descSeguro = Math.round(item.price * item.qty * (cobPorc / 100));
            }
          }
        }
        return { ...item, descuentoSeguro: descSeguro };
      });
      setCart(updatedCart);
    }
  }, [seguroActivo]);

  // Cargar cargos por hospitalización automáticamente
  const handleCargarCargosHospitalizacion = () => {
    if (!selectedPaciente || !hospActiva) return;
    setCargandoHospitalizacion(true);

    try {
      const ingreso = new Date(hospActiva.fechaIngreso);
      const hoy = new Date();
      const diffMs = Math.abs(hoy.getTime() - ingreso.getTime());
      const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const nuevosItems: CartItem[] = [];

      const servHosp = servicios.find(s => s.nombre.includes('Hospitalización (por dia)') || s.id === 12) || { id: 12, nombre: 'Hospitalización (por dia)', tarifaBase: 35000 };
      nuevosItems.push({
        id: `serv-hosp-${hospActiva.id}`,
        type: 'servicio',
        refId: servHosp.id,
        name: `Día de Hospitalización — Paciente "${selectedPaciente.nombre}" (${dias} días)`,
        price: hospActiva.costoDia || servHosp.tarifaBase,
        qty: dias,
        descuentoSeguro: 0
      });

      nuevosItems.push({
        id: `serv-anestesia-${hospActiva.id}`,
        type: 'servicio',
        refId: 99,
        name: `Consumo de Anestesia Clínica General — ${selectedPaciente.nombre}`,
        price: 30000,
        qty: 1,
        descuentoSeguro: 0
      });

      const medTramadol = medicamentos.find(m => m.nombreComercial.includes('Tramadol') || m.id === 2);
      if (medTramadol) {
        nuevosItems.push({
          id: `med-hosp-inj-${medTramadol.id}`,
          type: 'medicamento',
          refId: medTramadol.id,
          name: `Medicamento ${medTramadol.nombreComercial} — Inyectado en Hospitalización`,
          price: medTramadol.precioVenta,
          qty: 2,
          descuentoSeguro: 0
        });
      }

      const itemsConSeguro = nuevosItems.map(item => {
        let desc = 0;
        if (seguroActivo) {
          const cobertura = seguroActivo.coberturaPorcentaje || 0;
          if (item.type === 'servicio' && seguroActivo.cubreCirugias) {
            desc = Math.round(item.price * item.qty * (cobertura / 100));
          } else if (item.type === 'medicamento' && seguroActivo.cubreMedicamentos) {
            desc = Math.round(item.price * item.qty * (cobertura / 100));
          }
        }
        return { ...item, descuentoSeguro: desc };
      });

      setCart([...cart, ...itemsConSeguro]);
      setSuccessMsg(`Cargos de hospitalización cargados para "${selectedPaciente.nombre}" con éxito.`);
    } catch (err: any) {
      setErrorMsg('Error al cargar hospitalización: ' + err.message);
    } finally {
      setCargandoHospitalizacion(false);
    }
  };

  const handleAgregarAlCarro = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!conceptoSeleccionado) {
      setErrorMsg('Debe seleccionar un servicio o medicamento usando el buscador del catálogo.');
      return;
    }

    if (cantidadItem <= 0) {
      setErrorMsg('La cantidad debe ser mayor a 0.');
      return;
    }

    if (precioEditable < 0) {
      setErrorMsg('El precio unitario no puede ser negativo.');
      return;
    }

    let itemAAgregar: CartItem;

    if (conceptoSeleccionado.type === 'servicio') {
      const serv = servicios.find(s => s.id === conceptoSeleccionado.refId);
      if (!serv) return;

      let descSeguro = 0;
      if (seguroActivo && seguroActivo.cubreCirugias) {
        const cirugiasCubiertas = seguroActivo.cirugiasCobertura ? seguroActivo.cirugiasCobertura.toLowerCase() : '';
        const esCubierta = cirugiasCubiertas.includes(serv.nombre.toLowerCase()) || seguroActivo.coberturaPorcentaje;
        if (esCubierta) {
          descSeguro = Math.round(precioEditable * cantidadItem * ((seguroActivo.coberturaPorcentaje || 0) / 100));
        }
      }

      itemAAgregar = {
        id: `serv-${serv.id}-${Date.now()}`,
        type: 'servicio',
        refId: serv.id,
        name: serv.nombre,
        price: precioEditable,
        qty: cantidadItem,
        descuentoSeguro: descSeguro
      };
    } else {
      const med = medicamentos.find(m => m.id === conceptoSeleccionado.refId);
      if (!med) return;

      let descSeguro = 0;
      if (seguroActivo && seguroActivo.cubreMedicamentos) {
        const medsCubiertos = seguroActivo.medicamentosCobertura ? seguroActivo.medicamentosCobertura.split(',') : [];
        const esCubierta = medsCubiertos.includes(med.id.toString()) || seguroActivo.coberturaPorcentaje;
        if (esCubierta) {
          descSeguro = Math.round(precioEditable * cantidadItem * ((seguroActivo.coberturaPorcentaje || 0) / 100));
        }
      }

      itemAAgregar = {
        id: `med-${med.id}-${Date.now()}`,
        type: 'medicamento',
        refId: med.id,
        name: med.nombreComercial,
        price: precioEditable,
        qty: cantidadItem,
        descuentoSeguro: descSeguro
      };
    }

    setCart([...cart, itemAAgregar]);
    setConceptoSeleccionado(null);
    setPrecioEditable(0);
    setCantidadItem(1);
  };

  const handleEditarPrecioItem = (itemId: string, nuevoPrecio: number) => {
    if (nuevoPrecio < 0) return;
    setCart(cart.map(item => {
      if (item.id === itemId) {
        let descSeguro = 0;
        if (seguroActivo) {
          const cobPorc = seguroActivo.coberturaPorcentaje || 0;
          if (item.type === 'servicio' && seguroActivo.cubreCirugias) {
            descSeguro = Math.round(nuevoPrecio * item.qty * (cobPorc / 100));
          } else if (item.type === 'medicamento' && seguroActivo.cubreMedicamentos) {
            descSeguro = Math.round(nuevoPrecio * item.qty * (cobPorc / 100));
          }
        }
        return { ...item, price: nuevoPrecio, descuentoSeguro: descSeguro };
      }
      return item;
    }));
  };

  const handleEliminarItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Totales
  const subtotalNeto = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const totalDescuentoSeguro = cart.reduce((acc, curr) => acc + curr.descuentoSeguro, 0);

  let porcentajeCampana = 0;
  let motivoCampana = '';
  let tipoCampana: 'general' | 'especifico' = 'general';
  let campanaServs: string[] = [];
  let campanaMeds: string[] = [];

  if (selectedCampanaId) {
    const camp = campanas.find(c => c.id === Number(selectedCampanaId));
    if (camp) {
      porcentajeCampana = camp.porcentaje;
      motivoCampana = camp.motivo;
      tipoCampana = camp.tipoDescuento || 'general';
      campanaServs = camp.serviciosIds ? camp.serviciosIds.split(',') : [];
      campanaMeds = camp.medicamentosIds ? camp.medicamentosIds.split(',') : [];
    }
  }

  const subtotalConSeguro = Math.max(0, subtotalNeto - totalDescuentoSeguro);

  let totalDescuentoCampana = 0;
  if (tipoCampana === 'especifico' && selectedCampanaId) {
    totalDescuentoCampana = cart.reduce((acc, item) => {
      let califica = false;
      if (item.type === 'servicio') {
        califica = campanaServs.includes(item.name) || campanaServs.includes(item.refId.toString());
      } else if (item.type === 'medicamento') {
        califica = campanaMeds.includes(item.refId.toString()) || campanaMeds.includes(item.name);
      }
      
      if (califica) {
        const itemNeto = (item.price * item.qty) - item.descuentoSeguro;
        return acc + Math.round(itemNeto * (porcentajeCampana / 100));
      }
      return acc;
    }, 0);
  } else {
    totalDescuentoCampana = Math.round(subtotalConSeguro * (porcentajeCampana / 100));
  }

  const totalDescuentos = totalDescuentoSeguro + totalDescuentoCampana;
  const subtotalConDescuentos = Math.max(0, subtotalNeto - totalDescuentos);
  const iva = Math.round(subtotalConDescuentos * 0.19);
  const totalFinal = roundToNearestTen(subtotalConDescuentos + iva);

  const cobrarComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProp) {
      setErrorMsg('Debe seleccionar un cliente para cobrar.');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('El carrito está vacío.');
      return;
    }

    let abonoNum = null;
    if (pagoParcial) {
      abonoNum = Number(montoAbonado);
      if (isNaN(abonoNum) || abonoNum <= 0) {
        setErrorMsg('El monto abonado debe ser válido.');
        return;
      }
      if (abonoNum >= totalFinal) {
        setErrorMsg('El abono parcial debe ser menor al total.');
        return;
      }
    }

    try {
      setUxState('loading');
      const response = await fetch('/api/v1/finanzas/comprobantes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propietarioId: selectedProp.id,
          cajaDiariaId: 1,
          tipoDocumento,
          montoTotal: totalFinal,
          montoAbonado: abonoNum,
          plazoDias: pagoParcial ? plazoDias : undefined,
          metodoPagoId: Number(metodoPagoId),
          items: cart.map(item => ({
            descripcion: item.name,
            cantidadItems: item.qty,
            precioUnitario: item.price,
            descuentoItem: item.descuentoSeguro
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Error al procesar el cobro.');
        setUxState('data');
        return;
      }

      if (pagoParcial) {
        setSuccessMsg(`Abono registrado con éxito. Folio #${data.id} emitido. Abonado: $${formatCLP(abonoNum || 0)} CLP (Deuda restante: $${formatCLP(totalFinal - (abonoNum || 0))} CLP).`);
      } else {
        setSuccessMsg(`Comprobante fiscal folio #${data.id} registrado con éxito por $${formatCLP(totalFinal)} CLP.`);
      }

      setCart([]);
      setSelectedProp(null);
      setSelectedPaciente(null);
      setHospActiva(null);
      setSeguroActivo(null);
      setBusquedaProp('');
      setPagoParcial(false);
      setMontoAbonado('');
      setSelectedCampanaId('');
      setUxState('data');
      await loadMasterData();
    } catch (err: any) {
      setErrorMsg(err.message);
      setUxState('data');
    }
  };

  const categorizarMedicamento = (med: Medicamento): string => {
    const pc = med.principioActivo.toLowerCase();
    if (pc.includes('ketamina') || pc.includes('isoflurano')) return 'Anestésicos';
    if (pc.includes('tramadol') || pc.includes('meloxicam')) return 'Analgésicos';
    if (pc.includes('amoxicilina') || pc.includes('enrofloxacino')) return 'Antibióticos';
    return 'Otros';
  };

  const conceptosFiltrados = () => {
    if (catalogoTab === 'servicio') {
      return servicios.filter(s => {
        const coincideBusc = s.nombre.toLowerCase().includes(filtroCatTexto.toLowerCase()) || 
                             (s.notas && s.notas.toLowerCase().includes(filtroCatTexto.toLowerCase()));
        const coincideCat = filtroCatServicio === 'Todos' || s.categoria === filtroCatServicio;
        return coincideBusc && coincideCat;
      });
    } else {
      return medicamentos.filter(m => {
        const coincideBusc = m.nombreComercial.toLowerCase().includes(filtroCatTexto.toLowerCase()) ||
                             m.principioActivo.toLowerCase().includes(filtroCatTexto.toLowerCase());
        const tipo = categorizarMedicamento(m);
        const coincideTipo = filtroCatMedicamento === 'Todos' || tipo === filtroCatMedicamento;
        return coincideBusc && coincideTipo;
      });
    }
  };

  const seleccionarConceptoDelCatalogo = (item: any) => {
    if (catalogoTab === 'servicio') {
      setConceptoSeleccionado({
        id: `serv-${item.id}`,
        type: 'servicio',
        refId: item.id,
        name: item.nombre,
        price: item.tarifaBase
      });
      setPrecioEditable(item.tarifaBase);
    } else {
      setConceptoSeleccionado({
        id: `med-${item.id}`,
        type: 'medicamento',
        refId: item.id,
        name: item.nombreComercial,
        price: item.precioVenta
      });
      setPrecioEditable(item.precioVenta);
    }
    setMostrarCatalogo(false);
    setFiltroCatTexto('');
  };

  const propietariosFiltrados = propietarios.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProp.toLowerCase()) ||
    p.rut.toLowerCase().includes(busquedaProp.toLowerCase())
  );

  const esPagoParcial = pagoParcial && montoAbonado !== '' && Number(montoAbonado) < totalFinal;

  return (
    <StateWrapper currentState={uxState} onStateChange={setUxState} allowedRoles={['administrador', 'veterinario']} currentRole={currentRole}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARRO DE COMPRAS E INGRESADOR */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Punto de Venta y Facturación (POS)</h2>
            </div>
            {seguroActivo && (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase animate-pulse">
                🛡 Seguro Activo: {seguroActivo.coberturaPorcentaje}% Cobertura
              </span>
            )}
          </div>

          {/* INFORMACIÓN DETALLADA DEL CONVENIO DE SEGURO */}
          {seguroActivo && selectedPaciente && (
            <div className="bg-emerald-50/70 border border-emerald-250 rounded-xl p-4 space-y-2 text-xs text-emerald-850 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Póliza de Salud Activa: {seguroActivo.compania} ({seguroActivo.polizaNumero})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] leading-relaxed">
                <div>
                  <strong>Cobertura Base:</strong> {seguroActivo.coberturaPorcentaje}%
                </div>
                <div>
                  <strong>Cubre Cirugías:</strong> {seguroActivo.cubreCirugias ? `Sí (${seguroActivo.cirugiasCobertura || 'Todas'})` : 'No'}
                </div>
                <div>
                  <strong>Cubre Fármacos:</strong> {seguroActivo.cubreMedicamentos ? `Sí (${seguroActivo.medicamentosCobertura || 'Todos'})` : 'No'}
                </div>
              </div>
            </div>
          )}

          {/* BANNER HOSPITALIZACIÓN */}
          {selectedPaciente && hospActiva && (
            <div className="bg-amber-50 border border-amber-250 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-850">
                  <h4 className="font-bold">Mascota Hospitalizada Detectada</h4>
                  <p className="mt-0.5">El paciente <strong>{selectedPaciente.nombre}</strong> registra hospitalización activa. ¿Cargar insumos y estadía automáticamente?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCargarCargosHospitalizacion}
                disabled={cargandoHospitalizacion}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition-colors cursor-pointer"
              >
                Cargar Estadía y Consumos
              </button>
            </div>
          )}

          {/* INGRESADOR DE CONCEPTOS INTERACTIVO */}
          <form onSubmit={handleAgregarAlCarro} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 text-xs">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ingresar Concepto al Carrito</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-slate-500 mb-1.5 font-semibold">Seleccionar Concepto del Catálogo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setMostrarCatalogo(true); setCatalogoTab('servicio'); }}
                    className="flex-1 bg-white border border-slate-250 rounded-lg p-2.5 text-left text-slate-750 hover:border-indigo-400 focus:outline-none flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      {conceptoSeleccionado ? conceptoSeleccionado.name : '-- Buscar Servicio o Fármaco en Catálogo --'}
                    </span>
                    <Search className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
                  </button>
                  {conceptoSeleccionado && (
                    <button
                      type="button"
                      onClick={() => setConceptoSeleccionado(null)}
                      className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 font-semibold">Precio Unitario Ajustable ($)</label>
                <input
                  type="number"
                  min="0"
                  disabled={!conceptoSeleccionado}
                  value={precioEditable}
                  onChange={e => setPrecioEditable(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 disabled:bg-slate-100 text-slate-800 rounded-lg p-2.5 focus:outline-none font-bold text-indigo-650"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 font-semibold">Cantidad</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    disabled={!conceptoSeleccionado}
                    value={cantidadItem}
                    onChange={e => setCantidadItem(parseInt(e.target.value) || 1)}
                    className="w-20 bg-white border border-slate-200 disabled:bg-slate-100 text-slate-800 rounded-lg p-2.5 focus:outline-none text-center"
                  />
                  <button
                    type="submit"
                    disabled={!conceptoSeleccionado}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /><span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>

            {conceptoSeleccionado && (
              <div className="bg-indigo-50 border border-indigo-150 p-2.5 rounded-lg text-[10px] text-indigo-900 flex justify-between items-center animate-fade-in">
                <span>Concepto Seleccionado: <strong>{conceptoSeleccionado.name}</strong> ({conceptoSeleccionado.type === 'servicio' ? 'Servicio' : 'Medicamento'})</span>
                <span className="font-mono text-slate-500">Tarifa base: ${formatCLP(conceptoSeleccionado.price)} CLP</span>
              </div>
            )}
          </form>

          {/* DETALLE DEL CARRO */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Detalle de Cobro Actual</h3>
            {cart.length === 0 ? (
              <p className="text-slate-450 italic text-center p-8 bg-slate-50 rounded-xl border border-slate-100">El carrito de cobro está vacío. Utiliza el buscador para agregar conceptos.</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.type === 'servicio' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-pink-100 text-pink-800 border-pink-200'}`}>
                          {item.type === 'servicio' ? 'Serv' : 'Fármaco'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1">
                        Cantidad: {item.qty} x 
                        <input
                          type="number"
                          value={item.price}
                          onChange={e => handleEditarPrecioItem(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 bg-white border border-slate-250 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none font-bold text-right ml-1.5"
                        />
                        <span className="text-[10px] text-slate-455 ml-1">CLP c/u</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.descuentoSeguro > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                          - ${formatCLP(item.descuentoSeguro)} CLP (Seguro)
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-slate-800">
                        ${formatCLP((item.price * item.qty) - item.descuentoSeguro)} CLP
                      </span>
                      <button type="button" onClick={() => handleEliminarItem(item.id)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESGLOSE DE COBROS */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal Neto</span>
              <span className="font-semibold text-slate-700">${formatCLP(subtotalNeto)} CLP</span>
            </div>

            {totalDescuentoSeguro > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento Seguro Veterinario</span>
                <span className="font-bold">- ${formatCLP(totalDescuentoSeguro)} CLP</span>
              </div>
            )}

            {totalDescuentoCampana > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento Campaña ({motivoCampana} {porcentajeCampana}%)</span>
                <span className="font-bold">- ${formatCLP(totalDescuentoCampana)} CLP</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Subtotal afecto a Impuesto</span>
              <span className="font-semibold text-slate-700">${formatCLP(subtotalConDescuentos)} CLP</span>
            </div>

            <div className="flex justify-between">
              <span>IVA (19% CH-58/72)</span>
              <span className="font-semibold text-slate-700">${formatCLP(iva)} CLP</span>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-extrabold text-slate-850">
              <span>Total Comprobante</span>
              <span className="text-indigo-650 text-base font-extrabold">${formatCLP(totalFinal)} CLP</span>
            </div>
          </div>
        </div>

        {/* DATOS EMISIÓN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Parámetros de Cobro</h3>

          {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0" /><span>{errorMsg}</span></div>}
          {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{successMsg}</span></div>}

          <form onSubmit={cobrarComprobante} className="space-y-4 text-xs">
            {/* BUSQUEDA PROPIETARIO */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Buscar Cliente / Propietario</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
                <input value={busquedaProp} onChange={e => { setBusquedaProp(e.target.value); if(selectedProp) setSelectedProp(null); }} placeholder="Buscar por nombre o RUT..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"/>
              </div>
              
              {busquedaProp && !selectedProp && (
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-36 overflow-y-auto divide-y divide-slate-50 bg-white mt-1">
                  {propietariosFiltrados.length === 0 ? (
                    <p className="p-2 text-xs text-slate-400 text-center">No se encontraron clientes.</p>
                  ) : (
                    propietariosFiltrados.map(p => (
                      <button type="button" key={p.id} onClick={() => setSelectedProp(p)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer">
                        <span className="font-bold text-slate-800">{p.nombre}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{p.rut}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedProp && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl space-y-2">
                <div className="text-[10px] text-indigo-900 leading-relaxed">
                  <p><strong>Titular del Cobro:</strong> {selectedProp.nombre}</p>
                  <p><strong>RUT:</strong> {selectedProp.rut}</p>
                </div>

                {/* Seleccionar Paciente */}
                <div>
                  <label className="block text-slate-650 font-bold mb-1">Mascota Asociada (Paciente)</label>
                  {mascotasAsociadas.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic">Sin mascotas registradas.</p>
                  ) : (
                    <select
                      value={selectedPaciente?.id || ''}
                      onChange={e => setSelectedPaciente(mascotasAsociadas.find(p => p.id === Number(e.target.value)) || null)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="">-- Ninguna / General --</option>
                      {mascotasAsociadas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} ({p.especie})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* SELECCIONAR CAMPAÑA */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Aplicar Campaña Descuento</label>
              <select
                value={selectedCampanaId}
                onChange={e => setSelectedCampanaId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none"
              >
                <option value="">-- Sin campaña de descuento --</option>
                {campanas.map(c => (
                  <option key={c.id} value={c.id}>{c.motivo} ({c.porcentaje}% Desc)</option>
                ))}
              </select>

              {/* INFORMACIÓN DETALLADA DE LA CAMPAÑA DE DESCUENTO SELECCIONADA */}
              {selectedCampanaId && (
                <div className="bg-indigo-50 border border-indigo-150 p-2.5 rounded-xl text-[10px] text-indigo-900 mt-2 animate-fade-in leading-relaxed">
                  <div className="flex items-center gap-1 font-bold">
                    <Tag className="h-3.5 w-3.5 text-indigo-650" />
                    <span>Campaña Aplicada</span>
                  </div>
                  <p className="mt-0.5">La campaña <strong>"{motivoCampana}"</strong> aplicará una rebaja del <strong>{porcentajeCampana}%</strong> de forma automática sobre el total neto consolidado del comprobante fiscal.</p>
                </div>
              )}
            </div>

            {/* ABONO PARCIAL */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5">
              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pagoParcial}
                  onChange={e => { setPagoParcial(e.target.checked); setMontoAbonado(''); }}
                  className="accent-indigo-600 h-4 w-4 bg-white border border-slate-250 rounded"
                />
                <span>¿Registrar Abono Parcial?</span>
              </label>

              {pagoParcial && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Monto Abonado ($)</label>
                    <input
                      type="number"
                      required
                      value={montoAbonado}
                      onChange={e => setMontoAbonado(e.target.value)}
                      placeholder="Ej: 50000"
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Plazo Deuda (Días)</label>
                    <select
                      value={plazoDias}
                      onChange={e => setPlazoDias(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                    >
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-1 uppercase font-semibold">Documento</label>
                <select value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2 focus:outline-none">
                  <option value="boleta">Boleta</option>
                  <option value="factura">Factura</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 uppercase font-semibold">Medio de Pago</label>
                <select value={metodoPagoId} onChange={e => setMetodoPagoId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2 focus:outline-none">
                  <option value="1">Efectivo</option>
                  <option value="2">Débito</option>
                  <option value="3">Crédito</option>
                  <option value="4">Transferencia</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={!selectedProp || cart.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-xs uppercase shadow-sm">
              Emitir {tipoDocumento === 'factura' ? 'Factura' : 'Boleta'} 
              {esPagoParcial ? ' (Con Abono Parcial)' : ''}
            </button>
          </form>
        </div>
      </div>

      {/* OVERLAY DE CATÁLOGO INTERACTIVO (SERVICIOS Y FÁRMACOS) */}
      {mostrarCatalogo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full h-[90vh] sm:h-[80vh] shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            
            {/* Encabezado */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                  Catálogo de Conceptos POS
                </h3>
              </div>
              <button 
                onClick={() => { setMostrarCatalogo(false); setFiltroCatTexto(''); }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas de Selección */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => { setCatalogoTab('servicio'); setFiltroCatTexto(''); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  catalogoTab === 'servicio'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Servicios y Procedimientos ({servicios.length})</span>
              </button>
              <button
                type="button"
                onClick={() => { setCatalogoTab('medicamento'); setFiltroCatTexto(''); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  catalogoTab === 'medicamento'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Pill className="h-4 w-4" />
                <span>Medicamentos y Fármacos ({medicamentos.length})</span>
              </button>
            </div>

            {/* Barra de Búsqueda Principal */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filtroCatTexto}
                onChange={e => setFiltroCatTexto(e.target.value)}
                placeholder={
                  catalogoTab === 'servicio'
                    ? 'Buscar servicio por nombre o palabra clave...'
                    : 'Buscar medicamento por nombre comercial o principio activo...'
                }
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-400 focus:outline-none focus:bg-white text-slate-700 font-medium"
              />
            </div>

            {/* Contenido con panel lateral */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* Menu Lateral de Filtro */}
              <div className="w-1/4 pr-4 border-r border-slate-100 overflow-y-auto hidden sm:block">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
                  Categorías
                </span>
                
                <div className="space-y-1 text-xs">
                  {catalogoTab === 'servicio' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setFiltroCatServicio('Todos')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                          filtroCatServicio === 'Todos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'
                        }`}
                      >
                        Todos
                      </button>
                      {serviciosCategorias.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFiltroCatServicio(cat)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                            filtroCatServicio === cat ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </>
                  ) : (
                    ["Todos", "Anestésicos", "Analgésicos", "Antibióticos", "Otros"].map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFiltroCatMedicamento(tipo)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                          filtroCatMedicamento === tipo ? 'bg-indigo-50 text-indigo-700' : 'text-slate-550 hover:bg-slate-50'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Grid Principal de Conceptos */}
              <div className="flex-1 pl-0 sm:pl-4 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                  {conceptosFiltrados().length === 0 ? (
                    <div className="col-span-full py-16 text-center text-xs text-slate-400 italic">
                      No se encontraron conceptos que coincidan con la búsqueda.
                    </div>
                  ) : (
                    conceptosFiltrados().map(item => {
                      const esServ = catalogoTab === 'servicio';
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => seleccionarConceptoDelCatalogo(item)}
                          className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-xl flex flex-col justify-between transition-all hover:border-indigo-300 cursor-pointer shadow-3xs"
                        >
                          <div className="space-y-1 w-full">
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-slate-800 text-xs">
                                {esServ ? (item as ServicioTarifa).nombre : (item as Medicamento).nombreComercial}
                              </span>
                              <span className="bg-indigo-100/60 text-indigo-800 border border-indigo-200 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                                {esServ ? (item as ServicioTarifa).categoria : categorizarMedicamento(item as Medicamento)}
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-slate-450 leading-relaxed truncate">
                              {esServ 
                                ? ((item as ServicioTarifa).notas || 'Sin descripción adicional.') 
                                : `Principio Activo: ${(item as Medicamento).principioActivo}`
                              }
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2 w-full text-[10px]">
                            {esServ ? (
                              <span className="text-slate-400 font-semibold">Servicio Clínico</span>
                            ) : (
                              <span className={`font-bold ${
                                (item as Medicamento).stockTotal > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {(item as Medicamento).stockTotal > 0 ? `Stock: ${(item as Medicamento).stockTotal}` : 'Sin Stock'}
                              </span>
                            )}
                            
                            <span className="text-xs font-black text-indigo-650 font-mono">
                              ${formatCLP(esServ ? (item as ServicioTarifa).tarifaBase : (item as Medicamento).precioVenta)} CLP
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </StateWrapper>
  );
};