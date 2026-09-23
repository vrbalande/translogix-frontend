/* ==========================================================
   TRANSLOGIX ADMIN CONTROL TOWER
   PRODUCTION VERSION
   Compatible with existing admin dashboard HTML
========================================================== */

"use strict";

/* ==========================================================
   API
========================================================== */

const ADMIN_API =
    "https://translogix-backend-1.onrender.com";


/* ==========================================================
   STATE
========================================================== */

const state = {

    shipments: [],

    customers: [],

    filteredShipments: [],

    currentPage: "dashboard",

    selectedShipment: null,

    maps: {},

    loading: false

};


/* ==========================================================
   TOKEN
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
   DOM HELPER
========================================================== */

function $(selector) {

    return document.querySelector(selector);

}


function $all(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


/* ==========================================================
   HTML ESCAPE
========================================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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

    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `${ADMIN_API}${endpoint}`,
            {
                ...options,
                headers
            }
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


    /* ======================================================
       SESSION EXPIRED
    ====================================================== */

    if (response.status === 401) {

        [
            "token",
            "jwt",
            "accessToken",
            "role",
            "user"
        ].forEach(key => {

            localStorage.removeItem(key);

        });


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
       FORBIDDEN
    ====================================================== */

    if (response.status === 403) {

        throw new Error(
            "Administrator permission required."
        );

    }


    /* ======================================================
       OTHER ERROR
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
   ADMIN PAGE MAP
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

function showPage(page) {

    const config =
        adminPageMap[page] ||
        adminPageMap.dashboard;


    $all(".admin-page")
        .forEach(section => {

            section.classList.add(
                "hidden"
            );

        });


    const selectedPage =
        document.getElementById(
            config.section
        );


    if (!selectedPage) {

        console.warn(
            "Admin page not found:",
            config.section
        );

        return;

    }


    selectedPage.classList.remove(
        "hidden"
    );


    $all(
        ".admin-nav-item[data-page]"
    ).forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });


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


    /* ======================================================
       Page-specific refresh
    ====================================================== */

    if (page === "shipments") {

        renderShipmentTable(
            getFilteredShipments()
        );

    }


    /* Leaflet */
    setTimeout(() => {

        Object.values(
            state.maps
        ).forEach(map => {

            if (
                map &&
                typeof map.invalidateSize ===
                "function"
            ) {

                map.invalidateSize();

            }

        });

    }, 250);


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ==========================================================
   NAVIGATION
========================================================== */

function setupNavigation() {

    $all(
        ".admin-nav-item[data-page]"
    ).forEach(button => {

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


    $all(
        "[data-page-go]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const page =
                    button.dataset.pageGo;

                if (page) {

                    showPage(page);

                }

            }
        );

    });


    $all(
        "[data-admin-action]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const action =
                    button.dataset.adminAction;


                if (
                    adminPageMap[action]
                ) {

                    showPage(action);

                    return;

                }


                if (
                    action ===
                    "createShipment"
                ) {

                    openCreateShipmentModal();

                }

            }
        );

    });

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
                ? data
                : [];


        console.log(
            "Customers:",
            state.customers
        );


        return state.customers;

    }
    catch (error) {

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
   CUSTOMER OPTIONS
========================================================== */

function customerOptions(
    selectedUsername = ""
) {

    const users =
        state.customers.filter(
            user =>
                user &&
                user.username &&
                String(user.role)
                    .toUpperCase() ===
                    "USER"
        );


    if (!users.length) {

        return `
            <option value="">
                No customers available
            </option>
        `;

    }


    return users
        .map(user => {

            const username =
                escapeHtml(
                    user.username
                );


            const selected =
                username ===
                escapeHtml(
                    selectedUsername
                )
                    ? "selected"
                    : "";


            return `
                <option
                    value="${username}"
                    ${selected}
                >
                    ${username}
                </option>
            `;

        })
        .join("");

}


/* ==========================================================
   LOAD SHIPMENTS
========================================================== */

async function loadShipments() {

    state.loading =
        true;


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
            "Admin shipments:",
            state.shipments
        );


        updateStats();


        applyShipmentFilters();


    }
    catch (error) {

        console.error(
            "Shipment loading failed:",
            error
        );


        state.shipments =
            [];


        updateStats();


        renderShipmentTable([]);


        showToast(
            "Shipment loading failed",
            error.message,
            "error"
        );

    }
    finally {

        state.loading =
            false;

    }

}


