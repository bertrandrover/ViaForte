// js/auth.js

// ==================== SISTEMA DE AUTENTICAÇÃO ====================

let failedAttempts = 0;
const MAX_ATTEMPTS = 5;
let lockedUntil = 0;

// ==================== FUNÇÕES DE TELA ====================
function showResetPassword() {
    openModal('reset-password-modal');
}

function closeResetModal() {
    closeModal('reset-password-modal');
}

// ==================== CONFIGURAÇÃO DO FORMULÁRIO DE LOGIN ====================
function setupLoginForm() {
    const formLogin = document.getElementById('form-login');
    if (!formLogin) return;
    
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (Date.now() < lockedUntil) {
            const minutesLeft = Math.ceil((lockedUntil - Date.now()) / 60000);
            showToast(`Acesso bloqueado. Tente novamente em ${minutesLeft} minutos.`, "error");
            return;
        }
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-pass').value;
        
        if (!email || !password) {
            showToast("Preencha email e senha", "error");
            return;
        }
        
        const btnLogin = document.getElementById('btn-login');
        const originalText = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Entrando...';
        btnLogin.disabled = true;
        
        try {
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
            await firebase.auth().signInWithEmailAndPassword(email, password);
            failedAttempts = 0;
        } catch (error) {
            btnLogin.innerHTML = originalText;
            btnLogin.disabled = false;
            
            failedAttempts++;
            
            let errorMessage = "Erro ao fazer login";
            
            switch(error.code) {
                case 'auth/invalid-credential':
                case 'auth/invalid-email':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    errorMessage = "Email ou senha incorretos";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Muitas tentativas. Tente novamente mais tarde";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Erro de conexão. Verifique sua internet";
                    break;
                default:
                    errorMessage = error.message || "Erro desconhecido";
            }
            
            if (failedAttempts >= MAX_ATTEMPTS) {
                lockedUntil = Date.now() + (15 * 60 * 1000);
                errorMessage = `Muitas tentativas falhas. Acesso bloqueado por 15 minutos.`;
            } else {
                errorMessage += ` (Tentativa ${failedAttempts}/${MAX_ATTEMPTS})`;
            }
            
            showToast(errorMessage, "error");
        }
    });
}

// ==================== REDEFINIR SENHA ====================
function sendPasswordReset() {
    const emailInput = document.getElementById('reset-email');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showToast("Digite seu email", "error");
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast("Digite um email válido", "error");
        return;
    }
    
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            showToast("Link de redefinição enviado para seu email!", "success");
            closeResetModal();
            emailInput.value = '';
        })
        .catch(error => {
            let errorMessage = "Erro ao enviar email";
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = "Email não encontrado no sistema";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Email inválido";
                    break;
                default:
                    errorMessage = error.message || "Erro desconhecido";
            }
            
            showToast(errorMessage, "error");
        });
}

// ==================== FUNÇÃO PARA INICIALIZAR O APP APÓS LOGIN ====================
function initializeAppAfterLogin() {
    console.log("🚀 Inicializando app após login...");
    console.log("currentCompany:", window.currentCompany);
    console.log("currentUser:", window.currentUser);
    
    if (window.currentCompany && window.currentUser) {
        if (typeof initApp === 'function') {
            initApp();
        }
        if (typeof loadAlerts === 'function') {
            setTimeout(() => loadAlerts(), 1000);
        }
    } else {
        console.error("❌ currentCompany ou currentUser não definidos!");
    }
}

