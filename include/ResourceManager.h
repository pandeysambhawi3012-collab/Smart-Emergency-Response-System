#ifndef RESOURCE_MANAGER_H
#define RESOURCE_MANAGER_H

#include <vector>
#include "Resource.h"

class ResourceManager
{
private:
    std::vector<Resource> resources;

public:
    void addResource(const Resource& resource);

    void displayAllResources() const;

    Resource* findAvailableResource(ResourceType type);

    bool allocateResource(ResourceType type);

    bool releaseResource(int resourceId);

    int getResourceCount() const;
};

#endif