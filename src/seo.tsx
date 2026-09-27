import {productImageUrl} from './image-assets';
import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useStore} from './store';
import {categories} from './data';
export function Seo(){const location=useLocation();const {products}=useStore();useEffect(()=>{
 const titles:Record<string,string>={'/':'Запчасти для КАМАЗ — всегда в движении','/catalog':'Каталог запчастей','/cart':'Корзина','/checkout':'Оформление заказа','/account':'Личный кабинет','/favorites':'Избранное','/admin':'Управление магазином','/delivery':'Доставка и оплата','/guarantee':'Гарантия и возврат','/about':'О компании','/contacts':'Контакты','/privacy':'Данные и конфиденциальность'};
 const product=products.find(p=>location.pathname===`/product/${p.id}`);const category=categories.find(c=>new URLSearchParams(location.search).get('category')===c.id);
 const title=product?`${product.name} — ${product.article}`:category?`${category.name} для КАМАЗ`:titles[location.pathname]||'Заказ запчастей';document.title=`${title} | КАМДЕТАЛЬ`;
 const description=product?`${product.name}, артикул ${product.article}, производитель ${product.brand}. Демонстрационная карточка товара с характеристиками и оформлением заказа.`:`${title}. Поиск запчастей по артикулу, OEM и модели. Демонстрационная версия интернет-магазина КАМДЕТАЛЬ.`;
 document.querySelector('meta[name="description"]')?.setAttribute('content',description);
 const schema=product?{'@context':'https://schema.org','@type':'Product',name:product.name,sku:product.article,mpn:product.oem,image:`${window.location.origin}${productImageUrl(product.image)}`,description:product.description,brand:{'@type':'Brand',name:product.brand}}:{'@context':'https://schema.org','@type':'WebSite',name:'КАМДЕТАЛЬ — демонстрационная версия',url:window.location.origin};
 const node=document.createElement('script');node.id='page-schema';node.type='application/ld+json';node.textContent=JSON.stringify(schema);document.head.appendChild(node);
 const crumbs=document.createElement('script');crumbs.id='breadcrumb-schema';crumbs.type='application/ld+json';crumbs.textContent=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Главная',item:window.location.origin},...(location.pathname==='/'?[]:[{'@type':'ListItem',position:2,name:title,item:window.location.href}])]});document.head.appendChild(crumbs);
 return()=>{node.remove();crumbs.remove();};
 },[location.pathname,location.search,products]);return null;}
