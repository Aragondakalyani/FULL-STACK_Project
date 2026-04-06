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
        if (data.user) {
            // ✅ Store user details in localStorage
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login Successful!");
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


function register() {
    let name = document.getElementById("regName").value;
    let email = document.getElementById("regEmail").value;
    let password = document.getElementById("CreatePassword").value;
    let confirmPassword = document.getElementById("ConfirmPassword").value;
    let role = document.getElementById("Role").value;
    let flatNo = document.getElementById("flat_number").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, flat_number: flatNo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Registration successful!");
            window.location.href = "/index.html";
        } else {
            alert("Registration failed: " + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error registering.");
    });
}



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


document.addEventListener("DOMContentLoaded", function () {
    const roleSelect = document.getElementById("Role");
    const flatInput = document.getElementById("flat_number");

    if (roleSelect && flatInput) {
        roleSelect.addEventListener("change", function () {
            const selectedRole = roleSelect.value.trim().toLowerCase();
            const disabledRoles = ["secretary", "cafe owner", "security"];
            if (disabledRoles.includes(selectedRole)) {
                flatInput.disabled = true;
                flatInput.value = "";
            } else {
                flatInput.disabled = false;
            }
        });
        roleSelect.dispatchEvent(new Event("change"));
    }
});


