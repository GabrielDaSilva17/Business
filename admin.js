// admin.js
import { app } from './config-firebase.js'; // Seu arquivo de configuração do Firebase
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js'; // VERSÃO ATUALIZADA AQUI
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js';

const db = getFirestore(app);
const auth = getAuth(app);
const productsCol = collection(db, 'products');

// O código abaixo será executado apenas quando todo o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const productNameInput = document.getElementById('productName');
    const productDescriptionInput = document.getElementById('productDescription');
    const productPriceInput = document.getElementById('productPrice');
    const productImageUrlInput = document.getElementById('productImageUrl');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn'); // Novo botão
    const productsContainer = document.getElementById('productsContainer');
    const productIdHidden = document.getElementById('productIdHidden'); // Campo oculto para ID

    let currentEditingProductId = null; // Para controlar o ID do produto sendo editado

    // --- Verificação de Admin ---
    const ADMIN_UID = 'hOyrLziRfLWXADJZ5SgD0GBr3Wq2'; // UID DO ADMIN ATUALIZADO AQUI!

    onAuthStateChanged(auth, (user) => {
        if (user && user.uid === ADMIN_UID) {
            console.log("Usuário logado e é admin. UID:", user.uid);
            loadProducts(); // Carrega produtos se for admin
        } else {
            console.log("Usuário não é admin ou não logado. UID:", user ? user.uid : 'N/A');
            alert("Você não tem permissão para acessar esta página. Redirecionando para a página inicial.");
            window.location.href = 'index.html'; // Redireciona se não for admin
        }
    });

    // --- Função para carregar e exibir produtos (em tempo real) ---
    const loadProducts = () => {
        if (!productsContainer) {
            console.error("Elemento productsContainer não encontrado!");
            return;
        }
        productsContainer.innerHTML = ''; // Limpa a lista antes de adicionar
        onSnapshot(productsCol, (snapshot) => {
            console.log("Dados do Firestore recebidos para a lista de produtos.");
            productsContainer.innerHTML = ''; // Limpa a lista antes de adicionar
            if (snapshot.empty) {
                productsContainer.innerHTML = '<p>Nenhum produto cadastrado ainda.</p>';
                console.log("Nenhum produto cadastrado.");
                return;
            }

            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const productItem = document.createElement('div');
                productItem.className = 'product-list-item';
                productItem.innerHTML = `
                    <img src="${product.imageUrl || 'https://via.placeholder.com/60'}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/60';">
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p>R$ ${product.price ? product.price.toFixed(2) : '0.00'}</p>
                        <p>${product.description ? product.description.substring(0, 70) + (product.description.length > 70 ? '...' : '') : ''}</p>
                    </div>
                    <div class="product-actions">
                        <button class="edit-btn" data-id="${productId}">Editar</button>
                        <button class="delete-btn" data-id="${productId}">Deletar</button>
                    </div>
                `;
                productsContainer.appendChild(productItem);
            });
            console.log(`Produtos carregados: ${snapshot.size}`);

            // Adiciona listeners aos botões de Editar e Deletar após renderizar
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => editProduct(e.target.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
            });
        }, (error) => {
            console.error("Erro ao carregar produtos em tempo real: ", error);
            productsContainer.innerHTML = '<p>Erro ao carregar produtos.</p>';
        });
    };

    // --- Adicionar/Atualizar Produto ---
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', async () => {
            const name = productNameInput.value.trim();
            const description = productDescriptionInput.value.trim();
            const price = parseFloat(productPriceInput.value);
            const imageUrl = productImageUrlInput.value.trim();

            console.log("Tentando salvar produto...");
            console.log("Nome:", name);
            console.log("Descrição:", description);
            console.log("Preço:", price);
            console.log("URL da Imagem:", imageUrl);
            console.log("ID de Edição Atual:", currentEditingProductId);


            if (!name || !description || isNaN(price) || price <= 0 || !imageUrl) {
                alert('Por favor, preencha todos os campos corretamente.');
                console.warn("Validação de formulário falhou.");
                return;
            }

            try {
                if (currentEditingProductId) {
                    // Atualizar produto existente
                    const productRef = doc(db, 'products', currentEditingProductId);
                    console.log("Atualizando produto com ID:", currentEditingProductId);
                    await updateDoc(productRef, {
                        name,
                        description,
                        price,
                        imageUrl,
                        updatedAt: new Date()
                    });
                    alert('Produto atualizado com sucesso!');
                    console.log("Produto atualizado com sucesso!");
                } else {
                    // Adicionar novo produto
                    console.log("Adicionando novo produto...");
                    await addDoc(productsCol, {
                        name,
                        description,
                        price,
                        imageUrl,
                        createdAt: new Date()
                    });
                    alert('Produto adicionado com sucesso!');
                    console.log("Produto adicionado com sucesso!");
                }
                // Limpar formulário e redefinir estado de edição
                clearForm();
                currentEditingProductId = null;
                saveProductBtn.textContent = 'Adicionar Produto';
                cancelEditBtn.style.display = 'none';

            } catch (error) {
                console.error("Erro ao salvar produto: ", error); // Este log é o mais importante para identificar FirebaseErrors
                alert("Erro ao salvar produto: " + error.message);
            }
        });
    }

    // --- Função Editar Produto (preenche o formulário) ---
    const editProduct = async (id) => {
        console.log("Editando produto com ID:", id);
        const productRef = doc(db, 'products', id);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
            const product = productDoc.data();
            console.log("Produto carregado para edição:", product);
            if (productNameInput) productNameInput.value = product.name;
            if (productDescriptionInput) productDescriptionInput.value = product.description;
            if (productPriceInput) productPriceInput.value = product.price;
            if (productImageUrlInput) productImageUrlInput.value = product.imageUrl;
            if (saveProductBtn) saveProductBtn.textContent = 'Atualizar Produto';
            if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block'; // Mostra botão de cancelar
            currentEditingProductId = id;
        } else {
            alert('Produto não encontrado para edição.');
            console.warn("Produto não encontrado para edição com ID:", id);
        }
    };

    // --- Função Deletar Produto ---
    const deleteProduct = async (id) => {
        // Usar um modal personalizado em vez de confirm para evitar problemas em iframes/ambientes específicos
        // Exemplo: showCustomConfirm('Tem certeza que deseja deletar este produto?', async () => { ... });
        if (confirm('Tem certeza que deseja deletar este produto? Esta ação é irreversível.')) {
            try {
                console.log("Deletando produto com ID:", id);
                const productRef = doc(db, 'products', id);
                await deleteDoc(productRef);
                alert('Produto deletado com sucesso!');
                console.log("Produto deletado com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar produto: ", error);
                alert("Erro ao deletar produto: " + error.message);
            }
        }
    };

    // --- Função para limpar o formulário ---
    const clearForm = () => {
        if (productNameInput) productNameInput.value = '';
        if (productDescriptionInput) productDescriptionInput.value = '';
        if (productPriceInput) productPriceInput.value = '';
        if (productImageUrlInput) productImageUrlInput.value = '';
        currentEditingProductId = null;
        if (saveProductBtn) saveProductBtn.textContent = 'Adicionar Produto';
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        console.log("Formulário limpo e estado de edição resetado.");
    };

    // Listener para o botão Cancelar Edição
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', clearForm);
    }
}); // Fim do DOMContentLoaded

