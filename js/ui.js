// js/ui.js

// ==================== INTERFACE E MODAIS ====================

if (typeof window.deleteTarget === 'undefined') {
    window.deleteTarget = null;
}

// ==================== MODAL VEÍCULO ====================
function openNewVehicleModal() {
    resetVehicleForm();
    document.getElementById('modal-vehicle-title').textContent = "Novo Veículo";
    document.getElementById('modal-vehicle-subtitle').textContent = "Cadastro na Frota";
    document.getElementById('tab-manutencao').classList.add('hidden');
    switchTab('cadastro');
    openModal('modal-veiculo');
    
    setTimeout(() => {
        const firstInput = document.getElementById('v-model');
        if (firstInput) firstInput.focus();
    }, 100);
}

function openEditVehicleModal(id) {
    if (!id) return;
    
    const vehicle = window.vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast("Veículo não encontrado", "error");
        return;
    }
    
    document.getElementById('v-id').value = vehicle.id;
    document.getElementById('v-model').value = vehicle.modelo || '';
    document.getElementById('v-type').value = vehicle.type || 'propria';
    document.getElementById('v-rental-co').value = vehicle.rentalCo || '';
    document.getElementById('v-plate-off').value = vehicle.plateOff || '';
    document.getElementById('v-plate-res').value = vehicle.plateRes || '';
    document.getElementById('v-unit-select').value = vehicle.unitId || '';
    document.getElementById('v-km').value = vehicle.km || 0;
    document.getElementById('v-all-maintenance-done').checked = vehicle.allMaintenanceDone || false;
    
    toggleRentalField();
    document.getElementById('modal-vehicle-title').textContent = "Editar Veículo";
    document.getElementById('modal-vehicle-subtitle').textContent = `${vehicle.modelo || 'Veículo'} - ${vehicle.plateOff || 'Sem placa'}`;
    document.getElementById('tab-manutencao').classList.remove('hidden');
    
    renderMaintenanceList(vehicle.id);
    
    openModal('modal-veiculo');
}

function resetVehicleForm() {
    document.getElementById('v-id').value = '';
    document.getElementById('v-model').value = '';
    document.getElementById('v-type').value = 'propria';
    document.getElementById('v-rental-co').value = '';
    document.getElementById('v-plate-off').value = '';
    document.getElementById('v-plate-res').value = '';
    document.getElementById('v-unit-select').value = '';
    document.getElementById('v-km').value = '0';
    document.getElementById('v-all-maintenance-done').checked = false;
    toggleRentalField();
}

function toggleRentalField() {
    const type = document.getElementById('v-type').value;
    const rentalGroup = document.getElementById('rental-company-group');
    if (rentalGroup) {
        rentalGroup.classList.toggle('hidden', type !== 'locado');
    }
}

function switchTab(tab) {
    const cadastroContent = document.getElementById('content-manutencao');
    const tabCadastro = document.getElementById('tab-cadastro');
    const tabManutencao = document.getElementById('tab-manutencao');
    const footerCadastro = document.getElementById('footer-cadastro');
    const footerManutencao = document.getElementById('footer-manutencao');
    
    if (tab === 'cadastro') {
        if (cadastroContent) cadastroContent.classList.add('hidden');
        if (tabCadastro) tabCadastro.classList.add('active');
        if (tabManutencao) tabManutencao.classList.remove('active');
        if (footerCadastro) footerCadastro.classList.remove('hidden');
        if (footerManutencao) footerManutencao.classList.add('hidden');
    } else {
        if (cadastroContent) cadastroContent.classList.remove('hidden');
        if (tabCadastro) tabCadastro.classList.remove('active');
        if (tabManutencao) tabManutencao.classList.add('active');
        if (footerCadastro) footerCadastro.classList.add('hidden');
        if (footerManutencao) footerManutencao.classList.remove('hidden');
    }
}

