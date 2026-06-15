// ========================================
// MINHA DISPENSA
// ECONOMIA INTELIGENTE
// ANÁLISE SEGURA DE PREÇOS + RANKING DE MERCADOS
// ========================================

let usuarioAtual = null;
let analiseEconomia = [];
let analiseFiltrada = [];
let rankingMercados = [];

let produtosCache = [];
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

            window.location.href = "index.html";

            return;
        }

        usuarioAtual = session.user;

        configurarFiltros();

        await carregarEconomia();

    } catch (erro) {

        console.error(
            "Erro ao iniciar Economia Inteligente:",
            erro
        );

        alert(
            "Erro ao carregar economia inteligente."
        );
    }
}

// ========================================
// FILTROS
// ========================================

function configurarFiltros() {

    const buscaProduto =
        document.getElementById("buscaProduto");

    const filtroVariacao =
        document.getElementById("filtroVariacao");

    if (buscaProduto) {

        buscaProduto.addEventListener(
            "input",
            aplicarFiltros
        );
    }

    if (filtroVariacao) {

        filtroVariacao.addEventListener(
            "change",
            aplicarFiltros
        );
    }
}

function aplicarFiltros() {

    const termo =
        document
            .getElementById("buscaProduto")
            .value
            .toLowerCase()
            .trim();

    const variacao =
        document
            .getElementById("filtroVariacao")
            .value;

    analiseFiltrada =
        analiseEconomia.filter(item => {

            const nome =
                (
                    item.produto_nome ||
                    ""
                ).toLowerCase();

            const filtroNome =
                !termo ||
                nome.includes(termo);

            const filtroVariacao =
                !variacao ||
                item.tipo_variacao === variacao;

            return filtroNome && filtroVariacao;
        });

    renderizarEconomia();
}

// ========================================
// CARREGAR ECONOMIA
// ========================================

async function carregarEconomia() {

    try {

        const [
            precosResposta,
            produtosResposta,
            mercadosResposta,
            comprasResposta
        ] = await Promise.all([

            supabaseClient
                .from("product_prices")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                ),

            supabaseClient
                .from("products")
                .select("*"),

            supabaseClient
                .from("markets")
                .select("*"),

            supabaseClient
                .from("purchases")
                .select("*")
                .eq(
                    "user_id",
                    usuarioAtual.id
                )
        ]);

        if (precosResposta.error) {

            console.error(
                "Erro ao carregar product_prices:",
                precosResposta.error
            );

            limparTelaComErro(
                "Não foi possível carregar o histórico de preços."
            );

            return;
        }

        if (produtosResposta.error) {

            console.error(
                "Erro ao carregar products:",
                produtosResposta.error
            );
        }

        if (mercadosResposta.error) {

            console.error(
                "Erro ao carregar markets:",
                mercadosResposta.error
            );
        }

        if (comprasResposta.error) {

            console.error(
                "Erro ao carregar purchases:",
                comprasResposta.error
            );
        }

        produtosCache =
            produtosResposta.data || [];

        mercadosCache =
            mercadosResposta.data || [];

        const precos =
            filtrarPrecosValidos(
                precosResposta.data || []
            );

        const compras =
            comprasResposta.data || [];

        analiseEconomia =
            montarAnalisePrecos(
                precos
            );

        analiseFiltrada =
            [...analiseEconomia];

        rankingMercados =
            montarRankingMercados(
                compras
            );

        atualizarResumo();
        atualizarTextoDestaque();
        renderizarEconomia();
        renderizarRankingMercados();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar economia:",
            erro
        );

        limparTelaComErro(
            "Erro inesperado ao carregar economia."
        );
    }
}

// ========================================
// FILTRAR PREÇOS VÁLIDOS
// ========================================

function filtrarPrecosValidos(precos) {

    return precos.filter(registro => {

        const temProduto =
            registro.product_id !== null &&
            registro.product_id !== undefined;

        const temPreco =
            registro.price !== null &&
            registro.price !== undefined &&
            !isNaN(Number(registro.price));

        return temProduto && temPreco;
    });
}

// ========================================
// MONTAR ANÁLISE DE PREÇOS
// ========================================

