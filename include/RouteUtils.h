#ifndef ROUTE_UTILS_H
#define ROUTE_UTILS_H

#include "Graph.h"

#include <vector>
#include <string>

using namespace std;


// =====================================================
// STORES AMBULANCE + CALCULATED ROUTE
// =====================================================

struct AmbulanceRoute
{
    string ambulanceID;
    RouteResult route;
};


// =====================================================
// SORT AMBULANCES BY SHORTEST ROUTE
//
// Shortest reachable route appears first.
// Unreachable routes appear at the end.
// =====================================================

void sortRoutesByDistance(
    vector<AmbulanceRoute>& routes
);


// =====================================================
// DISPLAY SORTED AMBULANCE ROUTES
// =====================================================

void displaySortedRoutes(
    const vector<AmbulanceRoute>& routes
);

#endif