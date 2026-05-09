"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { Camera, Upload, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/common/avatar";
import { updateAvatar } from "@/actions/settings";

// Compress + convert to WebP in the browser before upload
function compressToWebP(file: File, maxPx = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white text-navy flex items-center justify-center shadow-lg hover:bg-bg transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="max-w-[80vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AvatarUpload({
  src,
  name,
  email,
}: {
  src: string | null;
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(src);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      return;
    }

    const toastId = toast.loading("Compressing & uploading…");
    try {
      const dataUrl = await compressToWebP(file);
      setPreview(dataUrl); // Optimistic preview

      startTransition(async () => {
        const result = await updateAvatar(dataUrl);
        if (result.error) {
          toast.error(result.error, { id: toastId });
          setPreview(src);
        } else {
          // Use the Cloudinary URL for the definitive preview
          if (result.imageUrl) setPreview(result.imageUrl);
          toast.success("Avatar updated!", { id: toastId });
          // Refresh all server components (sidebar, header dropdown)
          router.refresh();
        }
      });
    } catch {
      toast.error("Failed to process image.", { id: toastId });
    }
  }, [src, router]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <>
      <div
        className={`relative flex items-center gap-5 rounded-xl border-2 border-dashed px-5 py-4 transition-colors ${
          dragging ? "border-badge-bg bg-orange-50" : "border-[#E7E8E9] hover:border-navy hover:bg-bg"
        }`}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
          disabled={isPending}
        />

        {/* Avatar with view + spinner overlay */}
        <div className="relative shrink-0 group">
          <Avatar src={preview} name={name || email} size={64} />

          {/* Spinner during upload */}
          {isPending && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* View full image button (only when image exists) */}
          {!isPending && preview && (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors"
              aria-label="View photo"
            >
              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Text + actions */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy">
            {isPending ? "Uploading…" : "Profile Photo"}
          </p>
          <p className="text-xs text-body mt-0.5">
            Drag &amp; drop or{" "}
            <button
              type="button"
              onClick={() => !isPending && inputRef.current?.click()}
              className="text-badge-bg font-semibold hover:underline disabled:opacity-50"
              disabled={isPending}
            >
              browse
            </button>{" "}
            to upload · Converted to WebP automatically
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <button
              type="button"
              onClick={() => !isPending && inputRef.current?.click()}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              Change Photo
            </button>
            <div className="flex items-center gap-1 text-[11px] text-body">
              <Upload className="w-3 h-3" />
              Max 10 MB · JPG, PNG, WebP, GIF
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && preview && (
        <Lightbox
          src={preview}
          name={name || email}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}
