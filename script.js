/* =========================================================
   ASHEN RELICS — script.js
   Módulos: data, render, cart, particles, scroll, misc
   ========================================================= */

/* ---------------------------------------------------------
   1. DATOS DE PRODUCTOS (ficticios)
--------------------------------------------------------- */
const PRODUCTS = [
  { id:'p01', name:'Espada del Pacto Quebrado', cat:'soulsborne', icon:'⚔️', desc:'Forjada con la última llama de una hoguera olvidada.', price:189.00, rarity:'legendary' },
  { id:'p02', name:'Máscara del Peregrino Ciego', cat:'soulsborne', icon:'🎭', desc:'Oculta el rostro de quien ya no recuerda su nombre.', price:124.00, rarity:'rare' },
  { id:'p03', name:'Armadura del Caballero de Ceniza', cat:'soulsborne', icon:'🛡️', desc:'Cada abolladura cuenta una batalla que nadie ganó.', price:312.00, rarity:'legendary' },
  { id:'p04', name:'Grimorio de Plegarias Rotas', cat:'penitent', icon:'📕', desc:'Páginas escritas con ceniza y arrepentimiento.', price:96.00, rarity:'rare' },
  { id:'p05', name:'Lámpara del Nido de Esporas', cat:'hollow', icon:'🏮', desc:'Una luz tenue que guía a través del Reino Hueco.', price:78.00, rarity:'rare' },
  { id:'p06', name:'Anillo del Vacío Penitente', cat:'penitent', icon:'💍', desc:'Bendice al portador con culpa eterna y poder oscuro.', price:142.00, rarity:'cursed' },
  { id:'p07', name:'Hoodie Cascarón Errante', cat:'hollow', icon:'🧥', desc:'Tela tejida con seda de un reino insecto silencioso.', price:64.00, rarity:'rare' },
  { id:'p08', name:'Poster Catedral del Eclipse', cat:'penitent', icon:'🖼️', desc:'Edición litográfica de la catedral hundida en sangre.', price:32.00, rarity:'rare' },
  { id:'p09', name:'Figura Coleccionable: Caballero Sin Nombre', cat:'collector', icon:'🗿', desc:'Edición numerada, 1/500. Sellada en cera de hoguera.', price:215.00, rarity:'legendary' },
  { id:'p10', name:'Reliquia del Alma Desvanecida', cat:'soulsborne', icon:'🔮', desc:'Fragmento de un alma que aún busca su hoguera.', price:88.00, rarity:'cursed' },
  { id:'p11', name:'Corona del Rey Marchito', cat:'collector', icon:'👑', desc:'Edición de colección. Incluye certificado de autenticidad.', price:398.00, rarity:'legendary' },
  { id:'p12', name:'Daga de la Hilandera Silenciosa', cat:'hollow', icon:'🗡️', desc:'Tan fina como el hilo que teje el destino del reino.', price:156.00, rarity:'rare' },
  { id:'p13', name:'Rosario de Huesos Bendecidos', cat:'penitent', icon:'📿', desc:'Cuentas talladas en hueso de penitentes anónimos.', price:54.00, rarity:'rare' },
  { id:'p14', name:'Escudo del Último Bastión', cat:'soulsborne', icon:'🛡️', desc:'Resistió el asedio final de un reino que ya no existe.', price:172.00, rarity:'legendary' },
  { id:'p15', name:'Figura: Hilandera de Seda y Sombra', cat:'collector', icon:'🕷️', desc:'Edición coleccionista con base iluminada LED.', price:249.00, rarity:'legendary' },
  { id:'p16', name:'Vela de Cera Ceniza', cat:'hollow', icon:'🕯️', desc:'Arde con una llama que nunca termina de consumirse.', price:28.00, rarity:'rare' },
];

// Convención automática: cada producto busca su imagen en images/{id}.jpg
// Si el archivo no existe, el onerror del <img> muestra el emoji de respaldo.
// Para agregar una foto nueva, solo hay que poner el archivo con ese nombre exacto
// en la carpeta /images — no hace falta tocar este script.
function imgPathFor(product){
  return `images/${product.id}.jpg`;
}

const RARITY_LABEL = { legendary:'Legendaria', rare:'Rara', cursed:'Maldita' };
const CAT_LABEL = { soulsborne:'Soulsborne', hollow:'Hollow Realm', penitent:'Penitent Relics', collector:'Collector Editions' };

/* ---------------------------------------------------------
   2. RENDER DE CATÁLOGO + FILTROS
--------------------------------------------------------- */
const productGrid = document.getElementById('productGrid');
const filterBar = document.getElementById('filterBar');

