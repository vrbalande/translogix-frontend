/* ==========================================================
   TRANSLOGIX ADMIN CONTROL TOWER
   PRODUCTION VERSION
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

    filteredShipments: [],

    customers: [],

    currentPage: "dashboard",

    maps: {},

    selectedVehicle: null,

    shipmentSearch: "",

    shipmentStatus: "all"

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
   SAFE TEXT
========================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

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
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

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
   API HELPER
========================================================== */

async function api(
    endpoint,
    options = {}
) {

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
                    "Authorization":
                        `Bearer ${token}`
                }
                : {})

        }

    };


    let response;

    try {

        response =
            await fetch(
                `${ADMIN_API}${endpoint}`,
                config
            );

    }
    catch (error) {

        console.error(
            "Network error:",
            endpoint,
            error
        );

        throw new Error(
            "Unable to connect to Translogix backend."
        );

    }


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


    /* ======================================================
       401
    ====================================================== */

    if (
        response.status === 401
    ) {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "jwt"
        );

        localStorage.removeItem(
            "accessToken"
        );

        showToast(
            "Session expired",
            "Please login again.",
            "error"
        );

        setTimeout(() => {

            window.location.href =
                "./login.html";

        }, 1000);

        throw new Error(
            "Unauthorized"
        );

    }


    /* ======================================================
       403
    ====================================================== */

    if (
        response.status === 403
    ) {

        throw new Error(
            "Administrator permission required."
        );

    }


    /* ======================================================
       OTHER ERRORS
    ====================================================== */

    if (!response.ok) {

        let message =
            "Request failed.";

        if (
            typeof data === "string" &&
            data.trim()
        ) {

            message =
                data;

        }
        else if (
            data &&
            data.message
        ) {

            message =
                data.message;

        }
        else if (
            data &&
            data.error
        ) {

            message =
                data.error;

        }

        throw new Error(
            message
        );

    }


    return data;

}


/* ==========================================================
   LOAD CUSTOMERS
========================================================== */

