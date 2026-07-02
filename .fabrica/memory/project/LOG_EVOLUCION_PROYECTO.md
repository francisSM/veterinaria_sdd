# 📝 Log de Evolución del Proyecto — Veterinaria SDD

Este archivo actúa como la bitácora histórica y el registro de gobernanza para la evolución del desarrollo del proyecto `veterinaria_sdd`.

---

## 📍 Estado y Fase del Proyecto

*   **Fase Actual:** `refinamiento_completado` / Sistema funcional con roles separados, auditoría de caja, bitácoras por fecha, selector de catálogos y esquema de base de datos unificado.
*   **Estado de Salud de la Fábrica:** Nivel de madurez verificado **L5** — TypeScript 0 errores, backend corriendo en PostgreSQL, tests aprobados.
*   **Tests TypeScript:** `npx tsc --noEmit` → 0 errores.
*   **Próximo paso:** Despliegue en instancia AWS EC2 y tunelización en producción.

---

## 📊 Ledger de Control Operativo e Ingesta de Costos

| Fecha      | Fase SDD                    | Descripción                                                                                                                                                                                                                                                                                                                                                                        | Estado     |
| :-----------| :----------------------------| :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| :-----------|
| 2026-06-29 | `intake`                    | Ingesta de requerimientos y brief del sistema veterinario.                                                                                                                                                                                                                                                                                                                         | `complete` |
| 2026-06-29 | `specify` & `plan`          | Especificación de 40 tablas, 40 endpoints, 30 pantallas, 60 BR, 100 CH.                                                                                                                                                                                                                                                                                                            | `complete` |
| 2026-06-29 | `implement` (M1-HCC)        | Backend clínico: propietarios, pacientes, triajes, consultas, cirugías, hospitalizaciones, recetas.                                                                                                                                                                                                                                                                                | `complete` |
| 2026-06-29 | `implement` (M2-ILM)        | Backend inventario: medicamentos, lotes, proveedores, despachos FEFO, alertas.                                                                                                                                                                                                                                                                                                     | `complete` |
| 2026-06-29 | `implement` (M3-FAP)        | Backend finanzas: cajas, comprobantes, pagos, arqueo ciego, notas crédito.                                                                                                                                                                                                                                                                                                         | `complete` |
| 2026-06-29 | `implement` (M4-GAP)        | Backend servicios: caniles, reservas guardería, agenda estética, actividades.                                                                                                                                                                                                                                                                                                      | `complete` |
| 2026-06-29 | `implement` (M5-Frontend)   | Frontend React/TSX: Layout, StateWrapper, pantallas SCR-01 a SCR-30.                                                                                                                                                                                                                                                                                                               | `complete` |
| 2026-06-29 | `implement` (M6-Auth)       | Sistema de autenticación JWT, roles `administrador`/`veterinario`/`cliente`.                                                                                                                                                                                                                                                                                                       | `complete` |
| 2026-06-29 | `implement` (M7-DB)         | PostgreSQL persistence layer, migrations 001-005, seed data.                                                                                                                                                                                                                                                                                                                       | `complete` |
| 2026-06-29 | `test`                      | Suite Jest `suite.test.ts`: bloqueo pesimista, FEFO, arqueo ciego, aforo, HTTP 403.                                                                                                                                                                                                                                                                                                | `complete` |
| 2026-06-30 | `refinement` (R1)           | Fix TypeError en `FichaMascota.tsx` (filtro sobre null). Corrección BuscadorClientePaciente. Rutas API unificadas de `hcc`→`clinica`, `ilm`→`inventario`, `fap`→`finanzas`, `gap`→`servicios`.                                                                                                                                                                                     | `complete` |
| 2026-06-30 | `refinement` (R2)           | Sistema de aforo hotel separado: hospitalización clínica vs. guardería canino/felino. Validación de especie (`tipoEspecie`) en caniles a nivel DDL + backend + frontend.                                                                                                                                                                                                           | `complete` |
| 2026-06-30 | `refinement` (R3)           | Agenda Estética: filtrado de servicios por especie, horarios basados en horas de atención, bloqueo de disponibilidad según duración + margen.                                                                                                                                                                                                                                      | `complete` |
| 2026-06-30 | `refinement` (R4)           | `MapaCaniles.tsx`: reescritura con UI dual — admisión/traslado/alta (hospitalización) y nueva reserva/aforo (guardería). Validación especie activa.                                                                                                                                                                                                                                | `complete` |
| 2026-06-30 | `data`                      | Seed expandido: 7 propietarios, 12 pacientes, 4 hospitalizaciones activas, 3 caniles tipificados, 4 reservas guardería, 4 citas. Reset DB utility (`reset_db.ts`).                                                                                                                                                                                                                 | `complete` |
| 2026-06-30 | `migration`                 | Nueva migración delta `006_add_tipo_especie_caniles.sql` para agregar `tipo_especie` a BD existente.                                                                                                                                                                                                                                                                               | `complete` |
| 2026-07-01 | `refinement` (R5-Roles)     | **Separación completa de roles Admin/Vet/Cliente:**<br>• `Layout.tsx`: menú estrictamente por rol, sin ítems compartidos.<br>• `api.ts`: endpoints clínicos de escritura → solo `veterinario`; HCE → `veterinario`+`cliente` (admin excluido).<br>• `MapaCaniles.tsx`: vet gestiona hospitalizaciones, admin gestiona guardería.<br>• Vet accede a Caja con auditoría de operador. | `complete` |
| 2026-07-01 | `refinement` (R6-Auditoria) | **Auditoría de caja para veterinario:**<br>• Modelo `ComprobantesFiscales` añade `operadorId`+`operadorRol`.<br>• `BitacoraTransacciones` añade campos opcionales de auditoría.<br>• `crearComprobante` y `emitirNotaCredito` capturan operador desde JWT.<br>• Si `operadorRol === 'veterinario'`, se genera entrada `[AUDITORÍA]` en bitácora automáticamente.                   | `complete` |
| 2026-07-01 | `refinement` (R7-POS)       | **Descuentos Selectivos y Auditorías por Fecha (L5):**<br>• Catálogos interactivos con multiselección de conceptos en Convenios de Seguro y Campañas de Descuento.<br>• Cálculo selectivo de promociones y seguros por ítem en POS.<br>• Filtro histórico de fecha interactivo en Bitácoras Financiera e Inventario.                                                                | `complete` |
| 2026-07-01 | `refinement` (R8-Agenda)    | **Agenda Diaria del Personal:**<br>• Agenda Diaria del Personal (Vets y Cuidadores) integrada y dinámica en `BitacoraActividades.tsx` y `AgendaCitas.tsx`. Agrupa actividades por fecha consultando base de datos PostgreSQL.                                                                                                                                                      | `complete` |
| 2026-07-01 | `consolidation` (C2-DB)     | **Consolidación SQL 3 → 1 archivo:**<br>• Unificación de todas las tablas en un único archivo consolidado `schema_completo.sql` y eliminación de DDLs redundantes.<br>• `persistence.ts` actualizado para leer solo el esquema unificado.                                                                                                                                           | `complete` |
| 2026-07-01 | `refinement` (R9-Docker)    | **Contenerización Docker L5:**<br>• Configuración de `Dockerfile` multi-stage que compila React/Vite frontend y backend Node/Express.<br>• Creación de `docker-compose.yml` enlazando app con PostgreSQL en puertos `5433` / `5432`. Configuración de PG_CONFIG por variables de entorno.<br>• Actualización de documentación de Docker en spec, tasks y readme. | `complete` |
| 2026-07-01 | `docs`                      | Actualización de `tasks.md`, `clarifications.md`, `reports/checklist_completitud.md`, `reports/informe_justificacion.md`, `reports/guion_presentacion.md`, `.fabrica/memory/project/LOG_EVOLUCION_PROYECTO.md`.                                                                                                                                                                    | `complete` |

