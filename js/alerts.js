// js/alerts.js - VERSÃO CORRIGIDA

console.log("🚗 Sistema de Alertas carregado!");

// ==================== VARIÁVEIS ====================
let resolvedAlerts = {};

function loadResolvedAlerts() {
    if (!window.currentCompany) return;
    const stored = localStorage.getItem(`resolvedAlerts_${window.currentCompany.id}`);
    if (stored) resolvedAlerts = JSON.parse(stored);
}

function saveResolvedAlerts() {
    if (!window.currentCompany) return;
    localStorage.setItem(`resolvedAlerts_${window.currentCompany.id}`, JSON.stringify(resolvedAlerts));
}

// ==================== CALCULAR VEÍCULOS INATIVOS (sem atualização de KM) ====================
function calculateInactiveVehicles() {
    if (!window.vehicles || window.vehicles.length === 0) return [];
    
    const hoje = Date.now();
    const INACTIVE_DAYS = 15;
    const inactiveThreshold = INACTIVE_DAYS * 24 * 60 * 60 * 1000;
    
    return window.vehicles.filter(v => {
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt || 0;
        const daysInactive = (hoje - lastUpdate) / (1000 * 60 * 60 * 24);
        
        if (daysInactive >= INACTIVE_DAYS) {
            const alertKey = `${v.id}_inactive`;
            return !resolvedAlerts[alertKey];
        }
        return false;
    });
}

