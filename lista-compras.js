// ========================================
// MINHA DISPENSA
// LISTA DE COMPRAS INTELIGENTE
// GERADA A PARTIR DO ESTOQUE
// ========================================

let usuarioAtual = null;
let listaCompras = [];
let listaFiltrada = [];

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

        await carregarListaCompras();

    } catch (erro) {

        console.error(
            "Erro ao iniciar lista de compras:",
            erro
        );

        alert(
            "Erro ao carregar lista de compras."
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

    listaFiltrada =
        listaCompras.filter(item => {

            const nome =
                (
                    item.produto_nome ||
                    ""
                ).toLowerCase();

            const filtroNome =
                !termo ||
                nome.includes(termo);

            const filtroStatus =
                !status ||
                item.status_estoque === status;

            return (
                filtroNome &&
                filtroStatus
            );
        });

    renderizarListaCompras();
}

// ========================================
// CARREGAR LISTA INTELIGENTE
// ========================================

async function carregarListaCompras() {

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
            .in(
                "status_estoque",
                [
                    "repor",
                    "sem_estoque"
                ]
            )
            .order(
                "produto_nome",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                "Erro ao carregar lista:",
                error
            );

            alert(
                "Erro ao carregar lista inteligente."
            );

            return;
        }

        listaCompras =
            prepararLista(
                data || []
            );

        listaFiltrada =
            [...listaCompras];

        atualizarResumo();

        renderizarListaCompras();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar lista:",
            erro
        );

        alert(
            "Erro inesperado ao carregar lista."
        );
    }
}

// ========================================
// PREPARAR LISTA
// ========================================

function prepararLista(
    itens
) {

    return itens.map(item => {

        const quantidadeAtual =
            Number(
                item.quantidade_atual || 0
            );

        const quantidadeMinima =
            Number(
                item.quantidade_minima || 0
            );

        const quantidadeSugerida =
            Math.max(
                quantidadeMinima -
                quantidadeAtual,
                1
            );

        const prioridade =
            item.status_estoque === "sem_estoque"
                ? "alta"
                : "normal";

        return {
            ...item,
            quantidade_sugerida:
                quantidadeSugerida,
            prioridade:
                prioridade
        };
    });
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const totalItens =
        listaCompras.length;

    const totalRepor =
        listaCompras.filter(
            item =>
                item.status_estoque === "repor"
        ).length;

    const totalSemEstoque =
        listaCompras.filter(
            item =>
                item.status_estoque === "sem_estoque"
        ).length;

    atualizarTexto(
        "totalItensLista",
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
// RENDERIZAR LISTA
// ========================================

function renderizarListaCompras() {

    const container =
        document.getElementById(
            "listaCompras"
        );

    if (!container) return;

    if (!listaFiltrada.length) {

        container.innerHTML = `

            <div class="lista-card empty-card">

                Nenhum item precisa ser reposto no momento.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    listaFiltrada.forEach(item => {

        const status =
            obterStatusVisual(
                item.status_estoque
            );

        const prioridadeTexto =
            item.prioridade === "alta"
                ? "Prioridade alta: item sem estoque."
                : "Prioridade normal: item abaixo do mínimo.";

        container.innerHTML += `

            <article class="lista-card">

                <div class="item-topo">

                    <div class="item-produto">

                        ${item.produto_nome || "Produto"}

                    </div>

                    <span class="item-status ${status.classe}">

                        ${status.texto}

                    </span>

                </div>

                <div class="item-info">

                    <div class="info-box">

                        <span>
                            Atual
                        </span>

                        <strong>
                            ${formatarQuantidade(item.quantidade_atual)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                    <div class="info-box">

                        <span>
                            Mínimo
                        </span>

                        <strong>
                            ${formatarQuantidade(item.quantidade_minima)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                    <div class="info-box">

                        <span>
                            Comprar
                        </span>

                        <strong>
                            ${formatarQuantidade(item.quantidade_sugerida)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                </div>

                <div class="item-prioridade ${item.prioridade === "alta" ? "alta" : ""}">

                    ${prioridadeTexto}

                </div>

                <div class="item-acoes">

                    <button
                        class="btn-comprado"
                        onclick="marcarComoComprado(${item.id})">

                        Marcar como comprado

                    </button>

                    <button
                        class="btn-remover"
                        onclick="removerSugestao(${item.id})">

                        Remover sugestão

                    </button>

                </div>

            </article>

        `;
    });
}

// ========================================
// MARCAR COMO COMPRADO
// ========================================

async function marcarComoComprado(
    stockId
) {

    const item =
        listaCompras.find(
            produto =>
                Number(produto.id) ===
                Number(stockId)
        );

    if (!item) {

        alert(
            "Item não encontrado."
        );

        return;
    }

    const quantidadePrompt =
        prompt(
            `Informe a quantidade comprada de "${item.produto_nome}":`,
            formatarQuantidade(
                item.quantidade_sugerida
            )
        );

    if (quantidadePrompt === null) {

        return;
    }

    const quantidadeComprada =
        Number(
            String(quantidadePrompt)
                .replace(",", ".")
        );

    if (
        isNaN(quantidadeComprada) ||
        quantidadeComprada <= 0
    ) {

        alert(
            "Informe uma quantidade válida."
        );

        return;
    }

    const novaQuantidade =
        Number(
            item.quantidade_atual || 0
        ) + quantidadeComprada;

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
                "Erro ao marcar como comprado:",
                error
            );

            alert(
                "Erro ao atualizar item."
            );

            return;
        }

        alert(
            "Item atualizado na dispensa."
        );

        await carregarListaCompras();

    } catch (erro) {

        console.error(
            "Erro inesperado ao marcar comprado:",
            erro
        );

        alert(
            "Erro inesperado ao atualizar item."
        );
    }
}

// ========================================
// REMOVER SUGESTÃO
// ========================================

async function removerSugestao(
    stockId
) {

    const item =
        listaCompras.find(
            produto =>
                Number(produto.id) ===
                Number(stockId)
        );

    if (!item) {

        alert(
            "Item não encontrado."
        );

        return;
    }

    const confirmar =
        confirm(
            `Remover "${item.produto_nome}" da lista de sugestão?\n\nIsso ajustará a quantidade mínima para a quantidade atual.`
        );

    if (!confirmar) {

        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("pantry_stock")
            .update({
                quantidade_minima:
                    Number(
                        item.quantidade_atual || 0
                    )
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
                "Erro ao remover sugestão:",
                error
            );

            alert(
                "Erro ao remover sugestão."
            );

            return;
        }

        alert(
            "Sugestão removida da lista."
        );

        await carregarListaCompras();

    } catch (erro) {

        console.error(
            "Erro inesperado ao remover sugestão:",
            erro
        );

        alert(
            "Erro inesperado ao remover sugestão."
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
            classe: "status-sem-estoque"
        };
    }

    return {
        texto: "Para repor",
        classe: "status-repor"
    };
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