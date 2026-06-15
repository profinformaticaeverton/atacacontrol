// ========================================
// MINHA DISPENSA
// ECONOMIA AVANÇADA
// TENDÊNCIAS + INFLAÇÃO PESSOAL + ÍNDICE GERAL
// ========================================

let usuarioAtual = null;

let produtosCache = [];
let mercadosCache = [];
let precosCache = [];
let comprasCache = [];
let estoqueCache = [];
let planejamentoAtual = null;

let tendencias = [];
let tendenciasFiltradas = [];
let melhoresMeses = [];
let alertas = [];

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

        await carregarEconomiaAvancada();

    } catch (erro) {

        console.error(
            "Erro ao iniciar Economia Avançada:",
            erro
        );

        alert(
            "Erro ao carregar economia avançada."
        );
    }
}

// ========================================
// FILTROS
// ========================================

function configurarFiltros() {

    const periodo =
        document.getElementById("periodoAnalise");

    const busca =
        document.getElementById("buscaProduto");

    if (periodo) {

        periodo.addEventListener(
            "change",
            carregarEconomiaAvancada
        );
    }

    if (busca) {

        busca.addEventListener(
            "input",
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

    tendenciasFiltradas =
        tendencias.filter(item => {

            const nome =
                (
                    item.produto_nome ||
                    ""
                ).toLowerCase();

            return !termo ||
                nome.includes(termo);
        });

    renderizarTendencias();
}

// ========================================
// CARREGAR DADOS
// ========================================

async function carregarEconomiaAvancada() {

    try {

        const periodoDias =
            Number(
                document.getElementById(
                    "periodoAnalise"
                )?.value || 90
            );

        const dataLimite =
            calcularDataLimite(periodoDias);

        const hoje =
            new Date();

        const mesReferencia =
            `${hoje.getFullYear()}-${String(
                hoje.getMonth() + 1
            ).padStart(2, "0")}`;

        const [
            precosResposta,
            produtosResposta,
            mercadosResposta,
            comprasResposta,
            estoqueResposta,
            planejamentoResposta
        ] = await Promise.all([

            supabaseClient
                .from("product_prices")
                .select("*")
                .gte("created_at", dataLimite)
                .order("created_at", {
                    ascending: true
                }),

            supabaseClient
                .from("products")
                .select("*"),

            supabaseClient
                .from("markets")
                .select("*"),

            supabaseClient
                .from("purchases")
                .select("*")
                .eq("user_id", usuarioAtual.id)
                .gte("data_compra", dataLimite),

            supabaseClient
                .from("v_pantry_stock")
                .select("*")
                .eq("user_id", usuarioAtual.id)
                .eq("ativo", true),

            supabaseClient
                .from("v_monthly_planning_summary")
                .select("*")
                .eq("user_id", usuarioAtual.id)
                .eq("mes_referencia", mesReferencia)
                .maybeSingle()
        ]);

        if (precosResposta.error) {

            console.error(
                "Erro ao carregar preços:",
                precosResposta.error
            );

            limparTelaComErro(
                "Não foi possível carregar os preços."
            );

            return;
        }

        if (produtosResposta.error) {

            console.error(
                "Erro ao carregar produtos:",
                produtosResposta.error
            );
        }

        if (mercadosResposta.error) {

            console.error(
                "Erro ao carregar mercados:",
                mercadosResposta.error
            );
        }

        if (comprasResposta.error) {

            console.error(
                "Erro ao carregar compras:",
                comprasResposta.error
            );
        }

        if (estoqueResposta.error) {

            console.error(
                "Erro ao carregar estoque:",
                estoqueResposta.error
            );
        }

        if (planejamentoResposta.error) {

            console.error(
                "Erro ao carregar planejamento:",
                planejamentoResposta.error
            );
        }

        produtosCache =
            produtosResposta.data || [];

        mercadosCache =
            mercadosResposta.data || [];

        precosCache =
            filtrarPrecosValidos(
                precosResposta.data || []
            );

        comprasCache =
            comprasResposta.data || [];

        estoqueCache =
            estoqueResposta.data || [];

        planejamentoAtual =
            planejamentoResposta.data || null;

        tendencias =
            montarTendencias(precosCache);

        tendenciasFiltradas =
            [...tendencias];

        melhoresMeses =
            montarMelhoresMeses(precosCache);

        alertas =
            montarAlertasInteligentes();

        atualizarResumoAvancado();
        atualizarIndiceMinhaDispensa();
        renderizarTendencias();
        renderizarMelhoresMeses();
        renderizarAlertas();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar economia avançada:",
            erro
        );

        limparTelaComErro(
            "Erro inesperado ao carregar economia avançada."
        );
    }
}

// ========================================
// TENDÊNCIAS
// ========================================

function montarTendencias(precos) {

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

    Object
        .keys(mapaProdutos)
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

            const maior =
                historico.reduce(
                    (maiorAtual, item) =>
                        Number(item.price) >
                        Number(maiorAtual.price)
                            ? item
                            : maiorAtual,
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

            const tipo =
                diferenca > 0
                    ? "alta"
                    : diferenca < 0
                        ? "queda"
                        : "estavel";

            resultado.push({

                product_id:
                    Number(productId),

                produto_nome:
                    obterNomeProduto(productId),

                preco_inicial:
                    precoInicial,

                preco_atual:
                    precoAtual,

                menor_preco:
                    Number(menor.price || 0),

                maior_preco:
                    Number(maior.price || 0),

                melhor_mercado:
                    obterNomeMercado(menor.market_id),

                percentual:
                    percentual,

                diferenca:
                    diferenca,

                tendencia:
                    tipo,

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
// MELHORES MESES
// ========================================

function montarMelhoresMeses(precos) {

    const mapa = {};

    precos.forEach(registro => {

        const productId =
            Number(registro.product_id);

        const data =
            obterDataRegistro(registro);

        const mes =
            data.toLocaleDateString(
                "pt-BR",
                {
                    month: "long"
                }
            );

        const chave =
            `${productId}-${mes}`;

        if (!mapa[chave]) {

            mapa[chave] = {

                product_id:
                    productId,

                produto_nome:
                    obterNomeProduto(productId),

                mes:
                    capitalizar(mes),

                total:
                    0,

                registros:
                    0
            };
        }

        mapa[chave].total +=
            Number(registro.price || 0);

        mapa[chave].registros += 1;
    });

    const porProduto = {};

    Object
        .values(mapa)
        .forEach(item => {

            item.media =
                item.registros > 0
                    ? item.total / item.registros
                    : 0;

            if (!porProduto[item.product_id]) {

                porProduto[item.product_id] = item;

                return;
            }

            if (
                item.media <
                porProduto[item.product_id].media
            ) {

                porProduto[item.product_id] = item;
            }
        });

    return Object
        .values(porProduto)
        .sort(
            (a, b) =>
                a.media - b.media
        )
        .slice(0, 12);
}

// ========================================
// ALERTAS
// ========================================

function montarAlertasInteligentes() {

    const resultado = [];

    const itensCriticos =
        estoqueCache.filter(
            item =>
                item.status_estoque === "repor" ||
                item.status_estoque === "sem_estoque"
        );

    if (itensCriticos.length > 0) {

        resultado.push({

            titulo:
                "Itens críticos na dispensa",

            texto:
                `Você possui ${itensCriticos.length} item(ns) que precisam de atenção na próxima feira.`,

            tipo:
                "alta"
        });
    }

    const produtosAlta =
        tendencias.filter(
            item =>
                item.tendencia === "alta"
        );

    if (produtosAlta.length > 0) {

        const maisSubiu =
            produtosAlta[0];

        resultado.push({

            titulo:
                "Produto com maior alta",

            texto:
                `${maisSubiu.produto_nome} subiu ${formatarPercentual(Math.abs(maisSubiu.percentual))}. Avalie comprar em outro mercado.`,

            tipo:
                "alta"
        });
    }

    const produtosQueda =
        tendencias.filter(
            item =>
                item.tendencia === "queda"
        );

    if (produtosQueda.length > 0) {

        const maiorQueda =
            produtosQueda[0];

        resultado.push({

            titulo:
                "Oportunidade de economia",

            texto:
                `${maiorQueda.produto_nome} caiu ${formatarPercentual(Math.abs(maiorQueda.percentual))}. Pode ser um bom momento para comprar.`,

            tipo:
                "ok"
        });
    }

    if (planejamentoAtual) {

        const status =
            planejamentoAtual.status_planejamento;

        if (status === "estourado") {

            resultado.push({

                titulo:
                    "Orçamento estourado",

                texto:
                    "Sua feira ultrapassou a meta mensal. Priorize apenas itens essenciais.",

                tipo:
                    "alta"
            });
        }

        if (status === "alerta") {

            resultado.push({

                titulo:
                    "Atenção ao orçamento",

                texto:
                    "Você já usou mais de 80% da meta mensal. Planeje a próxima compra com cautela.",

                tipo:
                    "neutro"
            });
        }
    }

    if (!resultado.length) {

        resultado.push({

            titulo:
                "Tudo sob controle",

            texto:
                "Não encontramos alertas críticos neste momento. Continue registrando suas compras.",

            tipo:
                "ok"
        });
    }

    return resultado;
}

// ========================================
// RESUMO AVANÇADO
// ========================================

function atualizarResumoAvancado() {

    const inflacao =
        calcularInflacaoPessoal();

    const economia =
        calcularEconomiaAcumulada();

    const itensCriticos =
        estoqueCache.filter(
            item =>
                item.status_estoque === "repor" ||
                item.status_estoque === "sem_estoque"
        ).length;

    const controle =
        calcularControleOrcamento();

    atualizarTexto(
        "inflacaoPessoal",
        formatarPercentual(inflacao)
    );

    atualizarTexto(
        "economiaAcumulada",
        formatarMoeda(economia)
    );

    atualizarTexto(
        "itensCriticos",
        itensCriticos
    );

    atualizarTexto(
        "controleOrcamento",
        `${controle}%`
    );
}

function calcularInflacaoPessoal() {

    if (!tendencias.length) {

        return 0;
    }

    const soma =
        tendencias.reduce(
            (total, item) =>
                total +
                Number(item.percentual || 0),
            0
        );

    return soma / tendencias.length;
}

function calcularEconomiaAcumulada() {

    return tendencias.reduce(
        (total, item) => {

            const economia =
                item.preco_atual >
                item.menor_preco
                    ? item.preco_atual -
                      item.menor_preco
                    : 0;

            return total + economia;
        },
        0
    );
}

function calcularControleOrcamento() {

    if (
        !planejamentoAtual ||
        !planejamentoAtual.orcamento_mensal
    ) {

        return 0;
    }

    const percentual =
        Number(
            planejamentoAtual.percentual_uso || 0
        );

    return Math.max(
        0,
        Math.min(
            100,
            100 - percentual
        )
    );
}

// ========================================
// ÍNDICE MINHA DISPENSA
// ========================================

function atualizarIndiceMinhaDispensa() {

    const indice =
        calcularIndiceMinhaDispensa();

    atualizarTexto(
        "indiceMinhaDispensa",
        indice
    );

    const titulo =
        document.getElementById(
            "tituloIndice"
        );

    const texto =
        document.getElementById(
            "textoIndice"
        );

    const status =
        document.getElementById(
            "statusIndice"
        );

    if (!titulo || !texto || !status) {

        return;
    }

    if (indice >= 85) {

        titulo.innerText =
            "Sua feira está muito bem controlada";

        texto.innerText =
            "Seu planejamento, estoque e economia estão em ótimo equilíbrio.";

        status.innerText =
            "Excelente";

        return;
    }

    if (indice >= 65) {

        titulo.innerText =
            "Sua feira está sob controle";

        texto.innerText =
            "Há bons sinais de organização, mas ainda existe espaço para melhorar economia e reposição.";

        status.innerText =
            "Bom";

        return;
    }

    if (indice >= 40) {

        titulo.innerText =
            "Sua feira precisa de atenção";

        texto.innerText =
            "Alguns indicadores mostram risco no orçamento, estoque ou preços.";

        status.innerText =
            "Atenção";

        return;
    }

    titulo.innerText =
        "Sua feira está desorganizada";

    texto.innerText =
        "Defina orçamento, registre compras e ajuste a dispensa para melhorar seu controle.";

    status.innerText =
        "Crítico";
}

function calcularIndiceMinhaDispensa() {

    let pontos = 50;

    const itensCriticos =
        estoqueCache.filter(
            item =>
                item.status_estoque === "repor" ||
                item.status_estoque === "sem_estoque"
        ).length;

    const inflacao =
        calcularInflacaoPessoal();

    const controle =
        calcularControleOrcamento();

    if (planejamentoAtual) {

        pontos += 15;
        pontos += controle * 0.15;
    } else {

        pontos -= 10;
    }

    if (itensCriticos === 0) {

        pontos += 15;
    } else {

        pontos -= Math.min(
            itensCriticos * 4,
            20
        );
    }

    if (inflacao <= 0) {

        pontos += 10;
    } else {

        pontos -= Math.min(
            inflacao,
            20
        );
    }

    if (comprasCache.length >= 2) {

        pontos += 10;
    }

    return Math.round(
        Math.max(
            0,
            Math.min(
                100,
                pontos
            )
        )
    );
}

// ========================================
// RENDERIZAR TENDÊNCIAS
// ========================================

function renderizarTendencias() {

    const container =
        document.getElementById(
            "listaTendencias"
        );

    if (!container) return;

    if (!tendenciasFiltradas.length) {

        container.innerHTML = `

            <div class="tendencia-card empty-card">

                Nenhuma tendência encontrada.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    tendenciasFiltradas
        .slice(0, 16)
        .forEach(item => {

            const visual =
                obterVisualTendencia(
                    item.tendencia
                );

            container.innerHTML += `

                <article class="tendencia-card">

                    <div class="tendencia-topo">

                        <div>

                            <div class="produto-nome">

                                ${item.produto_nome}

                            </div>

                            <div class="produto-info">

                                ${item.registros} registros analisados

                            </div>

                        </div>

                        <span class="tendencia-badge ${visual.classe}">

                            ${visual.texto}

                        </span>

                    </div>

                    <div class="tendencia-info">

                        <div class="info-item">

                            <span>
                                Preço inicial
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
                                Variação
                            </span>

                            <strong>
                                ${formatarPercentual(item.percentual)}
                            </strong>

                        </div>

                        <div class="info-item">

                            <span>
                                Melhor mercado
                            </span>

                            <strong>
                                ${item.melhor_mercado}
                            </strong>

                        </div>

                    </div>

                </article>

            `;
        });
}

// ========================================
// RENDERIZAR MELHORES MESES
// ========================================

function renderizarMelhoresMeses() {

    const container =
        document.getElementById(
            "listaMelhoresMeses"
        );

    if (!container) return;

    if (!melhoresMeses.length) {

        container.innerHTML = `

            <div class="mes-card empty-card">

                Ainda não há histórico suficiente para identificar meses mais baratos.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    melhoresMeses.forEach(item => {

        container.innerHTML += `

            <article class="mes-card">

                <div class="mes-topo">

                    <div>

                        <div class="mes-produto">

                            ${item.produto_nome}

                        </div>

                        <div class="mes-info">

                            Melhor mês observado

                        </div>

                    </div>

                    <span class="mes-badge badge-queda">

                        ${item.mes}

                    </span>

                </div>

                <div class="mes-detalhes">

                    <div class="info-item">

                        <span>
                            Preço médio
                        </span>

                        <strong>
                            ${formatarMoeda(item.media)}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Registros
                        </span>

                        <strong>
                            ${item.registros}
                        </strong>

                    </div>

                </div>

            </article>

        `;
    });
}

// ========================================
// RENDERIZAR ALERTAS
// ========================================

function renderizarAlertas() {

    const container =
        document.getElementById(
            "listaAlertas"
        );

    if (!container) return;

    container.innerHTML = "";

    alertas.forEach(alerta => {

        const classe =
            alerta.tipo === "alta"
                ? "alerta-alta"
                : alerta.tipo === "ok"
                    ? "alerta-ok"
                    : "alerta-neutro";

        container.innerHTML += `

            <article class="alerta-card">

                <div class="alerta-topo">

                    <div>

                        <div class="alerta-titulo">

                            ${alerta.titulo}

                        </div>

                        <div class="alerta-texto">

                            ${alerta.texto}

                        </div>

                    </div>

                    <span class="alerta-badge ${classe}">

                        ${alerta.tipo === "alta" ? "Atenção" : alerta.tipo === "ok" ? "OK" : "Aviso"}

                    </span>

                </div>

            </article>

        `;
    });
}

// ========================================
// VISUAIS
// ========================================

function obterVisualTendencia(tendencia) {

    if (tendencia === "alta") {

        return {
            texto: "Alta",
            classe: "badge-alta"
        };
    }

    if (tendencia === "queda") {

        return {
            texto: "Queda",
            classe: "badge-queda"
        };
    }

    return {
        texto: "Estável",
        classe: "badge-estavel"
    };
}

// ========================================
// HELPERS
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

function calcularDataLimite(dias) {

    const data =
        new Date();

    data.setDate(
        data.getDate() - dias
    );

    return data
        .toISOString()
        .split("T")[0];
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

function formatarPercentual(valor) {

    return `${Number(valor || 0)
        .toFixed(1)
        .replace(".", ",")}%`;
}

function capitalizar(texto) {

    if (!texto) return "";

    return texto
        .charAt(0)
        .toUpperCase() +
        texto.slice(1);
}

function limparTelaComErro(mensagem) {

    atualizarTexto(
        "inflacaoPessoal",
        "0%"
    );

    atualizarTexto(
        "economiaAcumulada",
        "R$ 0,00"
    );

    atualizarTexto(
        "itensCriticos",
        0
    );

    atualizarTexto(
        "controleOrcamento",
        "0%"
    );

    atualizarTexto(
        "indiceMinhaDispensa",
        0
    );

    const titulo =
        document.getElementById(
            "tituloIndice"
        );

    const texto =
        document.getElementById(
            "textoIndice"
        );

    if (titulo) {

        titulo.innerText =
            "Não foi possível calcular o índice";
    }

    if (texto) {

        texto.innerText =
            mensagem;
    }

    const listas = [
        "listaTendencias",
        "listaMelhoresMeses",
        "listaAlertas"
    ];

    listas.forEach(id => {

        const container =
            document.getElementById(id);

        if (container) {

            container.innerHTML = `

                <div class="empty-card">

                    ${mensagem}

                </div>

            `;
        }
    });
}

// ========================================
// START
// ========================================

iniciar();