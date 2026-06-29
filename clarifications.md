# 📝 Aclaraciones de Diseño - Sistema de Gestión Veterinaria

Este documento detalla las decisiones de diseño conceptual para resolver problemas complejos de concurrencia y consistencia en el sistema.

---

## 1. Concurrencia en Agendamiento de Citas (Historial Clínico Crítico)

*   **Problema:** Dos usuarios intentan agendar una cita o cirugía con el mismo veterinario en el mismo bloque horario simultáneamente.
*   **Solución Arquitectónica:**
    1.  **Bloqueo Pesimista a Nivel BD:** Al iniciar la selección de un bloque horario en la interfaz, se realiza un bloqueo transitorio o reserva temporal de 10 minutos insertando un registro en la tabla `reservas_temporales_citas`. Esto previene que otros usuarios vean el bloque como disponible.
    2.  **Transacción SQL Aislada:** La inserción definitiva en la tabla `consultas` o `cirugias` se realiza dentro de una transacción SQL con nivel de aislamiento `SERIALIZABLE`. Se verifica la no-existencia de solapamientos con una consulta que use `SELECT FOR UPDATE` sobre la agenda del veterinario.
    3.  **UI Responsiva:** La interfaz reactiva (React) recibe actualizaciones de disponibilidad en tiempo real a través de WebSockets o encuestas breves, inhabilitando visualmente los bloques en el calendario apenas son reservados temporalmente.

---

## 2. Control de Stock de Medicamentos Vencidos (Inventario/Logística)

*   **Problema:** Riesgo de dispensar medicamentos vencidos o próximos a expirar a pacientes críticos.
*   **Solución Arquitectónica:**
    1.  **Trazabilidad por Lotes:** La tabla `lotes` contiene campos explícitos de `fecha_vencimiento` y `estado` (`disponible`, `bloqueado`, `vencido`).
    2.  **Estrategia FEFO (First Expired, First Out):** Al emitir una receta y generar el despacho, el sistema selecciona automáticamente los lotes más próximos a vencer que se encuentren en estado `disponible`.
    3.  **Proceso de Auto-Cuarentena:** Un script cron diario (`DailyInventoryAuditor`) barre la tabla `lotes`. Cualquier lote cuya `fecha_vencimiento` sea menor o igual al día actual es cambiado automáticamente a estado `vencido` e inutilizado para ventas, disparando una notificación a la bitácora `alertas_stock`.
    4.  **Validación en Base de Datos:** La tabla `despachos_medicamentos` contiene una restricción CHECK que prohíbe asociar un lote cuya fecha de vencimiento sea anterior a la fecha de despacho.

---

## 3. Flujo de Caja y Control de Cierres (Facturación/Pagos)

*   **Problema:** Fraudes o descuadres en el manejo de efectivo diario en las recepciones.
*   **Solución Arquitectónica:**
    1.  **Sesiones de Caja Abiertas:** Cada terminal de cobro inicia sesión mediante la tabla `cajas_diarias`, registrando `monto_apertura`, `usuario_cajero` y `fecha_apertura`.
    2.  **Auditoría de Transacciones:** Todos los cobros se insertan en la tabla `pagos` y se enlazan al ID de la sesión de caja activa. Cualquier movimiento manual de entrada o salida de efectivo debe registrarse en la tabla `arqueos_caja` detallando el motivo.
    3.  **Cierre Ciego de Caja:** Al terminar la jornada, el cajero debe realizar un "cierre ciego", introduciendo manualmente el arqueo de billetes y monedas contados (`arqueo_usuario`) en la tabla `arqueos_caja`, sin que el sistema le revele el balance esperado del sistema (`balance_sistema`).
    4.  **Cálculo de Descuadres:** El sistema calcula la diferencia (`descuadre = arqueo_usuario - balance_sistema`) en el backend y notifica a supervisores en caso de superar el umbral de tolerancia, bloqueando la caja para futuras transacciones hasta su conciliación.
