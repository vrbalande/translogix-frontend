"use strict";
const AUTH_API =
    "https://translogix-backend-1.onrender.com";

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        const registerForm =
            document.getElementById(
                "registerForm"
            );


        function message(
            id,
            text,
            type
        ) {

            const element =
                document.getElementById(id);


            if (!element) return;


            element.textContent =
                text;


            element.className =
                type === "error"
                    ? "auth-message error"
                    : type === "success"
                        ? "auth-message success"
                        : "auth-message";

        }


        async function request(
            endpoint,
            payload
        ) {

            const response =
                await fetch(
                    `${AUTH_API}${endpoint}`,
                    {
                        method:"POST",

                        headers:{
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const raw =
                await response.text();


            let data;


            try {

                data =
                    raw
                        ? JSON.parse(raw)
                        : {};

            }
            catch {

                data =
                    raw;

            }


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data ||
                    `Request failed: ${response.status}`
                );

            }


            return data;

        }


        /* LOGIN */

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const username =
                        document
                            .getElementById(
                                "loginUsername"
                            )
                            .value
                            .trim();


                    const password =
                        document
                            .getElementById(
                                "loginPassword"
                            )
                            .value;


                    const button =
                        document
                            .getElementById(
                                "loginBtn"
                            );


                    try {

                        button.disabled =
                            true;


                        button
                            .querySelector("span")
                            .textContent =
                            "Signing in...";


                        message(
                            "loginMessage",
                            "Authenticating..."
                        );


                        const data =
                            await request(
                                "/api/auth/login",
                                {
                                    username,
                                    password
                                }
                            );


                        if (!data.token) {

                            throw new Error(
                                "Login succeeded but token was not returned."
                            );

                        }


                        let role =
                            String(
                                data.role || ""
                            )
                                .trim()
                                .toUpperCase();


                        if (
                            role.startsWith(
                                "ROLE_"
                            )
                        ) {

                            role =
                                role.substring(
                                    5
                                );

                        }


                        localStorage.setItem(
                            "token",
                            data.token
                        );

                        localStorage.setItem(
                            "username",
                            data.username ||
                            username
                        );

                        localStorage.setItem(
                            "role",
                            role
                        );


                        message(
                            "loginMessage",
                            "✓ Login successful.",
                            "success"
                        );


                        setTimeout(
                            () => {

                                if (
                                    role ===
                                    "ADMIN"
                                ) {

                                    window.location.href =
                                        "./admin-dashboard.html";

                                }
                                else {

                                    window.location.href =
                                        "./user-dashboard.html";

                                }

                            },
                            400
                        );

                    }
                    catch(error){

                        message(
                            "loginMessage",
                            error.message,
                            "error"
                        );

                    }
                    finally{

                        button.disabled =
                            false;

                        button
                            .querySelector("span")
                            .textContent =
                            "Sign in to workspace";

                    }

                }
            );

        }


        /* PASSWORD TOGGLE */

        const toggle =
            document.getElementById(
                "togglePassword"
            );


        if (toggle) {

            toggle.addEventListener(
                "click",
                () => {

                    const input =
                        document.getElementById(
                            "loginPassword"
                        );


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";

                        toggle.textContent =
                            "Hide";

                    }
                    else {

                        input.type =
                            "password";

                        toggle.textContent =
                            "Show";

                    }

                }
            );

        }


        /* REGISTER */

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const username =
                        document
                            .getElementById(
                                "registerUsername"
                            )
                            .value
                            .trim();


                    const password =
                        document
                            .getElementById(
                                "registerPassword"
                            )
                            .value;


                    const role =
                        document
                            .getElementById(
                                "registerRole"
                            )
                            .value;


                    const button =
                        document
                            .getElementById(
                                "registerBtn"
                            );


                    try {

                        button.disabled =
                            true;

                        button.querySelector(
                            "span"
                        ).textContent =
                            "Creating...";


                        message(
                            "registerMessage",
                            "Creating account..."
                        );


                        const data =
                            await request(
                                "/api/auth/register",
                                {
                                    username,
                                    password,
                                    role
                                }
                            );


                        message(
                            "registerMessage",
                            data?.message ||
                            "✓ Account created successfully.",
                            "success"
                        );


                        registerForm.reset();


                        setTimeout(
                            () => {

                                window.location.href =
                                    "./login.html";

                            },
                            900
                        );

                    }
                    catch(error){

                        const target =
                            document.getElementById(
                                "registerMessage"
                            );


                        if (target) {

                            target.textContent =
                                error.message;

                            target.className =
                                "register-message error";

                        }

                    }
                    finally{

                        button.disabled =
                            false;

                        button.querySelector(
                            "span"
                        ).textContent =
                            "→";

                    }

                }
            );

        }

    }
);