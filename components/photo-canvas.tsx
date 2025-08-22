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

    const getEventCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }

      let clientX: number, clientY: number

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else if ("changedTouches" in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
      } else {
        clientX = (e as React.MouseEvent).clientX
        clientY = (e as React.MouseEvent).clientY
      }

      const containerWidth = rect.width
      const containerHeight = rect.height
      const canvasSize = 600

      const scaleX = canvasSize / containerWidth
      const scaleY = canvasSize / containerHeight

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    }, [])

    const handlePointerDown = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const target = e.target as HTMLElement

        if (target.classList.contains("resize-handle") || target.closest(".resize-handle")) {
          const handleElement = target.classList.contains("resize-handle") ? target : target.closest(".resize-handle")
          const handle = handleElement?.getAttribute("data-handle")
          if (handle) {
            setIsResizing(true)
            setResizeHandle(handle)
            e.stopPropagation()
            return
          }
        }

        const { x, y } = getEventCoordinates(e)

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
      [stickers, getEventCoordinates],
    )

    const handlePointerMove = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const { x: mouseX, y: mouseY } = getEventCoordinates(e)

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
      [
        isDragging,
        isResizing,
        selectedSticker,
        dragStart,
        resizeHandle,
        stickers,
        onStickerUpdate,
        getEventCoordinates,
      ],
    )

    const handlePointerUp = useCallback(() => {
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
              touchAction: "none", // Prevent default touch behaviors
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

            {/* Sticker overlays for interaction */}
            {stickers.map((sticker) => {
              const containerRect = containerRef.current?.getBoundingClientRect()
              const containerWidth = containerRect?.width || 600
              const containerHeight = containerRect?.height || 600
              const canvasSize = 600

              const scaleX = containerWidth / canvasSize
              const scaleY = containerHeight / canvasSize

              const displayX = sticker.x * scaleX
              const displayY = sticker.y * scaleY
              const displayWidth = sticker.width * scaleX
              const displayHeight = sticker.height * scaleY

              return (
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
                      left: displayX,
                      top: displayY,
                      width: displayWidth,
                      height: displayHeight,
                      transform: `rotate(${sticker.rotation}deg)`,
                    }}
                  />

                  {selectedSticker === sticker.id && (
                    <>
                      {/* Corner handles */}
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nw-resize shadow-lg"
                        data-handle="nw"
                        style={{
                          left: displayX - 8,
                          top: displayY - 8,
                        }}
                      />
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-ne-resize shadow-lg"
                        data-handle="ne"
                        style={{
                          left: displayX + displayWidth - 8,
                          top: displayY - 8,
                        }}
                      />
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-se-resize shadow-lg"
                        data-handle="se"
                        style={{
                          left: displayX + displayWidth - 8,
                          top: displayY + displayHeight - 8,
                        }}
                      />
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-sw-resize shadow-lg"
                        data-handle="sw"
                        style={{
                          left: displayX - 8,
                          top: displayY + displayHeight - 8,
                        }}
                      />

                      {/* Edge handles */}
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-n-resize shadow-lg"
                        data-handle="n"
                        style={{
                          left: displayX + displayWidth / 2 - 8,
                          top: displayY - 8,
                        }}
                      />
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-e-resize shadow-lg"
                        data-handle="e"
                        style={{
                          left: displayX + displayWidth - 8,
                          top: displayY + displayHeight / 2 - 8,
                        }}
                      />
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-s-resize shadow-lg"
                        data-handle="s"
                        style={{
                          left: displayX + displayWidth / 2 - 8,
                          top: displayY + displayHeight - 8,
                        }}
                      />
                      <div
                        className="resize-handle absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-w-resize shadow-lg"
                        data-handle="w"
                        style={{
                          left: displayX - 8,
                          top: displayY + displayHeight / 2 - 8,
                        }}
                      />
                    </>
                  )}
                </div>
              )
            })}
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
