// js/app.js

// ==================== LÓGICA PRINCIPAL DO APLICATIVO ====================

// ==================== INICIALIZAÇÃO ====================
function initApp() {
    console.log("🚀 Inicializando aplicativo...");
    console.log("window.currentCompany:", window.currentCompany);
    console.log("window.currentUser:", window.currentUser);
    
    if (!window.currentCompany || !window.currentCompany.id) {
        console.error("❌ Nenhuma empresa selecionada para carregar dados");
        return;
    }
    
    if (typeof loadCompanyData === 'function') {
        loadCompanyData();
    }
    
    setupEventListeners();
    initUI();
    
    console.log("✅ Aplicativo inicializado com sucesso!");
}

function setupEventListeners() {
    console.log("🔧 Configurando event listeners...");
    
    const formVehicle = document.getElementById('form-vehicle');
    if (formVehicle) {
        formVehicle.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVehicle();
        });
    }
    
    const mDate = document.getElementById('m-date');
    if (mDate) {
        const today = new Date().toISOString().split('T')[0];
        mDate.value = today;
        mDate.min = '2000-01-01';
        mDate.max = today;
    }
    
    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) {
        quickSearch.addEventListener('change', function() {
            if (this.value) {
                openEditVehicleModal(this.value);
                this.value = '';
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
            if (openModals.length > 0) {
                const lastModal = openModals[openModals.length - 1];
                closeModal(lastModal.id);
            }
        }
    });
    
    const mKm = document.getElementById('m-km');
    if (mKm) {
        mKm.addEventListener('input', function() {
            const vKm = document.getElementById('v-km');
            const maintKm = parseInt(this.value) || 0;
            const currentKm = parseInt(vKm.value) || 0;
            
            if (maintKm > currentKm) {
                vKm.style.borderColor = '#10b981';
                vKm.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.2)';
            } else {
                vKm.style.borderColor = '';
                vKm.style.boxShadow = '';
            }
        });
    }
}

