// ========================================
// MINHA DISPENSA
// ADMIN PRODUTOS
// APROVAÇÃO DE SUGESTÕES DO CATÁLOGO
// ========================================

let usuarioAtual = null;
let perfilAtual = null;
let sugestoes = [];
let sugestoesFiltradas = [];

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

        const autorizado =
            await verificarPermissaoAdmin();

        if (!autorizado) {

            alert(
                "Acesso restrito a administradores."
            );

            window.location.href =
                "dashboard.html";

            return;
        }

        configurarFiltros();

        await carregarSugestoes();

    } catch (erro) {

        console.error(
            "Erro ao iniciar admin de produtos:",
            erro
        );

        alert(
            "Erro ao carregar administração de produtos."
        );
    }
}

// ========================================
// PERMISSÃO ADMIN
// ========================================

async function verificarPermissaoAdmin() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", usuarioAtual.id)
            .maybeSingle();

        if (error) {

            console.error(
                "Erro ao verificar perfil:",
                error
            );

            return false;
        }

        perfilAtual = data;

        return data?.role === "admin";

    } catch (erro) {

        console.error(
            "Erro inesperado ao verificar admin:",
            erro
        );

        return false;
    }
}

// ========================================
// FILTROS
// ========================================

function configurarFiltros() {

    const busca =
        document.getElementById(
            "buscaProduto"
        );

    const status =
        document.getElementById(
            "filtroStatus"
        );

    if (busca) {

        busca.addEventListener(
            "input",
            aplicarFiltros
        );
    }

    if (status) {

        status.addEventListener(
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

    const status =
        document
            .getElementById("filtroStatus")
            .value;

    sugestoesFiltradas =
        sugestoes.filter(item => {

            const texto =
                [
                    item.nome,
                    item.marca,
                    item.categoria,
                    item.tamanho,
                    item.unidade,
                    item.observacao,
                    item.status
                ]
                .join(" ")
                .toLowerCase();

            const filtroTexto =
                !termo ||
                texto.includes(termo);

            const filtroStatus =
                !status ||
                item.status === status;

            return filtroTexto && filtroStatus;
        });

    renderizarSugestoes();
}

// ========================================
// CARREGAR SUGESTÕES
// ========================================

async function carregarSugestoes() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("product_suggestions")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(
                "Erro ao carregar sugestões:",
                error
            );

            alert(
                "Erro ao carregar sugestões de produtos."
            );

            renderizarEstadoVazio(
                "Não foi possível carregar as sugestões."
            );

            return;
        }

        sugestoes = data || [];

        atualizarResumo();

        aplicarFiltros();

    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar sugestões:",
            erro
        );

        renderizarEstadoVazio(
            "Erro inesperado ao carregar sugestões."
        );
    }
}

// ========================================
// RESUMO
// ========================================

function atualizarResumo() {

    const pendentes =
        sugestoes.filter(
            item => item.status === "pendente"
        ).length;

    const aprovados =
        sugestoes.filter(
            item => item.status === "aprovado"
        ).length;

    const rejeitados =
        sugestoes.filter(
            item => item.status === "rejeitado"
        ).length;

    atualizarTexto(
        "totalPendentes",
        pendentes
    );

    atualizarTexto(
        "totalAprovados",
        aprovados
    );

    atualizarTexto(
        "totalRejeitados",
        rejeitados
    );
}

// ========================================
// RENDERIZAÇÃO
// ========================================

