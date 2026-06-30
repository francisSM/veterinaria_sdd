import React, { useState } from 'react';
import { Layout, UserRole } from './Layout';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  User,
  Activity,
  Scissors,
  Home,
  Stethoscope,
  Database,
  Key,
  FolderOpen
} from 'lucide-react';

// Módulo HCC (SCR-01 a SCR-08)
import { SCR01_DashboardMedico } from './hcc/SCR01_DashboardMedico';
import { SCR02_TriajeEmergencias } from './hcc/SCR02_TriajeEmergencias';
import { SCR03_FichaMascota } from './hcc/SCR03_FichaMascota';
import { SCR04_ReservaQuirofanos } from './hcc/SCR04_ReservaQuirofanos';
import { SCR05_MonitoreoHospitalizacion } from './hcc/SCR05_MonitoreoHospitalizacion';
import { SCR06_CrearConsulta } from './hcc/SCR06_CrearConsulta';
import { SCR07_EmisionRecetas } from './hcc/SCR07_EmisionRecetas';
import { SCR08_ConsentimientoFirmado } from './hcc/SCR08_ConsentimientoFirmado';

// Módulo ILM (SCR-09 a SCR-15)
import { SCR09_CatalogoMedicamentos } from './ilm/SCR09_CatalogoMedicamentos';
import { SCR10_IngresoLotes } from './ilm/SCR10_IngresoLotes';
import { SCR11_AlertasStockVencimiento } from './ilm/SCR11_AlertasStockVencimiento';
import { SCR12_DispensacionControlados } from './ilm/SCR12_DispensacionControlados';
import { SCR13_RegistroMovimientos } from './ilm/SCR13_RegistroMovimientos';
import { SCR14_GestionProveedores } from './ilm/SCR14_GestionProveedores';
import { SCR15_AuditoriaStock } from './ilm/SCR15_AuditoriaStock';

// Módulo FAP (SCR-16 a SCR-23)
import { SCR16_AperturaCierreCaja } from './fap/SCR16_AperturaCierreCaja';
import { SCR17_ArqueoCiegoForm } from './fap/SCR17_ArqueoCiegoForm';
import { SCR18_PuntoDeVenta } from './fap/SCR18_PuntoDeVenta';
import { SCR19_HistorialComprobantes } from './fap/SCR19_HistorialComprobantes';
import { SCR20_EmisionNotasCredito } from './fap/SCR20_EmisionNotasCredito';
import { SCR21_ConveniosSeguros } from './fap/SCR21_ConveniosSeguros';
import { SCR22_DescuentosCampanas } from './fap/SCR22_DescuentosCampanas';
import { SCR23_BitacoraFinanciera } from './fap/SCR23_BitacoraFinanciera';

// Módulo GAP (SCR-24 a SCR-30)
import { SCR24_MapaCaniles } from './gap/SCR24_MapaCaniles';
import { SCR25_AdmisionGuarderia } from './gap/SCR25_AdmisionGuarderia';
import { SCR26_ChecklistPertenencias } from './gap/SCR26_ChecklistPertenencias';
import { SCR27_DietasEspeciales } from './gap/SCR27_DietasEspeciales';
import { SCR28_BitacoraActividades } from './gap/SCR28_BitacoraActividades';
import { SCR29_AgendaEstetica } from './gap/SCR29_AgendaEstetica';
import { SCR30_GestionCuidadores } from './gap/SCR30_GestionCuidadores';

interface TestUser {
  email: string;
  role: UserRole;
  label: string;
  desc: string;
  color: string;
  icon: React.ComponentType<any>;
}

