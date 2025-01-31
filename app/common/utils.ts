export const textPreview = (md: string | undefined) => {
  if (!md) return '';
  return md.replace(/<[^>]*>?/gm, '').replace(/[#`-]/g, '').replace(/\([^)]*\)/g, '').trim().split(/\s+/).slice(0, 50).join(' ');
}