

#include <iostream>

#include <vector>

#include <string>

#include <limits>
#include <climits>



#include "EmergencyManager.h"

#include "PriorityManager.h"

#include "ResourceManager.h"

#include "Graph.h"

using namespace std;

// Calculate a route automatically from the allocated resource to the emergency.
// Select the closest AVAILABLE resource of the required type.
// Resources without a valid route are ignored.
Resource* findNearestAvailableResource(ResourceManager& resourceManager,
                                      Graph& cityGraph,
                                      ResourceType requiredType,
                                      const string& destination,
                                      RouteResult& selectedRoute)
{
    Resource* nearest = nullptr;
    int shortestDistance = INT_MAX;

    cout << "\nComparing available resources by route distance...\n";

    for (Resource& candidate : resourceManager.getResources())
    {
        if (candidate.getType() != requiredType ||
            candidate.getStatus() != ResourceStatus::Available)
        {
            continue;
        }

        RouteResult route = cityGraph.dijkstra(candidate.getLocation(), destination);

        cout << "Resource " << candidate.getResourceId()
             << " (" << candidate.getLocation() << "): ";

        if (!route.reachable)
        {
            cout << "no valid route\n";
            continue;
        }

        cout << route.distance << " km\n";

        if (route.distance < shortestDistance)
        {
            shortestDistance = route.distance;
            nearest = &candidate;
            selectedRoute = route;
        }
    }

    if (nearest != nullptr)
    {
        cout << "Nearest available resource: ID "
             << nearest->getResourceId() << " from "
             << nearest->getLocation() << " ("
             << shortestDistance << " km)\n";
    }

    return nearest;
}

void displayAutomaticRoute(Graph& cityGraph, const string& source,
                           const string& destination, int emergencyId)
{
    cout << "\n---------- AUTOMATIC ROUTE ----------\n";
    cout << "Emergency ID : " << emergencyId << "\n";
    cout << "Vehicle from : " << source << "\n";
    cout << "Emergency at : " << destination << "\n";

    RouteResult route = cityGraph.dijkstra(source, destination);
    if (!route.reachable)
    {
        cout << "Route not calculated: the source or emergency location "
             << "is not registered/connected in the road network.\n";
        cout << "For this sample network, use Zone A, Zone B, or Zone C "
             << "as the emergency location.\n";
    }
    else
    {
        cout << "Shortest route: ";
        for (size_t i = 0; i < route.path.size(); ++i)
        {
            cout << route.path[i];
            if (i + 1 < route.path.size()) cout << " -> ";
        }
        cout << "\nDistance      : " << route.distance << " km\n";
    }
    cout << "-------------------------------------\n";
}



int main()

