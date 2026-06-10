// ========================================
// ATACACONTROL
// NOVA COMPRA V4.0 FULL EXPANDED
// COMPARADOR INTELIGENTE + CACHE + SUPABASE
// ========================================

let produtos = [];
let produtosFiltrados = [];
let usuarioAtual = null;

// ========================================
// CACHE INTELIGENTE DE PREÇOS
// ========================================

let cachePrecos = [];
let cacheRankingProdutos = {};
let cacheMedias = {};
let mercadosCache = [];

// controle de performance
let ultimaAtualizacaoCache = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

async function iniciar() {

    try {

        const { data: { session } } =
            await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = "/";
            return;
        }

        usuarioAtual = session.user;

        document.getElementById("dataCompra").valueAsDate = new Date();

        configurarBusca();

        await carregarMercados();
        await carregarCachePrecos();
        await carregarProdutos();

        console.log("Sistema V4.0 inicializado com sucesso");

    } catch (erro) {

        console.error("Erro ao iniciar sistema:", erro);
        alert("Erro ao carregar página.");
    }
}

// ========================================
// BUSCA OTIMIZADA (DEBOUNCE)
// ========================================

function configurarBusca() {

    const campo = document.getElementById("buscaProduto");

    let timeout = null;

    campo.addEventListener("input", () => {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            const termo = campo.value.toLowerCase().trim();

            produtosFiltrados = produtos.filter(p =>
                p.nome.toLowerCase().includes(termo)
            );

            renderizarProdutos();

        }, 250);
    });
}

// ========================================
// MERCADOS
// ========================================

async function carregarMercados() {

    const { data, error } = await supabaseClient
        .from("markets")
        .select("*")
        .order("nome");

    if (error) {
        console.error("Erro mercados:", error);
        return;
    }

    mercadosCache = data || [];

    const select = document.getElementById("marketSelect");
    select.innerHTML = "";

    mercadosCache.forEach(m => {
        select.innerHTML += `
            <option value="${m.id}">${m.nome}</option>
        `;
    });
}

// ========================================
// CACHE DE PREÇOS (CORE DO SISTEMA)
// ========================================

async function carregarCachePrecos(force = false) {

    const agora = Date.now();

    // cache válido por 5 minutos
    if (!force && ultimaAtualizacaoCache &&
        agora - ultimaAtualizacaoCache < 300000) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("product_prices")
        .select("*");

    if (error) {
        console.error("Erro cache preços:", error);
        return;
    }

    cachePrecos = data || [];
    ultimaAtualizacaoCache = agora;

    construirCacheInteligente();
}

// ========================================
// CACHE DERIVADO (MÉDIA + RANKING)
// ========================================

function construirCacheInteligente() {

    cacheRankingProdutos = {};
    cacheMedias = {};

    cachePrecos.forEach(p => {

        if (!cacheRankingProdutos[p.product_id]) {
            cacheRankingProdutos[p.product_id] = [];
        }

        cacheRankingProdutos[p.product_id].push(p.price);
    });

    Object.keys(cacheRankingProdutos).forEach(id => {

        const valores = cacheRankingProdutos[id];

        const media =
            valores.reduce((a, b) => a + b, 0) / valores.length;

        cacheMedias[id] = media;
    });
}

// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("ativo", true)
        .order("nome");

    if (error) {
        console.error(error);
        return;
    }

    produtos = data || [];
    produtosFiltrados = [...produtos];

    atualizarContador();
    renderizarProdutos();
}

// ========================================
// COMPARADOR INTELIGENTE V4
// ========================================

function obterMelhorPreco(product_id) {

    const precos = cachePrecos.filter(p =>
        p.product_id === product_id
    );

    if (!precos.length) return null;

    let melhor = precos[0];

    for (let i = 1; i < precos.length; i++) {
        if (precos[i].price < melhor.price) {
            melhor = precos[i];
        }
    }

    const market = mercadosCache.find(m =>
        m.id === melhor.market_id
    );

    const media = cacheMedias[product_id] || 0;

    return {
        price: melhor.price,
        market_id: melhor.market_id,
        market_name: market ? market.nome : "Desconhecido",
        media: media.toFixed(2),
        diferencaMedia: (media - melhor.price).toFixed(2)
    };
}

