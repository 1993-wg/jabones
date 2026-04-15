// Configuración Supabase
const SUPABASE_URL = 'https://jqxhwdyqdexeqsepvxrp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KM5StM0sLaDsgi0k7-5i-w_lO_kBvj6';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Credenciales simples (Hardcoded para entorno estático)
const ADMIN_USER = "jero";
const ADMIN_PASS = "Olea2026";

// Elementos DOM
const loginSec = document.getElementById('login-section');
const dashSec = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const tbody = document.getElementById('product-tbody');
const addBtn = document.getElementById('add-new-btn');
const modal = document.getElementById('product-modal');
const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');

let dbProducts = [];

// Manejo de Sesión
const checkAuth = () => {
    if (sessionStorage.getItem('olea_admin') === 'true') {
        loginSec.style.display = 'none';
        dashSec.style.display = 'block';
        loadProductsFromDB();
    } else {
        loginSec.style.display = 'flex';
        dashSec.style.display = 'none';
        tbody.innerHTML = '';
    }
};

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value.trim();

    if (user === ADMIN_USER.toLowerCase() && pass === ADMIN_PASS) {
        sessionStorage.setItem('olea_admin', 'true');
        checkAuth();
    } else {
        errorMsg.innerText = "Credenciales incorrectas";
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('olea_admin');
    checkAuth();
});

// Formatear moneda 
const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

// Cargar desde Supabase
const loadProductsFromDB = async () => {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

    const { data, error } = await supabaseClient.from('jabones').select('*').order('id', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error de conexión con la base de datos</td></tr>';
        return;
    }

    dbProducts = data;
    renderTable();
};

const renderTable = () => {
    tbody.innerHTML = '';

    if (dbProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos guardados.</td></tr>';
        return;
    }

    dbProducts.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image}" class="prod-img" alt="${p.name}"></td>
            <td><strong>${p.name}</strong></td>
            <td>${formatMoney(p.price)}</td>
            <td><small style="background:#eef2f5; padding:2px 8px; border-radius:12px;">${p.category || 'Jabones corporales'}</small></td>
            <td style="max-width:200px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${p.description}</td>
            <td class="actions-cell">
                <button class="icon-btn edit-btn" onclick="editProduct(${p.id})"><i class='bx bx-edit-alt'></i></button>
                <button class="icon-btn del-btn" onclick="deleteProduct(${p.id})"><i class='bx bx-trash'></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// CRUD en Supabase
addBtn.addEventListener('click', () => {
    productForm.reset();
    document.getElementById('prod-id').value = '';
    modalTitle.innerText = "Agregar Nuevo Producto";
    modal.classList.add('active');
});

closeModalBtns.forEach(btn => btn.addEventListener('click', () => {
    modal.classList.remove('active');
}));

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = productForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Guardando...";
    submitBtn.disabled = true;

    const idField = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const desc = document.getElementById('prod-desc').value;
    const price = parseFloat(document.getElementById('prod-price').value);

    // IMAGE HANDLING
    let imageUrl = document.getElementById('prod-image').value;
    const fileInput = document.getElementById('prod-image-file');
    const file = fileInput.files[0];

    // Logica de subida a Storage si se selecciono archivo
    if (file) {
        submitBtn.innerText = "Subiendo imagen...";
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabaseClient.storage.from('jabones').upload(filePath, file);
        if (error) {
            alert("Error subiendo la imagen: (Asegúrate de haber creado el bucket público 'jabones' en Supabase) - " + error.message);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            return;
        }

        const { data: publicData } = supabaseClient.storage.from('jabones').getPublicUrl(filePath);
        imageUrl = publicData.publicUrl;
    }

    if (!imageUrl) {
        alert("Por favor, sube una imagen o proporciona una URL válida.");
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        return;
    }

    const payload = { name, description: desc, price, category, image: imageUrl };

    if (idField) {
        // Edit 
        const { error } = await supabaseClient.from('jabones').update(payload).eq('id', idField);
        if (error) alert("Error actualizando producto: " + error.message);
    } else {
        // Add
        const { error } = await supabaseClient.from('jabones').insert([payload]);
        if (error) alert("Error añadiendo producto: " + error.message);
    }

    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
    modal.classList.remove('active');

    // Recargar tabla para traer los nuevos IDs si se insertó uno
    loadProductsFromDB();
});

window.editProduct = (id) => {
    productForm.reset();
    document.getElementById('prod-id').value = '';

    const product = dbProducts.find(p => p.id == id);
    if (product) {
        document.getElementById('prod-id').value = product.id;
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-category').value = product.category || 'Jabones corporales';
        document.getElementById('prod-desc').value = product.description;
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-image').value = product.image;

        modalTitle.innerText = "Editar Producto";
        modal.classList.add('active');
    }
};

window.deleteProduct = async (id) => {
    if (confirm("¿Estás seguro de eliminar este producto? Esto se reflejará en vivo para todos los usuarios.")) {
        const { error } = await supabaseClient.from('jabones').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar: " + error.message);
            return;
        }
        loadProductsFromDB();
    }
};

// Init
checkAuth();
