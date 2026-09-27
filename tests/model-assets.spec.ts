import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

test('generated models have outward-facing surfaces and valid source photos', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Asset validation is independent of viewport.');
  const manifest = JSON.parse(readFileSync('src/model-manifest.json', 'utf8'));
  for (const [id, entry] of Object.entries(manifest) as [string, {src: string; sourceImage: string}][]) {
    const bytes = readFileSync(resolve('public', entry.src.slice(1)));
    expect(bytes.toString('ascii', 0, 4), id).toBe('glTF');
    expect(bytes.readUInt32LE(8), id).toBe(bytes.length);
    const jsonLength = bytes.readUInt32LE(12);
    const document = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
    const binStart = 20 + jsonLength + 8;
    let volume = 0;
    for (const mesh of document.meshes) for (const primitive of mesh.primitives) {
      const positions = document.accessors[primitive.attributes.POSITION];
      const indices = document.accessors[primitive.indices];
      const positionView = document.bufferViews[positions.bufferView];
      const indexView = document.bufferViews[indices.bufferView];
      expect(primitive.attributes.NORMAL, `${id}: smooth normals`).toBeDefined();
      const indexBytes = indices.componentType === 5125 ? 4 : 2;
      const indexOffset = binStart + (indexView.byteOffset || 0) + (indices.byteOffset || 0);
      const positionOffset = binStart + (positionView.byteOffset || 0) + (positions.byteOffset || 0);
      const stride = positionView.byteStride || 12;
      const vertex = (i: number) => {
        const index = indexBytes === 4 ? bytes.readUInt32LE(indexOffset + i * 4) : bytes.readUInt16LE(indexOffset + i * 2);
        const offset = positionOffset + index * stride;
        return [bytes.readFloatLE(offset), bytes.readFloatLE(offset + 4), bytes.readFloatLE(offset + 8)];
      };
      for (let i = 0; i < indices.count; i += 3) {
        const [a, b, c] = [vertex(i), vertex(i + 1), vertex(i + 2)];
        volume += (a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
      }
    }
    // Inward winding previously hid the exterior and made solid parts look torn.
    expect(volume, `${id}: outward winding`).toBeGreaterThan(0);
    expect(readFileSync(resolve('public', entry.sourceImage.slice(1))).length, id).toBeGreaterThan(0);
  }
});
