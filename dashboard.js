// ========================================
// ATACACONTROL DASHBOARD
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

    } catch (erro) {

        console.error(
            erro
        );

        window.location.href = "/";
    }
}

// ========================================
// PERFIL
// ========================================

async function verificarPerfil(user) {

    const {
        data: profile
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile) {

        await supabaseClient
            .from("profiles")
            .insert({

                id: user.id,
                email: user.email,
                role: "user"

            });
    }
}

// ========================================
// DASHBOARD
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
                markets(nome)
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

            console.error(error);

            return;
        }

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

        const qtdCompras =
            compras.length;

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

        const {
            data: itens
        } = await supabaseClient
            .from("purchase_items")
            .select(`
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

        renderizarUltimasCompras(
            compras.slice(0, 10)
        );

    } catch (erro) {

        console.error(
            erro
        );
    }
}

// ========================================
// TABELA
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
                    compra.valor_total
                )}
            </td>

        </tr>

        `;
    });
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

    await supabaseClient.auth.signOut();

    window.location.href = "/";
}

// ========================================
// START
// ========================================

verificarSessao();