#include "Resource.h"

#include <iostream>

using namespace std;

// ==========================================
// DEFAULT CONSTRUCTOR
// ==========================================

Resource::Resource()
{
    resourceId = 0;
    type = ResourceType::Ambulance;
    location = "";
    status = ResourceStatus::Available;
}


// ==========================================
// PARAMETERIZED CONSTRUCTOR
// ==========================================

Resource::Resource(
    int id,
    ResourceType resourceType,
    const string& resourceLocation,
    ResourceStatus resourceStatus
)
{
    resourceId = id;
    type = resourceType;
    location = resourceLocation;
    status = resourceStatus;
}


// ==========================================
// GETTERS
// ==========================================

int Resource::getResourceId() const
{
    return resourceId;
}

ResourceType Resource::getType() const
{
    return type;
}

string Resource::getLocation() const
{
    return location;
}

ResourceStatus Resource::getStatus() const
{
    return status;
}


// ==========================================
// SETTER
// ==========================================

void Resource::setStatus(ResourceStatus newStatus)
{
    status = newStatus;
}


// ==========================================
// DISPLAY RESOURCE
// ==========================================

void Resource::display() const
{
    cout << "\n";
    cout << "========================================\n";
    cout << "          RESOURCE INFORMATION\n";
    cout << "========================================\n";

    cout << "Resource ID : "
         << resourceId << "\n";

    cout << "Type        : ";

    switch (type)
    {
        case ResourceType::Ambulance:
            cout << "Ambulance";
            break;

        case ResourceType::FireTruck:
            cout << "Fire Truck";
            break;

        case ResourceType::PoliceVehicle:
            cout << "Police Vehicle";
            break;

        case ResourceType::RescueTeam:
            cout << "Rescue Team";
            break;
    }

    cout << "\n";

    cout << "Location    : "
         << location << "\n";

    cout << "Status      : ";

    if (status == ResourceStatus::Available)
    {
        cout << "AVAILABLE\n";
    }
    else
    {
        cout << "BUSY\n";
    }

    cout << "========================================\n";
}