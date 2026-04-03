// js/db.js

// ==================== BANCO DE DADOS ====================

// Função para notificar que os dados foram carregados
function notifyDataLoaded() {
    console.log("📢 NOTIFICAÇÃO: Dados carregados!");
    console.log(`🚗 Veículos: ${window.vehicles.length}`);
    console.log(`🏢 Unidades: ${window.units.length}`);
    console.log(`🔧 Manutenções: ${window.maintenances.length}`);
    
    // Atualiza todas as interfaces
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
    if (typeof renderVehicles === 'function') {
        renderVehicles();
    }
    if (typeof renderUnitsPage === 'function') {
        renderUnitsPage();
    }
    if (typeof updateUnitSelect === 'function') {
        updateUnitSelect();
    }
    if (typeof updateQuickSearch === 'function') {
        updateQuickSearch();
    }
    if (typeof updateAlertsDisplay === 'function') {
        setTimeout(() => updateAlertsDisplay(), 500);
    }
}

// ==================== CARREGAR DADOS ====================
function loadCompanyData() {
    if (!window.currentCompany || !window.currentCompany.id) {
        console.error("❌ Nenhuma empresa selecionada");
        return;
    }
    
    const companyId = window.currentCompany.id;
    console.log(`📂 Carregando dados da empresa: ${companyId}`);
    
    let loadedCount = 0;
    const totalToLoad = 3;
    
    function checkAllLoaded() {
        loadedCount++;
        console.log(`📊 Progresso: ${loadedCount}/${totalToLoad}`);
        if (loadedCount === totalToLoad) {
            notifyDataLoaded();
        }
    }
    
    // Carrega veículos
    firebase.database().ref(`data/${companyId}/vehicles`).on('value', (snap) => {
        const data = snap.val();
        window.vehicles = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                window.vehicles.push({
                    id: key,
                    ...data[key],
                    companyId: companyId
                });
            });
        }
        
        console.log(`🚗 ${window.vehicles.length} veículos carregados`);
        checkAllLoaded();
    });
    
    // Carrega unidades
    firebase.database().ref(`data/${companyId}/units`).on('value', (snap) => {
        const data = snap.val();
        window.units = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                window.units.push({
                    id: key,
                    ...data[key],
                    companyId: companyId
                });
            });
        }
        
        console.log(`🏢 ${window.units.length} unidades carregadas`);
        checkAllLoaded();
    });
    
    // Carrega manutenções
    firebase.database().ref(`data/${companyId}/maintenances`).on('value', (snap) => {
        const data = snap.val();
        window.maintenances = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                window.maintenances.push({
                    id: key,
                    ...data[key],
                    companyId: companyId
                });
            });
        }
        
        console.log(`🔧 ${window.maintenances.length} manutenções carregadas`);
        checkAllLoaded();
    });
}

// ==================== SALVAR VEÍCULO ====================
function saveVehicleToDB(vehicleData) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = window.currentCompany.id;
        const id = vehicleData.id;
        
        const dataToSave = { ...vehicleData };
        delete dataToSave.id;
        dataToSave.updatedAt = Date.now();
        dataToSave.updatedBy = window.currentUser?.email || 'sistema';
        
        if (id) {
            // Atualiza
            firebase.database().ref(`data/${companyId}/vehicles/${id}`).update(dataToSave)
                .then(() => resolve({ id, ...dataToSave }))
                .catch(error => reject("Erro ao atualizar: " + error.message));
        } else {
            // Cria novo
            dataToSave.createdAt = Date.now();
            dataToSave.createdBy = window.currentUser?.email || 'sistema';
            
            firebase.database().ref(`data/${companyId}/vehicles`).push(dataToSave)
                .then(ref => resolve({ id: ref.key, ...dataToSave }))
                .catch(error => reject("Erro ao criar: " + error.message));
        }
    });
}

