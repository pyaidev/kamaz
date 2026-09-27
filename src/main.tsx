import React,{useEffect,Suspense,lazy} from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Routes,Route,useLocation} from 'react-router-dom';
import {CheckCircle2} from 'lucide-react';
import {StoreProvider,useStore} from './store';
import {Header,Footer,MobileNav,RequestModal} from './components';
import {Home,Catalog,ProductPage,Favorites} from './pages';
import {Cart,Checkout,Account,OrderPage} from './commerce';
import {InfoPage,NotFound} from './info';
import './styles.css';
import './readability.css';
import {Seo} from './seo';
const Admin=lazy(()=>import('./admin'));
function App(){const location=useLocation();const {toast}=useStore();useEffect(()=>{window.scrollTo(0,0);},[location.pathname,location.search]);return <><Seo/><Header/><main id="main"><Suspense fallback={<div className="container loading">Загружаем раздел…</div>}><Routes><Route path="/" element={<Home/>}/><Route path="/catalog" element={<Catalog/>}/><Route path="/product/:id" element={<ProductPage/>}/><Route path="/favorites" element={<Favorites/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/account" element={<Account/>}/><Route path="/order/:id" element={<OrderPage/>}/><Route path="/admin" element={<Admin/>}/>{['delivery','guarantee','about','contacts','privacy'].map(p=><Route key={p} path={`/${p}`} element={<InfoPage type={p}/>}/>)}<Route path="*" element={<NotFound/>}/></Routes></Suspense></main><Footer/><MobileNav/><RequestModal/>{toast&&<div className="toast" role="status"><CheckCircle2 size={20}/>{toast}</div>}</>;}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><StoreProvider><App/></StoreProvider></BrowserRouter></React.StrictMode>);
