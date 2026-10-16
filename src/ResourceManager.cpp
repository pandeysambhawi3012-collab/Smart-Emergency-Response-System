#include "ResourceManager.h"

#include <iostream>

using namespace std;


// ==========================================
// ADD RESOURCE
// ==========================================

void ResourceManager::addResource(
    const Resource& resource
)
{
    resources.push_back(resource);

    cout << "\nResource added successfully.\n";
}


// ==========================================
// DISPLAY ALL RESOURCES
// ==========================================

void ResourceManager::displayAllResources() const
{
    if (resources.empty())
    {
        cout << "\nNo resources available.\n";
        return;
    }

    cout << "\n========================================\n";
    cout << "          ALL RESOURCES\n";
    cout << "========================================\n";

    for (const Resource& resource : resources)
    {
        resource.display();
    }
}


// ==========================================
// FIND AVAILABLE RESOURCE
// ==========================================

Resource* ResourceManager::findAvailableResource(
    ResourceType type
)
{
    for (Resource& resource : resources)
    {
        if (resource.getType() == type &&
            resource.getStatus() == ResourceStatus::Available)
        {
            return &resource;
        }
    }

    return nullptr;
}


// ==========================================
// ALLOCATE RESOURCE
// ==========================================

bool ResourceManager::allocateResource(
    ResourceType type
)
{
    Resource* resource =
        findAvailableResource(type);

    if (resource == nullptr)
    {
        return false;
    }

    resource->setStatus(
        ResourceStatus::Busy
    );

    return true;
}


// ==========================================
// RELEASE RESOURCE
// ==========================================

bool ResourceManager::releaseResource(
    int resourceId
)
{
    for (Resource& resource : resources)
    {
        if (resource.getResourceId() == resourceId)
        {
            if (resource.getStatus() ==
                ResourceStatus::Available)
            {
                return false;
            }

            resource.setStatus(
                ResourceStatus::Available
            );

            return true;
        }
    }

    return false;
}


// ==========================================
// GET RESOURCE COUNT
// ==========================================

int ResourceManager::getResourceCount() const
{
    return static_cast<int>(
        resources.size()
    );
}
std::vector<Resource>& ResourceManager::getResources()
{
    return resources;
}