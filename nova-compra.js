// ========================================
// MINHA DISPENSA
// NOVA COMPRA
// CATÁLOGO EM CARDS + SUGESTÃO DE PRODUTO
// ========================================

let usuarioAtual = null;
let produtos = [];
let produtosFiltrados = [];
let mercados = [];
let compraItens = {};

// ========================================
// INICIAR
// ========================================

async function iniciar() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {

            window.location.href = "index.html";

            return;
        }

        usuarioAtual = session.user;

        definirDataAtual();

        configurarBusca();

        await carregarMercados();

        await carregarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao iniciar nova compra:",
            erro
        );

        alert(
            "Erro ao carregar tela de nova compra."
        );
    }
}

// ========================================
// DATA ATUAL
// ========================================

function definirDataAtual() {

    const campoData =
        document.getElementById(
            "dataCompra"
        );

    if (campoData) {

        campoData.value =
            new Date()
                .toISOString()
                .split("T")[0];
    }
}

// ========================================
// BUSCA
// ========================================

function configurarBusca() {

    const busca =
        document.getElementById(
            "buscaProduto"
        );

    if (!busca) return;

    busca.addEventListener(
        "input",
        filtrarProdutos
    );
}

function filtrarProdutos() {

    const termo =
        document
            .getElementById("buscaProduto")
            .value
            .toLowerCase()
            .trim();

    produtosFiltrados =
        produtos.filter(produto => {

            const texto =
                [
                    produto.nome,
                    produto.marca,
                    produto.tamanho,
                    produto.categoria
                ]
                .join(" ")
                .toLowerCase();

            return !termo ||
                texto.includes(termo);
        });

    renderizarProdutos();
}

// ========================================
// MERCADOS
// ========================================

async function carregarMercados() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("markets")
            .select("*")
            .order("nome", {
                ascending: true
            });

        if (error) {

            console.error(
                "Erro ao carregar mercados:",
                error
            );

            return;
        }

        mercados = data || [];

        renderizarMercados();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar mercados:",
            erro
        );
    }
}

function renderizarMercados() {

    const select =
        document.getElementById(
            "marketSelect"
        );

    if (!select) return;

    if (!mercados.length) {

        select.innerHTML = `
            <option value="">
                Nenhum mercado cadastrado
            </option>
        `;

        return;
    }

    select.innerHTML = `
        <option value="">
            Selecione o mercado
        </option>
    `;

    mercados.forEach(mercado => {

        select.innerHTML += `
            <option value="${mercado.id}">
                ${mercado.nome}
            </option>
        `;
    });
}

// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("v_products_catalog")
            .select("*")
            .order("categoria", {
                ascending: true
            })
            .order("nome", {
                ascending: true
            });

        if (error) {

            console.error(
                "Erro ao carregar catálogo:",
                error
            );

            alert(
                "Erro ao carregar catálogo de produtos."
            );

            renderizarProdutosVazio();

            return;
        }

        produtos = data || [];
        produtosFiltrados = [...produtos];

        renderizarProdutos();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar produtos:",
            erro
        );

        renderizarProdutosVazio();
    }
}

function renderizarProdutosVazio() {

    const container =
        document.getElementById(
            "listaProdutos"
        );

    if (!container) return;

    container.innerHTML = `
        <div class="produto-card empty-card">
            Nenhum produto encontrado no catálogo.
        </div>
    `;
}

// ========================================
// RENDERIZAR PRODUTOS
// ========================================

