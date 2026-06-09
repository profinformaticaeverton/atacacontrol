// ========================================
// ATACACONTROL - NOVA COMPRA
// ========================================

let produtos = [];
let usuarioAtual = null;

// ========================================
// INICIAR PÁGINA
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

        await carregarMercados();

        await carregarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao iniciar página:",
            erro
        );

        alert(
            "Erro ao carregar a página."
        );
    }
}

// ========================================
// CARREGAR MERCADOS
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

        if (!data || data.length === 0) {

            select.innerHTML = `
                <option value="">
                    Nenhum mercado cadastrado
                </option>
            `;

            return;
        }

        data.forEach(market => {

            select.innerHTML += `
                <option value="${market.id}">
                    ${market.nome}
                </option>
            `;
        });

    } catch (erro) {

        console.error(
            "Erro mercados:",
            erro
        );
    }
}

// ========================================
// CARREGAR PRODUTOS
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

        console.log(
            "Produtos carregados:",
            produtos
        );

        const lista =
            document.getElementById(
                "listaProdutos"
            );

        lista.innerHTML = "";

        if (produtos.length === 0) {

            lista.innerHTML = `
                <p>
                    Nenhum produto cadastrado.
                </p>
            `;

            return;
        }

        produtos.forEach(produto => {

            lista.innerHTML += `

            <div class="produto">

                <label>

                    <input
                        type="checkbox"
                        class="checkProduto"
                        data-id="${produto.id}">

                    ${produto.nome}

                </label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Qtd"
                    class="qtd">

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valor Unit.">

                <input
                    type="number"
                    readonly
                    placeholder="Subtotal">

            </div>

            `;
        });

        adicionarEventos();

    } catch (erro) {

        console.error(
            "Erro produtos:",
            erro
        );
    }
}

// ========================================
// EVENTOS DOS PRODUTOS
// ========================================

function adicionarEventos() {

    document
        .querySelectorAll(".produto")
        .forEach(produto => {

            const qtd =
                produto.querySelectorAll("input")[1];

            const valor =
                produto.querySelectorAll("input")[2];

            const subtotal =
                produto.querySelectorAll("input")[3];

            qtd.addEventListener(
                "input",
                atualizarLinha
            );

            valor.addEventListener(
                "input",
                atualizarLinha
            );

            function atualizarLinha() {

                const quantidade =
                    Number(qtd.value || 0);

                const valorUnitario =
                    Number(valor.value || 0);

                const total =
                    quantidade * valorUnitario;

                subtotal.value =
                    total.toFixed(2);

                atualizarResumo();
            }
        });
}

// ========================================
// RESUMO DA COMPRA
// ========================================

function atualizarResumo() {

    let qtdTotal = 0;
    let valorTotal = 0;

    document
        .querySelectorAll(".produto")
        .forEach(produto => {

            const qtd =
                Number(
                    produto
                    .querySelectorAll("input")[1]
                    .value || 0
                );

            const subtotal =
                Number(
                    produto
                    .querySelectorAll("input")[3]
                    .value || 0
                );

            qtdTotal += qtd;
            valorTotal += subtotal;
        });

    document
        .getElementById("qtdTotal")
        .innerText =
        qtdTotal;

    document
        .getElementById("valorTotal")
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
            document.getElementById(
                "marketSelect"
            ).value;

        const dataCompra =
            document.getElementById(
                "dataCompra"
            ).value;

        const observacoes =
            document.getElementById(
                "observacoes"
            ).value;

        const itensSelecionados = [];

        let quantidadeTotal = 0;
        let valorTotal = 0;

        document
            .querySelectorAll(".produto")
            .forEach(produto => {

                const checkbox =
                    produto.querySelectorAll("input")[0];

                const qtd =
                    Number(
                        produto
                        .querySelectorAll("input")[1]
                        .value || 0
                    );

                const valor =
                    Number(
                        produto
                        .querySelectorAll("input")[2]
                        .value || 0
                    );

                const subtotal =
                    qtd * valor;

                if (
                    checkbox.checked &&
                    qtd > 0 &&
                    valor > 0
                ) {

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
                }
            });

        if (itensSelecionados.length === 0) {

            alert(
                "Selecione ao menos um produto."
            );

            return;
        }

        // ==========================
        // INSERE COMPRA
        // ==========================

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

        // ==========================
        // INSERE ITENS
        // ==========================

        const itensBanco =
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
            .insert(itensBanco);

        if (itensError) {

            console.error(
                itensError
            );

            alert(
                "Compra salva, mas houve erro ao gravar os itens."
            );

            return;
        }

        alert(
            "Compra registrada com sucesso!"
        );

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(
            "Erro inesperado:",
            erro
        );

        alert(
            "Erro inesperado ao salvar compra."
        );
    }
}

// ========================================
// INICIAR SISTEMA
// ========================================

iniciar();