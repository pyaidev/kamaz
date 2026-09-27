import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {initialProducts,type Product,type CartLine,type Order} from './data';
function useSaved<T>(key:string,fallback:T){
 const [value,setValue]=useState<T>(()=>{try {const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}});
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Browser storage may be disabled. */}},[key,value]);
 return [value,setValue] as const;
}
export type Content={headline:string;subline:string;bannerTitle:string;bannerText:string;bannerVisible:boolean;heroImage?:string};
const defaultContent:Content={headline:'Ваша техника.\nВсегда в движении.',subline:'Запчасти для КАМАЗ — от одной детали до комплекта для вашего автопарка.',bannerTitle:'Правильная деталь.\nС первого раза.',bannerText:'Не уверены в артикуле? Поможем подобрать запчасти по VIN, модели или фотографии.',bannerVisible:true};
type Store={products:Product[];setProducts:React.Dispatch<React.SetStateAction<Product[]>>;cart:CartLine[];setCart:React.Dispatch<React.SetStateAction<CartLine[]>>;favorites:string[];toggleFavorite:(id:string)=>void;addToCart:(id:string,qty?:number)=>void;orders:Order[];setOrders:React.Dispatch<React.SetStateAction<Order[]>>;content:Content;setContent:React.Dispatch<React.SetStateAction<Content>>;toast:string;notify:(s:string)=>void;request:{title:string;product?:Product;message?:string}|null;setRequest:React.Dispatch<React.SetStateAction<{title:string;product?:Product;message?:string}|null>>;city:string;setCity:React.Dispatch<React.SetStateAction<string>>};
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:ReactNode}){
 const [products,setProducts]=useSaved('kamdetal.products.v1',initialProducts);
 const [cart,setCart]=useSaved<CartLine[]>('kamdetal.cart.v1',[]);
 const [favorites,setFavorites]=useSaved<string[]>('kamdetal.favorites.v1',[]);
 const [orders,setOrders]=useSaved<Order[]>('kamdetal.orders.v1',[]);
 const [content,setContent]=useSaved('kamdetal.content.v1',defaultContent);
 const [city,setCity]=useSaved('kamdetal.city.v1','Набережные Челны');
 const [toast,notify]=useState('');const [request,setRequest]=useState<Store['request']>(null);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>notify(''),3600);return()=>clearTimeout(t);},[toast]);
 function addToCart(id:string,qty=1){const p=products.find(p=>p.id===id);if(!p)return;setCart(lines=>{const exists=lines.find(l=>l.id===id);return exists?lines.map(l=>l.id===id?{...l,qty:Math.min(999,l.qty+qty)}:l):[...lines,{id,qty}];});notify('Товар добавлен в корзину');}
 function toggleFavorite(id:string){setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);}
 return <Context.Provider value={{products,setProducts,cart,setCart,favorites,toggleFavorite,addToCart,orders,setOrders,content,setContent,toast,notify,request,setRequest,city,setCity}}>{children}</Context.Provider>;
}
export function useStore(){const context=useContext(Context);if(!context)throw new Error('Missing store');return context;}