function renderizarProdutos() {

    const container =
        document.getElementById(
            "listaProdutos"
        );

    const contador =
        document.getElementById(
            "contadorProdutos"
        );

    if (!container) return;

    if (contador) {

        contador.innerText =
            `${produtosFiltrados.length} produtos`;
    }

    if (!produtosFiltrados.length) {

        container.innerHTML = `
            <div class="produto-card empty-card">
                Nenhum produto encontrado. Use o botão “Não encontrei o produto”.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    produtosFiltrados.forEach(produto => {

        const item =
            compraItens[produto.id] || {
                selecionado: false,
                quantidade: "",
                valor_unitario: "",
                subtotal: 0,
                ultimo_preco: null
            };

        const selecionado =
            item.selecionado
                ? "selecionado"
                : "";

        container.innerHTML += `

            <article
                class="produto-card ${selecionado}"
                id="produtoCard-${produto.id}">

                <div class="produto-topo">

                    <div class="produto-icone">
                        ${renderizarIconeProduto(produto)}
                    </div>

                    <div class="produto-info-topo">

                        <div class="produto-nome">
                            ${produto.nome || "Produto"}
                        </div>

                        <div class="produto-marca">
                            ${produto.marca || "Marca não informada"}
                        </div>

                        <span class="produto-categoria">
                            ${produto.categoria || "Geral"}
                        </span>

                    </div>

                    <input
                        type="checkbox"
                        class="produto-check"
                        ${item.selecionado ? "checked" : ""}
                        onchange="alternarProduto(${produto.id}, this.checked)">

                </div>

                <div class="produto-meta">

                    <div class="meta-item">

                        <small>
                            Tamanho
                        </small>

                        <strong>
                            ${produto.tamanho || "-"}
                        </strong>

                    </div>

                    <div class="meta-item">

                        <small>
                            Unidade
                        </small>

                        <strong>
                            ${produto.unidade || "un"}
                        </strong>

                    </div>

                </div>

                <div class="produto-grid">

                    <div class="campo-produto">

                        <label for="qtd-${produto.id}">
                            Quantidade comprada
                        </label>

                        <input
                            type="number"
                            id="qtd-${produto.id}"
                            min="0"
                            step="0.01"
                            placeholder="Ex.: 2"
                            value="${item.quantidade || ""}"
                            oninput="atualizarItemCompra(${produto.id})">

                    </div>

                    <div class="campo-produto">

                        <label for="valor-${produto.id}">
                            Valor unitário
                        </label>

                        <input
                            type="number"
                            id="valor-${produto.id}"
                            min="0"
                            step="0.01"
                            placeholder="Ex.: 24.90"
                            value="${item.valor_unitario || ""}"
                            oninput="atualizarItemCompra(${produto.id})">

                    </div>

                </div>

                <div
                    id="comparador-${produto.id}"
                    class="comparador-preco">

                    ${renderizarComparador(item)}

                </div>

                <div class="subtotal-card">

                    <span>
                        Subtotal
                    </span>

                    <strong id="subtotal-${produto.id}">
                        ${formatarMoeda(item.subtotal || 0)}
                    </strong>

                </div>

            </article>

        `;

        carregarUltimoPrecoProduto(produto.id);
    });

    atualizarResumo();
}

function renderizarIconeProduto(produto) {

    if (produto.imagem_url) {

        return `
            <img
                src="${produto.imagem_url}"
                alt="${produto.nome}">
        `;
    }

    return produto.icone || "🛒";
}

function renderizarComparador(item) {

    const ultimoPreco =
        item.ultimo_preco
            ? formatarMoeda(item.ultimo_preco)
            : "—";

    const precoAtual =
        item.valor_unitario
            ? formatarMoeda(item.valor_unitario)
            : "—";

    const texto =
        gerarTextoVariacaoPreco(
            item.ultimo_preco,
            item.valor_unitario
        );

    return `
        <div class="linha-preco">
            <span class="label-preco">Último preço</span>
            <strong class="ultimo-preco">${ultimoPreco}</strong>
        </div>

        <div class="linha-preco">
            <span class="label-preco">Preço atual</span>
            <strong class="preco-atual">${precoAtual}</strong>
        </div>

        <div class="variacao-preco ${texto.classe}">
            ${texto.mensagem}
        </div>
    `;
}

// ========================================
// ÚLTIMO PREÇO
// ========================================

async function carregarUltimoPrecoProduto(productId) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("product_prices")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();

        if (error) {

            return;
        }

        if (!compraItens[productId]) {

            compraItens[productId] = {
                selecionado: false,
                quantidade: "",
                valor_unitario: "",
                subtotal: 0,
                ultimo_preco: null
            };
        }

        compraItens[productId].ultimo_preco =
            data?.price || null;

        const comparador =
            document.getElementById(
                `comparador-${productId}`
            );

        if (comparador) {

            comparador.innerHTML =
                renderizarComparador(
                    compraItens[productId]
                );
        }

    } catch (erro) {

        console.error(
            "Erro ao carregar último preço:",
            erro
        );
    }
}

// ========================================
// ITEM COMPRA
// ========================================

function alternarProduto(
    productId,
    selecionado
) {

    if (!compraItens[productId]) {

        compraItens[productId] = {
            selecionado: false,
            quantidade: "",
            valor_unitario: "",
            subtotal: 0,
            ultimo_preco: null
        };
    }

    compraItens[productId].selecionado =
        selecionado;

    const card =
        document.getElementById(
            `produtoCard-${productId}`
        );

    if (card) {

        card.classList.toggle(
            "selecionado",
            selecionado
        );
    }

    atualizarItemCompra(productId);
}

function atualizarItemCompra(productId) {

    if (!compraItens[productId]) {

        compraItens[productId] = {
            selecionado: true,
            quantidade: "",
            valor_unitario: "",
            subtotal: 0,
            ultimo_preco: null
        };
    }

    const quantidade =
        Number(
            document
                .getElementById(`qtd-${productId}`)
                ?.value || 0
        );

    const valorUnitario =
        Number(
            document
                .getElementById(`valor-${productId}`)
                ?.value || 0
        );

    if (
        quantidade > 0 ||
        valorUnitario > 0
    ) {

        compraItens[productId].selecionado =
            true;

        const check =
            document.querySelector(
                `#produtoCard-${productId} .produto-check`
            );

        const card =
            document.getElementById(
                `produtoCard-${productId}`
            );

        if (check) check.checked = true;

        if (card) {
            card.classList.add("selecionado");
        }
    }

    compraItens[productId].quantidade =
        quantidade;

    compraItens[productId].valor_unitario =
        valorUnitario;

    compraItens[productId].subtotal =
        quantidade * valorUnitario;

    const subtotal =
        document.getElementById(
            `subtotal-${productId}`
        );

    if (subtotal) {

        subtotal.innerText =
            formatarMoeda(
                compraItens[productId].subtotal
            );
    }

    const comparador =
        document.getElementById(
            `comparador-${productId}`
        );

    if (comparador) {

        comparador.innerHTML =
            renderizarComparador(
                compraItens[productId]
            );
    }

    atualizarResumo();
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const itens =
        Object
            .values(compraItens)
            .filter(
                item =>
                    item.selecionado &&
                    Number(item.quantidade) > 0 &&
                    Number(item.valor_unitario) > 0
            );

    const quantidadeTotal =
        itens.reduce(
            (total, item) =>
                total +
                Number(item.quantidade || 0),
            0
        );

    const valorTotal =
        itens.reduce(
            (total, item) =>
                total +
                Number(item.subtotal || 0),
            0
        );

    atualizarTexto(
        "qtdTotal",
        formatarQuantidade(
            quantidadeTotal
        )
    );

    atualizarTexto(
        "valorTotal",
        formatarMoeda(
            valorTotal
        )
    );
}

