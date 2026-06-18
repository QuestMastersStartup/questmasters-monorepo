# Image Crop Modal — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

## Problem

Every image upload in QuestMasters (user avatar, character portrait, campaign cover) uses `resizeImageToWebP()` which automatically applies a center-crop with no user input. Users have no control over which part of their image is used.

## Solution

Add an interactive crop modal (`ImageCropModal`) that opens after file selection. The user drags to reposition and zooms to control coverage before confirming. The confirmed crop is processed into a WebP Blob (resized to the context's target size) and uploaded normally.

## Approach

**Library:** `react-easy-crop` — handles drag repositioning, pinch/scroll zoom, and mobile touch natively. ~15KB gzip.

**Pattern:** Modal opens on file select → user crops → blob returned → existing upload code runs unchanged.

## Files

### New

| File | Purpose |
|------|---------|
| `apps/frontend/src/components/features/shared/ImageCropModal.tsx` | Reusable crop modal using `react-easy-crop` |
| `apps/frontend/src/lib/crop-image.ts` | `cropImageToWebP(src, pixelCrop, outputSize)` — canvas extraction + WebP conversion |

### Modified

| File | Change |
|------|--------|
| `apps/frontend/src/pages/Profile.tsx` | Replace `resizeImageToWebP` call with modal trigger |
| `apps/frontend/src/pages/CreateCharacter.tsx` | Same |
| `apps/frontend/src/pages/CreateCampaign.tsx` | Same |

`apps/frontend/src/lib/resize-image.ts` is left in place but no longer called from these pages.

## Component API

```ts
interface ImageCropModalProps {
  file: File
  aspect: number
  outputSize: number
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}
```

## Context Configuration

| Context | `aspect` | `outputSize` | Crop shape |
|---------|----------|--------------|------------|
| User avatar | `1` | `256` | Circle overlay |
| Character portrait | `1` | `400` | Rounded rect |
| Campaign cover | `16/9` | `800` | Rounded rect |

## Data Flow

```
<input type="file"> onChange
  → setCropFile(file)          // opens modal

<ImageCropModal> onConfirm(blob)
  → existing upload function   // Profile: uploadAvatar, etc.
  → setCropFile(null)          // closes modal

<ImageCropModal> onCancel
  → setCropFile(null)          // closes modal, nothing uploaded
```

## `cropImageToWebP` Logic

1. Create `<canvas>` at `outputSize × outputSize` (or `outputSize × outputSize*(9/16)` for 16:9)
2. Draw only the `pixelCrop` area from the source image, scaled to fill the canvas
3. Export as `image/webp` at quality 0.85
4. Return `Blob`

## Modal UX

- Image displayed centered with crop overlay on top
- User drags image to reposition; scroll/pinch to zoom (1x–3x)
- Zoom slider below the crop area for fine control
- Buttons: **Cancelar** / **Confirmar recorte**
- On confirm: brief spinner while canvas processes → `onConfirm(blob)` → modal closes

## Error Handling

- Invalid file types: filtered by `<input accept="image/*">` client-side; backend validates and returns 400 as fallback
- Canvas processing failure (corrupt image): modal shows inline error with retry/cancel option
- File size >5MB: existing backend validation unchanged (returns 413)

## Out of Scope

- Choosing aspect ratio (fixed per context)
- Drag-and-drop file input (separate concern)
- Tests for canvas processing (not feasible in vitest without a browser)
