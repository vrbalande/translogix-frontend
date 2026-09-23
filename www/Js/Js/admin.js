/* ==========================================================
   TRANSLOGIX ADMIN CONTROL TOWER
   ========================================================== */

"use strict";


/* ==========================================================
   CONFIG
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

    demoMode: false,

    currentPage: 1,

    pageSize: 10,

    editingShipmentId: null

};


/* ==========================================================
   DOM HELPERS
   ========================================================== */

function $(selector) {

    return document.querySelector(selector);

}


function $$(selector) {

    return document.querySelectorAll(selector);

}


/* ==========================================================
   HTML ESCAPE
   ========================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================================
   TOKEN
   ========================================================== */

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwtToken") ||
        sessionStorage.getItem("token") ||
        ""
    );

}


/* ==========================================================
   API REQUEST
   ========================================================== */

async function api(

    endpoint,

    options = {}

) {

    const token = getToken();

    const config = {

        ...options,

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        }

    };


    if (token) {

        config.headers.Authorization =
            `Bearer ${token}`;

    }


    const response = await fetch(

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


    if (!response.ok) {

        let message =
            "Request failed";


        if (typeof data === "string") {

            message = data;

        }

        else if (data?.message) {

            message = data.message;

        }

        else if (data?.error) {

            message = data.error;

        }


        throw new Error(

            `${response.status}: ${message}`

        );

    }


    return data;

}


/* ==========================================================
   TOAST
   ========================================================== */

function showToast(

    title,

    message = "",

    type = "success"

) {

    let container =
        document.querySelector(
            ".toast-container"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;


    toast.innerHTML = `

        <div class="toast-title">
            ${escapeHTML(title)}
        </div>

        <div class="toast-message">
            ${escapeHTML(message)}
        </div>

    `;


    container.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 4000);

}


/* ==========================================================
   MODAL
   ========================================================== */

function openModal(content) {

    closeModal();


    const overlay =
        document.createElement("div");

    overlay.id =
        "translogixModal";

    overlay.className =
        "translogix-modal-overlay";


    overlay.innerHTML = `

        <div class="translogix-modal">

            <button
                type="button"
                class="modal-close"
                onclick="closeModal()"
            >
                ×
            </button>

            ${content}

        </div>

    `;


    overlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target === overlay
            ) {

                closeModal();

            }

        }
    );


    document.body.appendChild(
        overlay
    );

}


function closeModal() {

    const modal =
        document.getElementById(
            "translogixModal"
        );


    if (modal) {

        modal.remove();

    }

}


/* ==========================================================
   FORM FIELD
   ========================================================== */

function formField(

    name,

    label,

    value = "",

    placeholder = "",

    type = "text"

) {

    return `

        <label class="form-group">

            <span class="form-label">
                ${escapeHTML(label)}
            </span>

            <input
                class="form-control"
                type="${escapeHTML(type)}"
                name="${escapeHTML(name)}"
                value="${escapeHTML(value)}"
                placeholder="${escapeHTML(placeholder)}"
                required
            >

        </label>

    `;

}


/* ==========================================================
   LOAD CUSTOMERS
   ========================================================== */

async function loadCustomers() {

    try {

        const users =
            await api(
                "/api/admin/users"
            );


        state.customers =
            Array.isArray(users)
                ? users
                : [];


        const select =
            document.getElementById(
                "customerUsername"
            );


        if (!select) {

            return;

        }


        select.innerHTML = `

            <option value="">
                Select Customer
            </option>

            ${state.customers
                .map(user => `

                    <option
                        value="${escapeHTML(
                            user.username
                        )}"
                    >
                        ${escapeHTML(
                            user.username
                        )}
                    </option>

                `)
                .join("")}

        `;


    }

    catch (error) {

        console.error(
            "Customer loading failed:",
            error
        );


        const select =
            document.getElementById(
                "customerUsername"
            );


        if (select) {

            select.innerHTML = `

                <option value="">
                    Unable to load customers
                </option>

            `;

        }


        showToast(

            "Customer loading failed",

            error.message,

            "error"

        );

    }

}