function renderProducts(filter = 'all'){
  productGrid.innerHTML = '';
  const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);

  list.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.style.transitionDelay = `${(i % 8) * 60}ms`;
    card.innerHTML = `
      <div class="product-media">
        <span class="product-rarity rarity-${p.rarity}">${RARITY_LABEL[p.rarity]}</span>
        <img src="${imgPathFor(p)}" alt="${p.name}" class="product-photo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="product-icon" style="display:none">${p.icon}</span>
      </div>
      <div class="product-body">
        <p class="product-cat">${CAT_LABEL[p.cat]}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="product-price">$${p.price.toFixed(2)}</span>
          <button class="add-btn" data-id="${p.id}">Añadir al carrito</button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
    // forzamos reflow para animación de entrada escalonada
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('show')));
  });

  // listeners de "añadir"
  productGrid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.id);
      btn.classList.add('added');
      const original = btn.textContent;
      btn.textContent = 'Añadido ✓';
      setTimeout(() => { btn.classList.remove('added'); btn.textContent = original; }, 1100);
    });
  });
}

filterBar.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if(!btn) return;
  filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(btn.dataset.filter);
});

renderProducts();

/* ---------------------------------------------------------
   3. CARRITO (con persistencia en localStorage)
--------------------------------------------------------- */
const CART_KEY = 'ashenRelicsCart';
let cart = loadCart();

function loadCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id){
  const existing = cart.find(item => item.id === id);
  if(existing){ existing.qty += 1; }
  else{ cart.push({ id, qty:1 }); }
  saveCart();
  renderCart();
  showToast('Reliquia añadida a tu inventario');
}

function changeQty(id, delta){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ cart = cart.filter(i => i.id !== id); }
  saveCart();
  renderCart();
}

function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartSubtotalEl = document.getElementById('cartSubtotal');

function renderCart(){
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  cartCountEl.textContent = totalQty;

  if(cart.length === 0){
    cartItemsEl.innerHTML = `<p class="cart-empty">Tu inventario está vacío.<br>Ninguna reliquia te acompaña aún.</p>`;
    cartSubtotalEl.textContent = '$0.00';
    return;
  }

  let subtotal = 0;
  cartItemsEl.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    if(!p) return '';
    const lineTotal = p.price * item.qty;
    subtotal += lineTotal;
    return `
      <div class="cart-item">
        <div class="cart-item-icon">${p.icon}</div>
        <div class="cart-item-info">
          <h5>${p.name}</h5>
          <div class="cart-item-qty">
            <button data-id="${p.id}" data-delta="-1">−</button>
            <span>${item.qty}</span>
            <button data-id="${p.id}" data-delta="1">+</button>
          </div>
        </div>
        <div>
          <div class="cart-item-price">$${lineTotal.toFixed(2)}</div>
          <button class="cart-item-remove" data-remove="${p.id}">Quitar</button>
        </div>
      </div>
    `;
  }).join('');

  cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  cartItemsEl.querySelectorAll('[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => changeQty(btn.dataset.id, Number(btn.dataset.delta)));
  });
  cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });
}

renderCart();

/* Panel lateral */
const cartToggle = document.getElementById('cartToggle');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');

function openCart(){ cartPanel.classList.add('open'); cartOverlay.classList.add('open'); }
function closeCart(){ cartPanel.classList.remove('open'); cartOverlay.classList.remove('open'); }

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

/* ---------------------------------------------------------
   4. TOAST
--------------------------------------------------------- */
const toast = document.getElementById('toast');
let toastTimer = null;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ---------------------------------------------------------
   5. NAVBAR scroll + menú móvil
--------------------------------------------------------- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive:true });

const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ---------------------------------------------------------
   6. SCROLL REVEAL (IntersectionObserver)
--------------------------------------------------------- */
const revealEls = document.querySelectorAll('.reveal-up');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold:.15 });
revealEls.forEach(el => revealObserver.observe(el));

/* ---------------------------------------------------------
   7. CURSOR PERSONALIZADO
--------------------------------------------------------- */
const emberCursor = document.getElementById('emberCursor');
if(window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('mousemove', e => {
    emberCursor.style.left = e.clientX + 'px';
    emberCursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, input').forEach(el => {
    el.addEventListener('mouseenter', () => emberCursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => emberCursor.classList.remove('cursor-hover'));
  });
}

/* ---------------------------------------------------------
   8. PARTÍCULAS AMBIENTALES (canvas — cenizas flotantes)
--------------------------------------------------------- */
const canvas = document.getElementById('emberCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function createParticles(count){
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    speedY: Math.random() * 0.4 + 0.1,
    speedX: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.5 + 0.15,
    flicker: Math.random() * 0.02
  }));
}
createParticles(window.innerWidth < 700 ? 36 : 70);

function animateParticles(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.y -= p.speedY;
    p.x += p.speedX;
    p.alpha += (Math.random() - 0.5) * p.flicker;
    p.alpha = Math.max(0.08, Math.min(0.6, p.alpha));

    if(p.y < -10){ p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
    if(p.x < -10) p.x = canvas.width + 10;
    if(p.x > canvas.width + 10) p.x = -10;

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
    grad.addColorStop(0, `rgba(233,200,115,${p.alpha})`);
    grad.addColorStop(1, 'rgba(233,200,115,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
    ctx.fill();
  });
  if(!reduceMotion) requestAnimationFrame(animateParticles);
}
if(!reduceMotion) animateParticles();
else{
  // dibujar un único frame estático si se prefiere menos movimiento
  animateParticles = () => {};
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

/* ---------------------------------------------------------
   9. LOADING SCREEN
--------------------------------------------------------- */
window.addEventListener('load', () => {
  const fill = document.getElementById('loadingFill');
  const screen = document.getElementById('loadingScreen');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 6;
    if(progress >= 100){
      progress = 100;
      clearInterval(interval);
      fill.style.width = '100%';
      setTimeout(() => screen.classList.add('hidden'), 350);
    } else {
      fill.style.width = progress + '%';
    }
  }, 180);
});

/* ---------------------------------------------------------
   10. SONIDO AMBIENTE (opcional, requiere interacción del usuario)
--------------------------------------------------------- */
const ambientAudio = document.getElementById('ambientAudio');
const soundToggle = document.getElementById('soundToggle');
const iconOff = soundToggle.querySelector('.icon-sound-off');
const iconOn = soundToggle.querySelector('.icon-sound-on');

soundToggle.addEventListener('click', async () => {
  try{
    if(ambientAudio.paused){
      ambientAudio.volume = 0.35;
      await ambientAudio.play();
      soundToggle.classList.add('active');
      iconOff.hidden = true; iconOn.hidden = false;
    } else {
      ambientAudio.pause();
      soundToggle.classList.remove('active');
      iconOff.hidden = false; iconOn.hidden = true;
    }
  }catch(err){
    showToast('El sonido ambiente no pudo activarse');
  }
});

/* ---------------------------------------------------------
   11. COMUNIDAD: testimonios, ranking y noticias (datos ficticios)
--------------------------------------------------------- */
const TESTIMONIALS = [
  { text:'Cada reliquia que compré parece tener su propia historia. El anillo del vacío penitente cambió mi escritorio para siempre.', author:'— Caballero_de_Ceniza99' },
  { text:'El empaque llega como si hubiese cruzado un reino moribundo. Detalles góticos hasta en la caja.', author:'— Hollow_Pilgrim' },
  { text:'Compré la corona del rey marchito para mi colección. Pieza numerada, certificado incluido, una locura de calidad.', author:'— Lady_Penitent' },
];
const RANKINGS = [
  { name:'Caballero_de_Ceniza99', score:'2,480 reliquias' },
  { name:'Hollow_Pilgrim', score:'1,975 reliquias' },
  { name:'Lady_Penitent', score:'1,602 reliquias' },
  { name:'AshenWanderer_X', score:'1,340 reliquias' },
];
const NEWS = [
  { date:'12 Jun 2026', title:'Nueva colección: Hilanderas del Silencio', text:'Doce piezas inspiradas en el reino insecto llegan este verano.' },
  { date:'02 Jun 2026', title:'Evento: Vigilia de la Hoguera', text:'Transmisión en vivo con coleccionistas y artistas invitados.' },
  { date:'21 May 2026', title:'Restock: Corona del Rey Marchito', text:'Solo 50 unidades numeradas disponibles este mes.' },
];

document.getElementById('testimonialTrack').innerHTML = TESTIMONIALS.map(t => `
  <div class="testimonial"><p>"${t.text}"</p><span>${t.author}</span></div>
