import { toast as toastFn } from "@/hooks/use-toast"

type ToastType = "default" | "destructive" | "success"

interface ShowToastOptions {
  title: string
  description?: string
  type?: ToastType
}

export function showToast({ title, description, type = "default" }: ShowToastOptions) {
  toastFn({
    title,
    description,
    variant: type === "destructive" ? "destructive" : type === "success" ? "success" : "default",
    duration: 5000,
  })
}

export function showErrorToast(message: string, title: string = "Erro") {
  showToast({
    title,
    description: message,
    type: "destructive",
  })
}

export function showSuccessToast(message: string, title: string = "Sucesso") {
  showToast({
    title,
    description: message,
    type: "success",
  })
}
