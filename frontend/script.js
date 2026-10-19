// ============================================================
// SMART EMERGENCY RESPONSE SYSTEM
// FRONTEND DEMO / SIMULATION
// ============================================================


// ============================================================
// DATA
// ============================================================

// Simulated ambulance fleet
let ambulances = [
    { id: "AMB-01", location: "ISBT", status: "Available" },
    { id: "AMB-02", location: "Clock Tower", status: "Available" },
    { id: "AMB-03", location: "Rajpur Road", status: "Busy" },
    { id: "AMB-04", location: "Patel Nagar", status: "Available" },
    { id: "AMB-05", location: "Prem Nagar", status: "Available" },
    { id: "AMB-06", location: "ISBT", status: "Available" },
    { id: "AMB-07", location: "Clock Tower", status: "Available" },
    { id: "AMB-08", location: "Rajpur Road", status: "Available" },
    { id: "AMB-09", location: "Patel Nagar", status: "Available" },
    { id: "AMB-10", location: "Prem Nagar", status: "Available" }
];


// Every vehicle reported by the C++ backend (ambulance, fire truck, ...)
let vehicles = [];


// Registered emergencies
let emergencies = [
    { id: "101", type: "Road Accident", location: "Clock Tower", severity: 5, status: "Pending" },
    { id: "102", type: "Medical Emergency", location: "Patel Nagar", severity: 4, status: "Pending" },
    { id: "103", type: "Vehicle Collision", location: "Prem Nagar", severity: 3, status: "Dispatched" }
];


// Currently selected emergency
let selectedEmergency = null;


// Currently calculated route
let selectedRoute = null;


// ============================================================
// GRAPH
// ============================================================

// This represents the same type of weighted graph
// used in your C++ Graph / Dijkstra module.

const graph = {

    "ISBT": [
        { node: "Clock Tower", weight: 4 },
        { node: "Patel Nagar", weight: 5 }
    ],

    "Clock Tower": [
        { node: "ISBT", weight: 4 },
        { node: "Rajpur Road", weight: 3 },
        { node: "Patel Nagar", weight: 6 }
    ],

    "Rajpur Road": [
        { node: "Clock Tower", weight: 3 },
        { node: "Hospital", weight: 5 }
    ],

    "Patel Nagar": [
        { node: "ISBT", weight: 5 },
        { node: "Clock Tower", weight: 6 },
        { node: "Prem Nagar", weight: 4 }
    ],

    "Prem Nagar": [
        { node: "Patel Nagar", weight: 4 },
        { node: "Hospital", weight: 6 }
    ],

    "Hospital": [
        { node: "Rajpur Road", weight: 5 },
        { node: "Prem Nagar", weight: 6 }
    ]
};


// ============================================================
// OPEN DASHBOARD
// ============================================================

function openDashboard() {

    const welcome =
        document.getElementById("welcomeScreen");

    const dashboard =
        document.getElementById("dashboard");

    welcome.style.opacity = "0";

    setTimeout(() => {

        welcome.classList.add("hidden");

        dashboard.classList.remove("hidden");

        renderAmbulances();

        renderPriorityQueue();
        updateDashboard();

        populateAmbulanceSelect();

        rankAmbulances();

    }, 350);
}


// ============================================================
// RETURN HOME
// ============================================================

function returnHome() {

    const welcome =
        document.getElementById("welcomeScreen");

    const dashboard =
        document.getElementById("dashboard");

    dashboard.classList.add("hidden");

    welcome.classList.remove("hidden");

    setTimeout(() => {

        welcome.style.opacity = "1";

    }, 50);
}


// ============================================================
// RENDER AMBULANCES
// ============================================================

function renderAmbulances() {

    const container =
        document.getElementById("ambulanceList");

    if (!container) return;

    container.innerHTML = "";

    ambulances.forEach(ambulance => {

        const card =
            document.createElement("div");

        card.className = "ambulance-card";

        const statusClass =
            ambulance.status === "Available"
                ? "available"
                : "busy";

        card.innerHTML = `

            <div class="ambulance-top">

                <strong>
                    🚑 ${ambulance.id}
                </strong>

                <span class="status ${statusClass}">
                    ${ambulance.status}
                </span>

            </div>

            <div class="ambulance-location">
                📍 ${ambulance.location}
            </div>

        `;

        container.appendChild(card);

    });
}


// ============================================================
// UPDATE DASHBOARD
// ============================================================

function updateDashboard() {

    const emergencyCount =
        document.getElementById("emergencyCount");

    const availableCount =
        document.getElementById("availableCount");

    const priorityDisplay =
        document.getElementById("priorityDisplay");

    const routeDistance =
        document.getElementById("routeDistance");


    if (emergencyCount) {

        emergencyCount.textContent =
            emergencies.length;

    }


    if (availableCount) {

        availableCount.textContent =
            ambulances.filter(
                ambulance =>
                    ambulance.status === "Available"
            ).length;

    }


    if (priorityDisplay) {

        if (emergencies.length === 0) {

            priorityDisplay.textContent = "--";

        } else {

            const highest =
                [...emergencies].sort(
                    (a, b) =>
                        b.severity - a.severity
                )[0];

            priorityDisplay.textContent =
                highest.severity;
        }
    }


    if (routeDistance) {

        if (selectedRoute &&
            selectedRoute.reachable) {

            routeDistance.textContent =
                selectedRoute.distance + " km";

        } else {

            routeDistance.textContent = "--";

        }

    }
}


// ============================================================
// REGISTER EMERGENCY
// ============================================================

function registerEmergency() {

    const id =
        document.getElementById("emergencyId")
            .value.trim();

    const type =
        document.getElementById("emergencyType")
            .value;

    const location =
        document.getElementById("emergencyLocation")
            .value;

    const severity =
        Number(
            document.getElementById("severity")
                .value
        );


    // Validation

    if (id === "") {

        alert("Please enter Emergency ID.");

        return;
    }


    // Duplicate ID check

    const duplicate =
        emergencies.some(
            emergency =>
                emergency.id === id
        );

    if (duplicate) {

        alert(
            "Emergency ID already exists."
        );

        return;
    }


    // Create emergency

    const emergency = {

        id: id,

        type: type,

        location: location,

        severity: severity,

        status: "Pending"

    };


    emergencies.push(emergency);


    // Clear ID field

    document.getElementById("emergencyId")
        .value = "";


    // Update interface

    renderPriorityQueue();

    updateDashboard();


    const notice = document.getElementById("dispatchMessage");
    if (notice) notice.textContent = `Emergency ${id} registered. Ranking available ambulances by shortest route…`;

}


// ============================================================
// PRIORITY QUEUE
// ============================================================

