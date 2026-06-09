// ========================================
// ATACACONTROL
// HISTÓRICO DE COMPRAS
// ========================================

let usuarioAtual = null;
let compras = [];

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

        await carregarCompras();

    } catch (erro) {

        console.error(
            "Erro ao iniciar:",
            erro
        );

        alert(
            "Erro ao carregar histórico."
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

        atualizarResumo();

        renderizarCompras(
            compras
        );

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const totalCompras =
        compras.length;

    const valorTotal =
        compras.reduce(
            (total, compra) =>
                total +
                Number(
                    compra.valor_total || 0
                ),
            0
        );

    document
        .getElementById(
            "totalCompras"
        )
        .innerText =
        totalCompras;

    document
        .getElementById(
            "valorCompras"
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
// RENDERIZAR COMPRAS
// ========================================

function renderizarCompras(lista) {

    const container =
        document.getElementById(
            "listaCompras"
        );

    container.innerHTML = "";

    if (lista.length === 0) {

        container.innerHTML = `
            <div class="card">
                Nenhuma compra encontrada.
            </div>
        `;

        return;
    }

    lista.forEach(compra => {

        const data =
            new Date(
                compra.data_compra
            );

        const dataFormatada =
            data.toLocaleDateString(
                "pt-BR"
            );

        const mercado =
            compra.markets?.nome
            || "Mercado";

        container.innerHTML += `

        <div class="compra-card">

            <div class="compra-data">

                📅 ${dataFormatada}

            </div>

            <div class="compra-info">

                <div>

                    🏪 ${mercado}

                </div>

                <div>

                    🛒 ${compra.quantidade_total} itens

                </div>

            </div>

            <div class="compra-total">

                ${Number(
                    compra.valor_total
                ).toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL"
                    }
                )}

            </div>

            <div class="compra-acoes">

                <button
                    class="btn-detalhes"
                    onclick="abrirDetalhes(${compra.id})">

                    Ver Detalhes

                </button>

                <button
                    class="btn-excluir"
                    onclick="excluirCompra(${compra.id})">

                    Excluir

                </button>

            </div>

        </div>

        `;
    });
}

// ========================================
// FILTRAR
// ========================================

function filtrarCompras() {

    const mercadoBusca =
        document
        .getElementById(
            "buscaMercado"
        )
        .value
        .toLowerCase();

    const dataInicial =
        document
        .getElementById(
            "dataInicial"
        )
        .value;

    const dataFinal =
        document
        .getElementById(
            "dataFinal"
        )
        .value;

    let resultado =
        [...compras];

    if (mercadoBusca) {

        resultado =
            resultado.filter(
                compra =>
                    compra.markets?.nome
                    ?.toLowerCase()
                    .includes(
                        mercadoBusca
                    )
            );
    }

    if (dataInicial) {

        resultado =
            resultado.filter(
                compra =>
                    compra.data_compra >=
                    dataInicial
            );
    }

    if (dataFinal) {

        resultado =
            resultado.filter(
                compra =>
                    compra.data_compra <=
                    dataFinal
            );
    }

    renderizarCompras(
        resultado
    );
}

// ========================================
// ABRIR DETALHES
// ========================================

async function abrirDetalhes(
    purchaseId
) {

    try {

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

            console.error(
                error
            );

            alert(
                "Erro ao carregar detalhes."
            );

            return;
        }

        const container =
            document.getElementById(
                "detalhesCompra"
            );

        container.innerHTML = "";

        let total = 0;

        data.forEach(item => {

            total += Number(
                item.subtotal || 0
            );

            container.innerHTML += `

            <div class="item-detalhe">

                <div class="item-nome">

                    ${item.products?.nome || "Produto"}

                </div>

                <div class="item-info">

                    Quantidade:
                    ${item.quantidade}

                </div>

                <div class="item-info">

                    Valor Unitário:
                    ${Number(
                        item.valor_unitario
                    ).toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL"
                        }
                    )}

                </div>

                <div class="item-info">

                    Subtotal:
                    ${Number(
                        item.subtotal
                    ).toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL"
                        }
                    )}

                </div>

            </div>

            `;
        });

        container.innerHTML += `

        <div class="total-modal">

            Total:
            ${total.toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            )}

        </div>

        `;

        document
            .getElementById(
                "modalDetalhes"
            )
            .classList.add(
                "ativo"
            );

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// FECHAR MODAL
// ========================================

function fecharModal() {

    document
        .getElementById(
            "modalDetalhes"
        )
        .classList.remove(
            "ativo"
        );
}

// ========================================
// EXCLUIR COMPRA
// ========================================

async function excluirCompra(
    purchaseId
) {

    const confirmar =
        confirm(
            "Deseja realmente excluir esta compra?"
        );

    if (!confirmar) {

        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("purchases")
            .delete()
            .eq(
                "id",
                purchaseId
            );

        if (error) {

            console.error(
                error
            );

            alert(
                "Erro ao excluir compra."
            );

            return;
        }

        alert(
            "Compra excluída com sucesso!"
        );

        await carregarCompras();

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// FECHAR MODAL CLICANDO FORA
// ========================================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "modalDetalhes"
            );

        if (
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
