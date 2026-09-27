"""Reconstruct product photos locally with the open-source TripoSR model.

Requires an isolated Python environment and the official TripoSR source checkout.
See docs/product-3d.md for setup. The marching-cubes adapter uses scikit-image
so mesh extraction works without compiling the optional CUDA extension.
"""
import argparse
import gc
import json
import sys
import types
from pathlib import Path

import numpy as np
import torch
import trimesh
from PIL import Image
from skimage.measure import marching_cubes

ROOT = Path(__file__).resolve().parent.parent
IMAGES = {
    'turbo-tkr': 'turbo.png', 'cylinder-head': 'head.jpg', 'starter': 'starter.png',
    'injector': 'injector.jpg', 'steering': 'steering.jpg', 'gearbox': 'gearbox.png',
    'radiator': 'radiator.png', 'engine': 'engine.png', 'reducer': 'reducer.png',
    'transfer': 'transfer.png', 'seal': 'seal.jpg', 'dashboard': 'dashboard.jpg',
    'hood': 'hood.jpg', 'tank': 'tank.jpg', 'fuel-sensor': 'fuel.jpg',
}


def cpu_marching_cubes(volume, threshold):
    vertices, faces, _, _ = marching_cubes(volume.detach().cpu().numpy(), level=threshold)
    # Match torchmcubes' z/y/x output; TripoSR changes it back to x/y/z.
    return torch.from_numpy(vertices[:, ::-1].copy()), torch.from_numpy(faces.copy().astype(np.int64))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--resolution', type=int, default=160)
    parser.add_argument('--weights', default='stabilityai/TripoSR')
    parser.add_argument('--device', choices=['cpu', 'mps', 'cuda'], default=None)
    parser.add_argument('products', nargs='+', choices=list(IMAGES))
    args = parser.parse_args()
    sys.path.insert(0, str(args.source.resolve()))
    adapter = types.ModuleType('torchmcubes')
    adapter.marching_cubes = cpu_marching_cubes
    sys.modules['torchmcubes'] = adapter
    from tsr.system import TSR
    from tsr.utils import remove_background, resize_foreground
    import rembg

    torch.set_num_threads(4)
    device = args.device or ('mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Loading TripoSR on {device}', flush=True)
    model = TSR.from_pretrained(args.weights, config_name='config.yaml', weight_name='model.ckpt')
    model.eval().to(device)
    model.renderer.set_chunk_size(8192)
    print('Model loaded', flush=True)
    background_session = None
    manifest_path = ROOT / 'src/model-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    output_dir = ROOT / 'public/models'
    output_dir.mkdir(exist_ok=True)
    for product_id in args.products:
        destination = output_dir / f'{product_id}.glb'
        if product_id in manifest and destination.exists():
            print(f'{product_id}: already generated; skipping', flush=True)
            continue
        image = Image.open(ROOT / 'public/images' / IMAGES[product_id])
        print(f'{product_id}: preparing photo', flush=True)
        if image.mode != 'RGBA' or image.getextrema()[3][0] == 255:
            if background_session is None:
                background_session = rembg.new_session('u2netp')
            image = remove_background(image, background_session)
        image = resize_foreground(image, .85)
        pixels = np.asarray(image).astype(np.float32) / 255
        rgb = pixels[:, :, :3] * pixels[:, :, 3:4] + (1 - pixels[:, :, 3:4]) * .5
        prepared = Image.fromarray((rgb * 255).astype(np.uint8))
        print(f'{product_id}: reconstructing shape', flush=True)
        with torch.no_grad():
            codes = model([prepared], device=device)
            print(f'{product_id}: extracting surface', flush=True)
            mesh = model.extract_mesh(codes, True, resolution=args.resolution)[0]
        # TripoSR uses Z-up; the web viewer uses glTF's Y-up convention.
        mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
        # glTF vertex colors are linear; the reconstructed photo colors are sRGB.
        colors = mesh.visual.vertex_colors.copy()
        srgb = colors[:, :3].astype(np.float32) / 255
        linear = np.where(srgb <= .04045, srgb / 12.92, ((srgb + .055) / 1.055) ** 2.4)
        colors[:, :3] = np.round(linear * 255).astype(np.uint8)
        mesh.visual.vertex_colors = colors
        mesh.export(destination, file_type='glb', include_normals=True)
        manifest[product_id] = {
            'src': f'/models/{product_id}.glb',
            'generator': 'stabilityai/TripoSR',
            'sourceImage': f'/images/{IMAGES[product_id]}',
        }
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
        print(f'{product_id}: saved {len(mesh.faces):,} faces / {destination.stat().st_size:,} bytes', flush=True)
        del codes, mesh
        gc.collect()
        if device == 'mps':
            torch.mps.empty_cache()


if __name__ == '__main__':
    main()
