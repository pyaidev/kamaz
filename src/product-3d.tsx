import {useEffect, useRef, useState} from 'react';
import {Box, Hand, LoaderCircle, Minus, Pause, Play, Plus, RotateCcw, X} from 'lucide-react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import type {Product} from './data';
import type {ProductModel} from './product-model';
import './product-3d.css';

type ViewerActions = {zoom: (factor: number) => void; reset: () => void; rotate: (x: number, y: number) => void};

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      Object.values(material).forEach(value => {if (value instanceof THREE.Texture) textures.add(value);});
    }
  });
  textures.forEach(texture => {texture.dispose(); if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close();});
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

export default function Product3D({product, model, onClose, returnFocusTo}: {product: Product; model: ProductModel; onClose: () => void; returnFocusTo: HTMLButtonElement | null}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const actions = useRef<ViewerActions | null>(null);
  const spinning = useRef(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {element.close(); document.body.style.overflow = overflow; if (returnFocusTo?.isConnected) returnFocusTo.focus({preventScroll: true});};
  }, [returnFocusTo]);

  useEffect(() => {
    const container = stage.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
    } catch {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setAutoRotate(false);
    spinning.current = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .05, 100);
    const initialPosition = new THREE.Vector3(4.3, 2.2, 5.4);
    const viewDirection = initialPosition.clone().normalize();
    let modelRadius = 2;
    camera.position.copy(initialPosition);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 12;
    controls.autoRotateSpeed = .8;
    controls.minPolarAngle = .12;
    controls.maxPolarAngle = Math.PI - .12;
    const fitCamera = () => {
      const halfAngle = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(camera.aspect, 1));
      const distance = modelRadius / Math.sin(halfAngle) * 1.12;
      initialPosition.copy(viewDirection).multiplyScalar(distance);
      camera.position.copy(initialPosition);
      controls.minDistance = Math.max(modelRadius * .8, .7);
      controls.maxDistance = distance * 2.2;
      controls.update();
    };
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const environmentMap = pmrem.fromScene(environment, .04);
    scene.environment = environmentMap.texture;
    environment.dispose();
    pmrem.dispose();
    const light = new THREE.DirectionalLight(0xffffff, 1.8);
    light.position.set(3, 5, 4);
    scene.add(light, new THREE.HemisphereLight(0xffffff, 0x707070, .7));

    const controller = new AbortController();
    let disposed = false;
    let object: THREE.Object3D | undefined;
    let frame = 0;
    let lastTime = 0;
    let visible = true;
    let dirty = true;
    const changed = () => {dirty = true;};
    controls.addEventListener('change', changed);
    const resize = new ResizeObserver(() => {
      const {width, height} = container.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitCamera();
      renderer.setSize(width, height);
      dirty = true;
    });
    resize.observe(container);
    const onVisibility = () => {visible = !document.hidden; lastTime = 0; dirty = true;};
    document.addEventListener('visibilitychange', onVisibility);
    const onContextLost = (event: Event) => {event.preventDefault(); setStatus('error');};
    canvas.addEventListener('webglcontextlost', onContextLost);
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
      lastTime = time;
      controls.autoRotate = spinning.current;
      controls.update(delta);
      if (dirty || spinning.current) {renderer.render(scene, camera); dirty = false;}
    };
    frame = requestAnimationFrame(tick);
    const zoom = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update(); dirty = true;
    };
    actions.current = {
      zoom,
      reset: () => {camera.position.copy(initialPosition); controls.target.set(0, 0, 0); controls.update(); dirty = true;},
      rotate: (x, y) => {
        const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        spherical.theta += x;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + y, .12, Math.PI - .12);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update(); dirty = true;
      },
    };
    async function load() {
      try {
        const response = await fetch(model.src, {signal: controller.signal});
        if (!response.ok) throw new Error('Model unavailable');
        const bytes = await response.arrayBuffer();
        if (disposed) return;
        const gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', new URL(model.src, location.href)).href);
        if (disposed) {disposeModel(gltf.scene); return;}
        object = gltf.scene;
        object.traverse(node => {
          if (!(node instanceof THREE.Mesh)) return;
          if (!node.geometry.getAttribute('normal')) node.geometry.computeVertexNormals();
          if (model.generator === 'stabilityai/TripoSR') {
            for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
              if (material instanceof THREE.MeshStandardMaterial) {material.metalness = .12; material.roughness = .72;}
            }
          }
        });
        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largest) || largest <= 0) throw new Error('Empty model');
        const center = bounds.getCenter(new THREE.Vector3());
        object.position.sub(center);
        const pivot = new THREE.Group();
        pivot.add(object);
        pivot.scale.setScalar(3.5 / largest);
        scene.add(pivot);
        modelRadius = new THREE.Box3().setFromObject(pivot).getBoundingSphere(new THREE.Sphere()).radius;
        fitCamera();
        renderer.render(scene, camera);
        dirty = true;
        setStatus('ready');
      } catch {
        if (!disposed) setStatus('error');
      }
    }
    void load();
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      controls.removeEventListener('change', changed);
      controls.dispose();
      actions.current = null;
      if (object) disposeModel(object);
      environmentMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [model.src, model.generator, attempt]);

  function toggleRotation() {spinning.current = !spinning.current; setAutoRotate(spinning.current);}

  return <dialog ref={dialog} className="product-3d-dialog" aria-labelledby="product-3d-title" onCancel={onClose} onClick={event => {if (event.target === event.currentTarget) onClose();}}>
    <div className="product-3d-shell">
      <header className="product-3d-header"><div><span className="product-3d-kicker"><Box size={15}/> ИНТЕРАКТИВНЫЙ ОБЗОР</span><h2 id="product-3d-title">{product.name}</h2></div><button className="product-3d-icon" onClick={onClose} aria-label="Закрыть 3D-просмотр" autoFocus><X size={22}/></button></header>
      <div className="product-3d-workspace">
        <div className="product-3d-stage" ref={stage} tabIndex={0} role="group" aria-label="3D-модель товара" aria-describedby="product-3d-help" data-status={status} onKeyDown={event => {
          const rotations: Record<string, [number, number]> = {ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, -.15], ArrowDown: [0, .15]};
          if (rotations[event.key]) {event.preventDefault(); actions.current?.rotate(...rotations[event.key]);}
          if (event.key === '+' || event.key === '=') {event.preventDefault(); actions.current?.zoom(.8);}
          if (event.key === '-') {event.preventDefault(); actions.current?.zoom(1.25);}
          if (event.key === 'Home') {event.preventDefault(); actions.current?.reset();}
        }}/>
        <div className="product-3d-corner"><span>360°</span><small>{product.article}</small></div>
        {status === 'loading' && <div className="product-3d-message" role="status"><LoaderCircle className="product-3d-spinner" size={32}/><b>Загружаем 3D-модель</b><span>Подготавливаем деталь к просмотру</span></div>}
        {status === 'error' && <div className="product-3d-message" role="alert"><Box size={32}/><b>Не удалось открыть 3D</b><span>Проверьте соединение и поддержку WebGL в браузере.</span><button className="btn" onClick={() => setAttempt(value => value + 1)}>Попробовать снова</button><button className="product-3d-text-button" onClick={onClose}>Вернуться к фотографиям</button></div>}
        {status === 'ready' && <div className="product-3d-controls" aria-label="Управление 3D-моделью">
          <button disabled={status !== 'ready'} onClick={toggleRotation} aria-pressed={autoRotate} aria-label={autoRotate ? 'Остановить вращение' : 'Автоматическое вращение'}>{autoRotate ? <Pause size={18}/> : <Play size={18}/>}<span>{autoRotate ? 'Пауза' : 'Вращать'}</span></button>
          <span className="product-3d-control-divider"/>
          <button disabled={status !== 'ready'} onClick={() => actions.current?.zoom(.8)} aria-label="Приблизить модель"><Plus size={20}/></button>
          <button disabled={status !== 'ready'} onClick={() => actions.current?.zoom(1.25)} aria-label="Отдалить модель"><Minus size={20}/></button>
          <button disabled={status !== 'ready'} onClick={() => {spinning.current = false; setAutoRotate(false); actions.current?.reset();}} aria-label="Сбросить ракурс"><RotateCcw size={18}/></button>
        </div>}
      </div>
      <footer className="product-3d-footer"><p id="product-3d-help"><Hand size={16}/><span>Вращайте перетаскиванием · масштабируйте двумя пальцами или кнопками. С клавиатуры: стрелки и +/−.</span></p><span className="product-3d-disclaimer">AI-реконструкция по фото. Форма и скрытые поверхности могут отличаться от оригинала.</span></footer>
    </div>
  </dialog>;
}
