// ================= LOGIN =================
function login() {
    let email = document.getElementById("loginEmail").value;
    let password = document.getElementById("loginPassword").value;

    if (email === "" || password === "") {
        alert("Please fill all fields!");
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        console.log("LOGIN RESPONSE:", data); // 🔍 DEBUG

        if (data.success && data.user) {

            // ✅ STORE USER PROPERLY
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login Successful!");

            // ✅ redirect
            redirectToRolePage(data.user.role);

        } else {
            alert("Login Failed: " + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Something went wrong.");
    });
}

// ================= REGISTER =================
function register() {
    let name = document.getElementById("regName").value.trim();
    let email = document.getElementById("regEmail").value.trim();
    let password = document.getElementById("CreatePassword").value.trim();
    let confirmPassword = document.getElementById("ConfirmPassword").value.trim();
    let role = document.getElementById("Role").value;
    let flatNo = document.getElementById("flat_number").value.trim();

    // 🔍 Debug
    console.log("Password:", password);
    console.log("Confirm:", confirmPassword);

    // Remove hidden spaces
    password = password.replace(/\s/g, "");
    confirmPassword = confirmPassword.replace(/\s/g, "");

    if (!name || !email || !password || !confirmPassword) {
        alert("Please fill all required fields!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            email,
            password,
            role,
            flat_number: flatNo
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Registration successful!");
            document.getElementById("registerForm").reset();
        } else {
            alert("Registration failed: " + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error registering.");
    });
}


// ================= ROLE REDIRECT =================
function redirectToRolePage(role) {
    switch (role.toLowerCase()) {
        case "owner":
            window.location.href = "owners.html"; break;
        case "tenant":
            window.location.href = "tenants.html"; break;
        case "secretary":
            window.location.href = "secretary.html"; break;
        case "security":
            window.location.href = "security.html"; break;
        case "cafe owner":
            window.location.href = "cafe_owner.html"; break;
        default:
            alert("Invalid role. Contact admin.");
    }
}


// ================= FORM EVENT =================
document.addEventListener("DOMContentLoaded", function () {

    // FIX form submit issue
    document.getElementById("registerForm").addEventListener("submit", function(e) {
        e.preventDefault();
        register();
    });

    // Disable flat number for some roles
    const roleSelect = document.getElementById("Role");
    const flatInput = document.getElementById("flat_number");

    roleSelect.addEventListener("change", function () {
        const selectedRole = roleSelect.value.toLowerCase();

        const disabledRoles = ["secretary", "cafe owner", "security"];

        if (disabledRoles.includes(selectedRole)) {
            flatInput.disabled = true;
            flatInput.value = "";
        } else {
            flatInput.disabled = false;
        }
    });
});
function payMaintenance() {
    const user = JSON.parse(localStorage.getItem("user"));

    const amount = document.getElementById("amount").value;

    if (!user) {
        alert("Please login first!");
        return;
    }

    if (!amount) {
        alert("Enter amount!");
        return;
    }

    fetch('/pay-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: user.user_id,
            amount: amount
        })
    })
    .then(res => res.text())
    .then(data => {
        alert(data);
    })
    .catch(err => {
        console.error(err);
        alert("Payment failed");
    });
}