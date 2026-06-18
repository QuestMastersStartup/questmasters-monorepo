# Image Crop Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive crop modal to all 3 image upload points (avatar, character portrait, campaign cover) so users can freely reposition and zoom their image before it's processed and uploaded.

**Architecture:** A single reusable `ImageCropModal` component opens after file selection, lets the user drag/zoom using `react-easy-crop`, then calls `onConfirm(blob)` with a WebP-processed Blob at the target resolution. Each page passes its own `aspect` and `outputSize`; the modal is context-agnostic.

**Tech Stack:** React, `react-easy-crop`, HTML5 Canvas API (via `cropImageToWebP` utility), existing `authFetch` + upload services.

## Global Constraints

- Package manager: `bun` — always use `bun add`, never `npm install` or `pnpm add`
- No new test files — canvas processing is not feasible in vitest; verify via TypeScript + manual testing
- Use relative imports matching the existing codebase (no `@/` alias)
- WebP quality: 0.85 (same as existing `resizeImageToWebP`)
- Do not delete `apps/frontend/src/lib/resize-image.ts` — just stop calling it from the 3 pages

---

### Task 1: Install react-easy-crop

**Files:**
- Modify: `apps/frontend/package.json` (via bun)

**Interfaces:**
- Produces: `react-easy-crop` available as `import Cropper from 'react-easy-crop'` and `import type { Area, Point } from 'react-easy-crop'`

- [ ] **Step 1: Install the package**

```bash
cd apps/frontend && bun add react-easy-crop
```

- [ ] **Step 2: Verify it's in package.json**

```bash
grep "react-easy-crop" apps/frontend/package.json
```

Expected output: `"react-easy-crop": "^5.x.x"` (version may vary)

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/package.json apps/frontend/bun.lockb
git commit -m "chore(frontend): add react-easy-crop"
```

---

### Task 2: Create `cropImageToWebP` utility

**Files:**
- Create: `apps/frontend/src/lib/crop-image.ts`

**Interfaces:**
- Consumes: `Area` type from `react-easy-crop` (`{ x: number; y: number; width: number; height: number }`)
- Produces: `cropImageToWebP(imageSrc: string, pixelCrop: Area, outputSize: number, aspect?: number): Promise<Blob>`
  - `imageSrc`: object URL of the original image (from `URL.createObjectURL`)
  - `pixelCrop`: pixel coordinates of the crop area within the original image
  - `outputSize`: width of the output canvas in pixels (height = `Math.round(outputSize / aspect)`)
  - `aspect`: defaults to `1` (square); pass `16/9` for campaign covers

- [ ] **Step 1: Create the file**

```typescript
// apps/frontend/src/lib/crop-image.ts
import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function cropImageToWebP(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number,
  aspect: number = 1,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const outputWidth = outputSize
  const outputHeight = Math.round(outputSize / aspect)
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/webp',
      0.85,
    )
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | grep "crop-image"
```

Expected: no output (no errors in the new file)

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/lib/crop-image.ts
git commit -m "feat(frontend): add cropImageToWebP canvas utility"
```

---

### Task 3: Create `ImageCropModal` component

**Files:**
- Create: `apps/frontend/src/components/features/shared/ImageCropModal.tsx`

**Interfaces:**
- Consumes: `cropImageToWebP` from `../../../lib/crop-image`
- Consumes: `Cropper`, `Area`, `Point` from `react-easy-crop`
- Produces:
```typescript
interface ImageCropModalProps {
  file: File
  aspect: number
  outputSize: number
  cropShape?: 'rect' | 'round'
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}
export function ImageCropModal(props: ImageCropModalProps): JSX.Element
```

- [ ] **Step 1: Create the component**

```tsx
// apps/frontend/src/components/features/shared/ImageCropModal.tsx
import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { cropImageToWebP } from '../../../lib/crop-image'

interface ImageCropModalProps {
  file: File
  aspect: number
  outputSize: number
  cropShape?: 'rect' | 'round'
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

export function ImageCropModal({
  file,
  aspect,
  outputSize,
  cropShape = 'rect',
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState('')
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await cropImageToWebP(imageSrc, croppedAreaPixels, outputSize, aspect)
      onConfirm(blob)
    } catch {
      setError('Error al procesar la imagen. Intenta de nuevo.')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl mx-4">
        <h2 className="text-white font-semibold text-lg">Recortar imagen</h2>

        <div className="relative w-full h-72 bg-black rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/50">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {processing ? 'Procesando...' : 'Confirmar recorte'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | grep -E "ImageCropModal|crop-image"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/features/shared/ImageCropModal.tsx
git commit -m "feat(frontend): add ImageCropModal component with react-easy-crop"
```

