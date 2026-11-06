import { toast } from 'sonner';

/** Copies text and says so, or says it couldn't (blocked clipboard). */
export async function copyWithToast(
  text: string,
  message: string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error('Unable to copy link');
  }
}
