"use strict";

/* =========================================================
   TRANSLOGIX ADMIN CONTROL TOWER
   CRUD ENABLED VERSION

   Features:
   - Load shipments
   - Create shipment
   - View shipment
   - Edit shipment
   - Delete shipment
   - Update status
   - Search / filter
   - CSV export
   - Reports
   - Dashboard stats
   - Leaflet network maps
   - Notifications
   - Responsive navigation
========================================================= */


/* =========================================================
   API
========================================================= */

const ADMIN_API =
    "https://translogix-backend-1.onrender.com";

/* =========================================================
   STATE
========================================================= */

const state = {

    shipments: [],

    currentPage:
        "dashboard",

    demoMode:
        false,

    maps: {},

    selectedVehicle:
        null

};


/* =========================================================
   HELPERS
========================================================= */

function $(id){

    return document.getElementById(id);

}


function normalize(value){

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


function text(
    id,
    value
){

    const element =
        $(id);

    if(element){

        element.textContent =
            value ?? "-";

    }

}


function escapeHTML(value){

    return String(
        value ?? ""
    )
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


function token(){

    return (

        localStorage.getItem(
            "token"
        ) ||

        localStorage.getItem(
            "jwt"
        ) ||

        localStorage.getItem(
            "accessToken"
        ) ||

        ""

    );

}


/* =========================================================
   API HELPER
========================================================= */

async function api(
    endpoint,
    options = {}
){

    const headers = {

        Accept:
            "application/json"

    };


    const authToken =
        token();


    if(authToken){

        headers.Authorization =
            `Bearer ${authToken}`;

    }


    if(options.body){

        headers[
            "Content-Type"
        ] =
            "application/json";

    }


    const response =
        await fetch(

            `${ADMIN_API}${endpoint}`,

            {

                ...options,

                headers:{

                    ...headers,

                    ...(options.headers || {})

                }

            }

        );


    const raw =
        await response.text();


    let data;


    try{

        data =
            raw
                ? JSON.parse(raw)
                : {};

    }

    catch{

        data =
            raw;

    }


    if(
        response.status ===
        401
    ){

        localStorage.clear();

        window.location.href =
            "./login.html";

        throw new Error(
            "Session expired."
        );

    }


    if(
        response.status ===
        403
    ){

        throw new Error(
            "Administrator permission required."
        );

    }


    if(!response.ok){

        throw new Error(

            typeof data ===
            "string"

                ? data

                : (
                    data?.message ||

                    data?.error ||

                    `Request failed (${response.status})`
                )

        );

    }


    return data;

}


/* =========================================================
   DEMO DATA
========================================================= */

function demoData(){

    return [

        {
            id:1,
            trackingNumber:"TRX10001",
            senderName:"Vijay",
            receiverName:"Amit",
            origin:"Pune",
            destination:"Delhi",
            shipmentType:"Express",
            status:"Delivered",
            weight:4.5
        },

        {
            id:7,
            trackingNumber:"TSJ78962",
            senderName:"Mahesh",
            receiverName:"Daya",
            origin:"Jalgaon",
            destination:"Nagpur",
            shipmentType:"International",
            status:"In Transit",
            weight:7
        },

        {
            id:9,
            trackingNumber:"GHJK123456",
            senderName:"Veer",
            receiverName:"Tanu",
            origin:"Pune",
            destination:"Delhi",
            shipmentType:"Freight",
            status:"Delivered",
            weight:6
        },

        {
            id:10,
            trackingNumber:"3554661",
            senderName:"RJ",
            receiverName:"Vj",
            origin:"Pune",
            destination:"Delhi",
            shipmentType:"Standard",
            status:"In Transit",
            weight:7
        },

        {
            id:12,
            trackingNumber:"THJJ1556",
            senderName:"RHG",
            receiverName:"JHG",
            origin:"UHH",
            destination:"JKK",
            shipmentType:"Freight",
            status:"In Transit",
            weight:15
        },

        {
            id:13,
            trackingNumber:"TYJJB123",
            senderName:"GH",
            receiverName:"KJ",
            origin:"BH",
            destination:"YH",
            shipmentType:"Courier",
            status:"Pending",
            weight:7
        }

    ];

}


/* =========================================================
   STATUS HELPERS
========================================================= */

function isActive(item){

    const status =
        normalize(
            item.status
        );

    return (

        status ===
        "in transit" ||

        status ===
        "out for delivery"

    );

}


function isDelivered(item){

    return (
        normalize(
            item.status
        ) ===
        "delivered"
    );

}


function isException(item){

    const status =
        normalize(
            item.status
        );

    return (

        status === "pending" ||

        status === "delayed" ||

        status === "exception"

    );

}


function stateClass(status){

    const value =
        normalize(
            status
        );


    if(

        value === "delivered" ||

        value === "in transit" ||

        value === "out for delivery"

    ){

        return "state-green";

    }


    if(

        value === "delayed" ||

        value === "exception"

    ){

        return "state-red";

    }


    return "state-purple";

}


/* =========================================================
   LOAD SHIPMENTS
========================================================= */

async function loadShipments(){

    try{

        const data =
            await api(
                "/api/shipments"
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


        state.demoMode =
            false;

    }

    catch(error){

        console.warn(
            "Backend unavailable. Demo mode enabled.",
            error
        );


        state.shipments =
            demoData();


        state.demoMode =
            true;

    }


    updateStats();


    renderShipmentTable(
        state.shipments
    );


    updateMapVehicleData();

}


/* =========================================================
   STATS
========================================================= */

function updateStats(){

    const total =
        state.shipments.length;


    const active =
        state.shipments.filter(
            isActive
        ).length;


    const delivered =
        state.shipments.filter(
            isDelivered
        ).length;


    const exceptions =
        state.shipments.filter(
            isException
        ).length;


    text(
        "kpiTotal",
        String(
            total
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "kpiTransit",
        String(
            active
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "kpiDelivered",
        String(
            delivered
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "kpiExceptions",
        String(
            exceptions
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "shipmentTotal",
        String(
            total
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "shipmentActive",
        String(
            active
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "shipmentDelivered",
        String(
            delivered
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "shipmentExceptions",
        String(
            exceptions
        ).padStart(
            2,
            "0"
        )
    );


    text(
        "sidebarShipmentCount",
        String(
            total
        ).padStart(
            2,
            "0"
        )
    );

}


/* =========================================================
   PAGE CONFIG
========================================================= */

const pageConfig = {

    dashboard:{
        title:
            "Command Center",
        subtitle:
            "Enterprise logistics control workspace"
    },

    shipments:{
        title:
            "Shipment Command",
        subtitle:
            "Control live shipment movement"
    },

    fleet:{
        title:
            "Fleet Control",
        subtitle:
            "Vehicle health and readiness"
    },

    drivers:{
        title:
            "Driver Command",
        subtitle:
            "Driver availability and performance"
    },

    dispatch:{
        title:
            "Dispatch Operations",
        subtitle:
            "Route release and allocation"
    },

    network:{
        title:
            "Live Network",
        subtitle:
            "Real-time logistics movement"
    },

    exceptions:{
        title:
            "Exception Center",
        subtitle:
            "Operational risk and priority actions"
    },

    alerts:{
        title:
            "Alert Operations",
        subtitle:
            "Network alert management"
    },

    maintenance:{
        title:
            "Maintenance Control",
        subtitle:
            "Vehicle service operations"
    },

    analytics:{
        title:
            "Network Analytics",
        subtitle:
            "Operational performance intelligence"
    },

    customers:{
        title:
            "Customer Operations",
        subtitle:
            "Customer experience intelligence"
    },

    reports:{
        title:
            "Operational Reports",
        subtitle:
            "Shipment and performance reporting"
    },

    assignments:{
        title:
            "Assignment Control",
        subtitle:
            "Shipment, driver and vehicle allocation"
    },

    settings:{
        title:
            "Settings",
        subtitle:
            "Platform configuration"
    }

};


/* =========================================================
   SHOW PAGE
========================================================= */

function showPage(page){

    if(
        !pageConfig[page]
    ){

        page =
            "dashboard";

    }


    Object.keys(
        pageConfig
    )
        .forEach(
            key => {

                const section =
                    $(
                        `page-${key}`
                    );


                if(section){

                    section.classList.toggle(
                        "hidden",
                        key !== page
                    );

                }

            }
        );


    document
        .querySelectorAll(
            ".admin-nav-item"
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


    text(
        "adminPageTitle",
        pageConfig[
            page
        ].title
    );


    text(
        "adminPageSubtitle",
        pageConfig[
            page
        ].subtitle
    );


    state.currentPage =
        page;


    if(
        page === "network"
    ){

        setTimeout(
            () => {

                initFullMap();

            },
            100
        );

    }


    if(
        page === "dashboard"
    ){

        setTimeout(
            () => {

                initDashboardMap();

            },
            100
        );

    }


    $("adminSidebar")
        ?.classList.remove(
            "open"
        );


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation(){

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target.closest(
                    "[data-page], [data-page-go]"
                );


            if(!target){
                return;
            }


            const page =
                target.dataset.page ||
                target.dataset.pageGo;


            if(!page){
                return;
            }


            event.preventDefault();


            showPage(
                page
            );

        }
    );

}


/* =========================================================
   MAP DATA
========================================================= */

const hubData = {

    Pune:{
        lat:18.5204,
        lng:73.8567,
        code:"P",
        active:"06 active"
    },

    Mumbai:{
        lat:19.0760,
        lng:72.8777,
        code:"M",
        active:"04 active"
    },

    Nagpur:{
        lat:21.1458,
        lng:79.0882,
        code:"N",
        active:"03 active"
    },

    Delhi:{
        lat:28.6139,
        lng:77.2090,
        code:"D",
        active:"Destination"
    }

};


const vehicleData = [

    {

        id:"MH12-TR-4581",
        driver:"Rahul Patil",
        route:"Pune → Delhi",
        status:"ACTIVE",
        health:"96%",
        fuel:"82%",
        speed:"64 km/h",
        color:"green",

        points:[
            [18.5204,73.8567],
            [20.5937,76.0128],
            [22.3072,77.3360],
            [25.3176,77.4126],
            [28.6139,77.2090]
        ]

    },

    {

        id:"MH46-CT-7823",
        driver:"Suresh More",
        route:"Nagpur → Delhi",
        status:"ACTIVE",
        health:"91%",
        fuel:"71%",
        speed:"58 km/h",
        color:"green",

        points:[
            [21.1458,79.0882],
            [22.3000,78.4500],
            [24.2000,78.1000],
            [26.5000,77.7000],
            [28.6139,77.2090]
        ]

    },

    {

        id:"MH14-VN-2264",
        driver:"Amit Sharma",
        route:"Mumbai → Pune",
        status:"READY",
        health:"98%",
        fuel:"94%",
        speed:"0 km/h",
        color:"purple",

        points:[
            [19.0760,72.8777],
            [18.9500,73.2500],
            [18.7000,73.6000],
            [18.5204,73.8567]
        ]

    },

    {

        id:"MH15-MT-1198",
        driver:"Kiran Jadhav",
        route:"Jalgaon → Pune",
        status:"SERVICE",
        health:"64%",
        fuel:"41%",
        speed:"0 km/h",
        color:"danger",

        points:[
            [21.0077,75.5626],
            [20.6000,75.9000],
            [19.9000,76.5000],
            [18.9500,75.9000],
            [18.5204,73.8567]
        ]

    }

];


/* =========================================================
   MAP ICONS
========================================================= */

function createHubIcon(
    code,
    name,
    active
){

    return L.divIcon({

        className:
            "tx-map-icon",

        html:

            `
            <div class="tx-hub-marker">
                ${escapeHTML(code)}
            </div>

            <div class="tx-hub-label">

                ${escapeHTML(name)}

                <small>
                    ${escapeHTML(active)}
                </small>

            </div>
            `,

        iconSize:[
            120,
            50
        ],

        iconAnchor:[
            9,
            9
        ]

    });

}


function createVehicleIcon(
    vehicle
){

    const danger =
        vehicle.color ===
        "danger";


    return L.divIcon({

        className:
            "tx-map-vehicle",

        html:

            `
            <div class="tx-vehicle-wrap">

                <div class="tx-vehicle-marker">

                    <span class="tx-wheel-a"></span>

                    <span class="tx-wheel-b"></span>

                    <i class="
                        tx-vehicle-live
                        ${danger ? "danger" : ""}
                    "></i>

                </div>

                <div class="tx-vehicle-label">

                    ${escapeHTML(
                        vehicle.id
                    )}

                    <small>
                        ${escapeHTML(
                            vehicle.status
                        )}
                    </small>

                </div>

            </div>
            `,

        iconSize:[
            160,
            58
        ],

        iconAnchor:[
            26,
            26
        ]

    });

}


/* =========================================================
   VEHICLE POPUP
========================================================= */

function vehiclePopup(
    vehicle
){

    return `

        <div class="vehicle-popup">

            <strong>
                ${escapeHTML(
                    vehicle.id
                )}
            </strong>

            <span>
                ${escapeHTML(
                    vehicle.route
                )}
            </span>

            <div class="vehicle-popup-grid">

                <div>
                    <small>DRIVER</small>
                    <b>
                        ${escapeHTML(
                            vehicle.driver
                        )}
                    </b>
                </div>

                <div>
                    <small>STATUS</small>
                    <b>
                        ${escapeHTML(
                            vehicle.status
                        )}
                    </b>
                </div>

                <div>
                    <small>HEALTH</small>
                    <b>
                        ${escapeHTML(
                            vehicle.health
                        )}
                    </b>
                </div>

                <div>
                    <small>FUEL</small>
                    <b>
                        ${escapeHTML(
                            vehicle.fuel
                        )}
                    </b>
                </div>

                <div>
                    <small>SPEED</small>
                    <b>
                        ${escapeHTML(
                            vehicle.speed
                        )}
                    </b>
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   ROUTE STYLE
========================================================= */

function routeStyle(
    color
){

    if(
        color ===
        "danger"
    ){

        return {

            color:
                "#dc5061",

            weight:
                4,

            opacity:
                .58,

            dashArray:
                "7 9"

        };

    }


    if(
        color ===
        "purple"
    ){

        return {

            color:
                "#7657c7",

            weight:
                4,

            opacity:
                .55,

            dashArray:
                "8 10"

        };

    }


    return {

        color:
            "#20a679",

        weight:
            4,

        opacity:
            .52,

        dashArray:
            "8 10"

    };

}


/* =========================================================
   CREATE MAP
========================================================= */

function createMap(
    elementId
){

    if(
        !$(elementId) ||
        typeof L ===
        "undefined"
    ){

        return null;

    }


    if(
        state.maps[elementId]
    ){

        setTimeout(
            () => {

                state.maps[
                    elementId
                ].invalidateSize();

            },
            120
        );

        return state.maps[
            elementId
        ];

    }


    const map =
        L.map(
            elementId,
            {
                zoomControl:true,
                attributionControl:true
            }
        );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom:19,

            attribution:
                '&copy; OpenStreetMap contributors'

        }

    ).addTo(map);


    map.setView(
        [21.2,76.5],
        5
    );


    state.maps[
        elementId
    ] =
        map;


    return map;

}


/* =========================================================
   ADD HUBS
========================================================= */

function addHubs(
    map
){

    Object.entries(
        hubData
    )
        .forEach(
            ([name,hub]) => {

                L.marker(

                    [
                        hub.lat,
                        hub.lng
                    ],

                    {
                        icon:
                            createHubIcon(
                                hub.code,
                                name,
                                hub.active
                            )
                    }

                )
                    .addTo(map)

                    .bindTooltip(

                        `${name} · ${hub.active}`,

                        {
                            direction:
                                "top"
                        }

                    );

            }
        );

}


/* =========================================================
   ADD ROUTES
========================================================= */

function addRoutes(
    map
){

    vehicleData.forEach(
        vehicle => {

            L.polyline(
                vehicle.points,
                routeStyle(
                    vehicle.color
                )
            ).addTo(map);

        }
    );

}


/* =========================================================
   ADD VEHICLES
========================================================= */

function addVehicles(
    map
){

    vehicleData.forEach(
        vehicle => {

            const marker =
                L.marker(

                    vehicle.points[0],

                    {
                        icon:
                            createVehicleIcon(
                                vehicle
                            ),

                        zIndexOffset:
                            500

                    }

                ).addTo(map);


            marker.bindPopup(
                vehiclePopup(
                    vehicle
                ),
                {
                    maxWidth:
                        320
                }
            );


            marker.on(
                "click",
                () => {

                    state.selectedVehicle =
                        vehicle.id;


                    showToast(

                        "Vehicle selected",

                        `${vehicle.id} · ${vehicle.route}`,

                        vehicle.color ===
                        "danger"

                            ? "error"

                            : "success"

                    );

                }
            );


            vehicle.marker =
                marker;

        }
    );

}


/* =========================================================
   MAP INITIALIZER
========================================================= */

function initializeMap(
    elementId
){

    if(
        typeof L ===
        "undefined"
    ){

        console.error(
            "Leaflet failed to load."
        );

        return;

    }


    const map =
        createMap(
            elementId
        );


    if(!map){
        return;
    }


    if(
        map._txInitialized
    ){

        return;

    }


    map._txInitialized =
        true;


    addHubs(
        map
    );


    addRoutes(
        map
    );


    addVehicles(
        map
    );


    setTimeout(
        () => {

            map.invalidateSize();

        },
        150
    );


    startVehicleAnimation();

}


function initDashboardMap(){

    initializeMap(
        "networkMap"
    );

}


function initFullMap(){

    initializeMap(
        "fullNetworkMap"
    );


}


/* =========================================================
   VEHICLE ANIMATION
========================================================= */

let vehicleAnimationRunning =
    false;


function startVehicleAnimation(){

    if(
        vehicleAnimationRunning
    ){

        return;

    }


    vehicleAnimationRunning =
        true;


    function move(){

        vehicleData.forEach(
            vehicle => {

                if(

                    !vehicle.marker ||

                    vehicle.points.length < 2 ||

                    vehicle.status ===
                    "SERVICE"

                ){

                    return;

                }


                if(
                    typeof vehicle.progress !==
                    "number"
                ){

                    vehicle.progress =
                        0;

                }


                vehicle.progress +=
                    .0025;


                if(
                    vehicle.progress >
                    vehicle.points.length - 1
                ){

                    vehicle.progress =
                        0;

                }


                const index =
                    Math.floor(
                        vehicle.progress
                    );


                const local =
                    vehicle.progress -
                    index;


                const from =
                    vehicle.points[
                        index
                    ];


                const to =
                    vehicle.points[
                        Math.min(
                            index + 1,
                            vehicle.points.length - 1
                        )
                    ];


                const lat =
                    from[0] +
                    (
                        to[0] -
                        from[0]
                    ) *
                    local;


                const lng =
                    from[1] +
                    (
                        to[1] -
                        from[1]
                    ) *
                    local;


                vehicle.marker
                    .setLatLng(
                        [
                            lat,
                            lng
                        ]
                    );

            }
        );


        requestAnimationFrame(
            move
        );

    }


    requestAnimationFrame(
        move
    );

}


/* =========================================================
   MAP VEHICLE DATA UPDATE
========================================================= */

function updateMapVehicleData(){

    const active =
        state.shipments.filter(
            isActive
        );


    if(
        active.length &&
        vehicleData[0]
    ){

        const shipment =
            active[0];


        vehicleData[0].route =
            `${shipment.origin || "Pune"} → ${shipment.destination || "Delhi"}`;

    }

}


/* =========================================================
   SHIPMENT TABLE
========================================================= */

function renderShipmentTable(
    list
){

    const table =
        $("shipmentTable");


    if(!table){
        return;
    }


    if(
        !Array.isArray(list) ||
        !list.length
    ){

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:70px;
                        color:#687588;
                    "
                >

                    No shipment records found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =

        list.map(
            item => {

                const customer =
                    item.customerName ||
                    item.receiverName ||
                    item.senderName ||
                    "-";


                return `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    item.trackingNumber
                                )}
                            </strong>

                        </td>


                        <td>

                            ${escapeHTML(
                                item.origin
                            )}

                            <span
                                style="
                                    color:#8a6bd1;
                                    margin:0 5px;
                                "
                            >
                                →
                            </span>

                            ${escapeHTML(
                                item.destination
                            )}

                        </td>


                        <td>
                            ${escapeHTML(
                                customer
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                item.shipmentType
                            )}
                        </td>


                        <td>

                            <span
                                class="${stateClass(
                                    item.status
                                )}"
                            >

                                ${escapeHTML(
                                    item.status
                                )}

                            </span>

                        </td>


                        <td>

                            ${Number(
                                item.weight || 0
                            ).toFixed(1)}

                            kg

                        </td>


                        <td>

                            <div
                                class="shipment-actions"
                            >

                                <button
                                    type="button"
                                    class="
                                        shipment-action
                                        view
                                    "
                                    data-shipment-action="view"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                >
                                    View
                                </button>


                                <button
                                    type="button"
                                    class="
                                        shipment-action
                                        edit
                                    "
                                    data-shipment-action="edit"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="
                                        shipment-action
                                        delete
                                    "
                                    data-shipment-action="delete"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


/* =========================================================
   TABLE EVENTS
========================================================= */

function setupShipmentTable(){

    $("shipmentTable")
        ?.addEventListener(

            "click",

            async event => {

                const button =
                    event.target.closest(
                        "[data-shipment-action]"
                    );


                if(!button){
                    return;
                }


                const id =
                    button.dataset.id;


                const action =
                    button.dataset.shipmentAction;


                const shipment =
                    state.shipments.find(
                        item =>
                            String(
                                item.id
                            ) ===
                            String(
                                id
                            )
                    );


                if(!shipment){
                    return;
                }


                if(
                    action === "view"
                ){

                    openShipmentModal(
                        shipment
                    );

                    return;

                }


                if(
                    action === "edit"
                ){

                    openEditShipmentModal(
                        shipment
                    );

                    return;

                }


                if(
                    action === "delete"
                ){

                    await deleteShipment(
                        shipment
                    );

                }

            }

        );

}


/* =========================================================
   SHIPMENT FILTER
========================================================= */

function setupShipmentFilters(){

    const search =
        $("shipmentSearch");


    const filter =
        $("shipmentStatusFilter");


    function applyFilter(){

        const query =
            normalize(
                search?.value
            );


        const status =
            normalize(
                filter?.value
            );


        const filtered =
            state.shipments.filter(

                item => {

                    const searchable = [

                        item.trackingNumber,

                        item.origin,

                        item.destination,

                        item.senderName,

                        item.receiverName,

                        item.customerName,

                        item.shipmentType,

                        item.status

                    ]
                        .join(" ")
                        .toLowerCase();


                    return (

                        (
                            !query ||
                            searchable.includes(
                                query
                            )
                        )

                        &&

                        (
                            !status ||
                            normalize(
                                item.status
                            ) ===
                            status
                        )

                    );

                }

            );


        renderShipmentTable(
            filtered
        );

    }


    search?.addEventListener(
        "input",
        applyFilter
    );


    filter?.addEventListener(
        "change",
        applyFilter
    );

}


/* =========================================================
   VIEW SHIPMENT
========================================================= */

function openShipmentModal(
    item
){

    openModal(

        "Shipment Details",

        `

            <div class="shipment-detail-modal">

                <div
                    style="
                        display:grid;
                        gap:7px;
                    "
                >

                    <span
                        style="
                            color:#7658b7;
                            font-size:8px;
                            font-weight:950;
                        "
                    >
                        TRACKING NUMBER
                    </span>


                    <h3
                        style="
                            margin:0;
                            color:#18263a;
                            font-size:30px;
                        "
                    >

                        ${escapeHTML(
                            item.trackingNumber
                        )}

                    </h3>


                    <p
                        style="
                            margin:0;
                            color:#718095;
                            font-size:11px;
                        "
                    >

                        ${escapeHTML(
                            item.origin
                        )}

                        →

                        ${escapeHTML(
                            item.destination
                        )}

                    </p>

                </div>


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(2,1fr);
                        gap:10px;
                    "
                >

                    ${infoBox(
                        "STATUS",
                        item.status
                    )}

                    ${infoBox(
                        "CUSTOMER",
                        item.customerName ||
                        item.receiverName ||
                        "-"
                    )}

                    ${infoBox(
                        "TYPE",
                        item.shipmentType
                    )}

                    ${infoBox(
                        "WEIGHT",
                        `${item.weight ?? 0} kg`
                    )}

                    ${infoBox(
                        "SENDER",
                        item.senderName
                    )}

                    ${infoBox(
                        "RECEIVER",
                        item.receiverName
                    )}

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        padding-top:15px;
                        border-top:
                            1px solid #e6ebf0;
                    "
                >

                    <button
                        class="outline-btn"
                        id="viewEditBtn"
                    >
                        Edit
                    </button>


                    <button
                        class="primary-btn"
                        id="viewCloseBtn"
                    >
                        Close
                    </button>

                </div>

            </div>

        `

    );


    $("viewCloseBtn")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("viewEditBtn")
        ?.addEventListener(
            "click",
            () => {

                closeModal();

                openEditShipmentModal(
                    item
                );

            }
        );

}


/* =========================================================
   INFO BOX
========================================================= */

function infoBox(
    label,
    value
){

    return `

        <div
            style="
                padding:13px;
                border:
                    1px solid #dfe5eb;
                border-radius:9px;
                background:#f8fafc;
            "
        >

            <span
                style="
                    display:block;
                    color:#758195;
                    font-size:7px;
                    font-weight:950;
                "
            >

                ${escapeHTML(
                    label
                )}

            </span>


            <strong
                style="
                    display:block;
                    margin-top:6px;
                    color:#263448;
                    font-size:10px;
                "
            >

                ${escapeHTML(
                    value
                )}

            </strong>

        </div>

    `;

}


/* =========================================================
   FORM FIELD
========================================================= */

function formField(
    name,
    label,
    value,
    placeholder,
    type = "text",
    required = true
){

    return `

        <label>

            <span class="form-label">
                ${escapeHTML(
                    label
                )}
            </span>

            <input
                class="form-control"
                name="${escapeHTML(name)}"
                type="${escapeHTML(type)}"
                value="${escapeHTML(value)}"
                placeholder="${escapeHTML(placeholder)}"
                ${
                    type === "number"
                        ? 'min="0" step="0.1"'
                        : ""
                }
                ${
                    required
                        ? "required"
                        : ""
                }
            >

        </label>

    `;

}


/* =========================================================
   CREATE SHIPMENT
========================================================= */

function setupCreateShipment(){

    $("createShipmentBtn")
        ?.addEventListener(
            "click",
            openCreateShipmentModal
        );

}


function openCreateShipmentModal(){

    openModal(

        "Create Shipment",

        `

            <form
                id="createShipmentForm"
                class="shipment-form-grid"
            >

                ${formField(
                    "trackingNumber",
                    "TRACKING NUMBER",
                    "",
                    "TRX10007",
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


                <label>

                    <span class="form-label">
                        SHIPMENT TYPE
                    </span>

                    <select
                        name="shipmentType"
                        class="form-control"
                        required
                    >

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

                        <option value="Cold-chain">
                            Cold-chain
                        </option>

                        <option value="International">
                            International
                        </option>

                    </select>

                </label>


                ${formField(
                    "weight",
                    "WEIGHT KG",
                    "",
                    "5",
                    "number"
                )}


                <label
                    style="
                        grid-column:1/-1;
                    "
                >

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


                <div
                    class="
                        shipment-form-actions
                    "
                >

                    <button
                        type="button"
                        class="outline-btn"
                        id="cancelCreate"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Create Shipment
                    </button>

                </div>

            </form>

        `

    );


    $("cancelCreate")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("createShipmentForm")
        ?.addEventListener(
            "submit",
            submitShipment
        );

}


/* =========================================================
   SUBMIT CREATE
========================================================= */

async function submitShipment(
    event
){

    event.preventDefault();


    const form =
        event.currentTarget;


    const data =
        new FormData(
            form
        );


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
            ),

        status:
            String(
                data.get(
                    "status"
                )
            ),

        weight:
            Number(
                data.get(
                    "weight"
                )
            )

    };


    if(
        !payload.trackingNumber ||
        !payload.senderName ||
        !payload.receiverName ||
        !payload.origin ||
        !payload.destination ||
        !payload.shipmentType ||
        !payload.weight
    ){

        showToast(
            "Validation error",
            "Please fill all shipment fields.",
            "error"
        );

        return;

    }


    try{

        if(
            state.demoMode
        ){

            state.shipments.push({

                id:
                    Date.now(),

                ...payload

            });


            closeModal();


            refreshAfterMutation();


            showPage(
                "shipments"
            );


            showToast(
                "Shipment created",
                `${payload.trackingNumber} added locally.`,
                "success"
            );


            return;

        }


        await api(

            "/api/shipments",

            {

                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    )

            }

        );


        closeModal();


        await loadShipments();


        showPage(
            "shipments"
        );


        showToast(
            "Shipment created",
            `${payload.trackingNumber} created successfully.`,
            "success"
        );

    }

    catch(error){

        showToast(
            "Create failed",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   EDIT SHIPMENT
========================================================= */

function openEditShipmentModal(
    item
){

    openModal(

        "Edit Shipment",

        `

            <form
                id="editShipmentForm"
                class="shipment-form-grid"
            >

                <input
                    type="hidden"
                    name="id"
                    value="${escapeHTML(item.id)}"
                >


                ${formField(
                    "trackingNumber",
                    "TRACKING NUMBER",
                    item.trackingNumber || "",
                    "TRX10007",
                    "text"
                )}


                ${formField(
                    "senderName",
                    "SENDER NAME",
                    item.senderName || "",
                    "Sender name",
                    "text"
                )}


                ${formField(
                    "receiverName",
                    "RECEIVER NAME",
                    item.receiverName || "",
                    "Receiver name",
                    "text"
                )}


                ${formField(
                    "origin",
                    "ORIGIN",
                    item.origin || "",
                    "Pune",
                    "text"
                )}


                ${formField(
                    "destination",
                    "DESTINATION",
                    item.destination || "",
                    "Delhi",
                    "text"
                )}


                <label>

                    <span class="form-label">
                        SHIPMENT TYPE
                    </span>

                    <select
                        name="shipmentType"
                        class="form-control"
                        required
                    >

                        ${shipmentTypeOption(
                            "Express",
                            item.shipmentType
                        )}

                        ${shipmentTypeOption(
                            "Standard",
                            item.shipmentType
                        )}

                        ${shipmentTypeOption(
                            "Freight",
                            item.shipmentType
                        )}

                        ${shipmentTypeOption(
                            "Courier",
                            item.shipmentType
                        )}

                        ${shipmentTypeOption(
                            "Cold-chain",
                            item.shipmentType
                        )}

                        ${shipmentTypeOption(
                            "International",
                            item.shipmentType
                        )}

                    </select>

                </label>


                ${formField(
                    "weight",
                    "WEIGHT KG",
                    item.weight ?? "",
                    "5",
                    "number"
                )}


                <label
                    style="
                        grid-column:1/-1;
                    "
                >

                    <span class="form-label">
                        STATUS
                    </span>

                    <select
                        name="status"
                        class="form-control"
                        required
                    >

                        ${statusOption(
                            "Pending",
                            item.status
                        )}

                        ${statusOption(
                            "In Transit",
                            item.status
                        )}

                        ${statusOption(
                            "Out for Delivery",
                            item.status
                        )}

                        ${statusOption(
                            "Delivered",
                            item.status
                        )}

                    </select>

                </label>


                <div
                    class="
                        shipment-form-actions
                    "
                >

                    <button
                        type="button"
                        class="outline-btn"
                        id="cancelEdit"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Update Shipment
                    </button>

                </div>

            </form>

        `

    );


    $("cancelEdit")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("editShipmentForm")
        ?.addEventListener(
            "submit",
            event => {

                submitEditShipment(
                    event,
                    item
                );

            }
        );

}


/* =========================================================
   SELECT OPTION HELPERS
========================================================= */

function shipmentTypeOption(
    value,
    selected
){

    return `

        <option
            value="${escapeHTML(value)}"
            ${
                normalize(value) ===
                normalize(selected)
                    ? "selected"
                    : ""
            }
        >

            ${escapeHTML(value)}

        </option>

    `;

}


function statusOption(
    value,
    selected
){

    return `

        <option
            value="${escapeHTML(value)}"
            ${
                normalize(value) ===
                normalize(selected)
                    ? "selected"
                    : ""
            }
        >

            ${escapeHTML(value)}

        </option>

    `;

}


/* =========================================================
   UPDATE SHIPMENT
========================================================= */

async function submitEditShipment(
    event,
    originalItem
){

    event.preventDefault();


    const form =
        event.currentTarget;


    const data =
        new FormData(
            form
        );


    const id =
        data.get(
            "id"
        );


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
            ),

        status:
            String(
                data.get(
                    "status"
                )
            ),

        weight:
            Number(
                data.get(
                    "weight"
                )
            )

    };


    if(
        !id
    ){

        showToast(
            "Update failed",
            "Shipment ID not found.",
            "error"
        );

        return;

    }


    if(
        !payload.trackingNumber ||
        !payload.senderName ||
        !payload.receiverName ||
        !payload.origin ||
        !payload.destination ||
        !payload.shipmentType ||
        Number.isNaN(
            payload.weight
        )
    ){

        showToast(
            "Validation error",
            "Please enter valid shipment information.",
            "error"
        );

        return;

    }


    try{

        /* -----------------------------------------
           DEMO MODE
        ----------------------------------------- */

        if(
            state.demoMode
        ){

            const index =
                state.shipments.findIndex(
                    shipment =>
                        String(
                            shipment.id
                        ) ===
                        String(
                            id
                        )
                );


            if(
                index === -1
            ){

                throw new Error(
                    "Shipment not found."
                );

            }


            state.shipments[
                index
            ] = {

                ...state.shipments[
                    index
                ],

                ...payload,

                id:
                    state.shipments[
                        index
                    ].id

            };


            closeModal();


            refreshAfterMutation();


            showPage(
                "shipments"
            );


            showToast(
                "Shipment updated",
                `${payload.trackingNumber} updated locally.`,
                "success"
            );


            return;

        }


        /* -----------------------------------------
           REAL BACKEND UPDATE
        ----------------------------------------- */

        await api(

            `/api/shipments/${encodeURIComponent(id)}`,

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


        showPage(
            "shipments"
        );


        showToast(
            "Shipment updated",
            `${payload.trackingNumber} updated successfully.`,
            "success"
        );

    }

    catch(error){

        showToast(
            "Update failed",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   DELETE SHIPMENT
========================================================= */

async function deleteShipment(
    item
){

    const tracking =
        item.trackingNumber ||
        "this shipment";


    const confirmed =
        window.confirm(

            `Delete shipment ${tracking}?\n\n` +

            `This action will permanently remove the shipment record.`

        );


    if(!confirmed){

        return;

    }


    try{

        /* -----------------------------------------
           DEMO MODE
        ----------------------------------------- */

        if(
            state.demoMode
        ){

            state.shipments =
                state.shipments.filter(
                    shipment =>
                        String(
                            shipment.id
                        ) !==
                        String(
                            item.id
                        )
                );


            refreshAfterMutation();


            showToast(
                "Shipment deleted",
                `${tracking} removed locally.`,
                "success"
            );


            return;

        }


        /* -----------------------------------------
           BACKEND DELETE
        ----------------------------------------- */

        await api(

            `/api/shipments/${encodeURIComponent(item.id)}`,

            {

                method:
                    "DELETE"

            }

        );


        await loadShipments();


        showToast(
            "Shipment deleted",
            `${tracking} deleted successfully.`,
            "success"
        );

    }

    catch(error){

        showToast(
            "Delete failed",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   LOCAL REFRESH
========================================================= */

function refreshAfterMutation(){

    updateStats();

    renderShipmentTable(
        state.shipments
    );

    updateMapVehicleData();

}


/* =========================================================
   STATUS UPDATE
========================================================= */

/*
   This uses the existing PUT endpoint instead of a PATCH
   endpoint so it works with your controller:

   PUT /api/shipments/{id}
*/

async function changeStatus(
    item,
    newStatus
){

    if(!item){
        return;
    }


    try{

        const updatedPayload = {

            trackingNumber:
                item.trackingNumber,

            senderName:
                item.senderName,

            receiverName:
                item.receiverName,

            origin:
                item.origin,

            destination:
                item.destination,

            shipmentType:
                item.shipmentType,

            status:
                newStatus,

            weight:
                Number(
                    item.weight || 0
                )

        };


        if(
            state.demoMode
        ){

            item.status =
                newStatus;


            refreshAfterMutation();


            showToast(
                "Status updated",
                `${item.trackingNumber} → ${newStatus}`,
                "success"
            );


            return;

        }


        await api(

            `/api/shipments/${encodeURIComponent(item.id)}`,

            {

                method:
                    "PUT",

                body:
                    JSON.stringify(
                        updatedPayload
                    )

            }

        );


        await loadShipments();


        showToast(
            "Status updated",
            `${item.trackingNumber} → ${newStatus}`,
            "success"
        );

    }

    catch(error){

        showToast(
            "Status update failed",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   QUICK STATUS MODAL
========================================================= */

function openStatusModal(
    item
){

    openModal(

        "Update Shipment Status",

        `

            <div
                style="
                    display:grid;
                    gap:15px;
                "
            >

                <div>

                    <span
                        style="
                            display:block;
                            color:#7658b7;
                            font-size:7px;
                            font-weight:950;
                        "
                    >
                        TRACKING
                    </span>


                    <strong
                        style="
                            display:block;
                            margin-top:6px;
                            color:#18263a;
                            font-size:24px;
                        "
                    >

                        ${escapeHTML(
                            item.trackingNumber
                        )}

                    </strong>

                </div>


                <label>

                    <span class="form-label">
                        SELECT STATUS
                    </span>

                    <select
                        id="quickStatusValue"
                        class="form-control"
                    >

                        ${statusOption(
                            "Pending",
                            item.status
                        )}

                        ${statusOption(
                            "In Transit",
                            item.status
                        )}

                        ${statusOption(
                            "Out for Delivery",
                            item.status
                        )}

                        ${statusOption(
                            "Delivered",
                            item.status
                        )}

                    </select>

                </label>


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        padding-top:14px;
                        border-top:1px solid #e6ebf0;
                    "
                >

                    <button
                        class="outline-btn"
                        id="quickStatusCancel"
                    >
                        Cancel
                    </button>


                    <button
                        class="primary-btn"
                        id="quickStatusSave"
                    >
                        Update Status
                    </button>

                </div>

            </div>

        `

    );


    $("quickStatusCancel")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("quickStatusSave")
        ?.addEventListener(
            "click",
            async () => {

                const value =
                    $("quickStatusValue")
                        ?.value;


                if(!value){
                    return;
                }


                closeModal();


                await changeStatus(
                    item,
                    value
                );

            }
        );

}


/* =========================================================
   EXCEPTION
========================================================= */

function setupExceptions(){

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target.closest(
                    "[data-exception]"
                );


            if(!target){
                return;
            }


            event.preventDefault();


            openExceptionModal(
                target.dataset.exception
            );

        }
    );

}


function openExceptionModal(
    vehicle
){

    const data = {

        "MH15-MT-1198":{

            priority:
                "P1 · CRITICAL",

            title:
                "Vehicle service required",

            health:
                "64%",

            fuel:
                "41%",

            driver:
                "Kiran Jadhav",

            route:
                "Jalgaon → Pune"

        },

        "MH46-CT-7823":{

            priority:
                "P2 · HIGH",

            title:
                "Fuel watch triggered",

            health:
                "91%",

            fuel:
                "71%",

            driver:
                "Suresh More",

            route:
                "Nagpur → Delhi"

        }

    };


    const item =
        data[
            vehicle
        ] ||
        {

            priority:
                "ACTION REQUIRED",

            title:
                "Operational issue",

            health:
                "-",

            fuel:
                "-",

            driver:
                "-",

            route:
                "-"

        };


    openModal(

        "Operational Exception",

        `

            <div
                style="
                    display:grid;
                    gap:14px;
                "
            >

                <strong
                    style="
                        color:#dc5061;
                        font-size:11px;
                    "
                >

                    ${escapeHTML(
                        item.priority
                    )}

                </strong>


                <h3
                    style="
                        margin:0;
                        color:#1d2b3f;
                        font-size:27px;
                    "
                >

                    ${escapeHTML(
                        vehicle
                    )}

                </h3>


                <p
                    style="
                        margin:0;
                        color:#707c8f;
                        font-size:10px;
                    "
                >

                    ${escapeHTML(
                        item.title
                    )}

                </p>


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            1fr 1fr;
                        gap:8px;
                    "
                >

                    ${infoBox(
                        "HEALTH",
                        item.health
                    )}

                    ${infoBox(
                        "FUEL",
                        item.fuel
                    )}

                    ${infoBox(
                        "DRIVER",
                        item.driver
                    )}

                    ${infoBox(
                        "ROUTE",
                        item.route
                    )}

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:7px;
                    "
                >

                    <button
                        class="outline-btn"
                        id="exceptionFleetBtn"
                    >
                        Open Fleet
                    </button>


                    <button
                        class="primary-btn"
                        id="resolveExceptionBtn"
                    >
                        Resolve
                    </button>

                </div>

            </div>

        `

    );


    $("exceptionFleetBtn")
        ?.addEventListener(
            "click",
            () => {

                closeModal();

                showPage(
                    "fleet"
                );

            }
        );


    $("resolveExceptionBtn")
        ?.addEventListener(
            "click",
            () => {

                closeModal();

                showToast(
                    "Resolution queued",
                    `${vehicle} moved to operations queue.`,
                    "success"
                );

            }
        );

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

function setupGlobalSearch(){

    const input =
        $("adminGlobalSearch");


    input?.addEventListener(
        "keydown",
        event => {

            if(
                event.key !==
                "Enter"
            ){

                return;

            }


            const query =
                normalize(
                    input.value
                );


            if(!query){
                return;
            }


            const item =
                state.shipments.find(

                    shipment => {

                        const searchable = [

                            shipment.trackingNumber,

                            shipment.origin,

                            shipment.destination,

                            shipment.senderName,

                            shipment.receiverName,

                            shipment.customerName,

                            shipment.shipmentType,

                            shipment.status

                        ]
                            .join(" ")
                            .toLowerCase();


                        return searchable.includes(
                            query
                        );

                    }

                );


            if(item){

                openShipmentModal(
                    item
                );

            }

            else{

                showToast(
                    "No result",
                    "No matching shipment found.",
                    "error"
                );

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if(

                (
                    event.ctrlKey ||
                    event.metaKey
                )

                &&

                event.key.toLowerCase() ===
                "k"

            ){

                event.preventDefault();


                input?.focus();

            }

        }
    );

}


/* =========================================================
   REFRESH
========================================================= */

function setupRefresh(){

    $("adminRefresh")
        ?.addEventListener(
            "click",
            async () => {

                try{

                    await loadShipments();


                    showToast(
                        "Network refreshed",
                        "Latest shipment data loaded.",
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

            }
        );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotification(){

    $("adminNotification")
        ?.addEventListener(
            "click",
            () => {

                openModal(

                    "Operational Alerts",

                    `

                        <div
                            style="
                                display:grid;
                                gap:8px;
                            "
                        >

                            ${infoBox(
                                "P1",
                                "MH15-MT-1198 service required"
                            )}

                            ${infoBox(
                                "P2",
                                "MH46-CT-7823 fuel watch"
                            )}

                            ${infoBox(
                                "SLA",
                                "3 shipments approaching threshold"
                            )}

                        </div>

                    `

                );

            }
        );

}


/* =========================================================
   CSV EXPORT
========================================================= */

function setupExport(){

    $("exportShipments")
        ?.addEventListener(
            "click",
            () => {

                if(
                    !state.shipments.length
                ){

                    showToast(
                        "Nothing to export",
                        "No shipment data available.",
                        "error"
                    );

                    return;

                }


                const headers = [

                    "Tracking",
                    "Origin",
                    "Destination",
                    "Customer",
                    "Type",
                    "Status",
                    "Weight"

                ];


                const rows =
                    state.shipments.map(
                        item => {

                            const customer =
                                item.customerName ||
                                item.receiverName ||
                                item.senderName ||
                                "";


                            return [

                                item.trackingNumber,
                                item.origin,
                                item.destination,
                                customer,
                                item.shipmentType,
                                item.status,
                                item.weight

                            ]
                                .map(
                                    value =>
                                        `"${String(
                                            value ?? ""
                                        )
                                            .replaceAll(
                                                '"',
                                                '""'
                                            )}"`
                                )
                                .join(",");

                        }
                    );


                const csv =
                    [

                        headers.join(","),

                        ...rows

                    ].join("\n");


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
                    "translogix-shipments.csv";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );


                showToast(
                    "CSV exported",
                    "Shipment report created successfully.",
                    "success"
                );

            }
        );

}


/* =========================================================
   REPORT
========================================================= */

function setupReportButton(){

    $("reportShipmentBtn")
        ?.addEventListener(
            "click",
            () => {

                const headers = [

                    "Tracking",
                    "Origin",
                    "Destination",
                    "Status",
                    "Weight"

                ];


                const rows =
                    state.shipments.map(
                        item => [

                            item.trackingNumber,
                            item.origin,
                            item.destination,
                            item.status,
                            item.weight

                        ]
                    );


                const csv = [

                    headers.join(","),

                    ...rows.map(
                        row =>
                            row
                                .map(
                                    value =>
                                        `"${String(
                                            value ?? ""
                                        )
                                            .replaceAll(
                                                '"',
                                                '""'
                                            )}"`
                                )
                                .join(",")
                    )

                ].join("\n");


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
                    "translogix-operational-report.csv";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );


                showToast(
                    "Report generated",
                    "Operational shipment report downloaded.",
                    "success"
                );

            }
        );

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupActions(){

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if(!button){
                return;
            }


            const action =
                button.dataset.action;


            const messages = {

                track:[
                    "Live tracking",
                    "Vehicle tracking workspace opened."
                ],

                contact:[
                    "Contact dispatcher",
                    "Dispatcher contact workflow opened."
                ],

                reassign:[
                    "Reassignment",
                    "Vehicle reassignment workflow opened."
                ],

                details:[
                    "Telemetry details",
                    "Detailed telemetry workspace opened."
                ],

                "configure-alerts":[
                    "Alert rules",
                    "Alert configuration workspace opened."
                ],

                maintenance:[
                    "Maintenance",
                    "Maintenance schedule opened."
                ],

                "generate-report":[
                    "Report started",
                    "Operational report generation started."
                ],

                assignment:[
                    "Assignment queue",
                    "Assignment control opened."
                ]

            };


            if(
                action ===
                "assignment"
            ){

                showPage(
                    "assignments"
                );

            }


            const result =
                messages[action];


            if(result){

                showToast(
                    result[0],
                    result[1],
                    "success"
                );

            }

        }
    );

}


/* =========================================================
   MOBILE
========================================================= */

function setupMobileMenu(){

    $("adminMenu")
        ?.addEventListener(
            "click",
            () => {

                $("adminSidebar")
                    ?.classList.toggle(
                        "open"
                    );

            }
        );

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
    title,
    content
){

    text(
        "modalTitle",
        title
    );


    const body =
        $("modalContent");


    if(body){

        body.innerHTML =
            content;

    }


    $("adminModal")
        ?.classList.remove(
            "hidden"
        );

}


function closeModal(){

    $("adminModal")
        ?.classList.add(
            "hidden"
        );

}


function setupModal(){

    $("adminModalClose")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("adminModal")
        ?.addEventListener(
            "click",
            event => {

                if(
                    event.target ===
                    event.currentTarget
                ){

                    closeModal();

                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key ===
                "Escape"
            ){

                closeModal();

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout(){

    $("adminLogout")
        ?.addEventListener(
            "click",
            () => {

                localStorage.clear();

                window.location.href =
                    "./login.html";

            }
        );

}


/* =========================================================
   ADD VEHICLE
========================================================= */

function setupAddVehicle(){

    $("addVehicleBtn")
        ?.addEventListener(
            "click",
            () => {

                openModal(

                    "Add Vehicle",

                    `

                        <div
                            style="
                                display:grid;
                                gap:10px;
                            "
                        >

                            ${infoBox(
                                "VEHICLE TYPE",
                                "Heavy Transit Truck"
                            )}

                            ${infoBox(
                                "READY QUEUE",
                                "03 vehicles"
                            )}

                            <button
                                class="primary-btn"
                                id="registerVehicle"
                            >

                                Open Vehicle Registration

                            </button>

                        </div>

                    `

                );


                $("registerVehicle")
                    ?.addEventListener(
                        "click",
                        () => {

                            closeModal();


                            showToast(
                                "Vehicle registration",
                                "Vehicle registration workspace opened.",
                                "success"
                            );

                        }
                    );

            }
        );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    type = "success"
){

    document
        .querySelectorAll(
            ".tx-admin-toast"
        )
        .forEach(
            item =>
                item.remove()
        );


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `tx-admin-toast ${type}`;


    toast.innerHTML = `

        <strong>
            ${escapeHTML(title)}
        </strong>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3200
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initAdmin(){

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


    await loadShipments();


    initDashboardMap();


    console.log(
        "TRANSLOGIX ADMIN CONTROL TOWER READY"
    );

}


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