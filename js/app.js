// js/app.js

// ==================== LÓGICA PRINCIPAL DO APLICATIVO ====================

// ==================== INICIALIZAÇÃO ====================
function initApp() {
    console.log("Inicializando aplicativo...");
    
    // Carrega os dados da empresa atual
    if (typeof loadCompanyData === 'function') {
        loadCompanyData();
    }
    
    // Configura eventos
    setupEventListeners();
    
    // Inicializa interface
    initUI();
    
    console.log("Aplicativo inicializado com sucesso!");
}

function setupEventListeners() {
    console.log("Configurando event listeners...");
    
    // Configura formulário de veículo
    const formVehicle = document.getElementById('form-vehicle');
    if (formVehicle) {
        formVehicle.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVehicle();
        });
    }
    
    // Configura data atual para campo de manutenção
    const mDate = document.getElementById('m-date');
    if (mDate) {
        const today = new Date().toISOString().split('T')[0];
        mDate.value = today;
        mDate.min = '2000-01-01';
        mDate.max = today;
    }
    
    // Configura busca rápida
    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) {
        quickSearch.addEventListener('change', function() {
            if (this.value) {
                openEditVehicleModal(this.value);
                this.value = ''; // Reseta após seleção
            }
        });
    }
    
    // Configura tecla ESC para fechar modais
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
            if (openModals.length > 0) {
                // Fecha o último modal aberto
                const lastModal = openModals[openModals.length - 1];
                closeModal(lastModal.id);
            }
        }
    });
    
    // Configura atualização automática do KM quando adiciona manutenção
    const mKm = document.getElementById('m-km');
    if (mKm) {
        mKm.addEventListener('input', function() {
            const vKm = document.getElementById('v-km');
            const maintKm = parseInt(this.value) || 0;
            const currentKm = parseInt(vKm.value) || 0;
            
            // Destaca se o KM da manutenção for maior
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
    // Configura tooltips
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(element => {
        element.classList.add('tooltip');
    });
    
    // Configura botões com ícones
    const actionButtons = document.querySelectorAll('button:not(.nav-item)');
    actionButtons.forEach(button => {
        if (button.innerHTML.includes('<i class="')) {
            button.classList.add('btn-action');
        }
    });
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    console.log("Renderizando dashboard...");
    
    if (!vehicles || !units) return;
    
    // Contadores
    const dashVCount = document.getElementById('dash-v-count');
    const dashUCount = document.getElementById('dash-u-count');
    const dashInativos = document.getElementById('dash-inativos');
    
    if (dashVCount) dashVCount.textContent = vehicles.length;
    if (dashUCount) dashUCount.textContent = units.length;
    
    // Veículos sem atualização (mais de 15 dias)
    const hoje = Date.now();
    const inativos = vehicles.filter(v => {
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt || 0;
        return (hoje - lastUpdate) > (15 * 24 * 60 * 60 * 1000);
    });
    
    if (dashInativos) {
        dashInativos.textContent = inativos.length;
        
        // Destaca se houver inativos
        if (inativos.length > 0) {
            dashInativos.classList.add('text-red-600');
            dashInativos.classList.remove('text-amber-600');
        } else {
            dashInativos.classList.remove('text-red-600');
            dashInativos.classList.add('text-amber-600');
        }
    }
    
    // Botão de alerta
    const alertCont = document.getElementById('alert-container');
    if (alertCont) {
        const managerEmail = localStorage.getItem('managerEmail_' + (currentCompany ? currentCompany.id : ''));
        
        if (inativos.length > 0 && managerEmail) {
            alertCont.innerHTML = `
                <button onclick="sendInactiveAlert(${inativos.length})" 
                        class="w-full mt-2 text-xs bg-red-100 text-red-700 p-2 rounded font-bold hover:bg-red-200 transition">
                    <i class="fas fa-bell mr-1"></i> Enviar Alerta (${inativos.length} veículos)
                </button>
            `;
        } else {
            alertCont.innerHTML = '';
        }
    }
    
    // Atividade recente
    const recent = document.getElementById('recent-list');
    if (recent) {
        const sorted = [...vehicles].sort((a,b) => {
            const timeA = b.lastUpdate || b.updatedAt || b.createdAt || 0;
            const timeB = a.lastUpdate || a.updatedAt || a.createdAt || 0;
            return timeB - timeA;
        });
        
        const recentVehicles = sorted.slice(0, 4);
        
        if (recentVehicles.length === 0) {
            recent.innerHTML = `
                <div class="empty-state p-6">
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
                                <p class="text-[9px] text-slate-500 mt-1">${timeAgo}</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-500">${(v.km || 0).toLocaleString()} KM</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Grid de unidades
    const unitGrid = document.getElementById('unit-grid');
    if (unitGrid) {
        if (units.length === 0) {
            unitGrid.innerHTML = `
                <div class="empty-state p-6 col-span-full">
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
            unitGrid.innerHTML = units.map(u => {
                const count = vehicles.filter(v => v.unitId === u.id || v.unitName === u.name).length;
                
                return `
                    <div class="bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-300 transition group unit-card">
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
    console.log("Renderizando veículos...");
    
    const vehiclesToShow = list || vehicles;
    const table = document.getElementById('table-vehicles');
    
    if (!table) return;
    
    if (vehiclesToShow.length === 0) {
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
    
    // Atualiza o título
    const title = document.getElementById('vehicle-list-title');
    if (title) {
        if (list && list !== vehicles) {
            title.innerHTML = `Veículos Filtrados <span class="text-blue-600">(${list.length})</span>`;
        } else {
            title.innerHTML = `Todos os Veículos <span class="text-blue-600">(${vehicles.length})</span>`;
        }
    }
    
    // Atualiza busca rápida
    if (typeof updateQuickSearch === 'function') {
        updateQuickSearch();
    }
}

function saveVehicle() {
    const id = document.getElementById('v-id').value;
    const unitSelect = document.getElementById('v-unit-select');
    
    // Busca unidade selecionada
    let unitName = 'Sem Unidade';
    let unitId = '';
    
    if (unitSelect && unitSelect.value) {
        const selectedUnit = units.find(u => u.id === unitSelect.value);
        if (selectedUnit) {
            unitName = selectedUnit.name;
            unitId = selectedUnit.id;
        }
    }
    
    const vehicleData = {
        id: id || null,
        modelo: document.getElementById('v-model').value.trim(),
        type: document.getElementById('v-type').value,
        rentalCo: document.getElementById('v-type').value === 'locado' 
                  ? document.getElementById('v-rental-co').value.trim() 
                  : '',
        plateOff: document.getElementById('v-plate-off').value.trim().toUpperCase(),
        plateRes: document.getElementById('v-plate-res').value.trim().toUpperCase() || '',
        unitId: unitId,
        unitName: unitName,
        km: parseInt(document.getElementById('v-km').value) || 0,
        allMaintenanceDone: document.getElementById('v-all-maintenance-done').checked || false,
        maintenanceBaselineDate: new Date().toISOString().split('T')[0]
    };
    
    // Validação
    if (!vehicleData.modelo || !vehicleData.plateOff) {
        showToast("Preencha Modelo e Placa Oficial", "error");
        return;
    }
    
    if (vehicleData.km < 0) {
        showToast("KM não pode ser negativo", "error");
        return;
    }
    
    // Valida formato da placa (AAA-9999 ou AAA-1A23)
    const plateRegex = /^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$/;
    if (!plateRegex.test(vehicleData.plateOff)) {
        showToast("Placa oficial inválida. Use formato: AAA-9999", "error");
        return;
    }
    
    if (vehicleData.plateRes && !plateRegex.test(vehicleData.plateRes)) {
        showToast("Placa reservada inválida. Use formato: AAA-9999", "error");
        return;
    }
    
    // Verifica se placa já existe (exceto se estiver editando o mesmo veículo)
    const existingVehicle = vehicles.find(v => 
        v.plateOff === vehicleData.plateOff && 
        v.id !== id
    );
    
    if (existingVehicle) {
        showToast(`Já existe um veículo com a placa ${vehicleData.plateOff}`, "error");
        return;
    }
    
    // Mostra loading no botão
    const btn = document.querySelector('#footer-cadastro button[onclick="saveVehicle()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    // Salva no banco
    saveVehicle(vehicleData)
        .then(() => {
            showToast(id ? "Veículo atualizado!" : "Veículo criado!");
            closeModal('modal-veiculo');
        })
        .catch(error => {
            showToast("Erro ao salvar: " + error.message, "error");
        })
        .finally(() => {
            // Restaura botão
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

// ==================== UNIDADES ====================
function renderUnitsPage() {
    console.log("Renderizando página de unidades...");
    
    const container = document.getElementById('units-list-page');
    if (!container) return;
    
    if (units.length === 0) {
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
    
    container.innerHTML = units.map(u => {
        const vehicleCount = vehicles.filter(v => v.unitId === u.id || v.unitName === u.name).length;
        
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

// ==================== FUNÇÕES UTILITÁRIAS ====================
function getTimeAgo(timestamp) {
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
    const managerEmail = localStorage.getItem('managerEmail_' + (currentCompany ? currentCompany.id : ''));
    
    if (!managerEmail) {
        showToast("Configure um e-mail para alertas primeiro", "error");
        switchPage('config');
        return;
    }
    
    // Busca veículos inativos
    const hoje = Date.now();
    const inativos = vehicles.filter(v => {
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt || 0;
        return (hoje - lastUpdate) > (15 * 24 * 60 * 60 * 1000);
    });
    
    const vehicleList = inativos.map(v => 
        `- ${v.modelo || 'Veículo'} (${v.plateOff || 'Sem placa'}) - Última atualização: ${getTimeAgo(v.lastUpdate || v.updatedAt || v.createdAt)}`
    ).join('\n');
    
    const subject = encodeURIComponent(`🚨 Alerta FrotaForte: ${count} veículos sem atualização`);
    const body = encodeURIComponent(`Olá,\n\n${count} veículos da sua frota não foram atualizados há mais de 15 dias:\n\n${vehicleList}\n\nAcesse o sistema para atualizar os veículos: ${window.location.origin}\n\nAtenciosamente,\nSistema FrotaForte - ${currentCompany ? currentCompany.name : ''}`);
    
    window.open(`mailto:${managerEmail}?subject=${subject}&body=${body}`, '_blank');
    showToast("E-mail preparado para envio", "success");
}

// ==================== INICIALIZAÇÃO AO CARREGAR ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, verificando autenticação...");
    
    // Configura data atual para campo de data
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
        input.max = today;
    });
    
    // Se já estiver logado, inicializa o app
    if (currentUser && currentCompany) {
        console.log("Usuário já autenticado, inicializando app...");
        setTimeout(() => {
            if (typeof initApp === 'function') {
                initApp();
            }
        }, 500);
    }
    
    // Configura navegação por teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl + N para novo veículo
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            if (currentUser) {
                openNewVehicleModal();
            }
        }
        
        // Ctrl + U para nova unidade
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            if (currentUser) {
                openUnitModal();
            }
        }
        
        // F1 para dashboard
        if (e.key === 'F1') {
            e.preventDefault();
            switchPage('dashboard');
        }
        
        // F2 para veículos
        if (e.key === 'F2') {
            e.preventDefault();
            switchPage('vehicles');
        }
        
        // F3 para unidades
        if (e.key === 'F3') {
            e.preventDefault();
            switchPage('units');
        }
    });
    
    // Adiciona tooltip para atalhos de teclado
    const helpText = `
        <div class="text-left">
            <p class="font-bold mb-2">Atalhos de Teclado:</p>
            <p><kbd>Ctrl + N</kbd> - Novo Veículo</p>
            <p><kbd>Ctrl + U</kbd> - Nova Unidade</p>
            <p><kbd>F1</kbd> - Dashboard</p>
            <p><kbd>F2</kbd> - Veículos</p>
            <p><kbd>F3</kbd> - Unidades</p>
            <p><kbd>ESC</kbd> - Fechar Modal</p>
        </div>
    `;
    
    // Adiciona tooltip ao botão de configurações
    const configBtn = document.querySelector('button[onclick="switchPage(\'config\')"]');
    if (configBtn) {
        configBtn.setAttribute('title', 'Configurações e Ajuda');
        configBtn.classList.add('tooltip');
        
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'tooltip-text';
        tooltipDiv.innerHTML = helpText;
        configBtn.appendChild(tooltipDiv);
    }
});

// ==================== EXPORTAÇÕES ====================
// Torna as funções disponíveis globalmente
window.initApp = initApp;
window.renderDashboard = renderDashboard;
window.renderVehicles = renderVehicles;
window.saveVehicle = saveVehicle;
window.renderUnitsPage = renderUnitsPage;
window.getTimeAgo = getTimeAgo;
window.sendInactiveAlert = sendInactiveAlert;

// Exporta para outros módulos
window.appModule = {
    initApp,
    renderDashboard,
    renderVehicles,
    saveVehicle,
    renderUnitsPage,
    getTimeAgo,
    sendInactiveAlert
};