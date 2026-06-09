
// ========================================
// ATACACONTROL - DASHBOARD
// ========================================

// Verifica sessão do usuário
async function verificarSessao() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error || !session) {

        window.location.href = "/";

        return;
    }

    const user = session.user;

    // Exibe e-mail no topo do dashboard
    const userEmail =
        document.getElementById("userEmail");

    if (userEmail) {
        userEmail.innerText = user.email;
    }

    // Verifica se existe perfil
    await verificarPerfil(user);

    // Carrega dados iniciais
    await carregarDashboard(user);
}

// ========================================
// VERIFICA / CRIA PERFIL
// ========================================

async function verificarPerfil(user) {

    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {

        console.error(
            "Erro ao consultar perfil:",
            error.message
        );

        return;
    }

    // Cria perfil automaticamente
    if (!profile) {

        const {
            error: insertError
        } = await supabaseClient
            .from("profiles")
            .insert({
                id: user.id,
                email: user.email,
                role: "user"
            });

        if (insertError) {

            console.error(
                "Erro ao criar perfil:",
                insertError.message
            );

            return;
        }

        console.log(
            "Perfil criado com sucesso."
        );
    }
}

// ========================================
// CARREGA DADOS DO DASHBOARD
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

        // Compras do usuário

        const {
            data: compras,
            error
        } = await supabaseClient
            .from("purchases")
            .select(`
                *,
                markets(nome)
            `)
            .eq("user_id", user.id)
            .order("data_compra", {
                ascending: false
            });

        if (error) {

            console.error(error);

            return;
        }

        // ==========================
        // TOTAL DO MÊS
        // ==========================

        const comprasMes =
            compras.filter(compra =>
                compra.data_compra >= dataInicio
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
        // QUANTIDADE DE COMPRAS
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

            if (valor > maiorCompra) {
                maiorCompra = valor;
            }

        });

        // ==========================
        // PRODUTOS COMPRADOS
        // ==========================

        const {
            data: itens
        } = await supabaseClient
            .from("purchase_items")
            .select(`
                id,
                quantidade,
                purchases!inner(user_id)
            `)
            .eq(
                "purchases.user_id",
                user.id
            );

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
        // ATUALIZA CARDS
        // ==========================

        atualizarCard(
            "totalMes",
            formatarMoeda(totalMes)
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
            formatarMoeda(maiorCompra)
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

    const tbody =
        document.getElementById(
            "ultimasCompras"
        );

    if (!tbody) return;

    if (!compras.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="3">
                    Nenhuma compra encontrada
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = "";

    compras.forEach(compra => {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${formatarData(
                        compra.data_compra
                    )}
                </td>

                <td>
                    ${compra.markets?.nome || "-"}
                </td>

                <td>
                    ${formatarMoeda(
                        compra.valor_total || 0
                    )}
                </td>

            </tr>
        `;
    });
}

// ========================================
// ATUALIZA CARD
// ========================================

function atualizarCard(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.innerText = valor;
    }
}

// ========================================
// FORMATAR MOEDA
// ========================================

function formatarMoeda(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

// ========================================
// FORMATAR DATA
// ========================================

function formatarData(data) {

    return new Date(data)
        .toLocaleDateString("pt-BR");
}

// ========================================
// LOGOUT
// ========================================

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href = "/";
}

// ========================================
// INICIAR DASHBOARD
// ========================================

=======
// ========================================
// ATACACONTROL - DASHBOARD
// ========================================

// Verifica sessão do usuário
async function verificarSessao() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error || !session) {

        window.location.href = "/";

        return;
    }

    const user = session.user;

    // Exibe e-mail no topo do dashboard
    const userEmail =
        document.getElementById("userEmail");

    if (userEmail) {
        userEmail.innerText = user.email;
    }

    // Verifica se existe perfil
    await verificarPerfil(user);

    // Carrega dados iniciais
    await carregarDashboard(user);
}

// ========================================
// VERIFICA / CRIA PERFIL
// ========================================

async function verificarPerfil(user) {

    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {

        console.error(
            "Erro ao consultar perfil:",
            error.message
        );

        return;
    }

    // Cria perfil automaticamente
    if (!profile) {

        const {
            error: insertError
        } = await supabaseClient
            .from("profiles")
            .insert({
                id: user.id,
                email: user.email,
                role: "user"
            });

        if (insertError) {

            console.error(
                "Erro ao criar perfil:",
                insertError.message
            );

            return;
        }

        console.log(
            "Perfil criado com sucesso."
        );
    }
}

// ========================================
// CARREGA DADOS DO DASHBOARD
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

        // Compras do usuário

        const {
            data: compras,
            error
        } = await supabaseClient
            .from("purchases")
            .select(`
                *,
                markets(nome)
            `)
            .eq("user_id", user.id)
            .order("data_compra", {
                ascending: false
            });

        if (error) {

            console.error(error);

            return;
        }

        // ==========================
        // TOTAL DO MÊS
        // ==========================

        const comprasMes =
            compras.filter(compra =>
                compra.data_compra >= dataInicio
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
        // QUANTIDADE DE COMPRAS
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

            if (valor > maiorCompra) {
                maiorCompra = valor;
            }

        });

        // ==========================
        // PRODUTOS COMPRADOS
        // ==========================

        const {
            data: itens
        } = await supabaseClient
            .from("purchase_items")
            .select(`
                id,
                quantidade,
                purchases!inner(user_id)
            `)
            .eq(
                "purchases.user_id",
                user.id
            );

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
        // ATUALIZA CARDS
        // ==========================

        atualizarCard(
            "totalMes",
            formatarMoeda(totalMes)
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
            formatarMoeda(maiorCompra)
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

    const tbody =
        document.getElementById(
            "ultimasCompras"
        );

    if (!tbody) return;

    if (!compras.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="3">
                    Nenhuma compra encontrada
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = "";

    compras.forEach(compra => {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${formatarData(
                        compra.data_compra
                    )}
                </td>

                <td>
                    ${compra.markets?.nome || "-"}
                </td>

                <td>
                    ${formatarMoeda(
                        compra.valor_total || 0
                    )}
                </td>

            </tr>
        `;
    });
}

// ========================================
// ATUALIZA CARD
// ========================================

function atualizarCard(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.innerText = valor;
    }
}

// ========================================
// FORMATAR MOEDA
// ========================================

function formatarMoeda(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

// ========================================
// FORMATAR DATA
// ========================================

function formatarData(data) {

    return new Date(data)
        .toLocaleDateString("pt-BR");
}

// ========================================
// LOGOUT
// ========================================

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href = "/";
}

// ========================================
// INICIAR DASHBOARD
// ========================================

>>>>>>> 6aed931b81356d28c53d15f61762ae639133ce8b
verificarSessao();