/* ==========================================================
   GET USERNAME FROM SHIPMENT
========================================================== */

function shipmentUsername(
    shipment
) {

    return (
        shipment?.username ||
        shipment?.customerUsername ||
        shipment?.user?.username ||
        shipment?.customer?.username ||
        "-"
    );

}


/* ==========================================================
   STATUS NORMALIZATION
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
        state.shipments;


    const total =
        shipments.length;


    const pending =
        shipments.filter(
            s =>
                normalizeStatus(
                    s.status
                ) === "pending"
        ).length;


    const transit =
        shipments.filter(
            s =>
                normalizeStatus(
                    s.status
                ) === "in transit"
        ).length;


    const out =
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


    const active =
        transit + out;


    /* Shipment page */

    setText(
        "shipmentTotal",
        String(total).padStart(2, "0")
    );


    setText(
        "shipmentActive",
        String(active).padStart(2, "0")
    );


    setText(
        "shipmentDelivered",
        String(delivered).padStart(2, "0")
    );


    setText(
        "shipmentExceptions",
        String(pending).padStart(2, "0")
    );


    /* Older KPI IDs if present */

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
        transit
    );


    setText(
        "outForDeliveryShipments",
        out
    );


    setText(
        "deliveredShipments",
        delivered
    );


    setText(
        "sidebarShipmentCount",
        String(total).padStart(2, "0")
    );


    setText(
        "shipmentFlowCount",
        total
    );


    setText(
        "kpiTotal",
        total
    );


    setText(
        "kpiTransit",
        transit
    );


    setText(
        "kpiDelivered",
        delivered
    );


    setText(
        "kpiExceptions",
        pending
    );

}


/* ==========================================================
   FILTER
========================================================== */

