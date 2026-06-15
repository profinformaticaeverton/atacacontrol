// ========================================
// MINHA DISPENSA
// DISPENSA INTELIGENTE
// ESTOQUE + CONSUMO + AJUSTE + REPOSIÇÃO
// ========================================

let usuarioAtual = null;
let estoque = [];
let estoqueFiltrado = [];

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

        configurarFiltros();

        await carregarDispensa();

    } catch (erro) {

        console.error(
            "Erro ao iniciar dispensa:",
            erro
        );

        alert(
            "Erro ao carregar a dispensa."
        );
    }
}

// ========================================
// FILTROS
// ========================================

function configurarFiltros() {

    const buscaProduto =
        document.getElementById(
            "buscaProduto"
        );

    const filtroStatus =
        document.getElementById(
            "filtroStatus"
        );

    buscaProduto.addEventListener(
        "input",
        aplicarFiltros
    );

    filtroStatus.addEventListener(
        "change",
        aplicarFiltros
    );
}

function aplicarFiltros() {

    const termo =
        document
            .getElementById("buscaProduto")
            .value
            .toLowerCase()
            .trim();

    const status =
        document
            .getElementById("filtroStatus")
            .value;

    estoqueFiltrado =
        estoque.filter(item => {

            const nomeProduto =
                (
                    item.produto_nome ||
                    ""
                )
                .toLowerCase();

            const filtroNome =
                !termo ||
                nomeProduto.includes(termo);

            const filtroStatus =
                !status ||
                item.status_estoque === status;

            return filtroNome && filtroStatus;
        });

    renderizarDispensa();
}

// ========================================
// CARREGAR DISPENSA
// ========================================

async function carregarDispensa() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("v_pantry_stock")
            .select("*")
            .eq(
                "user_id",
                usuarioAtual.id
            )
            .eq(
                "ativo",
                true
            )
            .order(
                "produto_nome",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                "Erro ao carregar estoque:",
                error
            );

            alert(
                "Erro ao carregar estoque da dispensa."
            );

            return;
        }

        estoque = data || [];
        estoqueFiltrado = [...estoque];

        atualizarResumo();
        renderizarDispensa();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar dispensa:",
            erro
        );
    }
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const totalItens =
        estoque.length;

    const totalRepor =
        estoque.filter(
            item =>
                item.status_estoque === "repor"
        ).length;

    const totalSemEstoque =
        estoque.filter(
            item =>
                item.status_estoque === "sem_estoque"
        ).length;

    atualizarTexto(
        "totalItens",
        totalItens
    );

    atualizarTexto(
        "totalRepor",
        totalRepor
    );

    atualizarTexto(
        "totalSemEstoque",
        totalSemEstoque
    );
}

// ========================================
// RENDERIZAR DISPENSA
// ========================================

