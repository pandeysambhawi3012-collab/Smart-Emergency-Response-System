#include "../include/Graph.h"

#include <iostream>
#include <queue>
#include <limits>
#include <algorithm>

using namespace std;


// =====================================================
// ADD LOCATION
// =====================================================

void Graph::addLocation(string id)
{
    // Prevent duplicate locations
    if (findLocation(id) != -1)
    {
        cout << "Location already exists: "
             << id << endl;

        return;
    }

    locations.push_back(id);

    // Create empty adjacency list
    // for this location
    adj.push_back({});
}


// =====================================================
// FIND LOCATION
// Linear Search
// Time Complexity: O(V)
// =====================================================

int Graph::findLocation(string id)
{
    for (int i = 0;
         i < static_cast<int>(locations.size());
         i++)
    {
        if (locations[i] == id)
        {
            return i;
        }
    }

    return -1;
}


// =====================================================
// ADD ROAD
// =====================================================

void Graph::addRoad(
    string from,
    string to,
    int weight)
{
    int u = findLocation(from);
    int v = findLocation(to);

    // Check locations
    if (u == -1 || v == -1)
    {
        cout << "Invalid location!\n";
        return;
    }

    // Dijkstra cannot use negative weights
    if (weight < 0)
    {
        cout << "Road weight cannot be negative!\n";
        return;
    }

    // Add road from -> to
    adj[u].push_back({v, weight});

    // Our simulated city uses two-way roads
    // Add road from <- to
    adj[v].push_back({u, weight});
}


// =====================================================
// DISPLAY NETWORK
// =====================================================

void Graph::displayNetwork()
{
    cout << "\n";
    cout << "========================================\n";
    cout << "        SIMULATED CITY ROAD NETWORK\n";
    cout << "========================================\n";

    for (int i = 0;
         i < static_cast<int>(locations.size());
         i++)
    {
        cout << locations[i] << " -> ";

        for (auto edge : adj[i])
        {
            int neighbour = edge.first;
            int weight = edge.second;

            cout << locations[neighbour]
                 << "("
                 << weight
                 << " km) ";
        }

        cout << endl;
    }
}


// =====================================================
// DIJKSTRA SHORTEST PATH
//
// Time Complexity:
// O((V + E) log V)
//
// Space Complexity:
// O(V + E)
// =====================================================

RouteResult Graph::dijkstra(
    string source,
    string destination)
{
    int start = findLocation(source);
    int end = findLocation(destination);

    // Invalid locations
    if (start == -1 || end == -1)
    {
        return {
            0,
            {},
            false
        };
    }

    const int INF =
        numeric_limits<int>::max();

    // Shortest distance from source
    vector<int> distance(
        locations.size(),
        INF
    );

    // Parent/predecessor array
    // Used for route reconstruction
    vector<int> parent(
        locations.size(),
        -1
    );

    // Min-priority queue
    //
    // pair:
    // first  = current shortest distance
    // second = node index
    priority_queue<
        pair<int, int>,
        vector<pair<int, int>>,
        greater<pair<int, int>>
    > pq;


    // Source distance = 0
    distance[start] = 0;

    pq.push({
        0,
        start
    });


    // =================================================
    // MAIN DIJKSTRA LOOP
    // =================================================

    while (!pq.empty())
    {
        int currentDistance =
            pq.top().first;

        int currentNode =
            pq.top().second;

        pq.pop();


        // Ignore outdated priority queue entry
        if (currentDistance !=
            distance[currentNode])
        {
            continue;
        }


        // Destination reached
        if (currentNode == end)
        {
            break;
        }


        // Check neighbouring nodes
        for (auto edge : adj[currentNode])
        {
            int neighbour = edge.first;
            int weight = edge.second;

            // Avoid integer overflow
            if (currentDistance >
                INF - weight)
            {
                continue;
            }

            int newDistance =
                currentDistance + weight;


            // Found a shorter route
            if (newDistance <
                distance[neighbour])
            {
                distance[neighbour] =
                    newDistance;

                // Store parent
                parent[neighbour] =
                    currentNode;

                pq.push({
                    newDistance,
                    neighbour
                });
            }
        }
    }


    // =================================================
    // NO ROUTE
    // =================================================

    if (distance[end] == INF)
    {
        return {
            0,
            {},
            false
        };
    }


    // =================================================
    // ROUTE RECONSTRUCTION
    // =================================================

    vector<string> path;

    int current = end;

    while (current != -1)
    {
        path.push_back(
            locations[current]
        );

        current = parent[current];
    }


    // Path currently:
    //
    // E -> C -> B -> A
    //
    // Reverse:
    //
    // A -> B -> C -> E

    reverse(
        path.begin(),
        path.end()
    );


    return {
        distance[end],
        path,
        true
    };
}