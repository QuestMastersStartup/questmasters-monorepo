# Campaigns EPIC — Feedback & Error Documentation

Este documento recopila el feedback técnico, errores encontrados y mejoras implementadas durante el desarrollo de la EPIC de Campañas (EPIC 3).

## 1. Errores Técnicos y Fixes

### 1.1. Violación de Restricción NOT NULL en Tabla de Unión
- **Error:** `null value in column "campaign_id" of relation "campaign_installed_packs" violates not-null constraint.`
- **Causa:** TypeORM intentaba "huérfanos" (poner a `null` la FK) antes de eliminar los registros de la tabla de unión manual durante la sincronización de la colección `installedPacks`.
- **Solución:** 
  1. Se eliminó el `cascade: true` de la entidad `Campaign`.
  2. Se implementó una sincronización manual en `CampaignTypeormRepository.save`, eliminando la propiedad de la entidad antes del guardado para evitar interferencias del ORM y realizando un `delete` + `insert` atómico.

### 1.2. Problemas con Método DELETE y Cuerpo de Petición
- **Error:** Las peticiones de desinstalación devolvían `400 Bad Request` en ciertos entornos porque el cuerpo (body) no se procesaba correctamente en peticiones `DELETE`.
- **Solución:** Se cambió el endpoint de desinstalación a `POST /api/campaigns/:id/packs/uninstall`.

### 1.3. Atributos de Formularios y Accesibilidad (Autofill & Labels)
- **Feedback:** "A form field element has neither an id nor a name attribute." / "A <label> isn't associated with a form field."
- **Solución:** 
  - Se agregaron los atributos `id` y `name` a todos los inputs, selectores y textareas.
  - Se vincularon correctamente todos los `<label>` con sus inputs correspondientes mediante el atributo `htmlFor` (React) coincidiendo con el `id` del input.
  - Para campos de búsqueda puramente visuales (donde no hay una etiqueta visible), se añadieron etiquetas con la clase `sr-only` para cumplir con los estándares de accesibilidad sin romper el diseño.
- **Archivos actualizados:**
  - `ManagePacksModal.tsx`
  - `UserSearch.tsx`
  - `CreateCampaign.tsx`
  - `EditCampaign.tsx`

### 1.4. Error de Importación de Iconos
- **Error:** `ShieldInfo` no existe en la versión actual de `lucide-react`.
- **Solución:** Se reemplazó por `ShieldCheck`.

## 2. Mejoras de UI/UX e Integración

### 2.1. Gestión de Packs (EPIC 3 - US 3.3)
- **Estado Inicial:** La funcionalidad de asociar packs estaba marcada como completada en el backlog pero no existía en la UI.
- **Acción:** Se creó el componente `ManagePacksModal` permitiendo:
  - Búsqueda en tiempo real.
  - Recomendaciones basadas en el sistema de la campaña.
  - Instalación/Desinstalación con feedback visual de carga.

### 2.2. Diseño "Unified Panel"
- Se aplicó el estándar de diseño premium con `backdrop-blur`, gradientes suaves y animaciones de entrada (`animate-in zoom-in`) para mejorar la percepción de calidad del producto.

## 3. Pendientes y Recomendaciones
- **Auditoría de Accesibilidad:** Realizar un barrido similar en otros módulos (Usuarios, Packs) para asegurar que todos los inputs tengan `id`/`name`.
- **Manejo de Transacciones:** Evaluar el uso de transacciones de base de datos en el repositorio de campañas para asegurar que la eliminación y reinserción de packs sea totalmente atómica en caso de fallos críticos.
