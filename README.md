# VetGuard L5 — Sistema de Gestión Veterinaria

VetGuard es una plataforma empresarial integral diseñada para la automatización y administración física de clínicas veterinarias a gran escala, cubriendo flujos críticos clínicos, financieros, de inventario de medicamentos y de hotelería para mascotas.

El software está construido bajo el estándar de madurez académica **L5** utilizando TypeScript, React, Express y una base de datos relacional PostgreSQL robusta con validaciones a nivel físico y lógico.

---

## Estructura General del Proyecto

*   **`/docs/`**: Carpeta unificada que contiene la documentación técnica y de ingeniería.
*   **`/src/`**: Código fuente de la aplicación (SPA Frontend en React y API REST Backend en Express).
*   **`/database/`**: Carpeta de migraciones y esquemas de la base de datos relacional.
*   **`/tests/`**: Suite de pruebas unitarias y de integración de reglas de negocio en Jest.
*   **`/reports/`**: JSONs de reportes operativos internos.

---

## Documentación de Ingeniería y Procesos

A continuación se listan los documentos técnicos y manuales del proyecto ubicados en la carpeta [/docs/](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/docs/):

1.  **[Especificaciones Técnicas e Ingeniería](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/docs/spec.md)**: Detalle arquitectónico de las capas del sistema, diagramas conceptuales de entidad-relación, casos de uso del personal y validaciones check.
2.  **[Checklist de Completitud del Producto](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/docs/checklist_completitud.md)**: Matriz formal que certifica la completitud de los 45 endpoints funcionales, las 44 tablas de la base de datos y la bifurcación visual por roles de las 30+ pantallas del frontend.
3.  **[Informe de Justificación Metodológica](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/docs/informe_justificacion.md)**: Reporte cuantitativo y de análisis de ingeniería sobre la eficiencia temporal de desarrollo, consistencia de datos y seguridad de accesos por roles.
4.  **[Plan de Tareas de Implementación](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/docs/tasks.md)**: Listado estructurado y ledger de control de cada tarea de desarrollo ejecutada durante la fase física del proyecto.
5.  **[Aclaraciones Técnicas y de Diseño](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/docs/clarifications.md)**: Registro histórico de decisiones técnicas, aclaraciones con el equipo de control de calidad y alineación de alcances.

---

## Instrucciones de Inicialización Local

### Requisitos Previos:
- **Node.js** v18 o superior instalado.
- **PostgreSQL** corriendo localmente en el puerto `5433` con base de datos `veterinaria_sdd` (Credenciales por defecto: `postgres` / `postgres`).

### Pasos para Ejecutar:

1.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

2.  **Inicializar Esquemas y Sembrar la Base de Datos:**
    El sistema cuenta con un seeder e inicializador relacional automatizado que ejecutará el script DDL consolidado [schema_completo.sql](file:///C:/Users/fbisa/Documents/Protecto%20final%20Spec%203/Fabrica%20FULL%20TRES/Fabrica%20FULL%20TRES/project/veterinaria_sdd/database/migrations/schema_completo.sql) y sembrará la información de prueba:
    ```bash
    npx ts-node src/database/persistence.ts
    ```

3.  **Levantar Servidores de Desarrollo (Frontend + Backend):**
    ```bash
    npm run dev
    ```

4.  **Ejecutar la Suite de Pruebas Unitarias (Jest):**
    ```bash
    npm test
    ```

---

## Inicialización Rápida con Docker

Para mayor facilidad de despliegue en local y staging, el proyecto incluye un entorno preconfigurado en contenedores que levanta tanto la base de datos PostgreSQL como la aplicación web en un solo comando.

### Requisitos:
- **Docker** y **Docker Compose** instalados.

### Pasos para levantar:

1.  **Ejecutar el stack de contenedores:**
    ```bash
    docker-compose up --build -d
    ```
    *Esto construirá la imagen del contenedor de la aplicación `veterinaria-app` (compilando backend y frontend de forma aislada) y creará la base de datos PostgreSQL `veterinaria-db` expuesta en el puerto `5433`.*

2.  **Verificar estado:**
    Una vez inicializados los contenedores, puedes acceder de forma directa:
    - **Aplicación Web:** `http://localhost:3000` (el puerto del servidor unificado).
    - **Healthcheck:** `http://localhost:3000/health`.

3.  **Detener el stack:**
    ```bash
    docker-compose down
    ```

---

## Estado de Despliegue en la Nube

*   **Instancia AWS EC2:** El pipeline de CI/CD, configuración SSH en la nube y scripts de despliegue automatizados (`deploy_ec2.sh`) están parametrizados en el repositorio, quedando en estado **Pendiente** de verificación final de red y asignación de direcciones elásticas.
