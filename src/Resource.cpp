#include "Resource.h"
#include <iostream>

using namespace std;

// ==========================================
// DEFAULT CONSTRUCTOR
// ==========================================
Resource::Resource()
{
    resourceId = 0;
    type = ResourceType::SmallAmbulance;
    location = "";
    status = ResourceStatus::Available;
    capacity = 2;
}

// ==========================================
// PARAMETERIZED CONSTRUCTOR
// ==========================================
Resource::Resource(
    int id,
    ResourceType resourceType,
    const string& resourceLocation,
    ResourceStatus resourceStatus,
    int cap
)
{
    resourceId = id;
    type = resourceType;
    location = resourceLocation;
    status = resourceStatus;
    capacity = cap;
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

int Resource::getCapacity() const
{
    return capacity;
}

// ==========================================
// SETTERS
// ==========================================
void Resource::setStatus(ResourceStatus newStatus)
{
    status = newStatus;
}

void Resource::setCapacity(int cap)
{
    capacity = cap;
}

// ==========================================
// DISPLAY
// ==========================================
void Resource::display() const
{
    cout << "\n========================================\n";
    cout << "          RESOURCE INFORMATION\n";
    cout << "========================================\n";
    cout << "Resource ID : " << resourceId << "\n";
    cout << "Type        : ";

    switch (type)
    {
        case ResourceType::SmallAmbulance:
            cout << "Small Ambulance (Capacity: " << capacity << " patients)";
            break;
        case ResourceType::LargeAmbulance:
            cout << "Large Ambulance (Capacity: " << capacity << " patients)";
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

    cout << "\nLocation    : " << location << "\n";
    cout << "Status      : " << (status == ResourceStatus::Available ? "AVAILABLE" : "BUSY") << "\n";
    cout << "========================================\n";
}