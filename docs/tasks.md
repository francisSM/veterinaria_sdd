# Plan de Tareas de Implementación - Sistema de Gestión Veterinaria

Este documento detalla el plan de tareas técnicas ejecutadas durante la fase de implementación física del software, distribuidas por submódulo. Las tareas marcadas como `[x]` han sido completadas e integradas al sistema.

---

## Submódulo 1: Historial Clínico Crítico (HCC → `clinica`)

- [x] **TASK-HCC-001: Modelado de Entidades Clínicas Core**
  - **Acción:** Modelos TypeScript para `propietarios`, `pacientes`, `veterinarios`, `historiales` implementados en `src/models/clinica.ts`.
  - **Validaciones:** Restricciones CHECK en campos de edad, email y rut de propietarios; especie limitada a `canino`, `felino`, `exotico`, `equino`.

- [x] **TASK-HCC-002: Ingesta de Triajes de Emergencia**
  - **Acción:** Endpoint `POST /api/v1/clinica/triajes` funcional con clasificación por nivel cromático (rojo, naranja, amarillo, verde, azul).
  - **Validaciones:** Rango de temperatura (30–45 °C), frecuencia cardiaca (20–350 bpm), frecuencia respiratoria (5–150 rpm), escala de dolor (1–10).

- [x] **TASK-HCC-003: Control de Quirófanos y Cirugías**
  - **Acción:** Endpoint `POST /api/v1/clinica/cirugias` con bloqueo pesimista en memoria (10 min TTL). Sólo accesible por rol `veterinario`.
  - **Validaciones:** Tipo de cirugía en (`mayor`, `menor`, `emergencia`, `estetica`), consentimiento requerido.

- [x] **TASK-HCC-004: Registro de Hospitalizaciones, Traslados y Alta**
  - **Acción:** Endpoints `POST /clinica/hospitalizaciones`, `PUT /clinica/hospitalizaciones/:id/sala` (traslado), `PUT /clinica/hospitalizaciones/:id/alta`. Vista bifurcada en `MapaCaniles.tsx`: vet gestiona activamente, admin visualiza aforo.
  - **Validaciones:** Estado en (`activo`, `alta`, `fallecido`), costo/día positivo. Restricciones de rol a nivel backend y frontend.

- [x] **TASK-HCC-005: Separación de Roles Clínico / Administración**
  - **Acción:** Backend (`api.ts`) restringió todos los endpoints de escritura clínica (`triajes`, `consultas`, `cirugias`, `hospitalizaciones`, `signos`, `alta`, `sala`) a rol `veterinario` exclusivamente. Administrador conserva acceso de lectura para aforo.
  - **Resultado:** Historial clínico electrónico (HCE) protegido — admin no puede leer ni modificar expedientes.

---

## Submódulo 2: Inventario/Logística de Medicamentos (ILM → `inventario`)

- [x] **TASK-ILM-001: Registro de Catálogo y Lotes**
  - **Acción:** Modelos `medicamentos`, `proveedores`, `lotes` implementados en `src/models/inventario.ts` y controlador en `src/controllers/inventario.controller.ts`.
  - **Validaciones:** `cantidad_actual >= 0`, forma farmacéutica restringida, fecha de vencimiento posterior a recepción.

- [x] **TASK-ILM-002: Auditoría y Auto-Cuarentena de Lotes Vencidos**
  - **Acción:** Lógica FEFO implementada: selección automática del lote más próximo a vencer al generar despachos. Alertas de stock en tabla `alertas_stock`.
  - **Validaciones:** Bloqueo de movimientos sobre lotes `vencido` o `bloqueado`.

- [x] **TASK-ILM-003: Dispensación de Medicamentos con Receta Retenida**
  - **Acción:** Endpoint `POST /api/v1/inventario/despachos` vinculando receta firmada con despacho físico. Sólo accesible por rol `veterinario`.
  - **Validaciones:** Coincidencia de dosis recetada vs. cantidad despachada; check de lote no vencido.

- [x] **TASK-ILM-004: Bitácora de Stock y Movimientos por Fecha**
  - **Acción:** Incorporación de filtro dinámico de fecha en `BitacoraInventario.tsx` para búsqueda instantánea en base de datos.

---

## Submódulo 3: Facturación/Pagos (FAP → `finanzas`)

- [x] **TASK-FAP-001: Gestión de Sesión y Apertura de Caja**
  - **Acción:** Endpoint `POST /api/v1/finanzas/cajas/apertura`. Verificación de que no exista caja ya abierta para el mismo cajero.
  - **Validaciones:** Monto apertura en [0, 1.000.000].

