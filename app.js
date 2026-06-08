async function register() {

const email =
document.getElementById("newEmail").value;

const password =
document.getElementById("newPassword").value;

const { data, error } =
await supabaseClient.auth.signUp({
email,
password
});

if(error){

document.getElementById("msg").innerText =
error.message;

return;
}

document.getElementById("msg").innerText =
"Conta criada com sucesso!";
}

async function login() {

const email =
document.getElementById("email").value;

const password =
document.getElementById("password").value;

const { data, error } =
await supabaseClient.auth.signInWithPassword({
email,
password
});

if(error){

document.getElementById("msg").innerText =
error.message;

return;
}

document.getElementById("msg").innerText =
"Login realizado com sucesso!";

window.location.href =
"dashboard.html";
}