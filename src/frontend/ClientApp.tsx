import React, { useState } from 'react';
import { Layout, UserRole } from './Layout';
import { SCR01_DashboardMedico } from './hcc/SCR01_DashboardMedico';
import { SCR02_TriajeEmergencias } from './hcc/SCR02_TriajeEmergencias';
import { SCR03_FichaMascota } from './hcc/SCR03_FichaMascota';
import { SCR04_ReservaQuirofanos } from './hcc/SCR04_ReservaQuirofanos';
import { SCR05_MonitoreoHospitalizacion } from './hcc/SCR05_MonitoreoHospitalizacion';
import { SCR06_CrearConsulta } from './hcc/SCR06_CrearConsulta';
import { SCR07_EmisionRecetas } from './hcc/SCR07_EmisionRecetas';
import { SCR08_ConsentimientoFirmado } from './hcc/SCR08_ConsentimientoFirmado';
import { SCR09_CatalogoMedicamentos } from './ilm/SCR09_CatalogoMedicamentos';
import { SCR10_IngresoLotes } from './ilm/SCR10_IngresoLotes';
import { SCR11_AlertasStockVencimiento } from './ilm/SCR11_AlertasStockVencimiento';
import { SCR12_DispensacionControlados } from './ilm/SCR12_DispensacionControlados';
import { SCR13_RegistroMovimientos } from './ilm/SCR13_RegistroMovimientos';
import { SCR14_GestionProveedores } from './ilm/SCR14_GestionProveedores';
import { SCR15_AuditoriaStock } from './ilm/SCR15_AuditoriaStock';

export const ClientApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('administrador');

  const renderContent = () => {
    switch (activeTab) {
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