function rankingMercados(product_id) {

    const precos = cachePrecos.filter(p =>
        p.product_id === product_id
    );

    return precos
        .sort((a, b) => a.price - b.price)
        .map(p => {

            const market = mercadosCache.find(m =>
                m.id === p.market_id
            );

            return {
                market: market ? market.nome : "N/A",
                price: p.price
            };
        });
}

// ========================================
// RENDERIZAÇÃO
// ========================================

function renderizarProdutos() {

    atualizarContador();

    const lista = document.getElementById("listaProdutos");

    lista.innerHTML = "";

    if (!produtosFiltrados.length) {
        lista.innerHTML = "<p>Nenhum produto encontrado.</p>";
        return;
    }

    produtosFiltrados.forEach(produto => {

        const melhor = obterMelhorPreco(produto.id);

        const ranking = rankingMercados(produto.id);

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

            ${melhor ? `
                <div class="info-preco">
                    💡 Melhor: R$ ${melhor.price.toFixed(2)} (${melhor.market_name})<br>
                    📊 Média: R$ ${melhor.media}<br>
                    📉 Economia: R$ ${melhor.diferencaMedia}
                </div>
            ` : ""}

            <details>
                <summary>Comparar mercados</summary>
                <ul>
                    ${ranking.map(r =>
                        `<li>${r.market}: R$ ${r.price.toFixed(2)}</li>`
                    ).join("")}
                </ul>
            </details>

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
// RESUMO INTELIGENTE
// ========================================

function atualizarResumo() {

    let qtdTotal = 0;
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

            qtdTotal += qtd;
            valorTotal += subtotal;

            const id = Number(checkbox.dataset.id);

            const melhor = obterMelhorPreco(id);

            if (melhor) {
                const ideal = qtd * melhor.price;
                economiaTotal += (subtotal - ideal);
            }
        }
    });

    document.getElementById("qtdTotal").innerText = qtdTotal;

    document.getElementById("valorTotal").innerText =
        valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    const econEl = document.getElementById("economiaTotal");

    if (econEl) {
        econEl.innerText =
            economiaTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
    }
}

// ========================================
// SALVAR COMPRA
// ========================================

async function salvarCompra() {

    try {

        const marketId = document.getElementById("marketSelect").value;
        const dataCompra = document.getElementById("dataCompra").value;
        const observacoes = document.getElementById("observacoes").value;

        const itens = [];

        let qtdTotal = 0;
        let valorTotal = 0;

        document.querySelectorAll(".produto").forEach(card => {

            const checkbox = card.querySelector(".produto-check");

            if (!checkbox.checked) return;

            const qtd = Number(card.querySelector(".qtd").value || 0);
            const valor = Number(card.querySelector(".valor").value || 0);

            if (qtd <= 0 || valor <= 0) return;

            const subtotal = qtd * valor;

            itens.push({
                product_id: Number(checkbox.dataset.id),
                quantidade: qtd,
                valor_unitario: valor,
                subtotal
            });

            qtdTotal += qtd;
            valorTotal += subtotal;
        });

        if (!itens.length) {
            alert("Selecione produtos válidos.");
            return;
        }

        const { data: compra, error } = await supabaseClient
            .from("purchases")
            .insert({
                user_id: usuarioAtual.id,
                market_id: Number(marketId),
                data_compra: dataCompra,
                observacoes,
                valor_total: valorTotal,
                quantidade_total: qtdTotal
            })
            .select()
            .single();

        if (error) {
            console.error(error);
            alert("Erro ao salvar compra.");
            return;
        }

        const itensInsert = itens.map(i => ({
            purchase_id: compra.id,
            product_id: i.product_id,
            quantidade: i.quantidade,
            valor_unitario: i.valor_unitario,
            subtotal: i.subtotal
        }));

        const { error: errItens } = await supabaseClient
            .from("purchase_items")
            .insert(itensInsert);

        if (errItens) {
            console.error(errItens);
            alert("Compra salva, mas erro nos itens.");
            return;
        }

        alert("Compra registrada com sucesso!");
        window.location.href = "dashboard.html";

    } catch (erro) {
        console.error(erro);
        alert("Erro inesperado.");
    }
}

// ========================================
// START
// ========================================

iniciar();