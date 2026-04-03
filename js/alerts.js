// js/alerts.js - SISTEMA DE ALERTAS DETALHADO

console.log("🚗 Sistema de Alertas Detalhado carregado!");

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
        showEmptyState(container);
        return;
    }
    
    // Calcula alertas específicos
    const alerts = calculateMaintenanceAlerts();
    
    // HTML do container
    container.innerHTML = generateAlertsHTML(alerts);
    
    // Adiciona eventos aos botões
    setupAlertButtons();
}

function calculateMaintenanceAlerts() {
    const alerts = {
        totalVehicles: vehicles.length,
        totalMaintenances: maintenances.length,
        vehiclesWithMaintenance: [...new Set(maintenances.map(m => m.vehicleId))].length,
        
        // Novas métricas
        overdueMaintenance: [],
        upcomingMaintenance: [],
        noMaintenanceVehicles: [],
        maintenanceByType: {},
        
        // Estatísticas gerais
        stats: {
            oilChanges: 0,
            generalRevisions: 0,
            tires: 0,
            brakes: 0,
            others: 0
        }
    };
    
    // Analisa cada veículo
    vehicles.forEach(vehicle => {
        // Pega manutenções deste veículo
        const vehicleMaintenances = maintenances.filter(m => m.vehicleId === vehicle.id);
        
        // Se não tem manutenção registrada
        if (vehicleMaintenances.length === 0) {
            alerts.noMaintenanceVehicles.push({
                vehicle: vehicle,
                reason: 'Nenhuma manutenção registrada'
            });
            return;
        }
        
        // Analisa última manutenção
        const lastMaintenance = vehicleMaintenances.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        })[0];
        
        if (!lastMaintenance || !lastMaintenance.date) return;
        
        const lastDate = new Date(lastMaintenance.date);
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Configura limites (em dias)
        const OVERDUE_DAYS = 180; // 6 meses
        const WARNING_DAYS = 150; // 5 meses
        
        // Verifica se está atrasado
        if (daysSince > OVERDUE_DAYS) {
            alerts.overdueMaintenance.push({
                vehicle: vehicle,
                lastMaintenance: lastMaintenance,
                daysSince: daysSince,
                type: lastMaintenance.type || 'outro'
            });
        }
        // Verifica se está próximo do vencimento
        else if (daysSince > WARNING_DAYS) {
            alerts.upcomingMaintenance.push({
                vehicle: vehicle,
                lastMaintenance: lastMaintenance,
                daysSince: daysSince,
                daysUntilDue: OVERDUE_DAYS - daysSince,
                type: lastMaintenance.type || 'outro'
            });
        }
    });
    
    // Conta manutenções por tipo
    maintenances.forEach(m => {
        const type = m.type || 'outro';
        if (!alerts.maintenanceByType[type]) {
            alerts.maintenanceByType[type] = 0;
        }
        alerts.maintenanceByType[type]++;
        
        // Atualiza estatísticas
        switch(type) {
            case 'oleo':
                alerts.stats.oilChanges++;
                break;
            case 'revisao':
                alerts.stats.generalRevisions++;
                break;
            case 'pneus':
                alerts.stats.tires++;
                break;
            case 'freios':
                alerts.stats.brakes++;
                break;
            default:
                alerts.stats.others++;
        }
    });
    
    return alerts;
}

