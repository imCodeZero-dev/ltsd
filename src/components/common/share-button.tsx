"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  slug: string;
  className?: string;
  iconClassName?: string;
}

export function ShareButton({ slug, className, iconClassName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/deals/${slug}`;

    try {
      // Use native share sheet on mobile if available
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <button
      type="button"
      aria-label="Share deal"
      onClick={handleShare}
      className={cn(className)}
    >
      {copied
        ? <Check className={cn("text-green-500", iconClassName)} />
        : <Share2 className={iconClassName} />
      }
    </button>
  );
}
