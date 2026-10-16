#include "../include/RouteUtils.h"

#include <iostream>
#include <algorithm>

using namespace std;


// =====================================================
// SORT ROUTES BY DISTANCE
//
// Reachable routes:
//     shortest → longest
//
// Unreachable routes:
//     placed at the end
// =====================================================

void sortRoutesByDistance(
    vector<AmbulanceRoute>& routes)
{
    sort(
        routes.begin(),
        routes.end(),

        [](const AmbulanceRoute& a,
           const AmbulanceRoute& b)
        {
            // Reachable route comes before
            // unreachable route
            if (a.route.reachable !=
                b.route.reachable)
            {
                return a.route.reachable >
                       b.route.reachable;
            }

            // Both unreachable
            if (!a.route.reachable &&
                !b.route.reachable)
            {
                return a.ambulanceID <
                       b.ambulanceID;
            }

            // Both reachable
            return a.route.distance <
                   b.route.distance;
        }
    );
}


// =====================================================
// DISPLAY SORTED ROUTES
// =====================================================

void displaySortedRoutes(
    const vector<AmbulanceRoute>& routes)
{
    cout << "\n";
    cout << "========================================\n";
    cout << "       AMBULANCES SORTED BY DISTANCE\n";
    cout << "========================================\n";

    for (const auto& item : routes)
    {
        cout << item.ambulanceID
             << " -> ";

        if (item.route.reachable)
        {
            cout << item.route.distance
                 << " km";

            cout << " | Route: ";

            for (size_t i = 0;
                 i < item.route.path.size();
                 i++)
            {
                cout << item.route.path[i];

                if (i + 1 <
                    item.route.path.size())
                {
                    cout << " -> ";
                }
            }
        }
        else
        {
            cout << "No route";
        }

        cout << endl;
    }
}