> [!NOTE]
> La facturación utiliza el esquema comercial simulado basado en el consumo físico de tokens de la fábrica agéntica L5. Costo total estimado del proyecto: ~$11.62 USD.

---

## 🤝 Handoff Técnico — Estado Actual del Sistema

Para garantizar la continuidad operativa, el estado de contexto es el siguiente:

### 1. Arquitectura de Módulos (Nombres definitivos)
| Módulo original | Nombre actual | Prefijo API |
|---|---|---|
| HCC | `clinica` | `/api/v1/clinica/` |
| ILM | `inventario` | `/api/v1/inventario/` |
| FAP | `finanzas` | `/api/v1/finanzas/` |
| GAP | `servicios` | `/api/v1/servicios/` |

### 2. Archivos clave del sistema
*   **Servidor:** `src/app.ts` + rutas unificadas en `src/routes/api.ts`
*   **Controladores:** `src/controllers/clinica.controller.ts`, `inventario.controller.ts`, `finanzas.controller.ts`, `servicios.controller.ts`
*   **Modelos TypeScript:** `src/models/clinica.ts`, `inventario.ts`, `finanzas.ts`, `servicios.ts`
*   **Persistencia:** `src/database/persistence.ts` → apunta a 1 único archivo de esquema
*   **Migraciones SQL:** `database/migrations/schema_completo.sql` (todas las 44 tablas del sistema consolidadas)
*   **Frontend:** `src/frontend/Layout.tsx` (menú por rol), `src/frontend/ClientApp.tsx` (router), `src/frontend/StateWrapper.tsx`

### 3. Roles y accesos definitivos
| Rol | Acceso |
|---|---|
| `veterinario` | Triaje, Consulta, Cirugía, Hospitalización (gestión), Recetas, Dispensación, Farmacia (lectura), Caja (con audit) |
| `administrador` | Dashboard, Recepción, Hotel/Estética, Inventario (edición), Caja completa, Aforo clínico (lectura), Personal |
| `cliente` | Mis Mascotas, Mis Citas, Tarifas, Mis Boletas |

### 4. Credenciales de prueba
*   Admin: `admin@vetguard.com` / `admin123`
*   Vet 1: `vet@vetguard.com` / `vet123`
*   Vet 2: `vet2@vetguard.com` / `vet456`

### 5. Próximo paso inmediato
*   **Despliegue AWS EC2:** Pendiente de configuración final y pruebas de red e instancias en la nube de producción.
