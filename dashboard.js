// ========================================
// MINHA DISPENSA
// DASHBOARD
// COMPRAS + ESTOQUE + PLANEJAMENTO + ECONOMIA
// ========================================

async function verificarSessao() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = "/";
            return;
        }

        const user = session.user;

        const userEmail =
            document.getElementById("userEmail");

        if (userEmail) {
            userEmail.innerText = user.email;
        }

        await verificarPerfil(user);
        await carregarDashboard(user);
        await carregarDispensa(user);
        await carregarPlanejamentoDashboard(user);
        await carregarEconomiaDashboard(user);

        iniciarMenuMobile();

    } catch (erro) {

        console.error(
            "Erro ao verificar sessão:",
            erro
        );

        window.location.href = "/";
    }
}

// ========================================
// PERFIL
// ========================================

async function verificarPerfil(user) {

    try {

        const {
            data: profile
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile) {

            const {
                error
            } = await supabaseClient
                .from("profiles")
                .insert({
                    id: user.id,
                    email: user.email,
                    role: "user"
                });

            if (error) {
                console.error(
                    "Erro ao criar perfil:",
                    error
                );
            }
        }

    } catch (erro) {
        console.error(erro);
    }
}

// ========================================
// CARREGAR COMPRAS
// ========================================

async function carregarDashboard(user) {

    try {

        const hoje = new Date();

        const primeiroDiaMes =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            );

        const dataInicio =
            primeiroDiaMes
                .toISOString()
                .split("T")[0];

        const {
            data: compras,
            error
        } = await supabaseClient
            .from("purchases")
            .select(`
                *,
                markets (
                    nome
                )
            `)
            .eq("user_id", user.id)
            .order("data_compra", {
                ascending: false
            });

        if (error) {

            console.error(error);
            renderizarUltimasCompras([]);
            return;
        }

        const listaCompras =
            compras || [];

        const comprasMes =
            listaCompras.filter(
                compra =>
                    compra.data_compra >= dataInicio
            );

        const totalMes =
            comprasMes.reduce(
                (total, compra) =>
                    total +
                    Number(compra.valor_total || 0),
                0
            );

        const qtdCompras =
            listaCompras.length;

        let maiorCompra = 0;

        listaCompras.forEach(compra => {

            const valor =
                Number(compra.valor_total || 0);

            if (valor > maiorCompra) {
                maiorCompra = valor;
            }
        });

        const {
            data: itens,
            error: itensError
        } = await supabaseClient
            .from("purchase_items")
            .select(`
                quantidade,
                purchases!inner (
                    user_id
                )
            `)
            .eq("purchases.user_id", user.id);

        if (itensError) {
            console.error(itensError);
        }

        const qtdProdutos =
            itens
                ? itens.reduce(
                    (total, item) =>
                        total +
                        Number(item.quantidade || 0),
                    0
                )
                : 0;

        atualizarCard(
            "totalMes",
            formatarMoeda(totalMes)
        );

        atualizarCard(
            "qtdCompras",
            qtdCompras
        );

        atualizarCard(
            "qtdProdutos",
            formatarQuantidade(qtdProdutos)
        );

        atualizarCard(
            "maiorCompra",
            formatarMoeda(maiorCompra)
        );

        renderizarUltimasCompras(
            listaCompras.slice(0, 10)
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar dashboard:",
            erro
        );

        renderizarUltimasCompras([]);
    }
}

// ========================================
// CARREGAR DISPENSA
// ========================================

async function carregarDispensa(user) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("v_pantry_stock")
            .select("*")
            .eq("user_id", user.id)
            .eq("ativo", true)
            .order("produto_nome", {
                ascending: true
            });

        if (error) {

            console.error(
                "Erro ao carregar dispensa:",
                error
            );

            atualizarResumoDispensa([]);
            renderizarDispensa([]);
            return;
        }

        const estoque =
            data || [];

        atualizarResumoDispensa(estoque);
        renderizarDispensa(estoque);

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar dispensa:",
            erro
        );

        atualizarResumoDispensa([]);
        renderizarDispensa([]);
    }
}

// ========================================
// RESUMO DA DISPENSA
// ========================================

