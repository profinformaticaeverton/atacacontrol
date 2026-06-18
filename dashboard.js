// dashboard.js

const ADMIN_EMAILS = [
    "vetao_8@yahoo.com.br",
    "eroscupido.ia@gmail.com"
];

async function verificarSessao() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "index.html";
        return;
    }

    const user = session.user;

    const userEmail = document.getElementById("userEmail");
    if (userEmail) userEmail.innerText = user.email;

    const perfil = await verificarPerfil(user);
    configurarAcessoAdmin(user, perfil);

    await carregarDashboard(user);
    await carregarDispensa(user);
    await carregarPlanejamentoDashboard(user);
    await carregarEconomiaDashboard(user);

    iniciarMenuMobile();
}

async function verificarPerfil(user) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Erro ao verificar perfil:", error);
        return null;
    }

    if (!data) {
        const novoPerfil = {
            id: user.id,
            email: user.email,
            role: ADMIN_EMAILS.includes(user.email) ? "admin" : "user"
        };

        await supabaseClient
            .from("profiles")
            .insert(novoPerfil);

        return novoPerfil;
    }

    return data;
}

function configurarAcessoAdmin(user, perfil) {
    const role = String(perfil?.role || "").toLowerCase().trim();
    const email = String(user?.email || "").toLowerCase().trim();

    const isAdmin =
        role === "admin" ||
        role === "administrador" ||
        role === "owner" ||
        role === "superadmin" ||
        ADMIN_EMAILS.includes(email);

    console.log("Admin check:", { email, role, isAdmin });

    if (!isAdmin) return;

    garantirMenuAdminProdutos();
    garantirBotaoAdminProdutos();
    garantirPainelAdminProdutos();
}

function garantirMenuAdminProdutos() {
    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;

    if (document.getElementById("adminProdutosMenu")) {
        document.getElementById("adminProdutosMenu").style.display = "";
        return;
    }

    const btn = document.createElement("button");
    btn.className = "menu-btn";
    btn.id = "adminProdutosMenu";
    btn.onclick = () => window.location.href = "admin-produtos.html";
    btn.innerHTML = "<span>⚙</span> Admin Produtos";
    nav.appendChild(btn);
}

function garantirBotaoAdminProdutos() {
    const acoes = document.querySelector(".acoes");
    if (!acoes) return;

    if (document.getElementById("adminProdutosAcao")) {
        document.getElementById("adminProdutosAcao").style.display = "";
        return;
    }

    const btn = document.createElement("button");
    btn.id = "adminProdutosAcao";
    btn.onclick = () => window.location.href = "admin-produtos.html";
    btn.innerHTML = "<span>⚙</span> Admin Produtos";
    acoes.appendChild(btn);
}

function garantirPainelAdminProdutos() {
    const content = document.querySelector(".content");
    if (!content || document.getElementById("adminProdutosPanel")) return;

    const panel = document.createElement("section");
    panel.className = "panel";
    panel.id = "adminProdutosPanel";

    panel.innerHTML = `
        <div class="panel-header">
            <div>
                <span class="page-label">Administração SaaS</span>
                <h2>Curadoria de Produtos</h2>
            </div>

            <button class="panel-link" onclick="window.location.href='admin-produtos.html'">
                Abrir admin
            </button>
        </div>

        <div class="planejamento-resumo">
            <article class="planejamento-card-resumo">
                <div class="planejamento-status status-neutro">
                    ⚙ Produtos sugeridos
                </div>

                <p>
                    Aprove, edite ou rejeite produtos enviados pelos usuários
                    antes de liberar no catálogo geral.
                </p>

                <button onclick="window.location.href='admin-produtos.html'">
                    Gerenciar Produtos
                </button>
            </article>
        </div>
    `;

    const primeiroPanel = document.querySelector(".panel");
    if (primeiroPanel) {
        content.insertBefore(panel, primeiroPanel);
    } else {
        content.appendChild(panel);
    }
}

async function carregarDashboard(user) {
    const hoje = new Date();
    const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        .toISOString()
        .split("T")[0];

    const { data: compras, error } = await supabaseClient
        .from("purchases")
        .select("*, markets(nome)")
        .eq("user_id", user.id)
        .order("data_compra", { ascending: false });

    if (error) {
        console.error(error);
        renderizarUltimasCompras([]);
        return;
    }

    const lista = compras || [];
    const comprasMes = lista.filter(c => c.data_compra >= dataInicio);

    const totalMes = comprasMes.reduce((t, c) => t + Number(c.valor_total || 0), 0);
    const maiorCompra = lista.reduce((m, c) => Math.max(m, Number(c.valor_total || 0)), 0);

    const { data: itens } = await supabaseClient
        .from("purchase_items")
        .select("quantidade, purchases!inner(user_id)")
        .eq("purchases.user_id", user.id);

    const qtdProdutos = (itens || []).reduce((t, i) => t + Number(i.quantidade || 0), 0);

    atualizarCard("totalMes", formatarMoeda(totalMes));
    atualizarCard("qtdCompras", lista.length);
    atualizarCard("qtdProdutos", formatarQuantidade(qtdProdutos));
    atualizarCard("maiorCompra", formatarMoeda(maiorCompra));

    renderizarUltimasCompras(lista.slice(0, 10));
}

