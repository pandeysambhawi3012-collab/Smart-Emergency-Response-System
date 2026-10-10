#ifndef RESOURCE_H
#define RESOURCE_H

#include <string>

enum class ResourceType
{
    Ambulance,
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

public:
    Resource();

    Resource(
        int id,
        ResourceType resourceType,
        const std::string& resourceLocation,
        ResourceStatus resourceStatus
    );

    int getResourceId() const;
    ResourceType getType() const;
    std::string getLocation() const;
    ResourceStatus getStatus() const;

    void setStatus(ResourceStatus newStatus);

    void display() const;
};

#endif