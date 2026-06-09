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
}

// ====================================
// LOGIN
// ====================================

async function login() {

    try {

        msg.innerText =
            "Entrando...";

        const email =
            document
            .getElementById("email")
            .value
            .trim();

        const password =
            document
            .getElementById("password")
            .value;

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
                error.message;

            return;
        }

        msg.innerText =
            "Login realizado!";

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(erro);

        msg.innerText =
            "Erro inesperado.";
    }
}

// ====================================
// CADASTRO
// ====================================

async function register() {

    try {

        msg.innerText =
            "Criando conta...";

        const email =
            document
            .getElementById("newEmail")
            .value
            .trim();

        const password =
            document
            .getElementById("newPassword")
            .value;

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
                error.message;

            return;
        }

        msg.innerText =
            "Conta criada! Verifique seu e-mail para confirmar o cadastro.";

    } catch (erro) {

        console.error(erro);

        msg.innerText =
            "Erro inesperado.";
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

=======
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
}

// ====================================
// LOGIN
// ====================================

async function login() {

    try {

        msg.innerText =
            "Entrando...";

        const email =
            document
            .getElementById("email")
            .value
            .trim();

        const password =
            document
            .getElementById("password")
            .value;

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
                error.message;

            return;
        }

        msg.innerText =
            "Login realizado!";

        window.location.href =
            "dashboard.html";

    } catch (erro) {

        console.error(erro);

        msg.innerText =
            "Erro inesperado.";
    }
}

// ====================================
// CADASTRO
// ====================================

async function register() {

    try {

        msg.innerText =
            "Criando conta...";

        const email =
            document
            .getElementById("newEmail")
            .value
            .trim();

        const password =
            document
            .getElementById("newPassword")
            .value;

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
                error.message;

            return;
        }

        msg.innerText =
            "Conta criada! Verifique seu e-mail para confirmar o cadastro.";

    } catch (erro) {

        console.error(erro);

        msg.innerText =
            "Erro inesperado.";
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

>>>>>>> 6aed931b81356d28c53d15f61762ae639133ce8b
verificarSessao();