{

    EmergencyManager emergencyManager;

    PriorityManager priorityManager;

    ResourceManager resourceManager;



    // Initialize resources

    resourceManager.addResource(

        Resource(101, ResourceType::Ambulance, "Hospital", ResourceStatus::Available));



    resourceManager.addResource(

        Resource(102, ResourceType::Ambulance, "ISBT", ResourceStatus::Available));



    resourceManager.addResource(

        Resource(201, ResourceType::FireTruck, "Fire Station", ResourceStatus::Available));



    resourceManager.addResource(

        Resource(301, ResourceType::PoliceVehicle, "Police Station", ResourceStatus::Available));



    resourceManager.addResource(

        Resource(401, ResourceType::RescueTeam, "Rescue Center", ResourceStatus::Available));



    // Initialize the sample city road network (illustrative distances in km)
    Graph cityGraph;

    cityGraph.addLocation("Hospital");
    cityGraph.addLocation("ISBT");
    cityGraph.addLocation("Fire Station");
    cityGraph.addLocation("Police Station");
    cityGraph.addLocation("Rescue Center");
    cityGraph.addLocation("Zone A");
    cityGraph.addLocation("Zone B");
    cityGraph.addLocation("Zone C");

    cityGraph.addRoad("Hospital", "ISBT", 4);
    cityGraph.addRoad("Hospital", "Zone A", 6);
    cityGraph.addRoad("ISBT", "Zone A", 3);
    cityGraph.addRoad("ISBT", "Zone B", 5);
    cityGraph.addRoad("Zone A", "Zone B", 2);
    cityGraph.addRoad("Zone A", "Zone C", 7);
    cityGraph.addRoad("Zone B", "Zone C", 3);
    cityGraph.addRoad("Fire Station", "Zone C", 4);
    cityGraph.addRoad("Police Station", "Zone B", 6);
    cityGraph.addRoad("Rescue Center", "Zone C", 5);

    int choice;



    do

    {

        cout << "\n========================================\n";

        cout << "    SMART EMERGENCY RESPONSE SYSTEM\n";

        cout << "========================================\n";

        cout << "1. Register Emergency\n";

        cout << "2. View All Emergencies\n";

        cout << "3. Search Emergency\n";

        cout << "4. Add Emergencies to Priority Queue\n";

        cout << "5. View Priority Queue\n";

        cout << "6. Process Highest Priority Emergency\n";

        cout << "7. View Resources\n";

        cout << "8. Release Resource\n";

        cout << "9. View Road Network\n";
        cout << "10. Exit\n";

        cout << "========================================\n";

        cout << "Enter your choice: ";



        if (!(cin >> choice))

        {

            cout << "Invalid input. Please enter a number.\n";

            cin.clear();

            cin.ignore(numeric_limits<streamsize>::max(), '\n');

            continue;

        }



        switch (choice)

        {

            // Register emergency and automatically allocate a resource

            case 1:

            {

                emergencyManager.registerEmergency();



                priorityManager.clearQueue();



                const vector<Emergency>& emergencies =

                    emergencyManager.getEmergencies();



                for (const Emergency& emergency : emergencies)

                {

                    if (emergency.getStatus() == EmergencyStatus::Reported ||

                        emergency.getStatus() == EmergencyStatus::Pending)

                    {

                        priorityManager.addEmergency(emergency);

                    }

                }



                while (!priorityManager.isEmpty())

                {

                    Emergency emergency =

                        priorityManager.getHighestPriorityEmergency();



                    ResourceType resourceType;

                    string required = emergency.getRequiredResource();



                    if (required == "Ambulance")

                    {

                        resourceType = ResourceType::Ambulance;

                    }

                    else if (required == "Fire Truck")

                    {

                        resourceType = ResourceType::FireTruck;

                    }

                    else if (required == "Police Vehicle")

                    {

                        resourceType = ResourceType::PoliceVehicle;

                    }

                    else if (required == "Rescue Team")

                    {

                        resourceType = ResourceType::RescueTeam;

                    }

                    else

                    {

                        emergencyManager.updateEmergencyStatus(

                            emergency.getEmergencyId(),

                            EmergencyStatus::Pending);



                        cout << "\nUnknown resource type for Emergency "

                             << emergency.getEmergencyId() << ".\n";

                        continue;

                    }



                    RouteResult selectedRoute{};
                    Resource* resource = findNearestAvailableResource(
                        resourceManager, cityGraph, resourceType,
                        emergency.getLocation(), selectedRoute);



                    if (resource == nullptr)

                    {

                        emergencyManager.updateEmergencyStatus(

                            emergency.getEmergencyId(),

                            EmergencyStatus::Pending);



                        cout << "\nNo available " << required

                             << " for Emergency "

                             << emergency.getEmergencyId() << ".\n";



                        cout << "Emergency remains PENDING. "

                             << "Additional support is required.\n";



                        continue;

                    }



                    resource->setStatus(ResourceStatus::Busy);



                    emergencyManager.updateEmergencyStatus(

                        emergency.getEmergencyId(),

                        EmergencyStatus::ResourceAssigned);



                    cout << "\n========================================\n";

                    cout << "       AUTOMATIC RESOURCE ALLOCATION\n";

                    cout << "========================================\n";

                    cout << "Emergency ID    : "

                         << emergency.getEmergencyId() << "\n";

                    cout << "Resource        : " << required << "\n";

                    cout << "Resource ID     : "

                         << resource->getResourceId() << "\n";

                    cout << "Location        : "

                         << resource->getLocation() << "\n";

                    cout << "Resource Status : BUSY\n";

                    cout << "Emergency Status: RESOURCE ASSIGNED\n";

                    cout << "========================================\n";

                    displayAutomaticRoute(cityGraph, resource->getLocation(),
                                          emergency.getLocation(),
                                          emergency.getEmergencyId());

                }



                break;

            }



            // Display all emergencies

            case 2:

            {

                emergencyManager.displayAllEmergencies();

                break;

            }



            // Search emergency by ID

            case 3:

            {

                int emergencyId;



                cout << "Enter Emergency ID to search: ";



                if (!(cin >> emergencyId))

                {

                    cout << "Invalid Emergency ID.\n";

                    cin.clear();

                    cin.ignore(numeric_limits<streamsize>::max(), '\n');

                    break;

                }



                emergencyManager.displayEmergency(emergencyId);

                break;

            }



            // Build priority queue using pending/reported emergencies

            case 4:

            {

                priorityManager.clearQueue();



                const vector<Emergency>& emergencies =

                    emergencyManager.getEmergencies();



                for (const Emergency& emergency : emergencies)

                {

                    if (emergency.getStatus() == EmergencyStatus::Reported ||

                        emergency.getStatus() == EmergencyStatus::Pending)

                    {

                        priorityManager.addEmergency(emergency);

                    }

                }



                cout << "\nEligible emergencies added to the priority queue.\n";

                cout << "Queue size: " << priorityManager.getQueueSize() << "\n";



                break;

            }



            // Display priority queue

            case 5:

            {

                priorityManager.displayPriorityQueue();

                break;

            }



            // Process the highest-priority emergency



case 6:

{

    if (priorityManager.isEmpty())

    {

        cout << "\nPriority queue is empty.\n";

        cout << "Choose option 4 to add eligible emergencies first.\n";

        break;

    }



    Emergency emergency =

        priorityManager.getHighestPriorityEmergency();



    string required = emergency.getRequiredResource();

    ResourceType resourceType;



    if (required == "Ambulance")

        resourceType = ResourceType::Ambulance;

    else if (required == "Fire Truck")

        resourceType = ResourceType::FireTruck;

    else if (required == "Police Vehicle")

        resourceType = ResourceType::PoliceVehicle;

    else if (required == "Rescue Team")

        resourceType = ResourceType::RescueTeam;

    else

    {

        emergencyManager.updateEmergencyStatus(

            emergency.getEmergencyId(),

            EmergencyStatus::Pending);



        cout << "\nUnknown resource type: " << required << "\n";

        break;

    }



    RouteResult selectedRoute{};
    Resource* resource = findNearestAvailableResource(
        resourceManager, cityGraph, resourceType,
        emergency.getLocation(), selectedRoute);



    if (resource == nullptr)

    {

        emergencyManager.updateEmergencyStatus(

            emergency.getEmergencyId(),

            EmergencyStatus::Pending);



        cout << "\nNo available " << required

             << " for Emergency "

             << emergency.getEmergencyId() << ".\n";



        cout << "Emergency remains PENDING.\n";

        cout << "Release a resource and try again.\n";

        break;

    }



    // Allocate the resource before processing

    resource->setStatus(ResourceStatus::Busy);



    emergencyManager.updateEmergencyStatus(

        emergency.getEmergencyId(),

        EmergencyStatus::ResourceAssigned);



    cout << "\nResource allocated successfully.\n";

    cout << "Emergency ID : "

         << emergency.getEmergencyId() << "\n";

    cout << "Resource ID  : "

         << resource->getResourceId() << "\n";

    cout << "Resource     : " << required << "\n";

    cout << "Location     : "

         << resource->getLocation() << "\n";



    emergencyManager.updateEmergencyStatus(

        emergency.getEmergencyId(),

        EmergencyStatus::InProgress);



    cout << "Emergency Status: IN PROGRESS\n";

    displayAutomaticRoute(cityGraph, resource->getLocation(),
                          emergency.getLocation(), emergency.getEmergencyId());



    break;

}



            // Display all resources

            case 7:

            {

                resourceManager.displayAllResources();

                break;

            }



            // Release resource by ID



case 8:

{

    int resourceId;



    cout << "Enter Resource ID to release: ";



    if (!(cin >> resourceId))

    {

        cout << "Invalid Resource ID.\n";

        cin.clear();

        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        break;

    }



    if (!resourceManager.releaseResource(resourceId))

    {

        cout << "\nResource not found or is already AVAILABLE.\n";

        break;

    }



    cout << "\nResource released successfully.\n";

    cout << "Resource is now AVAILABLE.\n";



    // Rebuild the priority queue using eligible emergencies

    priorityManager.clearQueue();



    const vector<Emergency>& emergencies =

        emergencyManager.getEmergencies();



    for (const Emergency& emergency : emergencies)

    {

        if (emergency.getStatus() == EmergencyStatus::Reported ||

            emergency.getStatus() == EmergencyStatus::Pending)

        {

            priorityManager.addEmergency(emergency);

        }

    }



    cout << "\nChecking pending emergencies in priority order...\n";



    int assignedCount = 0;



    while (!priorityManager.isEmpty())

    {

        Emergency emergency =

            priorityManager.getHighestPriorityEmergency();



        string required = emergency.getRequiredResource();

        ResourceType resourceType;



        if (required == "Ambulance")

            resourceType = ResourceType::Ambulance;

        else if (required == "Fire Truck")

            resourceType = ResourceType::FireTruck;

        else if (required == "Police Vehicle")

            resourceType = ResourceType::PoliceVehicle;

        else if (required == "Rescue Team")

            resourceType = ResourceType::RescueTeam;

        else

        {

            cout << "Unknown resource type for Emergency "

                 << emergency.getEmergencyId() << ".\n";

            continue;

        }



        RouteResult selectedRoute{};
        Resource* resource = findNearestAvailableResource(
            resourceManager, cityGraph, resourceType,
            emergency.getLocation(), selectedRoute);



        if (resource == nullptr)

        {

            cout << "Emergency " << emergency.getEmergencyId()

                 << " remains PENDING: no available "

                 << required << ".\n";

            continue;

        }



        // Allocate resource and update emergency status

        resource->setStatus(ResourceStatus::Busy);



        emergencyManager.updateEmergencyStatus(

            emergency.getEmergencyId(),

            EmergencyStatus::ResourceAssigned);



        cout << "\nEmergency automatically assigned!\n";

        cout << "Emergency ID : "

             << emergency.getEmergencyId() << "\n";

        cout << "Severity     : "

             << emergency.getSeverityScore() << "\n";

        cout << "Resource ID  : "

             << resource->getResourceId() << "\n";

        cout << "Resource     : " << required << "\n";

        cout << "Location     : "

             << resource->getLocation() << "\n";

        cout << "Status       : RESOURCE ASSIGNED\n";

        displayAutomaticRoute(cityGraph, resource->getLocation(),
                              emergency.getLocation(), emergency.getEmergencyId());



        assignedCount++;

    }



    cout << "\n========================================\n";

    cout << "Automatic retry completed.\n";

    cout << "Emergencies assigned: " << assignedCount << "\n";

    cout << "========================================\n";



    break;

}





            // Display the registered road network
            case 9:
            {
                cityGraph.displayNetwork();
                break;
            }

            // Exit
            case 10:
            {
                cout << "\nExiting Smart Emergency Response System.\n";
                cout << "Thank you!\n";
                break;
            }

            default:

            {

                cout << "\nInvalid choice. Please select 1 to 10.\n";

            }

        }



    } while (choice != 10);



    return 0;

}
