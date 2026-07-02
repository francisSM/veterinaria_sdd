import React, { useState, useEffect } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';
import { UserPlus, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface SCR31Props {
  currentRole: UserRole;
  token: string;
}

interface Veterinario {
  id: number;
  nombre: string;
  rut: string;
  licenciaMedica: string;
}

export const GestionVeterinarios: React.FC<SCR31Props> = ({ currentRole, token }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rut, setRut] = useState('');
  const [licenciaMedica, setLicenciaMedica] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);

  // Cargar lista de veterinarios desde la API del backend
  const cargarVeterinarios = async () => {
    try {
      const response = await fetch('/api/v1/clinica/veterinarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVeterinarios(data);
      }
    } catch (err) {
      console.error("Error al cargar veterinarios:", err);
    }
  };

  useEffect(() => {
    cargarVeterinarios();
  }, [token]);

  const registrarVeterinario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !nombre || !password || !rut || !licenciaMedica) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    try {
      setUxState('loading');
      const response = await fetch('/api/v1/auth/create-veterinario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, nombre, password, rut, licenciaMedica })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Error al registrar veterinario');
        setUxState('data');
        return;
      }

      setSuccessMsg(`Cuenta de veterinario creada para ${nombre} (${email})`);
      setEmail('');
      setNombre('');
      setPassword('');
      setRut('');
      setLicenciaMedica('');
      setUxState('data');
      
      // Recargar lista
      cargarVeterinarios();
    } catch (err: any) {
      setErrorMsg('Error de conexión: ' + err.message);
      setUxState('data');
    }
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario de registro */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Crear Veterinario</h2>
          </div>
          <p className="text-slate-500 text-xs">Registra una nueva cuenta de Médico Veterinario en la plataforma y el registro clínico.</p>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={registrarVeterinario} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Dr. Fernando Pérez"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ej: fperez@vetguard.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Definir contraseña"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">RUT</label>
              <input
                type="text"
                required
                value={rut}
                onChange={e => setRut(e.target.value)}
                placeholder="Ej: 15482930-1"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Licencia Médica</label>
              <input
                type="text"
                required
                value={licenciaMedica}
                onChange={e => setLicenciaMedica(e.target.value)}
                placeholder="Ej: VET-4920"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              Crear Cuenta e Inscribir
            </button>
          </form>
        </div>

        {/* Listado en Tiempo Real desde Backend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Veterinarios Activos (Persistencia Backend)</h2>
            <button 
              onClick={cargarVeterinarios}
              className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
              title="Refrescar lista"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="text-slate-500 text-xs">Muestra el listado de médicos en turno registrado en el backend en memoria de la clínica.</p>
          
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {veterinarios.map(v => (
              <div key={v.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between hover:shadow-xs transition-all">
                <div>
                  <h3 className="text-xs font-bold text-slate-700">{v.nombre}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium">RUT: {v.rut}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Licencia: {v.licenciaMedica}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase">
                  Activo Clinico
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </StateWrapper>
  );
};
