"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Upload,
  Type,
  ImageIcon,
  Eraser,
  Save,
  Loader2,
  RotateCcw,
  Trash2,
  ChevronDown,
  CheckCircle2,
  PaintBucket,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Clipboard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Overlay {
  type: "text" | "image";
  text?: string;
  font?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  img?: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Stroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

interface ProductImageEditorProps {
  productId: string;
  productName: string;
  existingImages: string[];
  initialImageFile?: File | null;
  onClose: () => void;
  onSaved: () => void;
  onSaveNewFile?: (file: File) => void;
}

const CANVAS_SIZE = 800;
const BG_PRESETS = [
  { color: "#ffffff", label: "Blanco" },
  { color: "#f3f4f6", label: "Gris Claro" },
  { color: "#fafaf9", label: "Stone 50" },
  { color: "#fef3c7", label: "Crema" },
  { color: "#d1fae5", label: "Verde Claro" },
  { color: "#0f172a", label: "Negro" },
];

const FONTS_LIST = [
  "Arial",
  "Georgia",
  "Impact",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Times New Roman",
  "Comic Sans MS",
];

export default function ProductImageEditor({
  productId,
  productName,
  existingImages,
  initialImageFile,
  onClose,
  onSaved,
  onSaveNewFile,
}: ProductImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Editor state
  const [bgColor, setBgColorState] = useState("#ffffff");
  const [baseImage, setBaseImage] = useState<(HTMLImageElement & { renderX: number; renderY: number; renderW: number; renderH: number }) | null>(null);
  const overlaysRef = useRef<Overlay[]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<Overlay | null>(null);
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [brushSize, setBrushSize] = useState(25);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [syncBgBrush, setSyncBgBrush] = useState(true);
  
  // Texto state
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState("Arial");
  const [textColor, setTextColor] = useState("#111827");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textStrikethrough, setTextStrikethrough] = useState(false);

  const [editTextVal, setEditTextVal] = useState("");
  const [editTextFont, setEditTextFont] = useState("Arial");
  const [editTextColor, setEditTextColor] = useState("#111827");
  const [editTextBold, setEditTextBold] = useState(false);
  const [editTextItalic, setEditTextItalic] = useState(false);
  const [editTextUnderline, setEditTextUnderline] = useState(false);
  const [editTextStrikethrough, setEditTextStrikethrough] = useState(false);

  const [openSection, setOpenSection] = useState<string | null>("imagen");

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Drag / resize refs
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activeOverlayRef = useRef<Overlay | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const bgColorRef = useRef(bgColor);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const syncRef = useRef(syncBgBrush);

  useEffect(() => { bgColorRef.current = bgColor; }, [bgColor]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { syncRef.current = syncBgBrush; }, [syncBgBrush]);

  // Sincronizar estado del elemento activo
  useEffect(() => {
    activeOverlayRef.current = activeOverlay;
    if (activeOverlay?.type === "text") {
      setEditTextVal(activeOverlay.text ?? "");
      setEditTextFont(activeOverlay.font ?? "Arial");
      setEditTextColor(activeOverlay.color ?? "#111827");
      setEditTextBold(!!activeOverlay.bold);
      setEditTextItalic(!!activeOverlay.italic);
      setEditTextUnderline(!!activeOverlay.underline);
      setEditTextStrikethrough(!!activeOverlay.strikethrough);
    }
  }, [activeOverlay]);

  // ─── Renderizado ────────────────────────────────────────────────────────────
  const render = useCallback((skipHandles = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColorRef.current;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (baseImage) {
      ctx.drawImage(baseImage, baseImage.renderX, baseImage.renderY, baseImage.renderW, baseImage.renderH);
    }

    for (const stroke of strokesRef.current) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    if (currentStrokeRef.current) {
      const s = currentStrokeRef.current;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    for (const item of overlaysRef.current) {
      ctx.save();
      if (item.type === "text") {
        const fontStyle = `${item.bold ? "bold " : ""}${item.italic ? "italic " : ""}${item.fontSize ?? 36}px ${item.font ?? "Arial"}`;
        ctx.font = fontStyle;
        ctx.fillStyle = item.color ?? "#111827";
        ctx.textBaseline = "top";
        ctx.fillText(item.text ?? "", item.x, item.y);

        const m = ctx.measureText(item.text ?? "");
        const textWidth = m.width;
        const textHeight = item.fontSize ?? 36;
        item.width = textWidth;
        item.height = textHeight;

        // Subrayado
        if (item.underline) {
          ctx.strokeStyle = item.color ?? "#111827";
          ctx.lineWidth = Math.max(2, textHeight / 14);
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + textHeight + 2);
          ctx.lineTo(item.x + textWidth, item.y + textHeight + 2);
          ctx.stroke();
        }

        // Tachado
        if (item.strikethrough) {
          ctx.strokeStyle = item.color ?? "#111827";
          ctx.lineWidth = Math.max(2, textHeight / 14);
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + textHeight / 2);
          ctx.lineTo(item.x + textWidth, item.y + textHeight / 2);
          ctx.stroke();
        }
      } else if (item.type === "image" && item.img) {
        ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
      }

      if (item === activeOverlayRef.current && !skipHandles) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x - 4, item.y - 4, item.width + 8, item.height + 8);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(item.x + item.width - 2, item.y + item.height - 2, 12, 12);
      }
      ctx.restore();
    }
  }, [baseImage]);

  useEffect(() => { render(); }, [render, bgColor, activeOverlay, isBrushMode]);

  // Cargar imagen base
  useEffect(() => {
    if (initialImageFile) {
      loadBaseImage(initialImageFile);
    } else if (existingImages[0]) {
      const img = new Image() as HTMLImageElement & { renderX: number; renderY: number; renderW: number; renderH: number };
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const size = 680;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > h) { h = (h / w) * size; w = size; } else { w = (w / h) * size; h = size; }
        img.renderX = (CANVAS_SIZE - w) / 2;
        img.renderY = (CANVAS_SIZE - h) / 2;
        img.renderW = w;
        img.renderH = h;
        setBaseImage(img);
      };
      img.src = existingImages[0];
    }
  }, [existingImages, initialImageFile]);

  // Pegado desde el Portapapeles (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            loadOverlayImage(file);
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function getCoords(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (clientY - rect.top) * (CANVAS_SIZE / rect.height),
    };
  }

  function isOverHandle(x: number, y: number, item: Overlay) {
    return x >= item.x + item.width - 14 && x <= item.x + item.width + 14 && y >= item.y + item.height - 14 && y <= item.y + item.height + 14;
  }

  function isOverOverlay(x: number, y: number, item: Overlay) {
    return x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(e);

      if (isBrushMode) {
        isDrawingRef.current = true;
        const color = syncRef.current ? bgColorRef.current : brushColorRef.current;
        currentStrokeRef.current = { color, size: brushSizeRef.current, points: [{ x, y }] };
        activeOverlayRef.current = null;
        setActiveOverlay(null);
        render();
        return;
      }

      if (activeOverlayRef.current && isOverHandle(x, y, activeOverlayRef.current)) {
        isResizingRef.current = true;
        return;
      }

      let clicked: Overlay | null = null;
      for (let i = overlaysRef.current.length - 1; i >= 0; i--) {
        if (isOverOverlay(x, y, overlaysRef.current[i])) { clicked = overlaysRef.current[i]; break; }
      }

      if (clicked) {
        activeOverlayRef.current = clicked;
        setActiveOverlay(clicked);
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - clicked.x, y: y - clicked.y };
      } else {
        activeOverlayRef.current = null;
        setActiveOverlay(null);
      }
      render();
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(e);

      if (isDrawingRef.current && currentStrokeRef.current) {
        currentStrokeRef.current.points.push({ x, y });
        render();
        return;
      }

      if (isResizingRef.current && activeOverlayRef.current) {
        const item = activeOverlayRef.current;
        item.width = Math.max(30, x - item.x);
        if (item.type === "image") item.height = Math.max(20, y - item.y);
        else item.fontSize = Math.max(12, Math.max(20, y - item.y));
        render();
        return;
      }

      if (isDraggingRef.current && activeOverlayRef.current) {
        activeOverlayRef.current.x = x - dragOffsetRef.current.x;
        activeOverlayRef.current.y = y - dragOffsetRef.current.y;
        render();
      }
    };

    const onUp = () => {
      if (isDrawingRef.current && currentStrokeRef.current) {
        strokesRef.current.push(currentStrokeRef.current);
        currentStrokeRef.current = null;
        isDrawingRef.current = false;
        render();
      }
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };

    canvas.addEventListener("mousedown", onDown as EventListener);
    canvas.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown as EventListener, { passive: false });
    canvas.addEventListener("touchmove", onMove as EventListener, { passive: false });
    window.addEventListener("touchend", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown as EventListener);
      canvas.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onDown as EventListener);
      canvas.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("touchend", onUp);
    };
  }, [isBrushMode, render]);

  const loadBaseImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image() as HTMLImageElement & { renderX: number; renderY: number; renderW: number; renderH: number };
      img.onload = () => {
        const size = 680;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > h) { h = (h / w) * size; w = size; } else { w = (w / h) * size; h = size; }
        img.renderX = (CANVAS_SIZE - w) / 2;
        img.renderY = (CANVAS_SIZE - h) / 2;
        img.renderW = w;
        img.renderH = h;
        setBaseImage(img);
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const loadOverlayImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const newO: Overlay = {
          type: "image",
          img,
          x: CANVAS_SIZE / 2 - 100,
          y: CANVAS_SIZE / 2 - 100,
          width: 200,
          height: 200 * (img.naturalHeight / img.naturalWidth),
        };
        overlaysRef.current = [...overlaysRef.current, newO];
        activeOverlayRef.current = newO;
        setActiveOverlay(newO);
        render();
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePasteClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        alert("Tu navegador no soporta lectura directa del portapapeles. Usa Ctrl+V.");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], `pasted-${Date.now()}.png`, { type: imgType });
          loadOverlayImage(file);
          return;
        }
      }
      alert("No se encontró ninguna imagen en el portapapeles. Copia una foto y reintenta.");
    } catch (err) {
      alert("Para pegar la imagen, puedes usar el comando rápido Ctrl+V.");
    }
  };

  // ─── Añadir texto ────────────────────────────────────────────────────────────
  const addText = () => {
    if (!textInput.trim()) return;
    const newO: Overlay = {
      type: "text",
      text: textInput,
      font: textFont,
      fontSize: 42,
      color: textColor,
      bold: textBold,
      italic: textItalic,
      underline: textUnderline,
      strikethrough: textStrikethrough,
      x: CANVAS_SIZE / 2 - 100,
      y: CANVAS_SIZE / 2 - 25,
      width: 200,
      height: 42,
    };
    overlaysRef.current = [...overlaysRef.current, newO];
    activeOverlayRef.current = newO;
    setActiveOverlay(newO);
    setTextInput("");
    render();
  };

  // ─── Edición en tiempo real del texto activo ─────────────────────────────────
  const updateActiveText = (field: "text" | "font" | "color", val: string) => {
    const o = activeOverlayRef.current;
    if (!o || o.type !== "text") return;
    if (field === "text") { o.text = val; setEditTextVal(val); }
    if (field === "font") { o.font = val; setEditTextFont(val); }
    if (field === "color") { o.color = val; setEditTextColor(val); }
    render();
  };

  const toggleActiveTextProp = (prop: "bold" | "italic" | "underline" | "strikethrough") => {
    const o = activeOverlayRef.current;
    if (!o || o.type !== "text") return;
    o[prop] = !o[prop];
    if (prop === "bold") setEditTextBold(!!o.bold);
    if (prop === "italic") setEditTextItalic(!!o.italic);
    if (prop === "underline") setEditTextUnderline(!!o.underline);
    if (prop === "strikethrough") setEditTextStrikethrough(!!o.strikethrough);
    render();
  };

  const deleteActiveOverlay = () => {
    if (!activeOverlayRef.current) return;
    overlaysRef.current = overlaysRef.current.filter((o) => o !== activeOverlayRef.current);
    activeOverlayRef.current = null;
    setActiveOverlay(null);
    render();
  };

  const clearAll = () => {
    strokesRef.current = [];
    overlaysRef.current = [];
    activeOverlayRef.current = null;
    setActiveOverlay(null);
    render();
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    setSaveError("");
    setSavedOk(false);

    try {
      render(true);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas vacío"))), "image/jpeg", 0.92);
      });

      if (onSaveNewFile) {
        const editedFile = new File([blob], `editada-${Date.now()}.jpg`, { type: "image/jpeg" });
        onSaveNewFile(editedFile);
        setSavedOk(true);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 800);
        return;
      }

      const filePath = `productos/${Date.now()}-editor-${productId.slice(0, 8)}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("tienda-archivos")
        .upload(filePath, blob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("tienda-archivos").getPublicUrl(filePath);
      const newUrl = urlData.publicUrl;

      const { data: prodData } = await supabase.from("productos").select("imagenes").eq("id", productId).single();
      const currentImages: string[] = Array.isArray(prodData?.imagenes) ? prodData.imagenes : [];
      const updatedImages = [newUrl, ...currentImages];

      const { error: updateErr } = await supabase.from("productos").update({ imagenes: updatedImages }).eq("id", productId);
      if (updateErr) throw updateErr;

      setSavedOk(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error guardando imagen editada:", err);
      setSaveError(err?.message || "Error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const Section = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenSection(openSection === id ? null : id)}
        className="flex w-full items-center justify-between px-4 py-3 bg-stone-50 text-left hover:bg-stone-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          {icon}
          {title}
        </div>
        <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${openSection === id ? "rotate-180" : ""}`} />
      </button>
      {openSection === id && (
        <div className="p-4 space-y-3 bg-white animate-[fadeIn_0.18s_ease-out]">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl animate-[slideInRight_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <ImageIcon className="h-5 w-5" />
              Editor de Imagen & Tipografía
            </h2>
            <p className="mt-0.5 truncate text-xs text-emerald-100 max-w-xs">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Cerrar editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          {/* Canvas */}
          <div className="order-1 md:order-2 relative flex flex-1 flex-col items-center justify-center bg-stone-100 p-3 sm:p-6 shrink-0 md:shrink">
            <div className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl overflow-hidden rounded-2xl shadow-xl" style={{ aspectRatio: "1 / 1" }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="w-full h-full"
                style={{ cursor: isBrushMode ? "crosshair" : "default", touchAction: "none" }}
              />
            </div>

            {/* BARRA DE EDICIÓN DE TEXTO ACTIVO CON FORMATO DE TIPOGRAFÍA */}
            {activeOverlay?.type === "text" && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white p-2.5 shadow-lg max-w-full">
                <input
                  type="text"
                  value={editTextVal}
                  onChange={(e) => updateActiveText("text", e.target.value)}
                  className="w-28 rounded-xl border border-stone-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                  placeholder="Editar texto"
                />
                
                {/* Botones de formato tipográfico */}
                <div className="flex items-center rounded-lg border border-stone-200 p-0.5 bg-stone-50">
                  <button
                    type="button"
                    onClick={() => toggleActiveTextProp("bold")}
                    className={`p-1 rounded-md transition-colors ${editTextBold ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Negrita"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActiveTextProp("italic")}
                    className={`p-1 rounded-md transition-colors ${editTextItalic ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Cursiva"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActiveTextProp("underline")}
                    className={`p-1 rounded-md transition-colors ${editTextUnderline ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Subrayado"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActiveTextProp("strikethrough")}
                    className={`p-1 rounded-md transition-colors ${editTextStrikethrough ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Tachado"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>
                </div>

                <select
                  value={editTextFont}
                  onChange={(e) => updateActiveText("font", e.target.value)}
                  className="rounded-xl border border-stone-200 px-2 py-1 text-xs outline-none"
                >
                  {FONTS_LIST.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                
                <input
                  type="color"
                  value={editTextColor}
                  onChange={(e) => updateActiveText("color", e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-lg border border-stone-200 p-0"
                  title="Color"
                />
                
                <button
                  type="button"
                  onClick={deleteActiveOverlay}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  title="Eliminar texto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Guardar */}
            <div className="mt-3 mb-2 flex flex-col items-center gap-1.5 w-full max-w-xs">
              {saveError && (
                <p className="text-xs text-red-600 text-center rounded-xl bg-red-50 px-3 py-1.5 w-full">{saveError}</p>
              )}
              {savedOk && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 rounded-xl bg-emerald-50 px-3 py-1.5 w-full justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                  ¡Imagen guardada!
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Imagen en la Tienda
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel de herramientas */}
          <aside className="order-2 md:order-1 flex w-full md:w-80 shrink-0 flex-col border-t md:border-t-0 md:border-r border-stone-200 bg-stone-50 overflow-y-auto">
            <div className="flex flex-1 flex-col gap-3 p-4">

              {/* 1. Pegado desde Portapapeles & Cargar */}
              <Section id="imagen" title="Imagen / Portapapeles" icon={<Upload className="h-4 w-4 text-emerald-600" />}>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors mb-2"
                >
                  <Clipboard className="h-4 w-4" />
                  Pegar de Portapapeles (Ctrl+V)
                </button>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-4 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/30">
                  <Upload className="h-5 w-5 text-stone-400" />
                  <span className="text-xs font-medium text-stone-600">
                    {baseImage ? "Reemplazar imagen base" : "Cargar imagen desde archivos"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && loadBaseImage(e.target.files[0])}
                  />
                </label>
              </Section>

              {/* 2. Color de fondo */}
              <Section id="fondo" title="Color de Fondo" icon={<PaintBucket className="h-4 w-4 text-emerald-600" />}>
                <div className="flex flex-wrap gap-2">
                  {BG_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      title={p.label}
                      onClick={() => {
                        setBgColorState(p.color);
                        bgColorRef.current = p.color;
                        if (syncBgBrush) setBrushColor(p.color);
                        render();
                      }}
                      className={`h-8 w-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${bgColor === p.color ? "border-emerald-500 scale-110" : "border-stone-300"}`}
                      style={{ backgroundColor: p.color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => {
                      setBgColorState(e.target.value);
                      bgColorRef.current = e.target.value;
                      if (syncBgBrush) setBrushColor(e.target.value);
                      render();
                    }}
                    className="h-8 w-8 cursor-pointer rounded-full border-2 border-stone-300 p-0"
                    title="Color personalizado"
                  />
                </div>
              </Section>

              {/* 3. Pincel borrador */}
              <Section id="pincel" title="Pincel / Corrector" icon={<Eraser className="h-4 w-4 text-emerald-600" />}>
                <button
                  type="button"
                  onClick={() => setIsBrushMode((v) => !v)}
                  className={`w-full rounded-xl py-2 text-xs font-bold transition-colors ${isBrushMode ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-700 hover:bg-emerald-100"}`}
                >
                  {isBrushMode ? "✓ Pincel Activo — Toca para desactivar" : "Activar Pincel"}
                </button>
                {isBrushMode && (
                  <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-stone-600">Tamaño</label>
                      <input
                        type="range"
                        min="3"
                        max="80"
                        value={brushSize}
                        onChange={(e) => { setBrushSize(Number(e.target.value)); brushSizeRef.current = Number(e.target.value); }}
                        className="w-28 accent-emerald-600"
                      />
                    </div>
                  </div>
                )}
              </Section>

              {/* 4. Añadir texto con tipografía */}
              <Section id="texto" title="Añadir Texto Tipográfico" icon={<Type className="h-4 w-4 text-emerald-600" />}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addText()}
                    placeholder="Ej: Envío Gratis"
                    className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addText}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                {/* Formato tipográfico inicial */}
                <div className="flex items-center justify-between gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
                  <button
                    type="button"
                    onClick={() => setTextBold((v) => !v)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${textBold ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Negrita"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextItalic((v) => !v)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${textItalic ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Cursiva"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextUnderline((v) => !v)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${textUnderline ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Subrayado"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextStrikethrough((v) => !v)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${textStrikethrough ? "bg-emerald-600 text-white font-black" : "text-stone-700 hover:bg-stone-200"}`}
                    title="Tachado"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="rounded-xl border border-stone-200 px-2 py-2 text-xs outline-none"
                  >
                    {FONTS_LIST.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-xl border border-stone-200"
                    title="Color del texto"
                  />
                </div>
              </Section>

              {/* 5. Imagen extra / logo */}
              <Section id="logo" title="Imagen / Logo Extra" icon={<ImageIcon className="h-4 w-4 text-emerald-600" />}>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 py-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50">
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                  Cargar logo o detalle extra
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && loadOverlayImage(e.target.files[0])}
                  />
                </label>
              </Section>
            </div>

            {/* Acciones globales */}
            <div className="border-t border-stone-200 bg-white p-4 space-y-2">
              <button
                type="button"
                onClick={clearAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar trazos y textos
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
