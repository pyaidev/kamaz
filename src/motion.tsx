import {productImageUrl} from './image-assets';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export function MotionLayer() {
  const location = useLocation();
  const progress = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current) progress.current.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
      setShowTop(window.scrollY > 650);
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const seen = new WeakSet<Element>();
    let index = 0;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        el.animate([
          { opacity: 0, transform: 'translateY(30px)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
        ], { duration: 680, delay: Number(el.dataset.revealDelay || 0), easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards' });
      });
    }, { threshold: .08, rootMargin: '0px 0px 30px 0px' });
    const scan = () => {
      document.querySelectorAll('#main [data-reveal], #main .product-card, #main .page-title, #main .form-section').forEach(node => {
        if (seen.has(node)) return;
        seen.add(node);
        (node as HTMLElement).dataset.revealDelay = String((index++ % 4) * 65);
        observer.observe(node);
      });
    };
    scan();
    const mutations = new MutationObserver(scan);
    const main = document.getElementById('main');
    if (main) mutations.observe(main, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); };
  }, [location.pathname, location.search]);

  return <><div className="scroll-progress" ref={progress} aria-hidden="true" /><button className={`back-to-top ${showTop ? 'visible' : ''}`} tabIndex={showTop ? 0 : -1} aria-label="Вернуться наверх" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={22} /></button></>;
}

export function flyToCart(button: HTMLElement, image: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = document.querySelector('.header .cart-action') || document.querySelector('.mobile-nav a[href="/cart"]');
  if (!target) return;
  const start = button.getBoundingClientRect();
  let end = target.getBoundingClientRect();
  if (end.bottom < 0) {
    const mobile = document.querySelector('.mobile-nav a[href="/cart"]')?.getBoundingClientRect();
    end = mobile && mobile.width > 0 ? mobile : new DOMRect(window.innerWidth - 40, 18, 30, 30);
  }
  const fly = document.createElement('div');
  fly.className = 'cart-flying-item';
  const img = document.createElement('img'); img.src = productImageUrl(image); img.alt = ''; fly.append(img);
  fly.style.left = `${start.left + start.width / 2 - 26}px`;
  fly.style.top = `${start.top + start.height / 2 - 26}px`;
  document.body.append(fly);
  const dx = end.left + end.width / 2 - start.left - start.width / 2;
  const dy = end.top + end.height / 2 - start.top - start.height / 2;
  const animation = fly.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .4}px,${dy * .6 - 60}px) scale(.9)`, opacity: 1, offset: .45 }, { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: .15 }], { duration: 720, easing: 'cubic-bezier(.4,0,.2,1)' });
  animation.onfinish = () => { fly.remove(); target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 320 }); };
}
