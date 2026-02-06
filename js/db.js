// js/db.js

// ==================== BANCO DE DADOS MULTI-TENANT ====================

// ==================== CARREGAR DADOS DA EMPRESA ====================
function loadCompanyData() {
    if (!currentCompany || !currentCompany.id) {
        console.error("Nenhuma empresa selecionada para carregar dados");
        return;
    }
    
    const companyId = currentCompany.id;
    console.log(`Carregando dados da empresa: ${companyId}`);
    
    // Carrega veículos
    db.ref('data/' + companyId + '/vehicles').on('value', (snap) => {
        const data = snap.val();
        vehicles = data ? Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key],
            companyId: companyId 
        })) : [];
        
        console.log(`${vehicles.length} veículos carregados`);
        
        // Atualiza a interface
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
        if (typeof renderVehicles === 'function') {
            renderVehicles();
        }
        if (typeof updateQuickSearch === 'function') {
            updateQuickSearch();
        }
    }, (error) => {
        console.error("Erro ao carregar veículos:", error);
        showToast("Erro ao carregar veículos", "error");
    });
    
    // Carrega unidades
    db.ref('data/' + companyId + '/units').on('value', (snap) => {
        const data = snap.val();
        units = data ? Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key],
            companyId: companyId 
        })) : [];
        
        console.log(`${units.length} unidades carregadas`);
        
        // Atualiza a interface
        if (typeof updateUnitSelect === 'function') {
            updateUnitSelect();
        }
        if (typeof renderUnitsPage === 'function') {
            renderUnitsPage();
        }
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
    }, (error) => {
        console.error("Erro ao carregar unidades:", error);
        showToast("Erro ao carregar unidades", "error");
    });
    
    // Carrega manutenções
    db.ref('data/' + companyId + '/maintenances').on('value', (snap) => {
        const data = snap.val();
        maintenances = data ? Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key],
            companyId: companyId 
        })) : [];
        
        console.log(`${maintenances.length} manutenções carregadas`);
    }, (error) => {
        console.error("Erro ao carregar manutenções:", error);
    });
    
    // Carrega configurações
    db.ref('data/' + companyId + '/settings').on('value', (snap) => {
        const settings = snap.val() || {};
        if (settings.managerEmail) {
            localStorage.setItem('managerEmail_' + companyId, settings.managerEmail);
        }
    });
}

// ==================== VEÍCULOS ====================
function saveVehicle(vehicleData) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        const id = vehicleData.id;
        
        // Remove o ID dos dados a serem salvos
        const dataToSave = { ...vehicleData };
        delete dataToSave.id;
        
        // Adiciona informações de auditoria
        dataToSave.updatedAt = Date.now();
        dataToSave.updatedBy = currentUser.email;
        dataToSave.companyId = companyId;
        
        if (id) {
            // Atualizar veículo existente
            console.log(`Atualizando veículo ${id} na empresa ${companyId}`);
            
            db.ref('data/' + companyId + '/vehicles/' + id).update(dataToSave)
                .then(() => {
                    console.log("Veículo atualizado com sucesso");
                    resolve({ id, ...dataToSave });
                })
                .catch(error => {
                    console.error("Erro ao atualizar veículo:", error);
                    reject("Erro ao atualizar veículo: " + error.message);
                });
        } else {
            // Criar novo veículo
            dataToSave.createdAt = Date.now();
            dataToSave.createdBy = currentUser.email;
            
            console.log(`Criando novo veículo na empresa ${companyId}`);
            
            db.ref('data/' + companyId + '/vehicles').push(dataToSave)
                .then((ref) => {
                    console.log("Veículo criado com sucesso, ID:", ref.key);
                    resolve({ id: ref.key, ...dataToSave });
                })
                .catch(error => {
                    console.error("Erro ao criar veículo:", error);
                    reject("Erro ao criar veículo: " + error.message);
                });
        }
    });
}

function deleteVehicle(vehicleId) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        
        console.log(`Excluindo veículo ${vehicleId} da empresa ${companyId}`);
        
        // Primeiro, deleta todas as manutenções deste veículo
        const vehicleMaintenances = maintenances.filter(m => m.vehicleId === vehicleId);
        console.log(`Encontradas ${vehicleMaintenances.length} manutenções para excluir`);
        
        const deletePromises = vehicleMaintenances.map(m => 
            db.ref('data/' + companyId + '/maintenances/' + m.id).remove()
        );
        
        // Depois deleta o veículo
        deletePromises.push(
            db.ref('data/' + companyId + '/vehicles/' + vehicleId).remove()
        );
        
        Promise.all(deletePromises)
            .then(() => {
                // Atualiza a lista local
                vehicles = vehicles.filter(v => v.id !== vehicleId);
                maintenances = maintenances.filter(m => m.vehicleId !== vehicleId);
                
                console.log("Veículo e manutenções excluídos com sucesso");
                resolve();
            })
            .catch(error => {
                console.error("Erro ao excluir veículo:", error);
                reject("Erro ao excluir veículo: " + error.message);
            });
    });
}