function renderPriorityQueue() {

    const queue =
        document.getElementById("priorityQueue");

    if (!queue) return;


    if (emergencies.length === 0) {

        queue.innerHTML = `
            <div class="empty-state">
                No pending emergencies
            </div>
        `;

        return;
    }


    // Highest severity first

    const sorted =
        [...emergencies].sort(
            (a, b) =>
                b.severity - a.severity
        );


    queue.innerHTML = "";


    sorted.forEach((emergency, index) => {

        const item =
            document.createElement("div");

        item.style.padding = "12px";

        item.style.marginBottom = "8px";

        item.style.border =
            "1px solid #e1ebe4";

        item.style.borderRadius = "10px";

        item.style.background = "#f8fcf9";


        item.innerHTML = `

            <strong>
                #${index + 1}
                ${emergency.id}
            </strong>

            <br>

            <small>
                ${emergency.type}
                |
                ${emergency.location}
            </small>

            <br>

            <small>
                Severity:
                <strong>
                    ${emergency.severityLevel ? emergency.severityLevel + " (" + emergency.severity + ")" : emergency.severity}
                </strong>
            </small>

            ${emergency.fromApi ? `
            <br>
            <small>Status: ${emergency.status}${emergency.requiredResource ? " | Needs: " + emergency.requiredResource : ""}</small>
            ` : ""}

            ${emergency.fromApi && emergency.status === "Resource Assigned" ? `
            <br>
            <button class="outline-btn" style="margin-top:8px"
                onclick="resolveEmergency('${emergency.id}')">
                ✔ Mark Resolved
            </button>
            ` : ""}

        `;


        queue.appendChild(item);

    });

}


// ============================================================
// FIND LOCATION
// ============================================================

function findLocation(location) {

    const locations = Object.keys(graph);

    return locations.includes(location);

}


// ============================================================
// DIJKSTRA
// ============================================================

function dijkstra(source, destination) {

    if (!findLocation(source) ||
        !findLocation(destination)) {

        return {

            distance: 0,

            path: [],

            reachable: false

        };

    }


    const distances = {};

    const previous = {};

    const visited = new Set();


    const locations =
        Object.keys(graph);


    locations.forEach(location => {

        distances[location] =
            Infinity;

        previous[location] =
            null;

    });


    distances[source] = 0;


    while (visited.size < locations.length) {

        let current = null;

        let smallestDistance =
            Infinity;


        // Find minimum-distance node

        for (const location of locations) {

            if (
                !visited.has(location) &&
                distances[location] <
                smallestDistance
            ) {

                smallestDistance =
                    distances[location];

                current =
                    location;

            }

        }


        // No more reachable nodes

        if (current === null) {

            break;

        }


        visited.add(current);


        // Destination reached

        if (current === destination) {

            break;

        }


        // Relax edges

        for (const edge of graph[current]) {

            const newDistance =
                distances[current] +
                edge.weight;


            if (
                newDistance <
                distances[edge.node]
            ) {

                distances[edge.node] =
                    newDistance;

                previous[edge.node] =
                    current;

            }

        }

    }


    // Destination unreachable

    if (distances[destination] === Infinity) {

        return {

            distance: 0,

            path: [],

            reachable: false

        };

    }


    // Reconstruct path

    const path = [];

    let current = destination;


    while (current !== null) {

        path.push(current);

        current =
            previous[current];

    }


    path.reverse();


    return {

        distance:
            distances[destination],

        path: path,

        reachable: true

    };

}


// ============================================================
// POPULATE AMBULANCE SELECT
// ============================================================

function populateAmbulanceSelect() {

    const select =
        document.getElementById(
            "ambulanceSelect"
        );

    if (!select) return;


    select.innerHTML = "";


    ambulances.forEach(ambulance => {

        if (ambulance.status === "Available") {

            const option =
                document.createElement("option");

            option.value =
                ambulance.id;

            option.textContent =
                `${ambulance.id} — ${ambulance.location}`;

            select.appendChild(option);

        }

    });


    if (select.options.length === 0) {

        const option =
            document.createElement("option");

        option.textContent =
            "No ambulance available";

        option.disabled = true;

        select.appendChild(option);

    }

}


// ============================================================
// GET AMBULANCE
// ============================================================

function getAmbulance(id) {

    return ambulances.find(
        ambulance =>
            ambulance.id === id
    ) || vehicles.find(
        vehicle =>
            String(vehicle.id) === String(id)
    );

}


// ============================================================
// RANK AMBULANCES
// ============================================================

function rankAmbulances() {

    if (ambulances.length === 0) {

        return;

    }


    // If an emergency exists,
    // calculate distance to its location.

    let target = null;


    if (emergencies.length > 0) {

        target =
            [...emergencies].sort(
                (a, b) =>
                    b.severity - a.severity
            )[0];

    }


    const routes = [];


    ambulances.forEach(ambulance => {

        if (ambulance.status !== "Available") {

            return;

        }


        if (target) {

            const route =
                dijkstra(
                    ambulance.location,
                    target.location
                );


            routes.push({

                ambulanceID:
                    ambulance.id,

                route:
                    route

            });

        }

    });


    // Sort available ambulances
    // according to shortest distance.

    routes.sort(
        (a, b) => {

            if (!a.route.reachable)
                return 1;

            if (!b.route.reachable)
                return -1;

            return (
                a.route.distance -
                b.route.distance
            );

        }
    );


    renderRankedAmbulances(routes);

}


// ============================================================
// DISPLAY SORTED AMBULANCES
// ============================================================

function renderRankedAmbulances(routes) {

    const container =
        document.getElementById(
            "ambulanceList"
        );

    if (!container) return;


    container.innerHTML = "";


    // If no emergency exists,
    // display normal fleet.

    if (routes.length === 0) {

        renderAmbulances();

        return;

    }


    routes.forEach(item => {

        const ambulance =
            getAmbulance(
                item.ambulanceID
            );


        const card =
            document.createElement("div");

        card.className =
            "ambulance-card";


        const statusClass =
            ambulance.status === "Available"
                ? "available"
                : "busy";


        let routeText =
            "No route";


        if (item.route.reachable) {

            routeText =
                item.route.distance +
                " km";

        }


        card.innerHTML = `

            <div class="ambulance-top">

                <strong>
                    🚑 ${ambulance.id}
                </strong>

                <span class="status ${statusClass}">
                    ${ambulance.status}
                </span>

            </div>

            <div class="ambulance-location">

                📍 ${ambulance.location}

            </div>

            <div style="
                margin-top:8px;
                font-size:11px;
                color:#16a34a;
                font-weight:bold;
            ">

                Route Distance:
                ${routeText}

            </div>

        `;


        card.addEventListener("click", () => {
            // Keep the card, dropdown, route result and map on the same ambulance ID.
            window.__selectedAmbulanceId = ambulance.id;
            window.__userPickedAmbulance = true;
            const select = document.getElementById("ambulanceSelect");
            if (select) {
                let option = Array.from(select.options).find(o => o.value === ambulance.id);
                if (!option) {
                    option = document.createElement("option");
                    option.value = ambulance.id;
                    option.textContent = `${ambulance.id} — ${ambulance.location}`;
                    select.appendChild(option);
                }
                select.value = ambulance.id;
            }
            container.querySelectorAll(".ambulance-card").forEach(c => c.classList.remove("selected-ambulance"));
            card.classList.add("selected-ambulance");
            if (typeof updateSelectedAmbulanceRoute === "function") updateSelectedAmbulanceRoute();
            if (typeof updateRealMapRoute === "function") updateRealMapRoute();
            const msg = document.getElementById("dispatchMessage");
            if (msg && selectedEmergency) msg.textContent = `${ambulance.id} selected for emergency ${selectedEmergency.id}. Its route is shown below.`;
        });
        container.appendChild(card);

    });

}


// ============================================================
// CALCULATE ROUTE
// ============================================================

