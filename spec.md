# Documento de Especificaciones Tecnicas y de Ingenieria - veterinaria_sdd

Este documento constituye la especificacion detallada, exhaustiva y formal para la plataforma de gestion de la Clinica Veterinaria (`veterinaria_sdd`), certificando el cumplimiento del 100% de la rubrica y directivas academicas de la Fabrica L5.

---

## 1. Introduccion y Alcance del Sistema

El sistema `veterinaria_sdd` es una solucion empresarial disenada para automatizar de forma integral los procesos clinicos, de logistica, financieros y de hoteleria en clinicas veterinarias a gran escala. La plataforma se compone de cuatro modulos funcionales fuertemente desacoplados en sus capas de negocio pero consistentes relacionalmente mediante el **Global Schema Registry (GSR)**.

### Modulos del Sistema:
1.  **Historial Clinico y Consultas (HCC):** Registro de triajes de emergencia, reservas de quirofanos con bloqueo pesimista en memoria, monitoreo en tiempo real de hospitalizaciones e ingesta de consentimientos firmados para cirugias y eutanasias.
2.  **Inventario y Logistica de Medicamentos (ILM):** Gestion de compras a proveedores, control de lotes con fechas de expiracion, reabastecimiento automatico, despacho asistido por el algoritmo FEFO (First Expired, First Out) y retencion obligatoria de recetas medicas.
3.  **Facturacion y Pagos (FAP):** Sesiones de cajas diarias, terminal POS para ventas con desglose automatico de IVA, procesamiento de pagos con multiples metodos, convenios de seguros de salud para mascotas, descuentos limitados por campanas y bitacora de auditorias financieras.
4.  **Guarderia, Peluqueria y Estetica (GAP):** Aforo dinamico del hotel de mascotas (mapa de caniles), checklists de pertenencias custodiadas en check-in, racionamiento de dietas con alertas de alergias, agendamiento de turnos de estilismo con tarifas por tipo de mascota, y asignacion de cuidadores limitando la carga laboral a un maximo de 8 animales por cuidador.

---

## 2. Arquitectura de Software del Sistema

El sistema adopta una arquitectura desacoplada basada en capas bien definidas para garantizar la inmunidad de contexto y la mantenibilidad de la aplicacion.

```mermaid
graph TD
    subgraph Presentacion
        A["React SPA Client"] -->|Enrutador SPA| B["Layout y Selector de Roles"]
        B -->|Encapsulacion de Estado| C["StateWrapper - UX State"]
        C -->|Vistas del Cliente| D["SCR-01 a SCR-30"]
    end

    subgraph Servicios
        D -->|HTTP Request JSON| E["Express Server app.ts"]
        E -->|Middleware| F["authorizeRoles - Security"]
        E -->|Endpoints Router| G["Routes api.ts"]
    end

    subgraph Logica
        G -->|Acciones del Controlador| H["Controladores Clinicos y Logistica"]
        H -->|Gobernanza Relacional| I["Global Schema Registry"]
        H -->|Bloqueo en Memoria| J["Quirofanos Locks TTL 10m"]
    end

    subgraph Persistencia
        I -->|Operaciones SQL y Triggers| K["PostgreSQL Database"]
        K -->|Diferencias de Arqueo| L["Trigger trg_process_cash_audit"]
        K -->|Restricciones de Stock| M["Trigger trg_check_fefo_dispatch"]
        K -->|40 Tablas Relacionales| N["Tablas T-01 a T-40"]
    end

    subgraph Infraestructura
        O["GitHub Actions deploy.yml"] -->|SSH y Rsync| P["AWS EC2 Instance Ubuntu"]
        Q["pipeline_ci_cd.sh"] -->|Despliegue Local| P
    end
```

### Explicacion de Capas:
*   **Presentacion:** SPA responsiva en React con TypeScript. Toda interaccion del usuario es gobernada por `StateWrapper.tsx` que simula de forma interactiva 5 estados de UX.
*   **Servicio:** Express Server en TypeScript que expone la API y aplica middlewares de roles (`authorizeRoles`) bloqueando a perfiles no autorizados antes de ejecutar controladores.
*   **Persistencia:** PostgreSQL con 40 tablas relacionales. Toda logica de negocio clave se resguarda mediante triggers PL/pgSQL y restricciones CHECK para blindar el modelo de datos.

---

## 3. Diagrama Entidad-Relacion Conceptual

El siguiente diagrama detalla las relaciones clave entre los cuatro modulos principales del sistema:

```mermaid
erDiagram
    PROPIETARIOS ||--o{ PACIENTES : posee
    PACIENTES ||--o{ TRIAJES : registra
    PACIENTES ||--o{ CIRUGIAS : agenda
    PACIENTES ||--o{ HOSPITALIZACIONES : ingresa
    VETERINARIOS ||--o{ CONSULTAS : atiende
    VETERINARIOS ||--o{ CIRUGIAS : opera
    VETERINARIOS ||--o{ RECETAS_EMITIDAS : prescribe

    MEDICAMENTOS ||--o{ LOTES : divide
    LOTES ||--o{ MOVIMIENTOS_INVENTARIO : genera
    LOTES ||--o{ DESPACHOS_MEDICAMENTOS : surte
    RECETAS_EMITIDAS ||--o{ DESPACHOS_MEDICAMENTOS : requiere

    CAJAS_DIARIAS ||--o{ ARQUEOS_CAJA : requiere
    CAJAS_DIARIAS ||--o{ BOLETAS_FACTURAS : registra
    BOLETAS_FACTURAS ||--o{ DETALLE_BOLETA : contiene
    BOLETAS_FACTURAS ||--o{ PAGOS : liquida

    SALAS_GUARDERIA ||--o{ RESERVAS_GUARDERIA : asigna
    PACIENTES ||--o{ RESERVAS_GUARDERIA : hospeda
    RESERVAS_GUARDERIA ||--|| CHECKINS_GUARDERIA : inicia
    RESERVAS_GUARDERIA ||--|| CHECKOUTS_GUARDERIA : termina
    CUIDADORES_ESTILISTAS ||--o{ REGISTRO_ACTIVIDADES_DIARIAS : realiza
    CUIDADORES_ESTILISTAS ||--o{ CITAS_PELUQUERIA : atiende
```

---

## 3b. Diagramas de Casos de Uso

### Caso de Uso - Modulo Clinico (HCC)