---

### Task 4: Integrate crop modal into Profile.tsx (avatar)

**Files:**
- Modify: `apps/frontend/src/pages/Profile.tsx`

**Interfaces:**
- Consumes: `ImageCropModal` from `../components/features/shared/ImageCropModal`
- Modal config: `aspect={1}`, `outputSize={256}`, `cropShape="round"`
- Upload call (unchanged): `authFetch('/api/users/me/avatar', { method: 'POST', body: formData })`

**What changes:**
- Remove `resizeImageToWebP` import (line 4)
- Add `ImageCropModal` import
- Add `cropFile` state: `const [cropFile, setCropFile] = useState<File | null>(null)`
- Replace `handleAvatarUpload` (lines 28–57): instead of processing + uploading, it just calls `setCropFile(file)`
- Extract the upload logic into a new `handleCropConfirm(blob: Blob)` function
- Change file input `onChange` from `handleAvatarUpload` to the new file-select handler
- Add `<ImageCropModal>` in JSX (before the closing `</div>` of the page)

- [ ] **Step 1: Apply changes to Profile.tsx**

Replace lines 1–57 (imports + `handleAvatarUpload`) with:

```tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { authFetch } from '../lib/api';
import { getUser } from '../lib/auth';
import { ImageCropModal } from '../components/features/shared/ImageCropModal';

export default function Profile() {
  const { userProfile, refreshProfile } = useAuth();
  const displayEmail = getUser()?.email ?? '';
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.webp');
      const response = await authFetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload avatar');
      setAvatarUrl(data.avatarUrl);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };
```

- [ ] **Step 2: Update the file input onChange in JSX**

Find line 154 (the hidden file input). Change `onChange={handleAvatarUpload}` to `onChange={handleFileSelect}`:

```tsx
<input 
  type="file" 
  ref={fileInputRef} 
  onChange={handleFileSelect} 
  className="hidden" 
  accept="image/*"
/>
```

- [ ] **Step 3: Add the modal in JSX**

Add before the closing `</div>` of the page component (line 269, just before `)`):

```tsx
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          outputSize={256}
          cropShape="round"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | grep "Profile"
```

Expected: no output

- [ ] **Step 5: Manual test**

Start the dev server (`bun run dev` in `apps/frontend`) and go to `/profile`:
1. Click the Upload button (camera icon on the avatar) → file picker opens
2. Select any image → crop modal appears with a circular crop overlay
3. Drag the image to reposition; use the zoom slider
4. Click "Confirmar recorte" → modal shows "Procesando..." briefly → closes → avatar updates
5. Click Upload again → select a file → click "Cancelar" → modal closes, avatar unchanged

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/pages/Profile.tsx
git commit -m "feat(frontend): add crop modal to avatar upload in Profile"
```

---

### Task 5: Integrate crop modal into CreateCharacter.tsx (portrait)

**Files:**
- Modify: `apps/frontend/src/pages/CreateCharacter.tsx`

**Interfaces:**
- Consumes: `ImageCropModal` from `../components/features/shared/ImageCropModal`
- Modal config: `aspect={1}`, `outputSize={400}`, `cropShape="rect"` (default)
- Upload call (unchanged): `uploadCharacterPortrait(blob)` from `../services/characters.api`

**What changes:**
- Remove `resizeImageToWebP` import (line 32)
- Add `ImageCropModal` import
- Add `cropFile` state alongside existing `uploading` state
- Replace `handleFileUpload` (lines 375–390): just set `setCropFile(file)` instead of processing+uploading
- Add `handleCropConfirm` with the resize+upload logic
- File input `onChange` stays `handleFileUpload` (function is renamed internally — or keep same name, just change body)
- Add `<ImageCropModal>` in JSX

- [ ] **Step 1: Replace the resizeImageToWebP import with ImageCropModal**

Line 32 — change:
```tsx
import { resizeImageToWebP } from "../lib/resize-image";
```
to:
```tsx
import { ImageCropModal } from "../components/features/shared/ImageCropModal";
```

- [ ] **Step 2: Add cropFile state**

After line 141 (`const [uploading, setUploading] = useState(false);`), add:
```tsx
const [cropFile,   setCropFile]   = useState<File | null>(null);
```

- [ ] **Step 3: Replace handleFileUpload (lines 375–390)**

Replace the entire `handleFileUpload` function with:

```tsx
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setCropFile(file);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

