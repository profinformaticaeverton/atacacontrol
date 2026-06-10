// ========================================
// ATACACONTROL
// NOVA COMPRA V3.0
// COMPARADOR INTELIGENTE DE PREÇOS
// ========================================

let produtos = [];
let produtosFiltrados = [];
let usuarioAtual = null;

// ========================================
// COMPARADOR INTELIGENTE
// ========================================

// Estrutura esperada (Supabase):
// product_prices: id, product_id, market_id, price

let historicoPrecos = [];

// cache de mercados para comparação
let mercadosCache = [];

// ========================================
// INICIAR
// ========================================

async function iniciar() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = "/";
            return;
        }

        usuarioAtual = session.user;

        document
            .getElementById("dataCompra")
            .valueAsDate = new Date();

        configurarBusca();

        await carregarMercados();
        await carregarHistoricoPrecos(); // NOVO
        await carregarProdutos();

    } catch (erro) {

        console.error("Erro ao iniciar:", erro);

        alert("Erro ao carregar página.");
    }
}

// ========================================
// BUSCA
// ========================================

function configurarBusca() {

    const campoBusca =
        document.getElementById("buscaProduto");

    campoBusca.addEventListener("input", () => {

        const termo = campoBusca.value.toLowerCase().trim();

        produtosFiltrados = produtos.filter(produto =>
            produto.nome.toLowerCase().includes(termo)
        );

        renderizarProdutos();
    });
}

// ========================================
// MERCADOS
// ========================================

async function carregarMercados() {

    try {

        const { data, error } = await supabaseClient
            .from("markets")
            .select("*")
            .order("nome");

        if (error) {
            console.error(error);
            alert("Erro ao carregar mercados.");
            return;
        }

        mercadosCache = data || [];

        const select = document.getElementById("marketSelect");

        select.innerHTML = "";

        data.forEach(market => {

            select.innerHTML += `
                <option value="${market.id}">
                    ${market.nome}
                </option>
            `;
        });

    } catch (erro) {
        console.error(erro);
    }
}

// ========================================
// HISTÓRICO DE PREÇOS (NOVO)
// ========================================

async function carregarHistoricoPrecos() {

    try {

        const { data, error } = await supabaseClient
            .from("product_prices")
            .select("*");

        if (error) {
            console.error("Erro preços:", error);
            return;
        }

        historicoPrecos = data || [];

    } catch (erro) {
        console.error("Erro histórico preços:", erro);
    }
}

// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {

    try {

        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .eq("ativo", true)
            .order("nome");

        if (error) {
            console.error(error);
            alert("Erro ao carregar produtos.");
            return;
        }

        produtos = data || [];
        produtosFiltrados = [...produtos];

        atualizarContador();
        renderizarProdutos();

    } catch (erro) {
        console.error(erro);
    }
}

// ========================================
// COMPARADOR INTELIGENTE
// ========================================

function obterMelhorPreco(product_id) {

    const precos = historicoPrecos.filter(p => p.product_id === product_id);

    if (!precos.length) return null;

    let melhor = precos[0];

    for (let i = 1; i < precos.length; i++) {
        if (precos[i].price < melhor.price) {
            melhor = precos[i];
        }
    }

    const market = mercadosCache.find(m => m.id === melhor.market_id);

    return {
        price: melhor.price,
        market_id: melhor.market_id,
        market_name: market ? market.nome : "Desconhecido"
    };
}

function compararPrecos(product_id) {

    const produto = produtos.find(p => p.id === product_id);

    const precos = historicoPrecos.filter(p => p.product_id === product_id);

    if (!produto || !precos.length) return null;

    return precos.map(p => {
        const market = mercadosCache.find(m => m.id === p.market_id);

        return {
            mercado: market ? market.nome : "N/A",
            preco: p.price
        };
    });
}

// Sugestão de economia no carrinho
function sugerirEconomia(item) {

    const melhor = obterMelhorPreco(item.produto.id);

    if (!melhor) return 0;

    const atual = item.quantidade * item.valor;
    const ideal = item.quantidade * melhor.price;

    return atual - ideal;
}

// ========================================
// CONTADOR
// ========================================

function atualizarContador() {

    document.getElementById("contadorProdutos")
        .innerText = `${produtosFiltrados.length} produtos`;
}

// ========================================
// RENDERIZAR PRODUTOS
// ========================================

