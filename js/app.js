// Configuración Supabase
const SUPABASE_URL = 'https://jqxhwdyqdexeqsepvxrp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KM5StM0sLaDsgi0k7-5i-w_lO_kBvj6';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let cart = [];

// Elementos del DOM
const productsContainer = document.getElementById('products-container');
const cartSidebar = document.getElementById('cart-sidebar');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const overlay = document.getElementById('overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const totalPriceEl = document.getElementById('total-price');
const checkoutBtn = document.getElementById('checkout-btn');

// Formatear moneda (Pesos COP)
const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

// Cargar Productos desde Supabase
const fetchProducts = async () => {
    productsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Cargando productos naturales...</p>';
    const { data, error } = await supabaseClient.from('jabones').select('*').order('id', { ascending: true });
    
    if (error) {
        console.error('Error fetching Supabase data:', error);
        productsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:red;">No se pudieron cargar los productos.</p>';
        return;
    }
    
    products = data;
    renderProducts();
};

// Renderizar Productos
const renderProducts = () => {
    productsContainer.innerHTML = '';
    
    if(products.length === 0) {
        productsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay productos disponibles por el momento.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-price">${formatMoney(product.price)}</div>
                <button class="add-btn" onclick="addToCart(${product.id})">
                    Agregar al carrito
                </button>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
};

// Funciones del carrito
const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
        openCart();
    }
};

window.addToCart = addToCart;

const removeFromCart = (productId) => {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
};

window.removeFromCart = removeFromCart;

const updateCart = () => {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name} (x${item.quantity})</h4>
                <div class="cart-item-price">${formatMoney(item.price * item.quantity)}</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">
                <i class='bx bx-trash'></i>
            </button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted);">El carrito está vacío</p>';
    }

    cartCount.innerText = count;
    totalPriceEl.innerText = formatMoney(total);
};

// Toggle Carrito
const openCart = () => {
    cartSidebar.classList.add('active');
    overlay.classList.add('active');
};

const closeCart = () => {
    cartSidebar.classList.remove('active');
    overlay.classList.remove('active');
};

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

// Checkout WhatsApp
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    let message = "Hola Oléa Artesanal, me gustaría realizar el siguiente pedido:%0A%0A";
    let total = 0;

    cart.forEach(item => {
        message += `- ${item.quantity}x ${item.name} (${formatMoney(item.price * item.quantity)})%0A`;
        total += item.price * item.quantity;
    });

    message += `%0A*Total: ${formatMoney(total)}*%0A%0A`;
    message += "Quedo atento(a) para concretar el pago y envío.";

    const waNumber = "573043194458";
    const waUrl = `https://wa.me/${waNumber}?text=${message}`;
    
    window.open(waUrl, '_blank');
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCart();
});
