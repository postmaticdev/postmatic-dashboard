"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  X,
  Move,
  Paintbrush,
  Eraser,
  Undo,
  Redo,
  Send,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "../../../../../../components/ui/textarea";
import { useContentGenerate } from "@/contexts/content-generate-context";
import { showToast } from "@/helper/show-toast";
import { helperService } from "@/services/helper.api";
import { useTranslations } from "next-intl";
import { ValidRatio } from "@/models/api/content/image.type";
import { cn } from "@/lib/utils";

interface FullscreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tool = "pan" | "brush-add" | "brush-remove";

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface Point {
  x: number;
  y: number;
}

export function FullscreenImageModal({
  isOpen,
  onClose,
}: FullscreenImageModalProps) {
  const { theme } = useTheme();
  const { selectedHistory, onSubmitGenerate, form, isLoading, setIsLoading, aiModels, onSelectAiModel } =
    useContentGenerate();
  const t = useTranslations();

  const m = useTranslations("modal");

  // Force GPT Image 1 model when modal opens (mask feature only supports this model)
  useEffect(() => {
    if (isOpen && aiModels.models.length > 0) {
      const gptModel = aiModels.models.find(model => model.name === "gpt-image-1");
      if (gptModel && form.basic.model !== "gpt-image-1") {
        onSelectAiModel(gptModel);
        
        // Ensure ratio is valid for GPT Image 1
        const validRatiosForGPT = ["1:1", "2:3", "3:2"];
        if (!validRatiosForGPT.includes(form.basic.ratio)) {
          form.setBasic({ ...form.basic, ratio: "1:1" as ValidRatio, model: "gpt-image-1" });
        }
      }
    }
  }, [isOpen, aiModels.models, form.basic.model, form.basic.ratio, onSelectAiModel, form]);

  // Extract the first image URL for stable reference
  const firstImageUrl = selectedHistory?.result?.images?.[0];
  
  // Memoize the image URL to prevent unnecessary re-initialization
  const imageUrl = useMemo(() => {
    return firstImageUrl || "";
  }, [firstImageUrl]);

  // Track previous image URL to prevent unnecessary canvas re-initialization
  const prevImageUrlRef = useRef<string>("");
  
  // Cleanup function to reset state when modal closes
  const resetModalState = useCallback(() => {
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
    setImageSize({ width: 0, height: 0 });
    setCanvasSizeCSS({ width: 0, height: 0 });
    setHistory([]);
    setHistoryIndex(-1);
    setActiveTool("pan");
    setBrushSize(20);
    setIsDragging(false);
    setIsDrawing(false);
    setLastPoint(null);
    setShowBrushPreview(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
    imageRef.current = null;
    prevImageUrlRef.current = "";
  }, []);

  // tools & ui
  const [activeTool, setActiveTool] = useState<Tool>("pan");
  const [brushSize, setBrushSize] = useState(20);
  const [showBrushSizeTooltip, setShowBrushSizeTooltip] = useState(false);

  // canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null); // tampilan
  const maskCanvasRef = useRef<HTMLCanvasElement>(null); // mask (koordinat gambar)
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // transform & sizes
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [minZoom, setMinZoom] = useState(0.5); // Allow zoom out more
  const [maxZoom, setMaxZoom] = useState(3);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [canvasSizeCSS, setCanvasSizeCSS] = useState({ width: 0, height: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // interactions
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [showBrushPreview, setShowBrushPreview] = useState(false);
  
  // touch gestures
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<Point | null>(null);

  // history (mask)
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /** Promise helper untuk canvas.toBlob */
  function canvasToBlob(
    canvas: HTMLCanvasElement,
    type = "image/png",
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        },
        type,
        quality
      );
    });
  }

  /** Make OpenAI mask:
   *  - background: opaque white (#fff, alpha=255)
   *  - painted area (maskCanvas channel R > 0): transparent (alpha=0)
   */
  function createOpenAIBinaryWhiteMask(): HTMLCanvasElement | null {
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;
    if (!maskCanvas || !img) return null;

    const out = document.createElement("canvas");
    out.width = img.naturalWidth;
    out.height = img.naturalHeight;
    const octx = out.getContext("2d");
    const mctx = maskCanvas.getContext("2d");
    if (!octx || !mctx) return null;

    // Fill putih penuh
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, out.width, out.height);

    // Ambil data mask (pakai channel merah)
    const maskData = mctx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );
    const md = maskData.data;

    // ImageData final untuk mask putih/transparent
    const maskOut = octx.getImageData(0, 0, out.width, out.height);
    const od = maskOut.data;

    // Binary: jika md[i] (R) > 0 => transparan; selain itu tetap putih opaque
    for (let i = 0; i < md.length; i += 4) {
      const painted = md[i] > 0; // R channel
      // Set warna putih
      od[i] = 255; // R
      od[i + 1] = 255; // G
      od[i + 2] = 255; // B
      // Alpha 0 jika digambar (area untuk diedit), 255 selainnya (dipertahankan)
      od[i + 3] = painted ? 0 : 255;
    }

    octx.putImageData(maskOut, 0, 0);
    return out;
  }

  function createTransparentImageFromMask(): string | null {
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;
    if (!maskCanvas || !img) return null;

    const out = document.createElement("canvas");
    out.width = img.naturalWidth;
    out.height = img.naturalHeight;
    const octx = out.getContext("2d");
    const mctx = maskCanvas.getContext("2d");
    if (!octx || !mctx) return null;

    // Gambar foto asli
    octx.drawImage(img, 0, 0);

    // Ambil mask & buat area bertopeng jadi transparan
    const maskData = mctx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );
    const imageData = octx.getImageData(0, 0, out.width, out.height);
    const md = maskData.data;
    const id = imageData.data;

    for (let i = 0; i < md.length; i += 4) {
      const a = md[i] / 255; // R sebagai alpha mask
      if (a > 0) id[i + 3] = Math.round(id[i + 3] * (1 - a));
    }

    octx.putImageData(imageData, 0, 0);
    return out.toDataURL("image/png", 1.0);
  }

  // ---------- geometry helpers ----------
  const calculateFitTransform = useCallback(
    (imgW: number, imgH: number, canW: number, canH: number) => {
      if (!imgW || !imgH || !canW || !canH)
        return { scale: 1, offsetX: 0, offsetY: 0 };
      const scale = Math.min(canW / imgW, canH / imgH);
      return { scale, offsetX: 0, offsetY: 0 };
    },
    []
  );

  const clampOffset = useCallback(
    (ox: number, oy: number, scale: number) => {
      // Allow free movement when zoomed out
      if (scale <= minZoom) return { offsetX: 0, offsetY: 0 };

      const scaledW = imageSize.width * scale;
      const scaledH = imageSize.height * scale;
      const maxOX = Math.max(0, (scaledW - canvasSizeCSS.width) / 2);
      const maxOY = Math.max(0, (scaledH - canvasSizeCSS.height) / 2);
      return {
        offsetX: Math.max(-maxOX, Math.min(maxOX, ox)),
        offsetY: Math.max(-maxOY, Math.min(maxOY, oy)),
      };
    },
    [minZoom, imageSize, canvasSizeCSS]
  );

  const getMousePosition = useCallback(
    (e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      let clientX = 0,
        clientY = 0;
      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? 0;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    []
  );

  // Konversi titik di layar (CSS px, pusat canvas) ke koordinat gambar (px gambar asli)
  const screenToImage = useCallback(
    (screenX: number, screenY: number): Point => {
      const canW = canvasSizeCSS.width;
      const canH = canvasSizeCSS.height;

      const centerX = canW / 2;
      const centerY = canH / 2;

      // pos relatif ke center kanvas (CSS px)
      const relX = screenX - centerX - transform.offsetX;
      const relY = screenY - centerY - transform.offsetY;

      // skala balik ke koordinat gambar
      const imgX = relX / transform.scale + imageSize.width / 2;
      const imgY = relY / transform.scale + imageSize.height / 2;

      return { x: imgX, y: imgY };
    },
    [canvasSizeCSS, transform, imageSize]
  );

  const getEffectiveBrushSize = useCallback(
    () => Math.max(1, brushSize / transform.scale),
    [brushSize, transform.scale]
  );

  const isPointInImageBounds = useCallback(
    (p: Point, r = 0) =>
      p.x >= -r &&
      p.x <= imageSize.width + r &&
      p.y >= -r &&
      p.y <= imageSize.height + r,
    [imageSize]
  );

  const clampPointToImageBounds = useCallback(
    (p: Point, r = 0) => ({
      x: Math.max(-r, Math.min(imageSize.width + r, p.x)),
      y: Math.max(-r, Math.min(imageSize.height + r, p.y)),
    }),
    [imageSize]
  );

  // Touch gesture helpers
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: React.TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: touches[0].clientX - rect.left,
        y: touches[0].clientY - rect.top,
      };
    }
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: x - rect.left,
      y: y - rect.top,
    };
  }, []);

  // ---------- init & resize ----------
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !maskCanvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // CSS size
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // internal pixels with DPR
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // skala 1 CSS px = dpr device px
      }
      setCanvasSizeCSS({ width: w, height: h });
    };

    // Always update canvas size when modal opens
    updateCanvasSize();

    // Load image when modal opens and imageUrl is available
    if (imageUrl && imageUrl !== prevImageUrlRef.current) {
      prevImageUrlRef.current = imageUrl;
      
      // Clear previous image
      imageRef.current = null;
      
      // load image
      const img = new globalThis.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Double check the image URL hasn't changed during loading
        if (img.src === imageUrl) {
          imageRef.current = img;
          setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

          // maskCanvas dalam KOORDINAT GAMBAR (tanpa DPR)
          maskCanvas.width = img.naturalWidth;
          maskCanvas.height = img.naturalHeight;

          // Get current canvas size for fit calculation
          const currentRect = container.getBoundingClientRect();
          const currentCanvasSize = { width: currentRect.width, height: currentRect.height };

          // fit & default zoom - start with proper fit size
          const fit = calculateFitTransform(
            img.naturalWidth,
            img.naturalHeight,
            currentCanvasSize.width,
            currentCanvasSize.height
          );
          setMinZoom(fit.scale * 0.3); // Allow zoom out to 30% of fit size
          setMaxZoom(fit.scale * 3); // Allow zoom in to 300% of fit size
          setTransform({ scale: fit.scale, offsetX: 0, offsetY: 0 }); // Start at fit size (not 0.8)

          // reset mask/hist
          const mctx = maskCanvas.getContext("2d");
          if (mctx) {
            mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            // Save initial empty state to history
            const initialData = mctx.getImageData(
              0,
              0,
              maskCanvas.width,
              maskCanvas.height
            );
            setHistory([initialData]);
            setHistoryIndex(0);
          } else {
            setHistory([]);
            setHistoryIndex(-1);
          }
        }
      };
      img.onerror = () => {
        console.error("Failed to load image:", imageUrl);
        // Reset on error
        imageRef.current = null;
        setImageSize({ width: 0, height: 0 });
      };
      img.src = imageUrl;
    }

    const onResize = () => updateCanvasSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [
    isOpen,
    dpr,
    calculateFitTransform,
    imageUrl,
  ]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  // ---------- render loop ----------
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !maskCanvas || !img) return;

    const ctx = canvas.getContext("2d");
    const mctx = maskCanvas.getContext("2d");
    if (!ctx || !mctx) return;

    const canW = canvasSizeCSS.width;
    const canH = canvasSizeCSS.height;

    ctx.clearRect(0, 0, canW, canH);

    const scaledW = imageSize.width * transform.scale;
    const scaledH = imageSize.height * transform.scale;
    const x = (canW - scaledW) / 2 + transform.offsetX;
    const y = (canH - scaledH) / 2 + transform.offsetY;

    // gambar foto
    ctx.drawImage(img, x, y, scaledW, scaledH);

    // gambar overlay dari mask: buat imageData berwarna biru semi transparan
    const maskImageData = mctx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = maskCanvas.width;
    tmpCanvas.height = maskCanvas.height;
    const tctx = tmpCanvas.getContext("2d");
    if (tctx) {
      const overlay = tctx.createImageData(tmpCanvas.width, tmpCanvas.height);
      const md = maskImageData.data;
      const od = overlay.data;

      const r = 0,
        g = 128,
        b = 255,
        overlayAlpha = 0.4;

      // gunakan channel merah sebagai mask (alpha)
      for (let i = 0; i < md.length; i += 4) {
        const a = md[i] / 255; // merah → alpha
        od[i] = r;
        od[i + 1] = g;
        od[i + 2] = b;
        od[i + 3] = Math.round(a * overlayAlpha * 255);
      }
      tctx.putImageData(overlay, 0, 0);

      // transform sama persis dengan gambar
      ctx.drawImage(tmpCanvas, x, y, scaledW, scaledH);
    }
  }, [canvasSizeCSS, imageSize, transform]);

  useEffect(() => {
    if (!isOpen) return;
    let id = 0;
    const loop = () => {
      render();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isOpen, render]);

  // ---------- actions ----------
  const handleZoom = useCallback(
    (deltaY: number, clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const zoomPoint = {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      };

      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        minZoom,
        Math.min(maxZoom, transform.scale * zoomFactor)
      );
      if (newScale === transform.scale) return;

      const ratio = newScale / transform.scale;
      const newOX = transform.offsetX * ratio + zoomPoint.x * (1 - ratio);
      const newOY = transform.offsetY * ratio + zoomPoint.y * (1 - ratio);
      const clamped = clampOffset(newOX, newOY, newScale);

      setTransform({
        scale: newScale,
        offsetX: clamped.offsetX,
        offsetY: clamped.offsetY,
      });
    },
    [transform, minZoom, maxZoom, clampOffset]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY, e.clientX, e.clientY);
    },
    [handleZoom]
  );

  // save mask to history
  const saveToHistory = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Create new history array from current position
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(data);

    // Limit history to 20 items
    if (newHist.length > 20) {
      newHist.shift();
    } else {
      // Only increment index if we're not at the limit
      setHistoryIndex((prev) => prev + 1);
    }

    setHistory(newHist);
  }, [history, historyIndex]);

  // mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (activeTool === "pan") {
        if (transform.scale > minZoom) {
          setIsDragging(true);
          const pos = getMousePosition(e);
          setDragStart({
            x: pos.x - transform.offsetX,
            y: pos.y - transform.offsetY,
          });
        }
        return;
      }

      setIsDrawing(true);
      const pos = getMousePosition(e);
      const pImg = screenToImage(pos.x, pos.y);
      setLastPoint(pImg);

      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const mctx = maskCanvas.getContext("2d");
      if (!mctx) return;

      const eff = getEffectiveBrushSize();
      const r = eff / 2;

      if (isPointInImageBounds(pImg, r)) {
        const P = clampPointToImageBounds(pImg, r);
        if (activeTool === "brush-add") {
          mctx.globalCompositeOperation = "source-over";
          mctx.fillStyle = "rgba(255,0,0,1)"; // pakai merah sebagai mask
        } else {
          mctx.globalCompositeOperation = "destination-out";
          mctx.fillStyle = "rgba(0,0,0,1)";
        }
        mctx.beginPath();
        mctx.arc(P.x, P.y, r, 0, Math.PI * 2);
        mctx.fill();
      }
    },
    [
      activeTool,
      transform,
      minZoom,
      getMousePosition,
      screenToImage,
      getEffectiveBrushSize,
      isPointInImageBounds,
      clampPointToImageBounds,
    ]
  );

  // click panning (nudging)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== "pan" || transform.scale <= minZoom) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const mouse = getMousePosition(e);
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const newOX = transform.offsetX + (mouse.x - cx) * 0.5;
      const newOY = transform.offsetY + (mouse.y - cy) * 0.5;
      const clamped = clampOffset(newOX, newOY, transform.scale);
      setTransform((p) => ({
        ...p,
        offsetX: clamped.offsetX,
        offsetY: clamped.offsetY,
      }));
    },
    [activeTool, transform, minZoom, getMousePosition, clampOffset]
  );

  // mouse move (drag/pensil)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && activeTool === "pan") {
        const pos = getMousePosition(e);
        const newOX = pos.x - dragStart.x;
        const newOY = pos.y - dragStart.y;
        const clamped = clampOffset(newOX, newOY, transform.scale);
        setTransform((p) => ({
          ...p,
          offsetX: clamped.offsetX,
          offsetY: clamped.offsetY,
        }));
        return;
      }

      if (isDrawing && lastPoint) {
        const pos = getMousePosition(e);
        const pImg = screenToImage(pos.x, pos.y);

        const maskCanvas = maskCanvasRef.current;
        if (!maskCanvas) return;
        const mctx = maskCanvas.getContext("2d");
        if (!mctx) return;

        const eff = getEffectiveBrushSize();
        const r = eff / 2;

        if (isPointInImageBounds(pImg, r)) {
          const A = clampPointToImageBounds(lastPoint, r);
          const B = clampPointToImageBounds(pImg, r);

          if (activeTool === "brush-add") {
            mctx.globalCompositeOperation = "source-over";
            mctx.strokeStyle = "rgba(255,0,0,1)";
          } else {
            mctx.globalCompositeOperation = "destination-out";
            mctx.strokeStyle = "rgba(0,0,0,1)";
          }
          mctx.lineWidth = eff;
          mctx.lineCap = "round";
          mctx.lineJoin = "round";
          mctx.beginPath();
          mctx.moveTo(A.x, A.y);
          mctx.lineTo(B.x, B.y);
          mctx.stroke();
        }
        setLastPoint(pImg);
      }
    },
    [
      isDragging,
      activeTool,
      getMousePosition,
      dragStart,
      clampOffset,
      transform.scale,
      isDrawing,
      lastPoint,
      screenToImage,
      getEffectiveBrushSize,
      isPointInImageBounds,
      clampPointToImageBounds,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing) saveToHistory();
    setIsDragging(false);
    setIsDrawing(false);
    setLastPoint(null);
  }, [isDrawing, saveToHistory]);

  // Handle mouse move for brush preview
  const handleMouseMovePreview = useCallback(
    (e: React.MouseEvent) => {
      const pos = getMousePosition(e);
      setMousePosition(pos);

      // Show brush preview only for brush tools
      if (activeTool === "brush-add" || activeTool === "brush-remove") {
        setShowBrushPreview(true);
      } else {
        setShowBrushPreview(false);
      }
    },
    [activeTool, getMousePosition]
  );

  // Handle mouse leave to hide brush preview
  const handleMouseLeave = useCallback(() => {
    setShowBrushPreview(false);
  }, []);

  // touch
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touches = e.touches;
      
      if (touches.length === 1) {
        const t = touches[0];
        // Update mouse position for brush preview
        const pos = getMousePosition({
          clientX: t.clientX,
          clientY: t.clientY,
        } as unknown as React.MouseEvent);
        setMousePosition(pos);

        // Show brush preview for brush tools
        if (activeTool === "brush-add" || activeTool === "brush-remove") {
          setShowBrushPreview(true);
        }

        handleMouseDown({
          clientX: t.clientX,
          clientY: t.clientY,
        } as unknown as React.MouseEvent);
      } else if (touches.length === 2) {
        // Start pinch gesture
        const distance = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        setLastTouchDistance(distance);
        setLastTouchCenter(center);
        setShowBrushPreview(false);
      }
    },
    [handleMouseDown, getMousePosition, activeTool, getTouchDistance, getTouchCenter]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touches = e.touches;
      
      if (touches.length === 1) {
        const t = touches[0];
        // Update mouse position for brush preview
        const pos = getMousePosition({
          clientX: t.clientX,
          clientY: t.clientY,
        } as unknown as React.MouseEvent);
        setMousePosition(pos);

        handleMouseMove({
          clientX: t.clientX,
          clientY: t.clientY,
        } as unknown as MouseEvent);
      } else if (touches.length === 2 && lastTouchDistance && lastTouchCenter) {
        // Handle pinch-to-zoom
        const distance = getTouchDistance(touches);
        const center = getTouchCenter(touches);
        
        if (distance > 0 && lastTouchDistance > 0) {
          const scaleChange = distance / lastTouchDistance;
          const newScale = Math.max(
            minZoom,
            Math.min(maxZoom, transform.scale * scaleChange)
          );
          
          if (newScale !== transform.scale) {
            const canvas = canvasRef.current;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const zoomPoint = {
                x: center.x - rect.width / 2,
                y: center.y - rect.height / 2,
              };
              
              const ratio = newScale / transform.scale;
              const newOX = transform.offsetX * ratio + zoomPoint.x * (1 - ratio);
              const newOY = transform.offsetY * ratio + zoomPoint.y * (1 - ratio);
              const clamped = clampOffset(newOX, newOY, newScale);
              
              setTransform({
                scale: newScale,
                offsetX: clamped.offsetX,
                offsetY: clamped.offsetY,
              });
            }
          }
        }
        
        setLastTouchDistance(distance);
        setLastTouchCenter(center);
      }
    },
    [handleMouseMove, getMousePosition, lastTouchDistance, lastTouchCenter, getTouchDistance, getTouchCenter, minZoom, maxZoom, transform, clampOffset]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setShowBrushPreview(false);
      setLastTouchDistance(null);
      setLastTouchCenter(null);
      handleMouseUp();
    },
    [handleMouseUp]
  );

  // dbl click zoom
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey || e.shiftKey) {
        const fit = calculateFitTransform(
          imageSize.width,
          imageSize.height,
          canvasSizeCSS.width,
          canvasSizeCSS.height
        );
        setTransform(fit);
      } else {
        // Zoom to fit or zoom in
        const fit = calculateFitTransform(
          imageSize.width,
          imageSize.height,
          canvasSizeCSS.width,
          canvasSizeCSS.height
        );
        if (Math.abs(transform.scale - fit.scale) < 0.1) {
          // If already at fit size, zoom in
          handleZoom(-100, e.clientX, e.clientY);
        } else {
          // Zoom to fit
          setTransform(fit);
        }
      }
    },
    [calculateFitTransform, imageSize, canvasSizeCSS, handleZoom, transform.scale]
  );

  // events bind/unbind
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => handleWheel(e);
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    const onTMove = (e: TouchEvent) =>
      handleTouchMove(e as unknown as React.TouchEvent);
    const onTEnd = (e: TouchEvent) =>
      handleTouchEnd(e as unknown as React.TouchEvent);

    canvas.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchmove", onTMove, { passive: false });
    canvas.addEventListener("touchend", onTEnd);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchmove", onTMove);
      canvas.removeEventListener("touchend", onTEnd);
    };
  }, [
    isOpen,
    handleWheel,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // undo/redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const ctx = maskCanvas.getContext("2d");
        if (ctx) {
          // Restore previous state
          const data = history[newIndex];
          if (data) ctx.putImageData(data, 0, 0);
        }
      }
      setHistoryIndex(newIndex);
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const data = history[newIndex];
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas && data) {
        const ctx = maskCanvas.getContext("2d");
        if (ctx) ctx.putImageData(data, 0, 0);
      }
      setHistoryIndex(newIndex);
    }
  };

  // download (gambar + overlay)
  const handleDownload = useCallback(() => {
    const dataUrl = createTransparentImageFromMask();
    if (!dataUrl) {
     
      showToast("error", t("toast.content.fileCreationFailed"));
      return;
    }
    const link = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    link.download = `transparent-${
      selectedHistory?.result?.images[0] ?? "image"
    }-${ts}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedHistory?.result?.images]);

  // send comment
  const handleSend = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      // 1) Buat MASK untuk OpenAI (putih penuh, area diubah transparan)
      const maskCanvas = createOpenAIBinaryWhiteMask();
      if (!maskCanvas) throw new Error(t("toast.content.openAIMaskFailed"));

      // 2) Convert ke Blob → File
      const maskBlob = await canvasToBlob(maskCanvas, "image/png", 1.0);
      const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });

      // 3) Upload -> dapatkan URL
      const uploadMaskUrl = await helperService.uploadSingleImage({
        image: maskFile,
      });

      // 4) (opsional) update state agar UI lain bisa tahu, tapi JANGAN mengandalkan ini untuk submit
      form.setMask(uploadMaskUrl);

      // 5) Langsung submit dengan override; jangan menunggu state tersinkron
      onSubmitGenerate({ mode: "mask", maskUrl: uploadMaskUrl });

      onClose();
    } catch (err) {
      console.error(err);
      showToast("error", t("toast.content.maskSendFailed"));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  if (!isOpen) return null;

  const getCursor = () => {
    if (activeTool === "pan")
      return isDragging ? "cursor-grabbing" : "cursor-grab";
    if (activeTool === "brush-add") return "cursor-crosshair";
    if (activeTool === "brush-remove") return "cursor-crosshair";
    return "cursor-default";
  };

  // Get slider theme class
  const getSliderClass = () => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    return isDark ? "slider-white" : "slider-dark";
  };

  if (!selectedHistory || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center space-x-3">
          <Image
            src="/logoblue.png"
            alt="Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="touch-manipulation h-10 w-10"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="touch-manipulation h-10 w-10"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            variant="ghost"
            size="icon"
            className="touch-manipulation h-10 w-10"
            onClick={handleDownload}
            aria-label="Download highlighted image"
            title="Download highlighted image"
          >
            <Download className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            variant="ghost"
            size="icon"
            className="touch-manipulation h-10 w-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Floating Tool Panel - Desktop */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
        <div className="flex flex-col space-y-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border border-border">
          <Button
            variant={activeTool === "pan" ? "default" : "ghost"}
            size="icon"
            className={`h-12 w-12 ${
              activeTool === "pan"
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : ""
            }`}
            onClick={() => setActiveTool("pan")}
            aria-label="Pan tool"
          >
            <Move className="h-5 w-5" />
          </Button>

          <Button
            variant={activeTool === "brush-add" ? "default" : "ghost"}
            size="icon"
            className={`h-12 w-12 ${
              activeTool === "brush-add"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : ""
            }`}
            onClick={() => setActiveTool("brush-add")}
            aria-label="Brush add tool"
          >
            <Paintbrush className="h-5 w-5" />
          </Button>

          <Button
            variant={activeTool === "brush-remove" ? "default" : "ghost"}
            size="icon"
            className={`h-12 w-12 ${
              activeTool === "brush-remove"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : ""
            }`}
            onClick={() => setActiveTool("brush-remove")}
            aria-label="Brush remove tool"
          >
            <Eraser className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Brush Size Panel - Right */}
      {(activeTool === "brush-add" || activeTool === "brush-remove") && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-32 flex items-center relative">
                <Slider
                  value={[brushSize]}
                  onValueChange={(v: number[]) => setBrushSize(v[0])}
                  onPointerDown={() => setShowBrushSizeTooltip(true)}
                  onPointerUp={() => setShowBrushSizeTooltip(false)}
                  onPointerLeave={() => setShowBrushSizeTooltip(false)}
                  min={1}
                  max={50}
                  step={1}
                  className={`${getSliderClass()} slider-vertical`}
                  aria-label="Brush size"
                  orientation="vertical"
                />
                {showBrushSizeTooltip && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                    {Math.round(brushSize)}px
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className={`flex-1 relative overflow-hidden ${getCursor()}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMovePreview}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {/* maskCanvas tidak terlihat & tidak menerima event */}
        <canvas
          ref={maskCanvasRef}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />

        {/* Brush Preview Overlay */}
        {showBrushPreview &&
          (activeTool === "brush-add" || activeTool === "brush-remove") && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: mousePosition.x - brushSize / 2,
                top: mousePosition.y - brushSize / 2,
                width: brushSize,
                height: brushSize,
              }}
            >
              <div
                className={`w-full h-full rounded-full border-2 ${
                  activeTool === "brush-add"
                    ? "border-green-500 bg-green-500/20"
                    : "border-red-500 bg-red-500/20"
                }`}
              />
            </div>
          )}
      </div>

      {/* Mobile Tool Panel */}
      <div className="md:hidden p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex justify-center space-x-3">
          <Button
            variant={activeTool === "pan" ? "default" : "ghost"}
            size="icon"
            className={`h-12 w-12 touch-manipulation ${
              activeTool === "pan"
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : ""
            }`}
            onClick={() => setActiveTool("pan")}
            aria-label="Pan tool"
          >
            <Move className="h-5 w-5" />
          </Button>
          <Button
            variant={activeTool === "brush-add" ? "default" : "ghost"}
            size="icon"
            className={`h-12 w-12 touch-manipulation ${
              activeTool === "brush-add"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : ""
            }`}
            onClick={() => setActiveTool("brush-add")}
            aria-label="Brush add tool"
          >
            <Paintbrush className="h-5 w-5" />
          </Button>
          <Button
            variant={activeTool === "brush-remove" ? "default" : "ghost"}
            size="icon"
            className={`h-12 w-12 touch-manipulation ${
              activeTool === "brush-remove"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : ""
            }`}
            onClick={() => setActiveTool("brush-remove")}
            aria-label="Brush remove tool"
          >
            <Eraser className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer input */}
      <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* AI Model and Ratio Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            {/* AI Model */}
            <div>
              <label className="block text-xs font-medium mb-1.5">AI Model</label>
              <select
                className={cn(
                  "w-full p-2 rounded-md text-sm border border-input bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-not-allowed opacity-60",
                  isLoading
                )}
                disabled={true}
                value="gpt-image-1"
              >
                <option value="gpt-image-1">GPT Image 1</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Saat ini fitur mask hanya ada di model GPT Image 1
              </p>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-medium mb-1.5">{t("generationPanel.aspectRatio")}</label>
              <select
                className={cn(
                  "w-full p-2 rounded-md text-sm border border-input bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
                  isLoading
                )}
                disabled={isLoading}
                value={form?.basic?.ratio || ""}
                onChange={(e) => {
                  form.setBasic({ ...form.basic, ratio: e.target.value as ValidRatio });
                }}
              >
                {/* Only show valid ratios for GPT Image 1 */}
                {["1:1", "2:3", "3:2"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt and Send Button */}
          <div className="relative flex flex-row gap-2 items-center">
            <Textarea
              value={form?.basic?.prompt || ""}
              onChange={(e) =>
                form.setBasic({ ...form.basic, prompt: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className=""
              placeholder={m("addCommentOrInstruction")}
              aria-label="Comment input"
            />
            <Button
              className="h-16 w-16 p-0 bg-blue-500 hover:bg-blue-600 touch-manipulation"
              onClick={handleSend}
              disabled={!(form?.basic?.prompt?.trim() || "") || isLoading}
              aria-label="Send comment"
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Send className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