/* ==========================================================
   OPEN CREATE SHIPMENT MODAL
   ========================================================== */

async function openCreateShipmentModal() {

    state.editingShipmentId =
        null;


    openModal(`

        <div class="modal-header">

            <h2>
                Create Shipment
            </h2>

            <p>
                Create and assign shipment
                to a customer.
            </p>

        </div>


        <form
            id="createShipmentForm"
            class="shipment-form"
        >

            ${formField(
                "trackingNumber",
                "TRACKING NUMBER",
                "",
                "TRX10008",
                "text"
            )}


            ${formField(
                "senderName",
                "SENDER NAME",
                "",
                "Sender name",
                "text"
            )}


            ${formField(
                "receiverName",
                "RECEIVER NAME",
                "",
                "Receiver name",
                "text"
            )}


            <label class="form-group">

                <span class="form-label">
                    CUSTOMER
                </span>

                <select
                    name="username"
                    id="customerUsername"
                    class="form-control"
                    required
                >

                    <option value="">
                        Loading customers...
                    </option>

                </select>

            </label>


            ${formField(
                "origin",
                "ORIGIN",
                "",
                "Pune",
                "text"
            )}


            ${formField(
                "destination",
                "DESTINATION",
                "",
                "Delhi",
                "text"
            )}


            <label class="form-group">

                <span class="form-label">
                    SHIPMENT TYPE
                </span>

                <select
                    name="shipmentType"
                    class="form-control"
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

            </label>


            ${formField(
                "weight",
                "WEIGHT (KG)",
                "",
                "5",
                "number"
            )}


            <label class="form-group">

                <span class="form-label">
                    STATUS
                </span>

                <select
                    name="status"
                    class="form-control"
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

            </label>


            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeModal()"
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

    `);


    const form =
        document.getElementById(
            "createShipmentForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            submitShipment
        );

    }


    await loadCustomers();

}


/* ==========================================================
   CREATE SHIPMENT
   ========================================================== */

async function submitShipment(event) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const data =
        new FormData(form);


    const payload = {

        trackingNumber:
            String(
                data.get(
                    "trackingNumber"
                ) || ""
            ).trim(),


        senderName:
            String(
                data.get(
                    "senderName"
                ) || ""
            ).trim(),


        receiverName:
            String(
                data.get(
                    "receiverName"
                ) || ""
            ).trim(),


        username:
            String(
                data.get(
                    "username"
                ) || ""
            ).trim(),


        origin:
            String(
                data.get(
                    "origin"
                ) || ""
            ).trim(),


        destination:
            String(
                data.get(
                    "destination"
                ) || ""
            ).trim(),


        shipmentType:
            String(
                data.get(
                    "shipmentType"
                ) || ""
            ).trim(),


        status:
            String(
                data.get(
                    "status"
                ) || "Pending"
            ).trim(),


        weight:
            Number(
                data.get(
                    "weight"
                )
            )

    };


    /* ======================================================
       VALIDATION
       ====================================================== */

    if (
        !payload.trackingNumber ||
        !payload.senderName ||
        !payload.receiverName ||
        !payload.username ||
        !payload.origin ||
        !payload.destination ||
        !payload.shipmentType ||
        !payload.status ||
        Number.isNaN(
            payload.weight
        ) ||
        payload.weight <= 0
    ) {

        showToast(

            "Validation Error",

            "Please fill all shipment fields.",

            "error"

        );

        return;

    }


    /* ======================================================
       DEMO MODE
       ====================================================== */

    if (state.demoMode) {

        const customer =
            state.customers.find(

                user =>
                    user.username ===
                    payload.username

            );


        state.shipments.push({

            id:
                Date.now(),

            ...payload,

            user:
                customer || null

        });


        closeModal();


        renderShipments();


        showToast(

            "Shipment Created",

            `${payload.trackingNumber} assigned to ${payload.username}.`,

            "success"

        );


        return;

    }


    /* ======================================================
       REAL BACKEND
       IMPORTANT:
       ADMIN ENDPOINT
       ====================================================== */

    try {

        const savedShipment =
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


        console.log(
            "Created shipment:",
            savedShipment
        );


        closeModal();


        await loadShipments();


        showToast(

            "Shipment Created",

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

            "Create Failed",

            error.message,

            "error"

        );

    }

}