// ==================== MANUTENÇÕES ====================
function renderMaintenanceList(vehicleId) {
    const listEl = document.getElementById('maintenance-list');
    if (!listEl) return;
    
    const vehicleMaintenances = window.maintenances.filter(m => m.vehicleId === vehicleId);
    
    if (vehicleMaintenances.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state p-6 text-center">
                <i class="fas fa-tools text-4xl text-slate-300 mb-4"></i>
                <p class="text-slate-500">Nenhuma manutenção registrada</p>
                <p class="text-slate-400 text-sm mt-2">Adicione a primeira manutenção acima</p>
            </div>
        `;
        return;
    }
    
    vehicleMaintenances.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    listEl.innerHTML = vehicleMaintenances.map(m => {
        const date = m.date ? new Date(m.date).toLocaleDateString('pt-BR') : 'Sem data';
        const kmText = m.km ? `${m.km.toLocaleString()} KM` : '---';
        const typeLabel = getMaintenanceTypeLabel(m.type);
        
        return `
            <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white transition">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold px-2 py-0.5 rounded ${getTypeColor(m.type)}">${typeLabel}</span>
                        <p class="text-sm font-bold text-slate-800">${m.description || 'Sem descrição'}</p>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                        <span class="flex items-center gap-1"><i class="far fa-calendar"></i> ${date}</span>
                        ${m.location ? `<span class="flex items-center gap-1"><i class="fas fa-map-marker-alt text-blue-500"></i> ${m.location}</span>` : ''}
                        <span class="flex items-center gap-1"><i class="fas fa-tachometer-alt text-amber-500"></i> ${kmText}</span>
                        ${m.createdBy ? `<span class="flex items-center gap-1"><i class="fas fa-user text-purple-500"></i> ${m.createdBy.split('@')[0]}</span>` : ''}
                    </div>
                </div>
                <button onclick="deleteMaintenance('${m.id}')" class="text-red-400 hover:text-red-600 text-sm ml-2 p-2 rounded-full hover:bg-red-50 transition" title="Excluir">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');
}

function getTypeColor(type) {
    switch(type) {
        case 'oleo': return 'bg-blue-100 text-blue-700';
        case 'revisao': return 'bg-emerald-100 text-emerald-700';
        case 'pneus': return 'bg-amber-100 text-amber-700';
        case 'freios': return 'bg-red-100 text-red-700';
        default: return 'bg-purple-100 text-purple-700';
    }
}

function addMaintenance() {
    const vehicleId = document.getElementById('v-id').value;
    
    if (!vehicleId) {
        showToast("Nenhum veículo selecionado", "error");
        return;
    }
    
    const desc = document.getElementById('m-desc').value.trim();
    const date = document.getElementById('m-date').value;
    const maintKm = parseInt(document.getElementById('m-km').value) || 0;
    const location = document.getElementById('m-location').value.trim();
    const type = document.getElementById('m-type').value || 'outro';
    
    if (!desc || !date) {
        showToast("Preencha descrição e data", "error");
        return;
    }
    
    if (new Date(date) > new Date()) {
        showToast("Data não pode ser futura", "error");
        return;
    }
    
    const currentVehicle = window.vehicles.find(v => v.id === vehicleId);
    
    const maintenanceData = {
        vehicleId: vehicleId,
        type: type,
        description: desc,
        date: date,
        km: maintKm,
        location: location,
        createdBy: window.currentUser?.email || 'sistema',
        createdAt: Date.now()
    };
    
    const btn = document.querySelector('#content-manutencao button[onclick="addMaintenance()"]');
    if (!btn) {
        showToast("Botão não encontrado", "error");
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...';
    btn.disabled = true;
    
    saveMaintenance(maintenanceData)
        .then(() => {
            if (maintKm > (currentVehicle?.km || 0)) {
                const updateData = {
                    id: vehicleId,
                    km: maintKm,
                    lastUpdate: Date.now(),
                    updatedAt: Date.now(),
                    updatedBy: window.currentUser?.email
                };
                return saveVehicleToDB(updateData);
            }
            return Promise.resolve();
        })
        .then(() => {
            showToast("Manutenção registrada com sucesso!", "success");
            
            document.getElementById('m-desc').value = '';
            document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('m-km').value = '';
            document.getElementById('m-location').value = '';
            document.getElementById('m-type').value = 'outro';
            
            setTimeout(() => {
                renderMaintenanceList(vehicleId);
                const currentVehicleUpdated = window.vehicles.find(v => v.id === vehicleId);
                if (currentVehicleUpdated && currentVehicleUpdated.km) {
                    document.getElementById('v-km').value = currentVehicleUpdated.km;
                }
                // Força atualização do dashboard
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof updateAlertsDisplay === 'function') updateAlertsDisplay();
            }, 500);
        })
        .catch(error => {
            console.error("Erro ao salvar manutenção:", error);
            showToast("Erro ao salvar manutenção: " + error.message, "error");
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

function deleteMaintenance(mId) {
    if (!confirm("Tem certeza que deseja excluir este registro de manutenção?")) {
        return;
    }
    
    deleteMaintenanceFromDB(mId)
        .then(() => {
            showToast("Registro excluído", "success");
            const vehicleId = document.getElementById('v-id').value;
            setTimeout(() => renderMaintenanceList(vehicleId), 300);
        })
        .catch(error => {
            showToast("Erro ao excluir: " + error.message, "error");
        });
}

// ==================== SALVAR VEÍCULO ====================
function saveVehicle() {
    const id = document.getElementById('v-id').value;
    const unitSelect = document.getElementById('v-unit-select');
    
    let unitName = 'Sem Unidade';
    let unitId = '';
    
    if (unitSelect && unitSelect.value) {
        const selectedUnit = window.units.find(u => u.id === unitSelect.value);
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
        maintenanceBaselineDate: new Date().toISOString().split('T')[0],
        lastUpdate: Date.now(),
        updatedAt: Date.now(),
        updatedBy: window.currentUser?.email
    };
    
    if (!vehicleData.modelo || !vehicleData.plateOff) {
        showToast("Preencha Modelo e Placa Oficial", "error");
        return;
    }
    
    if (vehicleData.km < 0) {
        showToast("KM não pode ser negativo", "error");
        return;
    }
    
    const existingVehicle = window.vehicles.find(v => 
        v.plateOff === vehicleData.plateOff && 
        v.id !== id
    );
    
    if (existingVehicle) {
        showToast(`Já existe um veículo com a placa ${vehicleData.plateOff}`, "error");
        return;
    }
    
    const btn = document.querySelector('#footer-cadastro button[onclick="saveVehicle()"]');
    if (!btn) {
        showToast("Botão não encontrado", "error");
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    saveVehicleToDB(vehicleData)
        .then(() => {
            showToast(id ? "Veículo atualizado!" : "Veículo criado!");
            closeModal('modal-veiculo');
            // Força atualização das interfaces
            setTimeout(() => {
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof updateAlertsDisplay === 'function') updateAlertsDisplay();
            }, 500);
        })
        .catch(error => {
            showToast("Erro ao salvar: " + error.message, "error");
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

// ==================== MODAL UNIDADE RÁPIDA ====================
function openQuickUnitModal() {
    document.getElementById('quick-unit-name').value = '';
    document.getElementById('quick-unit-city').value = '';
    openModal('modal-unidade-rapida');
    
    setTimeout(() => {
        const firstInput = document.getElementById('quick-unit-name');
        if (firstInput) firstInput.focus();
    }, 100);
}

function saveQuickUnit() {
    const name = document.getElementById('quick-unit-name').value.trim();
    const city = document.getElementById('quick-unit-city').value.trim();
    
    if (!name || !city) {
        showToast("Preencha nome e cidade da unidade", "error");
        return;
    }
    
    const existingUnit = window.units.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingUnit) {
        showToast(`Unidade "${name}" já existe`, "error");
        const select = document.getElementById('v-unit-select');
        if (select) select.value = existingUnit.id;
        closeModal('modal-unidade-rapida');
        return;
    }
    
    const unitData = { name: name, city: city };
    
    const btn = document.querySelector('#modal-unidade-rapida button[onclick="saveQuickUnit()"]');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Criando...';
    btn.disabled = true;
    
    saveUnit(unitData)
        .then(() => {
            showToast("Unidade criada com sucesso!", "success");
            closeModal('modal-unidade-rapida');
            setTimeout(() => {
                updateUnitSelect();
                const select = document.getElementById('v-unit-select');
                const newUnit = window.units.find(u => u.name === name);
                if (newUnit && select) select.value = newUnit.id;
            }, 500);
        })
        .catch(error => {
            showToast("Erro ao criar unidade: " + error.message, "error");
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

// ==================== MODAL UNIDADE ====================
function openUnitModal(id = null) {
    const form = document.getElementById('form-unit');
    if (!form) return;
    
    form.reset();
    document.getElementById('u-id').value = '';
    
    if (id) {
        const unit = window.units.find(u => u.id === id);
        if (unit) {
            document.getElementById('u-id').value = unit.id;
            document.getElementById('u-name').value = unit.name;
            document.getElementById('u-city').value = unit.city || '';
            document.getElementById('modal-unit-title').textContent = "Editar Unidade";
        }
    } else {
        document.getElementById('modal-unit-title').textContent = "Nova Unidade";
    }
    
    openModal('modal-unidade');
    
    setTimeout(() => {
        const firstInput = document.getElementById('u-name');
        if (firstInput) firstInput.focus();
    }, 100);
}

function saveUnitForm() {
    const id = document.getElementById('u-id').value;
    const name = document.getElementById('u-name').value.trim();
    const city = document.getElementById('u-city').value.trim();
    
    if (!name || !city) {
        showToast("Preencha nome e cidade", "error");
        return;
    }
    
    const existingUnit = window.units.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.id !== id
    );
    
    if (existingUnit) {
        showToast(`Já existe uma unidade com o nome "${name}"`, "error");
        return;
    }
    
    const unitData = { id: id || null, name: name, city: city };
    
    const btn = document.querySelector('#form-unit button[type="submit"]');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    saveUnit(unitData)
        .then(() => {
            showToast(id ? "Unidade atualizada!" : "Unidade criada!");
            closeModal('modal-unidade');
            setTimeout(() => {
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof renderUnitsPage === 'function') renderUnitsPage();
            }, 500);
        })
        .catch(error => {
            showToast("Erro ao salvar: " + error.message, "error");
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

function updateUnitSelect() {
    const select = document.getElementById('v-unit-select');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecione a Unidade...</option>';
    
    window.units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `${unit.name} ${unit.city ? `- ${unit.city}` : ''}`;
        select.appendChild(option);
    });
    
    if (currentValue && window.units.some(u => u.id === currentValue)) {
        select.value = currentValue;
    }
}

// ==================== CONFIRMAÇÃO DE EXCLUSÃO ====================
function confirmDeleteVehicle(vehicleId, vehicleName, plate) {
    window.deleteTarget = { type: 'vehicle', id: vehicleId, name: vehicleName, plate: plate };
    document.getElementById('confirm-message').innerHTML = `Excluir o veículo <strong>"${vehicleName}"</strong> - ${plate}?<br><small class="text-red-500">Todas as manutenções também serão excluídas.</small>`;
    openModal('modal-confirm');
}

function confirmDeleteUnit(unitId, unitName) {
    window.deleteTarget = { type: 'unit', id: unitId, name: unitName };
    document.getElementById('confirm-message').innerHTML = `Excluir a unidade <strong>"${unitName}"</strong>?<br><small class="text-red-500">A unidade precisa estar sem veículos vinculados.</small>`;
    openModal('modal-confirm');
}

function confirmDeleteAction() {
    if (!window.deleteTarget) {
        closeModal('modal-confirm');
        return;
    }
    
    const { type, id, name } = window.deleteTarget;
    
    const confirmBtn = document.getElementById('btn-confirm-delete');
    if (!confirmBtn) return;
    
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    confirmBtn.disabled = true;
    
    const promise = type === 'unit' ? deleteUnit(id) : deleteVehicle(id);
    
    promise
        .then(() => {
            showToast(`${type === 'unit' ? 'Unidade' : 'Veículo'} "${name}" excluído`, "success");
            closeModal('modal-confirm');
            setTimeout(() => {
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof renderVehicles === 'function') renderVehicles();
                if (typeof renderUnitsPage === 'function') renderUnitsPage();
                if (typeof updateAlertsDisplay === 'function') updateAlertsDisplay();
            }, 500);
        })
        .catch(error => {
            showToast("Erro ao excluir: " + error.message, "error");
            closeModal('modal-confirm');
        })
        .finally(() => {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        });
    
    window.deleteTarget = null;
}

// ==================== CONFIGURAÇÕES ====================
function updateCompanyInfo() {
    if (!window.currentCompany) return;
    
    const companyNameEl = document.getElementById('cfg-company-name');
    const companyPlanEl = document.getElementById('cfg-company-plan');
    const companyStatusEl = document.getElementById('cfg-company-status');
    
    if (companyNameEl) companyNameEl.textContent = window.currentCompany.name;
    if (companyPlanEl) {
        companyPlanEl.textContent = window.currentCompany.plan || 'trial';
        companyPlanEl.className = window.currentCompany.plan === 'premium' 
            ? 'bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs'
            : 'bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs';
    }
    if (companyStatusEl) {
        companyStatusEl.textContent = window.currentCompany.status || 'active';
        companyStatusEl.className = window.currentCompany.status === 'active'
            ? 'text-emerald-600 font-bold'
            : 'text-red-600 font-bold';
    }
    
    const savedEmail = localStorage.getItem('managerEmail_' + window.currentCompany.id);
    const emailInput = document.getElementById('cfg-manager-email');
    if (emailInput && savedEmail) {
        emailInput.value = savedEmail;
    }
}

function saveConfigs() {
    if (!window.currentCompany) return;
    
    const managerEmail = document.getElementById('cfg-manager-email').value.trim();
    
    if (managerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
        showToast("Digite um email válido", "error");
        return;
    }
    
    const settings = { managerEmail: managerEmail };
    
    const btn = document.querySelector('#page-config button[onclick="saveConfigs()"]');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    saveSettings(settings)
        .then(() => {
            localStorage.setItem('managerEmail_' + window.currentCompany.id, managerEmail);
            showToast("Configurações salvas com sucesso!", "success");
        })
        .catch(error => {
            showToast("Erro ao salvar: " + error.message, "error");
        })
        .finally(() => {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1000);
        });
}

// ==================== VISUALIZAR VEÍCULO ====================
function openViewVehicleModal(id) {
    if (!id) return;
    
    const vehicle = window.vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast("Veículo não encontrado", "error");
        return;
    }
    
    const vehicleMaintenances = window.maintenances.filter(m => m.vehicleId === id);
    const lastMaintenance = vehicleMaintenances.length > 0 
        ? vehicleMaintenances.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))[0]
        : null;
    
    const modalContent = `
        <div id="view-vehicle-modal" class="fixed inset-0 modal-overlay z-[8000] flex items-center justify-center p-4" onclick="if(event.target === this) closeViewVehicleModal()">
            <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white p-6 border-b rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800">Detalhes do Veículo</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase">Informações completas</p>
                    </div>
                    <button onclick="closeViewVehicleModal()" class="text-slate-400 hover:text-red-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-blue-50 p-4 rounded-xl">
                            <p class="text-xs text-blue-500 font-bold uppercase">Marca/Modelo</p>
                            <p class="text-lg font-bold text-slate-800">${vehicle.modelo || 'Não informado'}</p>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-xl">
                            <p class="text-xs text-blue-500 font-bold uppercase">Placa Oficial</p>
                            <p class="text-lg font-bold text-slate-800 font-mono">${vehicle.plateOff || '---'}</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-xl">
                            <p class="text-xs text-purple-500 font-bold uppercase">Placa Reservada</p>
                            <p class="text-lg font-bold text-slate-800 font-mono">${vehicle.plateRes || '<span class="text-slate-400 text-sm">Não cadastrada</span>'}</p>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl">
                            <p class="text-xs text-slate-500 font-bold uppercase">Tipo</p>
                            <p class="text-lg font-bold ${vehicle.type === 'locado' ? 'text-amber-600' : 'text-emerald-600'}">
                                ${vehicle.type === 'locado' ? '🚗 Locado' : '✅ Próprio'}
                                ${vehicle.rentalCo ? ` (${vehicle.rentalCo})` : ''}
                            </p>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl">
                            <p class="text-xs text-slate-500 font-bold uppercase">KM Atual</p>
                            <p class="text-lg font-bold text-slate-800">${(vehicle.km || 0).toLocaleString()} KM</p>
                        </div>
                        <div class="${vehicle.allMaintenanceDone ? 'bg-emerald-50' : 'bg-amber-50'} p-4 rounded-xl">
                            <p class="text-xs ${vehicle.allMaintenanceDone ? 'text-emerald-500' : 'text-amber-500'} font-bold uppercase">Status Manutenções</p>
                            <p class="text-lg font-bold ${vehicle.allMaintenanceDone ? 'text-emerald-600' : 'text-amber-600'}">
                                ${vehicle.allMaintenanceDone ? '✅ Todas realizadas' : '⏱️ Pendentes'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="bg-emerald-50 p-4 rounded-xl">
                        <p class="text-xs text-emerald-500 font-bold uppercase">Unidade Operacional</p>
                        <p class="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <i class="fas fa-building"></i> ${vehicle.unitName || 'Sem unidade'}
                        </p>
                    </div>
                    
                    <div class="bg-amber-50 p-4 rounded-xl">
                        <p class="text-xs text-amber-500 font-bold uppercase">Última Manutenção</p>
                        ${lastMaintenance ? `
                            <div class="mt-2">
                                <p class="font-bold text-slate-800">${lastMaintenance.description || 'Sem descrição'}</p>
                                <div class="flex gap-4 text-sm text-slate-600 mt-1">
                                    <span><i class="far fa-calendar mr-1"></i> ${new Date(lastMaintenance.date).toLocaleDateString('pt-BR')}</span>
                                    <span><i class="fas fa-tachometer-alt mr-1"></i> ${(lastMaintenance.km || 0).toLocaleString()} KM</span>
                                    ${lastMaintenance.location ? `<span><i class="fas fa-map-marker-alt mr-1"></i> ${lastMaintenance.location}</span>` : ''}
                                </div>
                            </div>
                        ` : `<p class="text-slate-600 mt-2">Nenhuma manutenção registrada</p>`}
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t">
                        <button onclick="openEditVehicleModal('${id}'); closeViewVehicleModal();" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                            <i class="fas fa-edit mr-2"></i> Editar Veículo
                        </button>
                        <button onclick="closeViewVehicleModal()" class="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300">
                            <i class="fas fa-times mr-2"></i> Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('view-vehicle-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function closeViewVehicleModal() {
    const modal = document.getElementById('view-vehicle-modal');
    if (modal) modal.remove();
}

// ==================== EXPORTAR DADOS ====================
function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportVehiclesToCSV() {
    if (window.vehicles.length === 0) {
        showToast("Não há dados para exportar", "warning");
        return;
    }
    
    const headers = ['ID', 'Modelo', 'Tipo', 'Locadora', 'Placa Oficial', 'Placa Reservada', 'Unidade', 'KM Atual', 'Manutenções Realizadas', 'Última Atualização', 'Data Cadastro'];
    
    const rows = window.vehicles.map(vehicle => {
        const lastUpdate = vehicle.lastUpdate || vehicle.updatedAt || vehicle.createdAt;
        const dateStr = lastUpdate ? new Date(lastUpdate).toLocaleDateString('pt-BR') : '';
        const createdAtStr = vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('pt-BR') : '';
        
        return [
            vehicle.id,
            `"${vehicle.modelo || ''}"`,
            vehicle.type === 'locado' ? 'Locado' : 'Próprio',
            `"${vehicle.rentalCo || ''}"`,
            vehicle.plateOff || '',
            vehicle.plateRes || '',
            `"${vehicle.unitName || ''}"`,
            vehicle.km || 0,
            vehicle.allMaintenanceDone ? 'Sim' : 'Não',
            dateStr,
            createdAtStr
        ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `frota_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast("Exportação em CSV iniciada!", "success");
}

// ==================== NOVA MANUTENÇÃO COM BUSCA POR PLACA ====================
function openNewMaintenanceModal(vehicleId = null) {
    console.log("🔧 Abrindo modal de manutenção", vehicleId);
    
    // Limpa os campos
    document.getElementById('m-desc').value = '';
    document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('m-km').value = '';
    document.getElementById('m-location').value = '';
    document.getElementById('m-type').value = 'oleo';
    
    if (vehicleId) {
        // Veio com ID específico (ex: clicou no botão de um veículo)
        const vehicle = window.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            document.getElementById('m-vehicle-id').value = vehicle.id;
            document.getElementById('m-vehicle-display').innerHTML = `
                <div class="flex justify-between items-center">
                    <span><strong>${vehicle.modelo || 'Veículo'}</strong> - ${vehicle.plateOff || 'Sem placa'}</span>
                    <span class="text-xs text-slate-500">${(vehicle.km || 0).toLocaleString()} KM</span>
                </div>
                <button type="button" onclick="resetMaintenanceVehicle()" 
                        class="text-xs text-blue-500 mt-1 hover:text-blue-700">
                    <i class="fas fa-exchange-alt mr-1"></i>Trocar veículo
                </button>
            `;
            document.getElementById('m-km').value = vehicle.km || 0;
        }
    } else {
        // Abriu sem veículo selecionado - mostra buscador por PLACA
        document.getElementById('m-vehicle-id').value = '';
        document.getElementById('m-vehicle-display').innerHTML = `
            <div class="relative">
                <div class="flex gap-2">
                    <input type="text" id="m-vehicle-search" 
                        class="flex-1 p-3 bg-slate-50 border rounded-lg focus:border-blue-500 outline-none uppercase" 
                        placeholder="🔍 Digite a PLACA do veículo (ex: ABC1234)"
                        autocomplete="off">
                    <button type="button" onclick="searchVehicleByPlate()" 
                        class="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                <div id="m-vehicle-results" class="absolute z-50 w-full bg-white border rounded-lg shadow-lg mt-1 hidden max-h-48 overflow-y-auto"></div>
            </div>
            <p class="text-[10px] text-slate-400 mt-2">Digite a placa e clique na lupa para buscar</p>
        `;
        
        // Configura a busca ao pressionar Enter
        setTimeout(() => {
            const searchInput = document.getElementById('m-vehicle-search');
            if (searchInput) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        searchVehicleByPlate();
                    }
                });
            }
        }, 100);
    }
    
    openModal('modal-manutencao');
}

