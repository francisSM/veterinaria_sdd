import React, { useState, useEffect } from "react";
import { Layout, UserRole } from "./Layout";
import { Lock, Mail, ArrowRight, ShieldAlert, CheckCircle, User } from "lucide-react";

// HCC
import { DashboardMedico } from "./clinica/DashboardMedico";
import { TriajeEmergencias } from "./clinica/TriajeEmergencias";
import { FichaMascota } from "./clinica/FichaMascota";
import { ReservaQuirofanos } from "./clinica/ReservaQuirofanos";
import { MonitoreoHospitalizacion } from "./clinica/MonitoreoHospitalizacion";
import { CrearConsulta } from "./clinica/CrearConsulta";
import { EmisionRecetas } from "./clinica/EmisionRecetas";
import { ConsentimientoFirmado } from "./clinica/ConsentimientoFirmado";
import { GestionVeterinarios } from "./clinica/GestionVeterinarios";
import { AgendaCitas } from "./clinica/AgendaCitas";
import { TarifaServicios } from "./clinica/TarifaServicios";
import { HorarioVeterinario } from "./clinica/HorarioVeterinario";

// ILM
import { CatalogoMedicamentos } from "./inventario/CatalogoMedicamentos";
import { IngresoLotes } from "./inventario/IngresoLotes";
import { AlertasStockVencimiento } from "./inventario/AlertasStockVencimiento";
import { DispensacionControlados } from "./inventario/DispensacionControlados";
import { RegistroMovimientos } from "./inventario/RegistroMovimientos";
import { GestionProveedores } from "./inventario/GestionProveedores";
import { AuditoriaStock } from "./inventario/AuditoriaStock";
import { BitacoraInventario } from "./inventario/BitacoraInventario";

// FAP
import { AperturaCierreCaja } from "./finanzas/AperturaCierreCaja";
import { ArqueoCiegoForm } from "./finanzas/ArqueoCiegoForm";
import { PuntoDeVenta } from "./finanzas/PuntoDeVenta";
import { HistorialComprobantes } from "./finanzas/HistorialComprobantes";
import { EmisionNotasCredito } from "./finanzas/EmisionNotasCredito";
import { ConveniosSeguros } from "./finanzas/ConveniosSeguros";
import { DescuentosCampanas } from "./finanzas/DescuentosCampanas";
import { BitacoraFinanciera } from "./finanzas/BitacoraFinanciera";

// GAP
import { MapaCaniles } from "./servicios/MapaCaniles";
import { AdmisionGuarderia } from "./servicios/AdmisionGuarderia";
import { DietasEspeciales } from "./servicios/DietasEspeciales";
import { BitacoraActividades } from "./servicios/BitacoraActividades";
import { AgendaEstetica } from "./servicios/AgendaEstetica";
import { GestionCuidadores } from "./servicios/GestionCuidadores";