- [x] **TASK-FAP-002: Emisión de Comprobantes con Auditoría de Operador**
  - **Acción:** Endpoint `POST /api/v1/finanzas/comprobantes` funcional para admin y veterinario. Campos `operadorId` y `operadorRol` registrados en cada comprobante. Si el operador es vet, se genera entrada adicional `[AUDITORÍA]` en `bitacora_transacciones`.
  - **Validaciones:** Tipo en (`boleta`, `factura`, `nota_credito`), monto >= 0, detalles de ítem con descuento válido.

- [x] **TASK-FAP-003: Procesamiento de Pagos y Cierre de Caja Ciego**
  - **Acción:** Endpoints de arqueo y cierre implementados. Trigger PL/pgSQL `trg_process_cash_audit` registra diferencias de arqueo automáticamente en bitácora.
  - **Validaciones:** Descuadre calculado en backend; inserción automática en bitácora de auditoría.

- [x] **TASK-FAP-004: Coberturas Granulares de Campañas y Convenios de Seguro**
  - **Acción:** Base de datos Postgres enriquecida con columnas de multiselección de conceptos de catálogo cubiertos. Banners y cálculo selectivo en POS (`PuntoDeVenta.tsx`).
  - **Validaciones:** Descuentos aplicados únicamente sobre conceptos válidos de la campaña/seguro.

- [x] **TASK-FAP-005: Auditoría y Bitácora de Caja por Fecha**
  - **Acción:** Incorporación de filtro de fecha interactivo en `BitacoraFinanciera.tsx` para auditorías de caja rápidas.

---

## Submódulo 4: Guardería/Peluquería (GAP → `servicios`)

- [x] **TASK-GAP-001: Reserva de Cupos de Hotel/Guardería por Especie**
  - **Acción:** Caniles tipificados con `tipoEspecie` (`canino`/`felino`). Endpoint `POST /api/v1/servicios/reservas` valida especie del paciente contra tipo del canil. Sólo accesible por rol `administrador`.
  - **Validaciones:** `checkout >= checkin`, aforo máximo por canil, costo total >= 0.

- [x] **TASK-GAP-002: Mapa de Caniles con Aforo en Tiempo Real**
  - **Acción:** `MapaCaniles.tsx` muestra barra de aforo por canil, listado de mascotas alojadas y acciones diferenciadas por rol. Admin crea/gestiona reservas; vet visualiza aforo.

- [x] **TASK-GAP-003: Agenda de Peluquería/Estética con Validaciones de Especie**
  - **Acción:** `AgendaEstetica.tsx` con calendario, servicios filtrados por especie (canino/felino), validación de solapamiento de horarios del estilista. Sólo accesible por rol `administrador`.

- [x] **TASK-GAP-004: Agenda Diaria del Personal (Vets y Cuidadores)**
  - **Acción:** Vista `BitacoraActividades.tsx` y `AgendaCitas.tsx` re-diseñadas para ilustrar dinámicamente las labores del personal médico y hotelero por fecha seleccionada, evitando saturación.
  - **Validaciones:** Control de aforo máximo de 8 mascotas por cuidador (BR-51).

---

## Submódulo 5: Sistema de Citas (Agendamiento)

- [x] **TASK-CIT-001: Agenda de Citas con Bloqueo de Horarios**
  - **Acción:** Tabla `citas` con soporte para tipo `clinica`/`domicilio`, estados (`pendiente`, `confirmada`, `cancelada`, `completada`). Bloques de tiempo bloqueados según duración.
  - **Validaciones:** Bloqueo de disponibilidad desde inicio de cita hasta hora de término.

---

## Consolidación de Migraciones SQL

- [x] **TASK-DB-001: Unificación de Esquema en 1 Único Archivo SQL**
  - **Acción:** Consolidación de todas las tablas de Módulos Clínico, Inventario, Finanzas, Hotel, Estética, Citas y Auditoría en [schema_completo.sql](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/database/migrations/schema_completo.sql). Se eliminaron las migraciones individuales redundantes.

- [x] **TASK-DK-001: Contenerización del Sistema (Docker)**
  - **Acción:** Configuración de `Dockerfile` multi-stage que compila React/Vite frontend y backend Node/Express en un contenedor unificado. Creación de `docker-compose.yml` para enlazar la app con base de datos PostgreSQL de producción expuesta en puerto `5433` / `5432`.
  - **Validaciones:** Conexión PG_CONFIG por variables de entorno dinámicas en backend.

---

## Pendientes / Siguientes Pasos

- [/] **TASK-DEP-001: Despliegue en AWS EC2**
  - **Estado:** Pendiente de configuración final y pruebas de red e instancias en la nube de producción. El ambiente local y staging sobre Docker está listo para deploy.
