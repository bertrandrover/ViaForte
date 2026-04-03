// js/ui.js

// ==================== INTERFACE E MODAIS ====================

// Variável global para o alvo de exclusão
let deleteTarget = null;

// ==================== MODAL VEÍCULO ====================
function openNewVehicleModal() {
    resetVehicleForm();
    document.getElementById('modal-vehicle-title').textContent = "Novo Veículo";
    document.getElementById('modal-vehicle-subtitle').textContent = "Cadastro na Frota";
    document.getElementById('tab-manutencao').classList.add('hidden');
    switchTab('cadastro');
    openModal('modal-veiculo');
    
    // Foco no primeiro campo
    setTimeout(() => {
        const firstInput = document.getElementById('v-model');
        if (firstInput) firstInput.focus();
    }, 100);
}

function openEditVehicleModal(id) {
    if (!id) return;
    
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast("Veículo não encontrado", "error");
        return;
    }
    
    // Preenche o formulário
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
    
    // Carrega manutenções deste veículo
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
    
    const vehicleMaintenances = maintenances.filter(m => m.vehicleId === vehicleId);
    
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
    
    // Ordena por data (mais recente primeiro)
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
                        <span class="flex items-center gap-1">
                            <i class="far fa-calendar"></i> ${date}
                        </span>
                        ${m.location ? `
                            <span class="flex items-center gap-1">
                                <i class="fas fa-map-marker-alt text-blue-500"></i> ${m.location}
                            </span>
                        ` : ''}
                        <span class="flex items-center gap-1">
                            <i class="fas fa-tachometer-alt text-amber-500"></i> ${kmText}
                        </span>
                        ${m.createdBy ? `
                            <span class="flex items-center gap-1">
                                <i class="fas fa-user text-purple-500"></i> ${m.createdBy.split('@')[0]}
                            </span>
                        ` : ''}
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