export const ClientApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('administrador');

  const testUsers: TestUser[] = [
    { email: 'admin@vetguard.com', role: 'administrador', label: 'Administrador General', desc: 'Acceso total y configuración', color: 'bg-indigo-50 border-indigo-100 text-indigo-700', icon: Key },
    { email: 'vet@vetguard.com', role: 'veterinario', label: 'Médico Veterinario', desc: 'Fichas, triaje y consultas', color: 'bg-emerald-50 border-emerald-100 text-emerald-700', icon: Stethoscope },
    { email: 'cirujano@vetguard.com', role: 'cirujano', label: 'Cirujano de Turno', desc: 'Reserva y gestión de quirófano', color: 'bg-purple-50 border-purple-100 text-purple-700', icon: Scissors },
    { email: 'farm@vetguard.com', role: 'farmaceutico', label: 'Químico Farmacéutico', desc: 'Inventario, lotes y stock', color: 'bg-teal-50 border-teal-100 text-teal-700', icon: Database },
    { email: 'caja@vetguard.com', role: 'cajero', label: 'Cajero de Sucursal', desc: 'Aperturas, cobros y arqueos', color: 'bg-amber-50 border-amber-100 text-amber-700', icon: Activity },
    { email: 'recepcion@vetguard.com', role: 'recepcionista', label: 'Recepción', desc: 'Triaje, admisiones y reservas', color: 'bg-sky-50 border-sky-100 text-sky-700', icon: User },
    { email: 'cliente@vetguard.com', role: 'cliente', label: 'Cliente Propietario', desc: 'Ficha de mascota y consentimientos', color: 'bg-slate-50 border-slate-200 text-slate-700', icon: FolderOpen }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Buscar si corresponde a algún usuario de prueba
    const foundUser = testUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      loginAs(foundUser.role);
    } else {
      setErrorMsg('Usuario no registrado. Utiliza una de las cuentas de prueba a la derecha.');
    }
  };

  const loginAs = (role: UserRole) => {
    setCurrentRole(role);
    setIsLoggedIn(true);

    // Ajustar pestaña por defecto según rol
    const roleRoutes: Record<UserRole, string> = {
      administrador: 'dashboard',
      veterinario: 'dashboard',
      cirujano: 'quirofano',
      farmaceutico: 'catalogo',
      cajero: 'apertura-cierre',
      recepcionista: 'triaje',
      cliente: 'ficha'
    };

    setActiveTab(roleRoutes[role] || 'dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      // HCC
      case 'dashboard':
        return <SCR01_DashboardMedico currentRole={currentRole} />;
      case 'triaje':
        return <SCR02_TriajeEmergencias currentRole={currentRole} />;
      case 'ficha':
        return <SCR03_FichaMascota currentRole={currentRole} />;
      case 'quirofano':
        return <SCR04_ReservaQuirofanos currentRole={currentRole} />;
      case 'hospitalizacion':
        return <SCR05_MonitoreoHospitalizacion currentRole={currentRole} />;
      case 'consulta':
        return <SCR06_CrearConsulta currentRole={currentRole} />;
      case 'receta':
        return <SCR07_EmisionRecetas currentRole={currentRole} />;
      case 'consentimiento':
        return <SCR08_ConsentimientoFirmado currentRole={currentRole} />;

      // ILM
      case 'catalogo':
        return <SCR09_CatalogoMedicamentos currentRole={currentRole} />;
      case 'ingreso-lotes':
        return <SCR10_IngresoLotes currentRole={currentRole} />;
      case 'alertas-stock':
        return <SCR11_AlertasStockVencimiento currentRole={currentRole} />;
      case 'dispensacion':
        return <SCR12_DispensacionControlados currentRole={currentRole} />;
      case 'movimientos':
        return <SCR13_RegistroMovimientos currentRole={currentRole} />;
      case 'proveedores':
        return <SCR14_GestionProveedores currentRole={currentRole} />;
      case 'auditoria':
        return <SCR15_AuditoriaStock currentRole={currentRole} />;

      // FAP
      case 'apertura-cierre':
        return <SCR16_AperturaCierreCaja currentRole={currentRole} />;
      case 'arqueo-cieo':
        return <SCR17_ArqueoCiegoForm currentRole={currentRole} />;
      case 'punto-venta':
        return <SCR18_PuntoDeVenta currentRole={currentRole} />;
      case 'historial-comprobantes':
        return <SCR19_HistorialComprobantes currentRole={currentRole} />;
      case 'anulaciones':
        return <SCR20_EmisionNotasCredito currentRole={currentRole} />;
      case 'seguros':
        return <SCR21_ConveniosSeguros currentRole={currentRole} />;
      case 'descuentos':
        return <SCR22_DescuentosCampanas currentRole={currentRole} />;
      case 'bitacora-financiera':
        return <SCR23_BitacoraFinanciera currentRole={currentRole} />;

      // GAP
      case 'mapa-caniles':
        return <SCR24_MapaCaniles currentRole={currentRole} />;
      case 'admision-guarderia':
        return <SCR25_AdmisionGuarderia currentRole={currentRole} />;
      case ' checklist-pertenencias':
        return <SCR26_ChecklistPertenencias currentRole={currentRole} />;
      case 'dietas':
        return <SCR27_DietasEspeciales currentRole={currentRole} />;
      case 'bitacora-actividades':
        return <SCR28_BitacoraActividades currentRole={currentRole} />;
      case 'agenda-estetica':
        return <SCR29_AgendaEstetica currentRole={currentRole} />;
      case 'gestion-cuidadores':
        return <SCR30_GestionCuidadores currentRole={currentRole} />;

      default:
        return <SCR01_DashboardMedico currentRole={currentRole} />;
    }
  };

  // PÁGINA DE LOGIN PROFESIONAL (Blancos y Pasteles)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-4xl w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 flex flex-col md:flex-row overflow-hidden">
          
          {/* LADO IZQUIERDO: Formulario de Login */}
          <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                  VetGuard L5
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
                <p className="text-slate-500 text-xs mt-1">Ingresa tus credenciales o selecciona una cuenta de prueba.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="correo@vetguard.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Entrar al Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="text-[10px] text-slate-400 text-center mt-8 border-t border-slate-100 pt-4">
              Consola Sandbox de Simulación Operativa L5 · Todos los derechos reservados
            </div>
          </div>

          {/* LADO DERECHO: Cuentas de Prueba */}
          <div className="w-full md:w-96 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200/80 p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Usuarios de Prueba</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en cualquier rol para ingresar inmediatamente sin contraseña.</p>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                {testUsers.map(u => {
                  const Icon = u.icon;
                  return (
                    <button
                      key={u.role}
                      onClick={() => {
                        setEmail(u.email);
                        setPassword('password');
                        loginAs(u.role);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/60 hover:border-indigo-300 hover:shadow-xs transition-all duration-150 flex items-center gap-3 group cursor-pointer"
                    >
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${u.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 flex items-center gap-1.5 justify-between">
                          <span>{u.label}</span>
                          <span className="text-[9px] font-medium text-slate-400 font-mono lowercase">{u.role}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{u.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentRole={currentRole}
      setCurrentRole={setCurrentRole}
      onLogout={() => {
        setIsLoggedIn(false);
        setEmail('');
        setPassword('');
      }}
    >
      {renderContent()}
    </Layout>
  );
};
