
"use strict";

/* =========================================================
   TRANSLOGIX CUSTOMER APPLICATION
========================================================= */

/*
   Android Emulator:
   10.0.2.2 = Windows host machine

   Spring Boot Backend:
   http://localhost:8081
*/

const USER_API = "http://10.0.2.2:8081";


document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       AUTHENTICATION
    ================================================= */

    const token = localStorage.getItem("token");

    let role = String(
        localStorage.getItem("role") || ""
    )
        .trim()
        .toUpperCase();

    if (role.startsWith("ROLE_")) {
        role = role.substring(5);
    }

    if (!token || role !== "USER") {

        localStorage.clear();

        window.location.href = "./login.html";

        return;
    }


    /* =================================================
       HELPERS
    ================================================= */

    const $ = id => document.getElementById(id);


    const username =
        localStorage.getItem("username") || "vijay";


    const initial =
        username
            .charAt(0)
            .toUpperCase();


    let shipments = [];


    function text(id, value) {

        const element = $(id);

        if (element) {
            element.textContent = value ?? "-";
        }
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(
                /[&<>"']/g,
                character => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                })[character]
            );
    }


    function normalize(value) {

        return String(value ?? "")
            .trim()
            .toLowerCase();
    }


    /* =================================================
       STATUS
    ================================================= */

    function statusClass(status) {

        const value = normalize(status);


        if (value === "delivered") {

            return "user-status delivered";
        }


        if (value === "out for delivery") {

            return "user-status final";
        }


        if (value === "in transit") {

            return "user-status transit";
        }


        if (
            value === "delayed" ||
            value === "exception"
        ) {

            return "user-status final";
        }


        return "user-status pending";
    }


    /* =================================================
       API
    ================================================= */

    async function api(endpoint, options = {}) {

        const headers = {

            "Accept": "application/json",

            "Authorization":
                `Bearer ${token}`
        };


        if (options.body) {

            headers["Content-Type"] =
                "application/json";
        }


        let response;


        try {

            response = await fetch(
                `${USER_API}${endpoint}`,
                {
                    ...options,

                    headers: {

                        ...headers,

                        ...(options.headers || {})
                    }
                }
            );

        }

        catch (error) {

            console.error(
                "TRANSLOGIX FETCH ERROR:",
                error
            );

            throw new Error(
                "Unable to connect to TRANSLOGIX backend on port 8081."
            );
        }


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

            data = raw;
        }


        /* =================================================
           SESSION EXPIRED
        ================================================= */

        if (response.status === 401) {

            localStorage.clear();

            window.location.href =
                "./login.html";

            throw new Error(
                "Your session has expired."
            );
        }


        /* =================================================
           FORBIDDEN
        ================================================= */

        if (response.status === 403) {

            throw new Error(
                "User permission required."
            );
        }


        /* =================================================
           OTHER ERRORS
        ================================================= */

        if (!response.ok) {

            const message =

                typeof data === "string"

                    ? data

                    : (
                        data?.message ||
                        data?.error ||
                        `Request failed (${response.status})`
                    );


            throw new Error(message);
        }


        return data;
    }


    /* =================================================
       ACCOUNT
    ================================================= */

    text(
        "username",
        username
    );


    text(
        "topUsername",
        username
    );


    text(
        "welcomeUser",
        username
    );


    text(
        "profileUsername",
        username
    );


    text(
        "profileName",
        username
    );


    text(
        "userAvatar",
        initial
    );


    text(
        "topAvatar",
        initial
    );


    text(
        "profileAvatar",
        initial
    );


    /* =================================================
       STATS
    ================================================= */

    function count(status) {

        const target =
            normalize(status);


        return shipments.filter(
            shipment =>
                normalize(
                    shipment.status
                ) === target
        ).length;
    }


    function updateStats() {

        text(
            "userTotal",
            shipments.length
        );


        text(
            "userDelivered",
            count("Delivered")
        );


        text(
            "userTransit",
            count("In Transit")
        );


        text(
            "userFinal",
            count("Out for Delivery")
        );


        text(
            "userShipmentCount",
            shipments.length
        );
    }


    /* =================================================
       ACTIVE SHIPMENT
    ================================================= */

    function activeShipment() {

        return (

            shipments.find(
                shipment =>
                    normalize(
                        shipment.status
                    ) === "in transit"
            )

            ||

            shipments.find(
                shipment =>
                    normalize(
                        shipment.status
                    ) === "out for delivery"
            )

            ||

            shipments.find(
                shipment =>
                    normalize(
                        shipment.status
                    ) === "pending"
            )

            ||

            shipments[0]

            ||

            null
        );
    }


    function renderActive() {

        const shipment =
            activeShipment();


        if (!shipment) {

            text(
                "activeTracking",
                "--"
            );

            text(
                "activeOrigin",
                "--"
            );

            text(
                "activeDestination",
                "--"
            );

            text(
                "activeSender",
                "--"
            );

            text(
                "activeReceiver",
                "--"
            );

            text(
                "activeType",
                "--"
            );

            text(
                "activeWeight",
                "--"
            );


            const status =
                $("activeStatus");


            if (status) {

                status.textContent =
                    "No shipment";

                status.className =
                    "user-status pending";
            }


            return;
        }


        text(
            "activeTracking",
            shipment.trackingNumber
        );


        text(
            "activeOrigin",
            shipment.origin
        );


        text(
            "activeDestination",
            shipment.destination
        );


        text(
            "activeSender",
            shipment.senderName
        );


        text(
            "activeReceiver",
            shipment.receiverName
        );


        text(
            "activeType",
            shipment.shipmentType
        );


        text(
            "activeWeight",
            shipment.weight != null
                ? `${shipment.weight} kg`
                : "-"
        );


        const status =
            $("activeStatus");


        if (status) {

            status.textContent =
                shipment.status ||
                "Pending";

            status.className =
                statusClass(
                    shipment.status
                );
        }
    }


    /* =================================================
       SHIPMENT CARD
    ================================================= */

    function createShipmentCard(item) {

        const tracking =
            item.trackingNumber || "-";


        const status =
            item.status || "Pending";


        const weight =
            item.weight != null
                ? `${item.weight} kg`
                : "-";


        return `

            <article
                class="user-shipment-card"
            >

                <div
                    class="user-shipment-head"
                >

                    <div>

                        <small>
                            TRACKING
                        </small>

                        <strong>
                            ${escapeHTML(
                                tracking
                            )}
                        </strong>

                    </div>


                    <span
                        class="${statusClass(
                            status
                        )}"
                    >

                        ${escapeHTML(
                            status
                        )}

                    </span>

                </div>


                <div
                    class="user-shipment-route"
                >

                    <div>

                        <span>
                            FROM
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.origin || "-"
                            )}
                        </strong>

                    </div>


                    <b>
                        →
                    </b>


                    <div>

                        <span>
                            TO
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.destination || "-"
                            )}
                        </strong>

                    </div>

                </div>


                <div
                    class="user-shipment-meta"
                >

                    <div>

                        <span>
                            TYPE
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.shipmentType || "-"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            RECEIVER
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.receiverName || "-"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            LOAD
                        </span>

                        <strong>
                            ${escapeHTML(
                                weight
                            )}
                        </strong>

                    </div>

                </div>


                <button
                    type="button"
                    class="user-shipment-action"
                    data-user-open-id="${escapeHTML(
                        item.id
                    )}"
                >

                    Open Shipment →

                </button>

            </article>
        `;
    }


    /* =================================================
       RECENT SHIPMENTS
    ================================================= */

    function renderRecent() {

        const container =
            $("recentShipmentList");


        if (!container) {
            return;
        }


        const list =
            shipments
                .slice()
                .reverse()
                .slice(0, 6);


        if (!list.length) {

            container.innerHTML = `

                <div
                    style="
                        grid-column:1/-1;
                        padding:45px 20px;
                        text-align:center;
                    "
                >

                    <strong>
                        No shipments found
                    </strong>

                    <p
                        style="
                            margin-top:7px;
                            color:#918997;
                            font-size:9px;
                        "
                    >

                        Your shipment activity
                        will appear here.

                    </p>

                </div>

            `;

            return;
        }


        container.innerHTML =
            list
                .map(createShipmentCard)
                .join("");


        bindShipmentButtons(container);
    }


    /* =================================================
       ALL SHIPMENTS
    ================================================= */

    function renderAllShipments(
        list = shipments
    ) {

        const container =
            $("userShipmentGrid");


        if (!container) {
            return;
        }


        if (!list.length) {

            container.innerHTML = `

                <div
                    class="user-panel"
                    style="
                        grid-column:1/-1;
                        padding:65px 20px;
                        text-align:center;
                    "
                >

                    <strong
                        style="
                            display:block;
                            font-size:18px;
                        "
                    >

                        No shipments found

                    </strong>


                    <p
                        style="
                            margin-top:7px;
                            color:#918997;
                            font-size:9px;
                        "
                    >

                        Try changing your filters.

                    </p>

                </div>

            `;

            return;
        }


        container.innerHTML =
            list
                .map(createShipmentCard)
                .join("");


        bindShipmentButtons(container);
    }


    /* =================================================
       SHIPMENT BUTTONS
    ================================================= */

    function bindShipmentButtons(container) {

        container
            .querySelectorAll(
                "[data-user-open-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const shipment =
                                shipments.find(
                                    item =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            button.dataset
                                                .userOpenId
                                        )
                                );


                            openDrawer(shipment);
                        }
                    );
                }
            );
    }


    /* =================================================
       DRAWER
    ================================================= */

    function openDrawer(shipment) {

        if (!shipment) {
            return;
        }


        text(
            "drawerTracking",
            shipment.trackingNumber
        );


        text(
            "drawerOrigin",
            shipment.origin
        );


        text(
            "drawerDestination",
            shipment.destination
        );


        text(
            "drawerSender",
            shipment.senderName
        );


        text(
            "drawerReceiver",
            shipment.receiverName
        );


        text(
            "drawerType",
            shipment.shipmentType
        );


        text(
            "drawerWeight",
            shipment.weight != null
                ? `${shipment.weight} kg`
                : "-"
        );


        const status =
            $("drawerStatus");


        if (status) {

            status.textContent =
                shipment.status ||
                "Pending";

            status.className =
                statusClass(
                    shipment.status
                );
        }


        $("userDrawer")
            ?.classList.remove("hidden");
    }


    function closeDrawer() {

        $("userDrawer")
            ?.classList.add("hidden");
    }


    $("drawerClose")
        ?.addEventListener(
            "click",
            closeDrawer
        );


    $("userDrawer")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "userDrawer"
                ) {

                    closeDrawer();
                }
            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeDrawer();
            }
        }
    );


    /* =================================================
       LOAD SHIPMENTS
    ================================================= */

    async function loadShipments() {

        let data;


        try {

            data =
                await api(
                    "/api/user/shipments"
                );

        }

        catch (userEndpointError) {

            console.warn(
                "USER shipment endpoint unavailable. Trying general endpoint.",
                userEndpointError
            );


            data =
                await api(
                    "/api/shipments"
                );
        }


        if (Array.isArray(data)) {

            shipments = data;

        }

        else if (
            data &&
            Array.isArray(data.content)
        ) {

            shipments =
                data.content;

        }

        else {

            shipments = [];
        }


        console.log(
            "TRANSLOGIX USER SHIPMENTS:",
            shipments
        );


        updateStats();

        renderActive();

        renderRecent();

        renderAllShipments();
    }


    /* =================================================
       TRACK SHIPMENT
    ================================================= */

    async function trackShipment(tracking) {

        const value =
            String(tracking || "")
                .trim();


        if (!value) {

            showUserMessage(
                "Enter a tracking number.",
                "error"
            );

            return;
        }


        showUserMessage(
            "Searching shipment..."
        );


        try {

            const data =
                await api(
                    `/api/shipments/tracking/${encodeURIComponent(
                        value
                    )}`
                );


            if (
                !data ||
                !data.trackingNumber
            ) {

                throw new Error(
                    "Shipment data was not returned."
                );
            }


            text(
                "userResultTracking",
                data.trackingNumber
            );


            text(
                "userResultOrigin",
                data.origin
            );


            text(
                "userResultDestination",
                data.destination
            );


            text(
                "userResultSender",
                data.senderName
            );


            text(
                "userResultReceiver",
                data.receiverName
            );


            text(
                "userResultType",
                data.shipmentType
            );


            text(
                "userResultWeight",
                data.weight != null
                    ? `${data.weight} kg`
                    : "-"
            );


            const status =
                $("userResultStatus");


            if (status) {

                status.textContent =
                    data.status ||
                    "Pending";

                status.className =
                    statusClass(
                        data.status
                    );
            }


            $("userTrackingResult")
                ?.classList.remove(
                    "hidden"
                );


            showUserMessage(
                "✓ Shipment found.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "TRACKING ERROR:",
                error
            );


            $("userTrackingResult")
                ?.classList.add(
                    "hidden"
                );


            showUserMessage(
                error.message ||
                "Shipment not found.",
                "error"
            );
        }
    }


    /* =================================================
       TRACK MESSAGE
    ================================================= */

    function showUserMessage(
        message,
        type = ""
    ) {

        const element =
            $("userTrackingMessage");


        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.className =
            `user-message ${type}`;
    }


    /* =================================================
       TRACK FORM
    ================================================= */

    $("userTrackingForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const input =
                    $("userTrackingInput");


                trackShipment(
                    input?.value?.trim()
                );
            }
        );


    /* =================================================
       FILTERS
    ================================================= */

    function filterUserShipments() {

        const search =
            normalize(
                $("userShipmentSearch")
                    ?.value
            );


        const status =
            normalize(
                $("userStatusFilter")
                    ?.value
            );


        const filtered =
            shipments.filter(
                item => {

                    const searchable = [

                        item.trackingNumber,

                        item.origin,

                        item.destination,

                        item.senderName,

                        item.receiverName,

                        item.shipmentType,

                        item.status

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
                        normalize(
                            item.status
                        ) === status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );


        renderAllShipments(
            filtered
        );
    }


    $("userShipmentSearch")
        ?.addEventListener(
            "input",
            filterUserShipments
        );


    $("userStatusFilter")
        ?.addEventListener(
            "change",
            filterUserShipments
        );


    $("clearUserFilters")
        ?.addEventListener(
            "click",
            () => {

                const search =
                    $("userShipmentSearch");


                const filter =
                    $("userStatusFilter");


                if (search) {
                    search.value = "";
                }


                if (filter) {
                    filter.value = "";
                }


                renderAllShipments();
            }
        );


    /* =================================================
       GLOBAL SEARCH
    ================================================= */

    $("userGlobalSearch")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Enter"
                ) {
                    return;
                }


                const value =
                    event.target.value.trim();


                if (!value) {
                    return;
                }


                showPage("tracking");


                const trackingInput =
                    $("userTrackingInput");


                if (trackingInput) {

                    trackingInput.value =
                        value;
                }


                trackShipment(value);
            }
        );


    /* =================================================
       PAGE NAVIGATION
    ================================================= */

    const pageMap = {

        dashboard: {

            section:
                "page-dashboard",

            title:
                "Dashboard",

            subtitle:
                "Your logistics workspace"
        },


        shipments: {

            section:
                "page-shipments",

            title:
                "My Shipments",

            subtitle:
                "Your shipment history"
        },


        tracking: {

            section:
                "page-tracking",

            title:
                "Track Shipment",

            subtitle:
                "Follow your shipment journey"
        },


        notifications: {

            section:
                "page-notifications",

            title:
                "Notifications",

            subtitle:
                "Your logistics updates"
        },


        profile: {

            section:
                "page-profile",

            title:
                "My Profile",

            subtitle:
                "Account and security"
        }
    };


    function showPage(page) {

        const config =
            pageMap[page] ||
            pageMap.dashboard;


        /* Hide all pages */

        Object.values(pageMap)
            .forEach(
                item => {

                    $(
                        item.section
                    )
                        ?.classList.add(
                            "hidden"
                        );
                }
            );


        /* Show selected page */

        $(
            config.section
        )
            ?.classList.remove(
                "hidden"
            );


        /* Desktop navigation */

        document
            .querySelectorAll(
                ".user-nav-item"
            )
            .forEach(
                item => {

                    item.classList.toggle(
                        "active",
                        item.dataset.page ===
                        page
                    );
                }
            );


        /* Mobile navigation */

        document
            .querySelectorAll(
                ".mobile-nav-item"
            )
            .forEach(
                item => {

                    item.classList.toggle(
                        "active",
                        item.dataset.page ===
                        page
                    );
                }
            );


        /* Header */

        text(
            "pageTitle",
            config.title
        );


        text(
            "pageSubtitle",
            config.subtitle
        );


        /* Scroll top */

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =================================================
       DESKTOP NAVIGATION
    ================================================= */

    document
        .querySelectorAll(
            ".user-nav-item"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );
                    }
                );
            }
        );


    /* =================================================
       MOBILE NAVIGATION
    ================================================= */

    document
        .querySelectorAll(
            ".mobile-nav-item"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );
                    }
                );
            }
        );


    /* =================================================
       HERO / INTERNAL BUTTONS
    ================================================= */

    document
        .querySelectorAll(
            "[data-go-user]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.goUser
                        );
                    }
                );
            }
        );


    /* =================================================
       NOTIFICATIONS
    ================================================= */

    function updateNotificationCount() {

        const unread =
            document
                .querySelectorAll(
                    ".notification-card.unread"
                )
                .length;


        text(
            "desktopNotificationCount",
            unread
        );


        text(
            "topNotificationCount",
            unread
        );


        text(
            "mobileNotificationCount",
            unread
        );


        const topCount =
            $("topNotificationCount");


        if (topCount) {

            topCount.style.display =
                unread > 0
                    ? "grid"
                    : "none";
        }


        const mobileCount =
            $("mobileNotificationCount");


        if (mobileCount) {

            mobileCount.style.display =
                unread > 0
                    ? "grid"
                    : "none";
        }
    }


    $("markNotificationsRead")
        ?.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".notification-card.unread"
                    )
                    .forEach(
                        card =>
                            card.classList.remove(
                                "unread"
                            )
                    );


                updateNotificationCount();
            }
        );


    $("notificationTopBtn")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "notifications"
                );
            }
        );


    /* =================================================
       REFRESH
    ================================================= */

    $("userRefreshBtn")
        ?.addEventListener(
            "click",
            async () => {

                const button =
                    $("userRefreshBtn");


                if (button) {

                    button.disabled = true;

                    button.style.opacity =
                        ".55";
                }


                try {

                    await loadShipments();

                }

                catch (error) {

                    console.error(error);


                    showUserMessage(
                        error.message,
                        "error"
                    );

                }

                finally {

                    if (button) {

                        button.disabled =
                            false;

                        button.style.opacity =
                            "1";
                    }
                }
            }
        );


    /* =================================================
       LOGOUT
    ================================================= */

    $("logoutBtn")
        ?.addEventListener(
            "click",
            () => {

                localStorage.clear();

                window.location.href =
                    "./login.html";
            }
        );


    /* =================================================
       INITIALIZE
    ================================================= */

    showPage("dashboard");

    updateNotificationCount();


    loadShipments()
        .catch(
            error => {

                console.error(
                    "TRANSLOGIX USER API:",
                    error
                );

                showUserMessage(
                    error.message ||
                    "Unable to load shipments.",
                    "error"
                );
            }
        );

});

