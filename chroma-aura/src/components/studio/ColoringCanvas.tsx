"use client";

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ColoringCanvasRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  download: () => void;
}

interface ColoringCanvasProps {
  tool: "brush" | "bucket" | "eraser";
  color: string;
  brushSize: number;
  imageUrl?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onAction?: () => void;
  isDisabled?: boolean;
}

const ColoringCanvas = forwardRef<ColoringCanvasRef, ColoringCanvasProps>(({
  tool,
  color,
  brushSize,
  imageUrl,
  onAction,
  isDisabled = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-29), currentState]);
    setRedoStack([]);
  }, []);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (history.length <= 1) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      
      setRedoStack(prev => [...prev, current]);
      setHistory(prev => prev.slice(0, -1));
      ctx.putImageData(previous, 0, 0);
    },
    redo: () => {
      if (redoStack.length === 0) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const next = redoStack[redoStack.length - 1];
      setHistory(prev => [...prev, next]);
      setRedoStack(prev => prev.slice(0, -1));
      ctx.putImageData(next, 0, 0);
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
          saveState();
        };
        img.src = imageUrl;
      } else {
        saveState();
      }
    },
    download: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const link = document.createElement("a");
      link.download = `chroma-aura-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }), [history, redoStack, imageUrl, saveState]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions based on parent container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        contextRef.current = ctx;

        // Fill with white background initially
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Load image if provided
        if (imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            saveState(); // Initial state
          };
          img.src = imageUrl;
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Update context when tool/color/brushSize changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === "eraser" ? "white" : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDisabled) return;
    const { x, y } = getCoordinates(e);

    if (tool === "bucket") {
      handleFloodFill(x, y);
      return;
    }

    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    setCursorPos({ x, y });
    
    if (!isDrawing || tool === "bucket") return;
    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    setIsDrawing(false);
    saveState();
    onAction?.();
  };

  // BFS Flood Fill Implementation v3 (Darkness Boundary)
  const handleFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const x = Math.round(startX * dpr);
    const y = Math.round(startY * dpr);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Check if user clicked on a dark boundary already
    const initialPixel = getPixelColor(data, x, y, w);
    const initialBrightness = (initialPixel[0] + initialPixel[1] + initialPixel[2]) / 3;
    if (initialBrightness < 100) return; // Don't fill the lines themselves

    const fillColor = hexToRgb(color);
    const stack: number[] = [y * w + x];
    const visited = new Uint8Array(w * h);
    const filledIndices = new Set<number>();

    // Boundary threshold: anything darker than 110 is considered part of the "line" transition
    // but the BFS will fill anything that's "not dark"
    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const currX = idx % w;
      const currY = Math.floor(idx / w);

      if (currX < 0 || currX >= w || currY < 0 || currY >= h) continue;

      const currColor = getPixelColor(data, currX, currY, w);
      const brightness = (currColor[0] + currColor[1] + currColor[2]) / 3;
      
      // If the pixel is not dark (brightness > threshold), it's part of the fillable area
      // We use a relatively high threshold to capture the soft anti-aliased edges
      if (brightness > 90) {
        setPixelColor(data, currX, currY, w, fillColor);
        filledIndices.add(idx);

        if (currX + 1 < w) stack.push(idx + 1);
        if (currX - 1 >= 0) stack.push(idx - 1);
        if (currY + 1 < h) stack.push(idx + w);
        if (currY - 1 >= 0) stack.push(idx - w);
      }
    }

    // Final "Bleed" pass: expand 1.5px into the DARK pixels to ensure perfect coverage
    const toExpand = Array.from(filledIndices);
    for (const idx of toExpand) {
      const currX = idx % w;
      const currY = Math.floor(idx / w);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nX = currX + dx;
          const nY = currY + dy;
          if (nX < 0 || nX >= w || nY < 0 || nY >= h) continue;
          
          const nIdx = nY * w + nX;
          if (visited[nIdx]) continue;
          
          // Even if it's dark, we bleed 1px into it
          setPixelColor(data, nX, nY, w, fillColor);
          visited[nIdx] = 1;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveState();
    onAction?.();
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const idx = (y * width + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number, color: number[]) => {
    const idx = (y * width + x) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = 255;
  };

  const colorsMatch = (c1: number[], c2: number[], threshold = 0) => {
    // Euclidean distance in RGB space is more accurate for perception
    const dist = Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2)
    );
    return dist <= threshold;
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  return (
    <div className={cn(
      "w-full h-full relative touch-none overflow-hidden rounded-2xl bg-white shadow-2xl",
      showCursor && tool !== "bucket" ? "cursor-none" : "cursor-crosshair"
    )}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseEnter={() => setShowCursor(true)}
        onMouseLeave={() => {
          stopDrawing();
          setShowCursor(false);
        }}
        onTouchStart={(e) => {
          setShowCursor(true);
          startDrawing(e);
        }}
        onTouchMove={draw}
        onTouchEnd={() => {
          stopDrawing();
          setShowCursor(false);
        }}
        className="touch-none"
      />

      {/* Dynamic Brush/Eraser Cursor */}
      {showCursor && tool !== "bucket" && (
        <div 
          className="absolute pointer-events-none rounded-full border border-white mix-blend-difference shadow-sm z-50 transition-transform duration-75 ease-out"
          style={{
            width: `${brushSize}px`,
            height: `${brushSize}px`,
            left: cursorPos.x,
            top: cursorPos.y,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
});

export default ColoringCanvas;
