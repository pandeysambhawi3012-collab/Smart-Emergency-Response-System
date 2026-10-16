
const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");

const app = express();
const PORT = 8080;

app.use(express.json());

const frontendPath = path.join(__dirname, "..", "frontend");
const bridgePath = path.join(__dirname, "..", "api_bridge.exe");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Keep one C++ process alive so state persists between requests.
const bridge = spawn(bridgePath, [], {
    cwd: path.dirname(bridgePath),
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"]
});

const waiting = [];
const responses = [];

const stdoutLines = readline.createInterface({
    input: bridge.stdout
});

stdoutLines.on("line", (line) => {
    let result;

    try {
        result = JSON.parse(line);
    } catch {
        // Ignore non-JSON startup messages from existing C++ modules.
        console.log("[C++ output]", line);
        return;
    }

    const resolve = waiting.shift();

    if (resolve) {
        resolve(result);
    } else {
        responses.push(result);
    }
});

bridge.stderr.on("data", (data) => {
    console.log("[C++]", data.toString().trim());
});

bridge.on("error", (error) => {
    console.error("Could not start C++ bridge:", error.message);
});

bridge.on("exit", (code) => {
    console.error("C++ bridge exited with code:", code);
});

function bridgeRequest(command) {
    return new Promise((resolve, reject) => {
        if (bridge.exitCode !== null) {
            reject(new Error("C++ bridge is not running"));
            return;
        }

        // Use a queued response if one is already waiting.
        if (responses.length > 0) {
            // A queued response belongs to an earlier request; don't
            // reuse it for a new command.
            reject(new Error("Unexpected queued C++ response"));
            return;
        }

        waiting.push(resolve);

        bridge.stdin.write(command + "\n", (error) => {
            if (error) {
                const index = waiting.indexOf(resolve);
                if (index !== -1) waiting.splice(index, 1);
                reject(error);
            }
        });
    });
}

function encodeField(value) {
    return encodeURIComponent(String(value));
}

function errorResponse(res, error, status = 500) {
    return res.status(status).json({
        success: false,
        error: error.message || String(error)
    });
}

// A route graph compatible with the dashboard's Dehradun demo locations.
const routeGraph = {
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

function shortestRoute(source, destination) {
    if (!routeGraph[source] || !routeGraph[destination]) {
        return { distance: 0, path: [], reachable: false };
    }

    const distances = {};
    const previous = {};
    const visited = new Set();
    const nodes = Object.keys(routeGraph);

    for (const node of nodes) {
        distances[node] = Infinity;
        previous[node] = null;
    }

    distances[source] = 0;

    while (visited.size < nodes.length) {
        let current = null;

        for (const node of nodes) {
            if (
                !visited.has(node) &&
                (current === null ||
                 distances[node] < distances[current])
            ) {
                current = node;
            }
        }

        if (current === null || distances[current] === Infinity) break;
        if (current === destination) break;

        visited.add(current);

        for (const edge of routeGraph[current]) {
            const candidate = distances[current] + edge.weight;

            if (candidate < distances[edge.node]) {
                distances[edge.node] = candidate;
                previous[edge.node] = current;
            }
        }
    }

    if (distances[destination] === Infinity) {
        return { distance: 0, path: [], reachable: false };
    }

    const route = [];
    let current = destination;

    while (current !== null) {
        route.push(current);
        current = previous[current];
    }

    route.reverse();

    return {
        distance: distances[destination],
        path: route,
        reachable: true
    };
}

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Smart Emergency Response API is running",
        bridgeRunning: bridge.exitCode === null
    });
});

app.get("/api/state", async (req, res) => {
    try {
        const state = await bridgeRequest("STATE");
        res.json(state);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

// Register an emergency using the same ID supplied by the frontend.
app.post("/api/emergencies", async (req, res) => {
    const {
        id,
        type,
        location,
        peopleAffected,
        injurySeverity,
        riskLevel,
        timeReported
    } = req.body;

    const emergencyId = Number(id);

    if (
        !Number.isInteger(emergencyId) ||
        emergencyId <= 0 ||
        typeof type !== "string" ||
        typeof location !== "string" ||
        !location.trim() ||
        !Number.isInteger(peopleAffected) ||
        !Number.isInteger(injurySeverity) ||
        !Number.isInteger(riskLevel) ||
        peopleAffected < 1 ||
        injurySeverity < 0 || injurySeverity > 10 ||
        riskLevel < 0 || riskLevel > 10
    ) {
        return res.status(400).json({
            success: false,
            error: "Invalid emergency data"
        });
    }

    const command = [
        "REGISTER",
        emergencyId,
        encodeField(type),
        encodeField(location.trim()),
        peopleAffected,
        injurySeverity,
        riskLevel,
        encodeField(timeReported || new Date().toISOString())
    ].join("\t");

    try {
        const result = await bridgeRequest(command);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

// Return available ambulances ordered by shortest route to the emergency.
// This currently uses the dashboard's demonstration graph.
app.get("/api/ambulances/ranked", async (req, res) => {
    const emergencyId = Number(req.query.emergencyId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid emergencyId is required"
        });
    }

    try {
        const state = await bridgeRequest("STATE");

        if (!state.success) {
            return res.status(503).json(state);
        }

        const emergency = state.emergencies.find(
            item => Number(item.id) === emergencyId
        );

        if (!emergency) {
            return res.status(404).json({
                success: false,
                error: "Emergency not found"
            });
        }

        const ambulances = state.ambulances
            .filter(item => item.status === "Available")
            .map(item => ({
                id: item.id,
                location: item.location,
                status: item.status,
                route: shortestRoute(item.location, emergency.location)
            }))
            .sort((a, b) => {
                if (!a.route.reachable && !b.route.reachable) return 0;
                if (!a.route.reachable) return 1;
                if (!b.route.reachable) return -1;
                return a.route.distance - b.route.distance;
            });

        const hospitalRoute = shortestRoute(
            emergency.location,
            "Hospital"
        );

        res.json({
            success: true,
            emergencyId,
            ambulances,
            hospitalRoute
        });
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

// The current C++ bridge chooses the first available suitable resource.
// The selected ambulance ID is accepted for frontend compatibility,
// but exact resource selection is not yet implemented in C++.
app.post("/api/dispatch", async (req, res) => {
    const emergencyId = Number(req.body.emergencyId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid emergencyId is required"
        });
    }

    try {
        const result = await bridgeRequest(`DISPATCH\t${emergencyId}`);

        if (!result.success) {
            return res.status(409).json(result);
        }

        res.json({
            ...result,
            distance: 0
        });
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.post("/api/resources/release", async (req, res) => {
    const resourceId = Number(req.body.resourceId);

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid resourceId is required"
        });
    }

    try {
        const result = await bridgeRequest(`RELEASE\t${resourceId}`);
        res.status(result.success ? 200 : 409).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        error: "API endpoint not implemented",
        path: req.originalUrl
    });
});

app.listen(PORT, "127.0.0.1", () => {
    console.log(`Dashboard: http://127.0.0.1:${PORT}/`);
    console.log(`Health:    http://127.0.0.1:${PORT}/api/health`);
    console.log(`State:     http://127.0.0.1:${PORT}/api/state`);
});
