// ========================================
// MINHA DISPENSA
// ESTATÍSTICAS GERAIS SAAS
// ========================================

async function carregarEstatisticas() {
    try {
        const [usuariosRes, comprasRes, itensRes, precosRes, mercadosRes, produtosRes, sugestoesRes, planejamentosRes, estoqueRes] = await Promise.all([
            supabaseClient.from("profiles").select("*"),
            supabaseClient.from("purchases").select("*, markets(nome)"),
            supabaseClient.from("purchase_items").select("quantidade, subtotal"),
            supabaseClient.from("product_prices").select("*"),
            supabaseClient.from("markets").select("*"),
            supabaseClient.from("products").select("*"),
            supabaseClient.from("product_suggestions").select("*"),
            supabaseClient.from("monthly_planning").select("*"),
            supabaseClient.from("pantry_stock").select("*")
        ]);

        const usuarios = usuariosRes.data || [];
        const compras = comprasRes.data || [];
        const itens = itensRes.data || [];
        const precos = precosRes.data || [];
        const mercados = mercadosRes.data || [];
        const produtos = produtosRes.data || [];
        const sugestoes = sugestoesRes.data || [];
        const planejamentos = planejamentosRes.data || [];
        const estoque = estoqueRes.data || [];

        const gmv = compras.reduce((total, compra) => total + Number(compra.valor_total || 0), 0);
        const usuariosAtivos = new Set(compras.map(compra => compra.user_id)).size;
        const totalItens = itens.reduce((total, item) => total + Number(item.quantidade || 0), 0);

        atualizarTexto("statGmv", formatarMoeda(gmv));
        atualizarTexto("statUsuariosAtivos", usuariosAtivos);
        atualizarTexto("statItens", formatarNumero(totalItens));
        atualizarTexto("statPrecos", precos.length);

        renderizarBarrasModulos({ usuarios, compras, itens, precos, mercados, produtos, sugestoes, planejamentos, estoque });
        renderizarBarrasCategorias(produtos);
        renderizarBarrasMercados(compras);
        renderizarTabelaIndicadores({ usuarios, compras, itens, precos, mercados, produtos, sugestoes, planejamentos, estoque, gmv, usuariosAtivos, totalItens });

    } catch (erro) {
        console.error("Erro ao carregar estatísticas:", erro);
        alert("Erro ao carregar estatísticas gerais.");
    }
}

function renderizarBarrasModulos(dados) {
    const itens = [
        { nome: "Usuários", valor: dados.usuarios.length },
        { nome: "Compras", valor: dados.compras.length },
        { nome: "Itens", valor: dados.itens.length },
        { nome: "Preços", valor: dados.precos.length },
        { nome: "Mercados", valor: dados.mercados.length },
        { nome: "Produtos", valor: dados.produtos.length },
        { nome: "Sugestões", valor: dados.sugestoes.length },
        { nome: "Planejamentos", valor: dados.planejamentos.length },
        { nome: "Estoque", valor: dados.estoque.length }
    ];

    renderizarBarras("barrasModulos", itens, "nome", "valor");
}

function renderizarBarrasCategorias(produtos) {
    const mapa = {};

    produtos.forEach(produto => {
        const categoria = produto.categoria || "Sem categoria";
        mapa[categoria] = (mapa[categoria] || 0) + 1;
    });

    const itens = Object.entries(mapa)
        .map(([nome, valor]) => ({ nome, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 12);

    renderizarBarras("barrasCategorias", itens, "nome", "valor");
}

function renderizarBarrasMercados(compras) {
    const mapa = {};

    compras.forEach(compra => {
        const nome = compra.markets?.nome || "Mercado não informado";
        mapa[nome] = (mapa[nome] || 0) + 1;
    });

    const itens = Object.entries(mapa)
        .map(([nome, valor]) => ({ nome, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 12);

    renderizarBarras("barrasMercados", itens, "nome", "valor");
}

function renderizarTabelaIndicadores(dados) {
    const tbody = document.getElementById("tabelaIndicadores");
    if (!tbody) return;

    const ticketMedio = dados.compras.length ? dados.gmv / dados.compras.length : 0;
    const itensPorCompra = dados.compras.length ? dados.totalItens / dados.compras.length : 0;
    const produtosAtivos = dados.produtos.filter(item => item.status === "ativo").length;
    const sugestoesPendentes = dados.sugestoes.filter(item => item.status === "pendente").length;
    const usuariosAdmin = dados.usuarios.filter(item => item.role === "admin").length;

    const linhas = [
        ["GMV total", formatarMoeda(dados.gmv), "Soma de todas as compras registradas"],
        ["Compras registradas", formatarNumero(dados.compras.length), "Volume total de compras"],
        ["Ticket médio", formatarMoeda(ticketMedio), "Valor médio por compra"],
        ["Itens por compra", formatarNumero(itensPorCompra), "Quantidade média por compra"],
        ["Usuários cadastrados", formatarNumero(dados.usuarios.length), "Total em profiles"],
        ["Usuários ativos", formatarNumero(dados.usuariosAtivos), "Usuários com pelo menos uma compra"],
        ["Administradores", formatarNumero(usuariosAdmin), "Perfis com role admin"],
        ["Produtos ativos", formatarNumero(produtosAtivos), "Catálogo disponível para compra"],
        ["Sugestões pendentes", formatarNumero(sugestoesPendentes), "Aguardando curadoria"],
        ["Mercados", formatarNumero(dados.mercados.length), "Mercados cadastrados"],
        ["Registros de preço", formatarNumero(dados.precos.length), "Base para economia inteligente"],
        ["Planejamentos", formatarNumero(dados.planejamentos.length), "Metas mensais cadastradas"],
        ["Itens em estoque", formatarNumero(dados.estoque.length), "Registros em pantry_stock"]
    ];

    tbody.innerHTML = linhas.map(linha => `
        <tr>
            <td>${linha[0]}</td>
            <td><strong>${linha[1]}</strong></td>
            <td>${linha[2]}</td>
        </tr>
    `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    iniciarAdminSaas("estatisticas", carregarEstatisticas);
});
