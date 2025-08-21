"use client"

import type React from "react"

interface StickerLibraryProps {
  onStickerSelect: (stickerSrc: string) => void
}

const stickers = [
  "/aztec-chain.png",
  "/feather-hat.png",
  "/hat1.png",
  "/hat2.png",
  "/lasar-goose-right.png",
  "/cup-right.png",
  "/cup-left.png",
  "/eyeglass.png",
  "/facemask.png",
  "/facemask2.png",
  "/lasar-goose-left.png",
  "/goose-glass.png",
  "/goose-chain.png"
]

export function StickerLibrary({ onStickerSelect }: StickerLibraryProps) {
  const handleDragStart = (e: React.DragEvent, sticker: string) => {
    e.dataTransfer.setData("text/plain", sticker)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto" style={{ height: "608px" }}>
        {stickers.map((sticker, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, sticker)}
            onClick={() => onStickerSelect(sticker)}
            className="
              aspect-square p-3 rounded-lg border border-border
              hover:border-primary hover:bg-primary/5
              transition-colors flex items-center justify-center
              text-2xl bg-card cursor-grab active:cursor-grabbing
            "
          >
            <img
              src={sticker || "/placeholder.svg"}
              alt={`Sticker ${index + 1}`}
              className="w-full h-full object-contain pointer-events-none"
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
