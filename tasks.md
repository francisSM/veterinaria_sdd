# Plan de Tareas de Implementacion - Sistema de Gestion Veterinaria

Este documento detalla el plan de tareas tecnicas atomicas, independientes e incrementales preparadas para la futura fase de implementacion fisica del software, distribuidas por submodulo.

---

## Submodulo 1: Historial Clinico Critico (HCC)

- [ ] **TASK-HCC-001: Modelado de Entidades Clinicas Core**
  - **Accion:** Crear modelos SQLAlchemy/Pydantic para `pacientes`, `propietarios`, `veterinarios` y `historiales`.
  - **Validaciones:** Restricciones CHECK en campos de edad de mascotas, email y rut de propietarios.
- [ ] **TASK-HCC-002: Ingesta de Triajes de Emergencia**
  - **Accion:** Desarrollar el endpoint `POST /api/v1/hcc/triajes` para clasificar pacientes criticos por niveles de color.
  - **Validaciones:** Verificar rango de temperatura, frecuencia cardiaca y nivel de dolor (1-10).
- [ ] **TASK-HCC-003: Control de Quirofanos y Cirugias**
  - **Accion:** Desarrollar logica de reserva de quirofano en `cirugias` con bloqueo pesimista.
  - **Validaciones:** Validar que el veterinario tenga el rol de cirujano activo y que el quirofano no este ocupado en ese bloque horario.
- [ ] **TASK-HCC-004: Registro de Hospitalizaciones y Signos Vitales**
  - **Accion:** Implementar el endpoint `POST /api/v1/hcc/hospitalizaciones/{id}/signos` para el registro periodico de monitoreo.
  - **Validaciones:** Control de frecuencia respiratoria y saturacion de oxigeno.

---

## Submodulo 2: Inventario/Logistica de Medicamentos (ILM)

- [ ] **TASK-ILM-001: Registro de Catalogo y Lotes**
  - **Accion:** Implementar modelos para `medicamentos`, `proveedores` y `lotes`.
  - **Validaciones:** Restriccion CHECK para evitar `cantidad_stock < 0` y fecha de vencimiento posterior a la fecha de recepcion.
- [ ] **TASK-ILM-002: Auditoria y Auto-Cuarentena de Lotes Vencidos**
  - **Accion:** Crear script cron diario para buscar lotes vencidos, cambiar su estado a `vencido` e inhabilitar su dispensacion.
  - **Validaciones:** Bloquear cualquier movimiento de inventario que involucre un lote en estado `vencido` o `bloqueado`.
- [ ] **TASK-ILM-003: Dispensacion de Medicamentos Controlados con Receta Retenida**
  - **Accion:** Crear el endpoint `POST /api/v1/ilm/despachos` vinculando la receta firmada con el despacho fisico.
  - **Validaciones:** Control estricto de coincidencia de dosis recetada contra cantidad despachada.

---

## Submodulo 3: Facturacion/Pagos (FAP)

- [ ] **TASK-FAP-001: Gestion de Sesion y Apertura de Caja**
  - **Accion:** Crear el endpoint `POST /api/v1/fap/cajas/abrir` registrando usuario y fondo inicial de caja.
  - **Validaciones:** Verificar que el cajero no tenga otra caja abierta simultaneamente.
- [ ] **TASK-FAP-002: Emision de Boleta y Detalle de Servicios**
  - **Accion:** Desarrollar backend de creacion de boletas vinculadas a consumos clinicos y de tienda.
  - **Validaciones:** Los totales de la boleta deben coincidir de forma exacta con la sumatoria de los detalles mas impuestos.
- [ ] **TASK-FAP-003: Procesamiento de Pagos y Cierre de Caja Ciego**
  - **Accion:** Implementar el endpoint `POST /api/v1/fap/cajas/cerrar` ingresando arqueo fisico contado.
  - **Validaciones:** Validar calculo automatizado de descuadres en el backend e insercion de la bitacora de auditoria.

---

## Submodulo 4: Guarderia/Peluqueria (GAP)

- [ ] **TASK-GAP-001: Reserva de Cupos de Hotel/Guarderia**
  - **Accion:** Desarrollar endpoint `POST /api/v1/gap/reservas` para asignacion de salas.
  - **Validaciones:** Restriccion CHECK de aforo maximo en `salas_guarderia` para evitar sobreventa.
- [ ] **TASK-GAP-002: Check-in, Check-out y Registro de Actividades Diarias**
  - **Accion:** Crear endpoints de control de entrada y salida fisica de las mascotas de la guarderia.
  - **Validaciones:** La fecha de check-out debe ser mayor o igual a la fecha de check-in.
- [ ] **TASK-GAP-003: Programacion de Peluqueria y Grooming**
  - **Accion:** Crear agenda para asignacion de estilistas caninos/felinos.
  - **Validaciones:** Evitar solapamiento de horarios del estilista.
