# Guía de Desarrollo - QuestMasters

Esta guía explica cómo ejecutar el proyecto en diferentes modalidades.

## Requisitos Previos

- [Bun](https://bun.sh/) instalado.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) corriendo.

## Modos de Ejecución

### 1. Modo Híbrido (Recomendado para Desarrollo)
Ejecuta la base de datos en Docker y la API/Frontend localmente con Bun. Esto permite recarga rápida (hot-reload) y depuración más sencilla.

**Comando rápido:**
```bash
bun run dev:local
```

**Pasos manuales:**
1. Levantar solo la base de datos:
   ```bash
   bun run db:up
   ```
2. Iniciar el entorno de desarrollo (API + Frontend):
   ```bash
   bun dev
   ```

### 2. Modo Full Docker
Ejecuta todo el stack (DB + API) dentro de contenedores. Útil para probar el despliegue final.

```bash
docker compose up
```

## Comandos Útiles de Base de Datos

- `bun run db:up`: Inicia la base de datos en segundo plano.
- `bun run db:down`: Detiene la base de datos.
- `bun run db:logs`: Muestra los logs de la base de datos.

## Visualización de Datos (pgAdmin)

He añadido **pgAdmin** para que puedas ver y modificar los datos de la base de datos fácilmente desde tu navegador.

1.  Asegúrate de que los contenedores estén corriendo (`bun run db:up`).
2.  Abre [http://localhost:5050](http://localhost:5050) en tu navegador.
3.  **Credenciales de acceso a pgAdmin:**
    *   **Email:** `admin@questmasters.local`
    *   **Password:** `admin`
4.  **Configurar la conexión al servidor de la DB:**
    *   Click derecho en "Servers" -> "Register" -> "Server...".
    *   **General**: Nombre (ej. `QuestMasters Local`).
    *   **Connection**:
        *   **Host**: `postgres` (si estás dentro de Docker) o `127.0.0.1` (si conectas desde tu máquina).
        *   **Port**: `5432` (si usas el host `postgres`) o `5433` (si usas `127.0.0.1`).
        *   **Maintenance database**: `questmasters_local`.
        *   **Username**: `admin`.
        *   **Password**: `password123`.
