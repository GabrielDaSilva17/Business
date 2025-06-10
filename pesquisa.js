// pesquisa.js
// Este módulo lida com a funcionalidade de pesquisa de produtos.

import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';

/**
 * Inicializa a funcionalidade de pesquisa de produtos.
 * @param {object} db - A instância do Firestore.
 * @param {HTMLElement} productsGridElement - O elemento HTML onde os produtos são exibidos.
 * @param {function} showMessageFn - A função para exibir mensagens ao usuário (como alerts ou modais).
 */
export const initializeSearch = (db, productsGridElement, showMessageFn) => {
    const productsCol = collection(db, 'products'); // A coleção de produtos no Firestore

    const searchInput = document.getElementById('searchInput'); // O input de pesquisa no cabeçalho
    const searchButton = document.getElementById('searchButton'); // O botão de pesquisa no cabeçalho

    // Adiciona um listener para o botão de pesquisa
    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            const searchTerm = searchInput.value.trim(); // Obtém o termo de pesquisa e remove espaços
            if (searchTerm) {
                showMessageFn(`Pesquisando por: "${searchTerm}"...`, "info");
                await performSearch(searchTerm); // Executa a pesquisa
            } else {
                showMessageFn("Por favor, digite um termo para pesquisar.", "warning");
                await loadAllProducts(); // Se o campo estiver vazio, carrega todos os produtos
            }
        });
    }

    // Opcional: Permite pesquisar ao pressionar "Enter" no campo de busca
    if (searchInput) {
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    showMessageFn(`Pesquisando por: "${searchTerm}"...`, "info");
                    await performSearch(searchTerm);
                } else {
                    showMessageFn("Por favor, digite um termo para pesquisar.", "warning");
                    await loadAllProducts();
                }
            }
        });
    }

    /**
     * Realiza a pesquisa de produtos buscando todos e filtrando no cliente.
     * Ideal para conjuntos de dados pequenos a médios.
     * Para grandes volumes, considere soluções de busca de texto completo.
     * @param {string} term - O termo de pesquisa.
     */
    const performSearch = async (term) => {
        productsGridElement.innerHTML = '<p>Buscando produtos...</p>'; // Mensagem de carregamento
        try {
            const querySnapshot = await getDocs(productsCol);
            const allProducts = [];
            querySnapshot.forEach(doc => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });

            const normalizedTerm = term.toLowerCase(); // Normaliza o termo de pesquisa

            // Filtra os produtos no cliente
            const filteredProducts = allProducts.filter(product => {
                const productName = (product.name || '').toLowerCase();
                const productDescription = (product.description || '').toLowerCase();
                
                // Retorna verdadeiro se o nome ou a descrição contiver o termo de pesquisa
                return productName.includes(normalizedTerm) || productDescription.includes(normalizedTerm);
            });
            
            displayProducts(filteredProducts); // Exibe os produtos encontrados

            if (filteredProducts.length === 0) {
                productsGridElement.innerHTML = '<p>Nenhum produto encontrado para sua pesquisa.</p>';
            }

        } catch (error) {
            console.error("Erro ao realizar pesquisa:", error);
            productsGridElement.innerHTML = '<p>Erro ao buscar produtos.</p>';
            showMessageFn("Erro ao realizar pesquisa de produtos: " + error.message, "error");
        }
    };

    /**
     * Carrega e exibe todos os produtos do Firestore.
     */
    const loadAllProducts = async () => {
        productsGridElement.innerHTML = '<p>Carregando todos os produtos...</p>';
        try {
            const querySnapshot = await getDocs(productsCol);
            const allProducts = [];
            querySnapshot.forEach(doc => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });
            displayProducts(allProducts);

            if (allProducts.length === 0) {
                productsGridElement.innerHTML = '<p>Nenhum produto cadastrado ainda.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar todos os produtos:", error);
            productsGridElement.innerHTML = '<p>Erro ao carregar produtos.</p>';
            showMessageFn("Erro ao carregar todos os produtos: " + error.message, "error");
        }
    };

    /**
     * Exibe uma lista de produtos no elemento productsGrid.
     * @param {Array<object>} products - Um array de objetos de produto.
     */
    const displayProducts = (products) => {
        productsGridElement.innerHTML = ''; // Limpa o grid antes de adicionar
        if (products.length === 0) {
            productsGridElement.innerHTML = '<p>Nenhum produto para exibir.</p>';
            return;
        }

        products.forEach((product) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-item';
            productCard.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150';">
                <h4>${product.name}</h4>
                <p>${product.description ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '') : ''}</p>
                <p class="price">R$ ${product.price ? product.price.toFixed(2) : '0.00'}</p>
                <button class="add-to-cart-btn" data-id="${product.id}">Adicionar ao Carrinho</button>
            `;
            productsGridElement.appendChild(productCard);
        });

        // Adiciona listeners aos botões "Adicionar ao Carrinho"
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                showMessageFn(`Produto ${e.target.dataset.id} adicionado ao carrinho!`, "info");
            });
        });
    };

    // Exporta a função loadAllProducts para ser usada também pelo main.js para carregar inicial
    return {
        loadAllProducts: loadAllProducts,
        performSearch: performSearch
    };
};

''