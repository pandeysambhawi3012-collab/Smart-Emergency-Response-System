#include <iostream>

#include "Resource.h"
#include "ResourceManager.h"

using namespace std;

int main()
{
    ResourceManager manager;

    manager.addResource(
        Resource(
            101,
            ResourceType::Ambulance,
            "Hospital",
            ResourceStatus::Available
        )
    );

    manager.addResource(
        Resource(
            102,
            ResourceType::Ambulance,
            "ISBT",
            ResourceStatus::Busy
        )
    );

    manager.addResource(
        Resource(
            201,
            ResourceType::FireTruck,
            "Fire Station",
            ResourceStatus::Available
        )
    );

    manager.addResource(
        Resource(
            301,
            ResourceType::PoliceVehicle,
            "Police Station",
            ResourceStatus::Available
        )
    );


    manager.displayAllResources();

    Resource* ambulance =
        manager.findAvailableResource(
            ResourceType::Ambulance
        );

    if (ambulance != nullptr)
    {
        cout << "\nAvailable Ambulance Found: "
             << ambulance->getResourceId()
             << endl;
    }
    else
    {
        cout << "\nNo ambulance available.\n";
    }

    bool allocated =
        manager.allocateResource(
            ResourceType::Ambulance
        );

    if (allocated)
    {
        cout << "\nAmbulance allocated successfully.\n";
    }
    else
    {
        cout << "\nNo ambulance available for allocation.\n";
    }

    manager.displayAllResources();

    bool released =
        manager.releaseResource(101);

    if (released)
    {
        cout << "\nAmbulance released successfully.\n";
    }
    else
    {
        cout << "\nAmbulance could not be released.\n";
    }

    manager.displayAllResources();

    return 0;
}