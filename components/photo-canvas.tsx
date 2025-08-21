"use client"

import type React from "react"

import { forwardRef, useEffect, useRef, useState, useCallback } from "react"
import { Trash2, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Sticker } from "@/app/page"

interface PhotoCanvasProps {
  uploadedImage: string | null
  stickers: Sticker[]
  onStickerUpdate: (id: string, updates: Partial<Sticker>) => void
  onStickerDelete: (id: string) => void
  onStickerAdd: (stickerSrc: string, x: number, y: number) => void
}

export const PhotoCanvas = forwardRef<HTMLCanvasElement, PhotoCanvasProps>(
  ({ uploadedImage, stickers, onStickerUpdate, onStickerDelete, onStickerAdd }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [selectedSticker, setSelectedSticker] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [resizeHandle, setResizeHandle] = useState<string | null>(null)

    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Combine refs
    useEffect(() => {
      if (typeof ref === "function") {
        ref(canvasRef.current)
      } else if (ref) {
        ref.current = canvasRef.current
      }
    }, [ref])

    const redrawCanvas = useCallback(async () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const fixedSize = 600
      canvas.width = fixedSize
      canvas.height = fixedSize

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Draw background image
      if (uploadedImage) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const scale = Math.min(fixedSize / img.naturalWidth, fixedSize / img.naturalHeight)
          const scaledWidth = img.naturalWidth * scale
          const scaledHeight = img.naturalHeight * scale

          const offsetX = (fixedSize - scaledWidth) / 2
          const offsetY = (fixedSize - scaledHeight) / 2

          // Draw image with high quality scaling
          ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

          // Draw stickers
          stickers.forEach(async (sticker) => {
            if (sticker.src.startsWith("http") || sticker.src.startsWith("/")) {
              const stickerImg = new Image()
              stickerImg.crossOrigin = "anonymous"
              stickerImg.onload = () => {
                ctx.save()
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = "high"
                ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2)
                ctx.rotate((sticker.rotation * Math.PI) / 180)
                ctx.drawImage(stickerImg, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height)
                ctx.restore()
              }
              stickerImg.src = sticker.src
            } else {
              // Handle emoji stickers
              ctx.save()
              ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2)
              ctx.rotate((sticker.rotation * Math.PI) / 180)
              ctx.font = `${sticker.height}px Arial`
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(sticker.src, 0, 0)
              ctx.restore()
            }
          })
        }
        img.src = uploadedImage
      } else {
        ctx.fillStyle = "#f8fafc"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw placeholder
        ctx.fillStyle = "#94a3b8"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Upload a photo to get started", canvas.width / 2, canvas.height / 2)
      }
    }, [uploadedImage, stickers])

    useEffect(() => {
      redrawCanvas()
    }, [redrawCanvas])

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        const stickerSrc = e.dataTransfer.getData("text/plain")
        if (!stickerSrc) return

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left - 25 // Center the sticker
        const y = e.clientY - rect.top - 25

        onStickerAdd(stickerSrc, x, y)
      },
      [onStickerAdd],
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    }, [])

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement

        // Check if clicking on a resize handle
        if (target.classList.contains("resize-handle")) {
          const handle = target.dataset.handle
          if (handle) {
            setIsResizing(true)
            setResizeHandle(handle)
            e.stopPropagation()
            return
          }
        }

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Check if clicking on a sticker
        const clickedSticker = stickers
          .slice()
          .reverse()
          .find(
            (sticker) =>
              x >= sticker.x && x <= sticker.x + sticker.width && y >= sticker.y && y <= sticker.y + sticker.height,
          )

        if (clickedSticker) {
          setSelectedSticker(clickedSticker.id)
          setIsDragging(true)
          setDragStart({ x: x - clickedSticker.x, y: y - clickedSticker.y })
        } else {
          setSelectedSticker(null)
        }
      },
      [stickers],
    )

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        if (isResizing && selectedSticker && resizeHandle) {
          const sticker = stickers.find((s) => s.id === selectedSticker)
          if (!sticker) return

          let newWidth = sticker.width
          let newHeight = sticker.height
          let newX = sticker.x
          let newY = sticker.y

          switch (resizeHandle) {
            case "nw":
              newWidth = sticker.x + sticker.width - mouseX
              newHeight = sticker.y + sticker.height - mouseY
              newX = mouseX
              newY = mouseY
              break
            case "n":
              newHeight = sticker.y + sticker.height - mouseY
              newY = mouseY
              break
            case "ne":
              newWidth = mouseX - sticker.x
              newHeight = sticker.y + sticker.height - mouseY
              newY = mouseY
              break
            case "e":
              newWidth = mouseX - sticker.x
              break
            case "se":
              newWidth = mouseX - sticker.x
              newHeight = mouseY - sticker.y
              break
            case "s":
              newHeight = mouseY - sticker.y
              break
            case "sw":
              newWidth = sticker.x + sticker.width - mouseX
              newHeight = mouseY - sticker.y
              newX = mouseX
              break
            case "w":
              newWidth = sticker.x + sticker.width - mouseX
              newX = mouseX
              break
          }

          // Minimum size constraints
          if (newWidth < 20) newWidth = 20
          if (newHeight < 20) newHeight = 20

          onStickerUpdate(selectedSticker, {
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
          })
        } else if (isDragging && selectedSticker) {
          const x = mouseX - dragStart.x
          const y = mouseY - dragStart.y
          onStickerUpdate(selectedSticker, { x, y })
        }
      },
      [isDragging, isResizing, selectedSticker, dragStart, resizeHandle, stickers, onStickerUpdate],
    )

    const handleMouseUp = useCallback(() => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
    }, [])

    const handleRotateSticker = useCallback(() => {
      if (!selectedSticker) return
      const sticker = stickers.find((s) => s.id === selectedSticker)
      if (sticker) {
        onStickerUpdate(selectedSticker, { rotation: (sticker.rotation + 45) % 360 })
      }
    }, [selectedSticker, stickers, onStickerUpdate])

    const handleDeleteSticker = useCallback(() => {
      if (!selectedSticker) return
      onStickerDelete(selectedSticker)
      setSelectedSticker(null)
    }, [selectedSticker, onStickerDelete])

    return (
      <div className="space-y-4">
        <div className="w-full overflow-hidden px-2">
          <div
            ref={containerRef}
            className="relative bg-muted rounded-lg overflow-hidden mx-auto"
            style={{
              width: "min(600px, calc(100vw - 2rem))",
              height: "min(600px, calc(100vw - 2rem))",
              maxWidth: "100%",
              aspectRatio: "1/1",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

            {/* Sticker overlays for interaction */}
            {stickers.map((sticker) => (
              <div key={sticker.id}>
                <div
                  className={`
                    absolute border-2 cursor-move
                    ${
                      selectedSticker === sticker.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-primary/50"
                    }
                  `}
                  style={{
                    left: sticker.x,
                    top: sticker.y,
                    width: sticker.width,
                    height: sticker.height,
                    transform: `rotate(${sticker.rotation}deg)`,
                  }}
                />

                {selectedSticker === sticker.id && (
                  <>
                    {/* Corner handles */}
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-nw-resize"
                      data-handle="nw"
                      style={{
                        left: sticker.x - 6,
                        top: sticker.y - 6,
                      }}
                    />
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-ne-resize"
                      data-handle="ne"
                      style={{
                        left: sticker.x + sticker.width - 6,
                        top: sticker.y - 6,
                      }}
                    />
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-se-resize"
                      data-handle="se"
                      style={{
                        left: sticker.x + sticker.width - 6,
                        top: sticker.y + sticker.height - 6,
                      }}
                    />
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-sw-resize"
                      data-handle="sw"
                      style={{
                        left: sticker.x - 6,
                        top: sticker.y + sticker.height - 6,
                      }}
                    />

                    {/* Edge handles */}
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-n-resize"
                      data-handle="n"
                      style={{
                        left: sticker.x + sticker.width / 2 - 6,
                        top: sticker.y - 6,
                      }}
                    />
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-e-resize"
                      data-handle="e"
                      style={{
                        left: sticker.x + sticker.width - 6,
                        top: sticker.y + sticker.height / 2 - 6,
                      }}
                    />
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-s-resize"
                      data-handle="s"
                      style={{
                        left: sticker.x + sticker.width / 2 - 6,
                        top: sticker.y + sticker.height - 6,
                      }}
                    />
                    <div
                      className="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-w-resize"
                      data-handle="w"
                      style={{
                        left: sticker.x - 6,
                        top: sticker.y + sticker.height / 2 - 6,
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sticker Controls */}
        {selectedSticker && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotateSticker}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCw className="w-4 h-4" />
              Rotate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSticker}
              className="flex items-center gap-2 text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
    )
  },
)

PhotoCanvas.displayName = "PhotoCanvas"
