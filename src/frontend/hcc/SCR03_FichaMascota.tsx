import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR03Props {
  currentRole: UserRole;
}

export const SCR03_FichaMascota: React.FC<SCR03Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const pacienteMock = {
    id: 1,
    nombre: 'Thor',
    especie: 'canino',
    raza: 'Golden Retriever',
    edadMeses: 36,
    pesoKg: 32.5,
    propietario: {
      nombre: 'Marta Gomez',
      rut: '15928345-K',
      email: 'marta.gomez@gmail.com',
      telefono: '988887766'
    }
  };

  const consultasMock = [
    { id: 101, fecha: '2026-06-15', motivo: 'Control anual y vacuna antirrábica', diagnostico: 'Paciente sano, al día', veterinario: 'Dr. John Doe' },
    { id: 102, fecha: '2026-06-29', motivo: 'Triaje de Urgencia (Torsión Gástrica)', diagnostico: 'Torsión estomacal severa. Derivado a quirófano mayor.', veterinario: 'Dra. Jane Smith' }
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario', 'recepcionista', 'cliente']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ficha Clínica Integral del Paciente</h1>
          <p className="text-slate-400 text-sm">Resumen completo de la mascota, propietario e historial clínico (L5).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta Mascota */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto">
              🐕
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-200">{pacienteMock.nombre}</h2>
              <span className="text-xs text-slate-400 uppercase tracking-wider">{pacienteMock.especie} - {pacienteMock.raza}</span>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Edad</span>
                <span className="text-slate-300">{pacienteMock.edadMeses} meses (3 años)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peso</span>
                <span className="text-slate-300">{pacienteMock.pesoKg} kg</span>
              </div>
            </div>
          </div>

          {/* Tarjeta Propietario */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">Información del Propietario</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Nombre Completo</span>
                <span className="text-slate-300 font-medium">{pacienteMock.propietario.nombre}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">RUT</span>
                <span className="text-slate-300 font-medium">{pacienteMock.propietario.rut}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Correo Electrónico</span>
                <span className="text-slate-300 font-medium">{pacienteMock.propietario.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Teléfono</span>
                <span className="text-slate-300 font-medium">{pacienteMock.propietario.telefono}</span>
              </div>
            </div>
          </div>

          {/* Línea de Tiempo de Consultas */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-3">
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">Historial Clínico (Consultas y Diagnósticos)</h3>
            <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
              {consultasMock.map(c => (
                <div key={c.id} className="relative space-y-1">
                  <span className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center text-[8px] text-emerald-400">
                    ✓
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{c.fecha}</span>
                    <span className="text-xs text-slate-400 font-medium">{c.veterinario}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{c.motivo}</h4>
                  <p className="text-xs text-slate-400">{c.diagnostico}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