function searchVehicleByPlate() {
    const searchInput = document.getElementById('m-vehicle-search');
    if (!searchInput) return;
    
    const plate = searchInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const resultsDiv = document.getElementById('m-vehicle-results');
    
    if (!plate) {
        showToast("Digite uma placa para buscar", "warning");
        return;
    }
    
    // Busca exata por placa oficial
    const vehicle = window.vehicles.find(v => v.plateOff === plate);
    
    if (!vehicle) {
        resultsDiv.innerHTML = `
            <div class="p-3 text-center">
                <div class="text-red-500 font-bold">Veículo não encontrado!</div>
                <div class="text-sm text-slate-500 mt-1">Placa "${plate}" não cadastrada</div>
                <button onclick="closeModal('modal-manutencao'); openNewVehicleModal();" 
                    class="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    <i class="fas fa-plus mr-1"></i> Cadastrar novo veículo
                </button>
            </div>
        `;
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.innerHTML = `
            <div class="p-3 hover:bg-blue-50 cursor-pointer" 
                 onclick="selectVehicleForMaintenance('${vehicle.id}', '${vehicle.modelo || 'Veículo'}', '${vehicle.plateOff || ''}', ${vehicle.km || 0})">
                <div class="font-bold text-slate-800">${vehicle.modelo || 'Veículo'}</div>
                <div class="text-sm text-slate-500">Placa: ${vehicle.plateOff} • ${(vehicle.km || 0).toLocaleString()} KM</div>
                <div class="text-xs text-slate-400">Unidade: ${vehicle.unitName || 'Sem unidade'}</div>
            </div>
        `;
        resultsDiv.classList.remove('hidden');
        
        // Fecha o dropdown após selecionar (com delay para o clique)
        setTimeout(() => {
            const resultItem = resultsDiv.querySelector('.cursor-pointer');
            if (resultItem) {
                resultItem.click();
            }
        }, 100);
    }
}

