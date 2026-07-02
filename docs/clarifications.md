# 📝 Aclaraciones de Diseño — Sistema de Gestión Veterinaria `veterinaria_sdd`

Este documento detalla las decisiones de diseño adoptadas durante el ciclo de implementación para resolver problemas de concurrencia, consistencia, separación de responsabilidades y validación de dominio.

---

## 1. Concurrencia en Agendamiento de Citas (Módulo `clinica`)

*   **Problema:** Dos usuarios intentan agendar una cita o cirugía con el mismo veterinario en el mismo bloque horario simultáneamente.
*   **Solución Arquitectónica:**
    1. **Bloqueo Pesimista en Memoria (10 min TTL):** Al reservar un bloque horario de quirófano, se registra una reserva temporal en memoria con expiración de 10 minutos. Durante ese período el bloque aparece como ocupado para otros usuarios.
    2. **Bloqueo de Horarios en Citas:** La tabla `citas` registra `fecha` + `bloque`. El frontend calcula el bloque de fin sumando la duración de la consulta + un margen de aproximación (redondeo a siguiente hora), bloqueando visualmente ese rango en el calendario.
    3. **UI Reactiva:** El componente `AgendaEstetica.tsx` filtra horarios disponibles en tiempo real, inhabilitando los bloques ocupados dentro del mismo día para el mismo estilista/veterinario.

---

## 2. Control de Stock de Medicamentos Vencidos y Lote Obligatorio (Módulo `inventario`)

*   **Problema:** Riesgo de dispensar medicamentos vencidos o próximos a expirar a pacientes críticos, y la presencia de medicamentos huérfanos sin trazabilidad de lotes iniciales en el catálogo.
*   **Solución Arquitectónica:**
    1. **Ingreso Cohesivo Obligatorio:** Al registrar un nuevo medicamento en el catálogo, la API exige forzosamente ingresar los datos del lote de origen inicial (`codigoLote`, `cantidadInicial`, `precioCompraUnitario` y `fechaVencimiento`). Esto asegura que ningún medicamento exista en el sistema con stock huérfano o sin trazabilidad desde el primer segundo.
    2. **Trazabilidad por Lotes:** La tabla `lotes` contiene `fecha_vencimiento` y `estado` (`disponible`, `bloqueado`, `vencido`).
    3. **Estrategia FEFO (First Expired, First Out):** Al emitir un despacho, el sistema selecciona automáticamente los lotes más próximos a vencer en estado `disponible`.
    4. **Proceso de Auto-Cuarentena:** Lógica de auditoría diaria en `alertas_stock` que detecta lotes vencidos o próximos a vencer y los marca como `vencido`, inhabilitándolos para dispensación.
    5. **Validación en Base de Datos:** DDL con restricciones CHECK en `lotes` y `despachos_medicamentos` previniendo asociación de lotes vencidos.

---

## 3. Flujo de Caja y Auditoría de Operadores (Módulo `finanzas`)

*   **Problema:** Fraudes, descuadres en efectivo y falta de trazabilidad cuando un veterinario opera la caja.
*   **Solución Arquitectónica:**
    1. **Sesiones de Caja Abiertas:** Tabla `cajas_diarias` con `cajero_id`, `monto_apertura`, `fecha_apertura` y estado (`abierta`/`cerrada`).
    2. **Auditoría de Operador en Comprobantes:** Cada comprobante fiscal almacena `operador_id` y `operador_rol`. Cuando el operador es un `veterinario`, se genera automáticamente una entrada adicional `[AUDITORÍA]` en `bitacora_transacciones` con el monto y la identidad del profesional.
    3. **Cierre Ciego de Caja:** El cajero introduce el arqueo físico sin ver el balance del sistema. El backend calcula la diferencia (`descuadre`) e inserta en `arqueos_caja` mediante trigger PL/pgSQL (`trg_process_cash_audit`).
    4. **Separación de Roles en Caja:** Admin tiene acceso completo a Apertura/Cierre/Arqueo/Notas de Crédito. El veterinario puede emitir comprobantes y ver el historial, pero toda operación queda registrada con su rol para auditoría posterior.

---

## 4. Separación de Roles: Administrador vs. Veterinario

*   **Problema:** El sistema inicial mezclaba las funciones de gestión y clínicas en ambos roles, generando acceso no controlado a datos clínicos sensibles y funciones de caja desde perfiles no apropiados.
*   **Solución Arquitectónica:**
    1. **Restricción de Endpoints Clínicos:** Los endpoints de escritura (`POST /clinica/triajes`, `POST /clinica/consultas`, `POST /clinica/cirugias`, `POST /clinica/hospitalizaciones`, `PUT /clinica/hospitalizaciones/:id/sala`, `PUT /clinica/hospitalizaciones/:id/alta`, `POST /clinica/hospitalizaciones/:id/signos`) restringidos a rol `veterinario`. El administrador pierde además acceso al Historial Clínico Electrónico (HCE) por privacidad.
    2. **Restricción de Endpoints Administrativos:** Gestión de reservas de guardería (`POST /servicios/reservas`), ajustes de inventario, apertura/cierre de caja y gestión de personal restringidos a rol `administrador`.
    3. **Frontend por Rol:** `Layout.tsx` muestra grupos de menú estrictamente por rol — no hay ítems compartidos. El componente `MapaCaniles.tsx` renderiza controles diferentes según `currentRole`: vet ve botones de ingresar/trasladar/alta; admin ve botones de nueva reserva de guardería con el mapa en solo lectura para hospitalizaciones.

---

## 5. Guardería por Especie: Validación Canino/Felino

*   **Problema:** Un canil designado para caninos aceptaba reservas de felinos (y viceversa), generando problemas operativos y sanitarios.
*   **Solución Arquitectónica:**
    1. **Campo `tipoEspecie` en caniles:** Columna `tipo_especie VARCHAR(10) CHECK (tipo_especie IN ('canino', 'felino'))` con valor persistente en PostgreSQL (migración incluida en `002_schema_finanzas_servicios.sql`).
    2. **Filtrado en Frontend:** El selector de mascota en el modal de nueva reserva filtra automáticamente los pacientes según la especie compatible con el canil seleccionado.
    3. **Validación en Backend:** El controlador de reservas verifica la especie del paciente contra el tipo del canil antes de crear la reserva, retornando error 400 si son incompatibles.

---

## 6. Consolidación de Migraciones SQL

*   **Problema:** Existían 6 archivos de migración separados, con un archivo delta (`006`) que aplicaba `ALTER TABLE` sobre una columna que debía estar en el DDL original, generando fragilidad en deploys desde cero.
*   **Solución:**
    1. Reducción a **3 archivos consolidados** con `CREATE TABLE IF NOT EXISTS` para idempotencia.
    2. `tipo_especie` integrado directamente en el DDL de `caniles`, eliminando la necesidad del delta.
    3. Campos de auditoría (`operador_id`, `operador_rol`) incluidos directamente en el DDL de `comprobantes_fiscales` y `bitacora_transacciones`.
