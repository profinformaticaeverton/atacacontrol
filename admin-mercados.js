// ========================================
// MINHA DISPENSA
// ADMIN MERCADOS
// ========================================

let mercadosAdmin = [];
let comprasMercados = [];
let mercadosFiltrados = [];

async function carregarMercadosAdmin() {
    try {
        const [mercadosRes, comprasRes] = await Promise.all([
            supabaseClient.from("markets").select("*").order("nome", { ascending: true }),
            supabaseClient.from("purchases").select("market_id, valor_total")
        ]);

        if (mercadosRes.error) {
            console.error("Erro ao carregar mercados:", mercadosRes.error);
            alert("Erro ao carregar mercados.");
            return;
        }

        mercadosAdmin = mercadosRes.data || [];
        comprasMercados = comprasRes.data || [];

        atualizarResumoMercados();
        aplicarFiltrosMercados();

    } catch (erro) {
        console.error("Erro inesperado ao carregar mercados:", erro);
        alert("Erro inesperado ao carregar mercados.");
    }
}

function configurarFiltrosMercados() {
    const busca = document.getElementById("buscaMercado");
    const ordenar = document.getElementById("ordenarMercados");

    if (busca) busca.addEventListener("input", aplicarFiltrosMercados);
    if (ordenar) ordenar.addEventListener("change", aplicarFiltrosMercados);
}

function aplicarFiltrosMercados() {
    const termo = normalizarTexto(document.getElementById("buscaMercado")?.value || "");
    const ordenar = document.getElementById("ordenarMercados")?.value || "compras";
    const resumo = gerarResumoMercados();

    mercadosFiltrados = mercadosAdmin
        .map(mercado => ({
            ...mercado,
            total_compras: resumo[mercado.id]?.compras || 0,
            volume: resumo[mercado.id]?.volume || 0
        }))
        .filter(mercado => {
            const texto = normalizarTexto([mercado.nome, mercado.cidade, mercado.bairro].join(" "));
            return !termo || texto.includes(termo);
        });

    if (ordenar === "nome") {
        mercadosFiltrados.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (ordenar === "volume") {
        mercadosFiltrados.sort((a, b) => b.volume - a.volume);
    } else {
        mercadosFiltrados.sort((a, b) => b.total_compras - a.total_compras);
    }

    renderizarMercadosAdmin();
}

function gerarResumoMercados() {
    const mapa = {};

    comprasMercados.forEach(compra => {
        if (!compra.market_id) return;
        if (!mapa[compra.market_id]) mapa[compra.market_id] = { compras: 0, volume: 0 };
        mapa[compra.market_id].compras += 1;
        mapa[compra.market_id].volume += Number(compra.valor_total || 0);
    });

    return mapa;
}

function atualizarResumoMercados() {
    const resumo = gerarResumoMercados();
    const comCompras = Object.keys(resumo).length;
    const volume = comprasMercados.reduce((total, compra) => total + Number(compra.valor_total || 0), 0);

    let top = "-";
    let topCompras = -1;

    mercadosAdmin.forEach(mercado => {
        const qtd = resumo[mercado.id]?.compras || 0;
        if (qtd > topCompras) {
            topCompras = qtd;
            top = mercado.nome || "-";
        }
    });

    atualizarTexto("mercadosTotal", mercadosAdmin.length);
    atualizarTexto("mercadosComCompras", comCompras);
    atualizarTexto("mercadosVolume", formatarMoeda(volume));
    atualizarTexto("mercadoTop", top);
}

function renderizarMercadosAdmin() {
    const container = document.getElementById("listaMercadosAdmin");
    if (!container) return;

    if (!mercadosFiltrados.length) {
        container.innerHTML = `<div class="item-card empty-card">Nenhum mercado encontrado.</div>`;
        return;
    }

    container.innerHTML = mercadosFiltrados.map(mercado => `
        <article class="item-card">
            <div class="item-top">
                <div>
                    <div class="item-title">${mercado.nome || "Mercado"}</div>
                    <div class="item-subtitle">${mercado.cidade || "Cidade não informada"}</div>
                </div>
                <span class="badge badge-ok">${mercado.total_compras} compras</span>
            </div>
            <div class="info-grid">
                <div class="info-item"><span>Volume</span><strong>${formatarMoeda(mercado.volume)}</strong></div>
                <div class="info-item"><span>ID</span><strong>${mercado.id}</strong></div>
                <div class="info-item"><span>Criado em</span><strong>${formatarData(mercado.created_at)}</strong></div>
            </div>
            <div class="actions">
                <button class="btn-primary" onclick="abrirModalMercado(${mercado.id})">Editar</button>
            </div>
        </article>
    `).join("");
}

async function criarMercado() {
    const nome = document.getElementById("novoMercadoNome")?.value.trim();
    const cidade = document.getElementById("novoMercadoCidade")?.value.trim();

    if (!nome) {
        alert("Informe o nome do mercado.");
        return;
    }

    const { error } = await supabaseClient
        .from("markets")
        .insert({ nome, cidade: cidade || null });

    if (error) {
        console.error("Erro ao criar mercado:", error);
        alert("Erro ao criar mercado.");
        return;
    }

    document.getElementById("novoMercadoNome").value = "";
    document.getElementById("novoMercadoCidade").value = "";

    alert("Mercado cadastrado.");
    await carregarMercadosAdmin();
}

function abrirModalMercado(id) {
    const mercado = mercadosAdmin.find(item => Number(item.id) === Number(id));
    if (!mercado) return;

    atualizarValor("editMercadoId", mercado.id);
    atualizarValor("editMercadoNome", mercado.nome || "");
    atualizarValor("editMercadoCidade", mercado.cidade || "");

    document.getElementById("modalMercado")?.classList.add("ativo");
}

function fecharModalMercado() {
    document.getElementById("modalMercado")?.classList.remove("ativo");
}

async function salvarMercado() {
    const id = document.getElementById("editMercadoId")?.value;
    const nome = document.getElementById("editMercadoNome")?.value.trim();
    const cidade = document.getElementById("editMercadoCidade")?.value.trim();

    if (!id || !nome) {
        alert("Informe o nome do mercado.");
        return;
    }

    const { error } = await supabaseClient
        .from("markets")
        .update({ nome, cidade: cidade || null })
        .eq("id", id);

    if (error) {
        console.error("Erro ao salvar mercado:", error);
        alert("Erro ao salvar mercado.");
        return;
    }

    alert("Mercado atualizado.");
    fecharModalMercado();
    await carregarMercadosAdmin();
}

window.addEventListener("click", event => {
    const modal = document.getElementById("modalMercado");
    if (modal && event.target === modal) fecharModalMercado();
});

document.addEventListener("DOMContentLoaded", () => {
    iniciarAdminSaas("mercados", async () => {
        configurarFiltrosMercados();
        await carregarMercadosAdmin();
    });
});
