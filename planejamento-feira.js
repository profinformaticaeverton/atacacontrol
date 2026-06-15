// ========================================
// MINHA DISPENSA
// PLANEJAMENTO DA FEIRA
// ========================================

let usuarioAtual = null;
let planejamentoAtual = null;

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

        definirMesAtual();

        await carregarPlanejamento();

    } catch (erro) {

        console.error(
            "Erro ao iniciar planejamento:",
            erro
        );

        alert(
            "Erro ao carregar planejamento."
        );
    }
}

// ========================================
// DEFINIR MÊS ATUAL
// ========================================

function definirMesAtual() {

    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(2, "0");

    const campoMes =
        document.getElementById(
            "mesReferencia"
        );

    if (campoMes) {

        campoMes.value =
            `${ano}-${mes}`;
    }
}

// ========================================
// CARREGAR DADOS
// ========================================

async function carregarPlanejamento() {

    try {

        const mesReferencia =
            document.getElementById(
                "mesReferencia"
            ).value;

        await carregarPlanejamentoSalvo(
            mesReferencia
        );

        const resumo =
            await obterResumoMensal(
                mesReferencia
            );

        const itensRepor =
            await obterItensReposicao();

        atualizarResumoFinanceiro(
            resumo
        );

        atualizarIndicadores(
            resumo,
            itensRepor
        );

        atualizarStatus(
            resumo
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar planejamento:",
            erro
        );
    }
}

// ========================================
// PLANEJAMENTO SALVO
// ========================================

async function carregarPlanejamentoSalvo(
    mesReferencia
) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from(
                "monthly_planning"
            )
            .select("*")
            .eq(
                "user_id",
                usuarioAtual.id
            )
            .eq(
                "mes_referencia",
                mesReferencia
            )
            .maybeSingle();

        if (error) {

            console.error(error);

            return;
        }

        planejamentoAtual = data;

        if (data) {

            document.getElementById(
                "valorOrcamento"
            ).value =
                data.orcamento_mensal;
        }

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// RESUMO MENSAL
// ========================================

async function obterResumoMensal(
    mesReferencia
) {

    const inicioMes =
        `${mesReferencia}-01`;

    const dataInicio =
        new Date(
            `${inicioMes}T00:00:00`
        );

    const dataFim =
        new Date(
            dataInicio.getFullYear(),
            dataInicio.getMonth() + 1,
            0
        );

    const fimMes =
        dataFim
            .toISOString()
            .split("T")[0];

    const {
        data,
        error
    } = await supabaseClient
        .from("purchases")
        .select("*")
        .eq(
            "user_id",
            usuarioAtual.id
        )
        .gte(
            "data_compra",
            inicioMes
        )
        .lte(
            "data_compra",
            fimMes
        );

    if (error) {

        console.error(error);

        return {
            compras: [],
            total: 0,
            media: 0,
            maiorCompra: 0
        };
    }

    const compras =
        data || [];

    const total =
        compras.reduce(
            (
                acumulado,
                compra
            ) =>
                acumulado +
                Number(
                    compra.valor_total || 0
                ),
            0
        );

    const media =
        compras.length > 0
            ? total / compras.length
            : 0;

    let maiorCompra = 0;

    compras.forEach(compra => {

        const valor =
            Number(
                compra.valor_total || 0
            );

        if (
            valor > maiorCompra
        ) {

            maiorCompra =
                valor;
        }
    });

    return {
        compras,
        total,
        media,
        maiorCompra
    };
}

// ========================================
// ITENS PARA REPOSIÇÃO
// ========================================

async function obterItensReposicao() {

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
            );

        if (error) {

            console.error(error);

            return 0;
        }

        return (
            data || []
        ).length;

    } catch (erro) {

        console.error(
            erro
        );

        return 0;
    }
}

// ========================================
// ATUALIZAR RESUMO
// ========================================