function selectVehicleForMaintenance(id, modelo, placa, km) {
    document.getElementById('m-vehicle-id').value = id;
    document.getElementById('m-vehicle-display').innerHTML = `
        <div class="flex justify-between items-center">
            <span><strong>${modelo}</strong> - ${placa}</span>
            <span class="text-xs text-slate-500">${km.toLocaleString()} KM</span>
        </div>
        <button type="button" onclick="resetMaintenanceVehicle()" 
                class="text-xs text-blue-500 mt-1 hover:text-blue-700">
            <i class="fas fa-exchange-alt mr-1"></i>Trocar veículo
        </button>
    `;
    document.getElementById('m-km').value = km || 0;
    
    // Fecha o dropdown
    const resultsDiv = document.getElementById('m-vehicle-results');
    if (resultsDiv) resultsDiv.classList.add('hidden');
    
    // Limpa o campo de busca
    const searchInput = document.getElementById('m-vehicle-search');
    if (searchInput) searchInput.value = '';
}

function resetMaintenanceVehicle() {
    document.getElementById('m-vehicle-id').value = '';
    document.getElementById('m-vehicle-display').innerHTML = `
        <div class="relative">
            <div class="flex gap-2">
                <input type="text" id="m-vehicle-search" 
                    class="flex-1 p-3 bg-slate-50 border rounded-lg focus:border-blue-500 outline-none uppercase" 
                    placeholder="🔍 Digite a PLACA do veículo (ex: ABC1234)"
                    autocomplete="off">
                <button type="button" onclick="searchVehicleByPlate()" 
                    class="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <div id="m-vehicle-results" class="absolute z-50 w-full bg-white border rounded-lg shadow-lg mt-1 hidden max-h-48 overflow-y-auto"></div>
        </div>
        <p class="text-[10px] text-slate-400 mt-2">Digite a placa e clique na lupa para buscar</p>
    `;
    document.getElementById('m-km').value = '';
    
    // Reconfigura a busca
    setTimeout(() => {
        const searchInput = document.getElementById('m-vehicle-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchVehicleByPlate();
                }
            });
        }
    }, 100);
}