function renderizarProdutos() {

    atualizarContador();

    const lista = document.getElementById("listaProdutos");

    lista.innerHTML = "";

    if (!produtosFiltrados.length) {
        lista.innerHTML = `<p>Nenhum produto encontrado.</p>`;
        return;
    }

    produtosFiltrados.forEach(produto => {

        const melhor = obterMelhorPreco(produto.id);

        lista.innerHTML += `
        <div class="produto" data-id="${produto.id}">

            <div class="produto-topo">

                <input type="checkbox"
                    class="produto-check"
                    data-id="${produto.id}">

                <div class="produto-nome">
                    ${produto.nome}
                </div>

            </div>

            ${
                melhor ? `
                <div class="melhor-preco">
                    💡 Melhor preço: R$ ${melhor.price.toFixed(2)} em ${melhor.market_name}
                </div>
                ` : ""
            }

            <div class="produto-campos">

                <div>
                    <label>Quantidade</label>
                    <input type="number" min="0" step="0.01" class="qtd">
                </div>

                <div>
                    <label>Valor Unitário</label>
                    <input type="number" min="0" step="0.01" class="valor">
                </div>

            </div>

            <div class="produto-subtotal">
                <span>Subtotal</span>
                <strong class="subtotal">R$ 0,00</strong>
            </div>

        </div>
        `;
    });

    configurarEventosProdutos();
}

// ========================================
// EVENTOS
// ========================================

function configurarEventosProdutos() {

    document.querySelectorAll(".produto").forEach(card => {

        const checkbox = card.querySelector(".produto-check");
        const qtd = card.querySelector(".qtd");
        const valor = card.querySelector(".valor");

        checkbox.addEventListener("change", () => {

            card.classList.toggle("selecionado", checkbox.checked);
            atualizarResumo();
        });

        qtd.addEventListener("input", atualizarResumo);
        valor.addEventListener("input", atualizarResumo);
    });
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    let quantidadeTotal = 0;
    let valorTotal = 0;
    let economiaTotal = 0;

    document.querySelectorAll(".produto").forEach(card => {

        const checkbox = card.querySelector(".produto-check");

        const qtd = Number(card.querySelector(".qtd").value || 0);
        const valor = Number(card.querySelector(".valor").value || 0);

        const subtotal = qtd * valor;

        card.querySelector(".subtotal").innerText =
            subtotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        if (checkbox.checked) {

            quantidadeTotal += qtd;
            valorTotal += subtotal;

            const produtoId = Number(checkbox.dataset.id);
            const produto = produtos.find(p => p.id === produtoId);

            if (produto) {

                economiaTotal += sugerirEconomia({
                    produto,
                    quantidade: qtd,
                    valor
                });
            }
        }
    });

    document.getElementById("qtdTotal").innerText = quantidadeTotal;

    document.getElementById("valorTotal").innerText =
        valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    // opcional: mostrar economia se existir elemento
    const economiaEl = document.getElementById("economiaTotal");

    if (economiaEl) {
        economiaEl.innerText =
            economiaTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
    }
}

// ========================================
// SALVAR COMPRA (INALTERADO LOGICAMENTE)
// ========================================

async function salvarCompra() {

    try {

        const marketId = document.getElementById("marketSelect").value;
        const dataCompra = document.getElementById("dataCompra").value;
        const observacoes = document.getElementById("observacoes").value;

        const itensSelecionados = [];

        let quantidadeTotal = 0;
        let valorTotal = 0;

        document.querySelectorAll(".produto").forEach(card => {

            const checkbox = card.querySelector(".produto-check");

            if (!checkbox.checked) return;

            const qtd = Number(card.querySelector(".qtd").value || 0);
            const valor = Number(card.querySelector(".valor").value || 0);

            if (qtd <= 0 || valor <= 0) return;

            const subtotal = qtd * valor;

            itensSelecionados.push({
                product_id: Number(checkbox.dataset.id),
                quantidade: qtd,
                valor_unitario: valor,
                subtotal
            });

            quantidadeTotal += qtd;
            valorTotal += subtotal;
        });

        if (!itensSelecionados.length) {
            alert("Selecione ao menos um produto válido.");
            return;
        }

        const { data: compra, error: compraError } = await supabaseClient
            .from("purchases")
            .insert({
                user_id: usuarioAtual.id,
                market_id: Number(marketId),
                data_compra: dataCompra,
                observacoes,
                valor_total: valorTotal,
                quantidade_total: quantidadeTotal
            })
            .select()
            .single();

        if (compraError) {
            console.error(compraError);
            alert("Erro ao salvar compra.");
            return;
        }

        const itensBanco = itensSelecionados.map(item => ({
            purchase_id: compra.id,
            product_id: item.product_id,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            subtotal: item.subtotal
        }));

        const { error: itensError } = await supabaseClient
            .from("purchase_items")
            .insert(itensBanco);

        if (itensError) {
            console.error(itensError);
            alert("Compra salva, mas houve erro ao gravar itens.");
            return;
        }

        alert("Compra cadastrada com sucesso!");
        window.location.href = "dashboard.html";

    } catch (erro) {
        console.error(erro);
        alert("Erro inesperado ao salvar compra.");
    }
}

// ========================================
// START
// ========================================

iniciar();