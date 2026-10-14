#include "Graph.h"

#include <iostream>

using namespace std;

int main()
{
    Graph city;

    // =========================================
    // SIMULATED CITY LOCATIONS
    // =========================================

    city.addLocation("ISBT");
    city.addLocation("Clock Tower");
    city.addLocation("Rajpur Road");
    city.addLocation("Patel Nagar");
    city.addLocation("Prem Nagar");
    city.addLocation("Hospital");


    // =========================================
    // SIMULATED ROADS
    // Weight = distance in km
    // =========================================

    city.addRoad(
        "ISBT",
        "Clock Tower",
        5
    );

    city.addRoad(
        "Clock Tower",
        "Rajpur Road",
        4
    );

    city.addRoad(
        "Clock Tower",
        "Patel Nagar",
        3
    );

    city.addRoad(
        "Patel Nagar",
        "Prem Nagar",
        6
    );

    city.addRoad(
        "Rajpur Road",
        "Hospital",
        5
    );

    city.addRoad(
        "Prem Nagar",
        "Hospital",
        4
    );


    // =========================================
    // DISPLAY NETWORK
    // =========================================

    city.displayNetwork();


    // =========================================
    // FIND SHORTEST ROUTE
    // =========================================

    RouteResult result =
        city.dijkstra(
            "ISBT",
            "Hospital"
        );


    cout << "\n===== EMERGENCY ROUTE =====\n";


    if (result.reachable)
    {
        cout << "Shortest distance: "
             << result.distance
             << " km\n";

        cout << "Route: ";

        for (size_t i = 0;
             i < result.path.size();
             i++)
        {
            cout << result.path[i];

            if (i + 1 <
                result.path.size())
            {
                cout << " -> ";
            }
        }

        cout << endl;
    }
    else
    {
        cout << "No route available.\n";
    }


    return 0;
}