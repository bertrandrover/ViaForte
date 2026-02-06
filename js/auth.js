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
        
        // Verifica se está bloqueado
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
        
        // Mostra loading no botão
        const btnLogin = document.getElementById('btn-login');
        const originalText = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Entrando...';
        btnLogin.disabled = true;
        
        try {
            // Configura persistência da sessão
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            
            // Tenta fazer login
            await auth.signInWithEmailAndPassword(email, password);
            
            // Login bem-sucedido - reseta tentativas
            failedAttempts = 0;
            
        } catch (error) {
            // Restaura botão
            btnLogin.innerHTML = originalText;
            btnLogin.disabled = false;
            
            failedAttempts++;
            
            // Mensagens de erro amigáveis
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
                case 'auth/user-disabled':
                    errorMessage = "Esta conta foi desativada";
                    break;
                default:
                    errorMessage = error.message || "Erro desconhecido";
            }
            
            // Verifica se deve bloquear
            if (failedAttempts >= MAX_ATTEMPTS) {
                lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutos
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
    
    // Valida formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast("Digite um email válido", "error");
        return;
    }
    
    auth.sendPasswordResetEmail(email)
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
                case 'auth/network-request-failed':
                    errorMessage = "Erro de conexão";
                    break;
                default:
                    errorMessage = error.message || "Erro desconhecido";
            }
            
            showToast(errorMessage, "error");
        });
}

// ==================== VERIFICAÇÃO DE LOGIN ====================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário está logado no Firebase Auth
        try {
            // Mostra loading
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl';
                loadingDiv.innerHTML = `
                    <div class="text-center">
                        <div class="spinner mb-4"></div>
                        <p class="text-slate-600">Carregando dados...</p>
                    </div>
                `;
                loginScreen.appendChild(loadingDiv);
            }
            
            // Busca informações do usuário no banco
            const userSnapshot = await db.ref('users/' + user.uid).once('value');
            const userData = userSnapshot.val();
            
            if (!userData) {
                showToast("Usuário não configurado no sistema", "error");
                await auth.signOut();
                return;
            }
            
            // Busca informações da empresa
            const companySnapshot = await db.ref('companies/' + userData.companyId).once('value');
            const companyData = companySnapshot.val();
            
            if (!companyData) {
                showToast("Empresa não encontrada", "error");
                await auth.signOut();
                return;
            }
            
            // Verifica se a empresa está ativa
            if (companyData.status !== 'active') {
                showToast("Empresa inativa. Entre em contato com o suporte.", "error");
                await auth.signOut();
                return;
            }
            
            // Verifica se o trial não expirou
            if (companyData.plan === 'trial' && companyData.trialEnds < Date.now()) {
                showToast("Período de teste expirado. Entre em contato para renovar.", "error");
                await auth.signOut();
                return;
            }
            
            // Guarda os dados na memória
            currentUser = {
                id: user.uid,
                email: user.email,
                ...userData
            };
            
            currentCompany = {
                id: userData.companyId,
                ...companyData
            };
            
            // Registra log de acesso
            db.ref('logs/' + userData.companyId).push({
                userId: user.uid,
                email: user.email,
                action: 'login',
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            }).catch(error => {
                console.error("Erro ao registrar log:", error);
            });
            
            // Mostra o aplicativo
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-content').classList.remove('hidden');
            
            // Atualiza o cabeçalho com o nome da empresa
            const companyHeader = document.getElementById('company-name-header');
            if (companyHeader) {
                companyHeader.textContent = currentCompany.name;
            }
            
            // Atualiza o título da página
            document.title = `FrotaForte - ${currentCompany.name}`;
            
            // Inicializa o aplicativo
            if (typeof initApp === 'function') {
                initApp();
            }
            
            // Mostra mensagem de boas-vindas
            setTimeout(() => {
                showToast(`Bem-vindo, ${user.email.split('@')[0]}!`, "success");
            }, 500);
            
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showToast("Erro ao carregar dados do sistema. Tente novamente.", "error");
            
            // Tenta fazer logout
            try {
                await auth.signOut();
            } catch (logoutError) {
                console.error("Erro ao fazer logout:", logoutError);
            }
            
            // Recarrega a página para limpar estado
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } finally {
            // Remove loading
            const loadingDiv = document.querySelector('#login-screen > div.absolute');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
    } else {
        // Usuário deslogado
        currentUser = null;
        currentCompany = null;
        
        // Esconde o aplicativo
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.classList.add('hidden');
        }
        
        // Mostra a tela de login
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }
        
        // Reseta tentativas após um tempo
        setTimeout(() => {
            if (!currentUser) {
                failedAttempts = Math.max(0, failedAttempts - 1);
            }
        }, 60000); // A cada minuto reduz uma tentativa
    }
});

// ==================== LOGOUT ====================
function logout() {
    if (currentUser && currentCompany) {
        // Registra log de logout
        db.ref('logs/' + currentCompany.id).push({
            userId: currentUser.id,
            email: currentUser.email,
            action: 'logout',
            timestamp: Date.now()
        }).catch(error => {
            console.error("Erro ao registrar log de logout:", error);
        });
    }
    
    auth.signOut().then(() => {
        // Limpa dados temporários
        vehicles = [];
        units = [];
        maintenances = [];
        
        // Mostra mensagem
        showToast("Logout realizado com sucesso", "success");
        
        // Recarrega após um breve delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }).catch(error => {
        showToast("Erro ao fazer logout: " + error.message, "error");
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    // Configura o formulário de login
    setupLoginForm();
    
    // Configura botão de redefinir senha
    const resetEmailInput = document.getElementById('reset-email');
    if (resetEmailInput) {
        resetEmailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendPasswordReset();
            }
        });
    }
    
    // Preenche email automaticamente se disponível
    const loginEmailInput = document.getElementById('login-email');
    if (loginEmailInput && localStorage.getItem('lastLoginEmail')) {
        loginEmailInput.value = localStorage.getItem('lastLoginEmail');
    }
    
    // Salva email ao digitar
    if (loginEmailInput) {
        loginEmailInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                localStorage.setItem('lastLoginEmail', this.value.trim());
            }
        });
    }
    
    // Foco automático no campo de email
    setTimeout(() => {
        if (loginEmailInput && !currentUser) {
            loginEmailInput.focus();
        }
    }, 300);
});

// ==================== EXPORTAÇÕES ====================
// Torna as funções disponíveis globalmente
window.showResetPassword = showResetPassword;
window.closeResetModal = closeResetModal;
window.sendPasswordReset = sendPasswordReset;
window.logout = logout;

// Exporta variáveis para outros módulos
window.authModule = {
    currentUser,
    currentCompany,
    failedAttempts,
    MAX_ATTEMPTS,
    lockedUntil
};