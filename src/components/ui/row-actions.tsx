import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function RowActions({ onView, onEdit, onDelete, className }: RowActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-0.5", className)}>
      {onView && (
        <button
          type="button"
          onClick={onView}
          title="View"
          aria-label="View"
          className="p-1.5 rounded text-info hover:bg-info-soft transition-colors"
        >
          <Eye size={14} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          aria-label="Edit"
          className="p-1.5 rounded text-primary hover:bg-primary-soft transition-colors"
        >
          <Pencil size={14} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete"
          className="p-1.5 rounded text-danger hover:bg-danger-soft transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
