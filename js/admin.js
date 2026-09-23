/* ==========================================================
   TRANSLOGIX — ENTERPRISE ADMIN CONTROL TOWER
   COMPLETE PRODUCTION ADMIN.JS
========================================================== */

"use strict";


/* ==========================================================
   API CONFIG
========================================================== */

const ADMIN_API =
    "https://translogix-backend-1.onrender.com";


/* ==========================================================
   GLOBAL STATE
========================================================== */

const state = {

    shipments: [],

    customers: [],

    currentPage: "dashboard",

    maps: {},

    selectedShipment: null,

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
   HTML ESCAPE
========================================================== */

function escapeHtml(value){

    if(
        value === null ||
        value === undefined
    ){

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
   TEXT SETTER
========================================================== */

function setText(id, value){

    const element =
        document.getElementById(id);

    if(element){

        element.textContent =
            value ?? "";

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
   API HELPER
========================================================== */

async function api(
    endpoint,
    options = {}
){

    const token =
        getToken();


    const config = {

        ...options,

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {}),

            ...(token
                ? {
                    Authorization:
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

            data =
                text;

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

            setTimeout(
                () => {

                    window.location.href =
                        "./login.html";

                },
                1000
            );

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

            if(
                typeof data ===
                "string" &&
                data
            ){

                message =
                    data;

            }
            else if(data?.message){

                message =
                    data.message;

            }
            else if(data?.error){

                message =
                    data.error;

            }

            throw new Error(
                message
            );

        }


        return data;

    }
    catch(error){

        console.error(
            "TRANSLOGIX API ERROR:",
            endpoint,
            error
        );

        throw error;

    }

}


/* ==========================================================
   PAGE MAP
========================================================== */

const adminPageMap = {

    dashboard: {

        section:
            "page-dashboard",

        title:
            "Command Center",

        subtitle:
            "Enterprise logistics control workspace"

    },

    shipments: {

        section:
            "page-shipments",

        title:
            "Shipments",

        subtitle:
            "Shipment operations and tracking"

    },

    fleet: {

        section:
            "page-fleet",

        title:
            "Fleet",

        subtitle:
            "Fleet management and readiness"

    },

    drivers: {

        section:
            "page-drivers",

        title:
            "Drivers",

        subtitle:
            "Driver operations"

    },

    dispatch: {

        section:
            "page-dispatch",

        title:
            "Dispatch",

        subtitle:
            "Dispatch board and operations"

    },

    network: {

        section:
            "page-network",

        title:
            "Live Network",

        subtitle:
            "Network operations"

    },

    exceptions: {

        section:
            "page-exceptions",

        title:
            "Exception Center",

        subtitle:
            "Operational exceptions"

    },

    alerts: {

        section:
            "page-alerts",

        title:
            "Alerts",

        subtitle:
            "Alert management"

    },

    maintenance: {

        section:
            "page-maintenance",

        title:
            "Maintenance",

        subtitle:
            "Vehicle maintenance"

    },

    analytics: {

        section:
            "page-analytics",

        title:
            "Analytics",

        subtitle:
            "Operational analytics"

    },

    customers: {

        section:
            "page-customers",

        title:
            "Customer Intelligence",

        subtitle:
            "Customer operations"

    },

    reports: {

        section:
            "page-reports",

        title:
            "Reports",

        subtitle:
            "Operational reports"

    },

    assignments: {

        section:
            "page-assignments",

        title:
            "Assignments",

        subtitle:
            "Shipment assignments"

    },

    settings: {

        section:
            "page-settings",

        title:
            "Settings",

        subtitle:
            "System configuration"

    }

};


/* ==========================================================
   SHOW PAGE
========================================================== */

function showPage(page){

    const config =
        adminPageMap[page] ||
        adminPageMap.dashboard;


    document
        .querySelectorAll(".admin-page")
        .forEach(
            section => {

                section.classList.add(
                    "hidden"
                );

            }
        );


    const selectedPage =
        document.getElementById(
            config.section
        );


    if(!selectedPage){

        console.warn(
            "Admin page not found:",
            config.section
        );

        return;

    }


    selectedPage.classList.remove(
        "hidden"
    );


    document
        .querySelectorAll(
            ".admin-nav-item[data-page]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                        page
                );

            }
        );


    setText(
        "adminPageTitle",
        config.title
    );

    setText(
        "adminPageSubtitle",
        config.subtitle
    );

    setText(
        "pageTitle",
        config.title
    );

    setText(
        "pageSubtitle",
        config.subtitle
    );


    state.currentPage =
        page;


    if(page === "shipments"){

        renderShipmentTable(
            state.shipments
        );

    }


    if(
        page === "network" ||
        page === "dashboard"
    ){

        setTimeout(
            refreshMaps,
            150
        );

    }

}


/* ==========================================================
   NAVIGATION
========================================================== */

function setupNavigation(){

    document
        .querySelectorAll(
            ".admin-nav-item[data-page]"
        )
        .forEach(
            button => {

                if(
                    button.dataset.bound ===
                    "true"
                ){

                    return;

                }


                button.dataset.bound =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        showPage(
                            button.dataset.page
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-page-go]"
        )
        .forEach(
            button => {

                if(
                    button.dataset.bound ===
                    "true"
                ){

                    return;

                }


                button.dataset.bound =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        showPage(
                            button.dataset.pageGo
                        );

                    }
                );

            }
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
            "TRANSLOGIX CUSTOMERS:",
            state.customers
        );


        return state.customers;

    }
    catch(error){

        console.error(
            "Customer loading failed:",
            error
        );


        state.customers =
            [];


        showToast(
            "Customer loading failed",
            error.message,
            "error"
        );


        return [];

    }

}


/* ==========================================================
   LOAD ADMIN SHIPMENTS
========================================================== */

async function loadShipments(){

    try{

        const data =
            await api(
                "/api/admin/shipments"
            );


        if(
            Array.isArray(data)
        ){

            state.shipments =
                data;

        }
        else if(
            Array.isArray(
                data?.content
            )
        ){

            state.shipments =
                data.content;

        }
        else{

            state.shipments =
                [];

        }


        console.log(
            "TRANSLOGIX ADMIN SHIPMENTS:",
            state.shipments
        );


        updateDashboardStats();

        renderShipmentTable(
            state.shipments
        );


        updateControlTower();


        return state.shipments;

    }
    catch(error){

        console.error(
            "Shipment loading failed:",
            error
        );


        state.shipments =
            [];


        updateDashboardStats();

        renderShipmentTable([]);


        showToast(
            "Shipment loading failed",
            error.message,
            "error"
        );


        return [];

    }

}


/* ==========================================================
   CUSTOMER OPTIONS
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


    return state.customers

        .filter(
            customer =>
                customer &&
                customer.username
        )

        .map(
            customer => {

                const username =
                    escapeHtml(
                        customer.username
                    );


                return `
                    <option value="${username}">
                        ${username}
                    </option>
                `;

            }
        )

        .join("");

}


/* ==========================================================
   CREATE SHIPMENT MODAL
========================================================== */

async function openCreateShipmentModal(){

    await loadCustomers();


    document
        .getElementById(
            "createShipmentModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "createShipmentModal";


    modal.className =
        "modal-overlay";


    modal.innerHTML = `

        <div class="modal-content">

            <div class="modal-header">

                <div>

                    <span>
                        TRANSLOGIX OPERATION
                    </span>

                    <h2>
                        Create Shipment
                    </h2>

                </div>

                <button
                    type="button"
                    class="modal-close"
                    id="closeCreateShipment"
                >
                    ×
                </button>

            </div>


            <form
                id="createShipmentForm"
                class="shipment-form"
            >

                <div class="form-group">

                    <label>
                        Tracking Number
                    </label>

                    <input
                        name="trackingNumber"
                        type="text"
                        required
                        placeholder="TRX10007"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Sender Name
                    </label>

                    <input
                        name="senderName"
                        type="text"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Receiver Name
                    </label>

                    <input
                        name="receiverName"
                        type="text"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Origin
                    </label>

                    <input
                        name="origin"
                        type="text"
                        required
                        placeholder="Pune"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Destination
                    </label>

                    <input
                        name="destination"
                        type="text"
                        required
                        placeholder="Mumbai"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Customer
                    </label>

                    <select
                        name="username"
                        required
                    >

                        <option value="">
                            Select Customer
                        </option>

                        ${customerOptions()}

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Shipment Type
                    </label>

                    <select
                        name="shipmentType"
                        required
                    >

                        <option value="">
                            Select Type
                        </option>

                        <option value="Express">
                            Express
                        </option>

                        <option value="Standard">
                            Standard
                        </option>

                        <option value="Freight">
                            Freight
                        </option>

                        <option value="Courier">
                            Courier
                        </option>

                        <option value="Cold Chain">
                            Cold Chain
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Status
                    </label>

                    <select
                        name="status"
                        required
                    >

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="In Transit">
                            In Transit
                        </option>

                        <option value="Out for Delivery">
                            Out for Delivery
                        </option>

                        <option value="Delivered">
                            Delivered
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        name="weight"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                    >

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelCreateShipment"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Create Shipment
                    </button>

                </div>

            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeCreateShipment"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );


    document
        .getElementById(
            "cancelCreateShipment"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );


    document
        .getElementById(
            "createShipmentForm"
        )
        ?.addEventListener(
            "submit",
            submitShipment
        );

}


/* ==========================================================
   SUBMIT SHIPMENT
========================================================== */

async function submitShipment(
    event
){

    event.preventDefault();


    const form =
        event.target;


    const formData =
        new FormData(form);


    const payload = {

        trackingNumber:
            String(
                formData.get(
                    "trackingNumber"
                ) || ""
            ).trim(),

        senderName:
            String(
                formData.get(
                    "senderName"
                ) || ""
            ).trim(),

        receiverName:
            String(
                formData.get(
                    "receiverName"
                ) || ""
            ).trim(),

        origin:
            String(
                formData.get(
                    "origin"
                ) || ""
            ).trim(),

        destination:
            String(
                formData.get(
                    "destination"
                ) || ""
            ).trim(),

        shipmentType:
            String(
                formData.get(
                    "shipmentType"
                ) || ""
            ).trim(),

        status:
            String(
                formData.get(
                    "status"
                ) || "Pending"
            ).trim(),

        weight:
            Number(
                formData.get(
                    "weight"
                )
            ),

        username:
            String(
                formData.get(
                    "username"
                ) || ""
            ).trim()

    };


    if(
        !payload.trackingNumber ||
        !payload.senderName ||
        !payload.receiverName ||
        !payload.origin ||
        !payload.destination ||
        !payload.shipmentType ||
        !payload.username
    ){

        showToast(
            "Validation error",
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    if(
        !Number.isFinite(
            payload.weight
        ) ||
        payload.weight <= 0
    ){

        showToast(
            "Validation error",
            "Weight must be greater than 0.",
            "error"
        );

        return;

    }


    try{

        await api(
            "/api/admin/shipments",
            {

                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


        document
            .getElementById(
                "createShipmentModal"
            )
            ?.remove();


        await loadShipments();


        showToast(
            "Shipment created",
            `${payload.trackingNumber} assigned to ${payload.username}`,
            "success"
        );

    }
    catch(error){

        console.error(
            "Shipment creation failed:",
            error
        );


        showToast(
            "Shipment creation failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   DASHBOARD STATS
========================================================== */

function updateDashboardStats(){

    const shipments =
        Array.isArray(
            state.shipments
        )
            ? state.shipments
            : [];


    const normalize =
        value =>
            String(
                value || ""
            )
            .trim()
            .toLowerCase();


    const total =
        shipments.length;


    const pending =
        shipments.filter(
            shipment =>
                normalize(
                    shipment.status
                ) === "pending"
        ).length;


    const inTransit =
        shipments.filter(
            shipment =>
                normalize(
                    shipment.status
                ) === "in transit"
        ).length;


    const outForDelivery =
        shipments.filter(
            shipment =>
                normalize(
                    shipment.status
                ) ===
                "out for delivery"
        ).length;


    const delivered =
        shipments.filter(
            shipment =>
                normalize(
                    shipment.status
                ) === "delivered"
        ).length;


    const exceptions =
        shipments.filter(
            shipment => {

                const status =
                    normalize(
                        shipment.status
                    );

                return (
                    status.includes(
                        "exception"
                    ) ||
                    status.includes(
                        "failed"
                    ) ||
                    status.includes(
                        "delayed"
                    ) ||
                    status.includes(
                        "risk"
                    )
                );

            }
        ).length;


    /* Current dashboard IDs */

    setText(
        "shipmentTotal",
        total
    );

    setText(
        "shipmentActive",
        inTransit +
        outForDelivery
    );

    setText(
        "shipmentDelivered",
        delivered
    );

    setText(
        "shipmentExceptions",
        exceptions
    );


    setText(
        "kpiTotal",
        total
    );

    setText(
        "kpiTransit",
        inTransit
    );

    setText(
        "kpiDelivered",
        delivered
    );

    setText(
        "kpiExceptions",
        exceptions
    );


    /* Older dashboard IDs */

    setText(
        "totalShipments",
        total
    );

    setText(
        "pendingShipments",
        pending
    );

    setText(
        "inTransitShipments",
        inTransit
    );

    setText(
        "outForDeliveryShipments",
        outForDelivery
    );

    setText(
        "deliveredShipments",
        delivered
    );


    /* Tower IDs */

    setText(
        "towerActiveShipments",
        inTransit +
        outForDelivery
    );

    setText(
        "towerInTransit",
        inTransit
    );

    setText(
        "towerDelivered",
        delivered
    );

    setText(
        "towerExceptions",
        exceptions
    );

    setText(
        "towerActiveCount",
        inTransit +
        outForDelivery
    );

    setText(
        "towerTransitCount",
        inTransit
    );

    setText(
        "towerDeliveredCount",
        delivered
    );

    setText(
        "towerExceptionCount",
        exceptions
    );


    setText(
        "shipmentFlowCount",
        total
    );


    setText(
        "towerLastUpdated",
        `Updated ${new Date().toLocaleTimeString()}`
    );

}


/* ==========================================================
   CONTROL TOWER
========================================================== */

function updateControlTower(){

    updateDashboardStats();


    const total =
        state.shipments.length;


    const inTransit =
        state.shipments.filter(
            shipment =>
                String(
                    shipment.status || ""
                ).toLowerCase()
                === "in transit"
        ).length;


    const delivered =
        state.shipments.filter(
            shipment =>
                String(
                    shipment.status || ""
                ).toLowerCase()
                === "delivered"
        ).length;


    const exceptions =
        state.shipments.filter(
            shipment => {

                const status =
                    String(
                        shipment.status || ""
                    ).toLowerCase();

                return (
                    status.includes(
                        "exception"
                    ) ||
                    status.includes(
                        "delayed"
                    ) ||
                    status.includes(
                        "failed"
                    )
                );

            }
        ).length;


    setText(
        "towerActiveShipments",
        total
    );

    setText(
        "towerInTransit",
        inTransit
    );

    setText(
        "towerDelivered",
        delivered
    );

    setText(
        "towerExceptions",
        exceptions
    );

}


/* ==========================================================
   SHIPMENT TABLE
========================================================== */

function renderShipmentTable(
    shipments = []
){

    /*
     * IMPORTANT:
     * Actual HTML uses #shipmentTable.
     * NOT #shipmentTableBody.
     */

    const tableBody =
        document.querySelector(
            "#shipmentTable"
        );


    if(!tableBody){

        console.warn(
            "Shipment table #shipmentTable not found."
        );

        return;

    }


    if(
        !Array.isArray(shipments) ||
        shipments.length === 0
    ){

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="text-align:center;"
                >

                    No shipments found.

                </td>

            </tr>

        `;

        return;

    }


    tableBody.innerHTML =
        shipments
            .map(
                shipment => {

                    const id =
                        escapeHtml(
                            shipment.id ??
                            ""
                        );


                    const tracking =
                        escapeHtml(
                            shipment.trackingNumber ||
                            "-"
                        );


                    const sender =
                        escapeHtml(
                            shipment.senderName ||
                            "-"
                        );


                    const receiver =
                        escapeHtml(
                            shipment.receiverName ||
                            "-"
                        );


                    const origin =
                        escapeHtml(
                            shipment.origin ||
                            "-"
                        );


                    const destination =
                        escapeHtml(
                            shipment.destination ||
                            "-"
                        );


                    const type =
                        escapeHtml(
                            shipment.shipmentType ||
                            "-"
                        );


                    const status =
                        escapeHtml(
                            shipment.status ||
                            "Pending"
                        );


                    const weight =
                        shipment.weight ??
                        "-";


                    const username =
                        escapeHtml(
                            shipment.username ||
                            shipment.user?.username ||
                            "-"
                        );


                    return `

                        <tr>

                            <td>
                                ${tracking}
                            </td>

                            <td>
                                ${sender}
                            </td>

                            <td>
                                ${receiver}
                            </td>

                            <td>
                                ${origin}
                            </td>

                            <td>
                                ${destination}
                            </td>

                            <td>
                                ${type}
                            </td>

                            <td>
                                ${weight} kg
                            </td>

                            <td>
                                <span
                                    class="status-badge"
                                >
                                    ${status}
                                </span>
                            </td>

                            <td>
                                ${username}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="btn btn-sm btn-primary"
                                    data-view-shipment="${id}"
                                >
                                    View
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    tableBody
        .querySelectorAll(
            "[data-view-shipment]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        viewShipment(
                            button.dataset
                                .viewShipment
                        );

                    }
                );

            }
        );

}


/* ==========================================================
   VIEW SHIPMENT
========================================================== */

async function viewShipment(
    shipmentId
){

    if(!shipmentId){

        return;

    }


    try{

        /*
         * ADMIN endpoint.
         * Do NOT use public tracking endpoint here.
         */

        const shipment =
            await api(
                `/api/admin/shipments/${encodeURIComponent(
                    shipmentId
                )}`
            );


        state.selectedShipment =
            shipment;


        openShipmentDetails(
            shipment
        );

    }
    catch(error){

        showToast(
            "Shipment details failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   SHIPMENT DETAILS MODAL
========================================================== */

function openShipmentDetails(
    shipment
){

    const modal =
        document.getElementById(
            "adminModal"
        );


    const title =
        document.getElementById(
            "modalTitle"
        );


    const content =
        document.getElementById(
            "modalContent"
        );


    if(
        !modal ||
        !content
    ){

        return;

    }


    if(title){

        title.textContent =
            `Shipment ${shipment.trackingNumber || ""}`;

    }


    content.innerHTML = `

        <div class="shipment-detail-grid">

            <div>
                <span>Tracking</span>
                <strong>
                    ${escapeHtml(
                        shipment.trackingNumber
                    )}
                </strong>
            </div>

            <div>
                <span>Status</span>
                <strong>
                    ${escapeHtml(
                        shipment.status
                    )}
                </strong>
            </div>

            <div>
                <span>Sender</span>
                <strong>
                    ${escapeHtml(
                        shipment.senderName
                    )}
                </strong>
            </div>

            <div>
                <span>Receiver</span>
                <strong>
                    ${escapeHtml(
                        shipment.receiverName
                    )}
                </strong>
            </div>

            <div>
                <span>Origin</span>
                <strong>
                    ${escapeHtml(
                        shipment.origin
                    )}
                </strong>
            </div>

            <div>
                <span>Destination</span>
                <strong>
                    ${escapeHtml(
                        shipment.destination
                    )}
                </strong>
            </div>

            <div>
                <span>Type</span>
                <strong>
                    ${escapeHtml(
                        shipment.shipmentType
                    )}
                </strong>
            </div>

            <div>
                <span>Weight</span>
                <strong>
                    ${shipment.weight ?? "-"} kg
                </strong>
            </div>

            <div>
                <span>Customer</span>
                <strong>
                    ${escapeHtml(
                        shipment.username ||
                        shipment.user?.username ||
                        "-"
                    )}
                </strong>
            </div>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


/* ==========================================================
   MODAL
========================================================== */

function setupModal(){

    const modal =
        document.getElementById(
            "adminModal"
        );


    const close =
        document.getElementById(
            "adminModalClose"
        );


    if(close){

        close.addEventListener(
            "click",
            () => {

                modal?.classList.add(
                    "hidden"
                );

            }
        );

    }


    if(modal){

        modal.addEventListener(
            "click",
            event => {

                if(
                    event.target ===
                    modal
                ){

                    modal.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }

}


/* ==========================================================
   CREATE SHIPMENT BUTTON
========================================================== */

function setupCreateShipment(){

    document
        .querySelectorAll(
            "#createShipmentBtn, [data-admin-action='createShipment'], [data-action='create-shipment']"
        )
        .forEach(
            button => {

                if(
                    button.dataset
                        .createBound ===
                    "true"
                ){

                    return;

                }


                button.dataset
                    .createBound =
                    "true";


                button.addEventListener(
                    "click",
                    openCreateShipmentModal
                );

            }
        );

}


/* ==========================================================
   REFRESH
========================================================== */

function setupRefresh(){

    const buttons = [

        document.getElementById(
            "adminRefresh"
        ),

        document.getElementById(
            "towerRefreshBtn"
        )

    ].filter(Boolean);


    buttons.forEach(
        button => {

            if(
                button.dataset
                    .refreshBound ===
                "true"
            ){

                return;

            }


            button.dataset
                .refreshBound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    button.disabled =
                        true;


                    try{

                        await loadCustomers();

                        await loadShipments();

                        refreshMaps();


                        showToast(
                            "Dashboard refreshed",
                            "Latest operational data loaded.",
                            "success"
                        );

                    }
                    catch(error){

                        showToast(
                            "Refresh failed",
                            error.message,
                            "error"
                        );

                    }
                    finally{

                        button.disabled =
                            false;

                    }

                }
            );

        }
    );

}


/* ==========================================================
   SHIPMENT SEARCH + FILTER
========================================================== */

function setupShipmentFilters(){

    const search =
        document.getElementById(
            "shipmentSearch"
        );


    const filter =
        document.getElementById(
            "shipmentStatusFilter"
        );


    const render =
        () => {

            let result =
                [...state.shipments];


            const searchValue =
                String(
                    search?.value ||
                    ""
                )
                .trim()
                .toLowerCase();


            const statusValue =
                String(
                    filter?.value ||
                    ""
                )
                .trim()
                .toLowerCase();


            if(searchValue){

                result =
                    result.filter(
                        shipment => {

                            const text =
                                [

                                    shipment.trackingNumber,

                                    shipment.senderName,

                                    shipment.receiverName,

                                    shipment.origin,

                                    shipment.destination,

                                    shipment.username,

                                    shipment.user?.username

                                ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                            return text.includes(
                                searchValue
                            );

                        }
                    );

            }


            if(
                statusValue &&
                statusValue !== "all"
            ){

                result =
                    result.filter(
                        shipment =>
                            String(
                                shipment.status ||
                                ""
                            )
                            .toLowerCase() ===
                            statusValue
                    );

            }


            renderShipmentTable(
                result
            );

        };


    search?.addEventListener(
        "input",
        render
    );


    filter?.addEventListener(
        "change",
        render
    );

}


/* ==========================================================
   EXPORT SHIPMENTS
========================================================== */

function setupExport(){

    const button =
        document.getElementById(
            "exportShipments"
        );


    if(!button){

        return;

    }


    button.addEventListener(
        "click",
        () => {

            if(
                !state.shipments.length
            ){

                showToast(
                    "Nothing to export",
                    "No shipments available.",
                    "error"
                );

                return;

            }


            const headers = [

                "Tracking Number",

                "Sender",

                "Receiver",

                "Origin",

                "Destination",

                "Type",

                "Weight",

                "Status",

                "Customer"

            ];


            const rows =
                state.shipments.map(
                    shipment => [

                        shipment.trackingNumber,

                        shipment.senderName,

                        shipment.receiverName,

                        shipment.origin,

                        shipment.destination,

                        shipment.shipmentType,

                        shipment.weight,

                        shipment.status,

                        shipment.username ||
                        shipment.user?.username ||
                        ""

                    ]
                );


            const csv = [

                headers,

                ...rows

            ]
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value ??
                                    ""
                                ).replaceAll(
                                    '"',
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");


            const blob =
                new Blob(
                    [csv],
                    {
                        type:
                            "text/csv;charset=utf-8;"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                `translogix-shipments-${Date.now()}.csv`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );


            showToast(
                "Export completed",
                "Shipment CSV downloaded.",
                "success"
            );

        }
    );

}


/* ==========================================================
   GLOBAL SEARCH
========================================================== */

function setupGlobalSearch(){

    const input =
        document.getElementById(
            "adminGlobalSearch"
        );


    if(!input){

        return;

    }


    input.addEventListener(
        "keydown",
        event => {

            if(
                event.key !==
                "Enter"
            ){

                return;

            }


            const query =
                input.value
                    .trim()
                    .toLowerCase();


            if(!query){

                return;

            }


            const shipment =
                state.shipments.find(
                    item => {

                        const tracking =
                            String(
                                item.trackingNumber ||
                                ""
                            )
                            .toLowerCase();


                        return tracking ===
                            query;

                    }
                );


            if(shipment){

                showPage(
                    "shipments"
                );


                setTimeout(
                    () => {

                        viewShipment(
                            shipment.id
                        );

                    },
                    100
                );


                return;

            }


            showPage(
                "shipments"
            );


            const shipmentSearch =
                document.getElementById(
                    "shipmentSearch"
                );


            if(shipmentSearch){

                shipmentSearch.value =
                    input.value;

                shipmentSearch.dispatchEvent(
                    new Event(
                        "input"
                    )
                );

            }

        }
    );

}


/* ==========================================================
   LOGOUT
========================================================== */

function setupLogout(){

    const logout =
        document.getElementById(
            "adminLogout"
        );


    if(!logout){

        return;

    }


    logout.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "jwt"
            );

            localStorage.removeItem(
                "accessToken"
            );


            window.location.href =
                "./login.html";

        }
    );

}


/* ==========================================================
   MOBILE MENU
========================================================== */

function setupMobileMenu(){

    const sidebar =
        document.getElementById(
            "adminSidebar"
        );


    const menu =
        document.getElementById(
            "adminMenu"
        );


    if(
        !sidebar ||
        !menu
    ){

        return;

    }


    menu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


/* ==========================================================
   MAP
========================================================== */

function initDashboardMap(){

    const mapElement =
        document.getElementById(
            "networkMap"
        );


    if(
        !mapElement ||
        typeof L ===
        "undefined"
    ){

        return;

    }


    if(
        state.maps.network
    ){

        setTimeout(
            () => {

                state.maps.network.invalidateSize();

            },
            150
        );

        return;

    }


    state.maps.network =
        L.map(
            mapElement,
            {
                zoomControl:
                    true
            }
        )
        .setView(
            [19.0760, 72.8777],
            6
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom:
                19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    )
    .addTo(
        state.maps.network
    );


    const hubs = [

        {
            name:
                "Pune Hub",

            coords:
                [18.5204, 73.8567]

        },

        {
            name:
                "Mumbai Hub",

            coords:
                [19.0760, 72.8777]

        },

        {
            name:
                "Delhi Hub",

            coords:
                [28.6139, 77.2090]

        },

        {
            name:
                "Nashik Hub",

            coords:
                [20.0059, 73.7897]

        }

    ];


    hubs.forEach(
        hub => {

            L.marker(
                hub.coords
            )
            .addTo(
                state.maps.network
            )
            .bindPopup(
                `<strong>${escapeHtml(
                    hub.name
                )}</strong>`
            );

        }
    );


    refreshShipmentMapMarkers();

}


/* ==========================================================
   SHIPMENT MAP MARKERS
========================================================== */

function refreshShipmentMapMarkers(){

    const map =
        state.maps.network;


    if(!map){

        return;

    }


    if(
        state.maps.shipmentLayer
    ){

        state.maps.shipmentLayer.clearLayers();

    }
    else{

        state.maps.shipmentLayer =
            L.layerGroup()
                .addTo(map);

    }


    const routeMap = {

        "pune":
            [18.5204, 73.8567],

        "mumbai":
            [19.0760, 72.8777],

        "delhi":
            [28.6139, 77.2090],

        "nashik":
            [20.0059, 73.7897],

        "bangalore":
            [12.9716, 77.5946],

        "hyderabad":
            [17.3850, 78.4867],

        "nagpur":
            [21.1458, 79.0882]

    };


    state.shipments.forEach(
        shipment => {

            const destination =
                String(
                    shipment.destination ||
                    ""
                )
                .trim()
                .toLowerCase();


            const origin =
                String(
                    shipment.origin ||
                    ""
                )
                .trim()
                .toLowerCase();


            const destinationPoint =
                routeMap[destination];


            const originPoint =
                routeMap[origin];


            if(
                !originPoint ||
                !destinationPoint
            ){

                return;

            }


            const line =
                L.polyline(
                    [
                        originPoint,
                        destinationPoint
                    ],
                    {
                        weight:
                            3,

                        opacity:
                            0.7
                    }
                );


            line.bindPopup(
                `
                    <strong>
                        ${escapeHtml(
                            shipment.trackingNumber
                        )}
                    </strong>
                    <br>
                    ${escapeHtml(
                        shipment.origin
                    )}
                    →
                    ${escapeHtml(
                        shipment.destination
                    )}
                    <br>
                    Status:
                    ${escapeHtml(
                        shipment.status
                    )}
                `
            );


            line.addTo(
                state.maps.shipmentLayer
            );

        }
    );

}


/* ==========================================================
   REFRESH MAPS
========================================================== */

function refreshMaps(){

    if(
        state.maps.network
    ){

        state.maps.network.invalidateSize();

        refreshShipmentMapMarkers();

    }
    else{

        initDashboardMap();

    }

}


/* ==========================================================
   SIMPLE ACTION HANDLER
========================================================== */

function setupActions(){

    document
        .addEventListener(
            "click",
            event => {

                const actionElement =
                    event.target.closest(
                        "[data-action]"
                    );


                if(!actionElement){

                    return;

                }


                const action =
                    actionElement.dataset
                        .action;


                if(
                    action ===
                    "create-shipment"
                ){

                    openCreateShipmentModal();

                }


                if(
                    action ===
                    "dashboard"
                ){

                    showPage(
                        "dashboard"
                    );

                }

            }
        );

}


/* ==========================================================
   INIT
========================================================== */

async function initAdmin(){

    try{

        setupNavigation();

        setupActions();

        setupCreateShipment();

        setupRefresh();

        setupShipmentFilters();

        setupGlobalSearch();

        setupExport();

        setupLogout();

        setupMobileMenu();

        setupModal();


        showPage(
            "dashboard"
        );


        await loadCustomers();

        await loadShipments();


        initDashboardMap();

        updateControlTower();


        /*
         * Copilot uses window.state.
         */

        window.state =
            state;


        console.log(
            "TRANSLOGIX ADMIN CONTROL TOWER READY"
        );

    }
    catch(error){

        console.error(
            "TRANSLOGIX ADMIN INITIALIZATION ERROR:",
            error
        );


        showToast(
            "Admin initialization failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   START
========================================================== */

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        initAdmin
    );

}
else{

    initAdmin();

}


/* ==========================================================
   GLOBAL ACCESS
========================================================== */

window.state =
    state;

window.showPage =
    showPage;

window.loadShipments =
    loadShipments;

window.loadCustomers =
    loadCustomers;

window.viewShipment =
    viewShipment;

window.openCreateShipmentModal =
    openCreateShipmentModal;

window.refreshMaps =
    refreshMaps;

window.updateControlTower =
    updateControlTower;