function calculateRoute() {

    const ambulanceID =
        document.getElementById(
            "ambulanceSelect"
        ).value;


    const destination =
        document.getElementById(
            "destinationSelect"
        ).value;


    const ambulance =
        getAmbulance(
            ambulanceID
        );


    if (!ambulance) {

        alert(
            "Please select an available ambulance."
        );

        return;

    }


    if (ambulance.status !== "Available") {

        alert(
            "Selected ambulance is not available."
        );

        return;

    }


    // Dijkstra

    const result =
        dijkstra(
            ambulance.location,
            destination
        );


    selectedRoute = result;


    const resultBox =
        document.getElementById(
            "routeResult"
        );


    const distanceText =
        document.getElementById(
            "routeDistanceText"
        );


    const pathBox =
        document.getElementById(
            "routePath"
        );


    if (!result.reachable) {

        resultBox.classList.remove("hidden");

        distanceText.textContent =
            "No route";

        pathBox.innerHTML =
            `<span style="color:#dc2626">
                No route available
            </span>`;


        updateDashboard();

        return;

    }


    // Display distance

    distanceText.textContent =
        result.distance + " km";


    // Display actual path

    pathBox.innerHTML = "";


    result.path.forEach(
        (location, index) => {

            const node =
                document.createElement("span");

            node.className =
                "path-node";

            node.textContent =
                location;


            pathBox.appendChild(node);


            if (
                index <
                result.path.length - 1
            ) {

                const arrow =
                    document.createElement("span");

                arrow.className =
                    "path-arrow";

                arrow.textContent =
                    "→";


                pathBox.appendChild(
                    arrow
                );

            }

        }
    );


    resultBox.classList.remove(
        "hidden"
    );


    updateDashboard();


    document.getElementById(
        "dispatchMessage"
    ).textContent =
        `${ambulance.id} is ready. Route calculated: ${result.distance} km.`;

}


// ============================================================
// DISPATCH AMBULANCE
// ============================================================

function dispatchAmbulance() {

    const ambulanceID =
        document.getElementById(
            "ambulanceSelect"
        ).value;


    const ambulance =
        getAmbulance(
            ambulanceID
        );


    if (!ambulance) {

        alert(
            "Please select an ambulance."
        );

        return;

    }


    if (!selectedRoute ||
        !selectedRoute.reachable) {

        alert(
            "Please calculate a valid route first."
        );

        return;

    }


    // Change ambulance status

    ambulance.status =
        "Busy";


    // If there is a pending emergency,
    // mark highest priority one as dispatched.

    if (emergencies.length > 0) {

        const highest =
            [...emergencies].sort(
                (a, b) =>
                    b.severity - a.severity
            )[0];


        highest.status =
            "Dispatched";


        selectedEmergency =
            highest;

    }


    // Update UI

    renderAmbulances();

    updateDashboard();

    populateAmbulanceSelect();


    document.getElementById(
        "dispatchMessage"
    ).textContent =
        `${ambulance.id} dispatched successfully. Route distance: ${selectedRoute.distance} km.`;


    alert(
        `${ambulance.id} has been dispatched!`
    );


    // Clear route after dispatch

    selectedRoute = null;

    document.getElementById(
        "routeDistance"
    ).textContent = "--";

}


// ============================================================
// INITIAL STATE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const welcome =
            document.getElementById(
                "welcomeScreen"
            );

        if (welcome) {

            welcome.style.opacity = "1";

        }

    }
);

// ============================================================
// C++ API INTEGRATION
// The backend uses integer emergency IDs (101, 102...), existing C++
// Graph/Dijkstra + RouteUtils, and SQLite. Start backend before enabling.
const SAFEROUTE_API = "/api";   // same origin as the Express server
let apiAvailable = false;
let apiEmergencyId = null;
let apiSelectedAmbulance = null;
let apiHospitalRoute = null;

