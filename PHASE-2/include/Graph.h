#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>
#include <utility>

using namespace std;

// Stores the result returned by Dijkstra
struct RouteResult
{
    int distance;
    vector<string> path;
    bool reachable;
};

class Graph
{
private:

    // Adjacency list
    //
    // Example:
    // A -> B(4), D(7)
    //
    // pair<int,int>
    // first  = destination index
    // second = road weight
    vector<vector<pair<int, int>>> adj;

    // Stores location names
    vector<string> locations;

public:

    // Add a location
    void addLocation(string id);

    // Add a two-way road
    void addRoad(string from, string to, int weight);

    // Display complete road network
    void displayNetwork();

    // Linear search for a location
    int findLocation(string id);

    // Dijkstra shortest path
    RouteResult dijkstra(
        string source,
        string destination
    );
};

#endif