function atualizarResumoFinanceiro(
    resumo
) {

    const orcamento =
        Number(
            planejamentoAtual?.orcamento_mensal || 0
        );

    const saldo =
        Math.max(
            orcamento -
            resumo.total,
            0
        );

    atualizarTexto(
        "orcamentoMes",
        formatarMoeda(
            orcamento
        )
    );

    atualizarTexto(
        "gastoAtual",
        formatarMoeda(
            resumo.total
        )
    );

    atualizarTexto(
        "saldoDisponivel",
        formatarMoeda(
            saldo
        )
    );
}

// ========================================
// INDICADORES
// ========================================

function atualizarIndicadores(
    resumo,
    itensRepor
) {

    atualizarTexto(
        "comprasMes",
        resumo.compras.length
    );

    atualizarTexto(
        "maiorCompraMes",
        formatarMoeda(
            resumo.maiorCompra
        )
    );

    atualizarTexto(
        "mediaCompra",
        formatarMoeda(
            resumo.media
        )
    );

    atualizarTexto(
        "itensRepor",
        itensRepor
    );
}

// ========================================
// STATUS
// ========================================

function atualizarStatus(
    resumo
) {

    const orcamento =
        Number(
            planejamentoAtual?.orcamento_mensal || 0
        );

    const titulo =
        document.getElementById(
            "statusTitulo"
        );

    const texto =
        document.getElementById(
            "statusTexto"
        );

    const percentualTexto =
        document.getElementById(
            "percentualUso"
        );

    const barra =
        document.getElementById(
            "barraUso"
        );

    if (
        !orcamento
    ) {

        titulo.innerText =
            "Planejamento ainda não definido";

        texto.innerText =
            "Cadastre um orçamento mensal para acompanhar sua feira.";

        percentualTexto.innerText =
            "0%";

        barra.style.width =
            "0%";

        return;
    }

    const percentual =
        Math.round(
            (
                resumo.total /
                orcamento
            ) * 100
        );

    percentualTexto.innerText =
        `${percentual}%`;

    barra.style.width =
        `${Math.min(percentual, 100)}%`;

    barra.classList.remove(
        "alerta",
        "estourou"
    );

    if (
        percentual >= 100
    ) {

        barra.classList.add(
            "estourou"
        );

        titulo.innerText =
            "Orçamento estourado";

        texto.innerText =
            "Você ultrapassou a meta definida para este mês.";

        return;
    }

    if (
        percentual >= 80
    ) {

        barra.classList.add(
            "alerta"
        );

        titulo.innerText =
            "Atenção ao orçamento";

        texto.innerText =
            "Você já utilizou mais de 80% do orçamento mensal.";

        return;
    }

    titulo.innerText =
        "Planejamento dentro da meta";

    texto.innerText =
        "Os gastos estão dentro do valor planejado.";
}

// ========================================
// SALVAR
// ========================================

async function salvarPlanejamento() {

    try {

        const orcamento =
            Number(
                document.getElementById(
                    "valorOrcamento"
                ).value
            );

        const mesReferencia =
            document.getElementById(
                "mesReferencia"
            ).value;

        if (
            !orcamento ||
            orcamento <= 0
        ) {

            alert(
                "Informe um orçamento válido."
            );

            return;
        }

        const payload = {

            user_id:
                usuarioAtual.id,

            mes_referencia:
                mesReferencia,

            orcamento_mensal:
                orcamento
        };

        const {
            error
        } = await supabaseClient
            .from(
                "monthly_planning"
            )
            .upsert(
                payload,
                {
                    onConflict:
                        "user_id,mes_referencia"
                }
            );

        if (error) {

            console.error(error);

            alert(
                "Erro ao salvar planejamento."
            );

            return;
        }

        alert(
            "Planejamento salvo com sucesso."
        );

        await carregarPlanejamento();

    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Erro inesperado ao salvar."
        );
    }
}

// ========================================
// HELPERS
// ========================================

function atualizarTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );

    if (elemento) {

        elemento.innerText =
            valor;
    }
}

function formatarMoeda(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

// ========================================
// EVENTOS
// ========================================

document.addEventListener(
    "change",
    async event => {

        if (
            event.target.id ===
            "mesReferencia"
        ) {

            await carregarPlanejamento();
        }
    }
);

// ========================================
// START
// ========================================

iniciar();