import manifest from './model-manifest.json';

export type ProductModel = {src: string; generator: string; sourceImage: string};
const models: Record<string, ProductModel> = manifest;
export const getProductModel = (id: string) => models[id];
