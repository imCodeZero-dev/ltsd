import { Star } from "lucide-react";

interface StarRatingProps {
  score: number;       // 0–5
  reviewCount?: number;
  size?: "sm" | "md";
}

export function StarRating({ score, reviewCount, size = "sm" }: StarRatingProps) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.min(Math.max(score - i, 0), 1);
          return (
            <span key={i} className="relative inline-block">
              {/* Empty star */}
              <Star className={`${iconSize} text-border-mid`} />
              {/* Filled portion */}
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className={`${iconSize} text-yellow fill-yellow`} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">
        {score.toFixed(1)}
        {reviewCount !== undefined && (
          <> ({reviewCount.toLocaleString()})</>
        )}
      </span>
    </div>
  );
}
