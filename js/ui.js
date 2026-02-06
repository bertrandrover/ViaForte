// js/ui.js

// ==================== INTERFACE E MODAIS ====================

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
    
    toggleRentalField();
    document.getElementById('modal-vehicle-title').textContent = "Editar Veículo";
    document.getElementById('modal-vehicle-subtitle').textContent = `${vehicle.modelo || 'Veículo'} - ${vehicle.plateOff || 'Sem placa'}`;
    document.getElementById('tab-manutencao').classList.remove('hidden');
    
    // Carrega manutenções deste veículo
    renderMaintenanceList(vehicle.id);
    
    openModal('modal-veiculo');
}

// ==================== MANUTENÇÕES ====================
function renderMaintenanceList(vehicleId) {
    const listEl = document.getElementById('maintenance-list');
    if (!listEl) return;
    
    const vehicleMaintenances = maintenances.filter(m => m.vehicleId === vehicleId);
    
    if (vehicleMaintenances.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state p-6">
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
        
        return `
            <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white transition">
                <div class="w-full">
                    <p class="text-sm font-bold text-slate-800">${m.description || 'Sem descrição'}</p>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-slate-500">
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
                <button onclick="deleteMaintenance('${m.id}')" class="text-red-400 hover:text-red-600 text-xs ml-2 btn-action" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
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
    type: document.getElementById('m-type').value || 'outro', // LINHA NOVA
    description: desc,
    date: date,
    km: maintKm,
    location: location
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
                    km: maintKm,
                    lastUpdate: Date.now()
                };
                
                saveVehicle({
                    id: vehicleId,
                    ...updateData
                }).then(() => {
                    showToast("Manutenção registrada e KM atualizado!", "success");
                });
            } else {
                showToast("Manutenção registrada com sucesso!", "success");
            }
            
            // Limpa os campos
            document.getElementById('m-desc').value = '';
            document.getElementById('m-date').value = '';
            document.getElementById('m-km').value = '';
            document.getElementById('m-location').value = '';
            
            // Atualiza a lista
            setTimeout(() => renderMaintenanceList(vehicleId), 300);
        })
        .catch(error => {
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

// ==================== MODAL UNIDADE RÁPIDA ====================
function openQuickUnitModal() {
    // Limpa os campos
    document.getElementById('quick-unit-name').value = '';
    document.getElementById('quick-unit-city').value = '';
    
    // Abre o modal
    openModal('modal-unidade-rapida');
    
    // Foco no primeiro campo
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
    
    // Verifica se já existe unidade com este nome
    const existingUnit = units.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingUnit) {
        showToast(`Unidade "${name}" já existe`, "error");
        
        // Seleciona a unidade existente
        const select = document.getElementById('v-unit-select');
        if (select) {
            select.value = existingUnit.id;
        }
        
        closeModal('modal-unidade-rapida');
        return;
    }
    
    const unitData = {
        name: name,
        city: city
    };
    
    // Mostra loading no botão
    const btn = document.querySelector('#modal-unidade-rapida button[onclick="saveQuickUnit()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Criando...';
    btn.disabled = true;
    
    // Salva a unidade
    saveUnit(unitData)
        .then(() => {
            showToast("Unidade criada com sucesso!", "success");
            
            // Fecha o modal rápido
            closeModal('modal-unidade-rapida');
            
            // Atualiza o seletor de unidades
            setTimeout(() => {
                updateUnitSelect();
                
                // Seleciona automaticamente a unidade criada
                const select = document.getElementById('v-unit-select');
                const newUnit = units.find(u => u.name === name);
                
                if (newUnit && select) {
                    select.value = newUnit.id;
                    showToast(`Unidade "${name}" selecionada automaticamente`, "success");
                }
            }, 500);
        })
        .catch(error => {
            showToast("Erro ao criar unidade: " + error.message, "error");
        })
        .finally(() => {
            // Restaura botão
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
    
    // Foco no primeiro campo
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
    
    // Verifica duplicação (exceto se estiver editando a mesma unidade)
    const existingUnit = units.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.id !== id
    );
    
    if (existingUnit) {
        showToast(`Já existe uma unidade com o nome "${name}"`, "error");
        return;
    }
    
    const unitData = {
        id: id || null,
        name: name,
        city: city
    };
    
    // Mostra loading no botão
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
            // Restaura botão
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

// ==================== CONFIRMAÇÃO DE EXCLUSÃO ====================
function confirmDeleteVehicle(vehicleId, vehicleName, plate) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    deleteTarget = { 
        type: 'vehicle', 
        id: vehicleId, 
        name: vehicleName,
        plate: plate 
    };
    
    const message = `Excluir o veículo <strong>"${vehicleName}"</strong> - ${plate}?<br>
                     <small class="text-red-500">Todas as manutenções também serão excluídas.</small>`;
    
    document.getElementById('confirm-message').innerHTML = message;
    openModal('modal-confirm');
}

function confirmDeleteUnit(unitId, unitName) {
    deleteTarget = { 
        type: 'unit', 
        id: unitId, 
        name: unitName 
    };
    
    const message = `Excluir a unidade <strong>"${unitName}"</strong>?`;
    document.getElementById('confirm-message').innerHTML = message;
    openModal('modal-confirm');
}

function confirmDeleteAction() {
    if (!deleteTarget) {
        closeModal('modal-confirm');
        return;
    }
    
    const { type, id, name } = deleteTarget;
    
    // Mostra loading no botão de confirmação
    const confirmBtn = document.getElementById('btn-confirm-delete');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    confirmBtn.disabled = true;
    
    if (type === 'unit') {
        deleteUnit(id)
            .then(() => {
                showToast(`Unidade "${name}" excluída`, "success");
                closeModal('modal-confirm');
            })
            .catch(error => {
                showToast("Erro ao excluir: " + error.message, "error");
                closeModal('modal-confirm');
            })
            .finally(() => {
                // Restaura botão
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            });
    } 
    else if (type === 'vehicle') {
        deleteVehicle(id)
            .then(() => {
                showToast(`Veículo "${name}" excluído`, "success");
                closeModal('modal-confirm');
            })
            .catch(error => {
                showToast("Erro ao excluir: " + error.message, "error");
                closeModal('modal-confirm');
            })
            .finally(() => {
                // Restaura botão
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            });
    }
    
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
    
    // Carrega email do gerente salvo
    const savedEmail = localStorage.getItem('managerEmail_' + currentCompany.id);
    const emailInput = document.getElementById('cfg-manager-email');
    if (emailInput && savedEmail) {
        emailInput.value = savedEmail;
    }
}

function saveConfigs() {
    if (!currentCompany) return;
    
    const managerEmail = document.getElementById('cfg-manager-email').value.trim();
    
    // Valida email
    if (managerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
        showToast("Digite um email válido", "error");
        return;
    }
    
    const settings = {
        managerEmail: managerEmail
    };
    
    // Mostra loading no botão
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
            // Restaura botão
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1000);
        });
}

// ==================== EXPORTAÇÕES ====================
// Torna as funções disponíveis globalmente
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

// Configura eventos dos formulários
document.addEventListener('DOMContentLoaded', function() {
    // Formulário de unidade
    const formUnit = document.getElementById('form-unit');
    if (formUnit) {
        formUnit.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUnitForm();
        });
    }
    
    // Botão de confirmação de exclusão
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', confirmDeleteAction);
    }
    
    // Evento de tecla Enter no modal de unidade rápida
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
    
    // Evento de tecla Enter no modal de veículo
    const vModel = document.getElementById('v-model');
    if (vModel) {
        vModel.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('v-plate-off').focus();
            }
        });
    }
    
    // Formata placa automática
    const vPlateOff = document.getElementById('v-plate-off');
    if (vPlateOff) {
        vPlateOff.addEventListener('input', function(e) {
            let value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            
            // Formato: AAA-9999
            if (value.length > 3 && !value.includes('-')) {
                value = value.substring(0, 3) + '-' + value.substring(3);
            }
            
            this.value = value.substring(0, 8); // Limita ao formato
        });
    }
    
    const vPlateRes = document.getElementById('v-plate-res');
    if (vPlateRes) {
        vPlateRes.addEventListener('input', function(e) {
            let value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            
            // Formato: AAA-9999
            if (value.length > 3 && !value.includes('-')) {
                value = value.substring(0, 3) + '-' + value.substring(3);
            }
            
            this.value = value.substring(0, 8); // Limita ao formato
        });
    }
});