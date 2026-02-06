// js/alerts.js - SISTEMA DE ALERTAS SIMPLES E SEGURO

console.log("🚗 Sistema de Alertas carregado!");

// Espera o sistema carregar
setTimeout(() => {
    if (currentUser) {
        console.log("✅ Usuário autenticado, iniciando alertas...");
        loadAlerts();
    }
}, 3000);

function loadAlerts() {
    const container = document.getElementById('maintenance-alerts-container');
    if (!container) {
        console.log("⚠️ Container não encontrado, tentando novamente em 2s...");
        setTimeout(loadAlerts, 2000);
        return;
    }
    
    console.log("📊 Atualizando alertas...");
    updateAlertsDisplay();
    
    // Atualiza a cada 30 segundos
    setInterval(updateAlertsDisplay, 30000);
}

function updateAlertsDisplay() {
    const container = document.getElementById('maintenance-alerts-container');
    if (!container || !currentUser) return;
    
    // Se não tem veículos ainda
    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = `
            <div class="glass-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <i class="fas fa-bell text-blue-500"></i>
                        Sistema de Manutenção
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
    
    // Calcula estatísticas
    const totalVehicles = vehicles.length;
    const vehiclesWithMaintenance = [...new Set(maintenances.map(m => m.vehicleId))].length;
    const maintenanceCount = maintenances.length;
    
    // Conta por tipo
    const maintenanceTypes = {};
    maintenances.forEach(m => {
        const type = m.type || 'outro';
        maintenanceTypes[type] = (maintenanceTypes[type] || 0) + 1;
    });
    
    // Determina cor do badge
    let badgeColor = 'bg-blue-100 text-blue-700';
    let badgeText = `${maintenanceCount} registro(s)`;
    
    if (maintenanceCount === 0) {
        badgeColor = 'bg-amber-100 text-amber-700';
        badgeText = 'Nenhuma manutenção';
    } else if (maintenanceCount > 10) {
        badgeColor = 'bg-emerald-100 text-emerald-700';
        badgeText = `${maintenanceCount} registros`;
    }
    
    // HTML do container
    container.innerHTML = `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <i class="fas fa-tools text-blue-500"></i>
                    Sistema de Manutenção
                </h3>
                <span class="${badgeColor} px-3 py-1 rounded-full text-xs font-bold">
                    ${badgeText}
                </span>
            </div>
            
            <!-- ESTATÍSTICAS -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                <div class="text-center p-3 bg-blue-50 rounded-xl">
                    <div class="text-xl font-bold text-blue-600">${totalVehicles}</div>
                    <div class="text-xs text-blue-500 mt-1">Veículos</div>
                </div>
                <div class="text-center p-3 bg-emerald-50 rounded-xl">
                    <div class="text-xl font-bold text-emerald-600">${vehiclesWithMaintenance}</div>
                    <div class="text-xs text-emerald-500 mt-1">Com manutenção</div>
                </div>
                <div class="text-center p-3 bg-amber-50 rounded-xl">
                    <div class="text-xl font-bold text-amber-600">${maintenanceCount}</div>
                    <div class="text-xs text-amber-500 mt-1">Registros</div>
                </div>
            </div>
            
            <!-- TIPOS DE MANUTENÇÃO -->
            <div class="mb-4">
                <h4 class="text-sm font-bold text-slate-700 mb-2">Tipos de Serviço</h4>
                <div class="space-y-2">
                    ${Object.entries({
                        'oleo': '🛢️ Troca de Óleo',
                        'revisao': '🔧 Revisão Geral', 
                        'pneus': '🚗 Pneus',
                        'freios': '🛑 Freios',
                        'outro': '✨ Outros'
                    }).map(([key, label]) => `
                        <div class="flex justify-between items-center text-sm">
                            <span>${label}</span>
                            <span class="font-bold text-slate-600">${maintenanceTypes[key] || 0}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- DICA -->
            <div class="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p class="text-sm text-slate-600">
                    <i class="fas fa-lightbulb text-amber-500 mr-2"></i>
                    Dica: Adicione manutenções para o sistema calcular alertas automáticos.
                </p>
            </div>
        </div>
    `;
}

// Torna as funções disponíveis
window.loadAlerts = loadAlerts;
window.updateAlertsDisplay = updateAlertsDisplay;