// ==================== ATUALIZAR DISPLAY DOS ALERTAS ====================
function updateAlertsDisplay() {
    console.log("🔄 updateAlertsDisplay chamado");
    
    const container = document.getElementById('maintenance-alerts-container');
    if (!container) {
        console.log("❌ Container maintenance-alerts-container não encontrado!");
        return;
    }
    
    if (!window.currentUser) {
        console.log("⏳ Aguardando usuário...");
        return;
    }
    
    if (!window.vehicles || window.vehicles.length === 0) {
        container.innerHTML = `
            <div class="glass-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <i class="fas fa-bell text-blue-500"></i>
                        Sistema de Alertas
                    </h3>
                    <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        0 veículos
                    </span>
                </div>
                <div class="text-center py-4">
                    <p class="text-slate-600">Adicione seu primeiro veículo para começar!</p>
                    <button onclick="openNewVehicleModal()" 
                            class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i> Novo Veículo
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const inactiveVehicles = calculateInactiveVehicles();
    const totalAlerts = inactiveVehicles.length;
    
    let mainBadgeColor = 'bg-emerald-100 text-emerald-700';
    let mainBadgeText = 'Tudo em dia';
    
    if (totalAlerts > 0) {
        mainBadgeColor = 'bg-red-100 text-red-700';
        mainBadgeText = `${totalAlerts} ALERTA(S)`;
    }
    
    container.innerHTML = `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <i class="fas fa-bell ${totalAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-blue-500'}"></i>
                    Sistema de Alertas
                </h3>
                <span class="${mainBadgeColor} px-3 py-1 rounded-full text-xs font-bold">
                    ${mainBadgeText}
                </span>
            </div>
            
            <!-- Estatísticas -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-xl font-bold text-slate-600">${window.vehicles.length}</div>
                    <div class="text-xs text-slate-500">Total Veículos</div>
                </div>
                <div class="text-center p-3 ${totalAlerts > 0 ? 'bg-red-50' : 'bg-slate-50'} rounded-lg">
                    <div class="text-xl font-bold ${totalAlerts > 0 ? 'text-red-600' : 'text-slate-400'}">${totalAlerts}</div>
                    <div class="text-xs ${totalAlerts > 0 ? 'text-red-500' : 'text-slate-400'}">Alertas</div>
                </div>
            </div>
            
            ${totalAlerts > 0 ? `
                <div class="mb-6">
                    <h4 class="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                        <i class="fas fa-hourglass-half"></i>
                        ⚠️ VEÍCULOS SEM ATUALIZAÇÃO HÁ +15 DIAS
                    </h4>
                    <div class="space-y-3">
                        ${inactiveVehicles.slice(0, 5).map(vehicle => {
                            const lastUpdate = vehicle.lastUpdate || vehicle.updatedAt || vehicle.createdAt;
                            const daysInactive = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
                            const alertKey = `${vehicle.id}_inactive`;
                            
                            return `
                                <div class="bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 transition">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1 cursor-pointer" onclick="openViewVehicleModal('${vehicle.id}')">
                                            <p class="font-bold text-sm text-slate-800">${vehicle.modelo || 'Veículo'}</p>
                                            <p class="text-xs text-slate-600">${vehicle.plateOff || 'Sem placa'} • ${vehicle.unitName || 'Sem unidade'}</p>
                                            <p class="text-xs text-red-600 mt-2">📅 ${daysInactive} dias sem atualização</p>
                                        </div>
                                        <div class="flex gap-2">
                                            <button onclick="event.stopPropagation(); updateVehicleKm('${vehicle.id}')"
                                                    class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                                <i class="fas fa-tachometer-alt mr-1"></i>Atualizar KM
                                            </button>
                                            <button onclick="event.stopPropagation(); resolveAlert('${alertKey}')"
                                                    class="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">
                                                <i class="fas fa-check mr-1"></i>Ok
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : `
                <div class="text-center py-6">
                    <i class="fas fa-check-circle text-4xl text-emerald-400 mb-3"></i>
                    <p class="text-slate-500">Nenhum alerta no momento!</p>
                    <p class="text-slate-400 text-sm mt-1">Todos os veículos estão em dia.</p>
                </div>
            `}
            
            <!-- Botões de Ação -->
            <div class="flex gap-2 mt-6">
                <button onclick="openNewMaintenanceModal()"
                        class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
                    <i class="fas fa-plus mr-2"></i>Nova Manutenção
                </button>
                <button onclick="sendDetailedAlert()"
                        class="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition">
                    <i class="fas fa-envelope mr-2"></i>Enviar Alertas
                </button>
            </div>
        </div>
    `;
}

// ==================== ATUALIZAR KM DO VEÍCULO DIRETO DO ALERTA ====================
function updateVehicleKm(vehicleId) {
    const vehicle = window.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const newKm = prompt(`Digite o KM atual do veículo ${vehicle.modelo} (${vehicle.plateOff}):`, vehicle.km || 0);
    if (newKm === null) return;
    
    const kmValue = parseInt(newKm);
    if (isNaN(kmValue) || kmValue < 0) {
        showToast("KM inválido", "error");
        return;
    }
    
    if (kmValue < (vehicle.km || 0)) {
        showToast("KM não pode ser menor que o atual", "error");
        return;
    }
    
    const updateData = {
        id: vehicleId,
        km: kmValue,
        lastUpdate: Date.now(),
        updatedAt: Date.now(),
        updatedBy: window.currentUser?.email
    };
    
    saveVehicleToDB(updateData)
        .then(() => {
            showToast(`KM do veículo ${vehicle.plateOff} atualizado para ${kmValue.toLocaleString()} KM!`, "success");
            setTimeout(() => {
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof updateAlertsDisplay === 'function') updateAlertsDisplay();
            }, 500);
        })
        .catch(error => {
            showToast("Erro ao atualizar KM: " + error.message, "error");
        });
}

// ==================== RESOLVER ALERTA ====================
function resolveAlert(alertKey) {
    resolvedAlerts[alertKey] = {
        resolvedAt: Date.now(),
        resolvedBy: window.currentUser?.email || 'unknown'
    };
    saveResolvedAlerts();
    showToast("✅ Alerta marcado como resolvido!", "success");
    updateAlertsDisplay();
    
    if (typeof renderDashboard === 'function') renderDashboard();
}

// ==================== ENVIAR ALERTA POR E-MAIL ====================
function sendDetailedAlert() {
    const managerEmail = localStorage.getItem('managerEmail_' + (window.currentCompany ? window.currentCompany.id : ''));
    
    if (!managerEmail) {
        showToast("Configure um e-mail para alertas primeiro", "error");
        if (typeof switchPage === 'function') switchPage('config');
        return;
    }
    
    const inactiveVehicles = calculateInactiveVehicles();
    
    if (inactiveVehicles.length === 0) {
        showToast("Não há alertas no momento!", "info");
        return;
    }
    
    let emailBody = `📊 RELATÓRIO DE ALERTAS - ${window.currentCompany?.name || 'FrotaForte'}\n\n`;
    emailBody += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    emailBody += `Total de veículos: ${window.vehicles.length}\n`;
    emailBody += `Veículos com alerta: ${inactiveVehicles.length}\n\n`;
    emailBody += `═`.repeat(50) + `\n\n`;
    emailBody += `🔴 VEÍCULOS SEM ATUALIZAÇÃO HÁ MAIS DE 15 DIAS\n`;
    emailBody += `─`.repeat(40) + `\n`;
    
    inactiveVehicles.forEach(v => {
        const lastUpdate = v.lastUpdate || v.updatedAt || v.createdAt;
        const daysInactive = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
        emailBody += `• ${v.modelo || 'Sem modelo'} (${v.plateOff || 'Sem placa'})\n`;
        emailBody += `  Unidade: ${v.unitName || 'Não definida'}\n`;
        emailBody += `  Dias sem atualização: ${daysInactive}\n`;
        emailBody += `  Última atualização: ${new Date(lastUpdate).toLocaleDateString('pt-BR')}\n\n`;
    });
    
    emailBody += `═`.repeat(50) + `\n\n`;
    emailBody += `💡 AÇÕES RECOMENDADAS:\n`;
    emailBody += `1. Acesse o sistema para atualizar os KM dos veículos inativos\n`;
    emailBody += `2. Mantenha a frota em dia para evitar problemas\n\n`;
    emailBody += `🔗 Acesse o sistema: ${window.location.origin}\n\n`;
    emailBody += `Atenciosamente,\nSistema FrotaForte`;
    
    const subject = encodeURIComponent(`🚨 ALERTA FROTA - ${window.currentCompany?.name || 'FrotaForte'} - ${inactiveVehicles.length} alertas`);
    const body = encodeURIComponent(emailBody);
    
    window.open(`mailto:${managerEmail}?subject=${subject}&body=${body}`, '_blank');
    showToast("E-mail preparado com todos os alertas!", "success");
}

// ==================== INICIALIZAÇÃO ====================
function loadAlerts() {
    console.log("📢 loadAlerts chamado!");
    
    const container = document.getElementById('maintenance-alerts-container');
    if (!container) {
        console.log("⚠️ Container não encontrado, tentando novamente em 1s...");
        setTimeout(loadAlerts, 1000);
        return;
    }
    
    console.log("✅ Container encontrado, atualizando alertas...");
    loadResolvedAlerts();
    updateAlertsDisplay();
    
    setInterval(() => {
        if (window.vehicles && window.currentUser) {
            updateAlertsDisplay();
        }
    }, 30000);
}

const checkUserInterval = setInterval(() => {
    if (window.currentUser && window.currentCompany) {
        console.log("✅ Usuário logado, iniciando sistema de alertas");
        clearInterval(checkUserInterval);
        loadAlerts();
    }
}, 1000);

setTimeout(() => {
    clearInterval(checkUserInterval);
}, 15000);

// ==================== EXPORTAÇÕES ====================
window.loadAlerts = loadAlerts;
window.updateAlertsDisplay = updateAlertsDisplay;
window.resolveAlert = resolveAlert;
window.sendDetailedAlert = sendDetailedAlert;
window.calculateInactiveVehicles = calculateInactiveVehicles;
window.updateVehicleKm = updateVehicleKm;