async function carregarDispensa(user) {
    const { data, error } = await supabaseClient
        .from("v_pantry_stock")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .order("produto_nome", { ascending: true });

    if (error) {
        console.error(error);
        atualizarResumoDispensa([]);
        renderizarDispensa([]);
        return;
    }

    atualizarResumoDispensa(data || []);
    renderizarDispensa(data || []);
}

function atualizarResumoDispensa(estoque) {
    atualizarCard("itensDispensa", estoque.length);
    atualizarCard("itensRepor", estoque.filter(i => i.status_estoque === "repor").length);
    atualizarCard("itensSemEstoque", estoque.filter(i => i.status_estoque === "sem_estoque").length);
    atualizarCard("itensEstoqueOk", estoque.filter(i => i.status_estoque === "ok").length);
}

async function carregarPlanejamentoDashboard(user) {
    const hoje = new Date();
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

    const itensLista = await obterTotalItensListaCompras(user);
    atualizarCard("listaInteligenteDashboard", itensLista);

    const { data } = await supabaseClient
        .from("v_monthly_planning_summary")
        .select("*")
        .eq("user_id", user.id)
        .eq("mes_referencia", mesReferencia)
        .maybeSingle();

    if (!data) {
        renderizarPlanejamentoVazio(itensLista);
        return;
    }

    atualizarCard("orcamentoDashboard", formatarMoeda(data.orcamento_mensal));
    atualizarCard("gastoDashboard", formatarMoeda(data.gasto_atual));
    atualizarCard("saldoDashboard", formatarMoeda(data.saldo_disponivel));
    atualizarCard("statusDashboard", traduzirStatusPlanejamento(data.status_planejamento));

    renderizarBlocoPlanejamento(data, itensLista);
}

async function obterTotalItensListaCompras(user) {
    const { data } = await supabaseClient
        .from("v_pantry_stock")
        .select("id")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .in("status_estoque", ["repor", "sem_estoque"]);

    return (data || []).length;
}

function renderizarPlanejamentoVazio(itensLista = 0) {
    atualizarCard("orcamentoDashboard", "R$ 0,00");
    atualizarCard("gastoDashboard", "R$ 0,00");
    atualizarCard("saldoDashboard", "R$ 0,00");
    atualizarCard("statusDashboard", "Sem meta");

    const c = document.getElementById("planejamentoResumo");
    if (!c) return;

    c.innerHTML = `
        <article class="planejamento-card-resumo">
            <div class="planejamento-status status-neutro">◎ Planejamento não definido</div>
            <p>Cadastre uma meta mensal. Hoje existem <strong>${itensLista}</strong> itens para reposição.</p>
            <button onclick="window.location.href='planejamento-feira.html'">Criar planejamento</button>
        </article>
    `;
}

function renderizarBlocoPlanejamento(p, itensLista) {
    const c = document.getElementById("planejamentoResumo");
    if (!c) return;

    const classe = obterClassePlanejamento(p.status_planejamento);
    const percentual = Number(p.percentual_uso || 0);

    c.innerHTML = `
        <article class="planejamento-card-resumo">
            <div class="planejamento-status ${classe}">
                ${traduzirStatusPlanejamento(p.status_planejamento)}
            </div>

            <div class="planejamento-progress">
                <div class="planejamento-progress-topo">
                    <span>Uso do orçamento</span>
                    <strong>${percentual}%</strong>
                </div>
                <div class="planejamento-barra">
                    <div class="planejamento-barra-fill ${classe}" style="width:${Math.min(percentual, 100)}%"></div>
                </div>
            </div>

            <p>Você possui <strong>${itensLista}</strong> itens para repor. Saldo: <strong>${formatarMoeda(p.saldo_disponivel)}</strong>.</p>
            <button onclick="window.location.href='planejamento-feira.html'">Ver planejamento</button>
        </article>
    `;
}

async function carregarEconomiaDashboard() {
    const { data } = await supabaseClient
        .from("product_prices")
        .select("*")
        .order("created_at", { ascending: true });

    const analise = montarAnaliseEconomiaDashboard(data || []);
    const alta = analise.filter(i => i.tipo_variacao === "alta").length;
    const queda = analise.filter(i => i.tipo_variacao === "queda").length;
    const economia = analise.reduce((t, i) => t + Number(i.economia_possivel || 0), 0);

    atualizarCard("economiaAltaDashboard", alta);
    atualizarCard("economiaQuedaDashboard", queda);
    atualizarCard("economiaPotencialDashboard", formatarMoeda(economia));

    renderizarResumoEconomiaDashboard(analise, alta, queda, economia);
}

