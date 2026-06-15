// ========================================
// MINHA DISPENSA
// HISTÓRICO INTELIGENTE DE COMPRAS
// COMPRAS + DETALHES + RECÁLCULO DE ESTOQUE
// ========================================

let compras = [];
let comprasFiltradas = [];
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

        configurarFiltros();

        await carregarCompras();

    } catch (erro) {

        console.error(
            "Erro ao iniciar histórico:",
            erro
        );

        alert(
            "Erro ao carregar histórico."
        );
    }
}

// ========================================
// FILTROS
// ========================================

function configurarFiltros() {

    const busca =
        document.getElementById("buscaMercado");

    const dataInicial =
        document.getElementById("dataInicial");

    const dataFinal =
        document.getElementById("dataFinal");

    if (busca) {

        busca.addEventListener(
            "input",
            filtrarCompras
        );
    }

    if (dataInicial) {

        dataInicial.addEventListener(
            "change",
            filtrarCompras
        );
    }

    if (dataFinal) {

        dataFinal.addEventListener(
            "change",
            filtrarCompras
        );
    }
}

// ========================================
// CARREGAR COMPRAS
// ========================================

async function carregarCompras() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("purchases")
            .select(`
                *,
                markets (
                    id,
                    nome
                )
            `)
            .eq(
                "user_id",
                usuarioAtual.id
            )
            .order(
                "data_compra",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(error);

            alert(
                "Erro ao carregar compras."
            );

            return;
        }

        compras = data || [];
        comprasFiltradas = [...compras];

        atualizarResumo();
        renderizarCompras();

    } catch (erro) {

        console.error(
            "Erro ao carregar compras:",
            erro
        );
    }
}

// ========================================
// FILTRAR COMPRAS
// ========================================

function filtrarCompras() {

    const mercado =
        document
            .getElementById("buscaMercado")
            .value
            .toLowerCase()
            .trim();

    const dataInicial =
        document
            .getElementById("dataInicial")
            .value;

    const dataFinal =
        document
            .getElementById("dataFinal")
            .value;

    comprasFiltradas =
        compras.filter(compra => {

            const nomeMercado =
                (
                    compra.markets?.nome ||
                    ""
                ).toLowerCase();

            const filtroMercado =
                !mercado ||
                nomeMercado.includes(
                    mercado
                );

            const filtroDataInicial =
                !dataInicial ||
                compra.data_compra >=
                dataInicial;

            const filtroDataFinal =
                !dataFinal ||
                compra.data_compra <=
                dataFinal;

            return (
                filtroMercado &&
                filtroDataInicial &&
                filtroDataFinal
            );
        });

    atualizarResumo();
    renderizarCompras();
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const totalCompras =
        comprasFiltradas.length;

    const valorTotal =
        comprasFiltradas.reduce(
            (total, compra) =>
                total +
                Number(
                    compra.valor_total || 0
                ),
            0
        );

    atualizarTexto(
        "totalCompras",
        totalCompras
    );

    atualizarTexto(
        "valorCompras",
        formatarMoeda(valorTotal)
    );
}

// ========================================
// RENDERIZAR COMPRAS
// ========================================

function renderizarCompras() {

    const container =
        document.getElementById(
            "listaCompras"
        );

    if (!container) return;

    if (!comprasFiltradas.length) {

        container.innerHTML = `

            <article class="compra-card">

                <div class="compra-mercado">

                    Nenhuma compra encontrada.

                </div>

            </article>

        `;

        return;
    }

    container.innerHTML = "";

    comprasFiltradas.forEach(compra => {

        container.innerHTML += `

            <article class="compra-card">

                <div class="compra-topo">

                    <div>

                        <div class="compra-data">

                            📅 ${formatarData(
                                compra.data_compra
                            )}

                        </div>

                        <div class="compra-mercado">

                            ${compra.markets?.nome || "Mercado não informado"}

                        </div>

                    </div>

                    <div class="compra-total">

                        ${formatarMoeda(
                            compra.valor_total
                        )}

                    </div>

                </div>

                <div class="compra-info">

                    <div class="info-item">

                        <span>
                            Itens
                        </span>

                        <strong>
                            ${formatarQuantidade(
                                compra.quantidade_total || 0
                            )}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Média por item
                        </span>

                        <strong>
                            ${calcularMediaPorItem(compra)}
                        </strong>

                    </div>

                </div>

                <div class="compra-acoes">

                    <button
                        class="btn-detalhes"
                        onclick="abrirDetalhes(${compra.id})">

                        Ver detalhes

                    </button>

                    <button
                        class="btn-excluir"
                        onclick="excluirCompra(${compra.id})">

                        Excluir

                    </button>

                </div>

            </article>

        `;
    });
}