// ==================== VERIFICAÇÃO DE LOGIN ====================
firebase.auth().onAuthStateChanged(async (user) => {
    console.log("🔄 Auth state changed:", user ? user.email : "No user");
    
    if (user) {
        try {
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl z-50';
                loadingDiv.innerHTML = `
                    <div class="text-center">
                        <div class="spinner mb-4"></div>
                        <p class="text-slate-600">Carregando dados...</p>
                    </div>
                `;
                loginScreen.appendChild(loadingDiv);
            }
            
            // Busca informações do usuário
            const userSnapshot = await firebase.database().ref('users/' + user.uid).once('value');
            const userData = userSnapshot.val();
            
            if (!userData) {
                showToast("Usuário não configurado no sistema", "error");
                await firebase.auth().signOut();
                return;
            }
            
            // Busca informações da empresa
            const companySnapshot = await firebase.database().ref('companies/' + userData.companyId).once('value');
            const companyData = companySnapshot.val();
            
            if (!companyData) {
                showToast("Empresa não encontrada", "error");
                await firebase.auth().signOut();
                return;
            }
            
            if (companyData.status !== 'active') {
                showToast("Empresa inativa. Entre em contato com o suporte.", "error");
                await firebase.auth().signOut();
                return;
            }
            
            if (companyData.plan === 'trial' && companyData.trialEnds < Date.now()) {
                showToast("Período de teste expirado. Entre em contato para renovar.", "error");
                await firebase.auth().signOut();
                return;
            }
            
            // Guarda os dados na memória (USANDO WINDOW)
            window.currentUser = {
                id: user.uid,
                email: user.email,
                ...userData
            };
            
            window.currentCompany = {
                id: userData.companyId,
                ...companyData
            };
            
            console.log("✅ Dados carregados:");
            console.log("  Company:", window.currentCompany);
            console.log("  User:", window.currentUser);
            
            // Mostra o aplicativo
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-content').classList.remove('hidden');
            
            // Atualiza o cabeçalho
            const companyHeader = document.getElementById('company-name-header');
            if (companyHeader) {
                companyHeader.textContent = window.currentCompany.name;
            }
            
            document.title = `FrotaForte - ${window.currentCompany.name}`;
            
            // INICIALIZA O APP AQUI
            initializeAppAfterLogin();
            
            setTimeout(() => {
                showToast(`Bem-vindo, ${user.email.split('@')[0]}!`, "success");
            }, 500);
            
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showToast("Erro ao carregar dados do sistema. Tente novamente.", "error");
            await firebase.auth().signOut();
            setTimeout(() => window.location.reload(), 2000);
        } finally {
            const loadingDiv = document.querySelector('#login-screen > div.absolute');
            if (loadingDiv) loadingDiv.remove();
        }
    } else {
        window.currentUser = null;
        window.currentCompany = null;
        
        const appContent = document.getElementById('app-content');
        if (appContent) appContent.classList.add('hidden');
        
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.remove('hidden');
    }
});

// ==================== LOGOUT ====================
function logout() {
    if (window.currentUser && window.currentCompany) {
        firebase.database().ref('logs/' + window.currentCompany.id).push({
            userId: window.currentUser.id,
            email: window.currentUser.email,
            action: 'logout',
            timestamp: Date.now()
        }).catch(error => console.error("Erro ao registrar log:", error));
    }
    
    firebase.auth().signOut().then(() => {
        window.vehicles = [];
        window.units = [];
        window.maintenances = [];
        showToast("Logout realizado com sucesso", "success");
        setTimeout(() => window.location.reload(), 1000);
    }).catch(error => {
        showToast("Erro ao fazer logout: " + error.message, "error");
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    setupLoginForm();
    
    const resetEmailInput = document.getElementById('reset-email');
    if (resetEmailInput) {
        resetEmailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendPasswordReset();
            }
        });
    }
    
    const loginEmailInput = document.getElementById('login-email');
    if (loginEmailInput && localStorage.getItem('lastLoginEmail')) {
        loginEmailInput.value = localStorage.getItem('lastLoginEmail');
    }
    
    if (loginEmailInput) {
        loginEmailInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                localStorage.setItem('lastLoginEmail', this.value.trim());
            }
        });
    }
    
    setTimeout(() => {
        if (loginEmailInput && !window.currentUser) {
            loginEmailInput.focus();
        }
    }, 300);
});

// EXPORTAÇÕES
window.showResetPassword = showResetPassword;
window.closeResetModal = closeResetModal;
window.sendPasswordReset = sendPasswordReset;
window.logout = logout;
window.initializeAppAfterLogin = initializeAppAfterLogin;