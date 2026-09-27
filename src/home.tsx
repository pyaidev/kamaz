import { useRef, useState, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Crosshair, FileText, Fingerprint, PackageCheck, Search, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from './components';
import { categories, modelOptions } from './data';
import { useStore } from './store';

const services = [
  { icon: Crosshair, title: 'Подбор без догадок', text: 'По артикулу, OEM и модели' },
  { icon: Truck, title: 'Доставка по России', text: 'СДЭК или самовывоз' },
  { icon: FileText, title: 'Удобно для бизнеса', text: 'Заказ с выставлением счёта' },
  { icon: ShieldCheck, title: 'Сначала проверяем', text: 'Подтверждение перед оплатой' },
];

export function Home() {
  const { products, content, setRequest } = useStore();
  const navigate = useNavigate();
  const scene = useRef<HTMLDivElement>(null);
  const [finder, setFinder] = useState('article');
  const [query, setQuery] = useState('');
  const [model, setModel] = useState(modelOptions[1]);
  const [group, setGroup] = useState('');
  const [shelf, setShelf] = useState('focus');
  const defaultHeading = content.headline === 'Ваша техника.\nВсегда в движении.';
  const lines = defaultHeading ? ['ВАША ТЕХНИКА.', 'ВСЕГДА В', 'ДВИЖЕНИИ.'] : content.headline.split('\n');
  const selection = products.filter(p => shelf === 'engine' ? p.category === 'engine' : shelf === 'stock' ? p.stock > 0 : true).slice(0, 4);

  function moveScene(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = e.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty('--pointer-x', `${((e.clientX - box.left) / box.width - .5) * 16}px`);
    scene.current?.style.setProperty('--pointer-y', `${((e.clientY - box.top) / box.height - .5) * 10}px`);
  }

  function find(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (finder === 'vin') { setRequest({ title: 'Подбор по VIN', message: `VIN автомобиля: ${query}` }); return; }
    const params = new URLSearchParams();
    if (finder === 'article' && query.trim()) params.set('q', query.trim());
    if (finder === 'model') { params.set('model', model); if (group) params.set('category', group); }
    navigate(`/catalog?${params}`);
  }

  return <div className="premium-home">
    <section className="hero v2-hero" onPointerMove={moveScene} onPointerLeave={() => { scene.current?.style.setProperty('--pointer-x', '0px'); scene.current?.style.setProperty('--pointer-y', '0px'); }}>
      <div className="hero-grid-pattern" aria-hidden="true" />
      <div className="hero-ambient" aria-hidden="true" />
      <div ref={scene} className="hero-scene">
        <div className="hero-outline-word" aria-hidden="true">КАМАЗ</div>
        <img className="studio-truck" src={content.heroImage || '/images/truck-studio.webp'} alt="Оранжевый грузовик КАМАЗ — вид спереди в три четверти" fetchPriority="high" />
        <div className="hero-machine-tag"><span className="machine-tag-cross" /><span>ТЕХНИКА РАБОТАЕТ.<br /><b>МЫ ПОМОГАЕМ ЕЙ ПРОДОЛЖАТЬ.</b></span></div>
      </div>
      <div className="container hero-v2-container">
        <div className="hero-v2-copy">
          <div className="hero-v2-eyebrow"><span className="signal-dot" /> ЗАПЧАСТИ ДЛЯ БОЛЬШОЙ РАБОТЫ <span className="eyebrow-line" /></div>
          <h1 className={defaultHeading ? undefined : 'custom-heading'}>{lines.map((line, i) => <span className={`hero-title-line ${i === lines.length - 1 ? 'accent-line' : ''}`} key={i}><span style={{ animationDelay: `${160 + i * 130}ms` }}>{line}</span>{i < lines.length - 1 && ' '}</span>)}</h1>
          <p className="hero-v2-description">{content.subline}</p>
          <div className="hero-v2-actions"><Link className="btn btn-hero" to="/catalog"><span>Открыть каталог</span><ArrowUpRight size={22} /></Link><button className="hero-vin-link" onClick={() => setRequest({ title: 'Подбор запчастей по VIN' })}><Crosshair size={20} /><span>Подобрать по VIN</span></button></div>
          <div className="hero-compatible"><span>СОВМЕСТИМОСТЬ</span><b>КАМАЗ</b><i /><b>Cummins</b><i /><b>ZF</b></div>
        </div>
        <div className="hero-side-note"><span>КАТАЛОГ / 2026</span><span>РАБОТА ДОЛЖНА ПРОДОЛЖАТЬСЯ</span></div>
        <button className="hero-scroll-cue" aria-label="Перейти к подбору запчастей" onClick={() => document.getElementById('quick-finder')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' })}><span>ДВИГАЕМСЯ ДАЛЬШЕ</span><ArrowDown size={20} /></button>
        <div className="hero-small-card"><PackageCheck size={21} /><span>От одной запчасти<br /><b>до целого автопарка.</b></span><ArrowUpRight size={20} /></div>
      </div>
    </section>

    <div className="industrial-ticker" aria-hidden="true"><div className="ticker-track">{Array.from({ length: 4 }, (_, i) => <span key={i}><span>БОЛЬШОЙ ТЕХНИКЕ</span><span className="ticker-star">✳</span><span>НАДЁЖНЫЕ ДЕТАЛИ</span><span className="ticker-star">✳</span></span>)}</div></div>

    <section className="container quick-finder" id="quick-finder" data-reveal>
      <div className="finder-title"><Crosshair size={28} strokeWidth={1.5} /><div><span className="mini-label">ТОЧНЫЙ ПОДБОР</span><h2>Нужная деталь. Без лишних кругов.</h2></div></div>
      <div className="finder-switch" role="tablist" aria-label="Способ подбора">{[{ id: 'article', name: 'По артикулу', icon: Search }, { id: 'model', name: 'По модели', icon: Truck }, { id: 'vin', name: 'По VIN', icon: Fingerprint }].map(t => <button role="tab" aria-selected={finder === t.id} className={finder === t.id ? 'active' : ''} key={t.id} onClick={() => { setFinder(t.id); setQuery(''); }}><t.icon size={17} />{t.name}</button>)}</div>
      <form className="finder-form" onSubmit={find}>
        {finder === 'model' ? <><label><span>Модель автомобиля</span><select value={model} onChange={e => setModel(e.target.value)}>{modelOptions.slice(1).map(m => <option key={m}>{m}</option>)}</select></label><label><span>Группа запчастей</span><select value={group} onChange={e => setGroup(e.target.value)}><option value="">Все группы</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></> : <label className="finder-query"><span>{finder === 'vin' ? 'VIN или номер шасси' : 'Артикул, OEM или название'}</span><input value={query} onChange={e => setQuery(e.target.value)} required maxLength={finder === 'vin' ? 32 : 100} minLength={finder === 'vin' ? 8 : 1} placeholder={finder === 'vin' ? 'Укажите VIN — поможем с подбором' : 'Например, 740.21-1118010'} /></label>}
        <button className="btn btn-dark" type="submit">{finder === 'vin' ? 'Запросить подбор' : 'Найти запчасти'}<ArrowRight size={20} /></button>
      </form>
    </section>

    <section className="container benefits-v2" aria-label="Как мы работаем">{services.map((s, i) => <div data-reveal key={s.title}><span className="benefit-index">0{i + 1}</span><s.icon size={25} strokeWidth={1.5} /><div><h3>{s.title}</h3><p>{s.text}</p></div></div>)}</section>

    <section className="container v2-section categories-v2" id="categories">
      <div className="v2-section-heading" data-reveal><div><span className="section-marker"><i />01 / КАТАЛОГ ЗАПЧАСТЕЙ</span><h2>СИЛА —<br /><span>В КАЖДОЙ ДЕТАЛИ.</span></h2></div><div className="section-heading-aside"><p>От двигателя до последнего крепления.<br />Всё, что возвращает технику в работу.</p><Link className="round-link" to="/catalog">Весь каталог<span><ArrowUpRight size={22} /></span></Link></div></div>
      <div className="category-bento">{categories.map((c, i) => <Link className={`category-v2-card category-v2-${i}`} key={c.id} to={`/catalog?category=${c.id}`} data-reveal><span className="category-v2-top"><span>0{i + 1} /</span><ArrowUpRight size={23} /></span><div className="category-v2-image"><span className="category-orbit" aria-hidden="true" /><img src={`/images/${c.image}`} alt="" loading="lazy" /></div><div className="category-v2-copy"><h3>{c.name}</h3><p>{c.caption}</p></div></Link>)}</div>
    </section>

    <section className="parts-section"><div className="container v2-section">
      <div className="v2-section-heading" data-reveal><div><span className="section-marker"><i />02 / РАБОЧИЙ АССОРТИМЕНТ</span><h2>МАЛЕНЬКАЯ ДЕТАЛЬ.<br /><span>БОЛЬШАЯ РАБОТА.</span></h2></div><Link className="round-link" to="/catalog?stock=1">Все товары<span><ArrowUpRight size={22} /></span></Link></div>
      <div className="product-shelf-tabs" role="tablist" aria-label="Подборка товаров">{[{ id: 'focus', label: 'В фокусе' }, { id: 'stock', label: 'В наличии' }, { id: 'engine', label: 'Для двигателя' }].map(t => <button role="tab" aria-selected={shelf === t.id} className={shelf === t.id ? 'active' : ''} key={t.id} onClick={() => setShelf(t.id)}>{t.label}{shelf === t.id && <span />}</button>)}<span className="shelf-note"><span /> ПОДБЕРЁМ ПОД ВАШУ ЗАДАЧУ</span></div>
      <div className="products-grid home-products premium-products" key={shelf}>{selection.map(p => <ProductCard key={p.id} product={p} />)}</div><p className="catalog-disclaimer">Демонстрационный ассортимент. Цены, наличие и применяемость требуют подтверждения.</p>
    </div></section>

    {content.bannerVisible && <section className="container precision-section" data-reveal><div className="precision-copy"><span className="section-marker"><i />ПОДБОР СО СПЕЦИАЛИСТОМ</span><h2>{content.bannerTitle.split('\n').map((s, i) => <span key={i}>{s}<br /></span>)}</h2><p>{content.bannerText}</p><button className="btn" onClick={() => setRequest({ title: 'Подбор запчасти со специалистом' })}>Найти мою деталь<ArrowUpRight size={22} /></button><div className="precision-options"><span><Check size={15} />По VIN</span><span><Check size={15} />По артикулу</span><span><Check size={15} />По фотографии</span></div></div><div className="precision-visual" aria-hidden="true"><div className="precision-orbit orbit-outer" /><div className="precision-orbit orbit-middle" /><div className="precision-orbit orbit-inner" /><div className="precision-axis horizontal" /><div className="precision-axis vertical" /><img src="/images/turbo.png" alt="" loading="lazy" /><span className="precision-tag"><span />ДЕТАЛЬ НАЙДЕНА</span><span className="precision-coord">01 / ТОЧНОСТЬ В ДЕТАЛЯХ</span></div></section>}

    <section className="container v2-section process-section"><div className="v2-section-heading" data-reveal><div><span className="section-marker"><i />03 / ВСЁ ПОД КОНТРОЛЕМ</span><h2>ЧЕТЫРЕ ШАГА.<br /><span>И СНОВА В ДЕЛЕ.</span></h2></div><p className="process-intro">Понятный путь от нужного артикула<br />до запчасти в вашей мастерской.</p></div><div className="process-grid">{[{ n: '01', title: 'Найдите деталь', text: 'По артикулу, OEM или модели. Не уверены — поможем подобрать.' }, { n: '02', title: 'Соберите заказ', text: 'Добавьте товары в корзину и укажите реквизиты для счёта.' }, { n: '03', title: 'Подтвердите детали', text: 'Менеджер проверит наличие, комплектацию и итоговую стоимость.' }, { n: '04', title: 'Вернитесь в работу', text: 'Получите заказ через СДЭК или выберите самовывоз.' }].map(step => <article data-reveal key={step.n}><div className="process-number">{step.n}<ArrowUpRight size={24} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
  </div>;
}
