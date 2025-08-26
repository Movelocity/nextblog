export const textPreview = (md: string | undefined) => {
  if (!md) return '';
  return md.replace(/<[^>]*>?/gm, '').replace(/[#`-]/g, '').replace(/\([^)]*\)/g, '').trim().split(/\s+/).slice(0, 60).join(' ');
}

export const PAGE_WIDTH = "px-4 md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1080px] mx-auto"