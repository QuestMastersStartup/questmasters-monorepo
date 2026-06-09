Análisis del Monorepo: Totem Multimedia App
Este documento detalla la estructura, arquitectura, tecnologías, convenciones de nomenclatura, estilos y organización del monorepo "Totem Multimedia App", con el objetivo de servir como contexto completo para reutilizar la estructura funcional y configuraciones del proyecto.

1. Tecnologías Base y Configuración del Monorepo
   El proyecto está estructurado como un Monorepo gestionado por Bun Workspaces y Turborepo.

Gestor de paquetes: Bun (bun@1.3.x)
Gestor de tareas/builds: Turborepo (turbo@^2)
Motor de Node: >=22
Workspaces: Definidos en la raíz del
package.json
mediante "workspaces": ["*"].
Scripts globales:
bun run dev: Lanza el entorno de desarrollo para todos los subproyectos en paralelo.
bun run build: Construye todos los subproyectos gracias a la caché de Turborepo.
Estilos globales (Frontend)
El proyecto usa Ant Design (antd v6.x) como base de UI, complementado con extensiones como @ant-design/icons y @ant-design/plots. El preprocesador de estilos es SASS (
index.scss
,
utils.scss
).

2. Estructura de Directorios
   text
   totem-multimedia-app/
   ├── backend/ # API RESTful (Bun + Elysia)
   ├── frontend/ # Aplicación web interna principal (React + Vite)
   ├── frontend-extranet/ # Portal para clientes (React + Vite)
   ├── postgres/ # Scripts DDL, procedimientos almacenados y configuración de BBDD
   ├── docs/ # Documentación y scripts de poblado o seedeado (roles, permisos)
   ├── package.json # Configuración del monorepo (Bun workspaces)
   └── turbo.json # Configuración del motor Turborepo
3. Arquitectura y Stack por Proyecto
   3.1. Backend (/backend)
   API REST construida para alto rendimiento.

Framework: ElysiaJS (elysia@1.4.x) ejecutándose nativamente sobre Bun.
BBDD: PostgreSQL (acceso vía bun:sqlite adaptado o utilidades directas como stored procedures invocados mediante queries puras en src/core/db).
Autenticación: JWT (jsonwebtoken) y encriptación de contraseñas con Bun.password (bcrypt/argon2).
Otras integraciones: AWS S3 para almacenamiento (src/core/s3.ts), Nodemailer para emails, Swagger/OpenAPI.
Organización Interna (backend/src):

index.ts: Punto de entrada del servidor.
router.ts: Registro global de rutas y middlewares de Elysia.
config.ts: Variables de entorno fuertemente tipadas.
core/: Funcionalidades transversales (db config, seguridad, jwt, funciones de s3, envío de correos, store en memoria).
modules/: Controladores y lógica de negocio, agrupados por esquemas de la base de datos.
core/: Endpoints de usuarios, roles, perfiles.
erp/: Endpoints de proyectos, hitos, facturación.
extranet/: Endpoints para clientes.
production/: Endpoints operativos.
Nomenclatura Backend:

Los archivos que exponen rutas/endpoints se nombran con sufijo .api.ts (ej. auth.api.ts, users.api.ts).
Convención de código en camelCase para variables/funciones.
3.2. Frontend Principal (/frontend)
Aplicación corporativa interna.

Framework UI: React 19 + TypeScript.
Build Tool: Vite (vite@6).
Librería UI: Ant Design (antd).
Manejo de Estado Global: Zustand.
Enrutamiento: React Router DOM v7 (react-router-dom).
Extras: React Quill New, dnd-kit, ExcelJS.
Organización Interna (frontend/src):

Aprovechamiento de alias de Vite (@src, @components, @modules, @core, @providers, etc.) para importaciones limpias.
core/: Utilidades generales (http.ts cliente, tipos de datos genéricos).
providers/: Contextos de React (ej. AuthProvider.tsx).
layouts/: Estructuras de las vistas (ej. login, dashboard principal).
modules/: La lógica se divide por dominios de negocio (ej. segurity, facturacion, portal-cliente).
[modulo]/pages/: Vistas completas de la ruta.
[modulo]/components/: Componentes específicos de ese dominio.
[modulo]/services/: Llamadas HTTP (con authService o similares) exclusivas de ese módulo.
Nomenclatura Frontend:

Páginas principales: [nombre].page.tsx (ej. profile.page.tsx, contratos.page.tsx).
Servicios HTTP: [nombre].service.ts (ej. auth.service.ts, facturacion.service.ts).
Archivos de hooks, componentes genéricos: PascalCase.tsx para componentes (ej., ClientPortalUserPasswordModal.tsx).
Estilos SCSS en index.scss y clases utilitarias en utils.scss.
3.3. Frontend Extranet (/frontend-extranet)
Portal aislado para ser consumido por clientes externos, compartiendo la misma estructura, stack y alias de Vite que el frontend principal, pero mucho más reducido (package.json y vite.config.ts son clones adaptados).

3.4. Base de Datos (/postgres)
La estructura de base de datos dicta fuerte dependencia en Procedimientos Almacenados (Stored Procedures) para la lógica central (especialmente para login).

Esquemas definidos: core, erp, production, extranet. 4. Filosofía y Convenciones para Replicar
Modularidad Orientada a Dominio: Tanto el Backend como el Frontend separan absolutamente todo en carpetas dentro de modules/. Si creas un nuevo recurso "Ventas", este debe tener su contraparte backend/src/modules/ventas (con sus _.api.ts) y frontend/src/modules/ventas (con sus pages, components y services).
Alias Relativos (Frontend): Utilice alias import { algo } from '@src/core/http' obligatoriamente en el lado frontend (Vite Typescript aliases).
Archivos sufijados:
Backend endpoints: _.api.ts.
Frontend vistas de enrutador: _.page.tsx.
Frontend llamadas a red: _.service.ts.
Autenticación centralizada: Ambos frontends envuelven la lógica mediante un auth-provider unificado alojado en providers/ y utilizan clientes HTTP base configurados en core/http.ts para inyectar los tokens automáticamente.
Despliegues y Entornos (Turborepo): Cualquier nuevo script genérico a nivel de raíz (build, dev, lint) se invoca vía el turbo.json. Cada subproyecto expone sus comandos estándar en su propio package.json para que el orquestador turbo los cachee y parelelice.