const handleCropConfirm = async (blob: Blob) => {
  setCropFile(null);
  setUploading(true);
  setError(null);
  try {
    const url = await uploadCharacterPortrait(blob);
    setPortraitUrl(url);
  } catch (err: any) {
    setError(err.message ?? "Error al subir retrato");
  } finally {
    setUploading(false);
  }
};
```

- [ ] **Step 4: Add the modal in JSX**

Find the closing `</div>` of the page's return (the last `</div>` before `)`). Add before it:

```tsx
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          outputSize={400}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | grep "CreateCharacter"
```

Expected: no output

- [ ] **Step 6: Manual test**

Go to Create Character:
1. Click the portrait area (dashed border square) → file picker opens
2. Select an image → crop modal appears with square rect crop overlay
3. Drag and zoom → confirm → portrait thumbnail updates in the form
4. Cancel → portrait unchanged

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/pages/CreateCharacter.tsx
git commit -m "feat(frontend): add crop modal to character portrait upload"
```

---

### Task 6: Integrate crop modal into CreateCampaign.tsx (cover image)

**Files:**
- Modify: `apps/frontend/src/pages/CreateCampaign.tsx`

**Interfaces:**
- Consumes: `ImageCropModal` from `../components/features/shared/ImageCropModal`
- Modal config: `aspect={16 / 9}`, `outputSize={800}` → output canvas is 800×450px
- Upload call (unchanged): `uploadCampaignPortrait(blob)` from `../services/campaigns.api`

**What changes:**
- Remove `resizeImageToWebP` import (line 5)
- Add `ImageCropModal` import
- Add `cropFile` state
- Replace `handleFileUpload` (lines 21–39): just set `setCropFile(file)`
- Add `handleCropConfirm` with upload logic
- Add `<ImageCropModal>` in JSX

- [ ] **Step 1: Replace resizeImageToWebP import with ImageCropModal**

Line 5 — change:
```tsx
import { resizeImageToWebP } from "../lib/resize-image";
```
to:
```tsx
import { ImageCropModal } from "../components/features/shared/ImageCropModal";
```

- [ ] **Step 2: Add cropFile state**

After line 12 (`const [uploading, setUploading] = useState(false);`), add:
```tsx
const [cropFile, setCropFile] = useState<File | null>(null);
```

- [ ] **Step 3: Replace handleFileUpload (lines 21–39)**

Replace the entire `handleFileUpload` function with:

```tsx
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setCropFile(file);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

const handleCropConfirm = async (blob: Blob) => {
  setCropFile(null);
  setUploading(true);
  setError(null);
  try {
    const portraitUrl = await uploadCampaignPortrait(blob);
    setFormData({ ...formData, coverImageUrl: portraitUrl });
  } catch (err: any) {
    setError(err.message || "Error al subir la imagen");
  } finally {
    setUploading(false);
  }
};
```

- [ ] **Step 4: Add the modal in JSX**

Find the last closing `</div>` before the component's closing `}`. Add before it:

```tsx
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={16 / 9}
          outputSize={800}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
```

- [ ] **Step 5: Verify TypeScript compiles — full project check**

```bash
cd apps/frontend && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no output (zero errors across the project)

- [ ] **Step 6: Manual test**

Go to Create Campaign:
1. Click the image area or upload button → file picker opens
2. Select a landscape image → crop modal appears with 16:9 wide crop overlay
3. Drag and zoom → confirm → cover image preview updates in the form
4. Cancel → cover image unchanged

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/pages/CreateCampaign.tsx
git commit -m "feat(frontend): add crop modal to campaign cover upload"
```
