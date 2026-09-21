"use strict";

/* =========================================================
   TRANSLOGIX COPILOT
   LIVE ADMIN LOGISTICS ASSISTANT
========================================================= */

const TX_COPILOT = {

    API_URL: "http://localhost:8081",

    panel: null,
    messages: null,
    input: null,
    typing: null,

    initialized: false,
    shipments: [],

    /* =====================================================
       INIT
    ===================================================== */

    async init() {

        if (this.initialized) {
            return;
        }

        console.log(
            "TRANSLOGIX COPILOT: initializing..."
        );

        this.createUI();

        if (!this.panel || !this.messages || !this.input) {

            console.error(
                "TRANSLOGIX COPILOT: UI initialization failed."
            );

            return;
        }

        this.bindEvents();

        this.initialized = true;

        this.addBotMessage(
            "Hello! I'm TRANSLOGIX Copilot. I can help with shipments, tracking, routes, delivery status, exceptions and fleet operations."
        );

        await this.loadShipments();

        console.log(
            "TRANSLOGIX COPILOT: READY"
        );

    },


    /* =====================================================
       TOKEN
    ===================================================== */

    getToken() {

        return (

            localStorage.getItem("token") ||

            localStorage.getItem("jwt") ||

            localStorage.getItem("accessToken") ||

            ""

        );

    },


    /* =====================================================
       CREATE UI
    ===================================================== */

    createUI() {

        let panel =
            document.getElementById(
                "txCopilotPanel"
            );


        if (!panel) {

            panel =
                document.createElement(
                    "aside"
                );

            panel.id =
                "txCopilotPanel";

            panel.className =
                "tx-copilot-panel hidden";

            panel.setAttribute(
                "aria-hidden",
                "true"
            );


            panel.innerHTML = `

                <div class="tx-copilot-header">

                    <div class="tx-copilot-brand">

                        <div class="tx-copilot-logo">
                            ✦
                        </div>

                        <div class="tx-copilot-title">

                            <strong>
                                TRANSLOGIX Copilot
                            </strong>

                            <small>
                                Live Logistics Intelligence
                            </small>

                        </div>

                    </div>


                    <button
                        id="txCopilotClose"
                        class="tx-copilot-close"
                        type="button"
                        aria-label="Close Copilot">

                        ×

                    </button>

                </div>


                <div class="tx-copilot-status">

                    <i></i>

                    <span>
                        Connected to TRANSLOGIX Operations
                    </span>

                </div>


                <div
                    id="txCopilotMessages"
                    class="tx-copilot-messages">
                </div>


                <div class="tx-copilot-suggestions">

                    <button
                        type="button"
                        data-copilot-question="Show shipment summary">

                        Shipment Summary

                    </button>


                    <button
                        type="button"
                        data-copilot-question="How many shipments are in transit?">

                        In Transit

                    </button>


                    <button
                        type="button"
                        data-copilot-question="Show delivered shipments">

                        Delivered

                    </button>


                    <button
                        type="button"
                        data-copilot-question="Show pending shipments">

                        Pending

                    </button>


                    <button
                        type="button"
                        data-copilot-question="Show out for delivery shipments">

                        Out for Delivery

                    </button>


                    <button
                        type="button"
                        data-copilot-question="Show current routes">

                        Routes

                    </button>


                    <button
                        type="button"
                        data-copilot-question="Show operational exceptions">

                        Exceptions

                    </button>


                    <button
                        type="button"
                        data-copilot-question="Show fleet information">

                        Fleet

                    </button>

                </div>


                <form
                    id="txCopilotForm"
                    class="tx-copilot-input">

                    <input
                        id="txCopilotInput"
                        type="text"
                        autocomplete="off"
                        placeholder="Ask Copilot about logistics...">

                    <button
                        class="tx-copilot-send"
                        type="submit"
                        aria-label="Send">

                        ↑

                    </button>

                </form>

            `;

            document.body.appendChild(
                panel
            );

        }


        this.panel =
            panel;


        this.messages =
            panel.querySelector(
                "#txCopilotMessages"
            );


        this.input =
            panel.querySelector(
                "#txCopilotInput"
            );

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    bindEvents() {

        const openButton =
            document.getElementById(
                "txCopilotOpen"
            );


        if (openButton) {

            openButton.addEventListener(
                "click",
                () => {

                    this.open();

                }
            );

        }


        const closeButton =
            document.getElementById(
                "txCopilotClose"
            );


        closeButton?.addEventListener(
            "click",
            () => {

                this.close();

            }
        );


        const form =
            document.getElementById(
                "txCopilotForm"
            );


        form?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                this.ask(
                    this.input
                        ?.value
                        ?.trim() || ""
                );

            }
        );


        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-copilot-question]"
                    );


                if (!button) {
                    return;
                }


                const question =
                    button.dataset
                        .copilotQuestion;


                this.ask(
                    question
                );

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    this.close();

                }

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                const activeTag =
                    document.activeElement
                        ?.tagName || "";


                if (
                    event.key === "/" &&
                    ![
                        "INPUT",
                        "TEXTAREA",
                        "SELECT"
                    ].includes(activeTag)
                ) {

                    event.preventDefault();

                    this.open();

                    this.input?.focus();

                }

            }
        );

    },


    /* =====================================================
       OPEN
    ===================================================== */

    open() {

        if (!this.panel) {
            return;
        }


        this.panel.classList.remove(
            "hidden"
        );


        this.panel.style.display =
            "flex";


        this.panel.setAttribute(
            "aria-hidden",
            "false"
        );


        setTimeout(
            () => {

                this.input?.focus();

            },
            80
        );

    },


    /* =====================================================
       CLOSE
    ===================================================== */

    close() {

        if (!this.panel) {
            return;
        }


        this.panel.classList.add(
            "hidden"
        );


        this.panel.style.display =
            "none";


        this.panel.setAttribute(
            "aria-hidden",
            "true"
        );

    },


    /* =====================================================
       TOGGLE
    ===================================================== */

    toggle() {

        if (
            !this.panel ||
            this.panel.classList.contains(
                "hidden"
            )
        ) {

            this.open();

        }
        else {

            this.close();

        }

    },


    /* =====================================================
       LOAD SHIPMENTS
    ===================================================== */

    async loadShipments() {

        /*
         * IMPORTANT:
         * First use admin.js live state.
         */

        if (
            window.state &&
            Array.isArray(
                window.state.shipments
            ) &&
            window.state.shipments.length
        ) {

            this.shipments =
                window.state.shipments;

            console.log(
                "Copilot using admin live state:",
                this.shipments.length
            );

            return this.shipments;

        }


        /*
         * Fallback API
         */

        try {

            const headers = {

                "Accept":
                    "application/json"

            };


            const accessToken =
                this.getToken();


            if (accessToken) {

                headers.Authorization =
                    `Bearer ${accessToken}`;

            }


            const response =
                await fetch(
                    `${this.API_URL}/api/shipments`,
                    {
                        method: "GET",
                        headers
                    }
                );


            if (!response.ok) {

                console.warn(
                    "Copilot API status:",
                    response.status
                );

                this.shipments =
                    this.getAdminStateShipments();

                return this.shipments;

            }


            const data =
                await response.json();


            if (
                Array.isArray(data)
            ) {

                this.shipments =
                    data;

            }
            else if (
                Array.isArray(data?.content)
            ) {

                this.shipments =
                    data.content;

            }
            else {

                this.shipments =
                    [];

            }


            console.log(
                "Copilot API shipments:",
                this.shipments.length
            );


        }
        catch (error) {

            console.error(
                "Copilot shipment load error:",
                error
            );


            this.shipments =
                this.getAdminStateShipments();

        }


        return this.shipments;

    },


    /* =====================================================
       ADMIN STATE
    ===================================================== */

    getAdminStateShipments() {

        if (
            window.state &&
            Array.isArray(
                window.state.shipments
            )
        ) {

            return window.state.shipments;

        }

        return [];

    },


    /* =====================================================
       SYNC LIVE DATA
    ===================================================== */

    syncLiveShipments() {

        const adminShipments =
            this.getAdminStateShipments();


        if (
            adminShipments.length ||
            this.shipments.length === 0
        ) {

            this.shipments =
                adminShipments;

        }


        return this.shipments;

    },


    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalize(value) {

        return String(
            value ?? ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    },


    /* =====================================================
       NORMALIZE STATUS
    ===================================================== */

    normalizeStatus(status) {

        const value =
            this.normalize(
                status
            );


        if (
            value === "in transit" ||
            value === "in-transit" ||
            value === "transit"
        ) {

            return "in transit";

        }


        if (
            value === "delivered" ||
            value === "complete" ||
            value === "completed"
        ) {

            return "delivered";

        }


        if (
            value === "pending" ||
            value === "waiting"
        ) {

            return "pending";

        }


        if (
            value === "out for delivery" ||
            value === "out-for-delivery" ||
            value === "out delivery"
        ) {

            return "out for delivery";

        }


        if (
            value === "delayed"
        ) {

            return "delayed";

        }


        if (
            value === "exception"
        ) {

            return "exception";

        }


        return value;

    },


    /* =====================================================
       STATUS COUNT
    ===================================================== */

    countStatus(status) {

        this.syncLiveShipments();


        const target =
            this.normalizeStatus(
                status
            );


        return this.shipments.filter(
            item =>
                this.normalizeStatus(
                    item.status
                ) === target
        ).length;

    },


    /* =====================================================
       TOTAL WEIGHT
    ===================================================== */

    totalWeight() {

        this.syncLiveShipments();


        return this.shipments.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    (
                        Number(
                            item.weight
                        ) || 0
                    )
                );

            },
            0
        );

    },


    /* =====================================================
       ADD MESSAGE
    ===================================================== */

    addMessage(
        message,
        type = "bot"
    ) {

        if (!this.messages) {
            return;
        }


        const element =
            document.createElement(
                "div"
            );


        element.className =
            `tx-copilot-message ${type}`;


        element.textContent =
            String(
                message ?? ""
            );


        this.messages.appendChild(
            element
        );


        this.scrollBottom();

    },


    addBotMessage(message) {

        this.addMessage(
            message,
            "bot"
        );

    },


    addUserMessage(message) {

        this.addMessage(
            message,
            "user"
        );

    },


    /* =====================================================
       TYPING
    ===================================================== */

    showTyping() {

        if (
            this.typing ||
            !this.messages
        ) {
            return;
        }


        this.typing =
            document.createElement(
                "div"
            );


        this.typing.className =
            "tx-copilot-typing";


        this.typing.innerHTML = `

            <i></i>
            <i></i>
            <i></i>

        `;


        this.messages.appendChild(
            this.typing
        );


        this.scrollBottom();

    },


    hideTyping() {

        this.typing?.remove();

        this.typing =
            null;

    },


    /* =====================================================
       SCROLL
    ===================================================== */

    scrollBottom() {

        if (!this.messages) {
            return;
        }


        this.messages.scrollTop =
            this.messages.scrollHeight;

    },


    /* =====================================================
       ASK
    ===================================================== */

    async ask(question) {

        const value =
            String(
                question ?? ""
            ).trim();


        if (!value) {
            return;
        }


        this.open();


        this.addUserMessage(
            value
        );


        if (this.input) {

            this.input.value =
                "";

        }


        this.showTyping();


        /*
         * Refresh from admin state before answer.
         */

        this.syncLiveShipments();


        /*
         * If no data is available,
         * make one API attempt.
         */

        if (
            !this.shipments.length
        ) {

            await this.loadShipments();

        }


        const answer =
            this.generateAnswer(
                value
            );


        window.setTimeout(
            () => {

                this.hideTyping();

                this.addBotMessage(
                    answer
                );

            },
            350
        );

    },


    /* =====================================================
       TRACKING FORMAT
    ===================================================== */

    shipmentDetails(
        shipment
    ) {

        return (

            `Tracking: ${shipment.trackingNumber || "-"}\n` +

            `Route: ${shipment.origin || "-"} → ${shipment.destination || "-"}\n` +

            `Status: ${shipment.status || "-"}\n` +

            `Sender: ${shipment.senderName || "-"}\n` +

            `Receiver: ${shipment.receiverName || "-"}\n` +

            `Type: ${shipment.shipmentType || "-"}\n` +

            `Weight: ${shipment.weight ?? 0} kg`

        );

    },


    /* =====================================================
       LIST SHIPMENTS
    ===================================================== */

    formatShipmentList(
        list,
        title
    ) {

        if (!list.length) {

            return (
                `No ${title.toLowerCase()} shipments found.`
            );

        }


        return (

            `${list.length} shipment(s) — ${title}\n\n` +

            list
                .slice(0, 10)
                .map(
                    item =>
                        `${item.trackingNumber || "N/A"} · ` +
                        `${item.origin || "-"} → ${item.destination || "-"}`
                )
                .join("\n")

        );

    },


    /* =====================================================
       GENERATE ANSWER
    ===================================================== */

    generateAnswer(question) {

        this.syncLiveShipments();


        const q =
            this.normalize(
                question
            );


        const shipments =
            this.shipments;


        const total =
            shipments.length;


        const transit =
            this.countStatus(
                "In Transit"
            );


        const delivered =
            this.countStatus(
                "Delivered"
            );


        const pending =
            this.countStatus(
                "Pending"
            );


        const outForDelivery =
            this.countStatus(
                "Out for Delivery"
            );


        /* =================================================
           GREETING
        ================================================= */

        if (
            q === "hi" ||
            q === "hello" ||
            q === "hey" ||
            q.includes("good morning") ||
            q.includes("good afternoon") ||
            q.includes("good evening")
        ) {

            return (
                "Hello! TRANSLOGIX Copilot is online. " +
                "I can help you with live shipment operations."
            );

        }


        /* =================================================
           HELP
        ================================================= */

        if (
            q.includes("help") ||
            q.includes("what can you do")
        ) {

            return (

                "I can help you with:\n\n" +

                "• Shipment summary\n" +

                "• In Transit shipments\n" +

                "• Delivered shipments\n" +

                "• Pending shipments\n" +

                "• Out for Delivery shipments\n" +

                "• Tracking numbers\n" +

                "• Routes\n" +

                "• Operational exceptions\n" +

                "• Fleet operations"

            );

        }


        /* =================================================
           SUMMARY
        ================================================= */

        if (
            q.includes("summary") ||
            q.includes("overview") ||
            q.includes("shipment summary") ||
            q.includes("all shipments")
        ) {

            return (

                "TRANSLOGIX SHIPMENT SUMMARY\n\n" +

                `Total Shipments: ${total}\n` +

                `In Transit: ${transit}\n` +

                `Delivered: ${delivered}\n` +

                `Pending: ${pending}\n` +

                `Out for Delivery: ${outForDelivery}\n` +

                `Total Weight: ${this.totalWeight().toFixed(1)} kg`

            );

        }


        /* =================================================
           IN TRANSIT
        ================================================= */

        if (
            q.includes("in transit") ||
            q.includes("moving") ||
            q.includes("transit")
        ) {

            const list =
                shipments.filter(
                    item =>
                        this.normalizeStatus(
                            item.status
                        ) ===
                        "in transit"
                );


            return this.formatShipmentList(
                list,
                "In Transit"
            );

        }


        /* =================================================
           DELIVERED
        ================================================= */

        if (
            q.includes("delivered") ||
            q.includes("deliveries") ||
            q.includes("completed") ||
            q.includes("complete")
        ) {

            const list =
                shipments.filter(
                    item =>
                        this.normalizeStatus(
                            item.status
                        ) ===
                        "delivered"
                );


            return this.formatShipmentList(
                list,
                "Delivered"
            );

        }


        /* =================================================
           PENDING
        ================================================= */

        if (
            q.includes("pending") ||
            q.includes("waiting")
        ) {

            const list =
                shipments.filter(
                    item =>
                        this.normalizeStatus(
                            item.status
                        ) ===
                        "pending"
                );


            return this.formatShipmentList(
                list,
                "Pending"
            );

        }


        /* =================================================
           OUT FOR DELIVERY
        ================================================= */

        if (
            q.includes("out for delivery") ||
            q.includes("out-for-delivery") ||
            q.includes("out delivery")
        ) {

            const list =
                shipments.filter(
                    item =>
                        this.normalizeStatus(
                            item.status
                        ) ===
                        "out for delivery"
                );


            return this.formatShipmentList(
                list,
                "Out for Delivery"
            );

        }


        /* =================================================
           ROUTES
        ================================================= */

        if (
            q.includes("route") ||
            q.includes("routes") ||
            q.includes("movement")
        ) {

            if (!shipments.length) {

                return (
                    "No route data is currently available."
                );

            }


            return (

                "CURRENT SHIPMENT ROUTES\n\n" +

                shipments
                    .slice(0, 10)
                    .map(
                        item =>
                            `${item.trackingNumber || "N/A"}: ` +
                            `${item.origin || "-"} → ` +
                            `${item.destination || "-"}`
                    )
                    .join("\n")

            );

        }


        /* =================================================
           EXCEPTIONS
        ================================================= */

        if (
            q.includes("exception") ||
            q.includes("risk") ||
            q.includes("issue") ||
            q.includes("problem")
        ) {

            const list =
                shipments.filter(
                    item => {

                        const status =
                            this.normalizeStatus(
                                item.status
                            );


                        return (

                            status === "pending" ||

                            status === "delayed" ||

                            status === "exception"

                        );

                    }
                );


            if (!list.length) {

                return (
                    "No shipment exceptions are currently detected."
                );

            }


            return (

                `${list.length} shipment(s) require attention.\n\n` +

                list
                    .slice(0, 10)
                    .map(
                        item =>
                            `${item.trackingNumber || "N/A"} · ` +
                            `${item.status || "Unknown"} · ` +
                            `${item.origin || "-"} → ${item.destination || "-"}`
                    )
                    .join("\n")

            );

        }


        /* =================================================
           TRACKING NUMBER
        ================================================= */

        const shipment =
            shipments.find(
                item => {

                    const tracking =
                        this.normalize(
                            item.trackingNumber
                        );


                    return (
                        tracking.length > 0 &&
                        q.includes(
                            tracking
                        )
                    );

                }
            );


        if (shipment) {

            return this.shipmentDetails(
                shipment
            );

        }


        /* =================================================
           TRACK / TRACKING WORD
        ================================================= */

        if (
            q.includes("track") ||
            q.includes("tracking")
        ) {

            return (
                "Please enter a valid tracking number, for example TRX10001."
            );

        }


        /* =================================================
           FLEET
        ================================================= */

        if (
            q.includes("fleet") ||
            q.includes("vehicle") ||
            q.includes("truck")
        ) {

            return (

                "FLEET CONTROL\n\n" +

                "You can review:\n" +

                "• Vehicle readiness\n" +

                "• Vehicle health\n" +

                "• Fuel status\n" +

                "• Assignments\n" +

                "• Service alerts\n\n" +

                "Open Fleet Control from the left navigation."

            );

        }


        /* =================================================
           CREATE
        ================================================= */

        if (
            q.includes("create shipment") ||
            q.includes("new shipment")
        ) {

            return (
                "Open Shipment Command → Create Shipment to create a new shipment."
            );

        }


        /* =================================================
           HOW MANY
        ================================================= */

        if (
            q.includes("how many") &&
            q.includes("shipment")
        ) {

            return (

                `TRANSLOGIX currently has ${total} shipment(s).\n\n` +

                `In Transit: ${transit}\n` +

                `Delivered: ${delivered}\n` +

                `Pending: ${pending}\n` +

                `Out for Delivery: ${outForDelivery}`

            );

        }


        /* =================================================
           DASHBOARD
        ================================================= */

        if (
            q.includes("dashboard") ||
            q.includes("control center") ||
            q.includes("command center")
        ) {

            return (

                "TRANSLOGIX Control Center provides shipment operations, " +
                "live network monitoring, fleet control, dispatch, " +
                "exception management, analytics and reports."

            );

        }


        /* =================================================
           DEFAULT
        ================================================= */

        return (

            "I can help with live logistics operations.\n\n" +

            "Try:\n" +

            "• Show shipment summary\n" +

            "• How many shipments are in transit?\n" +

            "• Show delivered shipments\n" +

            "• Show pending shipments\n" +

            "• Show out for delivery shipments\n" +

            "• Track TRX10001\n" +

            "• Show current routes\n" +

            "• Show operational exceptions"

        );

    }

};


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.TX_COPILOT =
    TX_COPILOT;


/* =========================================================
   SAFE START
========================================================= */

function startTranslogixCopilot() {

    if (
        window.TX_COPILOT &&
        typeof window.TX_COPILOT.init === "function"
    ) {

        window.TX_COPILOT.init();

    }

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startTranslogixCopilot,
        {
            once: true
        }
    );

}
else {

    startTranslogixCopilot();

}