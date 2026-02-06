// js/firebase-config.js

// ==================== CONFIGURAÇÃO DO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyD8yswxc2HS66Sjf-8XCUJ3ta7WY24_nEk",
    authDomain: "frotar-io.firebaseapp.com",
    databaseURL: "https://frotar-io-default-rtdb.firebaseio.com",
    projectId: "frotar-io",
    storageBucket: "frotar-io.firebasestorage.app",
    messagingSenderId: "68520426030",
    appId: "1:68520426030:web:91333e358781671648fdbf",
    measurementId: "G-RK7EW2NYJM"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Exporta as instâncias para usar em outros arquivos
const db = firebase.database();
const auth = firebase.auth();

// Variáveis globais para o sistema
let currentUser = null;
let currentCompany = null;
let deleteTarget = null;
let vehicles = [];
let units = [];
let maintenances = [];

// ==================== FUNÇÕES DE UTILIDADE GLOBAIS ====================

// Função para mostrar notificações (toast)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast border-l-${type === 'error' ? 'red' : 'emerald'}-500`;
    
    const icon = type === 'error' ? 'fa-times-circle text-red-500' : 
                 type === 'warning' ? 'fa-exclamation-triangle text-amber-500' : 
                 'fa-check-circle text-emerald-500';
    
    toast.innerHTML = `
        <i class="fas ${icon} text-lg"></i>
        <span class="font-bold text-sm text-slate-700">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove o toast após 4 segundos
    setTimeout(() => {
        if (toast.parentNode === container) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300);
        }
    }, 4000);
}

// Função para abrir modais
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        // Fecha o modal ao pressionar ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal(modalId);
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
}

// Função para fechar modais
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Função para alternar entre páginas
function switchPage(pageId) {
    // Esconde todas as páginas
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Remove classe active de todos os itens de navegação
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
    });
    
    // Mostra a página selecionada
    const pageElement = document.getElementById('page-' + pageId);
    if (pageElement) {
        pageElement.classList.remove('hidden');
    }
    
    // Ativa o item de navegação correspondente
    const navElement = document.getElementById('nav-' + pageId);
    if (navElement) {
        navElement.classList.add('active');
    }
}

// Função para alternar entre abas no modal de veículo
function switchTab(tab) {
    // Remove classes ativas de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
    });
    
    // Esconde todos os conteúdos
    const formVehicle = document.getElementById('form-vehicle');
    const contentManutencao = document.getElementById('content-manutencao');
    const footerCadastro = document.getElementById('footer-cadastro');
    const footerManutencao = document.getElementById('footer-manutencao');
    
    if (formVehicle) formVehicle.classList.add('hidden');
    if (contentManutencao) contentManutencao.classList.add('hidden');
    if (footerCadastro) footerCadastro.classList.add('hidden');
    if (footerManutencao) footerManutencao.classList.add('hidden');
    
    // Ativa a aba clicada
    const tabElement = document.getElementById('tab-' + tab);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Mostra o conteúdo correspondente
    if (tab === 'cadastro') {
        if (formVehicle) formVehicle.classList.remove('hidden');
        if (footerCadastro) footerCadastro.classList.remove('hidden');
    } else if (tab === 'manutencao') {
        if (contentManutencao) contentManutencao.classList.remove('hidden');
        if (footerManutencao) footerManutencao.classList.remove('hidden');
    }
}

// Função para mostrar/ocultar campo de locadora
function toggleRentalField() {
    const type = document.getElementById('v-type');
    const group = document.getElementById('rental-company-group');
    
    if (!type || !group) return;
    
    if (type.value === 'locado') {
        group.classList.remove('hidden');
    } else {
        group.classList.add('hidden');
    }
}

// Função para resetar formulário de veículo
function resetVehicleForm() {
    const form = document.getElementById('form-vehicle');
    if (form) {
        form.reset();
        document.getElementById('v-id').value = '';
        document.getElementById('v-type').value = 'propria';
        toggleRentalField();
        
        // Limpa campos de manutenção também
        const mDesc = document.getElementById('m-desc');
        const mDate = document.getElementById('m-date');
        const mKm = document.getElementById('m-km');
        const mLocation = document.getElementById('m-location');
        
        if (mDesc) mDesc.value = '';
        if (mDate) mDate.value = '';
        if (mKm) mKm.value = '';
        if (mLocation) mLocation.value = '';
        
        // Limpa lista de manutenções
        const maintenanceList = document.getElementById('maintenance-list');
        if (maintenanceList) {
            maintenanceList.innerHTML = '';
        }
    }
}

// Função para atualizar seletor de unidades
function updateUnitSelect() {
    const select = document.getElementById('v-unit-select');
    if (!select) return;
    
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Selecione a Unidade...</option>';
    
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = unit.name;
        select.appendChild(option);
    });
    
    // Restaura o valor anterior
    if (currentValue) {
        select.value = currentValue;
    }
}

// Função para filtrar veículos por unidade
function filterByUnit(unitName) {
    const filteredVehicles = vehicles.filter(v => v.unitName === unitName);
    const title = document.getElementById('vehicle-list-title');
    
    if (title) {
        title.innerHTML = `Veículos da Unidade: <span class="text-blue-600">${unitName}</span>`;
    }
    
    switchPage('vehicles');
    
    // Renderiza os veículos filtrados
    if (typeof renderVehicles === 'function') {
        renderVehicles(filteredVehicles);
    }
}

// Função para fazer logout
function logout() {
    if (auth) {
        auth.signOut().then(() => {
            window.location.reload();
        });
    }
}

// Exporta variáveis e funções globais
window.firebaseConfig = {
    db,
    auth,
    currentUser,
    currentCompany,
    deleteTarget,
    vehicles,
    units,
    maintenances,
    firebaseConfig
};

// Torna as funções disponíveis globalmente
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchPage = switchPage;
window.switchTab = switchTab;
window.toggleRentalField = toggleRentalField;
window.resetVehicleForm = resetVehicleForm;
window.updateUnitSelect = updateUnitSelect;
window.filterByUnit = filterByUnit;
window.logout = logout;