function getFilteredShipments() {

    const search =
        String(
            $("#shipmentSearch")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        String(
            $("#shipmentStatusFilter")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    return state.shipments.filter(
        shipment => {

            const text = [

                shipment.trackingNumber,

                shipment.senderName,

                shipment.receiverName,

                shipment.origin,

                shipment.destination,

                shipment.shipmentType,

                shipmentUsername(
                    shipment
                )

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                text.includes(search);


            const matchesStatus =
                !status ||
                normalizeStatus(
                    shipment.status
                ) === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        }
    );

}


/* ==========================================================
   APPLY FILTER
========================================================== */

function applyShipmentFilters() {

    state.filteredShipments =
        getFilteredShipments();


    renderShipmentTable(
        state.filteredShipments
    );

}


/* ==========================================================
   SHIPMENT TABLE
========================================================== */

function renderShipmentTable(
    shipments = []
) {

    /*
     * IMPORTANT:
     * Existing HTML uses #shipmentTable
     * NOT #shipmentTableBody
     */

    const tableBody =
        document.getElementById(
            "shipmentTable"
        );


    if (!tableBody) {

        console.warn(
            "#shipmentTable not found."
        );

        return;

    }


    if (!shipments.length) {

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
            .map(shipment => {

                const id =
                    Number(
                        shipment.id
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
                        shipmentUsername(
                            shipment
                        )
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
                            ${escapeHtml(weight)}
                            kg
                        </td>

                        <td>
                            ${status}
                        </td>

                        <td>
                            ${username}
                        </td>

                        <td>

                            <div
                                class="shipment-action-group"
                            >

                                <button
                                    type="button"
                                    class="shipment-action-btn"
                                    data-shipment-view="${id}"
                                >
                                    View
                                </button>

                                <button
                                    type="button"
                                    class="shipment-action-btn edit"
                                    data-shipment-edit="${id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="shipment-action-btn status"
                                    data-shipment-status="${id}"
                                >
                                    Status
                                </button>

                                <button
                                    type="button"
                                    class="shipment-action-btn delete"
                                    data-shipment-delete="${id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            })
            .join("");

}


/* ==========================================================
   SHIPMENT TABLE ACTIONS
========================================================== */

function setupShipmentTable() {

    document.addEventListener(
        "click",
        async event => {

            const view =
                event.target.closest(
                    "[data-shipment-view]"
                );


            if (view) {

                await viewShipment(
                    Number(
                        view.dataset.shipmentView
                    )
                );

                return;

            }


            const edit =
                event.target.closest(
                    "[data-shipment-edit]"
                );


            if (edit) {

                await editShipment(
                    Number(
                        edit.dataset.shipmentEdit
                    )
                );

                return;

            }


            const status =
                event.target.closest(
                    "[data-shipment-status]"
                );


            if (status) {

                await changeShipmentStatus(
                    Number(
                        status.dataset.shipmentStatus
                    )
                );

                return;

            }


            const remove =
                event.target.closest(
                    "[data-shipment-delete]"
                );


            if (remove) {

                await deleteShipment(
                    Number(
                        remove.dataset.shipmentDelete
                    )
                );

            }

        }
    );

}


/* ==========================================================
   VIEW SHIPMENT
========================================================== */

async function viewShipment(
    id
) {

    if (!id) {

        return;

    }


    try {

        /*
         * ADMIN endpoint
         * NOT public tracking endpoint.
         */

        const shipment =
            await api(
                `/api/admin/shipments/${id}`
            );


        state.selectedShipment =
            shipment;


        openModal(
            "Shipment Details",
            shipmentDetailsHtml(
                shipment
            )
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
   SHIPMENT DETAILS HTML
========================================================== */

function shipmentDetailsHtml(
    shipment
) {

    return `

        <div class="shipment-details">

            <p>
                <strong>
                    Tracking:
                </strong>
                ${escapeHtml(
                    shipment.trackingNumber
                )}
            </p>

            <p>
                <strong>
                    Sender:
                </strong>
                ${escapeHtml(
                    shipment.senderName
                )}
            </p>

            <p>
                <strong>
                    Receiver:
                </strong>
                ${escapeHtml(
                    shipment.receiverName
                )}
            </p>

            <p>
                <strong>
                    Route:
                </strong>
                ${escapeHtml(
                    shipment.origin
                )}
                →
                ${escapeHtml(
                    shipment.destination
                )}
            </p>

            <p>
                <strong>
                    Type:
                </strong>
                ${escapeHtml(
                    shipment.shipmentType
                )}
            </p>

            <p>
                <strong>
                    Weight:
                </strong>
                ${escapeHtml(
                    shipment.weight
                )}
                kg
            </p>

            <p>
                <strong>
                    Status:
                </strong>
                ${escapeHtml(
                    shipment.status
                )}
            </p>

            <p>
                <strong>
                    Customer:
                </strong>
                ${escapeHtml(
                    shipmentUsername(
                        shipment
                    )
                )}
            </p>

        </div>

    `;

}


/* ==========================================================
   OPEN CREATE SHIPMENT MODAL
========================================================== */

async function openCreateShipmentModal() {

    await loadCustomers();


    openModal(
        "Create Shipment",
        createShipmentFormHtml()
    );


    const form =
        document.getElementById(
            "adminCreateShipmentForm"
        );


    form?.addEventListener(
        "submit",
        submitShipment
    );

}


/* ==========================================================
   CREATE FORM
========================================================== */

function createShipmentFormHtml(
    shipment = {}
) {

    const isEdit =
        Boolean(
            shipment.id
        );


    return `

        <form
            id="adminCreateShipmentForm"
            class="shipment-form"
        >

            <input
                type="hidden"
                name="id"
                value="${escapeHtml(
                    shipment.id || ""
                )}"
            >


            <div class="form-group">

                <label>
                    Tracking Number
                </label>

                <input
                    name="trackingNumber"
                    required
                    value="${escapeHtml(
                        shipment.trackingNumber || ""
                    )}"
                    placeholder="TRX10007"
                >

            </div>


            <div class="form-group">

                <label>
                    Sender Name
                </label>

                <input
                    name="senderName"
                    required
                    value="${escapeHtml(
                        shipment.senderName || ""
                    )}"
                >

            </div>


            <div class="form-group">

                <label>
                    Receiver Name
                </label>

                <input
                    name="receiverName"
                    required
                    value="${escapeHtml(
                        shipment.receiverName || ""
                    )}"
                >

            </div>


            <div class="form-group">

                <label>
                    Origin
                </label>

                <input
                    name="origin"
                    required
                    value="${escapeHtml(
                        shipment.origin || ""
                    )}"
                >

            </div>


            <div class="form-group">

                <label>
                    Destination
                </label>

                <input
                    name="destination"
                    required
                    value="${escapeHtml(
                        shipment.destination || ""
                    )}"
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

                    ${customerOptions(
                        shipmentUsername(
                            shipment
                        )
                    )}

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

                    ${[
                        "Express",
                        "Standard",
                        "Freight",
                        "Courier",
                        "Cold Chain"
                    ]
                        .map(type => `
                            <option
                                value="${type}"
                                ${
                                    shipment.shipmentType ===
                                    type
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${type}
                            </option>
                        `)
                        .join("")}

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

                    ${[
                        "Pending",
                        "In Transit",
                        "Out for Delivery",
                        "Delivered"
                    ]
                        .map(status => `
                            <option
                                value="${status}"
                                ${
                                    shipment.status ===
                                    status
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${status}
                            </option>
                        `)
                        .join("")}

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
                    value="${escapeHtml(
                        shipment.weight || ""
                    )}"
                >

            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelAdminForm"
                >
                    Cancel
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    ${
                        isEdit
                            ? "Update Shipment"
                            : "Create Shipment"
                    }
                </button>

            </div>

        </form>

    `;

}


/* ==========================================================
   SUBMIT SHIPMENT
========================================================== */

async function submitShipment(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const formData =
        new FormData(form);


    const id =
        Number(
            formData.get("id")
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
        !payload.shipmentType ||
        !payload.username
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

        if (id) {

            await api(
                `/api/admin/shipments/${id}`,
                {

                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


            showToast(
                "Shipment updated",
                `${payload.trackingNumber} updated successfully.`
            );

        }
        else {

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


            showToast(
                "Shipment created",
                `${payload.trackingNumber} assigned to ${payload.username}.`
            );

        }


        closeModal();


        await loadShipments();

    }
    catch (error) {

        showToast(
            "Shipment operation failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   EDIT SHIPMENT
========================================================== */

async function editShipment(
    id
) {

    try {

        const shipment =
            await api(
                `/api/admin/shipments/${id}`
            );


        await loadCustomers();


        openModal(
            "Edit Shipment",
            createShipmentFormHtml(
                shipment
            )
        );


        document
            .getElementById(
                "adminCreateShipmentForm"
            )
            ?.addEventListener(
                "submit",
                submitShipment
            );

    }
    catch (error) {

        showToast(
            "Edit failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   CHANGE STATUS
========================================================== */

async function changeShipmentStatus(
    id
) {

    const shipment =
        state.shipments.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!shipment) {

        return;

    }


    const statuses = [

        "Pending",

        "In Transit",

        "Out for Delivery",

        "Delivered"

    ];


    const current =
        shipment.status ||
        "Pending";


    const next =
        prompt(
            `Enter status:\n${statuses.join("\n")}`,
            current
        );


    if (!next) {

        return;

    }


    const valid =
        statuses.find(
            status =>
                status.toLowerCase() ===
                next.trim().toLowerCase()
        );


    if (!valid) {

        showToast(
            "Invalid status",
            "Use Pending, In Transit, Out for Delivery or Delivered.",
            "error"
        );

        return;

    }


    try {

        await api(
            `/api/admin/shipments/${id}/status`,
            {

                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        status: valid
                    })

            }
        );


        showToast(
            "Status updated",
            `${shipment.trackingNumber} → ${valid}`
        );


        await loadShipments();

    }
    catch (error) {

        showToast(
            "Status update failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   DELETE SHIPMENT
========================================================== */

async function deleteShipment(
    id
) {

    const shipment =
        state.shipments.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!shipment) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete shipment ${shipment.trackingNumber}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await api(
            `/api/admin/shipments/${id}`,
            {

                method:
                    "DELETE"

            }
        );


        showToast(
            "Shipment deleted",
            `${shipment.trackingNumber} removed.`
        );


        await loadShipments();

    }
    catch (error) {

        showToast(
            "Delete failed",
            error.message,
            "error"
        );

    }

}


/* ==========================================================
   CREATE BUTTON
========================================================== */

function setupCreateShipment() {

    const button =
        document.getElementById(
            "createShipmentBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            openCreateShipmentModal
        );

    }


    $all(
        "[data-admin-action='createShipment']"
    ).forEach(element => {

        element.addEventListener(
            "click",
            openCreateShipmentModal
        );

    });

}


/* ==========================================================
   REFRESH
========================================================== */

function setupRefresh() {

    /*
     * IMPORTANT:
     * Existing HTML uses #adminRefresh
     */

    const button =
        document.getElementById(
            "adminRefresh"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            const original =
                button.textContent;


            button.disabled =
                true;


            button.textContent =
                "↻";


            try {

                await loadCustomers();

                await loadShipments();


                showToast(
                    "Dashboard refreshed",
                    "Latest data loaded."
                );

            }
            catch (error) {

                console.error(error);

            }
            finally {

                setTimeout(() => {

                    button.disabled =
                        false;

                    button.textContent =
                        original;

                }, 400);

            }

        }
    );

}


/* ==========================================================
   SHIPMENT FILTERS
========================================================== */

function setupShipmentFilters() {

    $("#shipmentSearch")
        ?.addEventListener(
            "input",
            applyShipmentFilters
        );


    $("#shipmentStatusFilter")
        ?.addEventListener(
            "change",
            applyShipmentFilters
        );

}


/* ==========================================================
   EXPORT CSV
========================================================== */

function setupExport() {

    $("#exportShipments")
        ?.addEventListener(
            "click",
            exportShipments
        );

}


function exportShipments() {

    const rows =
        getFilteredShipments();


    if (!rows.length) {

        showToast(
            "Nothing to export",
            "No shipment records available.",
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


    const csvRows = [

        headers.join(","),

        ...rows.map(
            shipment => [

                shipment.trackingNumber,

                shipment.senderName,

                shipment.receiverName,

                shipment.origin,

                shipment.destination,

                shipment.shipmentType,

                shipment.weight,

                shipment.status,

                shipmentUsername(
                    shipment
                )

            ]
                .map(csvEscape)
                .join(",")
        )

    ];


    const blob =
        new Blob(
            [
                csvRows.join("\n")
            ],
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

}


function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );


    return `"${text.replace(
        /"/g,
        '""'
    )}"`;

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


    input.addEventListener(
        "input",
        () => {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                return;

            }


            const match =
                state.shipments.find(
                    shipment => {

                        const text = [

                            shipment.trackingNumber,

                            shipment.senderName,

                            shipment.receiverName,

                            shipment.origin,

                            shipment.destination,

                            shipmentUsername(
                                shipment
                            )

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                        return text.includes(
                            query
                        );

                    }
                );


            if (match) {

                showPage(
                    "shipments"
                );


                const search =
                    document.getElementById(
                        "shipmentSearch"
                    );


                if (search) {

                    search.value =
                        input.value;

                }


                applyShipmentFilters();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() ===
                "k"
            ) {

                event.preventDefault();

                input.focus();

            }

        }
    );

}


/* ==========================================================
   MODAL
========================================================== */

function openModal(
    title,
    content
) {

    const modal =
        document.getElementById(
            "adminModal"
        );


    const titleElement =
        document.getElementById(
            "modalTitle"
        );


    const contentElement =
        document.getElementById(
            "modalContent"
        );


    if (
        !modal ||
        !titleElement ||
        !contentElement
    ) {

        console.warn(
            "Admin modal elements missing."
        );

        return;

    }


    titleElement.textContent =
        title;


    contentElement.innerHTML =
        content;


    modal.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "cancelAdminForm"
        )
        ?.addEventListener(
            "click",
            closeModal
        );

}


function closeModal() {

    document
        .getElementById(
            "adminModal"
        )
        ?.classList.add(
            "hidden"
        );

}


function setupModal() {

    document
        .getElementById(
            "adminModalClose"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "adminModal"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "adminModal"
                ) {

                    closeModal();

                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();

            }

        }
    );

}


/* ==========================================================
   LOGOUT
========================================================== */

function setupLogout() {

    document
        .getElementById(
            "adminLogout"
        )
        ?.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Do you want to sign out?"
                    );


                if (!confirmed) {

                    return;

                }


                [
                    "token",
                    "jwt",
                    "accessToken",
                    "role",
                    "user"
                ].forEach(
                    key =>
                        localStorage.removeItem(
                            key
                        )
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
        document.getElementById(
            "adminSidebar"
        );


    if (
        !button ||
        !sidebar
    ) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    $all(
        ".admin-nav-item"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "open"
                );

            }
        );

    });

}


/* ==========================================================
   EXCEPTIONS
========================================================== */

function setupExceptions() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-admin-exception]"
                );


            if (!button) {

                return;

            }


            const value =
                button.dataset.adminException;


            openModal(
                "Operational Exception",
                `
                    <div class="shipment-details">

                        <p>
                            <strong>
                                Vehicle / Reference:
                            </strong>
                            ${escapeHtml(value)}
                        </p>

                        <p>
                            Review the related operational
                            record before taking action.
                        </p>

                    </div>
                `
            );

        }
    );

}


/* ==========================================================
   MAP MARKERS / EXISTING MAP UI
========================================================== */

function setupMapInteractions() {

    $all(
        "[data-focus]"
    ).forEach(
        marker => {

            marker.addEventListener(
                "click",
                () => {

                    const tracking =
                        marker.dataset.focus;


                    const shipment =
                        state.shipments.find(
                            item =>
                                String(
                                    item.trackingNumber
                                ).toLowerCase() ===
                                String(
                                    tracking
                                ).toLowerCase()
                        );


                    const focus =
                        document.getElementById(
                            "towerMapFocus"
                        );


                    if (
                        focus &&
                        shipment
                    ) {

                        focus.innerHTML = `

                            <span>
                                SELECTED MOVEMENT
                            </span>

                            <strong>
                                ${escapeHtml(
                                    shipment.trackingNumber
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    shipment.origin
                                )}
                                →
                                ${escapeHtml(
                                    shipment.destination
                                )}
                                ·
                                ${escapeHtml(
                                    shipment.status
                                )}
                            </small>

                        `;

                    }

                }
            );

        }
    );

}


/* ==========================================================
   INITIALIZE
========================================================== */

async function initAdmin() {

    try {

        setupNavigation();

        setupShipmentTable();

        setupShipmentFilters();

        setupCreateShipment();

        setupRefresh();

        setupExport();

        setupGlobalSearch();

        setupModal();

        setupLogout();

        setupMobileMenu();

        setupExceptions();

        setupMapInteractions();


        showPage(
            "dashboard"
        );


        await loadCustomers();


        await loadShipments();


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