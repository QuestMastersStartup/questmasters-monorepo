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