function montarAnalisePrecos(precos) {

    const mapaProdutos = {};

    precos.forEach(registro => {

        const productId =
            Number(registro.product_id);

        if (!mapaProdutos[productId]) {

            mapaProdutos[productId] = [];
        }

        mapaProdutos[productId].push(registro);
    });

    const resultado = [];

    Object.keys(mapaProdutos)
        .forEach(productId => {

            const historico =
                mapaProdutos[productId]
                    .sort(
                        (a, b) =>
                            obterDataRegistro(a) -
                            obterDataRegistro(b)
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

            if (precoInicial <= 0) {

                return;
            }

            const diferenca =
                precoAtual - precoInicial;

            const percentual =
                (
                    diferenca /
                    precoInicial
                ) * 100;

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
                    obterNomeProduto(productId),

                preco_inicial:
                    precoInicial,

                preco_atual:
                    precoAtual,

                preco_menor:
                    Number(menor.price || 0),

                mercado_atual:
                    obterNomeMercado(ultimo.market_id),

                mercado_menor:
                    obterNomeMercado(menor.market_id),

                diferenca:
                    diferenca,

                percentual:
                    percentual,

                tipo_variacao:
                    tipoVariacao,

                economia_possivel:
                    economiaPossivel,

                registros:
                    historico.length
            });
        });

    return resultado.sort(
        (a, b) =>
            Math.abs(b.percentual) -
            Math.abs(a.percentual)
    );
}

// ========================================
// RANKING MERCADOS
// ========================================

function montarRankingMercados(compras) {

    const mapa = {};

    compras.forEach(compra => {

        const marketId =
            compra.market_id ||
            "sem_mercado";

        if (!mapa[marketId]) {

            mapa[marketId] = {

                market_id:
                    marketId,

                nome:
                    obterNomeMercado(
                        compra.market_id
                    ),

                total_compras:
                    0,

                valor_total:
                    0
            };
        }

        mapa[marketId].total_compras += 1;

        mapa[marketId].valor_total +=
            Number(
                compra.valor_total || 0
            );
    });

    return Object
        .values(mapa)
        .sort(
            (a, b) =>
                b.total_compras -
                a.total_compras
        );
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const produtosQueda =
        analiseEconomia.filter(
            item =>
                item.tipo_variacao === "queda"
        ).length;

    const produtosAlta =
        analiseEconomia.filter(
            item =>
                item.tipo_variacao === "alta"
        ).length;

    const economiaPotencial =
        analiseEconomia.reduce(
            (total, item) =>
                total +
                Number(
                    item.economia_possivel || 0
                ),
            0
        );

    atualizarTexto(
        "produtosQueda",
        produtosQueda
    );

    atualizarTexto(
        "produtosAlta",
        produtosAlta
    );

    atualizarTexto(
        "economiaPotencial",
        formatarMoeda(
            economiaPotencial
        )
    );
}

// ========================================
// TEXTO DE DESTAQUE
// ========================================

function atualizarTextoDestaque() {

    const titulo =
        document.getElementById(
            "tituloEconomia"
        );

    const texto =
        document.getElementById(
            "textoEconomia"
        );

    if (!titulo || !texto) return;

    if (!analiseEconomia.length) {

        titulo.innerText =
            "Ainda não há dados suficientes";

        texto.innerText =
            "Registre pelo menos duas compras com os mesmos produtos para comparar preços.";

        return;
    }

    const produtosAlta =
        analiseEconomia.filter(
            item =>
                item.tipo_variacao === "alta"
        ).length;

    const produtosQueda =
        analiseEconomia.filter(
            item =>
                item.tipo_variacao === "queda"
        ).length;

    if (produtosAlta > produtosQueda) {

        titulo.innerText =
            "Atenção: mais produtos subiram de preço";

        texto.innerText =
            "Confira os itens em alta e avalie comprar em mercados onde o preço histórico foi menor.";

        return;
    }

    if (produtosQueda > produtosAlta) {

        titulo.innerText =
            "Boa notícia: há produtos em queda";

        texto.innerText =
            "Alguns itens ficaram mais baratos em relação ao primeiro registro. Aproveite para planejar melhor a próxima feira.";

        return;
    }

    titulo.innerText =
        "Preços relativamente equilibrados";

    texto.innerText =
        "As altas e quedas estão próximas. Continue registrando compras para melhorar a análise.";
}

// ========================================
// RENDERIZAR ECONOMIA
// ========================================

