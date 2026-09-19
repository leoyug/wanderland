import { RiBookmarkFill, RiBookmarkLine } from "@remixicon/react";
import type { CSSProperties } from "react";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
}

/**
 * A compact, self-contained favorite control shared by every library layout.
 * The bookmark artwork stays unchanged; a short pop and particle burst
 * acknowledge starring, matching the supplied like-button reference.
 */
export function FavoriteButton({ isFavorite, onToggle }: FavoriteButtonProps) {
  return (
    <button
      className={`favorite-button${isFavorite ? " is-active" : ""}`}
      type="button"
      aria-label={isFavorite ? "取消星标" : "添加星标"}
      aria-pressed={isFavorite}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <span className="favorite-button-mark-wrap" aria-hidden="true">
        {isFavorite
          ? <RiBookmarkFill className="favorite-button-mark" size={16} />
          : <RiBookmarkLine className="favorite-button-mark" size={16} />}
        <span className="favorite-spark" style={{ "--spark-x": "-9px", "--spark-y": "-7px" } as CSSProperties} />
        <span className="favorite-spark" style={{ "--spark-x": "0px", "--spark-y": "-11px" } as CSSProperties} />
        <span className="favorite-spark" style={{ "--spark-x": "9px", "--spark-y": "-7px" } as CSSProperties} />
        <span className="favorite-spark" style={{ "--spark-x": "-10px", "--spark-y": "3px" } as CSSProperties} />
        <span className="favorite-spark" style={{ "--spark-x": "10px", "--spark-y": "3px" } as CSSProperties} />
        <span className="favorite-spark" style={{ "--spark-x": "0px", "--spark-y": "11px" } as CSSProperties} />
      </span>
    </button>
  );
}
