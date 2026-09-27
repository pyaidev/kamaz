import replacements from './image-assets.json';

const images: Record<string, string> = replacements;
// Resolve legacy filenames too: saved carts and edited products keep their data.
export const productImageUrl = (filename: string) => `/images/${images[filename] || filename}`;
