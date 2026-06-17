// ========================================
// MINHA DISPENSA
// DASHBOARD SAAS ADMINISTRATIVO
// ========================================

async function carregarDashboardSaas() {
    try {
        const [usuariosRes, comprasRes, itensRes, mercadosRes, produtosRes, sugestoesRes, planejamentoRes] = await Promise.all([
            supabaseClient.from("profiles").select("*"),
            supabaseClient.from("purchases").select("*, markets(nome)"),
            supabaseClient.from("purchase_items").select("quantidade"),
            supabaseClient.from("markets").select("*"),
            supabaseClient.from("products").select("*"),
            supabaseClient.from("product_suggestions").select("*"),
            supabaseClient.from("monthly_planning").select("*")
        ]);

        const usuarios = usuariosRes.data || [];
        const compras = comprasRes.data || [];
        const itens = itensRes.data || [];
        const mercados = mercadosRes.data || [];
        const produtos = produtosRes.data || [];
        const sugestoes = sugestoesRes.data || [];
        const planejamentos = planejamentoRes.data || [];

        const gmv = compras.reduce((total, item) => total + Number(item.valor_total || 0), 0);
        const totalItens = itens.reduce((total, item) => total + Number(item.quantidade || 0), 0);
        const sugestoesPendentes = sugestoes.filter(item => item.status === "pendente").length;

        atualizarTexto("totalUsuarios", usuarios.length);
        atualizarTexto("totalCompras", compras.length);
        atualizarTexto("gmvTotal", formatarMoeda(gmv));
        atualizarTexto("sugestoesPendentes", sugestoesPendentes);
        atualizarTexto("totalMercados", mercados.length);
        atualizarTexto("totalProdutos", produtos.length);
        atualizarTexto("totalItens", formatarNumero(totalItens));
        atualizarTexto("totalPlanejamentos", planejamentos.length);

        renderizarResumoModulos({ usuarios, compras, mercados, produtos, sugestoes, planejamentos });
        renderizarRankingMercados(compras);

    } catch (erro) {
        console.error("Erro ao carregar Dashboard SaaS:", erro);
        alert("Erro ao carregar Dashboard SaaS.");
    }
}

function renderizarResumoModulos(dados) {
    const container = document.getElementById("resumoModulos");
    if (!container) return;

    const modulos = [
        { titulo: "Usuários", subtitulo: "Perfis cadastrados", valor: dados.usuarios.length, status: "ativo", link: "admin-usuarios.html" },
        { titulo: "Compras", subtitulo: "Registros de compras", valor: dados.compras.length, status: "ativo", link: "admin-compras.html" },
        { titulo: "Mercados", subtitulo: "Locais cadastrados", valor: dados.mercados.length, status: "ativo", link: "admin-mercados.html" },
        { titulo: "Produtos", subtitulo: "Catálogo geral", valor: dados.produtos.length, status: "ativo", link: "admin-produtos.html" },
        { titulo: "Sugestões", subtitulo: "Produtos enviados pelos usuários", valor: dados.sugestoes.length, status: dados.sugestoes.some(s => s.status === "pendente") ? "pendente" : "ok", link: "admin-produtos.html" },
        { titulo: "Planejamentos", subtitulo: "Metas mensais cadastradas", valor: dados.planejamentos.length, status: "ativo", link: "estatisticas-gerais.html" }
    ];

    container.innerHTML = modulos.map(modulo => {
        const badge = statusBadge(modulo.status);
        return `
            <article class="item-card">
                <div class="item-top">
                    <div>
                        <div class="item-title">${modulo.titulo}</div>
                        <div class="item-subtitle">${modulo.subtitulo}</div>
                    </div>
                    <span class="badge ${badge.classe}">${badge.texto}</span>
                </div>
                <div class="info-grid">
                    <div class="info-item"><span>Total</span><strong>${formatarNumero(modulo.valor)}</strong></div>
                </div>
                <div class="actions">
                    <button class="btn-primary" onclick="window.location.href='${modulo.link}'">Abrir módulo</button>
                </div>
            </article>
        `;
    }).join("");
}

function renderizarRankingMercados(compras) {
    const mapa = {};

    compras.forEach(compra => {
        const nome = compra.markets?.nome || "Mercado não informado";
        if (!mapa[nome]) mapa[nome] = { nome, compras: 0, valor: 0 };
        mapa[nome].compras += 1;
        mapa[nome].valor += Number(compra.valor_total || 0);
    });

    const ranking = Object.values(mapa)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8)
        .map(item => ({ nome: item.nome, valor: item.valor }));

    renderizarBarras("rankingMercados", ranking, "nome", "valor");
}

document.addEventListener("DOMContentLoaded", () => {
    iniciarAdminSaas("dashboard-saas", carregarDashboardSaas);
});