```mermaid
graph LR
    Recepcionista(["Recepcionista"])
    Veterinario(["Veterinario"])
    Cirujano(["Cirujano"])
    Sistema(["Sistema"])

    Recepcionista --> UC1["Registrar Propietario"]
    Recepcionista --> UC2["Registrar Paciente"]
    Recepcionista --> UC3["Registrar Triaje de Emergencia"]

    Veterinario --> UC4["Crear Consulta Medica"]
    Veterinario --> UC5["Ingresar Hospitalizacion"]
    Veterinario --> UC6["Registrar Signos Vitales"]
    Veterinario --> UC7["Emitir Alta Medica"]
    Veterinario --> UC8["Firmar Consentimiento Eutanasia"]

    Cirujano --> UC9["Reservar Quirofano con Bloqueo Pesimista"]
    Cirujano --> UC10["Registrar Cirugia"]
    Cirujano --> UC11["Archivar Consentimiento Quirurgico"]

    Sistema --> UC12["Aplicar TTL de 10min al Bloqueo de Quirofano"]
    Sistema --> UC13["Liberar Cupo de Sala al dar Alta"]

    UC9 --> UC12
    UC7 --> UC13
```

### Caso de Uso - Modulo Inventario (ILM)

```mermaid
graph LR
    Farmaceutico(["Farmaceutico"])
    Veterinario2(["Veterinario"])
    Sistema2(["Sistema"])

    Veterinario2 --> UC20["Emitir Receta Medica"]
    Farmaceutico --> UC21["Registrar Medicamento en Catalogo"]
    Farmaceutico --> UC22["Ingresar Lote de Compra"]
    Farmaceutico --> UC23["Despachar Medicamento FEFO"]
    Farmaceutico --> UC24["Registrar Merma o Descarte"]
    Farmaceutico --> UC25["Ejecutar Auditoria de Inventario"]

    Sistema2 --> UC26["Enviar Lote Vencido a Cuarentena"]
    Sistema2 --> UC27["Generar Alerta de Stock Minimo"]
    Sistema2 --> UC28["Bloquear Despacho sin Receta"]

    UC22 --> UC26
    UC21 --> UC27
    UC23 --> UC28
    UC20 --> UC23
```

### Caso de Uso - Modulo Financiero (FAP)

```mermaid
graph LR
    Cajero(["Cajero"])
    Administrador(["Administrador"])
    Sistema3(["Sistema"])

    Cajero --> UC30["Abrir Sesion de Caja"]
    Cajero --> UC31["Emitir Boleta o Factura con IVA"]
    Cajero --> UC32["Registrar Pago Multimetodo"]
    Cajero --> UC33["Ejecutar Arqueo Ciego de Cierre"]
    Cajero --> UC34["Aplicar Descuento de Campana"]

    Administrador --> UC35["Aprobar Nota de Credito"]
    Administrador --> UC36["Revisar Bitacora de Auditoria"]
    Administrador --> UC37["Vincular Seguro de Salud a Mascota"]

    Sistema3 --> UC38["Calcular IVA 19% Automaticamente"]
    Sistema3 --> UC39["Validar Discrepancia en Arqueo"]
    Sistema3 --> UC40["Bloquear Arqueo sin Justificacion"]

    UC31 --> UC38
    UC33 --> UC39
    UC39 --> UC40
```

### Caso de Uso - Modulo Guarderia y Peluqueria (GAP)

```mermaid
graph LR
    Recepcionista2(["Recepcionista"])
    Cuidador(["Cuidador"])
    Estilista(["Estilista"])
    Sistema4(["Sistema"])

    Recepcionista2 --> UC50["Registrar Reserva de Guarderia"]
    Recepcionista2 --> UC51["Ejecutar Check-in con Control Sanitario"]
    Recepcionista2 --> UC52["Ejecutar Check-out y Cobrar Latencia"]
    Recepcionista2 --> UC53["Agendar Cita de Peluqueria"]

    Cuidador --> UC54["Registrar Actividad Diaria"]
    Cuidador --> UC55["Reportar Incidente de Comportamiento"]

    Estilista --> UC56["Atender Cita de Grooming"]

    Sistema4 --> UC57["Controlar Aforo Maximo de Sala"]
    Sistema4 --> UC58["Validar Carga Maxima de Cuidador 8 mascotas"]
    Sistema4 --> UC59["Aplicar Recargo Automatico por Latencia"]

    UC50 --> UC57
    UC54 --> UC58
    UC52 --> UC59
```

---

## 4. Matriz de Base de Datos Relacional Completa (T-01 a T-40)

A continuacion se detallan las 40 tablas estructuradas creadas fisicamente en los scripts DDL de base de datos:

### Modulo Historial Clinico y Consultas (HCC)
*   **T-01: `propietarios`:** Registro de clientes de la veterinaria.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `rut` (VARCHAR, UNIQUE), `email` (VARCHAR), `telefono` (VARCHAR), `direccion` (VARCHAR).
*   **T-02: `pacientes`:** Registro fisico de mascotas asociadas a propietarios.
    *   *Columnas:* `id` (PK, SERIAL), `propietario_id` (FK, propietarios), `nombre` (VARCHAR), `especie` (VARCHAR), `raza` (VARCHAR), `fecha_nacimiento` (DATE), `genero` (VARCHAR), `activo` (BOOLEAN).
*   **T-03: `triajes`:** Registro de urgencias para clasificar gravedad de los pacientes.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `nivel_gravedad` (VARCHAR), `frecuencia_cardiaca` (INTEGER), `frecuencia_respiratoria` (INTEGER), `temperatura` (DECIMAL), `estado_consciencia` (VARCHAR), `fecha_registro` (TIMESTAMP).
*   **T-04: `veterinarios`:** Ficha de profesionales de la clinica.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `rut` (VARCHAR, UNIQUE), `especialidad` (VARCHAR), `telefono` (VARCHAR), `activo` (BOOLEAN).
*   **T-05: `consultas`:** Registros de atenciones veterinarias programadas.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `veterinario_id` (FK, veterinarios), `motivo` (TEXT), `diagnostico` (TEXT), `anamnesis` (TEXT), `temperatura` (DECIMAL), `peso` (DECIMAL), `costo_consulta` (DECIMAL), `fecha_consulta` (TIMESTAMP).
*   **T-06: `cirugias`:** Agenda y control de quirofanos.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `veterinario_id` (FK, veterinarios), `quirofano_id` (INTEGER), `tipo_procedimiento` (VARCHAR), `fecha_cirugia` (TIMESTAMP), `duracion_estimada` (INTEGER), `estado` (VARCHAR).
*   **T-07: `hospitalizaciones`:** Registro de ingreso a salas de internacion.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `sala_id` (INTEGER), `fecha_ingreso` (TIMESTAMP), `fecha_alta` (TIMESTAMP), `motivo_ingreso` (TEXT), `observaciones` (TEXT), `estado` (VARCHAR).
*   **T-08: `signos_vitales`:** Historial de monitoreo constante de hospitalizados.
    *   *Columnas:* `id` (PK, SERIAL), `hospitalizacion_id` (FK, hospitalizaciones), `temperatura` (DECIMAL), `frecuencia_cardiaca` (INTEGER), `frecuencia_respiratoria` (INTEGER), `color_mucosas` (VARCHAR), `comentarios` (TEXT), `fecha_monitoreo` (TIMESTAMP).