async function loadCustomers() {

    try {

        const data =
            await api(
                "/api/admin/users"
            );


        state.customers =
            Array.isArray(data)
                ? data.filter(
                    user =>
                        user &&
                        String(
                            user.role || ""
                        ).toUpperCase()
                        === "USER"
                )
                : [];


        console.log(
            "CUSTOMERS LOADED:",
            state.customers
        );


        return state.customers;

    }
    catch (error) {

        state.customers =
            [];

        console.error(
            "Customer loading failed:",
            error
        );

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

async function loadShipments() {

    try {

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

            state.shipments =
                [];

        }


        console.log(
            "ADMIN SHIPMENTS:",
            state.shipments
        );


        applyShipmentFilters();

        updateStats();

        updateSidebarShipmentCount();


        return state.shipments;

    }
    catch (error) {

        state.shipments =
            [];

        state.filteredShipments =
            [];

        updateStats();

        renderShipmentTable(
            []
        );

        console.error(
            "Shipment loading failed:",
            error
        );

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

function customerOptions() {

    if (
        !Array.isArray(
            state.customers
        ) ||
        state.customers.length === 0
    ) {

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
   CREATE SHIPMENT MODAL
========================================================== */

async function openCreateShipmentModal() {

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

                <h2>
                    Create Shipment
                </h2>

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
                        placeholder="Mumbai"
                    >

                </div>


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
                        type="number"
                        name="weight"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="5"
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
) {

    event.preventDefault();


    const form =
        event.target;


    const formData =
        new FormData(
            form
        );


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


    if (
        !payload.trackingNumber ||
        !payload.senderName ||
        !payload.receiverName ||
        !payload.origin ||
        !payload.destination ||
        !payload.username ||
        !payload.shipmentType
    ) {

        showToast(
            "Validation error",
            "Please fill all required fields.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(
            payload.weight
        ) ||
        payload.weight <= 0
    ) {

        showToast(
            "Validation error",
            "Weight must be greater than 0.",
            "error"
        );

        return;

    }


    try {

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
            `${payload.trackingNumber} assigned to ${payload.username}.`,
            "success"
        );

    }
    catch (error) {

        console.error(
            "Create shipment error:",
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
   STATUS NORMALIZER
========================================================== */

function normalizeStatus(
    status
) {

    return String(
        status || ""
    )
        .trim()
        .toLowerCase();

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
            s =>
                normalizeStatus(
                    s.status
                ) === "pending"
        ).length;


    const inTransit =
        shipments.filter(
            s =>
                normalizeStatus(
                    s.status
                ) === "in transit"
        ).length;


    const outForDelivery =
        shipments.filter(
            s =>
                normalizeStatus(
                    s.status
                ) ===
                "out for delivery"
        ).length;


    const delivered =
        shipments.filter(
            s =>
                normalizeStatus(
                    s.status
                ) === "delivered"
        ).length;


    const exceptions =
        shipments.filter(
            s => {

                const status =
                    normalizeStatus(
                        s.status
                    );

                return (
                    status ===
                    "exception" ||
                    status ===
                    "delayed" ||
                    status ===
                    "cancelled"
                );

            }
        ).length;


    /* Existing HTML IDs */

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


    /* Alternative IDs */

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


    /* Dashboard KPI IDs */

    setText(
        "kpiTotal",
        total
    );

    setText(
        "kpiTransit",
        inTransit +
        outForDelivery
    );

    setText(
        "kpiDelivered",
        delivered
    );

    setText(
        "kpiExceptions",
        exceptions
    );

}


/* ==========================================================
   SIDEBAR COUNT
========================================================== */

function updateSidebarShipmentCount() {

    const count =
        Array.isArray(
            state.shipments
        )
            ? state.shipments.length
            : 0;


    const formatted =
        String(count)
            .padStart(
                2,
                "0"
            );


    setText(
        "sidebarShipmentCount",
        formatted
    );


    setText(
        "shipmentFlowCount",
        count
    );

}


/* ==========================================================
   FILTER SHIPMENTS
========================================================== */

function applyShipmentFilters() {

    const search =
        String(
            state.shipmentSearch
            || ""
        )
            .trim()
            .toLowerCase();


    const status =
        normalizeStatus(
            state.shipmentStatus
        );


    state.filteredShipments =
        state.shipments.filter(
            shipment => {

                const tracking =
                    String(
                        shipment.trackingNumber
                        || ""
                    ).toLowerCase();


                const sender =
                    String(
                        shipment.senderName
                        || ""
                    ).toLowerCase();


                const receiver =
                    String(
                        shipment.receiverName
                        || ""
                    ).toLowerCase();


                const origin =
                    String(
                        shipment.origin
                        || ""
                    ).toLowerCase();


                const destination =
                    String(
                        shipment.destination
                        || ""
                    ).toLowerCase();


                const username =
                    String(
                        shipment.username ||
                        shipment.user?.username ||
                        ""
                    ).toLowerCase();


                const shipmentStatus =
                    normalizeStatus(
                        shipment.status
                    );


                const matchesSearch =
                    !search ||
                    tracking.includes(search) ||
                    sender.includes(search) ||
                    receiver.includes(search) ||
                    origin.includes(search) ||
                    destination.includes(search) ||
                    username.includes(search);


                const matchesStatus =
                    !status ||
                    status === "all" ||
                    shipmentStatus === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderShipmentTable(
        state.filteredShipments
    );

}


/* ==========================================================
   RENDER SHIPMENT TABLE
========================================================== */

function renderShipmentTable(
    shipments = []
) {

    /*
     * IMPORTANT:
     * HTML uses #shipmentTable
     * NOT #shipmentTableBody.
     */

    const tableBody =
        document.getElementById(
            "shipmentTable"
        );


    if (!tableBody) {

        console.warn(
            "Element #shipmentTable not found."
        );

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

                    const id =
                        Number(
                            shipment.id
                        );


                    const tracking =
                        escapeHtml(
                            shipment.trackingNumber
                            || "-"
                        );


                    const sender =
                        escapeHtml(
                            shipment.senderName
                            || "-"
                        );


                    const receiver =
                        escapeHtml(
                            shipment.receiverName
                            || "-"
                        );


                    const origin =
                        escapeHtml(
                            shipment.origin
                            || "-"
                        );


                    const destination =
                        escapeHtml(
                            shipment.destination
                            || "-"
                        );


                    const type =
                        escapeHtml(
                            shipment.shipmentType
                            || "-"
                        );


                    const status =
                        escapeHtml(
                            shipment.status
                            || "Pending"
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

                        <tr
                            data-shipment-id="${id}"
                        >

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
                                    class="shipment-status"
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
                                    data-shipment-action="view"
                                    data-shipment-id="${id}"
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
    shipmentOrId
) {

    let shipmentId =
        Number(
            shipmentOrId
        );


    /*
     * If tracking number was passed,
     * find shipment locally.
     */

    if (
        !Number.isFinite(
            shipmentId
        )
    ) {

        const shipment =
            state.shipments.find(
                item =>
                    String(
                        item.trackingNumber
                    )
                    .toLowerCase() ===
                    String(
                        shipmentOrId
                    )
                    .toLowerCase()
            );


        if (shipment) {

            shipmentId =
                Number(
                    shipment.id
                );

        }

    }


    if (
        !Number.isFinite(
            shipmentId
        )
    ) {

        showToast(
            "Shipment error",
            "Shipment ID not found.",
            "error"
        );

        return;

    }


    try {

        /*
         * IMPORTANT:
         * Admin uses protected admin endpoint.
         */

        const shipment =
            await api(
                `/api/admin/shipments/${shipmentId}`
            );


        openShipmentDetailsModal(
            shipment
        );

    }
    catch (error) {

        showToast(
            "Unable to load shipment",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   SHIPMENT DETAILS MODAL
========================================================== */

function openShipmentDetailsModal(
    shipment
) {

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


    if (
        !modal ||
        !title ||
        !content
    ) {

        console.log(
            "Shipment details:",
            shipment
        );

        showToast(
            "Shipment loaded",
            shipment.trackingNumber || "",
            "success"
        );

        return;

    }


    title.textContent =
        `Shipment ${shipment.trackingNumber || ""}`;


    content.innerHTML = `

        <div class="shipment-detail-grid">

            <div>
                <strong>Tracking</strong>
                <span>
                    ${escapeHtml(
                        shipment.trackingNumber || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Status</strong>
                <span>
                    ${escapeHtml(
                        shipment.status || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Sender</strong>
                <span>
                    ${escapeHtml(
                        shipment.senderName || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Receiver</strong>
                <span>
                    ${escapeHtml(
                        shipment.receiverName || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Origin</strong>
                <span>
                    ${escapeHtml(
                        shipment.origin || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Destination</strong>
                <span>
                    ${escapeHtml(
                        shipment.destination || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Shipment Type</strong>
                <span>
                    ${escapeHtml(
                        shipment.shipmentType || "-"
                    )}
                </span>
            </div>

            <div>
                <strong>Weight</strong>
                <span>
                    ${shipment.weight ?? "-"} kg
                </span>
            </div>

            <div>
                <strong>Customer</strong>
                <span>
                    ${escapeHtml(
                        shipment.username ||
                        shipment.user?.username ||
                        "-"
                    )}
                </span>
            </div>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


/* ==========================================================
   CREATE BUTTON
========================================================== */

function setupCreateShipment() {

    document
        .querySelectorAll(
            "[data-action='create-shipment'], #createShipmentBtn, #addShipmentBtn"
        )
        .forEach(
            button => {

                if (
                    button.dataset.createBound
                    === "true"
                ) {

                    return;

                }


                button.dataset.createBound =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        openCreateShipmentModal();

                    }
                );

            }
        );

}


/* ==========================================================
   SHIPMENT TABLE EVENTS
========================================================== */

function setupShipmentTable() {

    const table =
        document.getElementById(
            "shipmentTable"
        );


    if (!table) {

        return;

    }


    if (
        table.dataset.bound ===
        "true"
    ) {

        return;

    }


    table.dataset.bound =
        "true";


    table.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-shipment-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset
                    .shipmentAction;


            const id =
                Number(
                    button.dataset
                        .shipmentId
                );


            if (
                action === "view"
            ) {

                viewShipment(
                    id
                );

            }

        }
    );

}


/* ==========================================================
   SHIPMENT SEARCH + FILTER
========================================================== */

function setupShipmentFilters() {

    const search =
        document.getElementById(
            "shipmentSearch"
        );


    const filter =
        document.getElementById(
            "shipmentStatusFilter"
        );


    if (search) {

        search.addEventListener(
            "input",
            () => {

                state.shipmentSearch =
                    search.value;

                applyShipmentFilters();

            }
        );

    }


    if (filter) {

        filter.addEventListener(
            "change",
            () => {

                state.shipmentStatus =
                    filter.value;

                applyShipmentFilters();

            }
        );

    }

}


/* ==========================================================
   REFRESH
========================================================== */

function setupRefresh() {

    /*
     * Actual HTML:
     * #adminRefresh
     */

    const buttons = [

        document.getElementById(
            "adminRefresh"
        ),

        document.getElementById(
            "towerRefreshBtn"
        ),

        document.getElementById(
            "refreshBtn"
        )

    ].filter(Boolean);


    buttons.forEach(
        button => {

            if (
                button.dataset
                    .refreshBound ===
                "true"
            ) {

                return;

            }


            button.dataset
                .refreshBound =
                "true";


            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();


                    button.disabled =
                        true;


                    try {

                        await loadCustomers();

                        await loadShipments();


                        showToast(
                            "Dashboard refreshed",
                            "Latest data loaded.",
                            "success"
                        );

                    }
                    finally {

                        button.disabled =
                            false;

                    }

                }
            );

        }
    );

}


/* ==========================================================
   EXPORT SHIPMENTS
========================================================== */

function setupExport() {

    const button =
        document.getElementById(
            "exportShipments"
        );


    if (!button) {

        return;

    }


    if (
        button.dataset
            .exportBound ===
        "true"
    ) {

        return;

    }


    button.dataset
        .exportBound =
        "true";


    button.addEventListener(
        "click",
        exportShipments
    );

}


function exportShipments() {

    const shipments =
        state.filteredShipments.length
            ? state.filteredShipments
            : state.shipments;


    if (
        !shipments.length
    ) {

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
        "Shipment Type",
        "Weight",
        "Status",
        "Customer"

    ];


    const rows =
        shipments.map(
            shipment => [

                shipment.trackingNumber || "",
                shipment.senderName || "",
                shipment.receiverName || "",
                shipment.origin || "",
                shipment.destination || "",
                shipment.shipmentType || "",
                shipment.weight ?? "",
                shipment.status || "",
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
                                value
                            )
                                .replaceAll(
                                    '"',
                                    '""'
                                )}"`
                    )
                    .join(",")
        )
        .join("\r\n");


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
        "Export complete",
        `${shipments.length} shipments exported.`,
        "success"
    );

}


/* ==========================================================
   GLOBAL SEARCH
========================================================== */

function setupGlobalSearch() {

    const input =
        document.getElementById(
            "adminGlobalSearch"
        );


    if (!input) {

        return;

    }


    if (
        input.dataset
            .searchBound ===
        "true"
    ) {

        return;

    }


    input.dataset
        .searchBound =
        "true";


    input.addEventListener(
        "input",
        () => {

            const value =
                input.value
                    .trim()
                    .toLowerCase();


            if (!value) {

                return;

            }


            const match =
                state.shipments.find(
                    shipment => {

                        const text =
                            [

                                shipment.trackingNumber,
                                shipment.senderName,
                                shipment.receiverName,
                                shipment.origin,
                                shipment.destination,
                                shipment.username ||
                                shipment.user?.username

                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                        return text.includes(
                            value
                        );

                    }
                );


            if (match) {

                showPage(
                    "shipments"
                );

                state.shipmentSearch =
                    input.value;

                const shipmentSearch =
                    document.getElementById(
                        "shipmentSearch"
                    );


                if (shipmentSearch) {

                    shipmentSearch.value =
                        input.value;

                }


                applyShipmentFilters();

            }

        }
    );

}


/* ==========================================================
   MODAL
========================================================== */

function setupModal() {

    const modal =
        document.getElementById(
            "adminModal"
        );


    const close =
        document.getElementById(
            "adminModalClose"
        );


    if (
        close &&
        close.dataset
            .modalBound !==
        "true"
    ) {

        close.dataset
            .modalBound =
            "true";


        close.addEventListener(
            "click",
            () => {

                modal?.classList.add(
                    "hidden"
                );

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }

}


/* ==========================================================
   LOGOUT
========================================================== */

function setupLogout() {

    const button =
        document.getElementById(
            "adminLogout"
        );


    if (!button) {

        return;

    }


    if (
        button.dataset
            .logoutBound ===
        "true"
    ) {

        return;

    }


    button.dataset
        .logoutBound =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();


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

function setupMobileMenu() {

    const button =
        document.getElementById(
            "adminMenu"
        );


    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (
        !button ||
        !sidebar
    ) {

        return;

    }


    if (
        button.dataset
            .menuBound ===
        "true"
    ) {

        return;

    }


    button.dataset
        .menuBound =
        "true";


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


/* ==========================================================
   EXCEPTIONS
========================================================== */

function setupExceptions() {

    document
        .querySelectorAll(
            "[data-exception]"
        )
        .forEach(
            element => {

                if (
                    element.dataset
                        .exceptionBound ===
                    "true"
                ) {

                    return;

                }


                element.dataset
                    .exceptionBound =
                    "true";


                element.addEventListener(
                    "click",
                    () => {

                        const tracking =
                            element.dataset
                                .exception;


                        if (!tracking) {

                            return;

                        }


                        const shipment =
                            state.shipments.find(
                                item =>
                                    String(
                                        item.trackingNumber
                                    ) ===
                                    String(
                                        tracking
                                    )
                            );


                        if (shipment) {

                            viewShipment(
                                shipment.id
                            );

                        }
                        else {

                            showToast(
                                "Shipment not found",
                                tracking,
                                "error"
                            );

                        }

                    }
                );

            }
        );

}


/* ==========================================================
   GENERIC ACTIONS
========================================================== */

function setupActions() {

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            element => {

                if (
                    element.dataset
                        .genericActionBound ===
                    "true"
                ) {

                    return;

                }


                element.dataset
                    .genericActionBound =
                    "true";


                element.addEventListener(
                    "click",
                    event => {

                        const action =
                            element.dataset
                                .action;


                        if (
                            action ===
                            "create-shipment"
                        ) {

                            return;

                        }


                        if (
                            action ===
                            "details"
                        ) {

                            const tracking =
                                element.dataset
                                    .tracking ||
                                element.dataset
                                    .shipment;


                            const shipment =
                                state.shipments.find(
                                    item =>
                                        String(
                                            item.trackingNumber
                                        ) ===
                                        String(
                                            tracking
                                        )
                                );


                            if (shipment) {

                                viewShipment(
                                    shipment.id
                                );

                            }

                            return;

                        }


                        /*
                         * Keep existing Control Tower
                         * UI actions functional without
                         * breaking the page.
                         */

                        console.log(
                            "Admin action:",
                            action
                        );

                    }
                );

            }
        );

}


/* ==========================================================
   NOTIFICATION
========================================================== */

function setupNotification() {

    const button =
        document.querySelector(
            "[data-action='notifications']"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            showToast(
                "Notifications",
                "Notification center opened.",
                "success"
            );

        }
    );

}


/* ==========================================================
   REPORT BUTTON
========================================================== */

function setupReportButton() {

    document
        .querySelectorAll(
            "[data-action='generate-report']"
        )
        .forEach(
            button => {

                if (
                    button.dataset
                        .reportBound ===
                    "true"
                ) {

                    return;

                }


                button.dataset
                    .reportBound =
                    "true";


                button.addEventListener(
                    "click",
                    () => {

                        exportShipments();

                    }
                );

            }
        );

}


/* ==========================================================
   ADD VEHICLE
========================================================== */

function setupAddVehicle() {

    document
        .querySelectorAll(
            "[data-action='add-vehicle']"
        )
        .forEach(
            button => {

                if (
                    button.dataset
                        .vehicleBound ===
                    "true"
                ) {

                    return;

                }


                button.dataset
                    .vehicleBound =
                    "true";


                button.addEventListener(
                    "click",
                    () => {

                        showToast(
                            "Fleet",
                            "Vehicle management is ready.",
                            "success"
                        );

                    }
                );

            }
        );

}


/* ==========================================================
   DASHBOARD MAP
========================================================== */

function initDashboardMap() {

    /*
     * Do not crash the dashboard if Leaflet
     * or map element is not available.
     */

    const mapElement =
        document.getElementById(
            "networkMap"
        );


    if (
        !mapElement ||
        typeof window.L ===
        "undefined"
    ) {

        return;

    }


    if (
        state.maps.network
    ) {

        setTimeout(
            () => {

                state.maps.network
                    .invalidateSize();

            },
            100
        );

        return;

    }


    try {

        const map =
            window.L.map(
                mapElement
            );


        window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap"
            }
        ).addTo(
            map
        );


        map.setView(
            [
                19.0760,
                72.8777
            ],
            6
        );


        state.maps.network =
            map;


        setTimeout(
            () => {

                map.invalidateSize();

            },
            300
        );

    }
    catch (error) {

        console.error(
            "Map initialization failed:",
            error
        );

    }

}


/* ==========================================================
   PAGE MAP REFRESH
========================================================== */

function refreshMapForPage(
    page
) {

    if (
        page !==
        "network"
    ) {

        return;

    }


    Object
        .values(
            state.maps
        )
        .forEach(
            map => {

                try {

                    map.invalidateSize();

                }
                catch {}

            }
        );

}


/* ==========================================================
   ADMIN PAGE NAVIGATION
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

function showPage(
    page
) {

    const config =
        adminPageMap[page] ||
        adminPageMap.dashboard;


    document
        .querySelectorAll(
            ".admin-page"
        )
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


    if (!selectedPage) {

        console.error(
            "Admin page section not found:",
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


    if (
        page ===
        "shipments"
    ) {

        applyShipmentFilters();

    }


    if (
        page ===
        "network"
    ) {

        refreshMapForPage(
            "network"
        );

    }


    /*
     * Close mobile sidebar
     */

    document
        .querySelector(
            ".admin-sidebar.open"
        )
        ?.classList.remove(
            "open"
        );


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );

}


/* ==========================================================
   NAVIGATION
========================================================== */

function setupNavigation() {

    document
        .querySelectorAll(
            ".admin-nav-item[data-page]"
        )
        .forEach(
            button => {

                if (
                    button.dataset
                        .navBound ===
                    "true"
                ) {

                    return;

                }


                button.dataset
                    .navBound =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

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

                if (
                    button.dataset
                        .pageGoBound ===
                    "true"
                ) {

                    return;

                }


                button.dataset
                    .pageGoBound =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        showPage(
                            button.dataset
                                .pageGo
                        );

                    }
                );

            }
        );

}


/* ==========================================================
   INITIALIZE ADMIN
========================================================== */

async function initAdmin() {

    try {

        setupNavigation();

        setupShipmentTable();

        setupShipmentFilters();

        setupCreateShipment();

        setupExceptions();

        setupGlobalSearch();

        setupRefresh();

        setupNotification();

        setupExport();

        setupReportButton();

        setupActions();

        setupMobileMenu();

        setupModal();

        setupLogout();

        setupAddVehicle();


        showPage(
            "dashboard"
        );


        /*
         * Load backend data.
         */

        await loadCustomers();

        await loadShipments();


        /*
         * Map after page initialization.
         */

        initDashboardMap();


        console.log(
            "TRANSLOGIX ADMIN CONTROL TOWER READY"
        );

    }
    catch (error) {

        console.error(
            "Admin initialization failed:",
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
   START ADMIN
========================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAdmin,
        {
            once:
                true
        }
    );

}
else {

    initAdmin();

}

/* ==========================================================
   INITIALIZE ADMIN
========================================================== */

async function initAdmin() {

    try {

        console.log(
            "TRANSLOGIX ADMIN INITIALIZING..."
        );


        /* ==============================================
           UI SETUP
        ============================================== */

        setupNavigation();

        setupShipmentTable();

        setupShipmentFilters();

        setupCreateShipment();

        setupExceptions();

        setupGlobalSearch();

        setupRefresh();

        setupNotification();

        setupExport();

        setupReportButton();

        setupActions();

        setupMobileMenu();

        setupModal();

        setupLogout();

        setupAddVehicle();


        /* ==============================================
           FORCE COMMAND CENTER
        ============================================== */

        showPage("dashboard");


        /* ==============================================
           LOAD BACKEND DATA
        ============================================== */

        await Promise.all([
            loadCustomers(),
            loadShipments()
        ]);


        /* ==============================================
           DASHBOARD MAP
        ============================================== */

        setTimeout(() => {

            initDashboardMap();

        }, 100);


        /* ==============================================
           FORCE DASHBOARD AGAIN
           Prevents another initialization/navigation
           from leaving Shipments page open.
        ============================================== */

        showPage("dashboard");


        console.log(
            "TRANSLOGIX ADMIN CONTROL TOWER READY"
        );

    }
    catch (error) {

        console.error(
            "Admin initialization failed:",
            error
        );

        showToast(
            "Admin initialization failed",
            error.message,
            "error"
        );

    }

}