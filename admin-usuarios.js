// ========================================
// MINHA DISPENSA
// ADMIN USUÁRIOS
// ========================================

let usuariosAdmin = [];
let usuariosAdminFiltrados = [];
let comprasUsuarios = [];

async function carregarUsuarios() {
    try {
        const [usuariosRes, comprasRes] = await Promise.all([
            supabaseClient.from("profiles").select("*").order("email", { ascending: true }),
            supabaseClient.from("purchases").select("user_id, valor_total")
        ]);

        if (usuariosRes.error) {
            console.error("Erro ao carregar usuários:", usuariosRes.error);
            alert("Erro ao carregar usuários.");
            return;
        }

        usuariosAdmin = usuariosRes.data || [];
        comprasUsuarios = comprasRes.data || [];

        atualizarResumoUsuarios();
        aplicarFiltrosUsuarios();

    } catch (erro) {
        console.error("Erro inesperado ao carregar usuários:", erro);
        alert("Erro inesperado ao carregar usuários.");
    }
}

function configurarFiltrosUsuarios() {
    const busca = document.getElementById("buscaUsuario");
    const role = document.getElementById("filtroRole");

    if (busca) busca.addEventListener("input", aplicarFiltrosUsuarios);
    if (role) role.addEventListener("change", aplicarFiltrosUsuarios);
}

function aplicarFiltrosUsuarios() {
    const termo = normalizarTexto(document.getElementById("buscaUsuario")?.value || "");
    const role = document.getElementById("filtroRole")?.value || "";

    usuariosAdminFiltrados = usuariosAdmin.filter(usuario => {
        const texto = normalizarTexto([usuario.email, usuario.nome, usuario.role].join(" "));
        const okTexto = !termo || texto.includes(termo);
        const okRole = !role || usuario.role === role;
        return okTexto && okRole;
    });

    renderizarUsuarios();
}

function atualizarResumoUsuarios() {
    const admins = usuariosAdmin.filter(usuario => usuario.role === "admin").length;
    const comuns = usuariosAdmin.filter(usuario => usuario.role !== "admin").length;
    const idsComCompra = new Set(comprasUsuarios.map(item => item.user_id));
    const semCompras = usuariosAdmin.filter(usuario => !idsComCompra.has(usuario.id)).length;

    atualizarTexto("usuariosTotal", usuariosAdmin.length);
    atualizarTexto("usuariosAdmin", admins);
    atualizarTexto("usuariosComuns", comuns);
    atualizarTexto("usuariosSemCompras", semCompras);
}

function renderizarUsuarios() {
    const container = document.getElementById("listaUsuarios");
    if (!container) return;

    if (!usuariosAdminFiltrados.length) {
        container.innerHTML = `<div class="item-card empty-card">Nenhum usuário encontrado.</div>`;
        return;
    }

    const resumoCompras = gerarResumoComprasPorUsuario();

    container.innerHTML = usuariosAdminFiltrados.map(usuario => {
        const resumo = resumoCompras[usuario.id] || { compras: 0, valor: 0 };
        const badge = statusBadge(usuario.role || "user");

        return `
            <article class="item-card">
                <div class="item-top">
                    <div>
                        <div class="item-title">${usuario.email || "Usuário sem e-mail"}</div>
                        <div class="item-subtitle">ID: ${usuario.id}</div>
                    </div>
                    <span class="badge ${badge.classe}">${badge.texto}</span>
                </div>
                <div class="info-grid">
                    <div class="info-item"><span>Compras</span><strong>${resumo.compras}</strong></div>
                    <div class="info-item"><span>Valor movimentado</span><strong>${formatarMoeda(resumo.valor)}</strong></div>
                    <div class="info-item"><span>Criado em</span><strong>${formatarData(usuario.created_at)}</strong></div>
                </div>
                <div class="actions">
                    <button class="btn-primary" onclick="abrirModalUsuario('${usuario.id}')">Editar perfil</button>
                </div>
            </article>
        `;
    }).join("");
}

function gerarResumoComprasPorUsuario() {
    const mapa = {};

    comprasUsuarios.forEach(compra => {
        if (!mapa[compra.user_id]) mapa[compra.user_id] = { compras: 0, valor: 0 };
        mapa[compra.user_id].compras += 1;
        mapa[compra.user_id].valor += Number(compra.valor_total || 0);
    });

    return mapa;
}

function abrirModalUsuario(id) {
    const usuario = usuariosAdmin.find(item => item.id === id);
    if (!usuario) return;

    atualizarValor("editUsuarioId", usuario.id);
    atualizarValor("editUsuarioEmail", usuario.email || "");
    atualizarValor("editUsuarioRole", usuario.role || "user");

    document.getElementById("modalUsuario")?.classList.add("ativo");
}

function fecharModalUsuario() {
    document.getElementById("modalUsuario")?.classList.remove("ativo");
}

async function salvarUsuario() {
    const id = document.getElementById("editUsuarioId")?.value;
    const role = document.getElementById("editUsuarioRole")?.value;

    if (!id || !role) {
        alert("Dados inválidos.");
        return;
    }

    const confirmar = confirm(`Alterar perfil do usuário para ${role}?`);
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from("profiles")
        .update({ role })
        .eq("id", id);

    if (error) {
        console.error("Erro ao salvar usuário:", error);
        alert("Erro ao salvar usuário.");
        return;
    }

    alert("Usuário atualizado.");
    fecharModalUsuario();
    await carregarUsuarios();
}

window.addEventListener("click", event => {
    const modal = document.getElementById("modalUsuario");
    if (modal && event.target === modal) fecharModalUsuario();
});

document.addEventListener("DOMContentLoaded", () => {
    iniciarAdminSaas("usuarios", async () => {
        configurarFiltrosUsuarios();
        await carregarUsuarios();
    });
});