// ==================== DELETAR VEÍCULO ====================
function deleteVehicle(vehicleId) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = window.currentCompany.id;
        
        // Deleta manutenções do veículo
        const vehicleMaintenances = window.maintenances.filter(m => m.vehicleId === vehicleId);
        const deletePromises = vehicleMaintenances.map(m => 
            firebase.database().ref(`data/${companyId}/maintenances/${m.id}`).remove()
        );
        
        // Deleta o veículo
        deletePromises.push(
            firebase.database().ref(`data/${companyId}/vehicles/${vehicleId}`).remove()
        );
        
        Promise.all(deletePromises)
            .then(() => resolve())
            .catch(error => reject("Erro ao excluir: " + error.message));
    });
}

// ==================== UNIDADES ====================
function saveUnit(unitData) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = window.currentCompany.id;
        const id = unitData.id;
        
        const dataToSave = { ...unitData };
        delete dataToSave.id;
        dataToSave.updatedAt = Date.now();
        
        if (id) {
            firebase.database().ref(`data/${companyId}/units/${id}`).update(dataToSave)
                .then(() => resolve({ id, ...dataToSave }))
                .catch(error => reject("Erro ao atualizar: " + error.message));
        } else {
            dataToSave.createdAt = Date.now();
            firebase.database().ref(`data/${companyId}/units`).push(dataToSave)
                .then(ref => resolve({ id: ref.key, ...dataToSave }))
                .catch(error => reject("Erro ao criar: " + error.message));
        }
    });
}

function deleteUnit(unitId) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const hasVehicles = window.vehicles.some(v => v.unitId === unitId);
        if (hasVehicles) {
            reject("Unidade possui veículos vinculados");
            return;
        }
        
        const companyId = window.currentCompany.id;
        firebase.database().ref(`data/${companyId}/units/${unitId}`).remove()
            .then(() => resolve())
            .catch(error => reject("Erro ao excluir: " + error.message));
    });
}

// ==================== MANUTENÇÕES ====================
function saveMaintenance(maintenanceData) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = window.currentCompany.id;
        
        maintenanceData.createdAt = Date.now();
        maintenanceData.createdBy = window.currentUser?.email || 'sistema';
        
        firebase.database().ref(`data/${companyId}/maintenances`).push(maintenanceData)
            .then(ref => resolve({ id: ref.key, ...maintenanceData }))
            .catch(error => reject("Erro ao salvar: " + error.message));
    });
}

function deleteMaintenanceFromDB(maintenanceId) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = window.currentCompany.id;
        firebase.database().ref(`data/${companyId}/maintenances/${maintenanceId}`).remove()
            .then(() => resolve())
            .catch(error => reject("Erro ao excluir: " + error.message));
    });
}

// ==================== CONFIGURAÇÕES ====================
function saveSettings(settings) {
    return new Promise((resolve, reject) => {
        if (!window.currentCompany) {
            reject("Nenhuma empresa selecionada");
            return;
        }
        
        const companyId = window.currentCompany.id;
        firebase.database().ref(`data/${companyId}/settings`).update(settings)
            .then(() => resolve())
            .catch(error => reject("Erro ao salvar: " + error.message));
    });
}

// ==================== FUNÇÕES AUXILIARES ====================
function updateQuickSearch() {
    const searchSelect = document.getElementById('quick-search');
    if (!searchSelect) return;
    
    const currentValue = searchSelect.value;
    searchSelect.innerHTML = '<option value="">🔍 Buscar Veículo...</option>';
    
    window.vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.modelo || 'Sem modelo'} - ${vehicle.plateOff || 'Sem placa'}`;
        searchSelect.appendChild(option);
    });
    
    if (currentValue && window.vehicles.some(v => v.id === currentValue)) {
        searchSelect.value = currentValue;
    }
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

// EXPORTAÇÕES
window.loadCompanyData = loadCompanyData;
window.saveVehicleToDB = saveVehicleToDB;
window.deleteVehicle = deleteVehicle;
window.saveUnit = saveUnit;
window.deleteUnit = deleteUnit;
window.saveMaintenance = saveMaintenance;
window.deleteMaintenanceFromDB = deleteMaintenanceFromDB;
window.saveSettings = saveSettings;
window.updateQuickSearch = updateQuickSearch;
window.updateUnitSelect = updateUnitSelect;