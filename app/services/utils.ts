export function showToast(message: string) {
  // TODO: implement toast in components
  console.log("showToast", message);
}

export async function copyToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    showToast("Copied to clipboard");
  } catch (error) {
    showToast("Failed to copy to clipboard");
  }
  document.body.removeChild(textArea);
}

/**
 * Calculates the estimated reading time in minutes for a given text
 * @param text The text to calculate reading time for
 * @param wordsPerMinute Average reading speed (default: 200 words per minute)
 * @returns Estimated reading time in minutes (rounded up)
 */
export const calculateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};