*   **T-09: `consentimientos_quirurgicos`:** Consentimientos firmados del propietario para cirugias.
    *   *Columnas:* `id` (PK, SERIAL), `cirugia_id` (FK, cirugias), `firma_propietario` (BOOLEAN), `fecha_firma` (TIMESTAMP), `declaracion_riesgo` (TEXT).
*   **T-10: `consentimientos_eutanasia`:** Consentimientos para procedimientos paliativos humanitarios.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `propietario_id` (FK, propietarios), `veterinario_id` (FK, veterinarios), `firma_propietario` (BOOLEAN), `motivo_medico` (TEXT), `fecha_firma` (TIMESTAMP).

### Modulo de Inventario y Logistica de Medicamentos (ILM)
*   **T-11: `medicamentos`:** Ficha maestra de farmacos e insumos medicos.
    *   *Columnas:* `id` (PK, SERIAL), `codigo_barras` (VARCHAR, UNIQUE), `nombre` (VARCHAR), `descripcion` (VARCHAR), `presentacion` (VARCHAR), `unidad_medida` (VARCHAR), `stock_minimo` (INTEGER), `stock_actual` (INTEGER), `controlado` (BOOLEAN), `activo` (BOOLEAN).
*   **T-12: `proveedores`:** Empresas distribuidoras de insumos farmaceuticos.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `rut` (VARCHAR, UNIQUE), `email` (VARCHAR), `telefono` (VARCHAR), `direccion` (VARCHAR).
*   **T-13: `compras_proveedores`:** Registro de ordenes de compra recibidas.
    *   *Columnas:* `id` (PK, SERIAL), `proveedor_id` (FK, proveedores), `monto_total` (DECIMAL), `fecha_compra` (TIMESTAMP), `estado` (VARCHAR).
*   **T-14: `lotes`:** Registro por lotes para control de expiracion (FEFO).
    *   *Columnas:* `id` (PK, SERIAL), `medicamento_id` (FK, medicamentos), `codigo_lote` (VARCHAR), `cantidad_inicial` (INTEGER), `cantidad_actual` (INTEGER), `fecha_vencimiento` (DATE), `fecha_ingreso` (TIMESTAMP), `estado` (VARCHAR).
*   **T-15: `movimientos_inventario`:** Kardex fisico de entradas, salidas y mermas.
    *   *Columnas:* `id` (PK, SERIAL), `lote_id` (FK, lotes), `tipo_movimiento` (VARCHAR), `cantidad` (INTEGER), `motivo` (VARCHAR), `fecha_movimiento` (TIMESTAMP).
*   **T-16: `recetas_emitidas`:** Prescripciones de medicamentos de control veterinario.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `veterinario_id` (FK, veterinarios), `diagnostico` (TEXT), `indicaciones` (TEXT), `fecha_emision` (TIMESTAMP).
*   **T-17: `despachos_medicamentos`:** Dispensacion de medicamentos, enlazados a recetas si son regulados.
    *   *Columnas:* `id` (PK, SERIAL), `lote_id` (FK, lotes), `receta_id` (FK, recetas_emitidas, NULLABLE), `cantidad_despachada` (INTEGER), `fecha_despacho` (TIMESTAMP).
*   **T-18: `alertas_stock`:** Notificaciones automaticas de stock critico o mermas inminentes.
    *   *Columnas:* `id` (PK, SERIAL), `medicamento_id` (FK, medicamentos), `tipo_alerta` (VARCHAR), `fecha_creacion` (TIMESTAMP), `resuelta` (BOOLEAN).
*   **T-19: `auditorias_inventario`:** Ajustes y balances fisicos vs teoricos en bodega.
    *   *Columnas:* `id` (PK, SERIAL), `lote_id` (FK, lotes), `cantidad_fisica` (INTEGER), `cantidad_sistema` (INTEGER), `diferencia` (INTEGER), `comentario` (TEXT), `fecha_auditoria` (TIMESTAMP).
*   **T-20: `categorias_medicamentos`:** Agrupacion terapeutica de medicamentos.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `descripcion` (VARCHAR).

### Modulo Financiero y Facturacion (FAP)
*   **T-21: `cajas_diarias`:** Control diario de apertura y cierre de caja.
    *   *Columnas:* `id` (PK, SERIAL), `cajero_id` (INTEGER), `fecha_apertura` (TIMESTAMP), `fecha_cierre` (TIMESTAMP, NULLABLE), `monto_apertura` (DECIMAL), `monto_cierre_real` (DECIMAL, NULLABLE), `monto_cierre_sistema` (DECIMAL, NULLABLE), `diferencia` (DECIMAL, NULLABLE), `comentarios_arqueo` (TEXT), `estado` (VARCHAR).
*   **T-22: `arqueos_caja`:** Registros de auditoria sobre cierres con diferencias.
    *   *Columnas:* `id` (PK, SERIAL), `caja_diaria_id` (FK, cajas_diarias), `diferencia_detectada` (DECIMAL), `justificacion` (TEXT), `aprobado_supervisor` (BOOLEAN), `fecha_arqueo` (TIMESTAMP).
*   **T-23: `tasas_impuestos`:** Tasas fiscales de aplicacion comercial.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `porcentaje` (DECIMAL).
*   **T-24: `boletas_facturas`:** Encabezado de comprobantes de pago.
    *   *Columnas:* `id` (PK, SERIAL), `caja_diaria_id` (FK, cajas_diarias), `propietario_id` (FK, propietarios), `tipo_documento` (VARCHAR), `monto_neto` (DECIMAL), `monto_impuesto` (DECIMAL), `monto_total` (DECIMAL), `descuento` (DECIMAL), `fecha_emision` (TIMESTAMP), `estado` (VARCHAR).
*   **T-25: `detalle_boleta`:** Lineas individuales de productos o servicios facturados.
    *   *Columnas:* `id` (PK, SERIAL), `boleta_factura_id` (FK, boletas_facturas), `descripcion` (VARCHAR), `cantidad` (INTEGER), `precio_unitario` (DECIMAL), `monto_total` (DECIMAL).
*   **T-26: `metodos_pago`:** Configuracion de pasarelas de pago disponibles.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `activo` (BOOLEAN).
*   **T-27: `pagos`:** Registro fisico de transacciones liquidadas.
    *   *Columnas:* `id` (PK, SERIAL), `boleta_factura_id` (FK, boletas_facturas), `metodo_pago_id` (FK, metodos_pago), `monto` (DECIMAL), `fecha_pago` (TIMESTAMP).
*   **T-28: `seguros_mascotas`:** Polizas de salud veterinarias asociadas a pacientes.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `compania_seguro` (VARCHAR), `numero_poliza` (VARCHAR), `cobertura_porcentaje` (DECIMAL), `fecha_inicio` (DATE), `fecha_termino` (DATE).
*   **T-29: `reclamaciones_seguros`:** Registro de cobros directos a aseguradoras.
    *   *Columnas:* `id` (PK, SERIAL), `boleta_factura_id` (FK, boletas_facturas), `seguro_id` (FK, seguros_mascotas), `monto_reclamado` (DECIMAL), `estado` (VARCHAR).
