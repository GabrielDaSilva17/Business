// main.js
import { app } from './config-firebase.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';
import { initializeSearch } from './pesquisa.js'; // Importa o novo módulo de pesquisa

// Inicializa o Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const productsCol = collection(db, 'products');
const usersCol = collection(db, 'users'); // Coleção para dados de usuários (ex: nicknames)

// --- Constantes e Elementos do DOM ---
const ADMIN_UID = 'hOyrLziRfLWXADJZ5SgD0GBr3Wq2'; // UID do admin

// Elementos do Cabeçalho e Menu Lateral
const menuIcon = document.getElementById('menuIcon');
const sideMenu = document.getElementById('sideMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const overlay = document.getElementById('overlay');
const headerNickname = document.getElementById('headerNickname');
const sideMenuNickname = document.getElementById('sideMenuNickname');

// Botão de Autenticação no Cabeçalho Desktop
const mainHeaderAuthBtn = document.getElementById('mainHeaderAuthBtn'); // Novo botão
const desktopAdminLink = document.getElementById('desktopAdminLink');

// Inputs e Botões de Autenticação (Menu Lateral - Agora o único lugar para login/registro)
const sideAuthEmailInput = document.getElementById('sideAuthEmail');
const sideAuthPasswordInput = document.getElementById('sideAuthPassword');
const sideLoginBtn = document.getElementById('sideLoginBtn');
const sideRegisterBtn = document.getElementById('sideRegisterBtn');
const sideGoogleLoginBtn = document.getElementById('sideGoogleLoginBtn');
const sideLogoutBtn = document.getElementById('sideLogoutBtn');
const sideAuthMessage = document.getElementById('sideAuthMessage');
const sideAdminLink = document.getElementById('sideAdminLink');
const sideMenuAuthSection = document.getElementById('sideMenuAuth'); // A seção inteira de auth do menu lateral

// Elementos da Página Principal
const productsGrid = document.getElementById('productsGrid');
const refreshProductsBtn = document.getElementById('refreshProductsBtn'); // Botão de refresh ainda existe

// Prompt de Nickname
const displayNamePrompt = document.getElementById('displayNamePrompt');
const nicknameInput = document.getElementById('nicknameInput');
const saveNicknameBtn = document.getElementById('saveNicknameBtn');
const namePromptError = document.getElementById('namePromptError');

// --- Funções Auxiliares ---

// Função para exibir mensagem personalizada (substitui alert)
const showMessage = (message, type = 'info') => {
    console.log(`Mensagem (${type}): ${message}`);
    alert(message); // Mantendo alert por simplicidade, idealmente seria um modal customizado
};

// Abre o menu lateral
const openSideMenu = () => {
    if (sideMenu) sideMenu.style.width = '250px';
    if (overlay) overlay.classList.add('visible');
    document.body.classList.add('menu-open'); // Adiciona classe para deslocar o conteúdo
};

// Fecha o menu lateral
const closeSideMenu = () => {
    if (sideMenu) sideMenu.style.width = '0';
    if (overlay) overlay.classList.remove('visible');
    document.body.classList.remove('menu-open'); // Remove classe para restaurar o conteúdo
};

// Atualiza a UI de autenticação
const updateAuthUI = (user) => {
    let currentNickname = "Usuário App"; // Default

    if (user) {
        // Atualiza o botão do cabeçalho
        if (mainHeaderAuthBtn) mainHeaderAuthBtn.textContent = 'Sair';
        // Oculta os inputs/botões de login/registro no menu lateral e mostra o botão de Logout
        if (sideMenuAuthSection) {
            sideAuthEmailInput.style.display = 'none';
            sideAuthPasswordInput.style.display = 'none';
            sideLoginBtn.style.display = 'none';
            sideRegisterBtn.style.display = 'none';
            sideGoogleLoginBtn.style.display = 'none';
            if (sideLogoutBtn) sideLogoutBtn.style.display = 'block'; // Mostra o botão de Sair no menu lateral
            sideAuthMessage.textContent = ''; // Limpa mensagens de erro/sucesso
        }

        currentNickname = user.displayName || "Novo Usuário";

        // Exibir link de Admin se for admin
        if (desktopAdminLink) desktopAdminLink.style.display = (user.uid === ADMIN_UID) ? 'inline-block' : 'none';
        if (sideAdminLink) sideAdminLink.style.display = (user.uid === ADMIN_UID) ? 'list-item' : 'none';

    } else {
        // Atualiza o botão do cabeçalho
        if (mainHeaderAuthBtn) mainHeaderAuthBtn.textContent = 'Login';
        // Exibe os inputs/botões de login/registro no menu lateral e esconde o botão de Sair
        if (sideMenuAuthSection) {
            sideAuthEmailInput.style.display = 'block';
            sideAuthPasswordInput.style.display = 'block';
            sideLoginBtn.style.display = 'block';
            sideRegisterBtn.style.display = 'block';
            sideGoogleLoginBtn.style.display = 'block';
            if (sideLogoutBtn) sideLogoutBtn.style.display = 'none'; // Esconde o botão de Sair no menu lateral
        }

        // Esconder link de Admin
        if (desktopAdminLink) desktopAdminLink.style.display = 'none';
        if (sideAdminLink) sideAdminLink.style.display = 'none';
    }

    if (headerNickname) headerNickname.textContent = currentNickname;
    if (sideMenuNickname) sideMenuNickname.textContent = currentNickname;
};

// Salvar/Atualizar Nickname do Usuário
const saveUserNickname = async (user, nickname) => {
    try {
        await updateProfile(user, { displayName: nickname });
        // Opcional: Armazenar nickname no Firestore para persistência customizada
        await setDoc(doc(db, 'users', user.uid), {
            nickname: nickname,
            updatedAt: new Date()
        }, { merge: true }); // 'merge: true' para não sobrescrever outros campos
        showMessage("Nickname salvo com sucesso!", "success");
        if (displayNamePrompt) displayNamePrompt.style.display = 'none';
        updateAuthUI(user); // Atualiza UI para exibir o novo nickname
    } catch (error) {
        console.error("Erro ao salvar nickname:", error);
        if (namePromptError) namePromptError.textContent = "Erro ao salvar nickname: " + error.message;
    }
};

// --- Funções de Autenticação ---

const handleLogin = async (emailInput, passwordInput, messageElement) => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        messageElement.textContent = 'Login realizado com sucesso!';
        messageElement.style.color = 'green';
        setTimeout(() => { // Pequeno atraso para o usuário ver a mensagem
            closeSideMenu();
            messageElement.textContent = ''; // Limpa a mensagem após fechar
        }, 800);
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        messageElement.textContent = 'Erro ao fazer login: ' + error.message;
        messageElement.style.color = 'red';
    }
};