function renderizarDispensa() {

    const container =
        document.getElementById(
            "listaDispensa"
        );

    if (!container) return;

    if (!estoqueFiltrado.length) {

        container.innerHTML = `

            <div class="dispensa-card empty-card">

                Nenhum item encontrado.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    estoqueFiltrado.forEach(item => {

        const status =
            obterStatusVisual(
                item.status_estoque
            );

        const percentual =
            calcularPercentualEstoque(
                item.quantidade_atual,
                item.quantidade_minima
            );

        container.innerHTML += `

            <article class="dispensa-card">

                <div class="dispensa-topo">

                    <div class="dispensa-produto">

                        ${item.produto_nome || "Produto"}

                    </div>

                    <span class="dispensa-status ${status.classe}">

                        ${status.texto}

                    </span>

                </div>

                <div class="dispensa-info">

                    <div class="info-item">

                        <span>
                            Quantidade atual
                        </span>

                        <strong>
                            ${formatarQuantidade(item.quantidade_atual)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Mínimo desejado
                        </span>

                        <strong>
                            ${formatarQuantidade(item.quantidade_minima)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                </div>

                <div class="estoque-container">

                    <div class="estoque-label">

                        <span>
                            Nível da dispensa
                        </span>

                        <strong>
                            ${percentual}%
                        </strong>

                    </div>

                    <div class="estoque-barra">

                        <div
                            class="estoque-progresso ${status.barra}"
                            style="width:${percentual}%">

                        </div>

                    </div>

                </div>

                <div class="dispensa-acoes">

                    <button
                        class="btn-consumir"
                        onclick="consumirProduto(${item.id})">

                        Consumir

                    </button>

                    <button
                        class="btn-ajustar"
                        onclick="ajustarProduto(${item.id})">

                        Ajustar estoque

                    </button>

                </div>

            </article>

        `;
    });
}

// ========================================
// CONSUMIR PRODUTO
// ========================================

async function consumirProduto(
    stockId
) {

    const item =
        estoque.find(
            produto =>
                Number(produto.id) ===
                Number(stockId)
        );

    if (!item) {

        alert(
            "Produto não encontrado."
        );

        return;
    }

    const quantidade =
        prompt(
            `Quanto deseja consumir de "${item.produto_nome}"?\nQuantidade atual: ${formatarQuantidade(item.quantidade_atual)} ${item.unidade || "un"}`
        );

    if (quantidade === null) {

        return;
    }

    const quantidadeConsumida =
        Number(
            String(quantidade)
                .replace(",", ".")
        );

    if (
        !quantidadeConsumida ||
        quantidadeConsumida <= 0
    ) {

        alert(
            "Informe uma quantidade válida."
        );

        return;
    }

    const novaQuantidade =
        Math.max(
            Number(item.quantidade_atual || 0) -
            quantidadeConsumida,
            0
        );

    await atualizarQuantidadeEstoque(
        stockId,
        novaQuantidade,
        "Produto consumido e estoque atualizado."
    );
}

// ========================================
// AJUSTAR PRODUTO
// ========================================

async function ajustarProduto(
    stockId
) {

    const item =
        estoque.find(
            produto =>
                Number(produto.id) ===
                Number(stockId)
        );

    if (!item) {

        alert(
            "Produto não encontrado."
        );

        return;
    }

    const novaQuantidadePrompt =
        prompt(
            `Informe a nova quantidade atual de "${item.produto_nome}":`,
            formatarQuantidade(item.quantidade_atual)
        );

    if (novaQuantidadePrompt === null) {

        return;
    }

    const novaQuantidade =
        Number(
            String(novaQuantidadePrompt)
                .replace(",", ".")
        );

    if (
        isNaN(novaQuantidade) ||
        novaQuantidade < 0
    ) {

        alert(
            "Informe uma quantidade válida."
        );

        return;
    }

    const novaMinimaPrompt =
        prompt(
            `Informe a quantidade mínima desejada para "${item.produto_nome}":`,
            formatarQuantidade(item.quantidade_minima)
        );

    if (novaMinimaPrompt === null) {

        return;
    }

    const novaMinima =
        Number(
            String(novaMinimaPrompt)
                .replace(",", ".")
        );

    if (
        isNaN(novaMinima) ||
        novaMinima < 0
    ) {

        alert(
            "Informe uma quantidade mínima válida."
        );

        return;
    }

    await atualizarEstoqueCompleto(
        stockId,
        novaQuantidade,
        novaMinima,
        "Estoque ajustado com sucesso."
    );
}

// ========================================
// ATUALIZAR SOMENTE QUANTIDADE
// ========================================

async function atualizarQuantidadeEstoque(
    stockId,
    novaQuantidade,
    mensagemSucesso
) {

    try {

        const {
            error
        } = await supabaseClient
            .from("pantry_stock")
            .update({
                quantidade_atual:
                    novaQuantidade
            })
            .eq(
                "id",
                stockId
            )
            .eq(
                "user_id",
                usuarioAtual.id
            );

        if (error) {

            console.error(
                "Erro ao atualizar quantidade:",
                error
            );

            alert(
                "Erro ao atualizar estoque."
            );

            return;
        }

        alert(
            mensagemSucesso
        );

        await carregarDispensa();

    } catch (erro) {

        console.error(
            "Erro inesperado ao atualizar quantidade:",
            erro
        );

        alert(
            "Erro inesperado ao atualizar estoque."
        );
    }
}

// ========================================
// ATUALIZAR QUANTIDADE + MÍNIMO
// ========================================

async function atualizarEstoqueCompleto(
    stockId,
    novaQuantidade,
    novaMinima,
    mensagemSucesso
) {

    try {

        const {
            error
        } = await supabaseClient
            .from("pantry_stock")
            .update({
                quantidade_atual:
                    novaQuantidade,

                quantidade_minima:
                    novaMinima
            })
            .eq(
                "id",
                stockId
            )
            .eq(
                "user_id",
                usuarioAtual.id
            );

        if (error) {

            console.error(
                "Erro ao ajustar estoque:",
                error
            );

            alert(
                "Erro ao ajustar estoque."
            );

            return;
        }

        alert(
            mensagemSucesso
        );

        await carregarDispensa();

    } catch (erro) {

        console.error(
            "Erro inesperado ao ajustar estoque:",
            erro
        );

        alert(
            "Erro inesperado ao ajustar estoque."
        );
    }
}

// ========================================
// STATUS VISUAL
// ========================================

function obterStatusVisual(
    status
) {

    if (status === "sem_estoque") {

        return {
            texto: "Sem estoque",
            classe: "status-sem-estoque",
            barra: "estoque-zero"
        };
    }

    if (status === "repor") {

        return {
            texto: "Para repor",
            classe: "status-repor",
            barra: "estoque-repor"
        };
    }

    return {
        texto: "OK",
        classe: "status-ok",
        barra: "estoque-ok"
    };
}

// ========================================
// PERCENTUAL DE ESTOQUE
// ========================================

function calcularPercentualEstoque(
    quantidadeAtual,
    quantidadeMinima
) {

    const atual =
        Number(quantidadeAtual || 0);

    const minimo =
        Number(quantidadeMinima || 1);

    if (atual <= 0) {

        return 0;
    }

    const referencia =
        minimo * 2;

    const percentual =
        Math.round(
            (atual / referencia) * 100
        );

    return Math.min(
        percentual,
        100
    );
}

// ========================================
// HELPERS
// ========================================

function atualizarTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.innerText =
            valor;
    }
}

function formatarQuantidade(
    valor
) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
}

// ========================================
// START
// ========================================

iniciar();