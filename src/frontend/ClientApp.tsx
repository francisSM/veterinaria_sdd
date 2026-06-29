import React, { useState } from 'react';
import { Layout, UserRole } from './Layout';

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

// Módulo FAP (SCR-16 a SCR-23) [NUEVO]
import { SCR16_AperturaCierreCaja } from './fap/SCR16_AperturaCierreCaja';
import { SCR17_ArqueoCiegoForm } from './fap/SCR17_ArqueoCiegoForm';
import { SCR18_PuntoDeVenta } from './fap/SCR18_PuntoDeVenta';
import { SCR19_HistorialComprobantes } from './fap/SCR19_HistorialComprobantes';
import { SCR20_EmisionNotasCredito } from './fap/SCR20_EmisionNotasCredito';
import { SCR21_ConveniosSeguros } from './fap/SCR21_ConveniosSeguros';
import { SCR22_DescuentosCampanas } from './fap/SCR22_DescuentosCampanas';
import { SCR23_BitacoraFinanciera } from './fap/SCR23_BitacoraFinanciera';

// Módulo GAP (SCR-24 a SCR-30) [NUEVO]
import { SCR24_MapaCaniles } from './gap/SCR24_MapaCaniles';
import { SCR25_AdmisionGuarderia } from './gap/SCR25_AdmisionGuarderia';
import { SCR26_ChecklistPertenencias } from './gap/SCR26_ChecklistPertenencias';
import { SCR27_DietasEspeciales } from './gap/SCR27_DietasEspeciales';
import { SCR28_BitacoraActividades } from './gap/SCR28_BitacoraActividades';
import { SCR29_AgendaEstetica } from './gap/SCR29_AgendaEstetica';
import { SCR30_GestionCuidadores } from './gap/SCR30_GestionCuidadores';

export const ClientApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('administrador');

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

      // FAP [NUEVO]
      case 'apertura-cierre':
        return <SCR16_AperturaCierreCaja currentRole={currentRole} />;
      case 'arqueo-ciego':
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

      // GAP [NUEVO]
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

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentRole={currentRole}
      setCurrentRole={setCurrentRole}
    >
      {renderContent()}
    </Layout>
  );
};
