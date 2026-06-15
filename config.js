// ========================================
// MINHA DISPENSA
// CONFIGURAÇÃO GLOBAL SUPABASE
// ========================================

// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL =
    "https://frwhvwkjtysmuvekfsal.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_nR2N6qrRv-HY93tRYC0D7A_swgNNY1z";

// ========================================
// CLIENTE
// ========================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

// ========================================
// CONFIGURAÇÕES GLOBAIS
// ========================================

const APP_CONFIG = {

    nome: "Minha Dispensa",

    slogan:
        "a feira do mês controlada",

    versao: "1.0.0",

    moeda: "BRL",

    locale: "pt-BR",

    quantidadeDecimal: 2,

    cacheDiasHistorico: 90
};

// ========================================
// FORMATAÇÃO
// ========================================

function formatarMoedaGlobal(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        APP_CONFIG.locale,
        {
            style: "currency",
            currency:
                APP_CONFIG.moeda
        }
    );
}

function formatarNumeroGlobal(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        APP_CONFIG.locale,
        {
            minimumFractionDigits: 0,
            maximumFractionDigits:
                APP_CONFIG.quantidadeDecimal
        }
    );
}

function formatarDataGlobal(
    data
) {

    if (!data) {

        return "-";
    }

    return new Date(data)
        .toLocaleDateString(
            APP_CONFIG.locale
        );
}

// ========================================
// DATA ATUAL
// ========================================

function obterMesAtual() {

    const hoje =
        new Date();

    return `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
    ).padStart(2, "0")}`;
}

function obterDataAtual() {

    return new Date()
        .toISOString()
        .split("T")[0];
}

// ========================================
// AUTENTICAÇÃO
// ========================================

async function obterUsuarioAtual() {

    const {
        data: { session }
    } =
        await supabaseClient
            .auth
            .getSession();

    return session?.user || null;
}

async function usuarioLogado() {

    const usuario =
        await obterUsuarioAtual();

    return !!usuario;
}

async function verificarAutenticacao() {

    const usuario =
        await obterUsuarioAtual();

    if (!usuario) {

        window.location.href =
            "index.html";

        return null;
    }

    return usuario;
}

// ========================================
// LOGOUT GLOBAL
// ========================================

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    window.location.href =
        "index.html";
}

// ========================================
// NOTIFICAÇÕES
// ========================================

function sucesso(
    mensagem
) {

    alert(mensagem);
}

function erro(
    mensagem
) {

    alert(mensagem);
}

// ========================================
// DEBUG
// ========================================

console.log(
    `${APP_CONFIG.nome} | ${APP_CONFIG.slogan}`
);

console.log(
    `Versão: ${APP_CONFIG.versao}`
);