import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR08Props {
  currentRole: UserRole;
}

export const SCR08_ConsentimientoFirmado: React.FC<SCR08Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [tipo, setTipo] = useState('cirugia');
  const [propietarioRut, setPropietarioRut] = useState('');
  const [firmaOwner, setFirmaOwner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const firmarConsentimiento = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!propietarioRut || !firmaOwner) {
      setErrorMsg('Debe rellenar todos los campos del consentimiento.');
      return;
    }

    if (propietarioRut.trim().length < 9) {
      setErrorMsg('El RUT del propietario debe poseer al menos 9 caracteres.');
      return;
    }

    setSuccessMsg('Consentimiento informado firmado digitalmente y enlazado en el expediente.');
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'recepcionista', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Firma de Consentimiento Informado</h1>
          <p className="text-slate-400 text-xs">Aprobación legal obligatoria del propietario para cirugías críticas o eutanasia (L5/BR-08).</p>
        </div>

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

        <form onSubmit={firmarConsentimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="consent-type-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Procedimiento</label>
              <select
                id="consent-type-select"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="cirugia">Cirugía Mayor Invasiva</option>
                <option value="eutanasia">Consentimiento de Eutanasia (BR-08)</option>
                <option value="hospitalizacion">Hospitalización Prolongada</option>
              </select>
            </div>
            <div>
              <label htmlFor="owner-rut-input" className="block text-xs font-semibold text-slate-400 mb-1.5">RUT Propietario Aprobador</label>
              <input
                id="owner-rut-input"
                type="text"
                value={propietarioRut}
                onChange={e => setPropietarioRut(e.target.value)}
                placeholder="Ej: 15928345-K"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-xs text-slate-400 space-y-2 leading-relaxed">
            <p className="font-bold text-slate-300">DECLARACIÓN DE RESPONSABILIDAD:</p>
            <p>
              Por la presente firma declaro estar plenamente informado de los riesgos asociados,
              complicaciones quirúrgicas, efectos anestésicos e implicaciones clínicas descritos por el
              veterinario tratante. Doy mi autorización expresa para proceder con el protocolo médico asignado.
            </p>
          </div>

          <div>
            <label htmlFor="owner-signature-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Firma Escrita (Nombre Titular)</label>
            <input
              id="owner-signature-input"
              type="text"
              value={firmaOwner}
              onChange={e => setFirmaOwner(e.target.value)}
              placeholder="Escriba su nombre y apellido"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Firmar Digitalmente Consentimiento
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
