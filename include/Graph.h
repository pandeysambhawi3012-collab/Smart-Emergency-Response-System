#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>
#include <utility>

using namespace std;

struct RouteResult
{
    int distance;
    vector<string> path;
    bool reachable;
};

class Graph
{
private:

    vector<vector<pair<int, int>>> adj;

    vector<string> locations;

public:

    void addLocation(string id);

    void addRoad(string from, string to, int weight);

    void displayNetwork();
    
    int findLocation(string id);

    
    RouteResult dijkstra(
        string source,
        string destination
    );
};

#endif