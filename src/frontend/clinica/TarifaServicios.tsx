import React, { useState, useEffect } from "react";
import { DollarSign, Stethoscope, Home, Scissors, Hotel, Pill, Search, Edit3, Plus, RefreshCw, X } from "lucide-react";

interface Servicio {
  id: number;
  nombre: string;
  categoria: string;
  tipo: string;
  tarifaBase: number;
  tarifaMax?: number | null;
  notas?: string;
}

const CATEGORIA_COLOR: Record<string, string> = {
  "Consultas": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "Preventiva": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Procedimientos": "bg-violet-50 text-violet-700 border-violet-100",
  "Cirugia": "bg-rose-50 text-rose-700 border-rose-100",
  "Hospitalizacion": "bg-orange-50 text-orange-700 border-orange-100",
  "Estetica": "bg-pink-50 text-pink-700 border-pink-100",
  "Hotel": "bg-sky-50 text-sky-700 border-sky-100",
  "Diagnostico": "bg-amber-50 text-amber-700 border-amber-100",
};

const CATEGORIAS_LIST = ["Consultas", "Preventiva", "Procedimientos", "Cirugia", "Hospitalizacion", "Estetica", "Hotel", "Diagnostico"];

const formatCLP = (n: number) => {
  let rounded = Math.round(n);
  const residuo = rounded % 10;
  if (residuo >= 5) {
    rounded = rounded + (10 - residuo);
  } else {
    rounded = rounded - residuo;
  }
  return "$" + rounded.toLocaleString("es-CL");
};

interface Props {
  currentRole: "administrador" | "veterinario" | "cliente";
  token?: string;
}