function atualizarResumoDispensa(estoque) {

    const itensDispensa =
        estoque.length;

    const itensRepor =
        estoque.filter(
            item =>
                item.status_estoque === "repor"
        ).length;

    const itensSemEstoque =
        estoque.filter(
            item =>
                item.status_estoque === "sem_estoque"
        ).length;

    const itensEstoqueOk =
        estoque.filter(
            item =>
                item.status_estoque === "ok"
        ).length;

    atualizarCard(
        "itensDispensa",
        itensDispensa
    );

    atualizarCard(
        "itensRepor",
        itensRepor
    );

    atualizarCard(
        "itensSemEstoque",
        itensSemEstoque
    );

    atualizarCard(
        "itensEstoqueOk",
        itensEstoqueOk
    );
}

// ========================================
// PLANEJAMENTO NO DASHBOARD
// ========================================

async function carregarPlanejamentoDashboard(user) {

    try {

        const hoje = new Date();

        const mesReferencia =
            `${hoje.getFullYear()}-${String(
                hoje.getMonth() + 1
            ).padStart(2, "0")}`;

        const {
            data: planejamento,
            error
        } = await supabaseClient
            .from("v_monthly_planning_summary")
            .select("*")
            .eq("user_id", user.id)
            .eq("mes_referencia", mesReferencia)
            .maybeSingle();

        if (error) {

            console.error(
                "Erro ao carregar planejamento:",
                error
            );

            renderizarPlanejamentoVazio();
            return;
        }

        const itensLista =
            await obterTotalItensListaCompras(user);

        atualizarCard(
            "listaInteligenteDashboard",
            itensLista
        );

        if (!planejamento) {

            renderizarPlanejamentoVazio(
                itensLista
            );

            return;
        }

        atualizarCard(
            "orcamentoDashboard",
            formatarMoeda(
                planejamento.orcamento_mensal
            )
        );

        atualizarCard(
            "gastoDashboard",
            formatarMoeda(
                planejamento.gasto_atual
            )
        );

        atualizarCard(
            "saldoDashboard",
            formatarMoeda(
                planejamento.saldo_disponivel
            )
        );

        atualizarCard(
            "statusDashboard",
            traduzirStatusPlanejamento(
                planejamento.status_planejamento
            )
        );

        renderizarBlocoPlanejamento(
            planejamento,
            itensLista
        );

    } catch (erro) {

        console.error(
            "Erro inesperado no planejamento:",
            erro
        );

        renderizarPlanejamentoVazio();
    }
}

async function obterTotalItensListaCompras(user) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("v_pantry_stock")
            .select("id")
            .eq("user_id", user.id)
            .eq("ativo", true)
            .in(
                "status_estoque",
                [
                    "repor",
                    "sem_estoque"
                ]
            );

        if (error) {

            console.error(
                "Erro ao carregar lista inteligente:",
                error
            );

            return 0;
        }

        return (data || []).length;

    } catch (erro) {

        console.error(erro);
        return 0;
    }
}

function renderizarPlanejamentoVazio(
    itensLista = 0
) {

    atualizarCard("orcamentoDashboard", "R$ 0,00");
    atualizarCard("gastoDashboard", "R$ 0,00");
    atualizarCard("saldoDashboard", "R$ 0,00");
    atualizarCard("statusDashboard", "Sem meta");
    atualizarCard("listaInteligenteDashboard", itensLista);

    const container =
        document.getElementById(
            "planejamentoResumo"
        );

    if (!container) return;

    container.innerHTML = `

        <article class="planejamento-card-resumo">

            <div class="planejamento-status status-neutro">

                ◎ Planejamento não definido

            </div>

            <p>
                Cadastre uma meta mensal para acompanhar melhor sua feira.
                Hoje existem <strong>${itensLista}</strong> itens sugeridos
                para reposição.
            </p>

            <button
                onclick="window.location.href='planejamento-feira.html'">

                Criar planejamento

            </button>

        </article>

    `;
}

function renderizarBlocoPlanejamento(
    planejamento,
    itensLista
) {

    const container =
        document.getElementById(
            "planejamentoResumo"
        );

    if (!container) return;

    const statusTexto =
        traduzirStatusPlanejamento(
            planejamento.status_planejamento
        );

    const classe =
        obterClassePlanejamento(
            planejamento.status_planejamento
        );

    const percentual =
        Number(
            planejamento.percentual_uso || 0
        );

    container.innerHTML = `

        <article class="planejamento-card-resumo">

            <div class="planejamento-status ${classe}">

                ${statusTexto}

            </div>

            <div class="planejamento-progress">

                <div class="planejamento-progress-topo">

                    <span>
                        Uso do orçamento
                    </span>

                    <strong>
                        ${percentual}%
                    </strong>

                </div>

                <div class="planejamento-barra">

                    <div
                        class="planejamento-barra-fill ${classe}"
                        style="width:${Math.min(percentual, 100)}%">

                    </div>

                </div>

            </div>

            <p>
                Você possui <strong>${itensLista}</strong> itens para repor.
                Seu saldo disponível é
                <strong>${formatarMoeda(planejamento.saldo_disponivel)}</strong>.
            </p>

            <button
                onclick="window.location.href='planejamento-feira.html'">

                Ver planejamento

            </button>

        </article>

    `;
}