async function saferouteApi(path, options = {}) {
    const response = await fetch(`${SAFEROUTE_API}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `API error ${response.status}`);
    return payload;
}

function normalizeEmergencyId(raw) {
    const match = String(raw).trim().match(/(\d+)/);
    return match ? Number(match[1]) : NaN;
}

async function loadBackendState() {
    try {
        const state = await saferouteApi("/state");
        apiAvailable = true;
        ambulances = state.ambulances.map(a => ({id:a.id, location:a.location, status:a.status}));
        vehicles = state.resources.map(r => ({id:r.id, type:r.type, location:r.location, status:r.status}));
        // Resolved emergencies leave the dashboard.
        emergencies = state.emergencies.filter(e => e.status !== "Resolved").map(e => ({
            id:String(e.id), type:e.type, location:e.location,
            severity:Number(e.severity), severityLevel:e.severityLevel,
            status:e.status, requiredResource:e.requiredResource,
            assignedResourceId:e.assignedResourceId, fromApi:true
        }));
        // Use the C++ priority queue (heap) order. The later severity sorts
        // are stable, so ties keep the order the heap decided.
        try {
            const q = await saferouteApi("/queue");
            const rank = id => {
                const i = q.queue.findIndex(item => String(item.id) === id);
                return i === -1 ? Infinity : i;
            };
            emergencies.sort((a, b) => {
                const ra = rank(a.id), rb = rank(b.id);
                return ra === rb ? 0 : ra < rb ? -1 : 1;
            });
        } catch (queueError) {
            console.warn("Could not read C++ priority queue", queueError);
        }
        renderVehicleFleet();
        renderPriorityQueue();
        updateDashboard();
        populateAmbulanceSelect();
        const pending = emergencies.filter(e => e.status === "Pending")
            .sort((a,b)=>b.severity-a.severity)[0];
        if (pending) {
            apiEmergencyId = Number(pending.id);
            await refreshBackendRanking(apiEmergencyId);
        } else {
            apiEmergencyId = null;
            apiSelectedAmbulance = null;
            selectedRoute = null;
            const activeRouteDisplay = document.getElementById("routeDistance");
            if (activeRouteDisplay) activeRouteDisplay.textContent = "--";
            renderVehicleFleet();
            const btn = document.getElementById("dispatchBtn");
            if (btn) btn.textContent = "Dispatch Vehicle";
        }
        return true;
    } catch (error) {
        apiAvailable = false;
        console.warn("C++ backend not connected; keeping original frontend simulation.", error);
        return false;
    }
}

const RESOURCE_ICONS = {
    "Ambulance": "🚑",
    "Fire Truck": "🚒",
    "Police Vehicle": "🚓",
    "Rescue Team": "🛟"
};

function resourceIcon(type) {
    return RESOURCE_ICONS[type] || "🚨";
}

// Fleet view used when no emergency is waiting: every vehicle, any type.
function renderVehicleFleet() {
    const container = document.getElementById("ambulanceList");
    if (!container) return;
    container.innerHTML = "";
    vehicles.forEach(v => {
        const card = document.createElement("div");
        card.className = "ambulance-card";
        const statusClass = v.status === "Available" ? "available" : "busy";
        card.innerHTML = `
          <div class="ambulance-top"><strong>${resourceIcon(v.type)} ${v.id}</strong>
          <span class="status ${statusClass}">${v.status}</span></div>
          <div class="ambulance-location">${v.type} — 📍 ${v.location}</div>`;
        container.appendChild(card);
    });
}

// Ranked view for one emergency: only vehicles of the type it needs.
async function refreshBackendRanking(emergencyId) {
    if (!apiAvailable || !emergencyId) return;
    try {
        const result = await saferouteApi(`/resources/ranked?emergencyId=${encodeURIComponent(emergencyId)}`);
        const required = result.requiredResource || "Ambulance";
        apiHospitalRoute = result.hospitalRoute;
        const container = document.getElementById("ambulanceList");
        container.innerHTML = "";

        const stillValid = result.resources.some(r => String(r.id) === String(apiSelectedAmbulance));
        if (!stillValid) {
            apiSelectedAmbulance = result.resources.length ? result.resources[0].id : null;
        }

        if (!result.resources.length) {
            container.innerHTML = `<p style="padding:12px;color:#b91c1c;font-weight:bold">
              No ${required} is available. Mark an active emergency as resolved to free one.</p>`;
        }

        result.resources.forEach(a => {
            const card = document.createElement("div");
            card.className = "ambulance-card" + (a.id === apiSelectedAmbulance ? " selected-ambulance" : "");
            card.innerHTML = `
              <div class="ambulance-top"><strong>${resourceIcon(a.type)} ${a.id}</strong>
              <span class="status available">Available</span></div>
              <div class="ambulance-location">${a.type} — 📍 ${a.location}</div>
              <div style="margin-top:8px;font-size:12px;color:#15803d;font-weight:bold">
                Shortest route: ${a.route.reachable ? a.route.distance + " km" : "No route"}
              </div>
              <div style="margin-top:5px;font-size:11px;color:#64748b">
                ${a.route.reachable ? a.route.path.join(" → ") : "No reachable path"}
              </div>`;
            card.addEventListener("click", () => {
                apiSelectedAmbulance = a.id;
                const select = document.getElementById("ambulanceSelect");
                if (select) select.value = a.id;
                refreshBackendRanking(emergencyId);
                const msg = document.getElementById("dispatchMessage");
                if (msg) msg.textContent = `${a.id} (${a.type}) selected. Route to emergency: ${a.route.distance} km. Click Dispatch to confirm.`;
                if (typeof updateRealMapRoute === "function") setTimeout(updateRealMapRoute, 80);
            });
            container.appendChild(card);
        });

        // Route box: hospital leg for medical calls, otherwise the selected
        // vehicle's route to the emergency.
        const selected = result.resources.find(r => String(r.id) === String(apiSelectedAmbulance));
        // Keep the dashboard's Active Route card synchronized with the
        // selected vehicle's route to this emergency (not the hospital leg).
        selectedRoute = selected ? selected.route : null;
        const shown = selected ? selected.route : result.hospitalRoute;
        if (shown) {
            const box = document.getElementById("routeResult");
            const distance = document.getElementById("routeDistanceText");
            const path = document.getElementById("routePath");
            if (box && distance && path) {
                box.classList.remove("hidden");
                distance.textContent = shown.reachable ? `${shown.distance} km` : "No route";
                path.textContent = shown.reachable ? shown.path.join(" → ") : "No route available";
            }
        }

        // The dropdown lists the vehicles that can answer THIS emergency.
        const select = document.getElementById("ambulanceSelect");
        if (select) {
            select.innerHTML = "";
            result.resources.forEach(r => {
                const option = document.createElement("option");
                option.value = r.id;
                option.textContent = `${r.id} — ${r.type} — ${r.location}`;
                select.appendChild(option);
            });
            if (!result.resources.length) {
                const option = document.createElement("option");
                option.textContent = `No ${required} available`;
                option.disabled = true;
                select.appendChild(option);
            }
            if (apiSelectedAmbulance) select.value = apiSelectedAmbulance;
        }

        const btn = document.getElementById("dispatchBtn");
        if (btn) btn.textContent = `Dispatch ${required} → Emergency ${emergencyId}`;
        updateDashboard();
        if (typeof updateRealMapRoute === "function") {
            setTimeout(updateRealMapRoute, 80);
        }
    } catch (error) {
        alert(`Could not calculate routes from C++ backend: ${error.message}`);
    }
}

// Close an emergency; the C++ backend frees the vehicle that was handling it.
async function resolveEmergency(id) {
    try {
        const result = await saferouteApi("/emergencies/resolve", {
            method: "POST",
            body: JSON.stringify({ emergencyId: Number(id) })
        });
        apiSelectedAmbulance = null;
        await loadBackendState();
        const msg = document.getElementById("dispatchMessage");
        if (msg) {
            msg.textContent = result.releasedResourceId
                ? `Emergency ${id} resolved. Vehicle ${result.releasedResourceId} is available again.`
                : `Emergency ${id} resolved.`;
        }
    } catch (error) {
        alert(`Could not resolve emergency: ${error.message}`);
    }
}

// Override registration: use the backend when it is running; otherwise retain simulation.
const originalRegisterEmergency = registerEmergency;
registerEmergency = async function() {
    if (!apiAvailable) {
        const ok = await loadBackendState();
        if (!ok) { originalRegisterEmergency(); return; }
    }
    const rawId = document.getElementById("emergencyId").value.trim();
    const id = normalizeEmergencyId(rawId);
    const type = document.getElementById("emergencyType").value;
    const location = document.getElementById("emergencyLocation").value;
    const severity = Number(document.getElementById("severity").value);
    if (!Number.isInteger(id) || id <= 0) {
        alert("Enter a numeric emergency ID, e.g. 101 or E-101.");
        return;
    }
    try {
        const created = await saferouteApi("/emergencies", {
            method: "POST",
            body: JSON.stringify({id, type, location, severity, peopleAffected:1, injurySeverity:severity*2, riskLevel:severity*2})
        });
        apiEmergencyId = id;
        apiSelectedAmbulance = null;
        document.getElementById("emergencyId").value = "";
        // loadBackendState picks the highest-priority pending emergency (the
        // head of the C++ priority queue) and ranks vehicles for it, so the
        // panel and the Dispatch button always refer to the same emergency.
        await loadBackendState();
        triggerEmergencyAlert(type);
        const notice = document.getElementById("dispatchMessage");
        if (notice) {
            notice.textContent = apiEmergencyId === id
                ? `Emergency ${id} registered. Vehicles ranked by shortest route.`
                : `Emergency ${id} registered and queued. Emergency ${apiEmergencyId} has higher priority, so it is dispatched first.`;
        }
    } catch (error) {
        alert(`Backend registration failed: ${error.message}`);
    }
};

// Dispatch the ambulance explicitly selected by the user.
const originalDispatchAmbulance = dispatchAmbulance;
dispatchAmbulance = async function() {
    if (!apiAvailable) {
        const ok = await loadBackendState();
        if (!ok) { originalDispatchAmbulance(); return; }
    }
    const select = document.getElementById("ambulanceSelect");
    const ambulanceId = apiSelectedAmbulance || (select && select.value);
    if (!apiEmergencyId) {
        alert("Register or select a pending emergency first.");
        return;
    }
    if (!ambulanceId) {
        alert("Click an available ambulance card to select it first.");
        return;
    }
    try {
        const result = await saferouteApi("/dispatch", {
            method:"POST",
            body:JSON.stringify({emergencyId:apiEmergencyId, ambulanceId})
        });
        document.getElementById("dispatchMessage").textContent =
            `${result.message} Route distance: ${result.distance} km.`;
        apiSelectedAmbulance = null;
        await loadBackendState();
        alert(result.message);
    } catch (error) {
        alert(`Dispatch failed: ${error.message}`);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const start = document.querySelector(".start-btn");
    if (start) start.addEventListener("click", () => { setTimeout(loadBackendState, 400); });
});



// Short, type-specific emergency alert: animated on-screen siren + distinct synthesized sound.
function triggerEmergencyAlert(emergencyType) {
    const type = emergencyType || document.getElementById("emergencyType")?.value || "Accident";
    const list = document.getElementById("ambulanceList");
    if (list) {
        list.classList.remove("emergency-flash");
        void list.offsetWidth;
        list.classList.add("emergency-flash");
        setTimeout(() => list.classList.remove("emergency-flash"), 1700);
    }

    // Create/reuse a compact overlay; it disappears automatically after ~1.7 seconds.
    let popup = document.getElementById("emergencySirenPopup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "emergencySirenPopup";
        popup.setAttribute("role", "status");
        popup.setAttribute("aria-live", "assertive");
        document.body.appendChild(popup);
    }
    const icon = type === "Fire" ? "🔥" : type === "Cardiac Emergency" ? "💓" : type === "Medical Emergency" ? "🚑" : "🚨";
    popup.innerHTML = `<span class="siren-light left"></span><span class="siren-emoji">${icon}</span><span class="siren-copy"><strong>${type} registered</strong><small>Emergency response activated</small></span><span class="siren-light right"></span>`;
    popup.classList.remove("siren-popup-show");
    void popup.offsetWidth;
    popup.classList.add("siren-popup-show");
    clearTimeout(window.safeRouteSirenPopupTimer);
    window.safeRouteSirenPopupTimer = setTimeout(() => popup.classList.remove("siren-popup-show"), 1700);

    // Each emergency type has a distinct short alert pattern. Audio starts after a user
    // interaction (the Register button), so browsers are more likely to permit playback.
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = 0.07;
        master.connect(ctx.destination);
        const now = ctx.currentTime;
        const patterns = {
            "Accident": { wave: "sawtooth", notes: [740, 980, 740, 980, 740, 980], step: 0.19, duration: 1.25 },
            "Cardiac Emergency": { wave: "sine", notes: [1040, 680, 1040, 680], step: 0.22, duration: 1.15 },
            "Medical Emergency": { wave: "triangle", notes: [660, 880, 990, 880], step: 0.24, duration: 1.25 },
            "Fire": { wave: "square", notes: [880, 880, 660, 660, 880, 880], step: 0.16, duration: 1.2 }
        };
        const pattern = patterns[type] || patterns["Accident"];
        pattern.notes.forEach((frequency, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = pattern.wave;
            osc.frequency.setValueAtTime(frequency, now + i * pattern.step);
            gain.gain.setValueAtTime(0.0001, now + i * pattern.step);
            gain.gain.exponentialRampToValueAtTime(0.65, now + i * pattern.step + 0.025);
            gain.gain.setValueAtTime(0.65, now + i * pattern.step + pattern.step * 0.62);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * pattern.step + pattern.step * 0.82);
            osc.connect(gain);
            gain.connect(master);
            osc.start(now + i * pattern.step);
            osc.stop(now + i * pattern.step + pattern.step * 0.86);
        });
        setTimeout(() => ctx.close().catch(() => {}), 1800);
    } catch (e) { console.debug("Emergency sound unavailable", e); }
}

// ============================================================
// PROTOTYPE FALLBACK FIX: automatic route calculation + dispatch
// This makes the frontend-only demo work even before the C++ API
// is started. It uses the existing simulated graph, NOT live GPS.
// ============================================================
const registerEmergencyWithApiOrSimulation = registerEmergency;
registerEmergency = async function() {
    const beforeCount = emergencies.length;
    await registerEmergencyWithApiOrSimulation();
    // If API mode is offline, original frontend registration is used.
    if (!apiAvailable && emergencies.length > beforeCount) {
        triggerEmergencyAlert(document.getElementById("emergencyType")?.value);
        selectedEmergency = [...emergencies].filter(e => e.status === 'Pending')
            .sort((a,b) => Number(b.severity) - Number(a.severity))[0] || emergencies[emergencies.length - 1];
        rankAmbulances();
        showHospitalRouteForSelectedEmergency();
        updateDispatchReadyMessage();
    }
};

function showHospitalRouteForSelectedEmergency() {
    // Keep the existing result panel focused on the currently selected ambulance's
    // route TO the emergency. Hospital routing remains separate and is summarized
    // in the map panel when available.
    const resultBox = document.getElementById('routeResult');
    const distanceText = document.getElementById('routeDistanceText');
    const pathBox = document.getElementById('routePath');
    if (!resultBox || !distanceText || !pathBox || !selectedEmergency) return;
    const select = document.getElementById('ambulanceSelect');
    const ambulance = getAmbulance(select?.value || '');
    if (!ambulance) return;
    const route = dijkstra(ambulance.location, selectedEmergency.location);
    resultBox.classList.remove('hidden');
    distanceText.textContent = route.reachable ? `${route.distance} km` : 'No route';
    pathBox.textContent = route.reachable
        ? `${ambulance.id}: ${route.path.join(' → ')}`
        : 'No route available';
    selectedRoute = route;
    selectedHospitalRoute = dijkstra(selectedEmergency.location, 'Hospital');
}
let selectedHospitalRoute = null;

function updateSelectedAmbulanceRoute() {
    const select = document.getElementById('ambulanceSelect');
    if (!select || !select.value || !selectedEmergency) return;
    window.__userPickedAmbulance = true;
    showHospitalRouteForSelectedEmergency();
    const selectedId = select.value;
    const list = document.getElementById('ambulanceList');
    if (list) list.querySelectorAll('.ambulance-card').forEach(card => {
        card.classList.toggle('selected-ambulance', card.querySelector('.ambulance-top strong')?.textContent.includes(selectedId));
    });
    if (typeof updateRealMapRoute === 'function') updateRealMapRoute();
}

function updateDispatchReadyMessage() {
    const message = document.getElementById('dispatchMessage');
    if (!message) return;
    if (!selectedEmergency) {
        message.textContent = 'Register an emergency to automatically rank available ambulances.';
        return;
    }
    message.textContent = `Emergency ${selectedEmergency.id} at ${selectedEmergency.location}: available ambulances ranked by shortest route. Choose an ambulance card, then dispatch.`;
}

// Re-rank for the currently selected/highest-priority emergency.
const originalRankAmbulances = rankAmbulances;
rankAmbulances = function() {
    if (emergencies.length) {
        selectedEmergency = [...emergencies].filter(e => e.status === 'Pending')
            .sort((a,b) => Number(b.severity) - Number(a.severity))[0] || selectedEmergency;
    }
    if (!selectedEmergency) {
        originalRankAmbulances();
        return;
    }
    const routes = ambulances.filter(a => a.status === 'Available').map(a => ({
        ambulanceID: a.id,
        route: dijkstra(a.location, selectedEmergency.location)
    }));
    routes.sort((a,b) => {
        if (!a.route.reachable && !b.route.reachable) return 0;
        if (!a.route.reachable) return 1;
        if (!b.route.reachable) return -1;
        return a.route.distance - b.route.distance;
    });
    renderRankedAmbulances(routes);
    // Keep the dropdown/map synchronized with the first (shortest-route) result.
    const select = document.getElementById('ambulanceSelect');
    if (select && routes.length && !select.value) select.value = routes[0].ambulanceID;
    if (select && routes.length && !window.__userPickedAmbulance) select.value = routes[0].ambulanceID;
    const selectedId = select ? select.value : (routes[0] && routes[0].ambulanceID);
    const list = document.getElementById('ambulanceList');
    if (list && selectedId) {
        list.querySelectorAll('.ambulance-card').forEach(card => {
            card.classList.toggle('selected-ambulance', card.querySelector('.ambulance-top strong')?.textContent.includes(selectedId));
        });
    }
    if (typeof showHospitalRouteForSelectedEmergency === 'function') showHospitalRouteForSelectedEmergency();
    if (typeof updateRealMapRoute === 'function') setTimeout(updateRealMapRoute, 80);
};

// Dispatch does not require the old manual Calculate Route button.
const dispatchWithApiOrSimulation = dispatchAmbulance;
dispatchAmbulance = async function() {
    if (apiAvailable) {
        await dispatchWithApiOrSimulation();
        return;
    }
    if (!selectedEmergency) {
        selectedEmergency = [...emergencies].filter(e => e.status === 'Pending')
            .sort((a,b) => Number(b.severity) - Number(a.severity))[0] || null;
    }
    if (!selectedEmergency) {
        alert('Register an emergency first.');
        return;
    }
    const select = document.getElementById('ambulanceSelect');
    const selectedAmbulanceId = (select && select.value) || window.__selectedAmbulanceId || '';
    const ambulance = getAmbulance(selectedAmbulanceId);
    if (!ambulance || String(ambulance.status).toLowerCase() !== 'available') {
        alert('Choose an available ambulance.');
        return;
    }
    // Automatically calculate ambulance -> emergency route at dispatch time.
    const ambulanceRoute = dijkstra(ambulance.location, selectedEmergency.location);
    if (!ambulanceRoute.reachable) {
        alert('No route exists between this ambulance and the emergency.');
        return;
    }
    selectedRoute = ambulanceRoute;
    ambulance.status = 'Busy';
    selectedEmergency.status = 'Dispatched';
    renderAmbulances();
    updateDashboard();
    populateAmbulanceSelect();
    showHospitalRouteForSelectedEmergency();
    const msg = document.getElementById('dispatchMessage');
    if (msg) msg.textContent = `${ambulance.id} dispatched to emergency ${selectedEmergency.id}. Route: ${ambulanceRoute.path.join(' → ')} (${ambulanceRoute.distance} km). Hospital route: ${selectedHospitalRoute && selectedHospitalRoute.reachable ? selectedHospitalRoute.distance + ' km' : 'unavailable'}.`;
    alert(`${ambulance.id} dispatched in the prototype. Simulated distance: ${ambulanceRoute.distance} km.`);
    selectedRoute = null;
    rankAmbulances();
};

// When an emergency is selected from the priority queue, update routes too.
document.addEventListener('click', event => {
    const item = event.target.closest('[data-emergency-id]');
    if (!item) return;
    const found = emergencies.find(e => String(e.id) === item.dataset.emergencyId);
    if (found) {
        selectedEmergency = found;
        rankAmbulances();
        showHospitalRouteForSelectedEmergency();
        updateDispatchReadyMessage();
    }
});


// ============================================================
// REAL MAP LAYER (OpenStreetMap + Nominatim + Overpass + OSRM)
// No Google API key required for this prototype.
// IMPORTANT: ambulance GPS is NOT fabricated. Existing fleet nodes
// are shown as prototype bases until each ambulance sends GPS updates.
// ============================================================
let realMap = null;
let realMapReady = false;
let realUserMarker = null;
let realEmergencyMarker = null;
let realAmbulanceMarkers = [];
let realHospitalMarkers = [];
let realRouteLayer = null;
let realHospitalRouteLayer = null;
let realHospitalData = [];
let realGeocodeCache = {};
let realMapCurrentOrigin = null;
let realMapSelectedAmbulance = null;
let realUserCoords = null;
let realGpsWatchId = null;
const REAL_MAP_CENTER = [30.3165, 78.0322]; // Dehradun city center
const OSM_NODES = {
  "ISBT": "ISBT Dehradun, Uttarakhand, India",
  "Clock Tower": "Clock Tower, Dehradun, Uttarakhand, India",
  "Rajpur Road": "Rajpur Road, Dehradun, Uttarakhand, India",
  "Patel Nagar": "Patel Nagar, Dehradun, Uttarakhand, India",
  "Prem Nagar": "Prem Nagar, Dehradun, Uttarakhand, India"
};
// Approximate Dehradun demo coordinates used only if geocoding is unavailable.
// Replace with verified coordinates or live device GPS for real deployments.
const DEMO_COORDINATES = {
  "ISBT": {lat:30.2874, lon:78.0075, label:"ISBT, Dehradun (demo pin)"},
  "Clock Tower": {lat:30.3256, lon:78.0413, label:"Clock Tower, Dehradun (demo pin)"},
  "Rajpur Road": {lat:30.3560, lon:78.0750, label:"Rajpur Road, Dehradun (demo pin)"},
  "Patel Nagar": {lat:30.3115, lon:78.0120, label:"Patel Nagar, Dehradun (demo pin)"},
  "Prem Nagar": {lat:30.3520, lon:77.9660, label:"Prem Nagar, Dehradun (demo pin)"},
  "Hospital": {lat:30.3165, lon:78.0322, label:"Hospital, Dehradun (demo pin)"}
};
const PROTOTYPE_AMBULANCES = [
  {id:"AMB-01", location:"ISBT", status:"Available"},
  {id:"AMB-02", location:"Clock Tower", status:"Available"},
  {id:"AMB-03", location:"Rajpur Road", status:"Busy"},
  {id:"AMB-04", location:"Patel Nagar", status:"Available"},
  {id:"AMB-05", location:"Prem Nagar", status:"Available"},
  {id:"AMB-06", location:"ISBT", status:"Available"},
  {id:"AMB-07", location:"Clock Tower", status:"Available"},
  {id:"AMB-08", location:"Rajpur Road", status:"Available"},
  {id:"AMB-09", location:"Patel Nagar", status:"Available"},
  {id:"AMB-10", location:"Prem Nagar", status:"Available"}
];

function mapStatus(message, isError=false) {
  const el=document.getElementById("liveMapStatus");
  if(!el) return;
  el.textContent=message;
  el.classList.toggle("error",!!isError);
}
async function geocodePlace(query) {
  if(realGeocodeCache[query]) return realGeocodeCache[query];
  const aliases = {
    "Patel Nagar, Dehradun, Uttarakhand, India": ["Patel Nagar, Dehradun, Uttarakhand, India", "Patel Nagar, Dehradun, India", "Patel Nagar, Dehradun", "Patel Nagar, Uttarakhand, India"],
    "ISBT Dehradun, Uttarakhand, India": ["ISBT Dehradun, Uttarakhand, India", "ISBT Dehradun, India", "Inter State Bus Terminal, Dehradun"],
    "Clock Tower, Dehradun, Uttarakhand, India": ["Clock Tower, Dehradun, Uttarakhand, India", "Ghanta Ghar, Dehradun, India", "Clock Tower, Dehradun, India"],
    "Rajpur Road, Dehradun, Uttarakhand, India": ["Rajpur Road, Dehradun, Uttarakhand, India", "Rajpur Road, Dehradun, India"],
    "Prem Nagar, Dehradun, Uttarakhand, India": ["Prem Nagar, Dehradun, Uttarakhand, India", "Prem Nagar, Dehradun, India"]
  };
  const attempts = aliases[query] || [query, query.replace(", Uttarakhand, India", ", India"), query.replace(", India", "")];
  let lastError = null;
  for (const attempt of [...new Set(attempts)]) {
    try {
      const url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=in&q="+encodeURIComponent(attempt);
      const res=await fetch(url,{headers:{"Accept":"application/json"}});
      if(!res.ok) throw new Error("Geocoding service unavailable");
      const rows=await res.json();
      if(rows.length) {
        // Never silently route to a similarly named place outside Dehradun.
        const localRow = rows.find(r => /dehradun|uttarakhand/i.test(r.display_name));
        if (localRow) {
          const point={lat:Number(localRow.lat),lon:Number(localRow.lon),label:localRow.display_name};
          realGeocodeCache[query]=point;
          return point;
        }
        const localKey = Object.keys(OSM_NODES).find(name => query.toLowerCase().includes(name.toLowerCase()));
        if (localKey && DEMO_COORDINATES[localKey]) return DEMO_COORDINATES[localKey];
      }
    } catch (err) { lastError = err; }
  }
  // Do not leave the entire map broken if Nominatim blocks a request or
  // cannot resolve a common demo location such as Patel Nagar.
  const normalized = Object.keys(OSM_NODES).find(name =>
    query.toLowerCase().includes(name.toLowerCase())
  );
  if (normalized && DEMO_COORDINATES[normalized]) return DEMO_COORDINATES[normalized];
  if (/hospital/i.test(query)) return DEMO_COORDINATES.Hospital;
  throw new Error("Could not find map location: " + query + (lastError ? ` (${lastError.message})` : ""));
}
function makeIcon(emoji, color) {
  return L.divIcon({className:"saferoute-map-icon",html:`<div style="width:34px;height:34px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px #0004;display:grid;place-items:center;font-size:18px">${emoji}</div>`,iconSize:[34,34],iconAnchor:[17,17]});
}
async function initRealMap() {
  const mapEl=document.getElementById("liveMap");
  if(!mapEl || typeof L==="undefined") { mapStatus("Map library failed to load. Check internet access.",true); return; }
  if(realMapReady) { setTimeout(()=>realMap.invalidateSize(),150); return; }
  realMap=L.map("liveMap").setView(REAL_MAP_CENTER,12);
  L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png",{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(realMap);
  realMapReady=true;
  mapStatus("Map loaded. Looking up real hospitals and your selected route…");
  await loadRealHospitals();
  await renderPrototypeBaseMarkers();
  await updateRealMapRoute();
  setTimeout(()=>realMap.invalidateSize(),200);
}
async function loadRealHospitals() {
  // Hospitals are queried from OpenStreetMap data around Dehradun.
  const query='[out:json][timeout:20];(node["amenity"="hospital"](around:15000,30.3165,78.0322);way["amenity"="hospital"](around:15000,30.3165,78.0322);relation["amenity"="hospital"](around:15000,30.3165,78.0322););out center tags;';
  try {
    const res=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:query});
    if(!res.ok) throw new Error("Hospital map data unavailable");
    const data=await res.json();
    realHospitalData=(data.elements||[]).map(el=>{
      const tags=el.tags||{};
      const lat=el.lat ?? el.center?.lat, lon=el.lon ?? el.center?.lon;
      if(!Number.isFinite(lat)||!Number.isFinite(lon)) return null;
      return {name:tags.name||tags["name:en"]||"Hospital (name unavailable)",lat,lon,phone:tags.phone||tags["contact:phone"]||"",emergency:tags.emergency||""};
    }).filter(Boolean);
    realHospitalMarkers.forEach(m=>realMap.removeLayer(m)); realHospitalMarkers=[];
    realHospitalData.forEach(h=>{
      const marker=L.marker([h.lat,h.lon],{icon:makeIcon("✚","#2563eb")}).addTo(realMap);
      marker.bindPopup(`<strong>${escapeMapText(h.name)}</strong><br>OpenStreetMap hospital listing${h.phone?`<br>${escapeMapText(h.phone)}`:""}`);
      realHospitalMarkers.push(marker);
    });
    mapStatus(`Loaded ${realHospitalData.length} hospital listing(s) from OpenStreetMap. Map data may be incomplete; verify hospital availability by phone.`);
  } catch(e) {
    mapStatus("Map is available, but live hospital lookup failed. Check internet access and retry. "+e.message,true);
  }
}
function escapeMapText(value) {
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function renderPrototypeBaseMarkers() {
  realAmbulanceMarkers.forEach(m=>realMap.removeLayer(m)); realAmbulanceMarkers=[];
  for(const a of PROTOTYPE_AMBULANCES) {
    try {
      const p=await geocodePlace(OSM_NODES[a.location]);
      const marker=L.marker([p.lat,p.lon],{icon:makeIcon("🚑",a.status==="Available"?"#16a34a":"#64748b")}).addTo(realMap);
      marker.bindPopup(`<strong>${a.id}</strong><br>${a.location}<br>Status: ${a.status}<br><em>Prototype base location — not live GPS</em>`);
      realAmbulanceMarkers.push(marker);
    } catch(e) { console.warn("Could not geocode base",a.location,e); }
  }
}
function getEmergencyLocationName() {
  // A registered/selected emergency is authoritative; don't silently route to
  // the form's default location when another emergency is selected.
  if (selectedEmergency && selectedEmergency.location) return selectedEmergency.location;
  const sel=document.getElementById("emergencyLocation");
  return sel?.value || "Clock Tower";
}
function getSelectedAmbulanceForMap() {
  const select=document.getElementById("ambulanceSelect");
  const chosen=window.__selectedAmbulanceId || select?.value;
  const fromArray=(Array.isArray(ambulances)?ambulances:[]).find(a=>a.id===chosen)
    || vehicles.find(v=>String(v.id)===String(chosen));
  const fromPrototype=PROTOTYPE_AMBULANCES.find(a=>a.id===chosen);
  if (fromArray || fromPrototype) return fromArray || fromPrototype;
  // Only use the first available unit before the user has selected one.
  return (Array.isArray(ambulances) ? ambulances.find(a=>a.status==="Available") : null)
    || PROTOTYPE_AMBULANCES.find(a=>a.status==="Available")
    || PROTOTYPE_AMBULANCES[0];
}
async function getKnownMapPoint(location) {
  // These are the project's fixed Dehradun demo nodes. Use them directly so
  // geocoding ambiguity cannot send a local ambulance route hundreds of km away.
  if (DEMO_COORDINATES[location]) return DEMO_COORDINATES[location];
  return geocodePlace(OSM_NODES[location] || `${location}, Dehradun, Uttarakhand, India`);
}
async function getRoadRoute(start,end) {
  const url=`https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
  const res=await fetch(url);
  if(!res.ok) throw new Error("Road routing service unavailable");
  const data=await res.json();
  if(data.code!=="Ok"||!data.routes?.length) throw new Error("No drivable route found between these points");
  return data.routes[0];
}
async function updateRealMapRoute() {
  if(!realMapReady) return;
  try {
    const emergencyName=getEmergencyLocationName();
    const ambulance=getSelectedAmbulanceForMap();
    const start=await getKnownMapPoint(ambulance.location);
    const end=await getKnownMapPoint(emergencyName);
    realMapCurrentOrigin=end;
    if(realRouteLayer) realMap.removeLayer(realRouteLayer);
    if(realEmergencyMarker) realMap.removeLayer(realEmergencyMarker);
    realEmergencyMarker=L.marker([end.lat,end.lon],{icon:makeIcon("🚨","#dc2626")}).addTo(realMap);
    realEmergencyMarker.bindPopup(`<strong>Emergency location</strong><br>${escapeMapText(emergencyName)}`);
    const route=await getRoadRoute(start,end);
    realRouteLayer=L.geoJSON(route.geometry,{style:{color:"#16a34a",weight:6,opacity:.9}}).addTo(realMap);
    const km=(route.distance/1000).toFixed(1);
    const mins=Math.round(route.duration/60);

    // Also calculate a real-road route from the emergency to the nearest mapped hospital.
    if(realHospitalRouteLayer) realMap.removeLayer(realHospitalRouteLayer);
    let nearestHospital=null, nearestStraight=Infinity;
    for(const hospital of realHospitalData) {
      const dlat=(hospital.lat-end.lat)*Math.PI/180;
      const dlon=(hospital.lon-end.lon)*Math.PI/180;
      const a=Math.sin(dlat/2)**2+Math.cos(end.lat*Math.PI/180)*Math.cos(hospital.lat*Math.PI/180)*Math.sin(dlon/2)**2;
      const distance=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      if(distance<nearestStraight) { nearestStraight=distance; nearestHospital=hospital; }
    }
    let hospitalText="No hospital listings were returned by OpenStreetMap.";
    if(nearestHospital) {
      try {
        const hospitalRoute=await getRoadRoute(end,{lat:nearestHospital.lat,lon:nearestHospital.lon});
        realHospitalRouteLayer=L.geoJSON(hospitalRoute.geometry,{style:{color:"#2563eb",weight:5,opacity:.9,dashArray:"8 7"}}).addTo(realMap);
        hospitalText=` Nearest mapped hospital: ${nearestHospital.name}, ${ (hospitalRoute.distance/1000).toFixed(1) } km by road (estimated ${Math.round(hospitalRoute.duration/60)} min).`;
      } catch(err) {
        hospitalText=` Nearest mapped hospital: ${nearestHospital.name}; road route could not be calculated.`;
      }
    }
    document.getElementById("realRouteTitle").textContent=`${ambulance.id}: ${ambulance.location} → ${emergencyName}`;
    document.getElementById("realRouteSummary").textContent=`Ambulance road route: ${km} km • estimated ${mins} min (OSRM estimate, not live traffic).${hospitalText}`;
    const link=document.getElementById("openGoogleMapsLink");
    // Route origin must be the selected ambulance's base, not the computer's GPS.
    // The device GPS marker remains visible for reference, but must not override the ambulance route.
    link.href=`https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lon}&destination=${end.lat},${end.lon}&travelmode=driving`;
    link.textContent=`Open ${ambulance.id} directions in Google Maps ↗`;
    link.hidden=false;
    const expandable=document.getElementById("mapExpandable");
    if(expandable && expandable.classList.contains("expanded")) {
      realMap.fitBounds(realRouteLayer.getBounds(),{padding:[30,30],maxZoom:14});
    }
    mapStatus(`Directions ready. ${ambulance.id} base → emergency → nearest mapped hospital. Ambulance base is not live GPS.`);
  } catch(e) {
    mapStatus("Could not calculate road route: "+e.message,true);
    document.getElementById("realRouteSummary").textContent="Route unavailable. Verify the selected locations and internet access.";
  }
}
function startUserGps() {
  if(!navigator.geolocation) {
    mapStatus("This browser does not support GPS. Open the page through Live Server (localhost) and allow location permission.",true);
    return;
  }
  mapStatus("Requesting this device's location permission…");
  navigator.geolocation.getCurrentPosition(async position=>{
    const lat=position.coords.latitude, lon=position.coords.longitude;
    realUserCoords={lat,lon};
    if(realUserMarker) realMap.removeLayer(realUserMarker);
    realUserMarker=L.marker([lat,lon],{icon:makeIcon("📍","#7c3aed")}).addTo(realMap)
      .bindPopup("Your device GPS location").openPopup();
    realMap.setView([lat,lon],15);
    const link=document.getElementById("openGoogleMapsLink");
    const emergencyName=getEmergencyLocationName();
    let destination=encodeURIComponent(emergencyName+", Dehradun, Uttarakhand, India");
    try {
      const end=await geocodePlace(OSM_NODES[emergencyName]||destination);
      destination=`${end.lat},${end.lon}`;
    } catch (_) { /* Google Maps can resolve the destination name itself. */ }
    if(link) {
      link.href=`https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${destination}&travelmode=driving`;
      link.textContent="Open directions from my GPS in Google Maps ↗";
      link.hidden=false;
    }
    mapStatus(`GPS location acquired (accuracy about ${Math.round(position.coords.accuracy)} m). Google Maps directions now start from this device. This does not represent an ambulance unless used on its device.`);
  },err=>{
    const reasons={1:"Location permission was denied",2:"Your device could not determine a location",3:"Location request timed out"};
    mapStatus(`${reasons[err.code]||"GPS unavailable"}. Allow location access for this localhost site in your browser settings, then try again.`,true);
    // Still offer Google Maps, which can ask the browser/app to use current location.
    const link=document.getElementById("openGoogleMapsLink");
    if(link) {
      const destination=encodeURIComponent(getEmergencyLocationName()+", Dehradun, Uttarakhand, India");
      link.href=`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${destination}&travelmode=driving`;
      link.textContent="Open Google Maps from current location ↗";
      link.hidden=false;
    }
  },{enableHighAccuracy:true,maximumAge:10000,timeout:20000});
}

document.addEventListener("DOMContentLoaded",()=>{
  const toggle=document.getElementById("toggleMapBtn");
  const expandable=document.getElementById("mapExpandable");
  if(toggle && expandable) toggle.addEventListener("click",()=>{
    const opening=expandable.classList.contains("collapsed");
    expandable.classList.toggle("collapsed",!opening);
    expandable.classList.toggle("expanded",opening);
    toggle.textContent=opening?"Minimize map −":"Expand map ＋";
    toggle.setAttribute("aria-expanded",String(opening));
    if(opening) {
      setTimeout(()=>{
        if(!realMapReady) initRealMap();
        else if(realMap) { realMap.invalidateSize(); updateRealMapRoute(); }
      },260);
    }
  });
  const locate=document.getElementById("locateMeBtn");
  if(locate) locate.addEventListener("click",()=>{
    if(expandable && expandable.classList.contains("collapsed") && toggle) toggle.click();
    setTimeout(()=>{ if(realMapReady) startUserGps(); else setTimeout(startUserGps,500); },300);
  });
  const emergencySel=document.getElementById("emergencyLocation");
  if(emergencySel) emergencySel.addEventListener("change",updateRealMapRoute);
  const ambulanceSel=document.getElementById("ambulanceSelect");
  if(ambulanceSel) ambulanceSel.addEventListener("change",()=>{
    window.__selectedAmbulanceId = ambulanceSel.value;
    window.__userPickedAmbulance = true;
    updateSelectedAmbulanceRoute();
    updateRealMapRoute();
  });
  const sortBtn=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Sort by Distance");
  if(sortBtn) sortBtn.addEventListener("click",()=>setTimeout(updateRealMapRoute,200));
  const dispatchBtn=[...document.querySelectorAll("button")].find(b=>/Dispatch Ambulance|Dispatch Selected Ambulance/i.test(b.textContent));
  if(dispatchBtn) dispatchBtn.addEventListener("click",()=>setTimeout(updateRealMapRoute,400));
  // Map is intentionally lazy-loaded when the user expands it.
});
