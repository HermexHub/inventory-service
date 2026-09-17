import { Client } from 'pg'

export interface SeedProduct {
  id: string
  name: string
  sku: string
  price: number
  stockQuantity: number
  category: string
  description: string
  imageUrl: string
}

export const catalogProducts: SeedProduct[] = [
  // 1. SMARTPHONES (10 items)
  {
    id: 'smart-ip15pm-256',
    name: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
    sku: 'SMART-IP15PM-256',
    price: 54999,
    stockQuantity: 24,
    category: 'Smartphones',
    description: 'Флагманський смартфон з титановим корпусом, чипом A17 Pro, кнопкою Дії та 5x оптичним зумом.',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-ip15-128-blk',
    name: 'Apple iPhone 15 128GB Black',
    sku: 'SMART-IP15-128-BLK',
    price: 36999,
    stockQuantity: 30,
    category: 'Smartphones',
    description: 'Dynamic Island, 48 Мп основна камера, новий роз’єм USB-C та міцне скло задньої панелі.',
    imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-s24u-512-gry',
    name: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    sku: 'SMART-S24U-512',
    price: 52999,
    stockQuantity: 18,
    category: 'Smartphones',
    description: 'Штучний інтелект Galaxy AI, 200 Мп камера, вбудоване перо S Pen і процесор Snapdragon 8 Gen 3.',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-s24p-256-vio',
    name: 'Samsung Galaxy S24+ 256GB Cobalt Violet',
    sku: 'SMART-S24P-256',
    price: 39999,
    stockQuantity: 15,
    category: 'Smartphones',
    description: 'Яскравий QHD+ дисплей 6.7 дюйма, акумулятор 4900 мА·год та передові функції фотографії.',
    imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-pixel8p-256',
    name: 'Google Pixel 8 Pro 256GB Bay Blue',
    sku: 'SMART-PIX8P-256',
    price: 38499,
    stockQuantity: 16,
    category: 'Smartphones',
    description: 'Фірмовий чип Google Tensor G3, професійна камера з Best Take та 7 років оновлень Android.',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-mi14u-512',
    name: 'Xiaomi 14 Ultra 512GB Black Leica Summilux',
    sku: 'SMART-MI14U-512',
    price: 47999,
    stockQuantity: 12,
    category: 'Smartphones',
    description: 'Чотири камери по 50 Мп із оптикою Leica, безступінчаста діафрагма та 1-дюймовий сенсор Sony LYT-900.',
    imageUrl: 'https://images.unsplash.com/photo-1598327105854-c8674faddf79?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-op12-512',
    name: 'OnePlus 12 512GB Silky Black (16GB RAM)',
    sku: 'SMART-OP12-512',
    price: 35999,
    stockQuantity: 20,
    category: 'Smartphones',
    description: 'Швидка зарядка 100W SUPERVOOC, екран 2K 120Hz ProXDR та камера 4-го покоління Hasselblad.',
    imageUrl: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-zen10-256',
    name: 'ASUS Zenfone 10 256GB Midnight Black',
    sku: 'SMART-ZEN10-256',
    price: 29999,
    stockQuantity: 14,
    category: 'Smartphones',
    description: 'Компактний флагман із 5.9-дюймовим AMOLED 144Hz екраном і 6-осьовою карданною стабілізацією камери.',
    imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-np2-256-gry',
    name: 'Nothing Phone (2) 256GB Dark Grey Glyph',
    sku: 'SMART-NP2-256',
    price: 26499,
    stockQuantity: 22,
    category: 'Smartphones',
    description: 'Унікальний прозорий дизайн з інтерфейсом світлових смуг Glyph Interface і Nothing OS 2.5.',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smart-xp1v-256',
    name: 'Sony Xperia 1 V 256GB Platinum Silver',
    sku: 'SMART-XP1V-256',
    price: 46999,
    stockQuantity: 10,
    category: 'Smartphones',
    description: '4K OLED 120Hz дисплей зі співвідношенням 21:9, революційний датчик Exmor T і фізична кнопка спуску.',
    imageUrl: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80'
  },

  // 2. LAPTOPS (10 items)
  {
    id: 'lap-mbp-16-m3max',
    name: 'Apple MacBook Pro 16" M3 Max (36GB, 1TB) Space Black',
    sku: 'LAP-MBP-16-M3MAX',
    price: 139999,
    stockQuantity: 12,
    category: 'Laptops',
    description: 'Максимальна продуктивність для професіоналів: чип Apple M3 Max, дисплей Liquid Retina XDR.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-mba-15-m3',
    name: 'Apple MacBook Air 15" M3 (16GB, 512GB) Midnight',
    sku: 'LAP-MBA-15-M3',
    price: 64999,
    stockQuantity: 18,
    category: 'Laptops',
    description: 'Неймовірно тонкий корпус, 15.3-дюймовий Liquid Retina екран та автономність до 18 годин.',
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-mbp-14-m3pro',
    name: 'Apple MacBook Pro 14" M3 Pro (18GB, 512GB) Silver',
    sku: 'LAP-MBP-14-M3PRO',
    price: 88999,
    stockQuantity: 14,
    category: 'Laptops',
    description: 'Компактна професійна робоча станція з чудовим дисплеєм ProMotion 120Hz і портами HDMI та SDXC.',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-asus-g16-oled',
    name: 'ASUS ROG Zephyrus G16 OLED (RTX 4070, 32GB, 1TB)',
    sku: 'LAP-ASUS-G16-OLED',
    price: 89999,
    stockQuantity: 11,
    category: 'Laptops',
    description: 'Геймерський ноутбук нового покоління: екран ROG Nebula OLED 240Hz, Core Ultra 9 і графіка RTX 4070.',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-len-pro7-4080',
    name: 'Lenovo Legion Pro 7 Gen 8 (RTX 4080, i9-13900HX)',
    sku: 'LAP-LEN-PRO7-4080',
    price: 99999,
    stockQuantity: 8,
    category: 'Laptops',
    description: 'Флагманська ігрова потужність з Legion Coldfront 5.0, екраном WQXGA 240Hz та AI-чипом LA2-Q.',
    imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-dell-xps16-oled',
    name: 'Dell XPS 16 9640 OLED (Intel Core Ultra 7, 32GB)',
    sku: 'LAP-DELL-XPS16',
    price: 92499,
    stockQuantity: 9,
    category: 'Laptops',
    description: 'Преміальний ультрабук з сенсорним 4K+ OLED дисплеєм, безшовним тачпадом і гранітним склом Gorilla Glass.',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-razer-blade16',
    name: 'Razer Blade 16 Dual Mini-LED (RTX 4080, 32GB)',
    sku: 'LAP-RAZER-BLADE16',
    price: 129999,
    stockQuantity: 7,
    category: 'Laptops',
    description: 'Перший у світі подвійний режим екрану Mini-LED (FHD+ 240Hz / UHD+ 120Hz) у суцільнометалевому корпусі.',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-hp-omen-14',
    name: 'HP Omen Transcend 14 OLED (RTX 4060, Ultra 7)',
    sku: 'LAP-HP-OMEN14',
    price: 68999,
    stockQuantity: 15,
    category: 'Laptops',
    description: 'Найлегший 14-дюймовий ігровий ноутбук вагою всього 1.63 кг із приголомшливим 2.8K 120Hz OLED екраном.',
    imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-asus-zen-duo',
    name: 'ASUS Zenbook Duo 2024 Dual 3K OLED (Core Ultra 9)',
    sku: 'LAP-ASUS-ZENDUO',
    price: 79999,
    stockQuantity: 10,
    category: 'Laptops',
    description: 'Два повнорозмірні 14-дюймові сенсорні OLED дисплеї 120Hz зі знімною Bluetooth-клавіатурою.',
    imageUrl: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lap-len-x1-gen12',
    name: 'Lenovo ThinkPad X1 Carbon Gen 12 (32GB, 1TB)',
    sku: 'LAP-LEN-X1GEN12',
    price: 84999,
    stockQuantity: 13,
    category: 'Laptops',
    description: 'Легендарний бізнес-ультрабук з вуглецевого волокна з тактильною панеллю TrackPoint і сертифікатом MIL-STD 810H.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'
  },

  // 3. AUDIO (10 items)
  {
    id: 'aud-sony-xm5-sil',
    name: 'Sony WH-1000XM5 Wireless Noise Canceling Silver',
    sku: 'AUD-SONY-XM5-SIL',
    price: 14999,
    stockQuantity: 30,
    category: 'Audio',
    description: 'Флагманське шумозаглушення з двома процесорами, 8 мікрофонами та підтримкою Hi-Res Audio LDAC.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-airpods-max-gry',
    name: 'Apple AirPods Max Space Gray with Smart Case',
    sku: 'AUD-AP-MAX-GRY',
    price: 24999,
    stockQuantity: 18,
    category: 'Audio',
    description: 'Алюмінієві чашки, просторове аудіо з динамічним відстеженням рухів голови та активне шумозаглушення.',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-bose-ultra-blk',
    name: 'Bose QuietComfort Ultra Headphones Black',
    sku: 'AUD-BOSE-QCULTRA',
    price: 16499,
    stockQuantity: 22,
    category: 'Audio',
    description: 'Проривне просторове звучання Bose Immersive Audio, еталонний комфорт і режим CustomTune.',
    imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-senn-mom4-den',
    name: 'Sennheiser Momentum 4 Wireless Denim Edition',
    sku: 'AUD-SENN-MOM4',
    price: 13499,
    stockQuantity: 16,
    category: 'Audio',
    description: 'Неймовірні 60 годин роботи на одному заряді, аудіофільські 42-мм випромінювачі та адаптивне ANC.',
    imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-marsh-maj4-blk',
    name: 'Marshall Major IV Wireless Bluetooth On-Ear Black',
    sku: 'AUD-MARSH-MAJ4',
    price: 5499,
    stockQuantity: 40,
    category: 'Audio',
    description: 'Культовий рок-н-рольний дизайн Marshall, понад 80 годин бездротового відтворення та швидка зарядка.',
    imageUrl: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-airpods-pro2-c',
    name: 'Apple AirPods Pro 2 (USB-C) MagSafe Case',
    sku: 'AUD-AP-PRO2-C',
    price: 9999,
    stockQuantity: 35,
    category: 'Audio',
    description: 'Чип H2, вдвічі потужніше шумопоглинання, адаптивна прозорість та футляр із захистом IP54.',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-sony-wf-xm5',
    name: 'Sony WF-1000XM5 True Wireless Earbuds Black',
    sku: 'AUD-SONY-WFXM5',
    price: 9499,
    stockQuantity: 28,
    category: 'Audio',
    description: 'Найкращі TWS-навушники з динаміком Dynamic Driver X, кістковою провідністю та чіткими дзвінками.',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-bw-px7-blue',
    name: 'Bowers & Wilkins Px7 S2e Ocean Blue',
    sku: 'AUD-BW-PX7S2E',
    price: 15999,
    stockQuantity: 12,
    category: 'Audio',
    description: 'Справжній Hi-Fi звук завдяки переналаштованій акустичній платформі з 24-бітним DSP процесором.',
    imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-jbl-boombox3',
    name: 'JBL Boombox 3 Wi-Fi Portable Speaker Black',
    sku: 'AUD-JBL-BB3',
    price: 19999,
    stockQuantity: 15,
    category: 'Audio',
    description: 'Масивний бас із вбудованим сабвуфером, підтримка Dolby Atmos по Wi-Fi та 24 години потужної музики.',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'aud-bo-explore-anth',
    name: 'Bang & Olufsen Beosound Explore Anthracite',
    sku: 'AUD-BO-EXPLORE',
    price: 8999,
    stockQuantity: 20,
    category: 'Audio',
    description: 'Ультрастійка портативна колонка з анодованого алюмінію із захистом IP67 та 360-градусним звуком.',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80'
  },

  // 4. WEARABLES (10 items)
  {
    id: 'wear-aw-ultra2-org',
    name: 'Apple Watch Ultra 2 GPS + Cellular 49mm Titanium',
    sku: 'WEAR-AW-ULTRA2',
    price: 35999,
    stockQuantity: 11,
    category: 'Wearables',
    description: 'Надміцний титановий корпус, яскравість 3000 ніт, точний двочастотний GPS та до 72 годин у режимі економії.',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-aw-s9-45-mid',
    name: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
    sku: 'WEAR-AW-S9-45',
    price: 18499,
    stockQuantity: 25,
    category: 'Wearables',
    description: 'Жест подвійного дотику Double Tap, новий чип S9 SiP, датчик кисню та виявлення падінь.',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-garm-fenix7x',
    name: 'Garmin Fenix 7X Pro Solar Sapphire Carbon Gray',
    sku: 'WEAR-GARM-FEN7X',
    price: 42999,
    stockQuantity: 14,
    category: 'Wearables',
    description: 'Справжній мультиспортивний годинник із сонячною зарядкою Power Sapphire, вбудованим ліхтариком та Topo картами.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-garm-epixpro',
    name: 'Garmin Epix Pro (Gen 2) 47mm Titanium Sapphire',
    sku: 'WEAR-GARM-EPIX2',
    price: 39499,
    stockQuantity: 12,
    category: 'Wearables',
    description: 'Яскравий AMOLED екран, датчик серцевого ритму Elevate 5-го покоління та показники витривалості Hill Score.',
    imageUrl: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-gw6-classic',
    name: 'Samsung Galaxy Watch 6 Classic 47mm Black LTE',
    sku: 'WEAR-GW6-CLASSIC',
    price: 15999,
    stockQuantity: 20,
    category: 'Wearables',
    description: 'Обертовий безель із нержавіючої сталі, розширений моніторинг фаз сну та вимірювання складу тіла BIA.',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-mi-watch2pro',
    name: 'Xiaomi Watch 2 Pro LTE Silver Stainless Steel',
    sku: 'WEAR-MI-W2PRO',
    price: 8999,
    stockQuantity: 22,
    category: 'Wearables',
    description: 'Операційна система Wear OS by Google, платформа Snapdragon W5+ Gen 1 і підтримка незалежної eSIM.',
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-suunto-vert',
    name: 'Suunto Vertical Titanium Solar All Black GPS',
    sku: 'WEAR-SUUNTO-VERT',
    price: 32999,
    stockQuantity: 10,
    category: 'Wearables',
    description: 'Неймовірні 85 годин безперервного трекінгу з найточнішим GPS, безкоштовні офлайн-мапи та сонячна панель.',
    imageUrl: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-hw-ultimate',
    name: 'Huawei Watch Ultimate Voyage Blue Titanium',
    sku: 'WEAR-HW-ULTIMATE',
    price: 31999,
    stockQuantity: 9,
    category: 'Wearables',
    description: 'Корпус з інноваційного рідкого металу на основі цирконію, сапфірове скло та занурення до 100 метрів.',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-fitbit-ch6',
    name: 'Fitbit Charge 6 Obsidian Black Fitness Tracker',
    sku: 'WEAR-FITBIT-CH6',
    price: 5999,
    stockQuantity: 30,
    category: 'Wearables',
    description: 'Інтеграція з Google Maps та YouTube Music, датчик стресу EDA та понад 40 спортивних режимів.',
    imageUrl: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'wear-amazfit-bal',
    name: 'Amazfit Balance 46mm Midnight Carbon AI Health',
    sku: 'WEAR-AMAZFIT-BAL',
    price: 7999,
    stockQuantity: 24,
    category: 'Wearables',
    description: 'Безконтактна оплата Zepp Pay, аналіз готовності організму Readiness та автономність до 14 днів.',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'
  },

  // 5. KEYBOARDS (10 items)
  {
    id: 'kb-keychron-q1',
    name: 'Keychron Q1 Pro Wireless Custom Mechanical 75%',
    sku: 'KB-KEYCHRON-Q1PRO',
    price: 7999,
    stockQuantity: 20,
    category: 'Keyboards',
    description: 'Суцільноалюмінієвий корпус, подвійний гаскет-маунт, підтримка QMK/VIA та змащені світчі Keychron K Pro.',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-logi-mx-mech',
    name: 'Logitech MX Mechanical Wireless Illuminated Keyboard',
    sku: 'KB-LOGI-MXMECH',
    price: 6499,
    stockQuantity: 25,
    category: 'Keyboards',
    description: 'Низькопрофільні тактильні механічні перемикачі, розумне підсвічування Smart Illumination і Logi Bolt.',
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-logi-mx3s',
    name: 'Logitech MX Master 3S Performance Wireless Mouse',
    sku: 'KB-LOGI-MX3S',
    price: 3999,
    stockQuantity: 45,
    category: 'Keyboards',
    description: 'Безшумні кліки Quiet Clicks, оптичний сенсор 8000 DPI та електромагнітне коліщатко MagSpeed.',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-razer-huntsman-v3',
    name: 'Razer Huntsman V3 Pro Analog Optical Keyboard',
    sku: 'KB-RAZER-HV3PRO',
    price: 9999,
    stockQuantity: 15,
    category: 'Keyboards',
    description: 'Аналогові оптичні світчі Gen-2 з регульованою точкою спрацьовування від 0.1 до 4.0 мм та режимом Rapid Trigger.',
    imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-steel-apex-pro',
    name: 'SteelSeries Apex Pro TKL Wireless (OmniPoint 2.0)',
    sku: 'KB-STEEL-APEXPRO',
    price: 10499,
    stockQuantity: 12,
    category: 'Keyboards',
    description: 'Світчі OmniPoint 2.0 з ресурсом 100 млн натискань, вбудований OLED дисплей Smart Display та RGB.',
    imageUrl: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-logi-gpro-sl2',
    name: 'Logitech G PRO X Superlight 2 Lightspeed White',
    sku: 'KB-LOGI-SL2-WHT',
    price: 5699,
    stockQuantity: 30,
    category: 'Keyboards',
    description: 'Кіберспортивна миша вагою всього 60 грамів з гібридними оптико-механічними перемикачами LIGHTFORCE.',
    imageUrl: 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-nuphy-air75',
    name: 'NuPhy Air75 V2 Ultra-Slim Wireless Mechanical',
    sku: 'KB-NUPHY-AIR75',
    price: 5899,
    stockQuantity: 22,
    category: 'Keyboards',
    description: 'Ультратонка механічна клавіатура з частотою опитування 1000 Гц у режимі 2.4G і кейкапами з PBT пластику.',
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-apple-magic-num',
    name: 'Apple Magic Keyboard with Touch ID & Numeric Keypad',
    sku: 'KB-AP-MAGICTOUCH',
    price: 6999,
    stockQuantity: 28,
    category: 'Keyboards',
    description: 'Вбудований датчик Touch ID для швидкої та безпечної авторизації та покупок через Apple Pay.',
    imageUrl: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-apple-magic-tp',
    name: 'Apple Magic Trackpad 3 Black Multi-Touch Surface',
    sku: 'KB-AP-MAGICTP-BLK',
    price: 5499,
    stockQuantity: 20,
    category: 'Keyboards',
    description: 'Скляна поверхня від краю до краю з підтримкою повного спектра жестів Multi-Touch і технології Force Touch.',
    imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b909?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kb-glorious-gmmk-pro',
    name: 'Glorious GMMK PRO 75% Custom Mechanical Barebone',
    sku: 'KB-GLOR-GMMKPRO',
    price: 6799,
    stockQuantity: 16,
    category: 'Keyboards',
    description: 'Модульна платформа з підтримкою 5-pin перемикачів hotswap, поворотним енкодером і RGB підсвічуванням.',
    imageUrl: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?auto=format&fit=crop&w=800&q=80'
  },

  // 6. POWER BANKS (10 items)
  {
    id: 'pb-anker-prime-200w',
    name: 'Anker Prime 20,000mAh 200W Portable Power Bank',
    sku: 'PB-ANKER-PRIME200',
    price: 4699,
    stockQuantity: 35,
    category: 'Power Banks',
    description: 'Надпотужний павербанк із сумарною віддачею 200W, двома портами USB-C по 100W та смарт-дисплеєм.',
    imageUrl: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-anker-737-140w',
    name: 'Anker 737 Power Bank (PowerCore 24K) 140W GaN',
    sku: 'PB-ANKER-737-140W',
    price: 5499,
    stockQuantity: 28,
    category: 'Power Banks',
    description: 'Підтримка протоколу Power Delivery 3.1 потужністю 140W для швидкого заряджання навіть MacBook Pro 16".',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-baseus-blade-100w',
    name: 'Baseus Blade HD 100W 20000mAh Ultra-Thin Power Bank',
    sku: 'PB-BASEUS-BLADE100',
    price: 3199,
    stockQuantity: 30,
    category: 'Power Banks',
    description: 'Ультратонкий корпус товщиною лише 18 мм, чотири порти швидкої зарядки та цифровий індикатор заряду.',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-mi-powerbank-50w',
    name: 'Xiaomi 50W 20000mAh Mi Power Bank 3 Pro Type-C',
    sku: 'PB-MI-PB50W-20K',
    price: 2299,
    stockQuantity: 50,
    category: 'Power Banks',
    description: 'Одночасне заряджання до трьох пристроїв, підтримка низькострумової зарядки для навушників і годинників.',
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-ecoflow-rapid-5k',
    name: 'EcoFlow RAPID Magnetic Wireless 5000mAh Power Bank',
    sku: 'PB-ECO-RAPID5K',
    price: 1999,
    stockQuantity: 40,
    category: 'Power Banks',
    description: 'Магнітна бездротова зарядка стандарту Qi2 потужністю 15W з відкидною металевою підставкою.',
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-zendure-supertank',
    name: 'Zendure SuperTank Pro 26800mAh 100W OLED Power Bank',
    sku: 'PB-ZEND-STANK26K',
    price: 6999,
    stockQuantity: 15,
    category: 'Power Banks',
    description: 'Чотири порти USB-C, інформативний 2-дюймовий OLED дисплей реального часу та авіаційний дозвіл 96.48 Вт·год.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-ugreen-nexode-145',
    name: 'Ugreen Nexode 145W 25000mAh Fast Charging Power Bank',
    sku: 'PB-UGREEN-NEX145',
    price: 4199,
    stockQuantity: 32,
    category: 'Power Banks',
    description: 'Двостороннє швидке заряджання 65W, високоякісні елементи живлення 21700 і багаторівневий захист Thermal Guard.',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-apple-magsafe-bp',
    name: 'Apple MagSafe Battery Pack White for iPhone',
    sku: 'PB-AP-MAGSAFEBP',
    price: 4299,
    stockQuantity: 25,
    category: 'Power Banks',
    description: 'Оригінальний компактний акумулятор із ідеальним магнітним кріпленням MagSafe та реверсивною бездротовою зарядкою.',
    imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-ecoflow-river2',
    name: 'EcoFlow River 2 Max 512Wh Portable Power Station',
    sku: 'PB-ECO-RIVER2MAX',
    price: 18999,
    stockQuantity: 8,
    category: 'Power Banks',
    description: 'Швидке заряджання від 0 до 100% за 60 хвилин, батарея LiFePO4 на 3000 циклів та потужність 512 Вт·год.',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pb-baseus-adaman-65',
    name: 'Baseus Adaman 65W 20000mAh Metal Digital Display',
    sku: 'PB-BASEUS-ADAM65',
    price: 2699,
    stockQuantity: 45,
    category: 'Power Banks',
    description: 'Міцний металевий корпус, світлодіодний дисплей із вольтметром і амперметром та швидке заряджання ноутбуків.',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80'
  }
]

