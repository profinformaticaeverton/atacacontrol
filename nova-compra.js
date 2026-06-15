// ========================================
// MINHA DISPENSA
// NOVA COMPRA
// REGISTRO DE COMPRA + ATUALIZAÇÃO DE ESTOQUE
// ========================================

let produtos = [];
let produtosFiltrados = [];
let usuarioAtual = null;

// ========================================
// COMPARADOR INTELIGENTE
// ========================================

let historicoPrecos = [];
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
        await carregarHistoricoPrecos();
        await carregarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao iniciar nova compra:",
            erro
        );

        alert(
            "Erro ao carregar a tela de nova compra."
        );
    }
}

// ========================================
// BUSCA
// ========================================

function configurarBusca() {

    const campoBusca =
        document.getElementById(
            "buscaProduto"
        );

    campoBusca.addEventListener(
        "input",
        () => {

            const termo =
                campoBusca
                    .value
                    .toLowerCase()
                    .trim();

            produtosFiltrados =
                produtos.filter(
                    produto =>
                        produto.nome
                            .toLowerCase()
                            .includes(termo)
                );

            renderizarProdutos();
        }
    );
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
            .order("nome");

        if (error) {

            console.error(error);

            alert(
                "Erro ao carregar mercados."
            );

            return;
        }

        mercadosCache = data || [];

        const select =
            document.getElementById(
                "marketSelect"
            );

        select.innerHTML = "";

        if (!mercadosCache.length) {

            select.innerHTML = `
                <option value="">
                    Nenhum mercado cadastrado
                </option>
            `;

            return;
        }

        mercadosCache.forEach(market => {

            select.innerHTML += `
                <option value="${market.id}">
                    ${market.nome}
                </option>
            `;
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar mercados:",
            erro
        );
    }
}

// ========================================
// HISTÓRICO DE PREÇOS
// ========================================

async function carregarHistoricoPrecos() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("product_prices")
            .select("*");

        if (error) {

            console.error(
                "Erro ao carregar histórico de preços:",
                error
            );

            return;
        }

        historicoPrecos = data || [];

    } catch (erro) {

        console.error(
            "Erro carregar preços:",
            erro
        );
    }
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
            .from("products")
            .select("*")
            .eq("ativo", true)
            .order("nome");

        if (error) {

            console.error(error);

            alert(
                "Erro ao carregar produtos."
            );

            return;
        }

        produtos = data || [];
        produtosFiltrados = [...produtos];

        atualizarContador();
        renderizarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );
    }
}

// ========================================
// COMPARADOR INTELIGENTE
// ========================================

function obterMelhorPreco(product_id) {

    const precos =
        historicoPrecos.filter(
            p =>
                Number(p.product_id) ===
                Number(product_id)
        );

    if (!precos.length) return null;

    let melhor = precos[0];

    for (let i = 1; i < precos.length; i++) {

        if (
            Number(precos[i].price) <
            Number(melhor.price)
        ) {

            melhor = precos[i];
        }
    }

    const market =
        mercadosCache.find(
            m =>
                Number(m.id) ===
                Number(melhor.market_id)
        );

    return {
        price: Number(melhor.price),
        market_name: market
            ? market.nome
            : "mercado não identificado"
    };
}

// ========================================
// CONTADOR
// ========================================

function atualizarContador() {

    const contador =
        document.getElementById(
            "contadorProdutos"
        );

    if (contador) {

        contador.innerText =
            `${produtosFiltrados.length} produtos`;
    }
}

// ========================================
// RENDERIZAÇÃO
// ========================================