function initUI() {
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(element => {
        element.classList.add('tooltip');
    });
    
    const actionButtons = document.querySelectorAll('button:not(.nav-item)');
    actionButtons.forEach(button => {
        if (button.innerHTML.includes('<i class="')) {
            button.classList.add('btn-action');
        }
    });
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    console.log("📊 Renderizando dashboard...");
    console.log("Veículos:", window.vehicles?.length);
    console.log("Unidades:", window.units?.length);
    
    if (!window.vehicles || !window.units) {
        console.log("⏳ Aguardando dados...");
        return;
    }
    
    const hoje = Date.now();
    const INACTIVE_DAYS = 15;
    const inactiveThreshold = INACTIVE_DAYS * 24 * 60 * 60 * 1000;
    
    const inativos = window.vehicles.filter(v => {
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt || 0;
        return (hoje - lastUpdate) > inactiveThreshold;
    });
    
    const dashVCount = document.getElementById('dash-v-count');
    const dashUCount = document.getElementById('dash-u-count');
    const dashInativos = document.getElementById('dash-inativos');
    
    if (dashVCount) dashVCount.textContent = window.vehicles.length;
    if (dashUCount) dashUCount.textContent = window.units.length;
    
    if (dashInativos) {
        dashInativos.textContent = inativos.length;
        
        if (inativos.length > 0) {
            dashInativos.classList.add('text-red-600');
            dashInativos.classList.remove('text-amber-600');
        } else {
            dashInativos.classList.remove('text-red-600');
            dashInativos.classList.add('text-amber-600');
        }
    }
    
    const alertCont = document.getElementById('alert-container');
    if (alertCont) {
        const managerEmail = localStorage.getItem('managerEmail_' + (window.currentCompany ? window.currentCompany.id : ''));
        
        if (inativos.length > 0 && managerEmail) {
            alertCont.innerHTML = `
                <button onclick="sendDetailedAlert()" 
                        class="w-full mt-2 text-xs bg-red-100 text-red-700 p-2 rounded font-bold hover:bg-red-200 transition">
                    <i class="fas fa-bell mr-1"></i> Enviar Alerta (${inativos.length} veículos)
                </button>
            `;
        } else {
            alertCont.innerHTML = '';
        }
    }
    
    // ATIVIDADE RECENTE - CORRIGIDA (usa lastUpdate ou updatedAt)
    const recent = document.getElementById('recent-list');
    if (recent) {
        const sorted = [...window.vehicles].sort((a,b) => {
            const timeA = b.lastUpdate || b.updatedAt || b.createdAt || 0;
            const timeB = a.lastUpdate || a.updatedAt || a.createdAt || 0;
            return timeA - timeB;
        });
        
        const recentVehicles = sorted.slice(0, 4);
        
        if (recentVehicles.length === 0) {
            recent.innerHTML = `
                <div class="empty-state p-6 text-center">
                    <i class="fas fa-car text-4xl text-slate-300 mb-4"></i>
                    <p class="text-slate-500">Nenhum veículo cadastrado</p>
                    <button onclick="openNewVehicleModal()" 
                            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Adicionar Primeiro Veículo
                    </button>
                </div>
            `;
        } else {
            recent.innerHTML = recentVehicles.map(v => {
                const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt;
                const timeAgo = lastUpdate ? getTimeAgo(lastUpdate) : 'Nunca atualizado';
                
                return `
                    <div class="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer" 
                         onclick="openEditVehicleModal('${v.id}')">
                        <div class="flex items-center gap-3">
                            <div class="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-slate-800 truncate max-w-[180px]">${v.modelo || 'Sem nome'}</p>
                                <p class="text-[10px] text-slate-400 uppercase">${v.plateOff || 'Sem placa'} • ${v.unitName || '-'}</p>
                                <p class="text-[9px] text-slate-500 mt-1">🕐 ${timeAgo}</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-500">${(v.km || 0).toLocaleString()} KM</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    const unitGrid = document.getElementById('unit-grid');
    if (unitGrid) {
        if (window.units.length === 0) {
            unitGrid.innerHTML = `
                <div class="empty-state p-6 col-span-full text-center">
                    <i class="fas fa-building text-4xl text-slate-300 mb-4"></i>
                    <p class="text-slate-500">Nenhuma unidade cadastrada</p>
                    <p class="text-slate-400 text-sm mt-2">Cadastre unidades para organizar sua frota</p>
                    <button onclick="openUnitModal()" 
                            class="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">
                        <i class="fas fa-plus mr-2"></i>Criar Primeira Unidade
                    </button>
                </div>
            `;
        } else {
            unitGrid.innerHTML = window.units.map(u => {
                const count = window.vehicles.filter(v => v.unitId === u.id || v.unitName === u.name).length;
                
                return `
                    <div class="bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-300 transition unit-card">
                        <div class="flex justify-between items-start mb-2">
                            <div class="max-w-[70%]">
                                <h4 class="text-sm font-bold text-slate-700 truncate">${u.name}</h4>
                                <p class="text-[10px] text-slate-400 truncate">${u.city || ''}</p>
                            </div>
                            <span class="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md count-badge">
                                ${count}
                            </span>
                        </div>
                        <div class="flex gap-2 mt-3">
                            <button onclick="filterByUnit('${u.name.replace(/'/g, "\\'")}')" 
                                    class="flex-1 text-xs bg-blue-50 text-blue-600 py-1 rounded font-bold hover:bg-blue-100 transition">
                                Ver Veículos
                            </button>
                            <button onclick="openUnitModal('${u.id}')" 
                                    class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// ==================== VEÍCULOS ====================
function renderVehicles(list = null) {
    console.log("🚗 Renderizando veículos...");
    
    const vehiclesToShow = list || window.vehicles;
    const table = document.getElementById('table-vehicles');
    
    if (!table) return;
    
    if (!vehiclesToShow || vehiclesToShow.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="p-8 text-center">
                    <div class="empty-state">
                        <i class="fas fa-car text-4xl text-slate-300 mb-4"></i>
                        <p class="text-slate-500">Nenhum veículo encontrado</p>
                        <button onclick="openNewVehicleModal()" 
                                class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Adicionar Primeiro Veículo
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = vehiclesToShow.map(v => {
        const tipoBadge = v.type === 'locado' 
            ? `<span class="status-locado px-2 py-1 rounded font-bold">Locado ${v.rentalCo ? `(${v.rentalCo})` : ''}</span>`
            : `<span class="status-ativa px-2 py-1 rounded font-bold">Própria</span>`;
        
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt;
        const timeAgo = lastUpdate ? getTimeAgo(lastUpdate) : 'Nunca';
        
        return `
            <tr id="row-${v.id}" class="hover:bg-slate-50 border-b transition table-row-hover">
                <td class="p-4">
                    <div class="font-bold text-slate-700">${v.modelo || 'Sem modelo'}</div>
                    <div class="text-[10px] text-slate-500 mt-1">
                        <i class="far fa-clock mr-1"></i>${timeAgo}
                    </div>
                </td>
                <td class="p-4 text-slate-500 font-mono text-sm">
                    <div class="font-bold">${v.plateOff || '---'}</div>
                    ${v.plateRes ? `<div class="text-[10px] text-slate-400">Res: ${v.plateRes}</div>` : ''}
                </td>
                <td class="p-4 text-xs">
                    ${tipoBadge}
                </td>
                <td class="p-4">
                    <span class="bg-slate-100 px-2 py-1 rounded text-xs font-bold">${v.unitName || '-'}</span>
                </td>
                <td class="p-4">
                    <div class="flex gap-2 justify-end">
                        <button onclick="openViewVehicleModal('${v.id}')" 
                                class="text-emerald-600 hover:text-emerald-800 font-bold text-xs uppercase bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 btn-action"
                                title="Ver detalhes">
                            <i class="fas fa-eye mr-1"></i> Ver
                        </button>
                        <button onclick="openEditVehicleModal('${v.id}')" 
                                class="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 btn-action"
                                title="Editar veículo">
                            <i class="fas fa-edit mr-1"></i> Editar
                        </button>
                        <button onclick="confirmDeleteVehicle('${v.id}', '${(v.modelo || 'Veículo').replace(/'/g, "\\'")}', '${v.plateOff || 'Sem placa'}')" 
                                class="text-red-600 hover:text-red-800 font-bold text-xs uppercase bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 btn-excluir"
                                title="Excluir veículo">
                            <i class="fas fa-trash mr-1"></i> Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    const title = document.getElementById('vehicle-list-title');
    if (title) {
        if (list && list !== window.vehicles) {
            title.innerHTML = `Veículos Filtrados <span class="text-blue-600">(${list.length})</span>`;
        } else {
            title.innerHTML = `Todos os Veículos <span class="text-blue-600">(${window.vehicles.length})</span>`;
        }
    }
    
    if (typeof updateQuickSearch === 'function') {
        updateQuickSearch();
    }
}

// ==================== UNIDADES ====================
function renderUnitsPage() {
    console.log("🏢 Renderizando página de unidades...");
    
    const container = document.getElementById('units-list-page');
    if (!container) return;
    
    if (!window.units || window.units.length === 0) {
        container.innerHTML = `
            <div class="col-span-full">
                <div class="empty-state p-8 text-center">
                    <i class="fas fa-building text-4xl text-slate-300 mb-4"></i>
                    <p class="text-slate-500">Nenhuma unidade cadastrada</p>
                    <p class="text-slate-400 text-sm mt-2">Cadastre unidades para organizar sua frota</p>
                    <button onclick="openUnitModal()" 
                            class="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">
                        <i class="fas fa-plus mr-2"></i>Criar Primeira Unidade
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = window.units.map(u => {
        const vehicleCount = window.vehicles.filter(v => v.unitId === u.id || v.unitName === u.name).length;
        
        return `
            <div class="border border-slate-200 rounded-xl p-5 hover:border-emerald-400 transition bg-slate-50 group">
                <div class="flex justify-between items-start mb-4">
                    <div class="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center text-emerald-600 text-xl">
                        <i class="fas fa-building"></i>
                    </div>
                    <span class="block text-2xl font-bold text-slate-800">
                        ${vehicleCount} 
                        <span class="text-[10px] uppercase text-slate-400">Veículos</span>
                    </span>
                </div>
                <h3 class="font-bold text-lg text-slate-800 mb-1">${u.name}</h3>
                <p class="text-sm text-slate-500 mb-4">${u.city || ''}</p>
                <div class="flex gap-2">
                    <button onclick="filterByUnit('${u.name.replace(/'/g, "\\'")}')" 
                            class="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm font-bold hover:bg-white hover:text-emerald-600 transition">
                        Ver Frota
                    </button>
                    <button onclick="openUnitModal('${u.id}')" 
                            class="w-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" 
                            title="Editar unidade">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button onclick="confirmDeleteUnit('${u.id}', '${u.name.replace(/'/g, "\\'")}')" 
                            class="w-10 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition" 
                            title="Excluir unidade">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterByUnit(unitName) {
    const filtered = window.vehicles.filter(v => v.unitName === unitName);
    renderVehicles(filtered);
    showToast(`Filtrando veículos da unidade: ${unitName}`, "info");
    switchPage('vehicles');
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Nunca';
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else if (hours > 0) {
        return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else if (minutes > 0) {
        return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else {
        return 'Agora mesmo';
    }
}

function sendInactiveAlert(count) {
    const managerEmail = localStorage.getItem('managerEmail_' + (window.currentCompany ? window.currentCompany.id : ''));
    
    if (!managerEmail) {
        showToast("Configure um e-mail para alertas primeiro", "error");
        switchPage('config');
        return;
    }
    
    const hoje = Date.now();
    const inativos = window.vehicles.filter(v => {
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt || 0;
        return (hoje - lastUpdate) > (15 * 24 * 60 * 60 * 1000);
    });
    
    const vehicleList = inativos.map(v => 
        `- ${v.modelo || 'Veículo'} (${v.plateOff || 'Sem placa'}) - Última atualização: ${getTimeAgo(v.lastUpdate || v.updatedAt || v.createdAt)}`
    ).join('\n');
    
    const subject = encodeURIComponent(`🚨 Alerta FrotaForte: ${count} veículos sem atualização`);
    const body = encodeURIComponent(`Olá,\n\n${count} veículos da sua frota não foram atualizados há mais de 15 dias:\n\n${vehicleList}\n\nAcesse o sistema para atualizar os veículos: ${window.location.origin}\n\nAtenciosamente,\nSistema FrotaForte - ${window.currentCompany ? window.currentCompany.name : ''}`);
    
    window.open(`mailto:${managerEmail}?subject=${subject}&body=${body}`, '_blank');
    showToast("E-mail preparado para envio", "success");
}

// ==================== EXPORTAÇÕES ====================
window.initApp = initApp;
window.renderDashboard = renderDashboard;
window.renderVehicles = renderVehicles;
window.renderUnitsPage = renderUnitsPage;
window.getTimeAgo = getTimeAgo;
window.sendInactiveAlert = sendInactiveAlert;
window.filterByUnit = filterByUnit;