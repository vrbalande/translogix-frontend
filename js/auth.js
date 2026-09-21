"use strict";

/* ==========================================================
   TRANSLOGIX AUTH CONFIGURATION
   Android Emulator -> Host Machine
========================================================== */

const AUTH_API = "http://10.0.2.2:8081";


/* ==========================================================
   DOM READY
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");


    /* ======================================================
       MESSAGE HELPER
    ====================================================== */

    function showMessage(id, text, type = "") {

        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent = text;

        if (type === "error") {

            element.className = "auth-message error";

        } else if (type === "success") {

            element.className = "auth-message success";

        } else {

            element.className = "auth-message";
        }
    }


    /* ======================================================
       API REQUEST
    ====================================================== */

    async function request(endpoint, payload) {

        const url = `${AUTH_API}${endpoint}`;

        console.log("TRANSLOGIX API:", url);
        console.log("Request payload:", payload);

        try {

            const response = await fetch(url, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(payload)

            });

            console.log(
                "HTTP Status:",
                response.status
            );

            const raw = await response.text();

            console.log(
                "Server Response:",
                raw
            );

            let data = {};

            if (raw) {

                try {

                    data = JSON.parse(raw);

                } catch {

                    data = {
                        message: raw
                    };
                }
            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Request failed with status ${response.status}`
                );
            }

            return data;

        } catch (error) {

            console.error(
                "TRANSLOGIX API ERROR:",
                error
            );

            /*
             * fetch() throws TypeError when the Android WebView
             * cannot connect to the backend.
             */

            if (
                error instanceof TypeError ||
                error.message === "Failed to fetch"
            ) {

                throw new Error(
                    `Unable to connect to TRANSLOGIX backend at ${AUTH_API}. Make sure the Spring Boot server is running on port 8081.`
                );
            }

            throw error;
        }
    }


    /* ======================================================
       LOGIN
    ====================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const usernameInput =
                    document.getElementById(
                        "loginUsername"
                    );

                const passwordInput =
                    document.getElementById(
                        "loginPassword"
                    );

                const button =
                    document.getElementById(
                        "loginBtn"
                    );


                if (!usernameInput || !passwordInput) {

                    console.error(
                        "Login input elements not found."
                    );

                    return;
                }


                const username =
                    usernameInput.value.trim();

                const password =
                    passwordInput.value;


                if (!username || !password) {

                    showMessage(
                        "loginMessage",
                        "Please enter username and password.",
                        "error"
                    );

                    return;
                }


                try {

                    if (button) {

                        button.disabled = true;

                        const span =
                            button.querySelector("span");

                        if (span) {
                            span.textContent =
                                "Signing in...";
                        }
                    }


                    showMessage(
                        "loginMessage",
                        "Connecting to TRANSLOGIX backend..."
                    );


                    const data = await request(
                        "/api/auth/login",
                        {
                            username: username,
                            password: password
                        }
                    );


                    console.log(
                        "Login response:",
                        data
                    );


                    /* ==================================================
                       CHECK TOKEN
                    ================================================== */

                    if (!data || !data.token) {

                        throw new Error(
                            "Login succeeded but JWT token was not returned by the server."
                        );
                    }


                    /* ==================================================
                       NORMALIZE ROLE
                    ================================================== */

                    let role =
                        String(
                            data.role || "USER"
                        )
                        .trim()
                        .toUpperCase();


                    if (
                        role.startsWith("ROLE_")
                    ) {

                        role =
                            role.substring(5);
                    }


                    console.log(
                        "User role:",
                        role
                    );


                    /* ==================================================
                       SAVE LOGIN SESSION
                    ================================================== */

                    localStorage.setItem(
                        "token",
                        data.token
                    );

                    localStorage.setItem(
                        "username",
                        data.username || username
                    );

                    localStorage.setItem(
                        "role",
                        role
                    );


                    showMessage(
                        "loginMessage",
                        "✓ Login successful.",
                        "success"
                    );


                    /* ==================================================
                       REDIRECT
                    ================================================== */

                    setTimeout(() => {

                        if (role === "ADMIN") {

                            window.location.href =
                                "./admin-dashboard.html";

                        } else {

                            window.location.href =
                                "./user-dashboard.html";
                        }

                    }, 500);


                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );


                    showMessage(
                        "loginMessage",
                        error.message ||
                        "Login failed.",
                        "error"
                    );


                } finally {

                    if (button) {

                        button.disabled = false;

                        const span =
                            button.querySelector("span");

                        if (span) {

                            span.textContent =
                                "Sign in to workspace";
                        }
                    }
                }
            }
        );
    }


    /* ======================================================
       PASSWORD TOGGLE
    ====================================================== */

    const togglePassword =
        document.getElementById(
            "togglePassword"
        );


    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            () => {

                const passwordInput =
                    document.getElementById(
                        "loginPassword"
                    );


                if (!passwordInput) {
                    return;
                }


                if (
                    passwordInput.type ===
                    "password"
                ) {

                    passwordInput.type =
                        "text";

                    togglePassword.textContent =
                        "Hide";

                } else {

                    passwordInput.type =
                        "password";

                    togglePassword.textContent =
                        "Show";
                }
            }
        );
    }


    /* ======================================================
       REGISTER
    ====================================================== */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const usernameInput =
                    document.getElementById(
                        "registerUsername"
                    );

                const passwordInput =
                    document.getElementById(
                        "registerPassword"
                    );

                const roleInput =
                    document.getElementById(
                        "registerRole"
                    );

                const button =
                    document.getElementById(
                        "registerBtn"
                    );


                if (
                    !usernameInput ||
                    !passwordInput ||
                    !roleInput
                ) {

                    console.error(
                        "Registration input elements not found."
                    );

                    return;
                }


                const username =
                    usernameInput.value.trim();

                const password =
                    passwordInput.value;

                const role =
                    roleInput.value;


                if (!username || !password) {

                    showMessage(
                        "registerMessage",
                        "Please enter username and password.",
                        "error"
                    );

                    return;
                }


                try {

                    if (button) {

                        button.disabled = true;

                        const span =
                            button.querySelector("span");

                        if (span) {
                            span.textContent =
                                "Creating...";
                        }
                    }


                    showMessage(
                        "registerMessage",
                        "Creating account..."
                    );


                    const data = await request(
                        "/api/auth/register",
                        {
                            username: username,
                            password: password,
                            role: role
                        }
                    );


                    console.log(
                        "Registration response:",
                        data
                    );


                    showMessage(
                        "registerMessage",
                        data.message ||
                        "✓ Account created successfully.",
                        "success"
                    );


                    registerForm.reset();


                    setTimeout(() => {

                        window.location.href =
                            "./login.html";

                    }, 1000);


                } catch (error) {

                    console.error(
                        "Registration error:",
                        error
                    );


                    showMessage(
                        "registerMessage",
                        error.message ||
                        "Registration failed.",
                        "error"
                    );


                } finally {

                    if (button) {

                        button.disabled = false;

                        const span =
                            button.querySelector("span");

                        if (span) {

                            span.textContent =
                                "→";
                        }
                    }
                }
            }
        );
    }

});