function renderizarProdutos() {

    atualizarContador();

    const lista =
        document.getElementById(
            "listaProdutos"
        );

    lista.innerHTML = "";

    if (!produtosFiltrados.length) {

        lista.innerHTML = `
            <div class="produto">
                <div class="produto-nome">
                    Nenhum produto encontrado.
                </div>
            </div>
        `;

        return;
    }

    produtosFiltrados.forEach(produto => {

        const melhor =
            obterMelhorPreco(
                produto.id
            );

        lista.innerHTML += `

        <article class="produto" data-id="${produto.id}">

            <div class="produto-topo">

                <input
                    type="checkbox"
                    class="produto-check"
                    data-id="${produto.id}">

                <div class="produto-nome">
                    ${produto.nome}
                </div>

            </div>

            ${
                melhor
                    ? `
                        <div class="melhor-preco">
                            💡 Melhor preço já registrado:
                            ${formatarMoeda(melhor.price)}
                            em ${melhor.market_name}
                        </div>
                    `
                    : `
                        <div class="melhor-preco">
                            💡 Primeiro registro de preço deste produto.
                        </div>
                    `
            }

            <div class="produto-campos">

                <div>

                    <label>
                        Quantidade comprada
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="qtd"
                        placeholder="Ex.: 2">

                </div>

                <div>

                    <label>
                        Valor unitário
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="valor"
                        placeholder="Ex.: 8.99">

                </div>

            </div>

            <div class="produto-subtotal">

                <span>
                    Subtotal
                </span>

                <strong class="subtotal">
                    R$ 0,00
                </strong>

            </div>

        </article>

        `;
    });

    configurarEventosProdutos();
}

// ========================================
// EVENTOS DOS PRODUTOS
// ========================================

function configurarEventosProdutos() {

    document
        .querySelectorAll(".produto")
        .forEach(card => {

            const checkbox =
                card.querySelector(
                    ".produto-check"
                );

            const qtd =
                card.querySelector(
                    ".qtd"
                );

            const valor =
                card.querySelector(
                    ".valor"
                );

            if (
                !checkbox ||
                !qtd ||
                !valor
            ) {

                return;
            }

            checkbox.addEventListener(
                "change",
                () => {

                    card.classList.toggle(
                        "selecionado",
                        checkbox.checked
                    );

                    atualizarResumo();
                }
            );

            qtd.addEventListener(
                "input",
                atualizarResumo
            );

            valor.addEventListener(
                "input",
                atualizarResumo
            );
        });
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    let quantidadeTotal = 0;
    let valorTotal = 0;

    document
        .querySelectorAll(".produto")
        .forEach(card => {

            const checkbox =
                card.querySelector(
                    ".produto-check"
                );

            const qtdInput =
                card.querySelector(
                    ".qtd"
                );

            const valorInput =
                card.querySelector(
                    ".valor"
                );

            const subtotalEl =
                card.querySelector(
                    ".subtotal"
                );

            if (
                !checkbox ||
                !qtdInput ||
                !valorInput ||
                !subtotalEl
            ) {

                return;
            }

            const qtd =
                Number(
                    qtdInput.value || 0
                );

            const valor =
                Number(
                    valorInput.value || 0
                );

            const subtotal =
                qtd * valor;

            subtotalEl.innerText =
                formatarMoeda(subtotal);

            if (checkbox.checked) {

                quantidadeTotal += qtd;
                valorTotal += subtotal;
            }
        });

    document
        .getElementById("qtdTotal")
        .innerText =
        quantidadeTotal;

    document
        .getElementById("valorTotal")
        .innerText =
        formatarMoeda(valorTotal);
}

// ========================================
// SALVAR COMPRA
// ========================================

