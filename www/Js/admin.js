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

function getToken() {

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

async function api(endpoint, options = {}) {

    const token = getToken();

    const config = {
        ...options,

        headers: {
            "Content-Type": "application/json",

            ...(options.headers || {}),

            ...(token
                ? {
                    "Authorization":
                        `Bearer ${token}`
                }
                : {})
        }
    };


    try {

        const response =
            await fetch(
                `${ADMIN_API}${endpoint}`,
                config
            );


        const text =
            await response.text();


        let data = null;


        try {

            data =
                text
                    ? JSON.parse(text)
                    : null;

        }
        catch {

            data = text;

        }


        if (response.status === 401) {

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


        if (response.status === 403) {

            throw new Error(
                "Administrator permission required."
            );

        }


        if (!response.ok) {

            let message =
                "Request failed.";

            if (
                typeof data === "string" &&
                data
            ) {

                message = data;

            }
            else if (data?.message) {

                message =
                    data.message;

            }
            else if (data?.error) {

                message =
                    data.error;

            }

            throw new Error(message);

        }


        return data;

    }
    catch (error) {

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
) {

    if (
        typeof window.showToast ===
        "function"
    ) {

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

async function loadCustomers() {

    try {

        console.log(
            "Loading customers..."
        );


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


        console.log(
            "CUSTOMER COUNT:",
            state.customers.length
        );


        return state.customers;

    }
    catch (error) {

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
   LOAD SHIPMENTS
========================================================== */

async function loadShipments() {

    try {

        console.log(
            "Loading admin shipments..."
        );


        const data =
            await api(
                "/api/admin/shipments"
            );


        if (
            Array.isArray(data)
        ) {

            state.shipments =
                data;

        }
        else if (
            Array.isArray(
                data?.content
            )
        ) {

            state.shipments =
                data.content;

        }
        else {

            state.shipments = [];

        }


        state.demoMode =
            false;


        console.log(
            "ADMIN SHIPMENTS LOADED:",
            state.shipments
        );

    }
    catch (error) {

        console.error(
            "Admin shipment loading failed:",
            error
        );


        state.shipments = [];

        state.demoMode =
            true;


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
   CUSTOMER DROPDOWN
========================================================== */

function customerOptions() {

    if (
        !Array.isArray(
            state.customers
        ) ||
        state.customers.length === 0
    ) {

        console.warn(
            "No customers available."
        );


        return `
            <option value="">
                No customers available
            </option>
        `;

    }


    const customers =
        state.customers.filter(
            customer => {

                return (
                    customer &&
                    customer.username &&
                    String(
                        customer.role || ""
                    ).toUpperCase() ===
                    "USER"
                );

            }
        );


    console.log(
        "CUSTOMERS FOR DROPDOWN:",
        customers
    );


    if (
        customers.length === 0
    ) {

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

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ==========================================================
   CREATE SHIPMENT MODAL
========================================================== */

async function openCreateShipmentModal() {

    console.log(
        "OPEN CREATE SHIPMENT MODAL"
    );


    await loadCustomers();


    console.log(
        "CUSTOMERS BEFORE MODAL:",
        state.customers
    );


    const customerOptionsHtml =
        customerOptions();


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
                    &times;
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
                        type="text"
                        name="trackingNumber"
                        required
                        placeholder="TRX10007"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Sender Name
                    </label>

                    <input
                        type="text"
                        name="senderName"
                        required
                        placeholder="Sender name"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Receiver Name
                    </label>

                    <input
                        type="text"
                        name="receiverName"
                        required
                        placeholder="Receiver name"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Origin
                    </label>

                    <input
                        type="text"
                        name="origin"
                        required
                        placeholder="Pune"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Destination
                    </label>

                    <input
                        type="text"
                        name="destination"
                        required
                        placeholder="Delhi"
                    >

                </div>


                <!-- CUSTOMER -->

                <div class="form-group">

                    <label>
                        Customer
                    </label>

                    <select
                        name="username"
                        id="customerUsername"
                        required
                    >

                        <option value="">
                            Select Customer
                        </option>

                        ${customerOptionsHtml}

                    </select>

                </div>


                <!-- SHIPMENT TYPE -->

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


                <!-- WEIGHT -->

                <div class="form-group">

                    <label>
                        Weight KG
                    </label>

                    <input
                        type="number"
                        name="weight"
                        min="0.01"
                        step="0.01"
                        value="5"
                        required
                    >

                </div>


                <!-- STATUS -->

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

async function submitShipment(event) {

    event.preventDefault();


    const form =
        event.target;


    const formData =
        new FormData(form);


    const trackingNumber =
        String(
            formData.get(
                "trackingNumber"
            ) || ""
        ).trim();


    const senderName =
        String(
            formData.get(
                "senderName"
            ) || ""
        ).trim();


    const receiverName =
        String(
            formData.get(
                "receiverName"
            ) || ""
        ).trim();


    const origin =
        String(
            formData.get(
                "origin"
            ) || ""
        ).trim();


    const destination =
        String(
            formData.get(
                "destination"
            ) || ""
        ).trim();


    const username =
        String(
            formData.get(
                "username"
            ) || ""
        ).trim();


    const shipmentType =
        String(
            formData.get(
                "shipmentType"
            ) || ""
        ).trim();


    const status =
        String(
            formData.get(
                "status"
            ) || "Pending"
        ).trim();


    const weight =
        Number(
            formData.get(
                "weight"
            )
        );


    if (!trackingNumber) {

        showToast(
            "Validation error",
            "Tracking number is required.",
            "error"
        );

        return;

    }


    if (!senderName) {

        showToast(
            "Validation error",
            "Sender name is required.",
            "error"
        );

        return;

    }


    if (!receiverName) {

        showToast(
            "Validation error",
            "Receiver name is required.",
            "error"
        );

        return;

    }


    if (!origin) {

        showToast(
            "Validation error",
            "Origin is required.",
            "error"
        );

        return;

    }


    if (!destination) {

        showToast(
            "Validation error",
            "Destination is required.",
            "error"
        );

        return;

    }


    if (!username) {

        showToast(
            "Validation error",
            "Please select a customer.",
            "error"
        );

        return;

    }


    if (!shipmentType) {

        showToast(
            "Validation error",
            "Shipment type is required.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(weight) ||
        weight <= 0
    ) {

        showToast(
            "Validation error",
            "Weight must be greater than 0.",
            "error"
        );

        return;

    }


    const payload = {

        trackingNumber:
            trackingNumber,

        senderName:
            senderName,

        receiverName:
            receiverName,

        origin:
            origin,

        destination:
            destination,

        shipmentType:
            shipmentType,

        status:
            status,

        weight:
            weight,

        username:
            username

    };


    console.log(
        "CREATE SHIPMENT PAYLOAD:",
        payload
    );


    try {

        const createdShipment =
            await api(
                "/api/admin/shipments",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        console.log(
            "SHIPMENT CREATED:",
            createdShipment
        );


        modalClose();


        await loadCustomers();

        await loadShipments();


        showToast(
            "Shipment created",
            `${trackingNumber} assigned to ${username}`,
            "success"
        );

    }
    catch (error) {

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
   CLOSE MODAL
========================================================== */

function modalClose() {

    document
        .getElementById(
            "createShipmentModal"
        )
        ?.remove();

}


/* ==========================================================
   UPDATE STATS
========================================================== */

function updateStats() {

    const shipments =
        Array.isArray(
            state.shipments
        )
            ? state.shipments
            : [];


    const total =
        shipments.length;


    const pending =
        shipments.filter(
            shipment =>
                String(
                    shipment.status || ""
                ).toLowerCase() ===
                "pending"
        ).length;


    const inTransit =
        shipments.filter(
            shipment =>
                String(
                    shipment.status || ""
                ).toLowerCase() ===
                "in transit"
        ).length;


    const outForDelivery =
        shipments.filter(
            shipment =>
                String(
                    shipment.status || ""
                ).toLowerCase() ===
                "out for delivery"
        ).length;


    const delivered =
        shipments.filter(
            shipment =>
                String(
                    shipment.status || ""
                ).toLowerCase() ===
                "delivered"
        ).length;


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

}


/* ==========================================================
   SET TEXT
========================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ==========================================================
   SHIPMENT TABLE
========================================================== */

function renderShipmentTable(
    shipments = []
) {

    const tableBody =
        document.querySelector(
            "#shipmentTableBody"
        );


    if (!tableBody) {

        return;

    }


    if (
        !Array.isArray(
            shipments
        ) ||
        shipments.length === 0
    ) {

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
                            shipment.user?.username ||
                            shipment.username ||
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
                                ${status}
                            </td>

                            <td>
                                ${username}
                            </td>

                            <td>

                                <button
                                    class="btn btn-sm btn-primary"
                                    onclick="viewShipment('${tracking}')"
                                >
                                    View
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* ==========================================================
   VIEW SHIPMENT
========================================================== */

async function viewShipment(
    trackingNumber
) {

    try {

        const shipment =
            await api(
                `/api/shipments/tracking/${encodeURIComponent(
                    trackingNumber
                )}`
            );


        console.log(
            "SHIPMENT DETAILS:",
            shipment
        );


        showToast(
            "Shipment found",
            `${shipment.trackingNumber || trackingNumber}`,
            "success"
        );

    }
    catch (error) {

        showToast(
            "Shipment not found",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   CREATE BUTTON
========================================================== */

function setupCreateShipment() {

    console.log(
        "Setting up Create Shipment button..."
    );


    const buttons =
        document.querySelectorAll(
            "#createShipmentBtn, #addShipmentBtn, [data-action='create-shipment']"
        );


    console.log(
        "CREATE SHIPMENT BUTTONS FOUND:",
        buttons.length
    );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    console.log(
                        "CREATE SHIPMENT BUTTON CLICKED"
                    );


                    openCreateShipmentModal();

                }
            );

        }
    );

}


/* ==========================================================
   REFRESH
========================================================== */

function setupRefresh() {

    const button =
        document.getElementById(
            "refreshBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            await loadCustomers();

            await loadShipments();


            showToast(
                "Dashboard refreshed",
                "Latest data loaded.",
                "success"
            );

        }
    );

}


/* ==========================================================
   GLOBAL CREATE BUTTON FALLBACK
========================================================== */

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                "#createShipmentBtn, #addShipmentBtn, [data-action='create-shipment']"
            );


        if (!button) {

            return;

        }


        if (
            button.dataset.createBound ===
            "true"
        ) {

            return;

        }


        console.log(
            "CREATE SHIPMENT BUTTON CLICKED - FALLBACK"
        );


        openCreateShipmentModal();

    }
);


/* ==========================================================
   INITIALIZE ADMIN
========================================================== */

async function initAdmin() {

    try {

        console.log(
            "TRANSLOGIX ADMIN: initializing..."
        );


        if (
            typeof setupNavigation ===
            "function"
        ) {

            setupNavigation();

        }


        if (
            typeof setupShipmentTable ===
            "function"
        ) {

            setupShipmentTable();

        }


        if (
            typeof setupShipmentFilters ===
            "function"
        ) {

            setupShipmentFilters();

        }


        setupCreateShipment();


        setupRefresh();


        if (
            typeof setupExceptions ===
            "function"
        ) {

            setupExceptions();

        }


        if (
            typeof setupGlobalSearch ===
            "function"
        ) {

            setupGlobalSearch();

        }


        if (
            typeof setupNotification ===
            "function"
        ) {

            setupNotification();

        }


        if (
            typeof setupExport ===
            "function"
        ) {

            setupExport();

        }


        if (
            typeof setupReportButton ===
            "function"
        ) {

            setupReportButton();

        }


        if (
            typeof setupActions ===
            "function"
        ) {

            setupActions();

        }


        if (
            typeof setupMobileMenu ===
            "function"
        ) {

            setupMobileMenu();

        }


        if (
            typeof setupModal ===
            "function"
        ) {

            setupModal();

        }


        if (
            typeof setupLogout ===
            "function"
        ) {

            setupLogout();

        }


        if (
            typeof setupAddVehicle ===
            "function"
        ) {

            setupAddVehicle();

        }


        if (
            typeof showPage ===
            "function"
        ) {

            showPage(
                "dashboard"
            );

        }


        await loadCustomers();


        await loadShipments();


        if (
            typeof initDashboardMap ===
            "function"
        ) {

            initDashboardMap();

        }


        console.log(
            "TRANSLOGIX ADMIN CONTROL TOWER READY"
        );

    }
    catch (error) {

        console.error(
            "Admin initialization failed:",
            error
        );

    }

}


/* ==========================================================
   START
========================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAdmin
    );

}
else {

    initAdmin();

}