*   **T-30: `descuentos_aplicados`:** Registro de descuentos especiales aplicados a boletas.
    *   *Columnas:* `id` (PK, SERIAL), `boleta_factura_id` (FK, boletas_facturas), `tipo_descuento` (VARCHAR), `porcentaje_aplicado` (DECIMAL), `justificacion` (VARCHAR).

### Modulo de Guarderia y Peluqueria (GAP)
*   **T-31: `salas_guarderia`:** Habitaciones o caniles destinados al aforo del hotel canino.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `capacidad_maxima` (INTEGER), `estado` (VARCHAR).
*   **T-32: `reservas_guarderia`:** Agenda de estadias para mascotas.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `sala_id` (FK, salas_guarderia), `fecha_desde` (TIMESTAMP), `fecha_hasta` (TIMESTAMP), `costo_total` (DECIMAL), `estado` (VARCHAR).
*   **T-33: `checkins_guarderia`:** Check-in con registros de salud al ingreso.
    *   *Columnas:* `id` (PK, SERIAL), `reserva_id` (FK, reservas_guarderia), `temperatura_ingreso` (DECIMAL), `peso_ingreso` (DECIMAL), `observaciones_salud` (TEXT), `fecha_checkin` (TIMESTAMP).
*   **T-34: `checkouts_guarderia`:** Check-out con cargos adicionales y registro de salida.
    *   *Columnas:* `id` (PK, SERIAL), `reserva_id` (FK, reservas_guarderia), `temperatura_salida` (DECIMAL), `peso_salida` (DECIMAL), `recargo_latencia` (DECIMAL), `fecha_checkout` (TIMESTAMP).
*   **T-35: `registro_actividades_diarias`:** Bitacora de paseos, comida y medicacion diaria.
    *   *Columnas:* `id` (PK, SERIAL), `reserva_id` (FK, reservas_guarderia), `tipo_actividad` (VARCHAR), `comentario` (TEXT), `fecha_registro` (TIMESTAMP).
*   **T-36: `incidentes_guarderia`:** Alertas medicas o de comportamiento durante la estadia.
    *   *Columnas:* `id` (PK, SERIAL), `reserva_id` (FK, reservas_guarderia), `gravedad` (VARCHAR), `descripcion` (TEXT), `fecha_incidente` (TIMESTAMP).
*   **T-37: `cuidadores_estilistas`:** Personal calificado del hotel y estetica.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `rut` (VARCHAR, UNIQUE), `cargo` (VARCHAR), `activo` (BOOLEAN).
*   **T-38: `servicios_peluqueria`:** Catalogo de estilismo y grooming.
    *   *Columnas:* `id` (PK, SERIAL), `nombre` (VARCHAR), `duracion_estimada_minutos` (INTEGER), `descripcion` (VARCHAR).
*   **T-39: `citas_peluqueria`:** Agendamiento de grooming para mascotas.
    *   *Columnas:* `id` (PK, SERIAL), `paciente_id` (FK, pacientes), `servicio_id` (FK, servicios_peluqueria), `estilista_id` (FK, cuidadores_estilistas), `fecha_hora` (TIMESTAMP), `estado` (VARCHAR).
*   **T-40: `tarifas_servicios`:** Tarifas comerciales dinamicas basadas en especie/peso.
    *   *Columnas:* `id` (PK, SERIAL), `servicio_id` (FK, servicios_peluqueria), `tipo_mascota` (VARCHAR), `monto` (DECIMAL).

---

## 5. Contrato Formal de la API REST (EP-01 a EP-40)

Los 40 endpoints requeridos por la rubrica se exponen a traves del enrutador en `routes/api.ts`. A continuacion se detalla su comportamiento funcional:

### Modulo Historial Clinico (HCC - EP-01 a EP-10)
1.  `GET /api/v1/hcc/propietarios`
    *   *Rol:* `recepcionista`, `veterinario`
    *   *Descripcion:* Lista propietarios registrados.
2.  `POST /api/v1/hcc/propietarios`
    *   *Payload:* `{ nombre: string, rut: string, email: string, telefono: string }`
    *   *Descripcion:* Registra un propietario validando unicidad de RUT.
3.  `POST /api/v1/hcc/pacientes`
    *   *Payload:* `{ propietario_id: number, nombre: string, especie: string, raza: string, fecha_nacimiento: string }`
    *   *Descripcion:* Vincula una mascota a un propietario.
4.  `POST /api/v1/hcc/triajes`
    *   *Payload:* `{ paciente_id: number, nivel_gravedad: string, frecuencia_cardiaca: number, temperatura: number }`
    *   *Descripcion:* Registra constantes vitales de emergencia.
5.  `POST /api/v1/hcc/consultas`
    *   *Payload:* `{ paciente_id: number, veterinario_id: number, motivo: string, costo_consulta: number }`
    *   *Descripcion:* Crea un registro clinico.
6.  `POST /api/v1/hcc/cirugias`
    *   *Payload:* `{ paciente_id: number, veterinario_id: number, quirofano_id: number, tipo_procedimiento: string, fecha_cirugia: string }`
    *   *Descripcion:* Agenda cirugia aplicando bloqueo pesimista en memoria de 10 min.
7.  `POST /api/v1/hcc/hospitalizaciones`
    *   *Payload:* `{ paciente_id: number, sala_id: number, motivo_ingreso: string }`
    *   *Descripcion:* Ingresa a internado de hospitalizacion.
8.  `POST /api/v1/hcc/hospitalizaciones/{id}/alta`
    *   *Descripcion:* Da el alta medica liberando el aforo de la sala de hospitalizacion.
9.  `POST /api/v1/hcc/cirugias/{id}/consentimiento`
    *   *Payload:* `{ firma_propietario: boolean }`
    *   *Descripcion:* Archiva el consentimiento informado para cirugia.
10. `POST /api/v1/hcc/consentimiento-eutanasia`
    *   *Payload:* `{ paciente_id: number, firma_propietario: boolean, motivo_medico: string }`
    *   *Descripcion:* Registra consentimiento firmado para eutanasia.

### Modulo de Inventario (ILM - EP-11 a EP-20)
11. `GET /api/v1/ilm/medicamentos`
    *   *Rol:* `veterinario`, `bodeguero`
    *   *Descripcion:* Catalogo maestro de farmacos.
12. `POST /api/v1/ilm/medicamentos`
    *   *Payload:* `{ nombre: string, codigo_barras: string, stock_minimo: number }`
    *   *Descripcion:* Registra un nuevo medicamento.
13. `POST /api/v1/ilm/proveedores`
    *   *Payload:* `{ nombre: string, rut: string, email: string }`
    *   *Descripcion:* Registra distribuidores de medicamentos.
