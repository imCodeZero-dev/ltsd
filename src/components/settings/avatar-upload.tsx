"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { Camera, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/common/avatar";
import { updateAvatar } from "@/actions/settings";

function compressToWebP(file: File, maxPx = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white text-navy flex items-center justify-center shadow-lg z-10"
        >
          <X className="w-4 h-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="max-w-[80vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
      </div>
    </div>
  );
}

export function AvatarUpload({ src, name, email }: { src: string | null; name: string; email: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(src);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB."); return; }
    const toastId = toast.loading("Uploading…");
    try {
      const dataUrl = await compressToWebP(file);
      setPreview(dataUrl);
      startTransition(async () => {
        const result = await updateAvatar(dataUrl);
        if (result.error) {
          toast.error(result.error, { id: toastId });
          setPreview(src);
        } else {
          if (result.imageUrl) setPreview(result.imageUrl);
          toast.success("Avatar updated!", { id: toastId });
          router.refresh();
        }
      });
    } catch {
      toast.error("Failed to process image.", { id: toastId });
    }
  }, [src, router]);

  return (
    <>
      <div
        className={`flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3 transition-colors cursor-pointer ${
          dragging ? "border-badge-bg bg-orange-50" : "border-[#E7E8E9] hover:border-navy hover:bg-bg"
        }`}
        onClick={() => !isPending && inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
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

        {/* Avatar */}
        <div className="relative shrink-0 group" onClick={e => { if (preview) { e.stopPropagation(); setLightbox(true); } }}>
          <Avatar src={preview} name={name || email} size={52} />
          {isPending ? (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : preview ? (
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <ZoomIn className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : null}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <p className="text-sm font-semibold text-navy truncate">
            {isPending ? "Uploading…" : "Profile Photo"}
          </p>
          <p className="text-xs text-body mt-0.5 truncate">
            Drop image here or{" "}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); !isPending && inputRef.current?.click(); }}
              className="text-badge-bg font-semibold hover:underline"
              disabled={isPending}
            >
              browse
            </button>
            {" "}· WebP · Max 10 MB
          </p>
        </div>

        {/* Change button */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); !isPending && inputRef.current?.click(); }}
          disabled={isPending}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change</span>
        </button>
      </div>

      {lightbox && preview && (
        <Lightbox src={preview} name={name || email} onClose={() => setLightbox(false)} />
      )}
    </>
  );
}