export const TarifaServicios: React.FC<Props> = ({ currentRole, token }) => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [catFiltro, setCatFiltro] = useState("Todos");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal de Edición / Creación
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoServicio, setEditandoServicio] = useState<Servicio | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Consultas");
  const [tipo, setTipo] = useState("clinica");
  const [tarifaBase, setTarifaBase] = useState(15000);
  const [tarifaMax, setTarifaMax] = useState("");
  const [notas, setNotas] = useState("");

  const activeToken = token || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` };

  const loadTarifas = async () => {
    setCargando(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/clinica/tarifas", { headers });
      if (res.ok) {
        setServicios(await res.json());
      } else {
        setErrorMsg("Error al obtener las tarifas de servicios.");
      }
    } catch {
      setErrorMsg("Error de conexión al servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadTarifas();
  }, []);

  const abrirCreacion = () => {
    setEditandoServicio(null);
    setNombre("");
    setCategoria("Consultas");
    setTipo("clinica");
    setTarifaBase(15000);
    setTarifaMax("");
    setNotas("");
    setMostrarModal(true);
  };

  const abrirEdicion = (s: Servicio) => {
    setEditandoServicio(s);
    setNombre(s.nombre);
    setCategoria(s.categoria);
    setTipo(s.tipo);
    setTarifaBase(s.tarifaBase);
    setTarifaMax(s.tarifaMax ? s.tarifaMax.toString() : "");
    setNotas(s.notas || "");
    setMostrarModal(true);
  };

  const guardarServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nombre.trim()) {
      setErrorMsg("El nombre del servicio es obligatorio.");
      return;
    }

    if (tarifaBase < 0) {
      setErrorMsg("La tarifa base no puede ser negativa.");
      return;
    }

    const payload = {
      nombre,
      categoria,
      tipo,
      tarifaBase,
      tarifaMax: tarifaMax ? Number(tarifaMax) : null,
      notas
    };

    try {
      setCargando(true);
      let url = "/api/v1/clinica/tarifas";
      let method = "POST";

      if (editandoServicio) {
        url = `/api/v1/clinica/tarifas/${editandoServicio.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Error al registrar el servicio.");
        setCargando(false);
        return;
      }

      // Cerrar y recargar
      setMostrarModal(false);
      loadTarifas();
    } catch {
      setErrorMsg("Error de red al comunicarse con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const filtrados = servicios.filter(s =>
    (catFiltro === "Todos" || s.categoria === catFiltro) &&
    (s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || s.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const categoriasUnicas = Array.from(new Set(servicios.map(s => s.categoria)));
  const tarifaMin = servicios.length > 0 ? Math.min(...servicios.map(s => s.tarifaBase)) : 0;
  const tarifaMaxVal = servicios.length > 0 ? Math.max(...servicios.map(s => s.tarifaMax || s.tarifaBase)) : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tarifas de Servicios y Procedimientos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Precios base oficiales configurados en el sistema por el Administrador.</p>
        </div>
        
        <div className="flex gap-2.5">
          <button 
            type="button" 
            onClick={loadTarifas}
            className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-slate-850 border border-slate-200 rounded-xl transition-colors"
            title="Recargar tarifas"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          {currentRole === "administrador" && (
            <button
              onClick={abrirCreacion}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" /><span>Nuevo Servicio</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2">
          {errorMsg}
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Servicios Totales", val: servicios.length },
          { label: "Tarifa Mínima", val: formatCLP(tarifaMin) },
          { label: "Tarifa Máxima", val: formatCLP(tarifaMaxVal) },
          { label: "Categorías", val: categoriasUnicas.length || 8 },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="text-sm font-extrabold text-slate-800">{val}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full min-w-48">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por servicio..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-400 focus:outline-none text-slate-700 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap w-full md:w-auto">
          {["Todos", ...CATEGORIAS_LIST].map(cat => (
            <button
              key={cat}
              onClick={() => setCatFiltro(cat)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                catFiltro === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-350"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Servicios */}
      <div className="grid gap-3">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 bg-white border border-slate-200 rounded-xl text-center">
            <DollarSign className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">No se encontraron servicios.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100">
            <div className="grid grid-cols-12 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider p-4 border-b border-slate-200">
              <span className={currentRole === "administrador" ? "col-span-4" : "col-span-6"}>Servicio</span>
              <span className="col-span-2">Categoría</span>
              <span className="col-span-2">Tipo</span>
              <span className="col-span-2 text-right">Tarifa Base</span>
              {currentRole === "administrador" && (
                <span className="col-span-2 text-right">Acción</span>
              )}
            </div>

            {filtrados.map(s => (
              <div key={s.id} className="grid grid-cols-12 items-center p-4 text-xs hover:bg-slate-50/50">
                <div className={currentRole === "administrador" ? "col-span-4 pr-4" : "col-span-6 pr-4"}>
                  <h4 className="font-bold text-slate-800">{s.nombre}</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">{s.notas || "Sin especificaciones de nota."}</p>
                </div>
                <div className="col-span-2">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${CATEGORIA_COLOR[s.categoria] || "bg-slate-50 border-slate-200"}`}>
                    {s.categoria}
                  </span>
                </div>
                <div className="col-span-2 capitalize text-slate-550">{s.tipo}</div>
                <div className="col-span-2 text-right">
                  <span className="font-extrabold text-slate-800">{formatCLP(s.tarifaBase)}</span>
                  {s.tarifaMax && <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Máx: {formatCLP(s.tarifaMax)}</span>}
                </div>
                {currentRole === "administrador" && (
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => abrirEdicion(s)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Edit3 className="h-3.5 w-3.5" /><span>Editar</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDITAR / CREAR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                {editandoServicio ? `Editar Servicio: ${editandoServicio.nombre}` : "Añadir Nuevo Servicio"}
              </h3>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={guardarServicio} className="space-y-4 text-xs text-slate-650">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Cirugía de Fémur"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2.5 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Categoría</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2.5 focus:outline-none"
                  >
                    {CATEGORIAS_LIST.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Tipo Modalidad</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2.5 focus:outline-none"
                  >
                    <option value="clinica">Clínica</option>
                    <option value="domicilio">Domicilio</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Tarifa Base ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={tarifaBase}
                    onChange={e => setTarifaBase(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2.5 focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Tarifa Máxima ($ - Opcional)</label>
                  <input
                    type="number"
                    min="0"
                    value={tarifaMax}
                    onChange={e => setTarifaMax(e.target.value)}
                    placeholder="Ej: 500000"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2.5 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Notas / Especificaciones</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Especificar alcance del precio..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg p-2.5 focus:outline-none focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm text-center"
              >
                {editandoServicio ? "Guardar Cambios" : "Crear Servicio"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};