function montarAnaliseEconomiaDashboard(precos) {
    const mapa = {};

    precos.forEach(p => {
        if (!p.product_id || isNaN(Number(p.price))) return;
        if (!mapa[p.product_id]) mapa[p.product_id] = [];
        mapa[p.product_id].push(p);
    });

    return Object.keys(mapa).map(id => {
        const h = mapa[id].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        if (h.length < 2) return null;

        const primeiro = h[0];
        const ultimo = h[h.length - 1];
        const menor = h.reduce((m, i) => Number(i.price) < Number(m.price) ? i : m, h[0]);

        const inicial = Number(primeiro.price);
        const atual = Number(ultimo.price);
        const dif = atual - inicial;

        return {
            tipo_variacao: dif > 0 ? "alta" : dif < 0 ? "queda" : "igual",
            economia_possivel: atual > Number(menor.price) ? atual - Number(menor.price) : 0
        };
    }).filter(Boolean);
}

function renderizarResumoEconomiaDashboard(analise, alta, queda, economia) {
    const c = document.getElementById("economiaResumo");
    if (!c) return;

    if (!analise.length) {
        c.innerHTML = `
            <article class="planejamento-card-resumo">
                <div class="planejamento-status status-neutro">↕ Economia ainda sem dados</div>
                <p>Registre pelo menos duas compras com os mesmos produtos.</p>
                <button onclick="window.location.href='nova-compra.html'">Registrar compra</button>
            </article>
        `;
        return;
    }

    c.innerHTML = `
        <article class="planejamento-card-resumo">
            <div class="planejamento-status status-neutro">↕ Resumo de preços</div>
            <p>Alta: <strong>${alta}</strong>. Queda: <strong>${queda}</strong>. Economia potencial: <strong>${formatarMoeda(economia)}</strong>.</p>
            <button onclick="window.location.href='economia.html'">Ver economia</button>
        </article>
    `;
}

function renderizarDispensa(estoque) {
    const c = document.getElementById("listaDispensa");
    if (!c) return;

    if (!estoque.length) {
        c.innerHTML = `<div class="dispensa-card empty-card">Nenhum item na dispensa ainda.</div>`;
        return;
    }

    c.innerHTML = estoque.slice(0, 8).map(item => {
        const s = obterStatusDispensa(item.status_estoque);
        return `
            <article class="dispensa-card">
                <div class="dispensa-topo">
                    <div class="dispensa-produto">${item.produto_nome || "Produto"}</div>
                    <span class="dispensa-status ${s.classe}">${s.texto}</span>
                </div>
                <div class="dispensa-info">
                    <div>Quantidade atual: <strong>${formatarQuantidade(item.quantidade_atual)} ${item.unidade || "un"}</strong></div>
                    <div>Quantidade mínima: <strong>${formatarQuantidade(item.quantidade_minima)} ${item.unidade || "un"}</strong></div>
                </div>
            </article>
        `;
    }).join("");
}

function renderizarUltimasCompras(compras) {
    const c = document.getElementById("ultimasCompras");
    if (!c) return;

    if (!compras.length) {
        c.innerHTML = `<div class="compra-card empty-card">Nenhuma compra encontrada.</div>`;
        return;
    }

    c.innerHTML = compras.map(compra => `
        <article class="compra-card">
            <div class="compra-data">📅 ${formatarData(compra.data_compra)}</div>
            <div class="compra-mercado">🏪 ${compra.markets?.nome || "Mercado não informado"}</div>
            <div class="compra-itens">🛒 ${formatarQuantidade(compra.quantidade_total || 0)} itens registrados</div>
            <div class="compra-total">${formatarMoeda(compra.valor_total || 0)}</div>
        </article>
    `).join("");
}

function iniciarMenuMobile() {
    const menu = document.getElementById("menuMobile");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (!menu || !sidebar || !overlay) return;

    menu.onclick = () => {
        sidebar.classList.toggle("aberto");
        overlay.classList.toggle("ativo");
    };

    overlay.onclick = () => {
        sidebar.classList.remove("aberto");
        overlay.classList.remove("ativo");
    };
}

function obterStatusDispensa(status) {
    if (status === "sem_estoque") return { texto: "Sem estoque", classe: "status-sem-estoque" };
    if (status === "repor") return { texto: "Repor", classe: "status-repor" };
    return { texto: "OK", classe: "status-ok" };
}

function traduzirStatusPlanejamento(status) {
    if (status === "estourado") return "Estourado";
    if (status === "alerta") return "Atenção";
    if (status === "ok") return "Dentro da meta";
    return "Sem meta";
}

function obterClassePlanejamento(status) {
    if (status === "estourado") return "status-estourado";
    if (status === "alerta") return "status-alerta";
    if (status === "ok") return "status-ok-planejamento";
    return "status-neutro";
}

function atualizarCard(id, valor) {
    const e = document.getElementById(id);
    if (e) e.innerText = valor;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarQuantidade(valor) {
    const n = Number(valor || 0);
    return n.toLocaleString("pt-BR", {
        minimumFractionDigits: n % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    });
}

function formatarData(data) {
    if (!data) return "Data não informada";
    return new Date(data).toLocaleDateString("pt-BR");
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}

verificarSessao();