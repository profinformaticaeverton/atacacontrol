// ========================================
// MINHA DISPENSA
// ADMIN SAAS - FUNÇÕES COMUNS
// ========================================

let adminUsuarioAtual = null;
let adminPerfilAtual = null;

async function iniciarAdminSaas(paginaAtual, callback) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = "index.html";
            return;
        }

        adminUsuarioAtual = session.user;

        const usuarioTopo = document.getElementById("userEmail");
        if (usuarioTopo) {
            usuarioTopo.innerText = adminUsuarioAtual.email;
        }

        const autorizado = await verificarAdminSaas();

        if (!autorizado) {
            alert("Acesso restrito a administradores.");
            window.location.href = "dashboard.html";
            return;
        }

        marcarMenuAtivo(paginaAtual);
        iniciarMenuMobileAdmin();

        if (typeof callback === "function") {
            await callback();
        }

    } catch (erro) {
        console.error("Erro ao iniciar Admin SaaS:", erro);
        alert("Erro ao carregar área administrativa.");
        window.location.href = "dashboard.html";
    }
}

async function verificarAdminSaas() {
    try {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", adminUsuarioAtual.id)
            .maybeSingle();

        if (error) {
            console.error("Erro ao verificar admin:", error);
            return false;
        }

        adminPerfilAtual = data;
        return data?.role === "admin";

    } catch (erro) {
        console.error("Erro inesperado ao verificar admin:", erro);
        return false;
    }
}

function iniciarMenuMobileAdmin() {
    const menu = document.getElementById("menuMobile");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (!menu || !sidebar || !overlay) return;

    menu.addEventListener("click", () => {
        sidebar.classList.toggle("aberto");
        overlay.classList.toggle("ativo");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("aberto");
        overlay.classList.remove("ativo");
    });
}

function marcarMenuAtivo(paginaAtual) {
    document.querySelectorAll(".menu-btn").forEach(botao => {
        botao.classList.remove("active");

        if (botao.dataset.page === paginaAtual) {
            botao.classList.add("active");
        }
    });
}

function atualizarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.innerText = valor;
}

function atualizarValor(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.value = valor ?? "";
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        maximumFractionDigits: 2
    });
}

function formatarData(data) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
}

function obterInicioMesAtual() {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        .toISOString()
        .split("T")[0];
}

function obterMesAtual() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function normalizarTexto(texto) {
    return (texto || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function statusBadge(status) {
    const valor = (status || "").toLowerCase();

    if (["ativo", "aprovado", "ok", "admin", "concluido"].includes(valor)) {
        return { texto: status || "OK", classe: "badge-ok" };
    }

    if (["pendente", "alerta", "user", "cliente"].includes(valor)) {
        return { texto: status || "Pendente", classe: "badge-warning" };
    }

    if (["rejeitado", "inativo", "bloqueado", "estourado"].includes(valor)) {
        return { texto: status || "Atenção", classe: "badge-danger" };
    }

    return { texto: status || "-", classe: "badge-neutral" };
}

function renderizarBarras(containerId, itens, labelKey, valueKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!itens.length) {
        container.innerHTML = `<div class="empty-card">Nenhum dado encontrado.</div>`;
        return;
    }

    const maior = Math.max(...itens.map(item => Number(item[valueKey] || 0)), 1);

    container.innerHTML = itens.map(item => {
        const valor = Number(item[valueKey] || 0);
        const percentual = Math.max(3, Math.round((valor / maior) * 100));

        return `
            <div class="bar-row">
                <div class="bar-label">
                    <span>${item[labelKey] || "-"}</span>
                    <strong>${formatarNumero(valor)}</strong>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${percentual}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}