// ========================================
// SALVAR COMPRA
// ========================================

async function salvarCompra() {

    const dataCompra =
        document.getElementById(
            "dataCompra"
        ).value;

    const marketId =
        document.getElementById(
            "marketSelect"
        ).value;

    const observacoes =
        document.getElementById(
            "observacoes"
        ).value
        .trim();

    if (!dataCompra) {

        alert("Informe a data da compra.");
        return;
    }

    if (!marketId) {

        alert("Selecione o mercado.");
        return;
    }

    const itensSelecionados =
        Object
            .entries(compraItens)
            .filter(([, item]) =>
                item.selecionado &&
                Number(item.quantidade) > 0 &&
                Number(item.valor_unitario) > 0
            )
            .map(([productId, item]) => ({
                product_id: Number(productId),
                quantidade: Number(item.quantidade),
                valor_unitario: Number(item.valor_unitario),
                subtotal: Number(item.subtotal)
            }));

    if (!itensSelecionados.length) {

        alert(
            "Selecione pelo menos um produto com quantidade e valor unitário."
        );

        return;
    }

    const valorTotal =
        itensSelecionados.reduce(
            (total, item) =>
                total + item.subtotal,
            0
        );

    const quantidadeTotal =
        itensSelecionados.reduce(
            (total, item) =>
                total + item.quantidade,
            0
        );

    try {

        const {
            data: compra,
            error: compraError
        } = await supabaseClient
            .from("purchases")
            .insert({
                user_id:
                    usuarioAtual.id,

                market_id:
                    Number(marketId),

                data_compra:
                    dataCompra,

                valor_total:
                    valorTotal,

                quantidade_total:
                    quantidadeTotal,

                observacoes:
                    observacoes || null
            })
            .select()
            .single();

        if (compraError) {

            console.error(compraError);

            alert(
                "Erro ao salvar compra."
            );

            return;
        }

        const itensPayload =
            itensSelecionados.map(item => ({
                purchase_id:
                    compra.id,

                product_id:
                    item.product_id,

                quantidade:
                    item.quantidade,

                valor_unitario:
                    item.valor_unitario,

                subtotal:
                    item.subtotal
            }));

        const {
            error: itensError
        } = await supabaseClient
            .from("purchase_items")
            .insert(itensPayload);

        if (itensError) {

            console.error(itensError);

            alert(
                "Compra criada, mas houve erro ao salvar os itens."
            );

            return;
        }

        await registrarHistoricoPrecos(
            itensSelecionados,
            marketId
        );

        await atualizarDispensa(
            itensSelecionados
        );

        alert(
            "Compra salva com sucesso."
        );

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(
            "Erro inesperado ao salvar compra:",
            erro
        );

        alert(
            "Erro inesperado ao salvar compra."
        );
    }
}