function traduzirStatusPlanejamento(status) {

    if (status === "estourado") {
        return "Estourado";
    }

    if (status === "alerta") {
        return "Atenção";
    }

    if (status === "ok") {
        return "Dentro da meta";
    }

    return "Sem meta";
}

function obterClassePlanejamento(status) {

    if (status === "estourado") {
        return "status-estourado";
    }

    if (status === "alerta") {
        return "status-alerta";
    }

    if (status === "ok") {
        return "status-ok-planejamento";
    }

    return "status-neutro";
}

// ========================================
// ECONOMIA NO DASHBOARD
// ========================================

async function carregarEconomiaDashboard(user) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("product_prices")
            .select(`
                id,
                product_id,
                market_id,
                price,
                created_at,
                products (
                    nome
                ),
                markets (
                    nome
                )
            `)
            .order("created_at", {
                ascending: true
            });

        if (error) {

            console.error(
                "Erro ao carregar economia:",
                error
            );

            renderizarResumoEconomiaDashboard(
                [],
                0,
                0,
                0
            );

            return;
        }

        const analise =
            montarAnaliseEconomiaDashboard(
                data || []
            );

        const produtosAlta =
            analise.filter(
                item =>
                    item.tipo_variacao === "alta"
            ).length;

        const produtosQueda =
            analise.filter(
                item =>
                    item.tipo_variacao === "queda"
            ).length;

        const economiaPotencial =
            analise.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.economia_possivel || 0
                    ),
                0
            );

        atualizarCard(
            "economiaAltaDashboard",
            produtosAlta
        );

        atualizarCard(
            "economiaQuedaDashboard",
            produtosQueda
        );

        atualizarCard(
            "economiaPotencialDashboard",
            formatarMoeda(
                economiaPotencial
            )
        );

        renderizarResumoEconomiaDashboard(
            analise,
            produtosAlta,
            produtosQueda,
            economiaPotencial
        );

    } catch (erro) {

        console.error(
            "Erro inesperado na economia do dashboard:",
            erro
        );

        renderizarResumoEconomiaDashboard(
            [],
            0,
            0,
            0
        );
    }
}

function montarAnaliseEconomiaDashboard(precos) {

    const mapaProdutos = {};

    precos.forEach(registro => {

        const productId =
            registro.product_id;

        if (!mapaProdutos[productId]) {

            mapaProdutos[productId] = [];
        }

        mapaProdutos[productId].push(
            registro
        );
    });

    const resultado = [];

    Object
        .keys(mapaProdutos)
        .forEach(productId => {

            const historico =
                mapaProdutos[productId]
                    .sort(
                        (a, b) =>
                            new Date(a.created_at) -
                            new Date(b.created_at)
                    );

            if (historico.length < 2) {
                return;
            }

            const primeiro =
                historico[0];

            const ultimo =
                historico[
                    historico.length - 1
                ];

            const menor =
                historico.reduce(
                    (menorAtual, item) =>
                        Number(item.price) <
                        Number(menorAtual.price)
                            ? item
                            : menorAtual,
                    historico[0]
                );

            const precoInicial =
                Number(primeiro.price || 0);

            const precoAtual =
                Number(ultimo.price || 0);

            const diferenca =
                precoAtual - precoInicial;

            const tipoVariacao =
                diferenca > 0
                    ? "alta"
                    : diferenca < 0
                        ? "queda"
                        : "igual";

            const economiaPossivel =
                precoAtual > Number(menor.price)
                    ? precoAtual - Number(menor.price)
                    : 0;

            resultado.push({

                product_id:
                    Number(productId),

                produto_nome:
                    ultimo.products?.nome ||
                    primeiro.products?.nome ||
                    "Produto",

                preco_inicial:
                    precoInicial,

                preco_atual:
                    precoAtual,

                preco_menor:
                    Number(menor.price || 0),

                mercado_menor:
                    menor.markets?.nome ||
                    "Mercado não informado",

                tipo_variacao:
                    tipoVariacao,

                economia_possivel:
                    economiaPossivel
            });
        });

    return resultado;
}

