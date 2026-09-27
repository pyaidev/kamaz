import manifest from './model-manifest.json';

export type ProductModel = {src: string; generator: string; sourceImage: string; published?: boolean};
const models: Record<string, ProductModel> = manifest;
export const getProductModel = (id: string) => {
  const model = models[id];
  return model?.published === true ? model : undefined;
};