// ========================================
// PREÇOS
// ========================================

async function registrarHistoricoPrecos(
    itens,
    marketId
) {

    const payload =
        itens.map(item => ({
            product_id:
                item.product_id,

            market_id:
                Number(marketId),

            price:
                item.valor_unitario
        }));

    const {
        error
    } = await supabaseClient
        .from("product_prices")
        .insert(payload);

    if (error) {

        console.error(
            "Erro ao registrar preços:",
            error
        );
    }
}

// ========================================
// DISPENSA
// ========================================

async function atualizarDispensa(itens) {

    for (const item of itens) {

        const {
            data: estoqueAtual,
            error: estoqueError
        } = await supabaseClient
            .from("pantry_stock")
            .select("*")
            .eq("user_id", usuarioAtual.id)
            .eq("product_id", item.product_id)
            .maybeSingle();

        if (estoqueError) {

            console.error(
                "Erro ao consultar estoque:",
                estoqueError
            );

            continue;
        }

        if (estoqueAtual) {

            const novaQuantidade =
                Number(
                    estoqueAtual.quantidade_atual || 0
                ) +
                Number(
                    item.quantidade || 0
                );

            const {
                error
            } = await supabaseClient
                .from("pantry_stock")
                .update({
                    quantidade_atual:
                        novaQuantidade,

                    ativo:
                        true
                })
                .eq("id", estoqueAtual.id)
                .eq("user_id", usuarioAtual.id);

            if (error) {

                console.error(
                    "Erro ao atualizar estoque:",
                    error
                );
            }

        } else {

            const produto =
                produtos.find(
                    produto =>
                        Number(produto.id) ===
                        Number(item.product_id)
                );

            const {
                error
            } = await supabaseClient
                .from("pantry_stock")
                .insert({
                    user_id:
                        usuarioAtual.id,

                    product_id:
                        item.product_id,

                    quantidade_atual:
                        item.quantidade,

                    quantidade_minima:
                        1,

                    unidade:
                        produto?.unidade || "un",

                    ativo:
                        true
                });

            if (error) {

                console.error(
                    "Erro ao criar estoque:",
                    error
                );
            }
        }
    }
}

// ========================================
// SUGESTÃO DE PRODUTO
// ========================================

