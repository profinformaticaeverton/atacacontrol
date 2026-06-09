// ========================================
// ATACACONTROL
// NOVA COMPRA V2.0
// ========================================

let produtos = [];
let produtosFiltrados = [];
let usuarioAtual = null;

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

        await carregarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao iniciar:",
            erro
        );

        alert(
            "Erro ao carregar página."
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
                campoBusca.value
                .toLowerCase()
                .trim();

            produtosFiltrados =
                produtos.filter(produto =>
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

        const select =
            document.getElementById(
                "marketSelect"
            );

        select.innerHTML = "";

        data.forEach(market => {

            select.innerHTML += `
                <option value="${market.id}">
                    ${market.nome}
                </option>
            `;
        });

    } catch (erro) {

        console.error(
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

        produtosFiltrados =
            [...produtos];

        atualizarContador();

        renderizarProdutos();

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// CONTADOR
// ========================================

function atualizarContador() {

    document
        .getElementById(
            "contadorProdutos"
        )
        .innerText =
        `${produtosFiltrados.length} produtos`;
}

// ========================================
// RENDERIZAR PRODUTOS
// ========================================

function renderizarProdutos() {

    atualizarContador();

    const lista =
        document.getElementById(
            "listaProdutos"
        );

    lista.innerHTML = "";

    if (
        produtosFiltrados.length === 0
    ) {

        lista.innerHTML = `
            <p>
                Nenhum produto encontrado.
            </p>
        `;

        return;
    }

    produtosFiltrados.forEach(produto => {

        lista.innerHTML += `

        <div
            class="produto"
            data-id="${produto.id}">

            <div class="produto-topo">

                <input
                    type="checkbox"
                    class="produto-check"
                    data-id="${produto.id}">

                <div class="produto-nome">

                    ${produto.nome}

                </div>

            </div>

            <div class="produto-campos">

                <div>

                    <label>
                        Quantidade
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="qtd">

                </div>

                <div>

                    <label>
                        Valor Unitário
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="valor">

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

        </div>

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

            checkbox.addEventListener(
                "change",
                () => {

                    if (
                        checkbox.checked
                    ) {

                        card.classList.add(
                            "selecionado"
                        );

                    } else {

                        card.classList.remove(
                            "selecionado"
                        );
                    }

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

            const subtotal =
                qtd * valor;

            card
                .querySelector(
                    ".subtotal"
                )
                .innerText =
                subtotal.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL"
                    }
                );

            if (
                checkbox.checked
            ) {

                quantidadeTotal += qtd;

                valorTotal += subtotal;
            }
        });

    document
        .getElementById(
            "qtdTotal"
        )
        .innerText =
        quantidadeTotal;

    document
        .getElementById(
            "valorTotal"
        )
        .innerText =
        valorTotal.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}

// ========================================
// SALVAR COMPRA
// ========================================

async function salvarCompra() {

    try {

        const marketId =
            document
            .getElementById(
                "marketSelect"
            )
            .value;

        const dataCompra =
            document
            .getElementById(
                "dataCompra"
            )
            .value;

        const observacoes =
            document
            .getElementById(
                "observacoes"
            )
            .value;

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

        if (
            itensSelecionados.length === 0
        ) {

            alert(
                "Selecione ao menos um produto válido."
            );

            return;
        }

        // =====================
        // PURCHASE
        // =====================

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

                observacoes:
                    observacoes,

                valor_total:
                    valorTotal,

                quantidade_total:
                    quantidadeTotal

            })
            .select()
            .single();

        if (compraError) {

            console.error(
                compraError
            );

            alert(
                "Erro ao salvar compra."
            );

            return;
        }

        // =====================
        // PURCHASE ITEMS
        // =====================

        const itensBanco =
            itensSelecionados.map(
                item => ({

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
            .insert(itensBanco);

        if (itensError) {

            console.error(
                itensError
            );

            alert(
                "Compra salva, mas houve erro ao gravar itens."
            );

            return;
        }

        alert(
            "Compra cadastrada com sucesso!"
        );

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Erro inesperado ao salvar compra."
        );
    }
}

// ========================================
// START
// ========================================

iniciar();