function renderizarEconomia() {

    const container =
        document.getElementById(
            "listaEconomia"
        );

    if (!container) return;

    if (!analiseFiltrada.length) {

        container.innerHTML = `

            <div class="economia-card empty-card">

                Nenhum dado de preço encontrado para este filtro.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    analiseFiltrada.forEach(item => {

        const visual =
            obterVisualVariacao(
                item.tipo_variacao
            );

        container.innerHTML += `

            <article class="economia-card">

                <div class="economia-topo">

                    <div>

                        <div class="produto-nome">

                            ${item.produto_nome}

                        </div>

                        <div class="produto-categoria">

                            ${item.registros} registros de preço

                        </div>

                    </div>

                    <span class="variacao-badge ${visual.badge}">

                        ${visual.texto}

                    </span>

                </div>

                <div class="economia-info">

                    <div class="info-item">

                        <span>
                            Primeiro preço
                        </span>

                        <strong>
                            ${formatarMoeda(item.preco_inicial)}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Preço atual
                        </span>

                        <strong>
                            ${formatarMoeda(item.preco_atual)}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Menor preço
                        </span>

                        <strong>
                            ${formatarMoeda(item.preco_menor)}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Melhor mercado
                        </span>

                        <strong>
                            ${item.mercado_menor}
                        </strong>

                    </div>

                </div>

                <div class="variacao-detalhe ${visual.detalhe}">

                    ${gerarTextoVariacao(item)}

                </div>

            </article>

        `;
    });
}

// ========================================
// RENDERIZAR MERCADOS
// ========================================

function renderizarRankingMercados() {

    const container =
        document.getElementById(
            "rankingMercados"
        );

    if (!container) return;

    if (!rankingMercados.length) {

        container.innerHTML = `

            <div class="mercado-card empty-card">

                Nenhum mercado analisado ainda.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    rankingMercados.forEach((mercado, index) => {

        const media =
            mercado.total_compras > 0
                ? mercado.valor_total /
                  mercado.total_compras
                : 0;

        container.innerHTML += `

            <article class="mercado-card">

                <div class="mercado-topo">

                    <div class="mercado-nome">

                        ${mercado.nome}

                    </div>

                    <div class="mercado-posicao">

                        ${index + 1}

                    </div>

                </div>

                <div class="mercado-info">

                    <div class="mercado-item">

                        <span>
                            Compras
                        </span>

                        <strong>
                            ${mercado.total_compras}
                        </strong>

                    </div>

                    <div class="mercado-item">

                        <span>
                            Total gasto
                        </span>

                        <strong>
                            ${formatarMoeda(mercado.valor_total)}
                        </strong>

                    </div>

                    <div class="mercado-item">

                        <span>
                            Média por compra
                        </span>

                        <strong>
                            ${formatarMoeda(media)}
                        </strong>

                    </div>

                </div>

            </article>

        `;
    });
}

// ========================================
// TEXTOS E VARIAÇÕES
// ========================================

function obterVisualVariacao(tipo) {

    if (tipo === "alta") {

        return {
            texto: "Subiu",
            badge: "badge-alta",
            detalhe: "alta"
        };
    }

    if (tipo === "queda") {

        return {
            texto: "Caiu",
            badge: "badge-queda",
            detalhe: "queda"
        };
    }

    return {
        texto: "Estável",
        badge: "badge-igual",
        detalhe: "igual"
    };
}

function gerarTextoVariacao(item) {

    const percentual =
        Math.abs(item.percentual)
            .toFixed(1)
            .replace(".", ",");

    if (item.tipo_variacao === "alta") {

        return `Subiu ${percentual}% em relação ao primeiro registro.`;
    }

    if (item.tipo_variacao === "queda") {

        return `Caiu ${percentual}% em relação ao primeiro registro.`;
    }

    return "Sem variação entre o primeiro e o último registro.";
}

// ========================================
// HELPERS
// ========================================

function obterNomeProduto(productId) {

    const produto =
        produtosCache.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    return produto?.nome ||
        `Produto #${productId}`;
}

function obterNomeMercado(marketId) {

    if (!marketId) {

        return "Mercado não informado";
    }

    const mercado =
        mercadosCache.find(
            item =>
                Number(item.id) ===
                Number(marketId)
        );

    return mercado?.nome ||
        "Mercado não informado";
}

function obterDataRegistro(registro) {

    const data =
        registro.created_at ||
        registro.updated_at ||
        registro.data_registro ||
        registro.data ||
        new Date().toISOString();

    return new Date(data);
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

function limparTelaComErro(mensagem) {

    atualizarTexto(
        "produtosQueda",
        0
    );

    atualizarTexto(
        "produtosAlta",
        0
    );

    atualizarTexto(
        "economiaPotencial",
        "R$ 0,00"
    );

    const titulo =
        document.getElementById(
            "tituloEconomia"
        );

    const texto =
        document.getElementById(
            "textoEconomia"
        );

    if (titulo) {

        titulo.innerText =
            "Não foi possível analisar os preços";
    }

    if (texto) {

        texto.innerText =
            mensagem;
    }

    const lista =
        document.getElementById(
            "listaEconomia"
        );

    if (lista) {

        lista.innerHTML = `

            <div class="economia-card empty-card">

                ${mensagem}

            </div>

        `;
    }

    const mercados =
        document.getElementById(
            "rankingMercados"
        );

    if (mercados) {

        mercados.innerHTML = `

            <div class="mercado-card empty-card">

                Nenhum mercado analisado.

            </div>

        `;
    }
}

// ========================================
// START
// ========================================

iniciar();