/* ==========================================================
   LOAD ALL SHIPMENTS
   ========================================================== */

async function loadShipments() {

    try {

        const shipments =
            await api(
                "/api/admin/shipments"
            );


        state.shipments =
            Array.isArray(shipments)
                ? shipments
                : [];


        state.filteredShipments =
            [...state.shipments];


        state.currentPage =
            1;


        renderShipments();


        updateDashboardStats();


    }

    catch (error) {

        console.error(
            "Shipment loading failed:",
            error
        );


        showToast(

            "Loading Failed",

            error.message,

            "error"

        );

    }

}


/* ==========================================================
   RENDER SHIPMENTS
   ========================================================== */

function renderShipments() {

    const tbody =
        document.querySelector(
            "#shipmentsTableBody"
        );


    if (!tbody) {

        return;

    }


    const shipments =
        state.filteredShipments;


    if (!shipments.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty-state"
                >
                    No shipments found.
                </td>

            </tr>

        `;

        return;

    }


    const start =
        (
            state.currentPage - 1
        ) *
        state.pageSize;


    const end =
        start +
        state.pageSize;


    const pageShipments =
        shipments.slice(
            start,
            end
        );


    tbody.innerHTML =
        pageShipments
            .map(
                shipment =>
                    shipmentRow(
                        shipment
                    )
            )
            .join("");


    updatePagination();

}


/* ==========================================================
   SHIPMENT ROW
   ========================================================== */

function shipmentRow(shipment) {

    const user =
        shipment.user?.username ||
        shipment.username ||
        "Unassigned";


    return `

        <tr>

            <td>
                ${escapeHTML(
                    shipment.trackingNumber
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.senderName
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.receiverName
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.origin
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.destination
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.shipmentType
                )}
            </td>


            <td>
                ${escapeHTML(
                    user
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.status
                )}
            </td>


            <td>
                ${escapeHTML(
                    shipment.weight
                )}
            </td>


            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="btn btn-sm btn-secondary"
                        onclick="editShipment(${shipment.id})"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteShipment(${shipment.id})"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* ==========================================================
   SEARCH / FILTER
   ========================================================== */

function filterShipments() {

    const searchInput =
        document.querySelector(
            "#shipmentSearch"
        );


    const statusInput =
        document.querySelector(
            "#statusFilter"
        );


    const customerInput =
        document.querySelector(
            "#customerFilter"
        );


    const search =
        String(
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        String(
            statusInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const customer =
        String(
            customerInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    state.filteredShipments =
        state.shipments.filter(
            shipment => {

                const username =
                    (
                        shipment.user?.username ||
                        shipment.username ||
                        ""
                    )
                        .toLowerCase();


                const searchable = [

                    shipment.trackingNumber,

                    shipment.senderName,

                    shipment.receiverName,

                    shipment.origin,

                    shipment.destination,

                    shipment.shipmentType,

                    username

                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );


                const matchesStatus =
                    !status ||
                    String(
                        shipment.status ||
                        ""
                    ).toLowerCase() ===
                    status;


                const matchesCustomer =
                    !customer ||
                    username === customer;


                return (

                    matchesSearch &&
                    matchesStatus &&
                    matchesCustomer

                );

            }
        );


    state.currentPage =
        1;


    renderShipments();

}


/* ==========================================================
   UPDATE DASHBOARD STATS
   ========================================================== */

function updateDashboardStats() {

    const shipments =
        state.shipments;


    const total =
        shipments.length;


    const pending =
        shipments.filter(
            shipment =>
                String(
                    shipment.status
                ).toLowerCase() ===
                "pending"
        ).length;


    const inTransit =
        shipments.filter(
            shipment =>
                String(
                    shipment.status
                ).toLowerCase() ===
                "in transit"
        ).length;


    const outForDelivery =
        shipments.filter(
            shipment =>
                String(
                    shipment.status
                ).toLowerCase() ===
                "out for delivery"
        ).length;


    const delivered =
        shipments.filter(
            shipment =>
                String(
                    shipment.status
                ).toLowerCase() ===
                "delivered"
        ).length;


    setText(
        "#totalShipments",
        total
    );


    setText(
        "#pendingShipments",
        pending
    );


    setText(
        "#inTransitShipments",
        inTransit
    );


    setText(
        "#outForDeliveryShipments",
        outForDelivery
    );


    setText(
        "#deliveredShipments",
        delivered
    );

}


/* ==========================================================
   SET TEXT
   ========================================================== */

function setText(

    selector,

    value

) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ==========================================================
   UPDATE PAGINATION
   ========================================================== */

function updatePagination() {

    const total =
        state.filteredShipments.length;


    const pages =
        Math.max(

            1,

            Math.ceil(
                total /
                state.pageSize
            )

        );


    const current =
        Math.min(
            state.currentPage,
            pages
        );


    state.currentPage =
        current;


    setText(
        "#currentPage",
        current
    );


    setText(
        "#totalPages",
        pages
    );


    const previous =
        document.querySelector(
            "#previousPage"
        );


    const next =
        document.querySelector(
            "#nextPage"
        );


    if (previous) {

        previous.disabled =
            current <= 1;

    }


    if (next) {

        next.disabled =
            current >= pages;

    }

}


/* ==========================================================
   PREVIOUS PAGE
   ========================================================== */

function previousPage() {

    if (
        state.currentPage > 1
    ) {

        state.currentPage--;

        renderShipments();

    }

}


/* ==========================================================
   NEXT PAGE
   ========================================================== */

function nextPage() {

    const pages =
        Math.max(

            1,

            Math.ceil(
                state.filteredShipments.length /
                state.pageSize
            )

        );


    if (
        state.currentPage <
        pages
    ) {

        state.currentPage++;

        renderShipments();

    }

}


/* ==========================================================
   EDIT SHIPMENT
   ========================================================== */

async function editShipment(id) {

    const shipment =
        state.shipments.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!shipment) {

        showToast(
            "Error",
            "Shipment not found.",
            "error"
        );

        return;

    }


    openModal(`

        <div class="modal-header">

            <h2>
                Edit Shipment
            </h2>

        </div>


        <form
            id="editShipmentForm"
            class="shipment-form"
        >

            ${formField(
                "trackingNumber",
                "TRACKING NUMBER",
                shipment.trackingNumber,
                "",
                "text"
            )}


            ${formField(
                "senderName",
                "SENDER NAME",
                shipment.senderName,
                "",
                "text"
            )}


            ${formField(
                "receiverName",
                "RECEIVER NAME",
                shipment.receiverName,
                "",
                "text"
            )}


            ${formField(
                "origin",
                "ORIGIN",
                shipment.origin,
                "",
                "text"
            )}


            ${formField(
                "destination",
                "DESTINATION",
                shipment.destination,
                "",
                "text"
            )}


            <label class="form-group">

                <span class="form-label">
                    SHIPMENT TYPE
                </span>

                <select
                    name="shipmentType"
                    class="form-control"
                    required
                >

                    <option
                        value="Express"
                        ${shipment.shipmentType === "Express"
                            ? "selected"
                            : ""}
                    >
                        Express
                    </option>

                    <option
                        value="Standard"
                        ${shipment.shipmentType === "Standard"
                            ? "selected"
                            : ""}
                    >
                        Standard
                    </option>

                    <option
                        value="Freight"
                        ${shipment.shipmentType === "Freight"
                            ? "selected"
                            : ""}
                    >
                        Freight
                    </option>

                    <option
                        value="Courier"
                        ${shipment.shipmentType === "Courier"
                            ? "selected"
                            : ""}
                    >
                        Courier
                    </option>

                    <option
                        value="Cold Chain"
                        ${shipment.shipmentType === "Cold Chain"
                            ? "selected"
                            : ""}
                    >
                        Cold Chain
                    </option>

                </select>

            </label>


            ${formField(
                "weight",
                "WEIGHT (KG)",
                shipment.weight,
                "",
                "number"
            )}


            <label class="form-group">

                <span class="form-label">
                    STATUS
                </span>

                <select
                    name="status"
                    class="form-control"
                    required
                >

                    <option
                        value="Pending"
                        ${shipment.status === "Pending"
                            ? "selected"
                            : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="In Transit"
                        ${shipment.status === "In Transit"
                            ? "selected"
                            : ""}
                    >
                        In Transit
                    </option>

                    <option
                        value="Out for Delivery"
                        ${shipment.status === "Out for Delivery"
                            ? "selected"
                            : ""}
                    >
                        Out for Delivery
                    </option>

                    <option
                        value="Delivered"
                        ${shipment.status === "Delivered"
                            ? "selected"
                            : ""}
                    >
                        Delivered
                    </option>

                </select>

            </label>


            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeModal()"
                >
                    Cancel
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Save Changes
                </button>

            </div>

        </form>

    `);


    const form =
        document.getElementById(
            "editShipmentForm"
        );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const data =
                new FormData(form);


            const payload = {

                trackingNumber:
                    String(
                        data.get(
                            "trackingNumber"
                        )
                    ).trim(),

                senderName:
                    String(
                        data.get(
                            "senderName"
                        )
                    ).trim(),

                receiverName:
                    String(
                        data.get(
                            "receiverName"
                        )
                    ).trim(),

                origin:
                    String(
                        data.get(
                            "origin"
                        )
                    ).trim(),

                destination:
                    String(
                        data.get(
                            "destination"
                        )
                    ).trim(),

                shipmentType:
                    String(
                        data.get(
                            "shipmentType"
                        )
                    ).trim(),

                status:
                    String(
                        data.get(
                            "status"
                        )
                    ).trim(),

                weight:
                    Number(
                        data.get(
                            "weight"
                        )
                    )

            };


            try {

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


                closeModal();


                await loadShipments();


                showToast(

                    "Shipment Updated",

                    "Shipment updated successfully.",

                    "success"

                );

            }

            catch (error) {

                console.error(
                    error
                );


                showToast(

                    "Update Failed",

                    error.message,

                    "error"

                );

            }

        }
    );

}


/* ==========================================================
   UPDATE STATUS
   ========================================================== */

async function updateShipmentStatus(

    id,

    status

) {

    try {

        await api(

            `/api/admin/shipments/${id}/status?status=${encodeURIComponent(status)}`,

            {

                method:
                    "PATCH"

            }

        );


        await loadShipments();


        showToast(

            "Status Updated",

            "Shipment status updated.",

            "success"

        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(

            "Status Update Failed",

            error.message,

            "error"

        );

    }

}


/* ==========================================================
   DELETE SHIPMENT
   ========================================================== */

async function deleteShipment(id) {

    const confirmed =
        window.confirm(

            "Are you sure you want to delete this shipment?"

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


        await loadShipments();


        showToast(

            "Shipment Deleted",

            "Shipment deleted successfully.",

            "success"

        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(

            "Delete Failed",

            error.message,

            "error"

        );

    }

}


/* ==========================================================
   ASSIGN EXISTING SHIPMENT TO CUSTOMER
   ========================================================== */

async function assignShipmentToUser(

    trackingNumber,

    username

) {

    if (
        !trackingNumber ||
        !username
    ) {

        showToast(

            "Assignment Error",

            "Tracking number and customer are required.",

            "error"

        );

        return;

    }


    try {

        await api(

            `/api/admin/shipments/assign-user?trackingNumber=${encodeURIComponent(
                trackingNumber
            )}&username=${encodeURIComponent(
                username
            )}`,

            {

                method:
                    "PATCH"

            }

        );


        await loadShipments();


        showToast(

            "Shipment Assigned",

            `${trackingNumber} assigned to ${username}.`,

            "success"

        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(

            "Assignment Failed",

            error.message,

            "error"

        );

    }

}


/* ==========================================================
   REFRESH
   ========================================================== */

async function refreshShipments() {

    await loadShipments();

}


/* ==========================================================
   LOGOUT
   ========================================================== */

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "jwtToken"
    );

    localStorage.removeItem(
        "role"
    );

    localStorage.removeItem(
        "username"
    );


    sessionStorage.removeItem(
        "token"
    );


    window.location.href =
        "./login.html";

}


/* ==========================================================
   INITIALIZE
   ========================================================== */

async function initializeAdmin() {

    console.log(
        "TRANSLOGIX ADMIN CONTROL TOWER READY"
    );


    if (!getToken()) {

        console.warn(
            "No admin token found."
        );

    }


    try {

        await loadShipments();

    }

    catch (error) {

        console.error(
            "Admin initialization failed:",
            error
        );

    }


    /* ======================================================
       SEARCH
       ====================================================== */

    const search =
        document.querySelector(
            "#shipmentSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            filterShipments
        );

    }


    /* ======================================================
       STATUS FILTER
       ====================================================== */

    const status =
        document.querySelector(
            "#statusFilter"
        );


    if (status) {

        status.addEventListener(
            "change",
            filterShipments
        );

    }


    /* ======================================================
       CUSTOMER FILTER
       ====================================================== */

    const customer =
        document.querySelector(
            "#customerFilter"
        );


    if (customer) {

        try {

            const users =
                await api(
                    "/api/admin/users"
                );


            customer.innerHTML = `

                <option value="">
                    All Customers
                </option>

                ${users.map(user => `

                    <option
                        value="${escapeHTML(
                            user.username
                        )}"
                    >
                        ${escapeHTML(
                            user.username
                        )}
                    </option>

                `).join("")}

            `;

            customer.addEventListener(
                "change",
                filterShipments
            );

        }

        catch (error) {

            console.error(
                "Customer filter failed:",
                error
            );

        }

    }


    /* ======================================================
       PAGINATION
       ====================================================== */

    const previous =
        document.querySelector(
            "#previousPage"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            previousPage
        );

    }


    const next =
        document.querySelector(
            "#nextPage"
        );


    if (next) {

        next.addEventListener(
            "click",
            nextPage
        );

    }

}


/* ==========================================================
   GLOBAL FUNCTIONS
   ========================================================== */

window.openCreateShipmentModal =
    openCreateShipmentModal;

window.closeModal =
    closeModal;

window.submitShipment =
    submitShipment;

window.loadShipments =
    loadShipments;

window.editShipment =
    editShipment;

window.deleteShipment =
    deleteShipment;

window.updateShipmentStatus =
    updateShipmentStatus;

window.assignShipmentToUser =
    assignShipmentToUser;

window.filterShipments =
    filterShipments;

window.previousPage =
    previousPage;

window.nextPage =
    nextPage;

window.refreshShipments =
    refreshShipments;

window.logout =
    logout;


/* ==========================================================
   START
   ========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initializeAdmin

);