function scheduleMaintenance(vehicleId) {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    const suggestedDate = nextMonth.toISOString().split('T')[0];
    
    openNewMaintenanceModal(vehicleId);
    
    setTimeout(() => {
        const dateInput = document.getElementById('m-date');
        if (dateInput) dateInput.value = suggestedDate;
    }, 100);
}

function exportMaintenanceReport() {
    const data = window.maintenances.map(m => {
        const vehicle = window.vehicles.find(v => v.id === m.vehicleId);
        return {
            'Data': m.date || '',
            'Veículo': vehicle?.modelo || '',
            'Placa': vehicle?.plateOff || '',
            'Unidade': vehicle?.unitName || '',
            'Tipo': getMaintenanceTypeLabel(m.type),
            'Descrição': m.description || '',
            'KM': m.km || '',
            'Responsável': m.createdBy || ''
        };
    });
    
    if (data.length > 0) {
        exportToCSV(data, `relatorio_manutencoes_${new Date().toISOString().split('T')[0]}.csv`);
        showToast(`Exportado ${data.length} registros de manutenção`, "success");
    } else {
        showToast("Nenhuma manutenção para exportar", "info");
    }
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

// ==================== INICIALIZAÇÃO DE EVENTOS ====================
document.addEventListener('DOMContentLoaded', function() {
    const formUnit = document.getElementById('form-unit');
    if (formUnit) {
        formUnit.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUnitForm();
        });
    }
    
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', confirmDeleteAction);
    }
    
    const quickUnitName = document.getElementById('quick-unit-name');
    const quickUnitCity = document.getElementById('quick-unit-city');
    
    if (quickUnitName && quickUnitCity) {
        quickUnitName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                quickUnitCity.focus();
            }
        });
        
        quickUnitCity.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveQuickUnit();
            }
        });
    }
    
    const vModel = document.getElementById('v-model');
    if (vModel) {
        vModel.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('v-plate-off').focus();
            }
        });
    }
    
    const vPlateOff = document.getElementById('v-plate-off');
    if (vPlateOff) {
        vPlateOff.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }
    
    const vPlateRes = document.getElementById('v-plate-res');
    if (vPlateRes) {
        vPlateRes.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }
});