function getMaintenanceTypeLabel(type) {
    const labels = {
        'oleo': '🛢️ Óleo',
        'revisao': '🔧 Revisão',
        'pneus': '🚗 Pneus',
        'freios': '🛑 Freios',
        'outro': '✨ Outro'
    };
    return labels[type] || '✨ Outro';
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
    
    // Valida data
    if (new Date(date) > new Date()) {
        showToast("Data não pode ser futura", "error");
        return;
    }
    
    // Busca o veículo atual
    const currentVehicle = vehicles.find(v => v.id === vehicleId);
    
    // Prepara dados da manutenção
    const maintenanceData = {
        vehicleId: vehicleId,
        type: type,
        description: desc,
        date: date,
        km: maintKm,
        location: location,
        createdBy: currentUser?.email || 'sistema',
        createdAt: Date.now()
    };
    
    // Mostra loading
    const btn = document.querySelector('#content-manutencao button[onclick="addMaintenance()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...';
    btn.disabled = true;
    
    // Salva a manutenção
    saveMaintenance(maintenanceData)
        .then(() => {
            // Atualiza KM do veículo se necessário
            if (maintKm > (currentVehicle?.km || 0)) {
                const updateData = {
                    id: vehicleId,
                    km: maintKm,
                    lastUpdate: Date.now(),
                    updatedAt: Date.now(),
                    updatedBy: currentUser?.email
                };
                
                return saveVehicleToDB(updateData);
            }
            return Promise.resolve();
        })
        .then(() => {
            showToast("Manutenção registrada com sucesso!", "success");
            
            // Limpa os campos
            document.getElementById('m-desc').value = '';
            document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('m-km').value = '';
            document.getElementById('m-location').value = '';
            document.getElementById('m-type').value = 'outro';
            
            // Atualiza a lista e o campo KM
            setTimeout(() => {
                renderMaintenanceList(vehicleId);
                // Atualiza o KM no formulário
                const currentVehicleUpdated = vehicles.find(v => v.id === vehicleId);
                if (currentVehicleUpdated && currentVehicleUpdated.km) {
                    document.getElementById('v-km').value = currentVehicleUpdated.km;
                }
            }, 500);
        })
        .catch(error => {
            console.error("Erro ao salvar manutenção:", error);
            showToast("Erro ao salvar manutenção: " + error.message, "error");
        })
        .finally(() => {
            // Restaura botão
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
        maintenanceBaselineDate: new Date().toISOString().split('T')[0],
        lastUpdate: Date.now(),
        updatedAt: Date.now(),
        updatedBy: currentUser?.email
    };
    
    // Validação básica
    if (!vehicleData.modelo || !vehicleData.plateOff) {
        showToast("Preencha Modelo e Placa Oficial", "error");
        return;
    }
    
    if (vehicleData.km < 0) {
        showToast("KM não pode ser negativo", "error");
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
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    // Salva no banco
    if (typeof window.saveVehicleToDB === 'function') {
        window.saveVehicleToDB(vehicleData)
            .then(() => {
                showToast(id ? "Veículo atualizado!" : "Veículo criado!");
                closeModal('modal-veiculo');
            })
            .catch(error => {
                showToast("Erro ao salvar: " + error.message, "error");
            })
            .finally(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
    } else {
        showToast("Erro: Função de salvamento não encontrada", "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
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
    
    const existingUnit = units.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingUnit) {
        showToast(`Unidade "${name}" já existe`, "error");
        const select = document.getElementById('v-unit-select');
        if (select) select.value = existingUnit.id;
        closeModal('modal-unidade-rapida');
        return;
    }
    
    const unitData = { name: name, city: city };
    
    const btn = document.querySelector('#modal-unidade-rapida button[onclick="saveQuickUnit()"]');
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
                const newUnit = units.find(u => u.name === name);
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
        const unit = units.find(u => u.id === id);
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
    
    const existingUnit = units.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.id !== id
    );
    
    if (existingUnit) {
        showToast(`Já existe uma unidade com o nome "${name}"`, "error");
        return;
    }
    
    const unitData = { id: id || null, name: name, city: city };
    
    const btn = document.querySelector('#form-unit button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    saveUnit(unitData)
        .then(() => {
            showToast(id ? "Unidade atualizada!" : "Unidade criada!");
            closeModal('modal-unidade');
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
    
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `${unit.name} ${unit.city ? `- ${unit.city}` : ''}`;
        select.appendChild(option);
    });
    
    if (currentValue && units.some(u => u.id === currentValue)) {
        select.value = currentValue;
    }
}

// ==================== CONFIRMAÇÃO DE EXCLUSÃO ====================
function confirmDeleteVehicle(vehicleId, vehicleName, plate) {
    deleteTarget = { type: 'vehicle', id: vehicleId, name: vehicleName, plate: plate };
    document.getElementById('confirm-message').innerHTML = `Excluir o veículo <strong>"${vehicleName}"</strong> - ${plate}?<br><small class="text-red-500">Todas as manutenções também serão excluídas.</small>`;
    openModal('modal-confirm');
}

function confirmDeleteUnit(unitId, unitName) {
    deleteTarget = { type: 'unit', id: unitId, name: unitName };
    document.getElementById('confirm-message').innerHTML = `Excluir a unidade <strong>"${unitName}"</strong>?`;
    openModal('modal-confirm');
}

function confirmDeleteAction() {
    if (!deleteTarget) {
        closeModal('modal-confirm');
        return;
    }
    
    const { type, id, name } = deleteTarget;
    
    const confirmBtn = document.getElementById('btn-confirm-delete');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    confirmBtn.disabled = true;
    
    const promise = type === 'unit' ? deleteUnit(id) : deleteVehicle(id);
    
    promise
        .then(() => {
            showToast(`${type === 'unit' ? 'Unidade' : 'Veículo'} "${name}" excluído`, "success");
            closeModal('modal-confirm');
        })
        .catch(error => {
            showToast("Erro ao excluir: " + error.message, "error");
            closeModal('modal-confirm');
        })
        .finally(() => {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        });
    
    deleteTarget = null;
}

// ==================== CONFIGURAÇÕES ====================
function updateCompanyInfo() {
    if (!currentCompany) return;
    
    const companyNameEl = document.getElementById('cfg-company-name');
    const companyPlanEl = document.getElementById('cfg-company-plan');
    const companyStatusEl = document.getElementById('cfg-company-status');
    
    if (companyNameEl) companyNameEl.textContent = currentCompany.name;
    if (companyPlanEl) {
        companyPlanEl.textContent = currentCompany.plan || 'trial';
        companyPlanEl.className = currentCompany.plan === 'premium' 
            ? 'bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs'
            : 'bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs';
    }
    if (companyStatusEl) {
        companyStatusEl.textContent = currentCompany.status || 'active';
        companyStatusEl.className = currentCompany.status === 'active'
            ? 'text-emerald-600 font-bold'
            : 'text-red-600 font-bold';
    }
    
    const savedEmail = localStorage.getItem('managerEmail_' + currentCompany.id);
    const emailInput = document.getElementById('cfg-manager-email');
    if (emailInput && savedEmail) {
        emailInput.value = savedEmail;
    }
}

function saveConfigs() {
    if (!currentCompany) return;
    
    const managerEmail = document.getElementById('cfg-manager-email').value.trim();
    
    if (managerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
        showToast("Digite um email válido", "error");
        return;
    }
    
    const settings = { managerEmail: managerEmail };
    
    const btn = document.querySelector('#page-config button[onclick="saveConfigs()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;
    
    saveSettings(settings)
        .then(() => {
            localStorage.setItem('managerEmail_' + currentCompany.id, managerEmail);
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
    
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast("Veículo não encontrado", "error");
        return;
    }
    
    const vehicleMaintenances = maintenances.filter(m => m.vehicleId === id);
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
function exportToCSV() {
    if (vehicles.length === 0) {
        showToast("Não há dados para exportar", "warning");
        return;
    }
    
    const headers = ['ID', 'Modelo', 'Tipo', 'Locadora', 'Placa Oficial', 'Placa Reservada', 'Unidade', 'KM Atual', 'Manutenções Realizadas', 'Última Atualização', 'Data Cadastro'];
    
    const rows = vehicles.map(vehicle => {
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

// ==================== FUNÇÕES GLOBAIS ADICIONAIS ====================
function openNewMaintenanceModal(vehicleId = null) {
    if (vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            document.getElementById('m-vehicle-id').value = vehicleId;
            document.getElementById('m-vehicle-display').textContent = `${vehicle.modelo || 'Veículo'} - ${vehicle.plateOff || ''}`;
            document.getElementById('m-km').value = vehicle.km || 0;
        }
    }
    openModal('modal-manutencao');
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
    const data = maintenances.map(m => {
        const vehicle = vehicles.find(v => v.id === m.vehicleId);
        return {
            'Data': m.date || '',
            'Veículo': vehicle?.modelo || '',
            'Placa': vehicle?.plateOff || '',
            'Unidade': vehicle?.unitName || '',
            'Tipo': getMaintenanceTypeLabel(m.type),
            'Descrição': m.description || '',
            'KM': m.km || '',
            'Valor': m.cost || '',
            'Responsável': m.responsible || ''
        };
    });
    
    if (data.length > 0) {
        exportToCSV(data, `relatorio_manutencoes_${new Date().toISOString().split('T')[0]}.csv`);
        showToast(`Exportado ${data.length} registros de manutenção`, "success");
    } else {
        showToast("Nenhuma manutenção para exportar", "info");
    }
}

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
window.openNewMaintenanceModal = openNewMaintenanceModal;
window.scheduleMaintenance = scheduleMaintenance;
window.exportMaintenanceReport = exportMaintenanceReport;

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
    
    // Formatação de placa simplificada
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