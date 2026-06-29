import { CSSProperties } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { toast } from "sonner";

/**
 * Displays an error toast with a red icon.
 * @param message - Primary message shown as the toast title.
 * @param description - Optional secondary text shown below the title.
 */
export function ToastError(message: string, description?: string) {
  toast.error(message, {
    icon: <CircleX className="text-red-300" />,
    description: description ? description : undefined,
    style: { "--toast-icon-margin-end": "8px" } as CSSProperties,
  });
}

/**
 * Displays a success toast with a green icon.
 * @param message - Primary message shown as the toast title.
 */
export function ToastSucess(message: string) {
  toast.success(message, { icon: <CircleCheck className="text-green-300" />, style: { "--toast-icon-margin-end": "8px" } as CSSProperties });
}
