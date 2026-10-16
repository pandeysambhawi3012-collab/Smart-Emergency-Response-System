#include "../include/Graph.h"
#include "../include/RouteUtils.h"

#include <iostream>
#include <cassert>
#include <vector>

using namespace std;


// =====================================================
// TEST 1
// BASIC DIJKSTRA + ROUTE RECONSTRUCTION
// =====================================================

void testShortestRoute()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");
    city.addLocation("C");
    city.addLocation("D");
    city.addLocation("E");
    city.addLocation("F");


    // Roads
    city.addRoad("A", "B", 4);
    city.addRoad("B", "C", 3);
    city.addRoad("C", "E", 5);

    city.addRoad("A", "D", 7);
    city.addRoad("D", "F", 2);
    city.addRoad("F", "E", 6);


    RouteResult result =
        city.dijkstra("A", "E");


    // Expected:
    //
    // A -> B -> C -> E
    //
    // 4 + 3 + 5 = 12 km

    assert(result.reachable == true);

    assert(result.distance == 12);


    vector<string> expectedPath =
    {
        "A",
        "B",
        "C",
        "E"
    };

    assert(result.path ==
           expectedPath);


    cout << "Test 1 Passed: "
         << "Shortest route + reconstruction\n";
}


// =====================================================
// TEST 2
// SAME SOURCE AND DESTINATION
// =====================================================

void testSameLocation()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");

    city.addRoad("A", "B", 5);


    RouteResult result =
        city.dijkstra("A", "A");


    assert(result.reachable == true);

    assert(result.distance == 0);

    assert(result.path.size() == 1);

    assert(result.path[0] == "A");


    cout << "Test 2 Passed: "
         << "Same source and destination\n";
}


// =====================================================
// TEST 3
// INVALID SOURCE
// =====================================================

void testInvalidSource()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");

    city.addRoad("A", "B", 5);


    RouteResult result =
        city.dijkstra("X", "B");


    assert(result.reachable == false);

    assert(result.path.empty());


    cout << "Test 3 Passed: "
         << "Invalid source\n";
}


// =====================================================
// TEST 4
// INVALID DESTINATION
// =====================================================

void testInvalidDestination()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");

    city.addRoad("A", "B", 5);


    RouteResult result =
        city.dijkstra("A", "X");


    assert(result.reachable == false);

    assert(result.path.empty());


    cout << "Test 4 Passed: "
         << "Invalid destination\n";
}


// =====================================================
// TEST 5
// UNREACHABLE LOCATION
// =====================================================

void testUnreachableRoute()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");
    city.addLocation("C");


    // Only A and B are connected
    city.addRoad("A", "B", 5);


    RouteResult result =
        city.dijkstra("A", "C");


    assert(result.reachable == false);

    assert(result.path.empty());


    cout << "Test 5 Passed: "
         << "Unreachable destination\n";
}


// =====================================================
// TEST 6
// LOCATION SEARCH
// =====================================================

void testLocationSearch()
{
    Graph city;

    city.addLocation("ISBT");
    city.addLocation("Clock Tower");
    city.addLocation("Hospital");


    // Existing locations
    assert(
        city.findLocation("ISBT") != -1
    );

    assert(
        city.findLocation("Hospital") != -1
    );


    // Non-existing location
    assert(
        city.findLocation("Airport") == -1
    );


    cout << "Test 6 Passed: "
         << "Location searching\n";
}


// =====================================================
// TEST 7
// NEGATIVE ROAD
// =====================================================

void testNegativeRoad()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");


    // This should be rejected
    city.addRoad("A", "B", -5);


    RouteResult result =
        city.dijkstra("A", "B");


    // Since the negative road was rejected,
    // A and B remain disconnected.
    assert(result.reachable == false);


    cout << "Test 7 Passed: "
         << "Negative road rejection\n";
}


// =====================================================
// TEST 8
// SORTING AMBULANCES
// =====================================================

void testSorting()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");
    city.addLocation("C");
    city.addLocation("D");


    city.addRoad("A", "B", 4);
    city.addRoad("B", "C", 3);
    city.addRoad("A", "D", 10);


    vector<AmbulanceRoute> routes;


    // AMB-01:
    // A -> C = 7 km
    routes.push_back(
        {
            "AMB-01",
            city.dijkstra("A", "C")
        }
    );


    // AMB-02:
    // A -> B = 4 km
    routes.push_back(
        {
            "AMB-02",
            city.dijkstra("A", "B")
        }
    );


    // AMB-03:
    // A -> D = 10 km
    routes.push_back(
        {
            "AMB-03",
            city.dijkstra("A", "D")
        }
    );


    sortRoutesByDistance(routes);


    // Expected order:
    //
    // AMB-02 -> 4 km
    // AMB-01 -> 7 km
    // AMB-03 -> 10 km

    assert(
        routes[0].ambulanceID ==
        "AMB-02"
    );

    assert(
        routes[1].ambulanceID ==
        "AMB-01"
    );

    assert(
        routes[2].ambulanceID ==
        "AMB-03"
    );


    cout << "Test 8 Passed: "
         << "Ambulance route sorting\n";
}


// =====================================================
// TEST 9
// UNREACHABLE AMBULANCE IS LAST
// =====================================================

void testUnreachableSorting()
{
    Graph city;

    city.addLocation("A");
    city.addLocation("B");
    city.addLocation("C");


    city.addRoad("A", "B", 5);


    vector<AmbulanceRoute> routes;


    // Reachable
    routes.push_back(
        {
            "AMB-01",
            city.dijkstra("A", "B")
        }
    );


    // Unreachable
    routes.push_back(
        {
            "AMB-02",
            city.dijkstra("A", "C")
        }
    );


    sortRoutesByDistance(routes);


    // Reachable ambulance must come first
    assert(
        routes[0].ambulanceID ==
        "AMB-01"
    );


    assert(
        routes[1].ambulanceID ==
        "AMB-02"
    );


    cout << "Test 9 Passed: "
         << "Unreachable route sorting\n";
}


// =====================================================
// MAIN
// =====================================================

int main()
{
    cout << "\n";
    cout << "========================================\n";
    cout << "       MEMBER 3 ROUTE MODULE TESTS\n";
    cout << "========================================\n";


    testShortestRoute();

    testSameLocation();

    testInvalidSource();

    testInvalidDestination();

    testUnreachableRoute();

    testLocationSearch();

    testNegativeRoad();

    testSorting();

    testUnreachableSorting();


    cout << "\n";
    cout << "========================================\n";
    cout << "       ALL TESTS PASSED SUCCESSFULLY\n";
    cout << "========================================\n";


    return 0;
}