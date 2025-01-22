

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