async function salvarCompra() {

    try {

        const marketId =
            document
                .getElementById("marketSelect")
                .value;

        const dataCompra =
            document
                .getElementById("dataCompra")
                .value;

        const observacoes =
            document
                .getElementById("observacoes")
                .value;

        if (!marketId) {

            alert(
                "Selecione um mercado antes de salvar."
            );

            return;
        }

        if (!dataCompra) {

            alert(
                "Informe a data da compra."
            );

            return;
        }

        const itensSelecionados = [];

        let quantidadeTotal = 0;
        let valorTotal = 0;

        document
            .querySelectorAll(".produto")
            .forEach(card => {

                const checkbox =
                    card.querySelector(
                        ".produto-check"
                    );

                if (
                    !checkbox ||
                    !checkbox.checked
                ) {

                    return;
                }

                const qtd =
                    Number(
                        card
                            .querySelector(".qtd")
                            .value || 0
                    );

                const valor =
                    Number(
                        card
                            .querySelector(".valor")
                            .value || 0
                    );

                if (
                    qtd <= 0 ||
                    valor <= 0
                ) {

                    return;
                }

                const subtotal =
                    qtd * valor;

                itensSelecionados.push({

                    product_id:
                        Number(
                            checkbox.dataset.id
                        ),

                    quantidade:
                        qtd,

                    valor_unitario:
                        valor,

                    subtotal:
                        subtotal
                });

                quantidadeTotal += qtd;
                valorTotal += subtotal;
            });

        if (!itensSelecionados.length) {

            alert(
                "Selecione ao menos um produto com quantidade e valor válidos."
            );

            return;
        }

        const {
            data: compra,
            error
        } = await supabaseClient
            .from("purchases")
            .insert({

                user_id:
                    usuarioAtual.id,

                market_id:
                    Number(marketId),

                data_compra:
                    dataCompra,

                observacoes:
                    observacoes,

                valor_total:
                    valorTotal,

                quantidade_total:
                    quantidadeTotal

            })
            .select()
            .single();

        if (error) {

            console.error(error);

            alert(
                "Erro ao salvar compra."
            );

            return;
        }

        const itensBanco =
            itensSelecionados.map(i => ({

                purchase_id:
                    compra.id,

                product_id:
                    i.product_id,

                quantidade:
                    i.quantidade,

                valor_unitario:
                    i.valor_unitario,

                subtotal:
                    i.subtotal
            }));

        const {
            error: errItens
        } = await supabaseClient
            .from("purchase_items")
            .insert(itensBanco);

        if (errItens) {

            console.error(errItens);

            alert(
                "Compra salva, mas houve erro ao salvar os itens."
            );

            return;
        }

        await atualizarHistoricoPrecos(
            itensSelecionados,
            Number(marketId)
        );

        await atualizarEstoqueDispensa(
            itensSelecionados
        );

        alert(
            "Compra salva com sucesso! Sua dispensa foi atualizada."
        );

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(
            "Erro inesperado ao salvar compra:",
            erro
        );

        alert(
            "Erro inesperado ao salvar a compra."
        );
    }
}

// ========================================
// ATUALIZAR HISTÓRICO DE PREÇOS
// ========================================

async function atualizarHistoricoPrecos(
    itensSelecionados,
    marketId
) {

    try {

        const precos =
            itensSelecionados.map(item => ({

                product_id:
                    item.product_id,

                market_id:
                    marketId,

                price:
                    item.valor_unitario

            }));

        if (!precos.length) return;

        const {
            error
        } = await supabaseClient
            .from("product_prices")
            .insert(precos);

        if (error) {

            console.error(
                "Erro ao atualizar histórico de preços:",
                error
            );
        }

    } catch (erro) {

        console.error(
            "Erro inesperado no histórico de preços:",
            erro
        );
    }
}

// ========================================
// ATUALIZAR ESTOQUE DA DISPENSA
// ========================================

async function atualizarEstoqueDispensa(
    itensSelecionados
) {

    try {

        for (
            const item of itensSelecionados
        ) {

            const {
                error
            } = await supabaseClient
                .rpc(
                    "add_item_to_pantry_stock",
                    {
                        p_user_id:
                            usuarioAtual.id,

                        p_product_id:
                            item.product_id,

                        p_quantidade:
                            item.quantidade
                    }
                );

            if (error) {

                console.error(
                    "Erro ao atualizar estoque:",
                    error
                );
            }
        }

    } catch (erro) {

        console.error(
            "Erro inesperado ao atualizar estoque:",
            erro
        );
    }
}

// ========================================
// HELPERS
// ========================================

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

// ========================================
// START
// ========================================

iniciar();