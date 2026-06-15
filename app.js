// ====================================
// MINHA DISPENSA
// LOGIN E CADASTRO
// ====================================

const msg =
    document.getElementById("msg");

// ====================================
// ALTERNAR TELAS
// ====================================

function mostrarLogin() {

    document.getElementById(
        "loginBox"
    ).style.display = "block";

    document.getElementById(
        "cadastroBox"
    ).style.display = "none";

    btnLogin.classList.add("active");
    btnCadastro.classList.remove("active");

    limparMensagem();
}

function mostrarCadastro() {

    document.getElementById(
        "loginBox"
    ).style.display = "none";

    document.getElementById(
        "cadastroBox"
    ).style.display = "block";

    btnCadastro.classList.add("active");
    btnLogin.classList.remove("active");

    limparMensagem();
}

// ====================================
// LOGIN
// ====================================

async function login() {

    try {

        msg.innerText =
            "Entrando na sua dispensa...";

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        if (!email || !password) {

            msg.innerText =
                "Informe seu e-mail e senha para entrar.";

            return;
        }

        const {
            data,
            error
        } =
        await supabaseClient.auth
            .signInWithPassword({

                email,
                password

            });

        if (error) {

            msg.innerText =
                traduzirErroAuth(
                    error.message
                );

            return;
        }

        msg.innerText =
            "Login realizado com sucesso!";

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(erro);

        msg.innerText =
            "Erro inesperado ao acessar sua conta.";
    }
}

// ====================================
// CADASTRO
// ====================================

async function register() {

    try {

        msg.innerText =
            "Criando sua conta...";

        const email =
            document
                .getElementById("newEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("newPassword")
                .value;

        if (!email || !password) {

            msg.innerText =
                "Informe um e-mail e uma senha para criar sua conta.";

            return;
        }

        if (password.length < 6) {

            msg.innerText =
                "A senha precisa ter pelo menos 6 caracteres.";

            return;
        }

        const {
            data,
            error
        } =
        await supabaseClient.auth
            .signUp({

                email,
                password

            });

        if (error) {

            msg.innerText =
                traduzirErroAuth(
                    error.message
                );

            return;
        }

        msg.innerText =
            "Conta criada! Verifique seu e-mail para confirmar o cadastro.";

    } catch (erro) {

        console.error(erro);

        msg.innerText =
            "Erro inesperado ao criar sua conta.";
    }
}

// ====================================
// SESSÃO EXISTENTE
// ====================================

async function verificarSessao() {

    const {
        data: { session }
    } =
    await supabaseClient.auth
        .getSession();

    if (session) {

        window.location.href =
            "dashboard.html";
    }
}

// ====================================
// HELPERS
// ====================================

function limparMensagem() {

    if (msg) {

        msg.innerText = "";
    }
}

function traduzirErroAuth(mensagem) {

    const texto =
        String(mensagem || "")
            .toLowerCase();

    if (
        texto.includes("invalid login credentials")
    ) {

        return "E-mail ou senha inválidos.";
    }

    if (
        texto.includes("email not confirmed")
    ) {

        return "Confirme seu e-mail antes de entrar.";
    }

    if (
        texto.includes("user already registered")
    ) {

        return "Este e-mail já possui cadastro.";
    }

    if (
        texto.includes("password")
    ) {

        return "Verifique a senha informada.";
    }

    return mensagem ||
        "Não foi possível concluir a operação.";
}