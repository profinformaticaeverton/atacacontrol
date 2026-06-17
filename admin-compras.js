// ========================================
// MINHA DISPENSA
// ADMIN COMPRAS
// ========================================

let comprasAdmin = [];
let comprasAdminFiltradas = [];

async function carregarComprasAdmin() {
    try {
        const { data, error } = await supabaseClient
            .from("purchases")
            .select("*, markets(nome), profiles(email)")
            .order("data_compra", { ascending: false });

        if (error) {
            console.error("Erro ao carregar compras:", error);
            alert("Erro ao carregar compras.");
            return;
        }

        comprasAdmin = data || [];
        comprasAdminFiltradas = [...comprasAdmin];

        atualizarResumoCompras();
        renderizarComprasAdmin();

    } catch (erro) {
        console.error("Erro inesperado ao carregar compras:", erro);
        alert("Erro inesperado ao carregar compras.");
    }
}

function configurarFiltrosCompras() {
    ["buscaCompra", "dataInicial", "dataFinal"].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.addEventListener("input", aplicarFiltrosCompras);
    });
}

function aplicarFiltrosCompras() {
    const termo = normalizarTexto(document.getElementById("buscaCompra")?.value || "");
    const dataInicial = document.getElementById("dataInicial")?.value;
    const dataFinal = document.getElementById("dataFinal")?.value;

    comprasAdminFiltradas = comprasAdmin.filter(compra => {
        const texto = normalizarTexto([
            compra.markets?.nome,
            compra.profiles?.email,
            compra.valor_total,
            compra.quantidade_total,
            compra.data_compra
        ].join(" "));

        const okTexto = !termo || texto.includes(termo);
        const okInicio = !dataInicial || compra.data_compra >= dataInicial;
        const okFim = !dataFinal || compra.data_compra <= dataFinal;

        return okTexto && okInicio && okFim;
    });

    atualizarResumoCompras();
    renderizarComprasAdmin();
}

function atualizarResumoCompras() {
    const valor = comprasAdminFiltradas.reduce((total, compra) => total + Number(compra.valor_total || 0), 0);
    const itens = comprasAdminFiltradas.reduce((total, compra) => total + Number(compra.quantidade_total || 0), 0);
    const ticket = comprasAdminFiltradas.length ? valor / comprasAdminFiltradas.length : 0;

    atualizarTexto("comprasTotal", comprasAdminFiltradas.length);
    atualizarTexto("comprasValor", formatarMoeda(valor));
    atualizarTexto("comprasItens", formatarNumero(itens));
    atualizarTexto("comprasTicket", formatarMoeda(ticket));
}

function renderizarComprasAdmin() {
    const container = document.getElementById("listaComprasAdmin");
    if (!container) return;

    if (!comprasAdminFiltradas.length) {
        container.innerHTML = `<div class="item-card empty-card">Nenhuma compra encontrada.</div>`;
        return;
    }

    container.innerHTML = comprasAdminFiltradas.map(compra => `
        <article class="item-card">
            <div class="item-top">
                <div>
                    <div class="item-title">${compra.markets?.nome || "Mercado não informado"}</div>
                    <div class="item-subtitle">${compra.profiles?.email || compra.user_id || "Usuário não identificado"}</div>
                </div>
                <span class="badge badge-ok">${formatarData(compra.data_compra)}</span>
            </div>
            <div class="info-grid">
                <div class="info-item"><span>Total</span><strong>${formatarMoeda(compra.valor_total)}</strong></div>
                <div class="info-item"><span>Itens</span><strong>${formatarNumero(compra.quantidade_total)}</strong></div>
                <div class="info-item"><span>Criada em</span><strong>${formatarDataHora(compra.created_at)}</strong></div>
            </div>
            <div class="actions">
                <button class="btn-primary" onclick="abrirDetalhesCompra(${compra.id})">Ver detalhes</button>
            </div>
        </article>
    `).join("");
}

async function abrirDetalhesCompra(id) {
    const compra = comprasAdmin.find(item => Number(item.id) === Number(id));
    const container = document.getElementById("detalhesCompraAdmin");
    const modal = document.getElementById("modalCompra");

    if (!compra || !container || !modal) return;

    container.innerHTML = `<div class="empty-card">Carregando itens...</div>`;
    modal.classList.add("ativo");

    const { data, error } = await supabaseClient
        .from("purchase_items")
        .select("*, products(nome, marca, categoria)")
        .eq("purchase_id", id);

    if (error) {
        console.error("Erro ao carregar itens:", error);
        container.innerHTML = `<div class="empty-card">Erro ao carregar itens.</div>`;
        return;
    }

    const itens = data || [];

    container.innerHTML = `
        <div class="info-grid">
            <div class="info-item"><span>Mercado</span><strong>${compra.markets?.nome || "-"}</strong></div>
            <div class="info-item"><span>Usuário</span><strong>${compra.profiles?.email || compra.user_id || "-"}</strong></div>
            <div class="info-item"><span>Data</span><strong>${formatarData(compra.data_compra)}</strong></div>
            <div class="info-item"><span>Total</span><strong>${formatarMoeda(compra.valor_total)}</strong></div>
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Produto</th><th>Categoria</th><th>Qtd</th><th>Valor un.</th><th>Subtotal</th></tr></thead>
                <tbody>
                    ${itens.map(item => `
                        <tr>
                            <td>${item.products?.nome || "Produto"}</td>
                            <td>${item.products?.categoria || "-"}</td>
                            <td>${formatarNumero(item.quantidade)}</td>
                            <td>${formatarMoeda(item.valor_unitario)}</td>
                            <td>${formatarMoeda(item.subtotal)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function fecharModalCompra() {
    document.getElementById("modalCompra")?.classList.remove("ativo");
}

window.addEventListener("click", event => {
    const modal = document.getElementById("modalCompra");
    if (modal && event.target === modal) fecharModalCompra();
});

document.addEventListener("DOMContentLoaded", () => {
    iniciarAdminSaas("compras", async () => {
        configurarFiltrosCompras();
        await carregarComprasAdmin();
    });
});
