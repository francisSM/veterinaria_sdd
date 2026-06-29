# 📋 Plan de Tareas de Implementación - Sistema de Gestión Veterinaria

Este documento detalla el plan de tareas técnicas atómicas, independientes e incrementales preparadas para la futura fase de implementación física del software, distribuidas por submódulo.

---

## 🛠️ Submódulo 1: Historial Clínico Crítico (HCC)

- [ ] **TASK-HCC-001: Modelado de Entidades Clínicas Core**
  - **Acción:** Crear modelos SQLAlchemy/Pydantic para `pacientes`, `propietarios`, `veterinarios` y `historiales`.
  - **Validaciones:** Restricciones CHECK en campos de edad de mascotas, email y rut de propietarios.
- [ ] **TASK-HCC-002: Ingesta de Triajes de Emergencia**
  - **Acción:** Desarrollar el endpoint `POST /api/v1/hcc/triajes` para clasificar pacientes críticos por niveles de color.
  - **Validaciones:** Verificar rango de temperatura, frecuencia cardíaca y nivel de dolor (1-10).
- [ ] **TASK-HCC-003: Control de Quirófanos y Cirugías**
  - **Acción:** Desarrollar lógica de reserva de quirófano en `cirugias` con bloqueo pesimista.
  - **Validaciones:** Validar que el veterinario tenga el rol de cirujano activo y que el quirófano no esté ocupado en ese bloque horario.
- [ ] **TASK-HCC-004: Registro de Hospitalizaciones y Signos Vitales**
  - **Acción:** Implementar el endpoint `POST /api/v1/hcc/hospitalizaciones/{id}/signos` para el registro periódico de monitoreo.
  - **Validaciones:** Control de frecuencia respiratoria y saturación de oxígeno.

---

## 💊 Submódulo 2: Inventario/Logística de Medicamentos (ILM)

- [ ] **TASK-ILM-001: Registro de Catálogo y Lotes**
  - **Acción:** Implementar modelos para `medicamentos`, `proveedores` y `lotes`.
  - **Validaciones:** Restricción CHECK para evitar `cantidad_stock < 0` y fecha de vencimiento posterior a la fecha de recepción.
- [ ] **TASK-ILM-002: Auditoría y Auto-Cuarentena de Lotes Vencidos**
  - **Acción:** Crear script cron diario para buscar lotes vencidos, cambiar su estado a `vencido` e inhabilitar su dispensación.
  - **Validaciones:** Bloquear cualquier movimiento de inventario que involucre un lote en estado `vencido` o `bloqueado`.
- [ ] **TASK-ILM-003: Dispensación de Medicamentos Controlados con Receta Retenida**
  - **Acción:** Crear el endpoint `POST /api/v1/ilm/despachos` vinculando la receta firmada con el despacho físico.
  - **Validaciones:** Control estricto de coincidencia de dosis recetada contra cantidad despachada.

---

## 💳 Submódulo 3: Facturación/Pagos (FAP)

- [ ] **TASK-FAP-001: Gestión de Sesión y Apertura de Caja**
  - **Acción:** Crear el endpoint `POST /api/v1/fap/cajas/abrir` registrando usuario y fondo inicial de caja.
  - **Validaciones:** Verificar que el cajero no tenga otra caja abierta simultáneamente.
- [ ] **TASK-FAP-002: Emisión de Boleta y Detalle de Servicios**
  - **Acción:** Desarrollar backend de creación de boletas vinculadas a consumos clínicos y de tienda.
  - **Validaciones:** Los totales de la boleta deben coincidir de forma exacta con la sumatoria de los detalles más impuestos.
- [ ] **TASK-FAP-003: Procesamiento de Pagos y Cierre de Caja Ciego**
  - **Acción:** Implementar el endpoint `POST /api/v1/fap/cajas/cerrar` ingresando arqueo físico contado.
  - **Validaciones:** Validar cálculo automatizado de descuadres en el backend e inserción de la bitácora de auditoría.

---

## 🐾 Submódulo 4: Guardería/Peluquería (GAP)

- [ ] **TASK-GAP-001: Reserva de Cupos de Hotel/Guardería**
  - **Acción:** Desarrollar endpoint `POST /api/v1/gap/reservas` para asignación de salas.
  - **Validaciones:** Restricción CHECK de aforo máximo en `salas_guarderia` para evitar sobreventa.
- [ ] **TASK-GAP-002: Check-in, Check-out y Registro de Actividades Diarias**
  - **Acción:** Crear endpoints de control de entrada y salida física de las mascotas de la guardería.
  - **Validaciones:** La fecha de check-out debe ser mayor o igual a la fecha de check-in.
- [ ] **TASK-GAP-003: Programación de Peluquería y Grooming**
  - **Acción:** Crear agenda para asignación de estilistas caninos/felinos.
  - **Validaciones:** Evitar solapamiento de horarios del estilista.