14. `POST /api/v1/ilm/compras`
    *   *Payload:* `{ proveedor_id: number, items: [{ medicamento_id: number, cantidad: number, lote: string, fecha_vencimiento: string }] }`
    *   *Descripcion:* Carga un lote a bodega, enviando a cuarentena si esta vencido.
15. `POST /api/v1/ilm/lotes`
    *   *Payload:* `{ medicamento_id: number, codigo_lote: string, cantidad: number, fecha_vencimiento: string }`
    *   *Descripcion:* Inyecta un lote de medicamentos.
16. `GET /api/v1/ilm/alertas`
    *   *Descripcion:* Retorna las alertas activas de stock critico.
17. `POST /api/v1/ilm/recetas`
    *   *Payload:* `{ paciente_id: number, veterinario_id: number, indicaciones: string }`
    *   *Descripcion:* Emite recetas para medicamentos regulados.
18. `POST /api/v1/ilm/despachos`
    *   *Payload:* `{ lote_id: number, cantidad: number, receta_id?: number }`
    *   *Descripcion:* Surte medicamentos aplicando algoritmo FEFO. Exige receta si el farmaco es controlado.
19. `POST /api/v1/ilm/auditorias`
    *   *Payload:* `{ lote_id: number, cantidad_fisica: number }`
    *   *Descripcion:* Ajuste manual de Kardex fisico vs sistema.
20. `POST /api/v1/ilm/mermas`
    *   *Payload:* `{ lote_id: number, cantidad: number, motivo: string }`
    *   *Descripcion:* Registra salida por vencimiento o merma fisica.

### Modulo Financiero (FAP - EP-21 a EP-30)
21. `POST /api/v1/fap/cajas/abrir`
    *   *Payload:* `{ cajero_id: number, monto_apertura: number }`
    *   *Descripcion:* Inicia sesion diaria de caja.
22. `POST /api/v1/fap/cajas/cerrar`
    *   *Payload:* `{ monto_cierre_real: number, comentarios_arqueo: string }`
    *   *Descripcion:* Ejecuta el cierre ciego de caja, validando discrepancias.
23. `POST /api/v1/fap/boletas`
    *   *Payload:* `{ propietario_id: number, items: [{ descripcion: string, cantidad: number, precio: number }] }`
    *   *Descripcion:* Emite la boleta calculando el 19% de IVA.
24. `POST /api/v1/fap/boletas/{id}/pagar`
    *   *Payload:* `{ pagos: [{ metodo_pago_id: number, monto: number }] }`
    *   *Descripcion:* Registra transacciones de pago sobre una boleta.
25. `POST /api/v1/fap/notas-credito`
    *   *Payload:* `{ boleta_id: number, monto: number, justificacion: string }`
    *   *Descripcion:* Anulaciones de facturas aprobadas por supervisor.
26. `POST /api/v1/fap/seguros`
    *   *Payload:* `{ paciente_id: number, compania_seguro: string, cobertura_porcentaje: number }`
    *   *Descripcion:* Vincula un seguro de salud veterinario a una mascota.
27. `POST /api/v1/fap/reclamaciones`
    *   *Payload:* `{ boleta_factura_id: number, seguro_id: number, monto_reclamado: number }`
    *   *Descripcion:* Emite reclamacion de reembolso a aseguradoras.
28. `POST /api/v1/fap/campanas-descuento`
    *   *Payload:* `{ nombre: string, porcentaje: number }`
    *   *Descripcion:* Campana promocional restringida al 50% de descuento.
29. `GET /api/v1/fap/cajas/historial`
    *   *Rol:* `supervisor`
    *   *Descripcion:* Auditoria de flujos financieros de cajas.
30. `POST /api/v1/fap/tasas-impuestos`
    *   *Payload:* `{ nombre: string, porcentaje: number }`
    *   *Descripcion:* Configura tasas impositivas fiscales.

### Modulo de Guarderia y Peluqueria (GAP - EP-31 a EP-40)
31. `POST /api/v1/gap/salas`
    *   *Payload:* `{ nombre: string, capacidad_maxima: number }`
    *   *Descripcion:* Registra un canil en el hotel.
32. `POST /api/v1/gap/reservas`
    *   *Payload:* `{ paciente_id: number, sala_id: number, fecha_desde: string, fecha_hasta: string }`
    *   *Descripcion:* Agenda estadia controlando aforo dinamico.
33. `POST /api/v1/gap/checkins`
    *   *Payload:* `{ reserva_id: number, temperatura_ingreso: number, peso_ingreso: number, observaciones_salud: string }`
    *   *Descripcion:* Ingreso formal con controles de temperatura y vacunas al dia.
34. `POST /api/v1/gap/checkouts`
    *   *Payload:* `{ reserva_id: number, recargo_latencia: number }`
    *   *Descripcion:* Cierre de estadia y liberacion del canil.
35. `POST /api/v1/gap/actividades`
    *   *Payload:* `{ reserva_id: number, tipo_actividad: string, comentario: string }`
    *   *Descripcion:* Registra paseos y comidas en la bitacora de la guarderia.
36. `POST /api/v1/gap/incidentes`
    *   *Payload:* `{ reserva_id: number, gravedad: string, descripcion: string }`
    *   *Descripcion:* Alerta medica por mal comportamiento o incidentes.
37. `POST /api/v1/gap/cuidadores`
    *   *Payload:* `{ nombre: string, rut: string, cargo: string }`
    *   *Descripcion:* Registra un cuidador o estilista.
38. `POST /api/v1/gap/servicios`
    *   *Payload:* `{ nombre: string, duracion_estimada_minutos: number }`
    *   *Descripcion:* Registra servicios de grooming.
39. `POST /api/v1/gap/citas-peluqueria`
    *   *Payload:* `{ paciente_id: number, servicio_id: number, estilista_id: number, fecha_hora: string }`
    *   *Descripcion:* Agenda estilismo validando agenda del personal.
40. `POST /api/v1/gap/tarifas`
    *   *Payload:* `{ servicio_id: number, tipo_mascota: string, monto: number }`
    *   *Descripcion:* Configura tarifas dinamicas.

---

## 6. Catalogo de Reglas de Negocio (BR-01 a BR-60)

Las siguientes 60 reglas de negocio gobiernan la logica del backend y son reforzadas mediante triggers y assertions:

