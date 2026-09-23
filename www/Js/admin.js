/* ==========================================================
   TRANSLOGIX ADMIN CONTROL TOWER
   Production Version
========================================================== */

"use strict";


/* ==========================================================
   API CONFIG
========================================================== */

const ADMIN_API =
    "https://translogix-backend-1.onrender.com";


/* ==========================================================
   STATE
========================================================== */

const state = {

    shipments: [],

    customers: [],

    currentPage: "dashboard",

    demoMode: false,

    maps: {},

    selectedVehicle: null

};


/* ==========================================================
   AUTH TOKEN
========================================================== */

function getToken(){

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        ""
    );

}


/* ==========================================================
   API HELPER
========================================================== */

async function api(
    endpoint,
    options = {}
){

    const token = getToken();

    const config = {

        ...options,

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {}),

            ...(token
                ? {
                    "Authorization":
                        `Bearer ${token}`
                }
                : {})

        }

    };


    try{

        const response =
            await fetch(
                `${ADMIN_API}${endpoint}`,
                config
            );


        const text =
            await response.text();


        let data = null;


        try{

            data =
                text
                    ? JSON.parse(text)
                    : null;

        }
        catch{

            data = text;

        }


        /* ==================================================
           UNAUTHORIZED
        ================================================== */

        if(response.status === 401){

            localStorage.removeItem("token");
            localStorage.removeItem("jwt");
            localStorage.removeItem("accessToken");

            showToast(
                "Session expired",
                "Please login again.",
                "error"
            );

            setTimeout(() => {

                window.location.href =
                    "./login.html";

            }, 1200);

            throw new Error(
                "Unauthorized"
            );

        }


        /* ==================================================
           FORBIDDEN
        ================================================== */

        if(response.status === 403){

            throw new Error(
                "Administrator permission required."
            );

        }


        /* ==================================================
           OTHER ERRORS
        ================================================== */

        if(!response.ok){

            let message =
                "Request failed.";

            if(typeof data === "string" && data){

                message = data;

            }
            else if(data?.message){

                message = data.message;

            }
            else if(data?.error){

                message = data.error;

            }

            throw new Error(message);

        }


        return data;

    }
    catch(error){

        console.error(
            "API Error:",
            endpoint,
            error
        );

        throw error;

    }

}


/* ==========================================================
   TOAST
========================================================== */

function showToast(
    title,
    message = "",
    type = "success"
){

    if(
        typeof window.showToast ===
        "function"
    ){

        window.showToast(
            title,
            message,
            type
        );

        return;

    }


    console.log(
        `[${type}] ${title}`,
        message
    );

}


/* ==========================================================
   LOAD CUSTOMERS
========================================================== */

async function loadCustomers(){

    try{

        const data =
            await api(
                "/api/admin/users"
            );


        state.customers =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "CUSTOMERS LOADED:",
            state.customers
        );


        return state.customers;

    }
    catch(error){

        console.error(
            "Customer loading failed:",
            error
        );


        state.customers = [];


        showToast(
            "Customer loading failed",
            error.message,
            "error"
        );


        return [];

    }

}


/* ==========================================================
   LOAD ALL ADMIN SHIPMENTS
========================================================== */

async function loadShipments(){

    try{

        /*
         * IMPORTANT:
         *
         * Admin must use:
         * /api/admin/shipments
         *
         * NOT:
         * /api/shipments
         */

        const data =
            await api(
                "/api/admin/shipments"
            );


        if(Array.isArray(data)){

            state.shipments =
                data;

        }
        else if(
            Array.isArray(data?.content)
        ){

            state.shipments =
                data.content;

        }
        else{

            state.shipments = [];

        }


        state.demoMode = false;


        console.log(
            "ADMIN SHIPMENTS LOADED:",
            state.shipments
        );


    }
    catch(error){

        console.error(
            "Admin shipment loading failed:",
            error
        );


        state.shipments = [];


        state.demoMode = true;


        showToast(
            "Shipment loading failed",
            error.message,
            "error"
        );

    }


    updateStats();


    renderShipmentTable(
        state.shipments
    );

}