// ========================================
// ABRIR DETALHES
// ========================================

async function abrirDetalhes(
    purchaseId
) {

    try {

        const modal =
            document.getElementById(
                "modalDetalhes"
            );

        const container =
            document.getElementById(
                "detalhesCompra"
            );

        if (!modal || !container) return;

        container.innerHTML =
            "Carregando detalhes...";

        modal.classList.add(
            "ativo"
        );

        const {
            data,
            error
        } = await supabaseClient
            .from("purchase_items")
            .select(`
                *,
                products (
                    nome
                )
            `)
            .eq(
                "purchase_id",
                purchaseId
            );

        if (error) {

            console.error(error);

            container.innerHTML =
                "Erro ao carregar detalhes da compra.";

            return;
        }

        const itens =
            data || [];

        if (!itens.length) {

            container.innerHTML = `

                <div class="detalhe-card">

                    Nenhum item encontrado nesta compra.

                </div>

            `;

            return;
        }

        const total =
            itens.reduce(
                (soma, item) =>
                    soma +
                    Number(item.subtotal || 0),
                0
            );

        const quantidade =
            itens.reduce(
                (soma, item) =>
                    soma +
                    Number(item.quantidade || 0),
                0
            );

        container.innerHTML = `

            <div class="detalhes-grid">

                <div class="detalhe-card">

                    <small>
                        Total da compra
                    </small>

                    <strong>
                        ${formatarMoeda(total)}
                    </strong>

                </div>

                <div class="detalhe-card">

                    <small>
                        Produtos registrados
                    </small>

                    <strong>
                        ${itens.length}
                    </strong>

                </div>

                <div class="detalhe-card">

                    <small>
                        Quantidade total
                    </small>

                    <strong>
                        ${formatarQuantidade(quantidade)}
                    </strong>

                </div>

            </div>

            <div class="produtos-lista">

                ${itens.map(item => `

                    <div class="produto-item">

                        <strong>
                            ${item.products?.nome || "Produto"}
                        </strong>

                        <br>

                        Quantidade:
                        ${formatarQuantidade(item.quantidade)}

                        <br>

                        Valor unitário:
                        ${formatarMoeda(item.valor_unitario)}

                        <br>

                        Subtotal:
                        ${formatarMoeda(item.subtotal)}

                    </div>

                `).join("")}

            </div>

        `;

    } catch (erro) {

        console.error(
            "Erro ao abrir detalhes:",
            erro
        );

        const container =
            document.getElementById(
                "detalhesCompra"
            );

        if (container) {

            container.innerHTML =
                "Erro inesperado ao carregar detalhes.";
        }
    }
}

// ========================================
// FECHAR MODAL
// ========================================

function fecharModal() {

    const modal =
        document.getElementById(
            "modalDetalhes"
        );

    if (modal) {

        modal.classList.remove(
            "ativo"
        );
    }
}

// ========================================
// EXCLUIR COMPRA
// ========================================

async function excluirCompra(
    purchaseId
) {

    const confirmar =
        confirm(
            "Deseja realmente excluir esta compra? O estoque da dispensa será recalculado automaticamente."
        );

    if (!confirmar) return;

    try {

        const {
            error
        } = await supabaseClient
            .rpc(
                "delete_purchase_and_rebuild_stock",
                {
                    p_purchase_id:
                        purchaseId,

                    p_user_id:
                        usuarioAtual.id
                }
            );

        if (error) {

            console.error(
                "Erro ao excluir compra:",
                error
            );

            alert(
                "Erro ao excluir compra."
            );

            return;
        }

        compras =
            compras.filter(
                compra =>
                    Number(compra.id) !==
                    Number(purchaseId)
            );

        filtrarCompras();

        alert(
            "Compra excluída com sucesso. A dispensa foi recalculada."
        );

    } catch (erro) {

        console.error(
            "Erro inesperado ao excluir compra:",
            erro
        );

        alert(
            "Erro inesperado ao excluir compra."
        );
    }
}

// ========================================
// HELPERS
// ========================================

function calcularMediaPorItem(
    compra
) {

    const total =
        Number(compra.valor_total || 0);

    const quantidade =
        Number(compra.quantidade_total || 0);

    if (!quantidade) {

        return "R$ 0,00";
    }

    return formatarMoeda(
        total / quantidade
    );
}

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

function formatarData(data) {

    if (!data) {

        return "-";
    }

    return new Date(data)
        .toLocaleDateString(
            "pt-BR"
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
// FECHAR MODAL AO CLICAR FORA
// ========================================

window.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "modalDetalhes"
            );

        if (
            modal &&
            event.target === modal
        ) {

            fecharModal();
        }
    }
);

// ========================================
// START
// ========================================

iniciar();