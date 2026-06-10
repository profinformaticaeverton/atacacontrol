// ========================================
// ATACACONTROL - DASHBOARD 2.0
// ========================================

async function verificarSessao() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {

            window.location.href = "/";

            return;
        }

        const user = session.user;

        const userEmail =
            document.getElementById(
                "userEmail"
            );

        if (userEmail) {

            userEmail.innerText =
                user.email;
        }

        await verificarPerfil(user);

        await carregarDashboard(user);

        iniciarMenuMobile();

    } catch (erro) {

        console.error(
            "Erro ao verificar sessão:",
            erro
        );

        window.location.href = "/";
    }
}

// ========================================
// PERFIL
// ========================================

async function verificarPerfil(user) {

    try {

        const {
            data: profile
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile) {

            const {
                error
            } = await supabaseClient
                .from("profiles")
                .insert({

                    id: user.id,
                    email: user.email,
                    role: "user"

                });

            if (error) {

                console.error(
                    "Erro ao criar perfil:",
                    error
                );
            }
        }

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// CARREGAR DASHBOARD
// ========================================

async function carregarDashboard(user) {

    try {

        const hoje = new Date();

        const primeiroDiaMes =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            );

        const dataInicio =
            primeiroDiaMes
                .toISOString()
                .split("T")[0];

        const {
            data: compras,
            error
        } = await supabaseClient
            .from("purchases")
            .select(`
                *,
                markets (
                    nome
                )
            `)
            .eq(
                "user_id",
                user.id
            )
            .order(
                "data_compra",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                error
            );

            return;
        }

        // ==========================
        // TOTAL DO MÊS
        // ==========================

        const comprasMes =
            compras.filter(
                compra =>
                    compra.data_compra >=
                    dataInicio
            );

        const totalMes =
            comprasMes.reduce(
                (total, compra) =>
                    total +
                    Number(
                        compra.valor_total || 0
                    ),
                0
            );

        // ==========================
        // TOTAL DE COMPRAS
        // ==========================

        const qtdCompras =
            compras.length;

        // ==========================
        // MAIOR COMPRA
        // ==========================

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

        // ==========================
        // PRODUTOS COMPRADOS
        // ==========================

        const {
            data: itens,
            error: itensError
        } = await supabaseClient
            .from("purchase_items")
            .select(`
                quantidade,
                purchases!inner (
                    user_id
                )
            `)
            .eq(
                "purchases.user_id",
                user.id
            );

        if (itensError) {

            console.error(
                itensError
            );
        }

        const qtdProdutos =
            itens
                ? itens.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.quantidade || 0
                        ),
                    0
                )
                : 0;

        // ==========================
        // CARDS
        // ==========================

        atualizarCard(
            "totalMes",
            formatarMoeda(
                totalMes
            )
        );

        atualizarCard(
            "qtdCompras",
            qtdCompras
        );

        atualizarCard(
            "qtdProdutos",
            qtdProdutos
        );

        atualizarCard(
            "maiorCompra",
            formatarMoeda(
                maiorCompra
            )
        );

        // ==========================
        // ÚLTIMAS COMPRAS
        // ==========================

        renderizarUltimasCompras(
            compras.slice(0, 10)
        );

    } catch (erro) {

        console.error(
            "Erro Dashboard:",
            erro
        );
    }
}

// ========================================
// ÚLTIMAS COMPRAS
// ========================================

function renderizarUltimasCompras(compras) {

    const container =
        document.getElementById(
            "ultimasCompras"
        );

    if (!container) return;

    if (!compras.length) {

        container.innerHTML = `

            <div class="compra-card">

                Nenhuma compra encontrada

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    compras.forEach(compra => {

        container.innerHTML += `

        <div class="compra-card">

            <div class="compra-data">

                📅 ${formatarData(
                    compra.data_compra
                )}

            </div>

            <div class="compra-mercado">

                🏪 ${compra.markets?.nome || "-"}

            </div>

            <div class="compra-itens">

                🛒 ${compra.quantidade_total || 0} itens

            </div>

            <div class="compra-total">

                ${formatarMoeda(
                    compra.valor_total || 0
                )}

            </div>

        </div>

        `;
    });
}

// ========================================
// MENU MOBILE
// ========================================

function iniciarMenuMobile() {

    const menu =
        document.getElementById(
            "menuMobile"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "overlay"
        );

    if (
        !menu ||
        !sidebar ||
        !overlay
    ) {

        return;
    }

    menu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "aberto"
            );

            overlay.classList.toggle(
                "ativo"
            );
        }
    );

    overlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "aberto"
            );

            overlay.classList.remove(
                "ativo"
            );
        }
    );
}

// ========================================
// HELPERS
// ========================================

function atualizarCard(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.innerText =
            valor;
    }
}

function formatarMoeda(valor) {

    return Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}

function formatarData(data) {

    return new Date(data)
        .toLocaleDateString(
            "pt-BR"
        );
}

// ========================================
// LOGOUT
// ========================================

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    window.location.href = "/";
}

// ========================================
// START
// ========================================

verificarSessao();