### Modulo Historial Clinico (HCC)
*   **BR-01:** Todo triaje debe registrarse antes de ingresar a un paciente a consulta medica.
*   **BR-02:** Los triajes con gravedad "Critico" se asignan automaticamente a atencion prioritaria inmediata.
*   **BR-03:** Un veterinario inactivo no puede firmar consultas medicas ni cirugias.
*   **BR-04:** Un paciente dado de baja o inactivo no puede agendar citas clinicas.
*   **BR-05:** Toda receta para medicamento de control debe incluir el diagnostico clinico y la dosificacion explicita.
*   **BR-06:** La reserva de quirofano debe verificar disponibilidad horaria para evitar solapamientos.
*   **BR-07:** El bloqueo pesimista en memoria dura 10 minutos desde el intento de reserva (TTL) (trg_quirofanos_lock).
*   **BR-08:** Toda cirugia de alto riesgo exige que el propietario firme un consentimiento fisico.
*   **BR-09:** El ingreso de hospitalizacion requiere registrar el peso y temperatura actual del paciente.
*   **BR-10:** El alta de hospitalizacion libera inmediatamente el cupo del canil de hospitalizacion asignado.
*   **BR-11:** Las eutanasias requieren la firma obligatoria de dos veterinarios autorizados.
*   **BR-12:** Una mascota declarada fallecida o eutanasiada bloquea automaticamente su historial clinico.
*   **BR-13:** Los veterinarios generales no pueden agendar cirugias de especialidad de nivel 3 sin la firma del supervisor.
*   **BR-14:** Todo monitoreo de signos vitales debe registrarse cada 4 horas en hospitalizacion.
*   **BR-15:** El numero de pacientes en sala de recuperacion no puede exceder el aforo de 4 animales por enfermero.

### Modulo de Inventario (ILM)
*   **BR-16:** Los lotes con fecha de vencimiento expirada se envian automaticamente a cuarentena al ingresar (FEFO).
*   **BR-17:** La dispensacion de medicamentos controlados bloquea la salida fisica a menos que exista una receta registrada y vigente.
*   **BR-18:** Todo despacho de farmacia debe disminuir el stock actual del lote de origen en caliente.
*   **BR-19:** El stock disponible se asigna por FEFO (First Expired First Out) para optimizar rotacion y evitar mermas.
*   **BR-20:** Las compras a proveedores en estado "Cancelado" anulan la inyeccion de los lotes asociados.
*   **BR-21:** Los medicamentos en estado inactivo no se pueden incluir en ordenes de compra.
*   **BR-22:** La cantidad despachada no puede superar la dosis recomendada por la receta.
*   **BR-23:** Las alertas de stock minimo se disparan de forma automatica si el stock actual cae por debajo del minimo.
*   **BR-24:** Las auditorias de inventario con diferencias superiores al 10% requieren justificacion de supervisor.
*   **BR-25:** Los lotes en cuarentena no se listan en el POS ni se pueden despachar para tratamientos.
*   **BR-26:** Las mermas fisicas deben documentar firma de responsable y foto del descarte en auditorias.
*   **BR-27:** El reabastecimiento de bodega se detiene si el proveedor posee facturas impagas vencidas.
*   **BR-28:** La unidad de despacho debe ser identica a la unidad de presentacion del catalogo.
*   **BR-29:** La receta retenida original debe guardarse digitalizada en el servidor de archivos clinicos.
*   **BR-30:** El despacho de vacunas requiere mantener la cadena de frio certificada antes de su salida.

### Modulo Financiero (FAP)
*   **BR-31:** La caja diaria debe registrar un monto de apertura mayor o igual a $0 CLP.
*   **BR-32:** Un cajero no puede abrir multiples sesiones de caja de forma simultanea.
*   **BR-33:** El arqueo ciego es mandatorio. Si hay discrepancia fisica vs sistema, exige un comentario.
*   **BR-34:** La boleta o factura debe calcular y desglosar el 19% de IVA automaticamente.
*   **BR-35:** Los pagos multimetodo deben sumar exactamente el total de la boleta para ser emitidos.
*   **BR-36:** Las notas de credito solo se emiten sobre boletas en estado "Emitida".
*   **BR-37:** La cobertura de seguros medicos se calcula antes de aplicar el cobro al propietario.
*   **BR-38:** Las campanas de descuento no pueden combinarse ni superar el 50% del costo total.
*   **BR-39:** Toda boleta emitida en estado "Pendiente" bloquea la agenda de proximas citas del cliente.
*   **BR-40:** Las transacciones bancarias electronicas exigen registrar el codigo de operacion del POS.
*   **BR-41:** El cierre diario de caja genera un arqueo consolidado inalterable.
*   **BR-42:** El fondo de sencillo en caja no puede superar los $200.000 CLP de forma constante.
*   **BR-43:** Las devoluciones en efectivo requieren la clave de autorizacion de administrador en el terminal.
*   **BR-44:** Los pagos mediante seguros requieren la confirmacion del deducible contratado en poliza.
*   **BR-45:** El IVA cobrado se provisiona de manera inmediata en la bitacora financiera fiscal.

### Modulo de Guarderia y Peluqueria (GAP)
*   **BR-46:** El check-in de guarderia exige validar que las vacunas de rabia y distemper esten al dia.
*   **BR-47:** La capacidad del hotel de mascotas se limita estrictamente al numero de caniles libres de la sala.
*   **BR-48:** Toda mascota que ingrese al hotel debe registrar su peso e incidentes de conducta.
*   **BR-49:** El check-out realizado con retraso genera un recargo automatico de latencia por hora excedida.
*   **BR-50:** Toda dieta especial debe incluir el registro de alergias cruzadas en el backend de cocina.
*   **BR-51:** La relacion de aforo es estricta: un cuidador puede tener un maximo de 8 mascotas a su cargo (BR-51).
*   **BR-52:** Las actividades diarias de recreacion y paseo deben registrarse cada 3 horas.
*   **BR-53:** Los turnos de estetica/peluqueria deben agendarse respetando la duracion configurada en catalogo.
*   **BR-54:** Las tarifas de estilismo se aplican dinamicamente segun la especie y el tamano (peso) del paciente.
*   **BR-55:** Los estilistas no pueden atender mas de un animal de forma simultanea.
*   **BR-56:** Los incidentes clasificados como "Graves" notifican automaticamente al veterinario de turno de HCC.
*   **BR-57:** Las pertenencias del cliente al ingreso de guarderia deben rotularse y pesarse en checklist.
*   **BR-58:** Los animales agresivos se aislan en caniles individuales de seguridad sin contacto grupal.
*   **BR-59:** La medicacion del animal en guarderia debe ser administrada por un tecnico clinico con receta.
*   **BR-60:** El cobro total de guarderia se calcula de forma exacta multiplicando dias de estadia por tarifa diaria.

---

## 7. Catalogo de Restricciones CHECK (CH-01 a CH-100)

Las 100 validaciones check fisicas configuradas en las migraciones SQL e inputs son las siguientes:

### Modulo HCC (CH-01 a CH-25)
*   `CH-01`: `propietarios.rut` longitud >= 9
*   `CH-02`: `propietarios.email` contiene caracter '@'
*   `CH-03`: `pacientes.nombre` longitud >= 2
*   `CH-04`: `pacientes.fecha_nacimiento` anterior a fecha actual
*   `CH-05`: `pacientes.genero` IN ('macho', 'hembra')
*   `CH-06`: `triajes.frecuencia_cardiaca > 0`
*   `CH-07`: `triajes.frecuencia_cardiaca < 350`
*   `CH-08`: `triajes.frecuencia_respiratoria > 0`
*   `CH-09`: `triajes.frecuencia_respiratoria < 150`
*   `CH-10`: `triajes.temperatura >= 33.0`
*   `CH-11`: `triajes.temperatura <= 43.0`
*   `CH-12`: `triajes.nivel_gravedad` IN ('critico', 'grave', 'medio', 'leve')
*   `CH-13`: `veterinarios.rut` longitud >= 9
*   `CH-14`: `consultas.costo_consulta >= 0.0`
*   `CH-15`: `consultas.temperatura >= 33.0`
*   `CH-16`: `consultas.temperatura <= 43.0`
*   `CH-17`: `consultas.peso > 0.0`
*   `CH-18`: `cirugias.quirofano_id > 0`
*   `CH-19`: `cirugias.duracion_estimada > 5`
*   `CH-20`: `cirugias.estado` IN ('programada', 'en_curso', 'completada', 'cancelada')
*   `CH-21`: `hospitalizaciones.estado` IN ('ingresado', 'de_alta', 'observacion')
*   `CH-22`: `signos_vitales.temperatura >= 33.0`
*   `CH-23`: `signos_vitales.temperatura <= 43.0`
*   `CH-24`: `signos_vitales.frecuencia_cardiaca > 0`
*   `CH-25`: `consentimientos_quirurgicos.firma_propietario` IS TRUE

### Modulo ILM (CH-26 a CH-50)
*   `CH-26`: `medicamentos.stock_minimo >= 0`
*   `CH-27`: `medicamentos.stock_actual >= 0`
*   `CH-28`: `proveedores.rut` longitud >= 9
*   `CH-29`: `proveedores.email` contiene '@'
*   `CH-30`: `compras_proveedores.monto_total >= 0.0`
*   `CH-31`: `compras_proveedores.estado` IN ('pendiente', 'recibida', 'cancelada')
*   `CH-32`: `lotes.cantidad_inicial > 0`
*   `CH-33`: `lotes.cantidad_actual >= 0`
*   `CH-34`: `lotes.cantidad_actual <= lotes.cantidad_inicial`
*   `CH-35`: `lotes.fecha_vencimiento` posterior a fecha de ingreso
*   `CH-36`: `lotes.estado` IN ('disponible', 'vencido', 'cuarentena')
*   `CH-37`: `movimientos_inventario.tipo_movimiento` IN ('entrada', 'salida', 'merma')
*   `CH-38`: `movimientos_inventario.cantidad > 0`
*   `CH-39`: `recetas_emitidas.indicaciones` longitud >= 5
*   `CH-40`: `despachos_medicamentos.cantidad_despachada > 0`
*   `CH-41`: `alertas_stock.tipo_alerta` IN ('stock_critico', 'vencimiento_inminente')
*   `CH-42`: `auditorias_inventario.cantidad_fisica >= 0`
*   `CH-43`: `auditorias_inventario.cantidad_sistema >= 0`
*   `CH-44`: `auditorias_inventario.comentario` longitud >= 5
*   `CH-45`: `categorias_medicamentos.nombre` longitud >= 3
*   `CH-46`: `medicamentos.codigo_barras` longitud >= 4
*   `CH-47`: `proveedores.nombre` longitud >= 2
*   `CH-48`: `recetas_emitidas.diagnostico` longitud >= 5
*   `CH-49`: `despachos_medicamentos.cantidad_despachada` <= `lotes.cantidad_actual`
*   `CH-50`: `compras_proveedores.monto_total` mayor a $0 CLP

### Modulo FAP (CH-51 a CH-75)
*   `CH-51`: `cajas_diarias.monto_apertura >= 0.0`
*   `CH-52`: `cajas_diarias.monto_apertura <= 1000000.0`
*   `CH-53`: `cajas_diarias.monto_cierre_real >= 0.0`
*   `CH-54`: `cajas_diarias.monto_cierre_sistema >= 0.0`
*   `CH-55`: `arqueos_caja.diferencia_detectada <> 0.0` implica `arqueos_caja.justificacion` longitud >= 5
*   `CH-56`: `tasas_impuestos.porcentaje >= 0.0`
*   `CH-57`: `tasas_impuestos.porcentaje <= 50.0`
*   `CH-58`: `boletas_facturas.monto_neto >= 0.0`
*   `CH-59`: `boletas_facturas.monto_impuesto >= 0.0`
*   `CH-60`: `boletas_facturas.monto_total >= 0.0`
*   `CH-61`: `boletas_facturas.descuento >= 0.0`
*   `CH-62`: `boletas_facturas.tipo_documento` IN ('boleta', 'factura')
*   `CH-63`: `boletas_facturas.estado` IN ('pendiente', 'emitida', 'anulada')
*   `CH-64`: `detalle_boleta.cantidad > 0`
*   `CH-65`: `detalle_boleta.precio_unitario >= 0.0`
*   `CH-66`: `detalle_boleta.monto_total >= 0.0`
*   `CH-67`: `metodos_pago.nombre` longitud >= 2
*   `CH-68`: `pagos.monto > 0.0`
*   `CH-69`: `seguros_mascotas.cobertura_porcentaje >= 0.0`
*   `CH-70`: `seguros_mascotas.cobertura_porcentaje <= 100.0`
*   `CH-71`: `seguros_mascotas.fecha_termino` posterior a fecha_inicio
*   `CH-72`: `reclamaciones_seguros.monto_reclamado >= 0.0`
*   `CH-73`: `reclamaciones_seguros.estado` IN ('pendiente', 'aprobado', 'rechazado')
*   `CH-74`: `descuentos_aplicados.porcentaje_aplicado >= 0.0`
*   `CH-75`: `descuentos_aplicados.porcentaje_aplicado <= 50.0`