const handleRegister = async (emailInput, passwordInput, messageElement) => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        messageElement.textContent = 'Registro realizado com sucesso! Você está logado.';
        messageElement.style.color = 'green';
        setTimeout(() => { // Pequeno atraso para o usuário ver a mensagem
            closeSideMenu();
            messageElement.textContent = ''; // Limpa a mensagem após fechar
        }, 800);

        // Abrir prompt de nickname para novo usuário
        if (displayNamePrompt) {
            displayNamePrompt.style.display = 'block';
            nicknameInput.value = ''; // Limpa o input
            namePromptError.textContent = '';
        }

    } catch (error) {
        console.error("Erro ao registrar:", error);
        messageElement.textContent = 'Erro ao registrar: ' + error.message;
        messageElement.style.color = 'red';
    }
};

const handleGoogleLogin = async (messageElement) => {
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        messageElement.textContent = 'Login com Google realizado com sucesso!';
        messageElement.style.color = 'green';
        setTimeout(() => { // Pequeno atraso para o usuário ver a mensagem
            closeSideMenu();
            messageElement.textContent = ''; // Limpa a mensagem após fechar
        }, 800);

        // Se o usuário não tiver displayName, abrir prompt de nickname
        if (!userCredential.user.displayName && displayNamePrompt) {
            displayNamePrompt.style.display = 'block';
            nicknameInput.value = '';
            namePromptError.textContent = '';
        }

    } catch (error) {
        console.error("Erro ao fazer login com Google:", error);
        messageElement.textContent = 'Erro ao fazer login com Google: ' + error.message;
        messageElement.style.color = 'red';
    }
};