/* ==========================================================
   CUSTOMER DROPDOWN OPTIONS
========================================================== */

function customerOptions(){

    if(
        !Array.isArray(
            state.customers
        ) ||
        state.customers.length === 0
    ){

        return `
            <option value="">
                No customers available
            </option>
        `;

    }


    const customers =
        state.customers.filter(
            customer =>
                customer &&
                customer.username
        );


    if(customers.length === 0){

        return `
            <option value="">
                No customers available
            </option>
        `;

    }


    return customers
        .map(customer => {

            const username =
                escapeHtml(
                    customer.username
                );


            return `
                <option value="${username}">
                    ${username}
                </option>
            `;

        })
        .join("");

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHtml(value){

    if(value === null ||
       value === undefined){

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

/* ==========================================================
   ADMIN PAGE NAVIGATION
========================================================== */

const adminPageMap = {

    dashboard: {
        section: "page-dashboard",
        title: "Command Center",
        subtitle: "Enterprise logistics control workspace"
    },

    shipments: {
        section: "page-shipments",
        title: "Shipments",
        subtitle: "Shipment operations and tracking"
    },

    fleet: {
        section: "page-fleet",
        title: "Fleet",
        subtitle: "Fleet management and readiness"
    },

    drivers: {
        section: "page-drivers",
        title: "Drivers",
        subtitle: "Driver operations"
    },

    dispatch: {
        section: "page-dispatch",
        title: "Dispatch",
        subtitle: "Dispatch board and operations"
    },

    network: {
        section: "page-network",
        title: "Live Network",
        subtitle: "Network operations"
    },

    exceptions: {
        section: "page-exceptions",
        title: "Exception Center",
        subtitle: "Operational exceptions"
    },

    alerts: {
        section: "page-alerts",
        title: "Alerts",
        subtitle: "Alert management"
    },

    maintenance: {
        section: "page-maintenance",
        title: "Maintenance",
        subtitle: "Vehicle maintenance"
    },

    analytics: {
        section: "page-analytics",
        title: "Analytics",
        subtitle: "Operational analytics"
    },

    customers: {
        section: "page-customers",
        title: "Customer Intelligence",
        subtitle: "Customer operations"
    },

    reports: {
        section: "page-reports",
        title: "Reports",
        subtitle: "Operational reports"
    },

    assignments: {
        section: "page-assignments",
        title: "Assignments",
        subtitle: "Shipment assignments"
    },

    settings: {
        section: "page-settings",
        title: "Settings",
        subtitle: "System configuration"
    }

};


/* ==========================================================
   SHOW ADMIN PAGE
========================================================== */

function showPage(page){

    const config =
        adminPageMap[page] ||
        adminPageMap.dashboard;


    /* Hide all pages */

    document
        .querySelectorAll(".admin-page")
        .forEach(section => {

            section.classList.add("hidden");

        });


    /* Show selected page */

    const selectedPage =
        document.getElementById(
            config.section
        );


    if(!selectedPage){

        console.error(
            "Admin page section not found:",
            config.section
        );

        return;

    }


    selectedPage.classList.remove(
        "hidden"
    );


    /* Active sidebar item */

    document
        .querySelectorAll(
            ".admin-nav-item[data-page]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    /* Update page title */

    setText(
        "pageTitle",
        config.title
    );


    setText(
        "pageSubtitle",
        config.subtitle
    );


    setText(
        "adminPageTitle",
        config.title
    );


    setText(
        "adminPageSubtitle",
        config.subtitle
    );


    state.currentPage =
        page;


    /* Shipment page */

    if(page === "shipments"){

        renderShipmentTable(
            state.shipments
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ==========================================================
   SETUP ADMIN NAVIGATION
========================================================== */

function setupNavigation(){

    document
        .querySelectorAll(
            ".admin-nav-item[data-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showPage(
                        button.dataset.page
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-page-go]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showPage(
                        button.dataset.pageGo
                    );

                }
            );

        });

}