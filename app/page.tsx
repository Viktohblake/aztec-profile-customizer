"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, RotateCcw, Upload } from "lucide-react"
import { StickerLibrary } from "@/components/sticker-library"
import { PhotoCanvas } from "@/components/photo-canvas"

export interface Sticker {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export default function ProfileCustomizer() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleStickerAdd = useCallback((stickerSrc: string, x?: number, y?: number) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      src: stickerSrc,
      x: x ?? 100,
      y: y ?? 100,
      width: 80,
      height: 80,
      rotation: 0,
    }
    setStickers((prev) => [...prev, newSticker])
  }, [])

  const handleStickerUpdate = useCallback((id: string, updates: Partial<Sticker>) => {
    setStickers((prev) => prev.map((sticker) => (sticker.id === id ? { ...sticker, ...updates } : sticker)))
  }, [])

  const handleStickerDelete = useCallback((id: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id))
  }, [])

  const handleReset = useCallback(() => {
    setUploadedImage(null)
    setStickers([])
  }, [])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "customized-profile-pic.png"
    link.href = canvas.toDataURL()
    link.click()
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 py-8">
        <div className="text-center mb-12 max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex flex-col sm:flex-row items-center justify-center">
            <img 
    src="/logo.png" 
    alt="Aztec Logo" 
    className="w-15 h-10 object-contain mb-5"
  /> 
          <p className="text-5xl font-bold text-foreground mb-4 drop-shadow-sm">Aztec Profile Customizer</p>

          </h1>
          <p className="text-xl text-muted-foreground mb-6 drop-shadow-sm">
            Want to rep the Aztec privacy movement on your socials? You are in the right place.
          </p>

          <div className="bg-white/30 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
            <p className="text-lg text-foreground mb-4 leading-relaxed">
              This page gives you everything you need to update your profile and claim your place in the community. Tell
              the world you stand with privacy and helping build it with Aztec Network.
            </p>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Follow the steps below to customize your profile and show the world you are part of the Aztec community.
              Using the Aztec avatar generator to give your profile picture a custom Aztec Network twist, featuring hats, glasses,
              chains, masks and juice cup, more stickers will be added soon. It's a playful way to show you are part of something
              bigger.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/30 rounded-lg p-4 border border-white/50">
                <div className="text-2xl font-bold text-primary mb-2">1</div>
                <p className="text-sm text-foreground font-medium">Upload your existing profile photo</p>
              </div>
              <div className="bg-white/30 rounded-lg p-4 border border-white/50">
                <div className="text-2xl font-bold text-primary mb-2">2</div>
                <p className="text-sm text-foreground font-medium">Select the stickers and adjust to your taste</p>
              </div>
              <div className="bg-white/30 rounded-lg p-4 border border-white/50">
                <div className="text-2xl font-bold text-primary mb-2">3</div>
                <p className="text-sm text-foreground font-medium">Click download</p>
              </div>
              <div className="bg-white/30 rounded-lg p-4 border border-white/50">
                <div className="text-2xl font-bold text-primary mb-2">4</div>
                <p className="text-sm text-foreground font-medium">Instantly receive your customized Aztec PFP</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 max-w-none mx-auto">
            {/* Center Panel - Photo Canvas */}
            <div className="lg:col-span-7 order-1 lg:order-1">
              <Card className="p-4 sm:p-6 bg-white/30 backdrop-blur-md border-white/30 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleUploadClick}
                      variant="outline"
                      className="flex items-center gap-2 bg-white/30 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors border-white/40"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </Button>
                    <h2 className="text-xl font-semibold text-foreground">Your Canvas</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="flex items-center gap-2 bg-white/30 backdrop-blur-sm hover:bg-secondary hover:text-secondary-foreground transition-colors border-white/40"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleDownload}
                      disabled={!uploadedImage}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="w-full overflow-hidden">
                  <PhotoCanvas
                    ref={canvasRef}
                    uploadedImage={uploadedImage}
                    stickers={stickers}
                    onStickerUpdate={handleStickerUpdate}
                    onStickerDelete={handleStickerDelete}
                    onStickerAdd={handleStickerAdd}
                  />
                </div>
              </Card>
            </div>

            {/* Right Panel - Sticker Library */}
            <div className="lg:col-span-5 order-2 lg:order-2">
              <Card className="p-4 sm:p-6 bg-white/30 backdrop-blur-md border-white/30 shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Aztec Stickers</h2>
                <StickerLibrary onStickerSelect={handleStickerAdd} />
              </Card>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground/80">Made with ❤️ by @viktohblake</p>
          </div>
        </div>
      </div>
    </div>
  )
}
