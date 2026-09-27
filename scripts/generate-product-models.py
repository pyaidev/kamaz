"""Generate product GLBs using the public Microsoft TRELLIS.2 Space.

Run with: uv run --with gradio_client python scripts/generate-product-models.py turbo-tkr
The hosted demo is subject to availability and usage quotas. No paid API is used.
"""
import argparse
import json
import shutil
from pathlib import Path

from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parent.parent
IMAGES = {
    'turbo-tkr': 'turbo.png', 'cylinder-head': 'head.jpg', 'starter': 'starter.png',
    'injector': 'injector.jpg', 'steering': 'steering.jpg', 'gearbox': 'gearbox.png',
    'radiator': 'radiator.png', 'engine': 'engine.png', 'reducer': 'reducer.png',
    'transfer': 'transfer.png', 'seal': 'seal.jpg', 'dashboard': 'dashboard.jpg',
    'hood': 'hood.jpg', 'tank': 'tank.jpg', 'fuel-sensor': 'fuel.jpg',
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('products', nargs='+', choices=list(IMAGES))
    args = parser.parse_args()
    manifest_path = ROOT / 'src/model-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    output_dir = ROOT / 'public/models'
    output_dir.mkdir(exist_ok=True)
    client = Client('microsoft/TRELLIS.2', verbose=False)
    client.predict(api_name='/start_session')
    for product_id in args.products:
        destination = output_dir / f'{product_id}.glb'
        if product_id in manifest and destination.exists():
            print(f'{product_id}: already generated; skipping', flush=True)
            continue
        source = ROOT / 'public/images' / IMAGES[product_id]
        print(f'{product_id}: preparing source photograph', flush=True)
        image = client.predict(handle_file(str(source)), api_name='/preprocess_image')
        print(f'{product_id}: generating geometry and texture', flush=True)
        client.predict(image=handle_file(image), seed=42, resolution='512', api_name='/image_to_3d')
        print(f'{product_id}: exporting GLB', flush=True)
        result = client.predict(decimation_target=100000, texture_size=1024, api_name='/extract_glb')
        generated = Path(result[0])
        with generated.open('rb') as file:
            if file.read(4) != b'glTF':
                raise ValueError('The service did not return a GLB file')
        shutil.copyfile(generated, destination)
        manifest[product_id] = {
            'src': f'/models/{product_id}.glb',
            'generator': 'microsoft/TRELLIS.2',
            'sourceImage': f'/images/{IMAGES[product_id]}',
        }
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
        print(f'{product_id}: saved {destination.stat().st_size:,} bytes', flush=True)


if __name__ == '__main__':
    main()
