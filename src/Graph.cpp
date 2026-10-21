#include "../include/Graph.h"

#include <iostream>
#include <queue>
#include <limits>
#include <algorithm>

using namespace std;


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

    adj.push_back({});
}


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



void Graph::addRoad(
    string from,
    string to,
    int weight)
{
    int u = findLocation(from);
    int v = findLocation(to);

    if (u == -1 || v == -1)
    {
        cout << "Invalid location!\n";
        return;
    }

    if (weight < 0)
    {
        cout << "Road weight cannot be negative!\n";
        return;
    }

    adj[u].push_back({v, weight});

    adj[v].push_back({u, weight});
}


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

RouteResult Graph::dijkstra(
    string source,
    string destination)
{
    int start = findLocation(source);
    int end = findLocation(destination);

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

    vector<int> distance(
        locations.size(),
        INF
    );

    vector<int> parent(
        locations.size(),
        -1
    );

    priority_queue<
        pair<int, int>,
        vector<pair<int, int>>,
        greater<pair<int, int>>
    > pq;


    distance[start] = 0;

    pq.push({
        0,
        start
    });
    while (!pq.empty())
    {
        int currentDistance =
            pq.top().first;

        int currentNode =
            pq.top().second;

        pq.pop();

        if (currentDistance !=
            distance[currentNode])
        {
            continue;
        }

        if (currentNode == end)
        {
            break;
        }
        for (auto edge : adj[currentNode])
        {
            int neighbour = edge.first;
            int weight = edge.second;

            if (currentDistance >
                INF - weight)
            {
                continue;
            }

            int newDistance =
                currentDistance + weight;

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


    if (distance[end] == INF)
    {
        return {
            0,
            {},
            false
        };
    }


    vector<string> path;

    int current = end;

    while (current != -1)
    {
        path.push_back(
            locations[current]
        );

        current = parent[current];
    }


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