// ==================== UNIDADES ====================
function saveUnit(unitData) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        const id = unitData.id;
        
        // Remove o ID dos dados a serem salvos
        const dataToSave = { ...unitData };
        delete dataToSave.id;
        
        // Adiciona informações de auditoria
        dataToSave.updatedAt = Date.now();
        dataToSave.updatedBy = currentUser.email;
        dataToSave.companyId = companyId;
        
        if (id) {
            // Atualizar unidade existente
            console.log(`Atualizando unidade ${id} na empresa ${companyId}`);
            
            db.ref('data/' + companyId + '/units/' + id).update(dataToSave)
                .then(() => {
                    console.log("Unidade atualizada com sucesso");
                    resolve({ id, ...dataToSave });
                })
                .catch(error => {
                    console.error("Erro ao atualizar unidade:", error);
                    reject("Erro ao atualizar unidade: " + error.message);
                });
        } else {
            // Criar nova unidade
            dataToSave.createdAt = Date.now();
            dataToSave.createdBy = currentUser.email;
            
            console.log(`Criando nova unidade na empresa ${companyId}`);
            
            db.ref('data/' + companyId + '/units').push(dataToSave)
                .then((ref) => {
                    console.log("Unidade criada com sucesso, ID:", ref.key);
                    resolve({ id: ref.key, ...dataToSave });
                })
                .catch(error => {
                    console.error("Erro ao criar unidade:", error);
                    reject("Erro ao criar unidade: " + error.message);
                });
        }
    });
}

function deleteUnit(unitId) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        
        // Verifica se há veículos nesta unidade
        const hasVehicles = vehicles.some(v => v.unitId === unitId || v.unitName === unitId);
        
        if (hasVehicles) {
            reject("Não é possível excluir: unidade possui veículos vinculados");
            return;
        }
        
        console.log(`Excluindo unidade ${unitId} da empresa ${companyId}`);
        
        db.ref('data/' + companyId + '/units/' + unitId).remove()
            .then(() => {
                // Atualiza a lista local
                units = units.filter(u => u.id !== unitId);
                console.log("Unidade excluída com sucesso");
                resolve();
            })
            .catch(error => {
                console.error("Erro ao excluir unidade:", error);
                reject("Erro ao excluir unidade: " + error.message);
            });
    });
}

// ==================== MANUTENÇÕES ====================
function saveMaintenance(maintenanceData) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        
        // Adiciona informações de auditoria
        maintenanceData.createdAt = Date.now();
        maintenanceData.createdBy = currentUser.email;
        maintenanceData.companyId = companyId;
        
        console.log(`Salvando manutenção na empresa ${companyId}`);
        
        db.ref('data/' + companyId + '/maintenances').push(maintenanceData)
            .then((ref) => {
                console.log("Manutenção salva com sucesso, ID:", ref.key);
                resolve({ id: ref.key, ...maintenanceData });
            })
            .catch(error => {
                console.error("Erro ao salvar manutenção:", error);
                reject("Erro ao salvar manutenção: " + error.message);
            });
    });
}

function deleteMaintenanceFromDB(maintenanceId) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        
        console.log(`Excluindo manutenção ${maintenanceId} da empresa ${companyId}`);
        
        db.ref('data/' + companyId + '/maintenances/' + maintenanceId).remove()
            .then(() => {
                // Atualiza a lista local
                maintenances = maintenances.filter(m => m.id !== maintenanceId);
                console.log("Manutenção excluída com sucesso");
                resolve();
            })
            .catch(error => {
                console.error("Erro ao excluir manutenção:", error);
                reject("Erro ao excluir manutenção: " + error.message);
            });
    });
}

// ==================== CONFIGURAÇÕES ====================
function saveSettings(settings) {
    return new Promise((resolve, reject) => {
        if (!currentCompany || !currentCompany.id) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = currentCompany.id;
        
        console.log(`Salvando configurações da empresa ${companyId}`);
        
        db.ref('data/' + companyId + '/settings').update(settings)
            .then(() => {
                console.log("Configurações salvas com sucesso");
                resolve();
            })
            .catch(error => {
                console.error("Erro ao salvar configurações:", error);
                reject("Erro ao salvar configurações: " + error.message);
            });
    });
}

// ==================== FUNÇÕES AUXILIARES ====================
function updateQuickSearch() {
    const searchSelect = document.getElementById('quick-search');
    if (!searchSelect) return;
    
    // Salva o valor atual
    const currentValue = searchSelect.value;
    
    // Limpa as opções
    searchSelect.innerHTML = '<option value="">🔍 Buscar Veículo...</option>';
    
    // Adiciona veículos como opções
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.modelo || 'Sem modelo'} - ${vehicle.plateOff || 'Sem placa'}`;
        searchSelect.appendChild(option);
    });
    
    // Restaura o valor selecionado se ainda existir
    searchSelect.value = currentValue;
    
    // Adiciona evento para abrir modal ao selecionar
    searchSelect.onchange = function() {
        if (this.value) {
            if (typeof openEditVehicleModal === 'function') {
                openEditVehicleModal(this.value);
            }
            // Reseta a seleção
            this.value = '';
        }
    };
}

// ==================== EXPORTAÇÕES ====================
// Torna as funções disponíveis globalmente
window.loadCompanyData = loadCompanyData;
window.saveVehicle = saveVehicle;
window.deleteVehicle = deleteVehicle;
window.saveUnit = saveUnit;
window.deleteUnit = deleteUnit;
window.saveMaintenance = saveMaintenance;
window.deleteMaintenanceFromDB = deleteMaintenanceFromDB;
window.saveSettings = saveSettings;
window.updateQuickSearch = updateQuickSearch;

// Exporta variáveis para outros módulos
window.dbModule = {
    vehicles,
    units,
    maintenances,
    loadCompanyData,
    saveVehicle,
    deleteVehicle,
    saveUnit,
    deleteUnit,
    saveMaintenance,
    deleteMaintenanceFromDB,
    saveSettings,
    updateQuickSearch
};