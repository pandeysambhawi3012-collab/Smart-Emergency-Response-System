#include <iostream>
#include <vector>

#include "EmergencyManager.h"
#include "PriorityManager.h"
#include "ResourceManager.h"

using namespace std;

int main()
{
    EmergencyManager emergencyManager;
    PriorityManager priorityManager;
    ResourceManager resourceManager;


    // ==================================
    // INITIALIZE RESOURCES
    // ==================================

    resourceManager.addResource(
        Resource(
            101,
            ResourceType::Ambulance,
            "Hospital",
            ResourceStatus::Available
        )
    );

    resourceManager.addResource(
        Resource(
            102,
            ResourceType::Ambulance,
            "ISBT",
            ResourceStatus::Available
        )
    );

    resourceManager.addResource(
        Resource(
            201,
            ResourceType::FireTruck,
            "Fire Station",
            ResourceStatus::Available
        )
    );

    resourceManager.addResource(
        Resource(
            301,
            ResourceType::PoliceVehicle,
            "Police Station",
            ResourceStatus::Available
        )
    );

    resourceManager.addResource(
        Resource(
            401,
            ResourceType::RescueTeam,
            "Rescue Center",
            ResourceStatus::Available
        )
    );


    int choice;

    do
    {
        cout << "\n\n";
        cout << "========================================\n";
        cout << "   SMART EMERGENCY RESPONSE SYSTEM\n";
        cout << "========================================\n";

        cout << "1. Register Emergency\n";
        cout << "2. View All Emergencies\n";
        cout << "3. Search Emergency\n";
        cout << "4. Add Emergencies to Priority Queue\n";
        cout << "5. View Priority Queue\n";
        cout << "6. Process Highest Priority Emergency\n";
        cout << "7. View Resources\n";
        cout << "8. Exit\n";

        cout << "========================================\n";
        cout << "Enter your choice: ";

        cin >> choice;

        switch (choice)
        {
            // ==================================
            // 1. REGISTER EMERGENCY
            // ==================================

            case 1:
            {
                emergencyManager.registerEmergency();
                break;
            }


            // ==================================
            // 2. VIEW ALL EMERGENCIES
            // ==================================

            case 2:
            {
                emergencyManager.displayAllEmergencies();
                break;
            }


            // ==================================
            // 3. SEARCH EMERGENCY
            // ==================================

            case 3:
            {
                int id;

                cout << "\nEnter Emergency ID: ";
                cin >> id;

                emergencyManager.displayEmergency(id);

                break;
            }


            // ==================================
            // 4. ADD TO PRIORITY QUEUE
            // ==================================

            case 4:
            {
                // Clear old queue first
                priorityManager.clearQueue();

                // Get all registered emergencies
                const vector<Emergency>& emergencies =
                    emergencyManager.getEmergencies();

                if (emergencies.empty())
                {
                    cout << "\nNo emergencies registered.\n";
                }
                else
                {
                    // Add every emergency to priority queue
                    for (const Emergency& emergency : emergencies)
                    {
                        priorityManager.addEmergency(emergency);
                    }

                    cout << "\n"
                         << emergencies.size()
                         << " emergencies added to priority queue.\n";
                }

                break;
            }


            // ==================================
            // 5. VIEW PRIORITY QUEUE
            // ==================================

            case 5:
            {
                priorityManager.displayPriorityQueue();

                break;
            }


            // ==================================
            // 6. PROCESS HIGHEST PRIORITY
            // ==================================

           // ==================================
// 6. PROCESS HIGHEST PRIORITY
// ==================================

case 6:
{
    if (priorityManager.isEmpty())
    {
        cout << "\nPriority queue is empty.\n";
        cout << "Please add emergencies to the "
             << "priority queue first.\n";
    }
    else
    {
        // Get the highest-priority emergency
        Emergency emergency =
            priorityManager.getHighestPriorityEmergency();

        cout << "\n========================================\n";
        cout << "   HIGHEST PRIORITY EMERGENCY\n";
        cout << "========================================\n";

        emergency.display();

        // Check which resource is required
        string requiredResource =
            emergency.getRequiredResource();

        ResourceType resourceType;

        if (requiredResource == "Ambulance")
        {
            resourceType = ResourceType::Ambulance;
        }
        else if (requiredResource == "Fire Truck")
        {
            resourceType = ResourceType::FireTruck;
        }
        else if (requiredResource == "Police Vehicle")
        {
            resourceType = ResourceType::PoliceVehicle;
        }
        else if (requiredResource == "Rescue Team")
        {
            resourceType = ResourceType::RescueTeam;
        }
        else
        {
            cout << "\nUnknown resource type.\n";
            break;
        }

        // Try to allocate the required resource
        Resource* resource =
            resourceManager.findAvailableResource(resourceType);

        if (resource == nullptr)
        {
            cout << "\nNo available "
                 << requiredResource
                 << " found.\n";

            cout << "Emergency remains pending.\n";
        }
        else
        {
            // Allocate resource
            resource->setStatus(
                ResourceStatus::Busy
            );

            // Update original emergency
            emergencyManager.updateEmergencyStatus(
                emergency.getEmergencyId(),
                EmergencyStatus::ResourceAssigned
            );

            cout << "\n========================================\n";
            cout << "       RESOURCE ALLOCATED\n";
            cout << "========================================\n";

            cout << "Emergency ID : "
                 << emergency.getEmergencyId()
                 << "\n";

            cout << "Resource     : "
                 << requiredResource
                 << "\n";

            cout << "Resource ID  : "
                 << resource->getResourceId()
                 << "\n";

            cout << "Location     : "
                 << resource->getLocation()
                 << "\n";

            cout << "Status       : BUSY\n";

            cout << "========================================\n";

            cout << "\nEmergency status updated to "
                 << "Resource Assigned.\n";
        }

        cout << "\nEmergency has been removed "
             << "from the priority queue.\n";
    }

    break;
}

            // ==================================
            // 7. VIEW RESOURCES
            // ==================================

            case 7:
            {
                resourceManager.displayAllResources();

                break;
            }


            // ==================================
            // 8. EXIT
            // ==================================

            case 8:
            {
                cout << "\nExiting Smart Emergency Response System...\n";
                cout << "Thank you!\n";

                break;
            }


            // ==================================
            // INVALID CHOICE
            // ==================================

            default:
            {
                cout << "\nInvalid choice.\n";
                cout << "Please enter a number between 1 and 8.\n";
            }
        }

    }
    while (choice != 8);

    return 0;
}