function abrirModalSugestao() {

    const modal =
        document.getElementById(
            "modalSugestaoProduto"
        );

    if (modal) {

        modal.classList.add("ativo");
    }

    const busca =
        document.getElementById(
            "buscaProduto"
        );

    const nome =
        document.getElementById(
            "sugestaoNome"
        );

    if (busca && nome && busca.value.trim()) {

        nome.value =
            busca.value.trim();
    }
}

function fecharModalSugestao() {

    const modal =
        document.getElementById(
            "modalSugestaoProduto"
        );

    if (modal) {

        modal.classList.remove("ativo");
    }
}

async function enviarSugestaoProduto() {

    const nome =
        document
            .getElementById("sugestaoNome")
            .value
            .trim();

    const marca =
        document
            .getElementById("sugestaoMarca")
            .value
            .trim();

    const categoria =
        document
            .getElementById("sugestaoCategoria")
            .value
            .trim();

    const tamanho =
        document
            .getElementById("sugestaoTamanho")
            .value
            .trim();

    const unidade =
        document
            .getElementById("sugestaoUnidade")
            .value
            .trim();

    const observacao =
        document
            .getElementById("sugestaoObservacao")
            .value
            .trim();

    if (!nome) {

        alert(
            "Informe o nome do produto."
        );

        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("product_suggestions")
            .insert({
                user_id:
                    usuarioAtual.id,

                nome,
                marca:
                    marca || null,

                categoria:
                    categoria || null,

                tamanho:
                    tamanho || null,

                unidade:
                    unidade || null,

                observacao:
                    observacao || null,

                status:
                    "pendente"
            });

        if (error) {

            console.error(
                "Erro ao enviar sugestão:",
                error
            );

            alert(
                "Erro ao enviar sugestão de produto."
            );

            return;
        }

        alert(
            "Sugestão enviada para aprovação."
        );

        limparFormularioSugestao();

        fecharModalSugestao();

    } catch (erro) {

        console.error(
            "Erro inesperado ao enviar sugestão:",
            erro
        );

        alert(
            "Erro inesperado ao enviar sugestão."
        );
    }
}

function limparFormularioSugestao() {

    [
        "sugestaoNome",
        "sugestaoMarca",
        "sugestaoCategoria",
        "sugestaoTamanho",
        "sugestaoUnidade",
        "sugestaoObservacao"
    ].forEach(id => {

        const campo =
            document.getElementById(id);

        if (campo) {

            campo.value = "";
        }
    });
}

// ========================================
// HELPERS
// ========================================

function gerarTextoVariacaoPreco(
    ultimoPreco,
    precoAtual
) {

    const ultimo =
        Number(ultimoPreco || 0);

    const atual =
        Number(precoAtual || 0);

    if (!ultimo || !atual) {

        return {
            classe: "variacao-igual",
            mensagem:
                "Aguardando valor para comparar."
        };
    }

    if (atual > ultimo) {

        const percentual =
            ((atual - ultimo) / ultimo) * 100;

        return {
            classe: "variacao-alta",
            mensagem:
                `Subiu ${percentual.toFixed(1).replace(".", ",")}% em relação ao último preço.`
        };
    }

    if (atual < ultimo) {

        const percentual =
            ((ultimo - atual) / ultimo) * 100;

        return {
            classe: "variacao-baixa",
            mensagem:
                `Caiu ${percentual.toFixed(1).replace(".", ",")}% em relação ao último preço.`
        };
    }

    return {
        classe: "variacao-igual",
        mensagem:
            "Preço igual ao último registro."
    };
}

function atualizarTexto(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.innerText =
            valor;
    }
}

function formatarMoeda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}

function formatarQuantidade(valor) {

    const numero =
        Number(valor || 0);

    return numero.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits:
                numero % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        }
    );
}

// ========================================
// FECHAR MODAL CLICANDO FORA
// ========================================

window.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "modalSugestaoProduto"
            );

        if (
            modal &&
            event.target === modal
        ) {

            fecharModalSugestao();
        }
    }
);

// ========================================
// START
// ========================================

iniciar();