function renderizarResumoEconomiaDashboard(
    analise,
    produtosAlta,
    produtosQueda,
    economiaPotencial
) {

    const container =
        document.getElementById(
            "economiaResumo"
        );

    if (!container) return;

    if (!analise.length) {

        container.innerHTML = `

            <article class="planejamento-card-resumo">

                <div class="planejamento-status status-neutro">

                    ↕ Economia ainda sem dados

                </div>

                <p>
                    Registre pelo menos duas compras com os mesmos produtos
                    para ativar a análise inteligente de preços.
                </p>

                <button
                    onclick="window.location.href='nova-compra.html'">

                    Registrar compra

                </button>

            </article>

        `;

        return;
    }

    let titulo =
        "Preços em equilíbrio";

    let classe =
        "status-neutro";

    if (produtosAlta > produtosQueda) {

        titulo =
            "Atenção: mais produtos subiram";

        classe =
            "status-alerta";
    }

    if (produtosQueda > produtosAlta) {

        titulo =
            "Boa notícia: mais produtos caíram";

        classe =
            "status-ok-planejamento";
    }

    container.innerHTML = `

        <article class="planejamento-card-resumo">

            <div class="planejamento-status ${classe}">

                ↕ ${titulo}

            </div>

            <p>
                Produtos em alta:
                <strong>${produtosAlta}</strong>.
                Produtos em queda:
                <strong>${produtosQueda}</strong>.
                Economia potencial:
                <strong>${formatarMoeda(economiaPotencial)}</strong>.
            </p>

            <button
                onclick="window.location.href='economia.html'">

                Ver economia

            </button>

        </article>

    `;
}

// ========================================
// RENDERIZAR DISPENSA
// ========================================

function renderizarDispensa(estoque) {

    const container =
        document.getElementById("listaDispensa");

    if (!container) return;

    if (!estoque.length) {

        container.innerHTML = `

            <div class="dispensa-card empty-card">

                Nenhum item na dispensa ainda.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    estoque.slice(0, 8).forEach(item => {

        const status =
            obterStatusDispensa(
                item.status_estoque
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

                    <div>

                        Quantidade atual:
                        <strong>
                            ${formatarQuantidade(item.quantidade_atual)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                    <div>

                        Quantidade mínima:
                        <strong>
                            ${formatarQuantidade(item.quantidade_minima)}
                            ${item.unidade || "un"}
                        </strong>

                    </div>

                </div>

            </article>

        `;
    });
}

// ========================================
// STATUS DA DISPENSA
// ========================================

function obterStatusDispensa(status) {

    if (status === "sem_estoque") {

        return {
            texto: "Sem estoque",
            classe: "status-sem-estoque"
        };
    }

    if (status === "repor") {

        return {
            texto: "Repor",
            classe: "status-repor"
        };
    }

    return {
        texto: "OK",
        classe: "status-ok"
    };
}

// ========================================
// ÚLTIMAS COMPRAS
// ========================================

function renderizarUltimasCompras(compras) {

    const container =
        document.getElementById(
            "ultimasCompras"
        );

    if (!container) return;

    if (!compras.length) {

        container.innerHTML = `

            <div class="compra-card empty-card">

                Nenhuma compra encontrada.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    compras.forEach(compra => {

        container.innerHTML += `

            <article class="compra-card">

                <div class="compra-data">

                    📅 ${formatarData(
                        compra.data_compra
                    )}

                </div>

                <div class="compra-mercado">

                    🏪 ${compra.markets?.nome || "Mercado não informado"}

                </div>

                <div class="compra-itens">

                    🛒 ${formatarQuantidade(
                        compra.quantidade_total || 0
                    )} itens registrados

                </div>

                <div class="compra-total">

                    ${formatarMoeda(
                        compra.valor_total || 0
                    )}

                </div>

            </article>

        `;
    });
}

// ========================================
// MENU MOBILE
// ========================================

function iniciarMenuMobile() {

    const menu =
        document.getElementById("menuMobile");

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("overlay");

    if (!menu || !sidebar || !overlay) {
        return;
    }

    menu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("aberto");
            overlay.classList.toggle("ativo");
        }
    );

    overlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove("aberto");
            overlay.classList.remove("ativo");
        }
    );
}

// ========================================
// HELPERS
// ========================================

function atualizarCard(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.innerText = valor;
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
        return "Data não informada";
    }

    return new Date(data)
        .toLocaleDateString("pt-BR");
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
// LOGOUT
// ========================================

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    window.location.href = "/";
}

// ========================================
// START
// ========================================

verificarSessao();