const handleLogout = () => {
    signOut(auth).then(() => {
        showMessage('Logout realizado com sucesso!', "success");
        updateAuthUI(null);
        closeSideMenu(); // Fecha o menu lateral após o logout
    }).catch((error) => {
        console.error("Erro ao fazer logout:", error);
        showMessage("Erro ao fazer logout.", "error");
    });
};


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a funcionalidade de pesquisa, passando o db, o grid de produtos e a função de mensagem
    const searchModule = initializeSearch(db, productsGrid, showMessage);

    // Menu Lateral
    if (menuIcon) menuIcon.addEventListener('click', openSideMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeSideMenu);
    if (overlay) overlay.addEventListener('click', closeSideMenu); // Fecha o menu ao clicar no overlay

    // Botão de Login/Logout no Cabeçalho Principal (Desktop)
    if (mainHeaderAuthBtn) {
        mainHeaderAuthBtn.addEventListener('click', () => {
            if (auth.currentUser) {
                handleLogout(); // Se logado, faz logout
            } else {
                openSideMenu(); // Se não logado, abre o menu lateral para login
            }
        });
    }

    // Autenticação Menu Lateral
    if (sideLoginBtn) {
        sideLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogin(sideAuthEmailInput, sideAuthPasswordInput, sideAuthMessage);
        });
    }
    if (sideRegisterBtn) {
        sideRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleRegister(sideAuthEmailInput, sideAuthPasswordInput, sideAuthMessage);
        });
    }
    if (sideGoogleLoginBtn) {
        sideGoogleLoginBtn.addEventListener('click', () => {
            handleGoogleLogin(sideAuthMessage);
        });
    }
    // Listener para o botão de Sair no menu lateral
    if (sideLogoutBtn) {
        sideLogoutBtn.addEventListener('click', handleLogout);
    }

    // Salvar Nickname
    if (saveNicknameBtn) {
        saveNicknameBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            const nickname = nicknameInput.value.trim();
            if (user && nickname) {
                saveUserNickname(user, nickname);
            } else {
                if (namePromptError) namePromptError.textContent = "Por favor, digite um nickname.";
            }
        });
    }

    // Fechar menu lateral ao clicar em um link
    if (sideMenu) { // Verifica se sideMenu existe antes de tentar selecionar seus links
        sideMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeSideMenu();
            });
        });
    }

    // Monitora o estado de autenticação
    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user);
        if (user && !user.displayName) {
            // Se o usuário está logado mas não tem displayName, mostra o prompt
            if (displayNamePrompt) {
                displayNamePrompt.style.display = 'block';
                nicknameInput.value = '';
                namePromptError.textContent = '';
            }
        } else {
            if (displayNamePrompt) displayNamePrompt.style.display = 'none'; // Esconde se já tiver nome
        }
    });

    // Carregar produtos quando a página for carregada usando a função do módulo de pesquisa
    searchModule.loadAllProducts();

    // Botão de Refresh de Produtos - Agora chama a função de carregar todos os produtos do módulo de pesquisa
    if (refreshProductsBtn) {
        refreshProductsBtn.addEventListener('click', searchModule.loadAllProducts);
    }
    
    // A funcionalidade de pesquisa (searchInput e searchButton) agora é controlada pelo initializeSearch no módulo pesquisa.js
}); // Fim do DOMContentLoaded

