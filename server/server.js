
const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");

const app = express();
const PORT = 8080;

app.use(express.json());

const frontendPath = path.join(__dirname, "..", "frontend");
// Windows builds api_bridge.exe; Linux/macOS builds api_bridge.
const bridgeName =
    process.platform === "win32" ? "api_bridge.exe" : "api_bridge";
const bridgePath = path.join(__dirname, "..", bridgeName);

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
    console.error("Build it first (see build.bat) and keep it in the project root.");
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

// Shortest route, calculated by the C++ Graph / Dijkstra module.
async function routeBetween(source, destination) {
    const result = await bridgeRequest(
        `ROUTE\t${encodeField(source)}\t${encodeField(destination)}`
    );

    if (!result.success) {
        return { distance: 0, path: [], reachable: false };
    }

    return {
        distance: result.distance,
        path: result.path,
        reachable: result.reachable
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

// Pending emergencies in the order the C++ priority queue (heap) serves them.
app.get("/api/queue", async (req, res) => {
    try {
        res.json(await bridgeRequest("QUEUE"));
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

// Return the AVAILABLE vehicles of the type this emergency needs
// (ambulance, fire truck, police vehicle or rescue team), nearest first.
// Routes come from the C++ Dijkstra module.
async function rankResources(req, res) {
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

        const requiredResource = emergency.requiredResource || "Ambulance";
        const resources = [];

        for (const item of state.resources) {
            if (item.type !== requiredResource) continue;
            if (item.status !== "Available") continue;

            resources.push({
                id: item.id,
                type: item.type,
                location: item.location,
                status: item.status,
                route: await routeBetween(item.location, emergency.location)
            });
        }

        resources.sort((a, b) => {
            if (!a.route.reachable && !b.route.reachable) return 0;
            if (!a.route.reachable) return 1;
            if (!b.route.reachable) return -1;
            return a.route.distance - b.route.distance;
        });

        // Only medical/accident calls need a hospital leg.
        const hospitalRoute =
            requiredResource === "Ambulance"
                ? await routeBetween(emergency.location, "Hospital")
                : null;

        res.json({
            success: true,
            emergencyId,
            requiredResource,
            resources,
            ambulances: resources,   // older name, kept for compatibility
            hospitalRoute
        });
    } catch (error) {
        errorResponse(res, error, 503);
    }
}

app.get(["/api/resources/ranked", "/api/ambulances/ranked"], rankResources);

// Dispatch the vehicle the dashboard selected. If no ambulanceId is sent,
// the C++ bridge falls back to the first available suitable resource.
app.post("/api/dispatch", async (req, res) => {
    const emergencyId = Number(req.body.emergencyId);
    const ambulanceId = Number(req.body.ambulanceId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid emergencyId is required"
        });
    }

    const command =
        Number.isInteger(ambulanceId) && ambulanceId > 0
            ? `DISPATCH\t${emergencyId}\t${ambulanceId}`
            : `DISPATCH\t${emergencyId}`;

    try {
        const result = await bridgeRequest(command);
        res.status(result.success ? 200 : 409).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

// Close an emergency and free the vehicle that was handling it.
app.post("/api/emergencies/resolve", async (req, res) => {
    const emergencyId = Number(req.body.emergencyId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid emergencyId is required"
        });
    }

    try {
        const result = await bridgeRequest(`RESOLVE\t${emergencyId}`);
        res.status(result.success ? 200 : 409).json(result);
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