export const ClientApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRut, setSignupRut] = useState("");
  const [signupTelefono, setSignupTelefono] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentRole, setCurrentRole] = useState<UserRole>("administrador");
  const [currentUser, setCurrentUser] = useState<{ id: number; nombre: string; email: string; rol: UserRole } | null>(null);

  // Interceptor global para limpiar sesión si expira el token o el servidor se reinicia (evita 403 persistentes)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init);
        if (response.status === 401 || response.status === 403) {
          console.warn("[AUTH] Acceso denegado o token vencido (401/403). Redirigiendo a Login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          setIsLoggedIn(false);
          setErrorMsg("Su sesión ha expirado o es inválida debido a un reinicio de seguridad. Por favor ingrese de nuevo.");
        }
        return response;
      } catch (err) {
        return Promise.reject(err);
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Restaurar sesión al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setToken(savedToken);
        setCurrentRole(u.rol as UserRole);
        setCurrentUser(u);
        setIsLoggedIn(true);
        const savedTab = localStorage.getItem("activeTab");
        const routes: Record<UserRole, string> = { administrador: "dashboard", veterinario: "ficha", cliente: "agenda-citas" };
        setActiveTab(savedTab || routes[u.rol as UserRole] || "dashboard");
        return;
      } catch (err) {
        console.error("Error al restaurar sesión de localStorage", err);
      }
    }

    const sessToken = sessionStorage.getItem("token");
    const sessUser = sessionStorage.getItem("user");
    if (sessToken && sessUser) {
      try {
        const u = JSON.parse(sessUser);
        setToken(sessToken);
        setCurrentRole(u.rol as UserRole);
        setCurrentUser(u);
        setIsLoggedIn(true);
        const savedTab = localStorage.getItem("activeTab");
        const routes: Record<UserRole, string> = { administrador: "dashboard", veterinario: "ficha", cliente: "agenda-citas" };
        setActiveTab(savedTab || routes[u.rol as UserRole] || "dashboard");
      } catch (err) {
        console.error("Error al restaurar sesión de sessionStorage", err);
      }
    }
  }, []);

  // Guardar la pestaña activa al cambiar para persistirla en F5 (SPA)
  useEffect(() => {
    if (isLoggedIn && activeTab) {
      localStorage.setItem("activeTab", activeTab);
    }
  }, [activeTab, isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    try {
      const r = await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) { setErrorMsg(d.error || "Credenciales invalidas"); return; }
      setToken(d.token);
      
      const userObj = { id: d.user.id, nombre: d.user.nombre, email: d.user.email, rol: d.user.rol as UserRole };

      if (keepLoggedIn) {
        localStorage.setItem("token", d.token);
        localStorage.setItem("user", JSON.stringify(userObj));
      } else {
        sessionStorage.setItem("token", d.token);
        sessionStorage.setItem("user", JSON.stringify(userObj));
        // Limpiar por si había algo de una sesión anterior recordada
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setCurrentRole(d.user.rol as UserRole);
      setCurrentUser(userObj);
      setIsLoggedIn(true);
      const routes: Record<UserRole, string> = { administrador: "dashboard", veterinario: "ficha", cliente: "agenda-citas" };
      setActiveTab(routes[d.user.rol as UserRole] || "dashboard");
    } catch (err: any) { setErrorMsg("Error de conexion: " + err.message); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (!email || !signupName || !password || !signupRut || !signupTelefono) { setErrorMsg("Todos los campos son obligatorios."); return; }
    try {
      const r = await fetch("/api/v1/auth/signup-cliente", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, nombre: signupName, password, rut: signupRut, telefono: signupTelefono }) });
      const d = await r.json();
      if (!r.ok) { setErrorMsg(d.error || "Error al registrar cuenta"); return; }
      setSuccessMsg("Cuenta registrada. Ya puedes iniciar sesion.");
      setIsSignUp(false); setPassword(""); setSignupName(""); setSignupRut(""); setSignupTelefono("");
    } catch (err: any) { setErrorMsg("Error de conexion: " + err.message); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":        return <DashboardMedico currentRole={currentRole} />;
      case "triaje":           return <TriajeEmergencias currentRole={currentRole} token={token} />;
      case "ficha":            return <FichaMascota currentRole={currentRole} currentUser={currentUser} token={token} />;
      case "quirofano":        return <ReservaQuirofanos currentRole={currentRole} token={token} currentUser={currentUser} />;
      case "hospitalizacion":  return <MonitoreoHospitalizacion currentRole={currentRole} />;
      case "consulta":         return <CrearConsulta currentRole={currentRole} token={token} />;
      case "receta":           return <EmisionRecetas currentRole={currentRole} token={token} />;
      case "consentimiento":   return <ConsentimientoFirmado currentRole={currentRole} token={token} />;
      case "gestion-veterinarios": return <GestionVeterinarios currentRole={currentRole} token={token} />;
      case "agenda-citas":     return <AgendaCitas currentRole={currentRole} token={token} currentUser={currentUser} />;
      case "tarifas":          return <TarifaServicios currentRole={currentRole} token={token} />;
      case "mi-horario":       return <HorarioVeterinario currentRole={currentRole} token={token} currentUser={currentUser} />;
      case "catalogo":         return <CatalogoMedicamentos currentRole={currentRole} token={token} />;
      case "ingreso-lotes":    return <IngresoLotes currentRole={currentRole} />;
      case "alertas-stock":    return <AlertasStockVencimiento currentRole={currentRole} token={token} />;
      case "dispensacion":     return <DispensacionControlados currentRole={currentRole} />;
      case "movimientos":      return <RegistroMovimientos currentRole={currentRole} />;
      case "proveedores":      return <GestionProveedores currentRole={currentRole} />;
      case "auditoria":        return <AuditoriaStock currentRole={currentRole} />;
      case "bitacora-inventario": return <BitacoraInventario currentRole={currentRole} />;
      case "apertura-cierre":  return <AperturaCierreCaja currentRole={currentRole} />;
      case "arqueo-cieo":      return <ArqueoCiegoForm currentRole={currentRole} />;
      case "punto-venta":      return <PuntoDeVenta currentRole={currentRole} token={token} />;
      case "historial-comprobantes": return <HistorialComprobantes currentRole={currentRole} token={token} />;
      case "anulaciones":      return <EmisionNotasCredito currentRole={currentRole} />;
      case "seguros":          return <ConveniosSeguros currentRole={currentRole} />;
      case "descuentos":       return <DescuentosCampanas currentRole={currentRole} />;
      case "bitacora-financiera": return <BitacoraFinanciera currentRole={currentRole} />;
      case "mapa-caniles":     return <MapaCaniles currentRole={currentRole} />;
      case "admision-guarderia": return <AdmisionGuarderia currentRole={currentRole} token={token} />;
      case "mis-boletas":      return <HistorialComprobantes currentRole={currentRole} token={token} />;
      case "dietas":           return <DietasEspeciales currentRole={currentRole} token={token} />;
      case "bitacora-actividades": return <BitacoraActividades currentRole={currentRole} />;
      case "agenda-estetica":  return <AgendaEstetica currentRole={currentRole} token={token} />;
      case "gestion-cuidadores": return <GestionCuidadores currentRole={currentRole} />;
      default: return <DashboardMedico currentRole={currentRole} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Lock className="h-5 w-5 text-white"/></div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">VetGuard L5</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{isSignUp ? "Crear Cuenta" : "Iniciar Sesion"}</h2>
            <p className="text-slate-500 text-xs mt-1">{isSignUp ? "Registrate como Cliente de nuestra clinica." : "Ingresa tus credenciales para acceder al sistema."}</p>
          </div>
          {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-lg flex items-center gap-2"><ShieldAlert className="h-4 w-4 flex-shrink-0"/>{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2"><CheckCircle className="h-4 w-4 flex-shrink-0"/>{successMsg}</div>}

          {!isSignUp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Correo Electronico</label>
                <div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/>
                  <input id="login-email" type="email" required placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-3 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"/>
                </div>
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
                <div className="relative"><Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/>
                  <input id="login-password" type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-3 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"/>
                </div>
              </div>
              
              {/* MANTENER SESIÓN INICIADA CHECKBOX */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold select-none cursor-pointer">
                  <input type="checkbox" checked={keepLoggedIn} onChange={e => setKeepLoggedIn(e.target.checked)} className="accent-indigo-600 h-4 w-4 bg-white border border-slate-200 rounded"/>
                  Mantener sesión iniciada
                </label>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                <span>Entrar al Sistema</span><ArrowRight className="h-4 w-4"/>
              </button>
              <div className="text-center">
                <span className="text-xs text-slate-400">No tienes cuenta? </span>
                <button type="button" onClick={() => { setIsSignUp(true); setErrorMsg(""); setSuccessMsg(""); }} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Registrate como Cliente</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              {[
                { label: "Nombre Completo", placeholder: "Ej: Juan Perez", value: signupName, onChange: (v:string) => setSignupName(v), type: "text", icon: User },
                { label: "RUT", placeholder: "Ej: 12345678-9", value: signupRut, onChange: (v:string) => setSignupRut(v), type: "text", icon: User },
                { label: "Telefono de Contacto", placeholder: "Ej: 988887766", value: signupTelefono, onChange: (v:string) => setSignupTelefono(v), type: "tel", icon: User },
                { label: "Correo Electronico", placeholder: "correo@ejemplo.com", value: email, onChange: (v:string) => setEmail(v), type: "email", icon: Mail },
                { label: "Contraseña", placeholder: "Crear Contraseña", value: password, onChange: (v:string) => setPassword(v), type: "password", icon: Lock },
              ].map(({ label, placeholder, value, onChange, type, icon: Icon }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <div className="relative"><Icon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/>
                    <input type={type} required placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-3 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"/>
                  </div>
                </div>
              ))}
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                <span>Registrar Cuenta</span><ArrowRight className="h-4 w-4"/>
              </button>
              <div className="text-center">
                <span className="text-xs text-slate-400">Ya tienes cuenta? </span>
                <button type="button" onClick={() => { setIsSignUp(false); setErrorMsg(""); setSuccessMsg(""); }} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Inicia Sesion</button>
              </div>
            </form>
          )}
          <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-4">Consola Operativa VetGuard L5 - Solo uso interno</div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentRole={currentRole} setCurrentRole={setCurrentRole} currentUser={currentUser}
      onLogout={() => { 
        setIsLoggedIn(false); 
        setEmail(""); 
        setPassword(""); 
        setToken(""); 
        setCurrentUser(null); 
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("activeTab");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }}>
      {renderContent()}
    </Layout>
  );
};