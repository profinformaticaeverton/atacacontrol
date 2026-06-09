let produtos = [];

let usuarioAtual = null;

async function iniciar() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        window.location.href = "/";

        return;
    }

    usuarioAtual = session.user;

    document
        .getElementById("dataCompra")
        .valueAsDate = new Date();

    await carregarMercados();

    await carregarProdutos();
}

async function carregarMercados() {

    const { data } =
        await supabaseClient
            .from("markets")
            .select("*")
            .order("nome");

    const select =
        document.getElementById(
            "marketSelect"
        );

    select.innerHTML = "";

    data.forEach(m => {

        select.innerHTML += `
            <option value="${m.id}">
                ${m.nome}
            </option>
        `;
    });
}

async function carregarProdutos() {

    const { data } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("ativo", true)
            .order("nome");

    produtos = data;

    const lista =
        document.getElementById(
            "listaProdutos"
        );

    lista.innerHTML = "";

    produtos.forEach(produto => {

        lista.innerHTML += `

        <div class="produto">

            <label>

                <input
                    type="checkbox"
                    class="checkProduto"
                    data-id="${produto.id}">

                ${produto.nome}

            </label>

            <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Qtd"
                class="qtd">

            <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor">

            <input
                readonly
                placeholder="Subtotal">

        </div>

        `;
    });

    adicionarEventos();
}

function adicionarEventos() {

    document
        .querySelectorAll(".produto")
        .forEach(produto => {

            const qtd =
                produto.querySelectorAll("input")[1];

            const valor =
                produto.querySelectorAll("input")[2];

            const subtotal =
                produto.querySelectorAll("input")[3];

            qtd.addEventListener(
                "input",
                atualizar
            );

            valor.addEventListener(
                "input",
                atualizar
            );

            function atualizar() {

                const total =
                    (Number(qtd.value)||0)
                    *
                    (Number(valor.value)||0);

                subtotal.value =
                    total.toFixed(2);

                atualizarResumo();
            }
        });
}

function atualizarResumo() {

    let qtdTotal = 0;

    let valorTotal = 0;

    document
        .querySelectorAll(".produto")
        .forEach(produto => {

            const qtd =
                Number(
                    produto
                    .querySelectorAll("input")[1]
                    .value || 0
                );

            const subtotal =
                Number(
                    produto
                    .querySelectorAll("input")[3]
                    .value || 0
                );

            qtdTotal += qtd;

            valorTotal += subtotal;
        });

    document
        .getElementById("qtdTotal")
        .innerText =
        qtdTotal;

    document
        .getElementById("valorTotal")
        .innerText =
        valorTotal.toLocaleString(
            "pt-BR",
            {
                style:"currency",
                currency:"BRL"
            }
        );
}

async function salvarCompra() {

    alert(
        "Próxima etapa: gravação no banco."
    );
}

iniciar();