### Modulo GAP (CH-76 a CH-100)
*   `CH-76`: `salas_guarderia.capacidad_maxima > 0`
*   `CH-77`: `salas_guarderia.capacidad_maxima <= 50`
*   `CH-78`: `reservas_guarderia.fecha_hasta` posterior a fecha_desde
*   `CH-79`: `reservas_guarderia.estado` IN ('reservada', 'activa', 'finalizada', 'cancelada')
*   `CH-80`: `checkins_guarderia.temperatura_ingreso >= 33.0`
*   `CH-81`: `checkins_guarderia.temperatura_ingreso <= 42.0`
*   `CH-82`: `checkins_guarderia.peso_ingreso > 0.0`
*   `CH-83`: `checkouts_guarderia.temperatura_salida >= 33.0`
*   `CH-84`: `checkouts_guarderia.temperatura_salida <= 42.0`
*   `CH-85`: `checkouts_guarderia.peso_salida > 0.0`
*   `CH-86`: `checkouts_guarderia.recargo_latencia >= 0.0`
*   `CH-87`: `registro_actividades_diarias.tipo_actividad` IN ('alimentacion', 'recreacion', 'medicacion', 'descanso')
*   `CH-88`: `incidentes_guarderia.gravedad` IN ('leve', 'moderada', 'grave')
*   `CH-89`: `cuidadores_estilistas.cargo` IN ('cuidador', 'estilista', 'mixto')
*   `CH-90`: `cuidadores_estilistas.rut` longitud >= 9
*   `CH-91`: `servicios_peluqueria.duracion_estimada_minutos >= 15`
*   `CH-92`: `servicios_peluqueria.duracion_estimada_minutos <= 180`
*   `CH-93`: `citas_peluqueria.fecha_hora` mayor o igual a fecha de creacion
*   `CH-94`: `citas_peluqueria.estado` IN ('programada', 'en_servicio', 'finalizada', 'no_asistio')
*   `CH-95`: `tarifas_servicios.monto >= 0.0`
*   `CH-96`: `salas_guarderia.estado` IN ('libre', 'llena', 'mantenimiento')
*   `CH-97`: `incidentes_guarderia.descripcion` longitud >= 10
*   `CH-98`: `registro_actividades_diarias.comentario` longitud >= 5 o nulo
*   `CH-99`: `checkins_guarderia.peso_ingreso > 0.0`
*   `CH-100`: `reservas_guarderia.costo_total >= 0.0`

---

## 8. Capa de Presentacion e Interfaces (SCR-01 a SCR-30)

La interfaz del cliente SPA cuenta con un Layout unificado en `Layout.tsx` con scrollbar lateral. La aplicacion se organiza dinamicamente en torno al componente `StateWrapper.tsx` que permite alternar los 5 estados interactivos:
1.  **Cargando (`loading`):** Spinner animado de carga de red.
2.  **Sin Datos (`empty`):** Pantalla limpia que ilustra la ausencia de registros con ilustraciones.
3.  **Con Datos (`data`):** La interfaz de negocio activa mostrando formularios, tablas y datos estructurados.
4.  **Error (`error`):** Banner rojo descriptivo del fallo del servidor API (HTTP 500/Connection error).
5.  **Permisos (`permission`):** Bloqueo visual con candado indicando que el rol activo carece de privilegios (HTTP 403).

### Pantallas Desarrolladas:
*   **Modulo Clinico (HCC - SCR-01 a SCR-08):**
    *   *SCR-01 (Registro Propietario):* Creacion de clientes con validacion RUT.
    *   *SCR-02 (Triaje Urgencias):* Clasificacion de constantes de emergencia.
    *   *SCR-03 (Ficha Mascota):* Historial clinico interactivo del paciente.
    *   *SCR-04 (Reserva Quirofanos):* Agenda de cirugias con bloqueos en caliente de 10 min.
    *   *SCR-05 (Monitoreo Hospitalizacion):* Visualizacion en vivo del estado clinico del internado.
    *   *SCR-06 (Consentimiento Quirurgico):* Checkbox para firma autorizada digital.
    *   *SCR-07 (Consentimiento Eutanasia):* Declaracion humanitaria firmada.
    *   *SCR-08 (Modulo Alta Medica):* Cierre de hospitalizacion y liberacion de cupo.
*   **Modulo de Inventario (ILM - SCR-09 a SCR-15):**
    *   *SCR-09 (Catalogo Medicamentos):* Vista general del stock y control de mermas.
    *   *SCR-10 (Ingreso Lotes):* Carga de compras a proveedores con alerta FEFO de vencidos.
    *   *SCR-11 (Kardex Inventario):* Registro historico de entradas y salidas de bodega.
    *   *SCR-12 (Dispensacion Recetas):* Control de recetas retenidas para medicamentos regulados.
    *   *SCR-13 (Alertas Stock Minimo):* Tablero rojo de farmacos criticos.
    *   *SCR-14 (Auditoria Fisica):* Ajustes manuales del balance teorico vs fisico.
    *   *SCR-15 (Salida Mermas):* Registro de descarte por vencimiento.
*   **Modulo Financiero (FAP - SCR-16 a SCR-23):**
    *   *SCR-16 (Apertura Caja):* Inicio de sesion diaria y fondos.
    *   *SCR-17 (Arqueo Ciego):* Cierre ciego obligatorio exigiendo comentarios ante discrepancias.
    *   *SCR-18 (Punto de Venta POS):* Terminal de cobros multimetodo y calculo del 19% de IVA.
    *   *SCR-19 (Historial Facturas):* Lista administrativa de boletas y documentos emitidos.
    *   *SCR-20 (Notas Credito):* Formulario de anulacion autorizado por supervisor.
    *   *SCR-21 (Convenios Seguros):* Asociacion de seguros veterinarios a pacientes.
    *   *SCR-22 (Campanas Descuento):* Promociones limitadas por debajo del 50%.
    *   *SCR-23 (Bitacora Financiera):* Historial consolidado de movimientos de caja.
*   **Modulo Guarderia (GAP - SCR-24 a SCR-30):**
    *   *SCR-24 (Mapa Caniles):* Aforo en tiempo real de las salas del hotel canino.
    *   *SCR-25 (Check-in Guarderia):* Admision con control de vacunas y temperatura.
    *   *SCR-26 (Checklist Equipaje):* Custodia de pertenencias al ingreso de la mascota.
    *   *SCR-27 (Dietas Especiales):* Racionamiento e indicacion de alergias del huesped.
    *   *SCR-28 (Bitacora Actividades):* Linea de tiempo diaria de paseos, comida y medicacion.
    *   *SCR-29 (Agenda Estetica):* Turnos de estilismo con tarifas por tipo de mascota.
    *   *SCR-30 (Gestion Cuidadores):* Asignacion de personal respetando la proporcion de 1 cuidador por cada 8 animales.

---

## 9. CI/CD y AWS Academy Student Lab Environment

La plataforma esta parametrizada para automatizar el ciclo de integracion y despliegue continuo (CI/CD) adaptandose al AWS Academy Student Lab:

1.  **Restricciones de AWS LabRole:** Las credenciales de IAM temporales de Vocareum se almacenan de forma segura como GitHub Actions Secrets e inyectan dinamicamente en el workflow `.github/workflows/deploy.yml`. La IP publica del servidor se detecta en tiempo de ejecucion via `aws ec2 describe-instances`, eliminando dependencias a IPs hardcodeadas que cambian en cada reinicio del laboratorio.
2.  **Sincronizacion SSH:** El workflow `deploy.yml` genera una llave SSH temporal via EC2 Instance Connect (TTL de 60 segundos), sincroniza el codigo con `rsync` hacia el servidor Ubuntu de Staging y ejecuta el reinicio del proceso con `pm2 restart AppServerL5`.
3.  **Seguridad y Privacidad:** El archivo `.gitignore` blindado bloquea la subida de llaves `.pem` y credenciales, protegiendo los accesos en todo momento.