async function runSeed() {
  const host = process.env.DB_HOST || 'localhost'
  const port = Number(process.env.DB_PORT) || 5433
  const user = process.env.DB_USERNAME || 'hermex_admin'
  const password = process.env.DB_PASSWORD || 'hermex_password'
  const database = process.env.DB_NAME || 'inventory_db'

  console.log(`Connecting to PostgreSQL at ${host}:${port}/${database}...`)

  const client = new Client({
    host,
    port,
    user,
    password,
    database
  })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL successfully!')

    console.log('🔄 Cleaning up legacy demo products and preparing clean catalog tables...')
    await client.query(`
      DELETE FROM products 
      WHERE id LIKE 'prod-%' 
         OR category NOT IN ('Smartphones', 'Laptops', 'Audio', 'Wearables', 'Keyboards', 'Power Banks');
    `)

    let inserted = 0

    for (const p of catalogProducts) {
      // Remove any conflicting records by id or sku
      await client.query('DELETE FROM products WHERE id = $1 OR sku = $2', [p.id, p.sku])

      const query = `
        INSERT INTO products (id, name, sku, price, "stockQuantity", category, description, "imageUrl", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW());
      `
      const res = await client.query(query, [
        p.id,
        p.name,
        p.sku,
        p.price,
        p.stockQuantity,
        p.category,
        p.description,
        p.imageUrl
      ])
      if (res.rowCount && res.rowCount > 0) {
        inserted++
      }
    }

    console.log(`✅ Successfully seeded/updated ${catalogProducts.length} products across all 6 categories!`)

    // Check count by category
    const statsRes = await client.query(`
      SELECT category, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price
      FROM products
      GROUP BY category
      ORDER BY category;
    `)
    console.log('\n📊 Catalog Statistics by Category:')
    console.table(statsRes.rows)

  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

if (import.meta.main || require.main === module) {
  runSeed()
}
