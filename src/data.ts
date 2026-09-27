export type Product = { id: string; name: string; article: string; oem: string; brand: string; category: string; subcategory: string; price: number; stock: number; image: string; gallery?: string[]; models: string[]; weight: number; dimensions: string; badge?: string; description: string };
export const categories = [
 { id:'engine', name:'Двигатель', caption:'Детали, турбины и системы питания', image:'engine.png', subs:['Двигатели в сборе','Турбокомпрессоры','Головки блока','Топливная система'] },
 { id:'transmission', name:'Трансмиссия', caption:'КПП, сцепление и ведущие мосты', image:'gearbox.png', subs:['Коробки передач','Раздаточные коробки','Редукторы'] },
 { id:'chassis', name:'Ходовая часть', caption:'Подвеска и рулевое управление', image:'steering.png', subs:['Рулевое управление','Уплотнения'] },
 { id:'electric', name:'Электрооборудование', caption:'Стартеры, приборы и датчики', image:'starter.png', subs:['Стартеры','Приборы и датчики'] },
 { id:'cooling', name:'Система охлаждения', caption:'Радиаторы и комплектующие', image:'radiator.png', subs:['Радиаторы'] },
 { id:'body', name:'Кабина и кузов', caption:'Всё для вашего рабочего места', image:'hood.jpg', subs:['Облицовка кабины'] },
];
export const modelOptions = ['Все модели','КАМАЗ-65115','КАМАЗ-6520','КАМАЗ-43118','КАМАЗ-5490'];
const description='Деталь для обслуживания и ремонта грузовых автомобилей КАМАЗ. Перед заказом сверьте каталожный номер и комплектацию автомобиля. Специалист поможет уточнить совместимость по VIN или маркировке агрегата.';
const models=['КАМАЗ-65115','КАМАЗ-6520','КАМАЗ-43118'];
export const initialProducts: Product[] = [
 {id:'turbo-tkr',name:'Турбокомпрессор ТКР 7С-6М правый',article:'740.21-1118010',oem:'ТКР7С6М',brand:'Турботехника',category:'engine',subcategory:'Турбокомпрессоры',price:18900,stock:12,image:'turbo.png',models,weight:8.4,dimensions:'32 × 28 × 30 см',badge:'Выбор для ТО',description},
 {id:'cylinder-head',name:'Головка блока цилиндров ЕВРО-2',article:'740.30-1003010',oem:'740.30-1003014',brand:'КАМАЗ',category:'engine',subcategory:'Головки блока',price:14750,stock:24,image:'head.jpg',gallery:['head.jpg','head-alt.jpg'],models,weight:11.2,dimensions:'24 × 19 × 22 см',description},
 {id:'starter',name:'Стартер 24В для двигателя КАМАЗ',article:'СТ142Б-3708000',oem:'142Б.3708',brand:'БАТЭ',category:'electric',subcategory:'Стартеры',price:16800,stock:8,image:'starter.png',models,weight:18.6,dimensions:'44 × 20 × 24 см',description},
 {id:'injector',name:'Форсунка Common Rail ЕВРО-4 / 5',article:'0445120153',oem:'0 445 120 153',brand:'BOSCH',category:'engine',subcategory:'Топливная система',price:24900,stock:16,image:'injector.jpg',models:['КАМАЗ-6520','КАМАЗ-5490'],weight:0.8,dimensions:'28 × 7 × 7 см',badge:'В фокусе',description},
 {id:'steering',name:'Гидроусилитель руля КАМАЗ ЕВРО',article:'453461.425-01',oem:'4310-3400020-03',brand:'БАГУ',category:'chassis',subcategory:'Рулевое управление',price:125620,stock:4,image:'steering.jpg',gallery:['steering.jpg','steering-alt.jpg'],models,weight:42,dimensions:'55 × 36 × 30 см',description},
 {id:'gearbox',name:'Коробка передач КАМАЗ в сборе',article:'154-1700051',oem:'154.1700051-10',brand:'КАМАЗ',category:'transmission',subcategory:'Коробки передач',price:248000,stock:0,image:'gearbox.png',models,weight:290,dimensions:'110 × 65 × 70 см',description},
 {id:'radiator',name:'Радиатор охлаждения КАМАЗ ЕВРО',article:'5320-1301010',oem:'5320-1301010-02',brand:'ШААЗ',category:'cooling',subcategory:'Радиаторы',price:32500,stock:7,image:'radiator.png',models,weight:21,dimensions:'86 × 72 × 18 см',description},
 {id:'engine',name:'Двигатель КАМАЗ 740 в сборе',article:'740.10-1000400',oem:'740.1000400',brand:'КАМАЗ',category:'engine',subcategory:'Двигатели в сборе',price:690000,stock:0,image:'engine.png',models,weight:750,dimensions:'120 × 100 × 110 см',badge:'Под заказ',description},
 {id:'reducer',name:'Редуктор заднего моста в сборе',article:'5320-2402010',oem:'5320-2402010-10',brand:'КАМАЗ',category:'transmission',subcategory:'Редукторы',price:84900,stock:3,image:'reducer.png',models,weight:126,dimensions:'65 × 54 × 48 см',description},
 {id:'transfer',name:'Раздаточная коробка КАМАЗ 43118',article:'43118-1800020',oem:'43118.1800020',brand:'КАМАЗ',category:'transmission',subcategory:'Раздаточные коробки',price:178000,stock:2,image:'transfer.png',models:['КАМАЗ-43118'],weight:180,dimensions:'80 × 65 × 62 см',description},
 {id:'seal',name:'Сальник хвостовика 70 × 92 × 13',article:'864176-10',oem:'70x92x13',brand:'БРТ',category:'chassis',subcategory:'Уплотнения',price:280,stock:120,image:'seal.jpg',models,weight:0.1,dimensions:'9.2 × 9.2 × 1.3 см',description},
 {id:'dashboard',name:'Комбинация приборов КАМАЗ ЕВРО-4',article:'56.3801',oem:'65115-3801010',brand:'Элара',category:'electric',subcategory:'Приборы и датчики',price:28400,stock:5,image:'dashboard.jpg',models,weight:2.5,dimensions:'42 × 22 × 16 см',description},
 {id:'hood',name:'Панель облицовки кабины, рестайлинг',article:'65115-8401010',oem:'6520-8401010',brand:'Технотрон',category:'body',subcategory:'Облицовка кабины',price:11700,stock:3,image:'hood.jpg',models:['КАМАЗ-65115','КАМАЗ-6520'],weight:9,dimensions:'180 × 50 × 16 см',description},
 {id:'tank',name:'Бачок топливный ПЖД металлический',article:'5320-1015290',oem:'5320.1015290',brand:'КАМАЗ',category:'engine',subcategory:'Топливная система',price:3950,stock:18,image:'tank.jpg',models,weight:2.1,dimensions:'24 × 19 × 28 см',description},
 {id:'fuel-sensor',name:'Топливозаборник с подогревом',article:'ДУКЭП-90-24',oem:'ДУКЭП-90-24/0,2-525',brand:'КЭМЗ',category:'electric',subcategory:'Приборы и датчики',price:7900,stock:9,image:'fuel.jpg',models,weight:1.2,dimensions:'53 × 12 × 12 см',description},
];
export type CartLine={id:string;qty:number};
export type Order={id:string;date:string;status:string;items:(Product & {qty:number})[];total:number;name:string;phone:string;email:string;company:string;inn:string;city:string;address:string;delivery:string;comment:string;buyer:string};
export const money=(n:number)=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(n);
export const normalize=(s:string)=>s.toLocaleLowerCase('ru').replace(/[^a-zа-яё0-9]/g,'');
export const matches=(p:Product,q:string)=>[p.name,p.article,p.oem,p.brand,...p.models].some(v=>normalize(v).includes(normalize(q)));