// ==================== EXPORTAÇÕES ====================
window.openNewVehicleModal = openNewVehicleModal;
window.openEditVehicleModal = openEditVehicleModal;
window.renderMaintenanceList = renderMaintenanceList;
window.addMaintenance = addMaintenance;
window.deleteMaintenance = deleteMaintenance;
window.openQuickUnitModal = openQuickUnitModal;
window.saveQuickUnit = saveQuickUnit;
window.openUnitModal = openUnitModal;
window.saveUnitForm = saveUnitForm;
window.confirmDeleteVehicle = confirmDeleteVehicle;
window.confirmDeleteUnit = confirmDeleteUnit;
window.confirmDeleteAction = confirmDeleteAction;
window.updateCompanyInfo = updateCompanyInfo;
window.saveConfigs = saveConfigs;
window.saveVehicle = saveVehicle;
window.toggleRentalField = toggleRentalField;
window.switchTab = switchTab;
window.updateUnitSelect = updateUnitSelect;
window.openViewVehicleModal = openViewVehicleModal;
window.closeViewVehicleModal = closeViewVehicleModal;
window.exportToCSV = exportToCSV;
window.exportVehiclesToCSV = exportVehiclesToCSV;
window.openNewMaintenanceModal = openNewMaintenanceModal;
window.scheduleMaintenance = scheduleMaintenance;
window.exportMaintenanceReport = exportMaintenanceReport;
window.getMaintenanceTypeLabel = getMaintenanceTypeLabel;
window.searchVehicleByPlate = searchVehicleByPlate;
window.selectVehicleForMaintenance = selectVehicleForMaintenance;
window.resetMaintenanceVehicle = resetMaintenanceVehicle;