`).join('');

document.getElementById('rankList').innerHTML = RANKINGS.map((r, i) => `
  <li class="rank-item">
    <span class="rank-pos">${String(i+1).padStart(2,'0')}</span>
    <span class="rank-name">${r.name}</span>
    <span class="rank-score">${r.score}</span>
  </li>
`).join('');

document.getElementById('newsGrid').innerHTML = NEWS.map(n => `
  <article class="news-card">
    <span class="news-date">${n.date}</span>
    <h4>${n.title}</h4>
    <p>${n.text}</p>
  </article>
`).join('');

/* ---------------------------------------------------------
   12. NEWSLETTER (simulado)
--------------------------------------------------------- */
const newsletterForm = document.getElementById('newsletterForm');
const newsletterMsg = document.getElementById('newsletterMsg');
newsletterForm.addEventListener('submit', e => {
  e.preventDefault();
  newsletterMsg.textContent = 'Tu nombre ha sido grabado en el códice. Bienvenido, peregrino.';
  newsletterForm.reset();
});

/* ---------------------------------------------------------
   13. EASTER EGG — código Konami invoca una runa secreta
--------------------------------------------------------- */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIndex = 0;
const easterEgg = document.getElementById('easterEgg');

window.addEventListener('keydown', e => {
  const key = e.key;
  if(key === KONAMI[konamiIndex]){
    konamiIndex++;
    if(konamiIndex === KONAMI.length){
      easterEgg.classList.add('show');
      setTimeout(() => easterEgg.classList.remove('show'), 4200);
      konamiIndex = 0;
    }
  } else {
    konamiIndex = (key === KONAMI[0]) ? 1 : 0;
  }
});

/* Easter egg secundario: clic 5 veces en el logo */
let logoClicks = 0;
document.querySelector('.brand').addEventListener('click', (e) => {
  logoClicks++;
  if(logoClicks >= 5){
    e.preventDefault();
    easterEgg.classList.add('show');
    setTimeout(() => easterEgg.classList.remove('show'), 4200);
    logoClicks = 0;
  }
});
