#ifndef RESOURCE_H
#define RESOURCE_H

#include <string>

enum class ResourceType
{
    SmallAmbulance,   // Capacity: 2 patients (Basic Life Support)
    LargeAmbulance,   // Capacity: 6 patients (Mass Casualty / Advanced Life Support)
    FireTruck,
    PoliceVehicle,
    RescueTeam
};

enum class ResourceStatus
{
    Available,
    Busy
};

class Resource
{
private:
    int resourceId;
    ResourceType type;
    std::string location;
    ResourceStatus status;
    int capacity; // Maximum patient/crew capacity

public:
    Resource();

    Resource(
        int id,
        ResourceType resourceType,
        const std::string& resourceLocation,
        ResourceStatus resourceStatus,
        int cap = 2
    );

    int getResourceId() const;
    ResourceType getType() const;
    std::string getLocation() const;
    ResourceStatus getStatus() const;
    int getCapacity() const;

    void setStatus(ResourceStatus newStatus);
    void setCapacity(int cap);

    void display() const;
};

#endif