function renderizarSugestoes() {

    const container =
        document.getElementById(
            "listaSugestoes"
        );

    if (!container) return;

    if (!sugestoesFiltradas.length) {

        container.innerHTML = `

            <div class="sugestao-card empty-card">

                Nenhuma sugestão encontrada para este filtro.

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    sugestoesFiltradas.forEach(item => {

        const status =
            obterStatusVisual(
                item.status
            );

        container.innerHTML += `

            <article class="sugestao-card">

                <div class="sugestao-topo">

                    <div>

                        <div class="sugestao-nome">

                            ${item.nome || "Produto sem nome"}

                        </div>

                        <div class="sugestao-marca">

                            ${item.marca || "Marca não informada"}

                        </div>

                    </div>

                    <span class="status-badge ${status.classe}">

                        ${status.texto}

                    </span>

                </div>

                <div class="sugestao-info">

                    <div class="info-item">

                        <span>
                            Categoria
                        </span>

                        <strong>
                            ${item.categoria || "-"}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Tamanho
                        </span>

                        <strong>
                            ${item.tamanho || "-"}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Unidade
                        </span>

                        <strong>
                            ${item.unidade || "-"}
                        </strong>

                    </div>

                    <div class="info-item">

                        <span>
                            Enviado em
                        </span>

                        <strong>
                            ${formatarData(item.created_at)}
                        </strong>

                    </div>

                </div>

                <div class="sugestao-observacao">

                    <strong>
                        Observação do usuário
                    </strong>

                    <p>
                        ${item.observacao || "Sem observação."}
                    </p>

                </div>

                ${
                    item.admin_observacao
                        ? `
                            <div class="sugestao-observacao">

                                <strong>
                                    Observação do admin
                                </strong>

                                <p>
                                    ${item.admin_observacao}
                                </p>

                            </div>
                        `
                        : ""
                }

                <div class="sugestao-actions">

                    ${
                        item.status === "pendente"
                            ? `
                                <button
                                    class="btn-analisar"
                                    onclick="abrirModalAnalise(${item.id})">

                                    Analisar / editar

                                </button>

                                <button
                                    class="btn-aprovar-rapido"
                                    onclick="aprovarSugestaoRapida(${item.id})">

                                    ✓ Aprovar rápido

                                </button>

                                <button
                                    class="btn-rejeitar-rapido"
                                    onclick="rejeitarSugestaoRapida(${item.id})">

                                    × Rejeitar

                                </button>
                            `
                            : `
                                <button
                                    class="btn-analisar"
                                    onclick="abrirModalAnalise(${item.id})">

                                    Ver detalhes

                                </button>
                            `
                    }

                </div>

            </article>

        `;
    });
}

function renderizarEstadoVazio(mensagem) {

    const container =
        document.getElementById(
            "listaSugestoes"
        );

    if (!container) return;

    container.innerHTML = `

        <div class="sugestao-card empty-card">

            ${mensagem}

        </div>

    `;
}

// ========================================
// MODAL
// ========================================

function abrirModalAnalise(id) {

    const item =
        sugestoes.find(
            sugestao =>
                Number(sugestao.id) ===
                Number(id)
        );

    if (!item) {

        alert(
            "Sugestão não encontrada."
        );

        return;
    }

    atualizarValorCampo(
        "analiseId",
        item.id
    );

    atualizarValorCampo(
        "analiseNome",
        item.nome || ""
    );

    atualizarValorCampo(
        "analiseMarca",
        item.marca || ""
    );

    atualizarValorCampo(
        "analiseCategoria",
        item.categoria || ""
    );

    atualizarValorCampo(
        "analiseTamanho",
        item.tamanho || ""
    );

    atualizarValorCampo(
        "analiseUnidade",
        item.unidade || ""
    );

    atualizarValorCampo(
        "analiseIcone",
        obterIconeSugerido(
            item.categoria,
            item.nome
        )
    );

    atualizarValorCampo(
        "analiseObservacaoAdmin",
        item.admin_observacao || ""
    );

    const modal =
        document.getElementById(
            "modalAnalise"
        );

    if (modal) {

        modal.classList.add("ativo");
    }
}

function fecharModalAnalise() {

    const modal =
        document.getElementById(
            "modalAnalise"
        );

    if (modal) {

        modal.classList.remove("ativo");
    }
}

// ========================================
// APROVAÇÃO RÁPIDA
// ========================================

async function aprovarSugestaoRapida(id) {

    const item =
        sugestoes.find(
            sugestao =>
                Number(sugestao.id) ===
                Number(id)
        );

    if (!item) {

        alert(
            "Sugestão não encontrada."
        );

        return;
    }

    const confirmar =
        confirm(
            `Aprovar "${item.nome}" para o catálogo?`
        );

    if (!confirmar) return;

    await criarProdutoEAprovarSugestao(
        {
            id: item.id,
            nome: item.nome,
            marca: item.marca,
            categoria: item.categoria,
            tamanho: item.tamanho,
            unidade: item.unidade,
            icone: obterIconeSugerido(
                item.categoria,
                item.nome
            ),
            admin_observacao:
                "Aprovado rapidamente pelo admin."
        }
    );
}

// ========================================
// APROVAÇÃO EDITADA
// ========================================

async function aprovarSugestaoEditada() {

    const payload = {

        id:
            Number(
                document
                    .getElementById("analiseId")
                    .value
            ),

        nome:
            document
                .getElementById("analiseNome")
                .value
                .trim(),

        marca:
            document
                .getElementById("analiseMarca")
                .value
                .trim(),

        categoria:
            document
                .getElementById("analiseCategoria")
                .value
                .trim(),

        tamanho:
            document
                .getElementById("analiseTamanho")
                .value
                .trim(),

        unidade:
            document
                .getElementById("analiseUnidade")
                .value
                .trim(),

        icone:
            document
                .getElementById("analiseIcone")
                .value
                .trim(),

        admin_observacao:
            document
                .getElementById("analiseObservacaoAdmin")
                .value
                .trim()
    };

    if (!payload.id) {

        alert(
            "Sugestão inválida."
        );

        return;
    }

    if (!payload.nome) {

        alert(
            "Informe o nome do produto."
        );

        return;
    }

    await criarProdutoEAprovarSugestao(
        payload
    );
}

// ========================================
// CRIAR PRODUTO E APROVAR
// ========================================

async function criarProdutoEAprovarSugestao(payload) {

    try {

        const existe =
            await verificarProdutoExistente(
                payload.nome
            );

        if (existe) {

            const confirmar =
                confirm(
                    "Já existe um produto com nome igual ou muito semelhante. Deseja aprovar mesmo assim?"
                );

            if (!confirmar) return;
        }

        const {
            data: produtoCriado,
            error: produtoError
        } = await supabaseClient
            .from("products")
            .insert({
                nome:
                    payload.nome,

                marca:
                    payload.marca || null,

                categoria:
                    payload.categoria || "Geral",

                tamanho:
                    payload.tamanho || null,

                unidade:
                    payload.unidade || "un",

                icone:
                    payload.icone || "🛒",

                status:
                    "ativo",

                origem:
                    "sugestao_usuario"
            })
            .select()
            .single();

        if (produtoError) {

            console.error(
                "Erro ao criar produto:",
                produtoError
            );

            alert(
                "Erro ao criar produto no catálogo."
            );

            return;
        }

        const {
            error: sugestaoError
        } = await supabaseClient
            .from("product_suggestions")
            .update({
                status:
                    "aprovado",

                approved_product_id:
                    produtoCriado.id,

                admin_observacao:
                    payload.admin_observacao ||
                    "Produto aprovado e incluído no catálogo."
            })
            .eq("id", payload.id);

        if (sugestaoError) {

            console.error(
                "Erro ao atualizar sugestão:",
                sugestaoError
            );

            alert(
                "Produto criado, mas houve erro ao atualizar a sugestão."
            );

            return;
        }

        alert(
            "Produto aprovado e incluído no catálogo."
        );

        fecharModalAnalise();

        await carregarSugestoes();

    } catch (erro) {

        console.error(
            "Erro inesperado ao aprovar sugestão:",
            erro
        );

        alert(
            "Erro inesperado ao aprovar sugestão."
        );
    }
}

// ========================================
// REJEIÇÃO
// ========================================

async function rejeitarSugestaoRapida(id) {

    const item =
        sugestoes.find(
            sugestao =>
                Number(sugestao.id) ===
                Number(id)
        );

    if (!item) {

        alert(
            "Sugestão não encontrada."
        );

        return;
    }

    const observacao =
        prompt(
            `Motivo da rejeição de "${item.nome}":`,
            "Produto duplicado, incompleto ou fora do padrão do catálogo."
        );

    if (observacao === null) return;

    await rejeitarSugestao(
        id,
        observacao
    );
}

async function rejeitarSugestaoAtual() {

    const id =
        Number(
            document
                .getElementById("analiseId")
                .value
        );

    const observacao =
        document
            .getElementById("analiseObservacaoAdmin")
            .value
            .trim() ||
        "Produto rejeitado pelo administrador.";

    if (!id) {

        alert(
            "Sugestão inválida."
        );

        return;
    }

    const confirmar =
        confirm(
            "Deseja rejeitar esta sugestão?"
        );

    if (!confirmar) return;

    await rejeitarSugestao(
        id,
        observacao
    );
}

async function rejeitarSugestao(id, observacao) {

    try {

        const {
            error
        } = await supabaseClient
            .from("product_suggestions")
            .update({
                status:
                    "rejeitado",

                admin_observacao:
                    observacao ||
                    "Produto rejeitado pelo administrador."
            })
            .eq("id", id);

        if (error) {

            console.error(
                "Erro ao rejeitar sugestão:",
                error
            );

            alert(
                "Erro ao rejeitar sugestão."
            );

            return;
        }

        alert(
            "Sugestão rejeitada."
        );

        fecharModalAnalise();

        await carregarSugestoes();

    } catch (erro) {

        console.error(
            "Erro inesperado ao rejeitar sugestão:",
            erro
        );

        alert(
            "Erro inesperado ao rejeitar sugestão."
        );
    }
}

// ========================================
// VERIFICAR DUPLICIDADE
// ========================================

async function verificarProdutoExistente(nome) {

    try {

        const termo =
            nome
                .toLowerCase()
                .trim();

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select("id,nome")
            .ilike(
                "nome",
                `%${termo}%`
            )
            .limit(1);

        if (error) {

            console.error(
                "Erro ao verificar duplicidade:",
                error
            );

            return false;
        }

        return !!(
            data &&
            data.length
        );

    } catch (erro) {

        console.error(
            "Erro inesperado ao verificar duplicidade:",
            erro
        );

        return false;
    }
}

// ========================================
// VISUAIS
// ========================================

function obterStatusVisual(status) {

    if (status === "aprovado") {

        return {
            texto: "Aprovado",
            classe: "status-aprovado"
        };
    }

    if (status === "rejeitado") {

        return {
            texto: "Rejeitado",
            classe: "status-rejeitado"
        };
    }

    return {
        texto: "Pendente",
        classe: "status-pendente"
    };
}

function obterIconeSugerido(
    categoria,
    nome
) {

    const texto =
        [
            categoria,
            nome
        ]
        .join(" ")
        .toLowerCase();

    if (
        texto.includes("arroz")
    ) return "🍚";

    if (
        texto.includes("feijão") ||
        texto.includes("feijao")
    ) return "🫘";

    if (
        texto.includes("café") ||
        texto.includes("cafe")
    ) return "☕";

    if (
        texto.includes("óleo") ||
        texto.includes("oleo")
    ) return "🛢️";

    if (
        texto.includes("leite")
    ) return "🥛";

    if (
        texto.includes("macarrão") ||
        texto.includes("macarrao") ||
        texto.includes("massa")
    ) return "🍝";

    if (
        texto.includes("açúcar") ||
        texto.includes("acucar")
    ) return "🍬";

    if (
        texto.includes("limpeza") ||
        texto.includes("sabão") ||
        texto.includes("sabonete") ||
        texto.includes("detergente")
    ) return "🧼";

    if (
        texto.includes("papel")
    ) return "🧻";

    if (
        texto.includes("carne") ||
        texto.includes("frango")
    ) return "🥩";

    if (
        texto.includes("ovo")
    ) return "🥚";

    if (
        texto.includes("banana")
    ) return "🍌";

    if (
        texto.includes("tomate")
    ) return "🍅";

    if (
        texto.includes("batata")
    ) return "🥔";

    return "🛒";
}

// ========================================
// HELPERS
// ========================================

function atualizarTexto(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.innerText =
            valor;
    }
}

function atualizarValorCampo(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.value =
            valor;
    }
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

// ========================================
// FECHAR MODAL CLICANDO FORA
// ========================================

window.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "modalAnalise"
            );

        if (
            modal &&
            event.target === modal
        ) {

            fecharModalAnalise();
        }
    }
);

// ========================================
// START
// ========================================

iniciar();