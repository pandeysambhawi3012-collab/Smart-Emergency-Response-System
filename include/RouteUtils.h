#ifndef ROUTE_UTILS_H
#define ROUTE_UTILS_H

#include "Graph.h"

#include <vector>
#include <string>

using namespace std;


struct AmbulanceRoute
{
    string ambulanceID;
    RouteResult route;
};


void sortRoutesByDistance(
    vector<AmbulanceRoute>& routes
);

void displaySortedRoutes(
    const vector<AmbulanceRoute>& routes
);

#endif