function generateAlertsHTML(alerts) {
    // Determina cor do badge principal
    let mainBadgeColor = 'bg-emerald-100 text-emerald-700';
    let mainBadgeText = 'Tudo em dia';
    
    if (alerts.overdueMaintenance.length > 0) {
        mainBadgeColor = 'bg-red-100 text-red-700';
        mainBadgeText = `${alerts.overdueMaintenance.length} ATRASADO(S)`;
    } else if (alerts.upcomingMaintenance.length > 0) {
        mainBadgeColor = 'bg-amber-100 text-amber-700';
        mainBadgeText = `${alerts.upcomingMaintenance.length} PRÓXIMO(S)`;
    }
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <i class="fas fa-bell ${alerts.overdueMaintenance.length > 0 ? 'text-red-500 animate-pulse' : 'text-blue-500'}"></i>
                    Sistema de Manutenção
                </h3>
                <span class="${mainBadgeColor} px-3 py-1 rounded-full text-xs font-bold">
                    ${mainBadgeText}
                </span>
            </div>
            
            <!-- ESTATÍSTICAS RÁPIDAS -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                <div class="text-center p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition cursor-pointer" 
                     onclick="filterByStatus('all')">
                    <div class="text-xl font-bold text-blue-600">${alerts.totalVehicles}</div>
                    <div class="text-xs text-blue-500 mt-1">Veículos</div>
                </div>
                <div class="text-center p-3 ${alerts.overdueMaintenance.length > 0 ? 'bg-red-50' : 'bg-emerald-50'} rounded-xl hover:opacity-90 transition cursor-pointer"
                     onclick="filterByStatus('overdue')">
                    <div class="text-xl font-bold ${alerts.overdueMaintenance.length > 0 ? 'text-red-600' : 'text-emerald-600'}">${alerts.overdueMaintenance.length}</div>
                    <div class="text-xs ${alerts.overdueMaintenance.length > 0 ? 'text-red-500' : 'text-emerald-500'} mt-1">Atrasados</div>
                </div>
                <div class="text-center p-3 ${alerts.upcomingMaintenance.length > 0 ? 'bg-amber-50' : 'bg-slate-50'} rounded-xl hover:opacity-90 transition cursor-pointer"
                     onclick="filterByStatus('upcoming')">
                    <div class="text-xl font-bold ${alerts.upcomingMaintenance.length > 0 ? 'text-amber-600' : 'text-slate-600'}">${alerts.upcomingMaintenance.length}</div>
                    <div class="text-xs ${alerts.upcomingMaintenance.length > 0 ? 'text-amber-500' : 'text-slate-500'} mt-1">Próximos</div>
                </div>
            </div>
            
            <!-- SEÇÃO DE ALERTAS ATRASADOS -->
            ${alerts.overdueMaintenance.length > 0 ? `
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-sm font-bold text-red-700 flex items-center gap-2">
                            <i class="fas fa-exclamation-triangle"></i>
                            Manutenções ATRASADAS
                            <span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">${alerts.overdueMaintenance.length}</span>
                        </h4>
                        <button onclick="exportAlerts('overdue')" 
                                class="text-xs text-red-600 hover:text-red-800 font-bold">
                            <i class="fas fa-download mr-1"></i>Exportar
                        </button>
                    </div>
                    <div class="space-y-3">
                        ${alerts.overdueMaintenance.slice(0, 3).map(alert => `
                            <div class="alert-item bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 transition cursor-pointer"
                                 onclick="openVehicleMaintenance('${alert.vehicle.id}')">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="font-bold text-sm text-slate-800">${alert.vehicle.modelo || 'Veículo sem nome'}</p>
                                        <p class="text-xs text-slate-600 mt-1">
                                            <i class="fas fa-car mr-1"></i>${alert.vehicle.plateOff || 'Sem placa'}
                                            • ${alert.vehicle.unitName || 'Sem unidade'}
                                        </p>
                                        <p class="text-xs text-red-600 mt-2">
                                            <i class="fas fa-calendar-exclamation mr-1"></i>
                                            ${alert.daysSince} dias desde a última manutenção
                                        </p>
                                    </div>
                                    <button onclick="event.stopPropagation(); openNewMaintenanceModal('${alert.vehicle.id}')"
                                            class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                                        Registrar
                                    </button>
                                </div>
                                ${alert.lastMaintenance ? `
                                    <div class="mt-2 text-xs text-slate-500">
                                        <i class="fas fa-wrench mr-1"></i>
                                        Última: ${formatDate(alert.lastMaintenance.date)} • 
                                        ${getMaintenanceTypeLabel(alert.lastMaintenance.type)}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ${alerts.overdueMaintenance.length > 3 ? `
                        <div class="mt-3 text-center">
                            <button onclick="showAllAlerts('overdue')"
                                    class="text-xs text-red-600 hover:text-red-800 font-bold">
                                <i class="fas fa-chevron-down mr-1"></i>
                                Ver mais ${alerts.overdueMaintenance.length - 3} veículo(s)
                            </button>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- SEÇÃO DE ALERTAS PRÓXIMOS -->
            ${alerts.upcomingMaintenance.length > 0 ? `
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-sm font-bold text-amber-700 flex items-center gap-2">
                            <i class="fas fa-clock"></i>
                            Manutenções PRÓXIMAS
                            <span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">${alerts.upcomingMaintenance.length}</span>
                        </h4>
                    </div>
                    <div class="space-y-3">
                        ${alerts.upcomingMaintenance.slice(0, 3).map(alert => `
                            <div class="alert-item bg-amber-50 border border-amber-200 rounded-lg p-3 hover:bg-amber-100 transition cursor-pointer"
                                 onclick="openVehicleMaintenance('${alert.vehicle.id}')">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="font-bold text-sm text-slate-800">${alert.vehicle.modelo || 'Veículo sem nome'}</p>
                                        <p class="text-xs text-slate-600 mt-1">
                                            <i class="fas fa-car mr-1"></i>${alert.vehicle.plateOff || 'Sem placa'}
                                            • ${alert.vehicle.unitName || 'Sem unidade'}
                                        </p>
                                        <p class="text-xs text-amber-600 mt-2">
                                            <i class="fas fa-hourglass-half mr-1"></i>
                                            ${alert.daysUntilDue} dias para vencer
                                        </p>
                                    </div>
                                    <button onclick="event.stopPropagation(); scheduleMaintenance('${alert.vehicle.id}')"
                                            class="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700">
                                        Agendar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- SEÇÃO SEM MANUTENÇÃO -->
            ${alerts.noMaintenanceVehicles.length > 0 ? `
                <div class="mb-6">
                    <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <i class="fas fa-info-circle text-blue-500"></i>
                        Sem manutenção registrada
                        <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs">${alerts.noMaintenanceVehicles.length}</span>
                    </h4>
                    <div class="grid grid-cols-2 gap-2">
                        ${alerts.noMaintenanceVehicles.slice(0, 4).map(vehicle => `
                            <div class="bg-slate-50 rounded p-2 text-center hover:bg-slate-100 transition cursor-pointer"
                                 onclick="openNewMaintenanceModal('${vehicle.vehicle.id}')">
                                <p class="text-xs font-bold text-slate-700 truncate">${vehicle.vehicle.modelo || 'Veículo'}</p>
                                <p class="text-[10px] text-slate-500">${vehicle.vehicle.plateOff || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- RESUMO DE TIPOS -->
            <div class="mb-4">
                <h4 class="text-sm font-bold text-slate-700 mb-2">Resumo por Tipo</h4>
                <div class="space-y-2">
                    ${Object.entries({
                        'oleo': {label: '🛢️ Troca de Óleo', color: 'text-blue-600'},
                        'revisao': {label: '🔧 Revisão Geral', color: 'text-emerald-600'},
                        'pneus': {label: '🚗 Pneus', color: 'text-amber-600'},
                        'freios': {label: '🛑 Freios', color: 'text-red-600'},
                        'outro': {label: '✨ Outros', color: 'text-purple-600'}
                    }).map(([key, info]) => `
                        <div class="flex justify-between items-center text-sm">
                            <span class="${info.color}">${info.label}</span>
                            <span class="font-bold text-slate-600">${alerts.maintenanceByType[key] || 0}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- AÇÕES -->
            <div class="flex gap-2 mt-6">
                <button onclick="openNewMaintenanceModal()"
                        class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
                    <i class="fas fa-plus mr-2"></i>Nova Manutenção
                </button>
                <button onclick="exportMaintenanceReport()"
                        class="px-4 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition">
                    <i class="fas fa-file-export"></i>
                </button>
            </div>
        </div>
    `;
}

function showEmptyState(container) {
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
}

// ==================== FUNÇÕES AUXILIARES ====================

function formatDate(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getMaintenanceTypeLabel(type) {
    const labels = {
        'oleo': 'Troca de Óleo',
        'revisao': 'Revisão Geral',
        'pneus': 'Pneus',
        'freios': 'Freios',
        'outro': 'Outro'
    };
    return labels[type] || 'Outro';
}

function setupAlertButtons() {
    // Configura eventos para os botões dos alertas
    const alertItems = document.querySelectorAll('.alert-item');
    alertItems.forEach(item => {
        item.addEventListener('click', function() {
            const vehicleId = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (vehicleId) {
                openViewVehicleModal(vehicleId);
            }
        });
    });
}

// ==================== FUNÇÕES GLOBAIS ADICIONAIS ====================

function filterByStatus(status) {
    console.log(`Filtrando por status: ${status}`);
    // Esta função pode ser implementada para filtrar a lista de veículos
    switch(status) {
        case 'overdue':
            showToast(`Mostrando ${alerts.overdueMaintenance.length} veículos atrasados`, "info");
            break;
        case 'upcoming':
            showToast(`Mostrando ${alerts.upcomingMaintenance.length} veículos próximos`, "info");
            break;
        default:
            renderVehicles();
    }
}

function openVehicleMaintenance(vehicleId) {
    // Abre o modal de manutenção pré-preenchido com o veículo
    if (typeof openNewMaintenanceModal === 'function') {
        openNewMaintenanceModal(vehicleId);
    } else {
        openViewVehicleModal(vehicleId);
    }
}

function showAllAlerts(type) {
    const alerts = calculateMaintenanceAlerts();
    let alertList = [];
    let title = '';
    
    switch(type) {
        case 'overdue':
            alertList = alerts.overdueMaintenance;
            title = 'Todas as Manutenções Atrasadas';
            break;
        case 'upcoming':
            alertList = alerts.upcomingMaintenance;
            title = 'Todas as Manutenções Próximas';
            break;
    }
    
    // Cria um modal para mostrar todos os alertas
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div class="flex justify-between items-center p-6 border-b">
                    <h3 class="font-bold text-lg text-slate-800">${title}</h3>
                    <button onclick="closeModal('all-alerts-modal')" class="text-slate-400 hover:text-slate-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto max-h-[60vh]">
                    ${alertList.map(alert => `
                        <div class="border border-slate-200 rounded-lg p-4 mb-3 hover:bg-slate-50">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h4 class="font-bold text-slate-800">${alert.vehicle.modelo || 'Veículo sem nome'}</h4>
                                    <p class="text-sm text-slate-600">
                                        ${alert.vehicle.plateOff || 'Sem placa'} • ${alert.vehicle.unitName || 'Sem unidade'}
                                    </p>
                                    <p class="text-sm ${type === 'overdue' ? 'text-red-600' : 'text-amber-600'} mt-2">
                                        <i class="fas ${type === 'overdue' ? 'fa-exclamation-triangle' : 'fa-clock'} mr-2"></i>
                                        ${type === 'overdue' ? `${alert.daysSince} dias atrasado` : `${alert.daysUntilDue} dias para vencer`}
                                    </p>
                                </div>
                                <button onclick="openVehicleMaintenance('${alert.vehicle.id}')"
                                        class="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Adiciona o modal ao body
    const modalDiv = document.createElement('div');
    modalDiv.id = 'all-alerts-modal';
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

function exportAlerts(type) {
    const alerts = calculateMaintenanceAlerts();
    let data = [];
    let filename = '';
    
    switch(type) {
        case 'overdue':
            data = alerts.overdueMaintenance.map(a => ({
                'Veículo': a.vehicle.modelo || '',
                'Placa': a.vehicle.plateOff || '',
                'Unidade': a.vehicle.unitName || '',
                'Dias Atrasado': a.daysSince,
                'Última Manutenção': a.lastMaintenance ? formatDate(a.lastMaintenance.date) : 'N/A',
                'Tipo': getMaintenanceTypeLabel(a.lastMaintenance?.type)
            }));
            filename = `manutencoes_atrasadas_${new Date().toISOString().split('T')[0]}.csv`;
            break;
    }
    
    if (data.length > 0) {
        exportToCSV(data, filename);
        showToast(`Exportado ${data.length} registros`, "success");
    }
}

function exportToCSV(data, filename) {
    const csvContent = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ==================== EXPORTAÇÕES ====================

window.loadAlerts = loadAlerts;
window.updateAlertsDisplay = updateAlertsDisplay;
window.filterByStatus = filterByStatus;
window.openVehicleMaintenance = openVehicleMaintenance;
window.showAllAlerts = showAllAlerts;
window.exportAlerts = exportAlerts;