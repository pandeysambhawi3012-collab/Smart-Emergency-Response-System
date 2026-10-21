#include "Emergency.h"

#include <iostream>

Emergency::Emergency()
{
    emergencyId = 0;

    type = EmergencyType::Other;
    location = "";

    peopleAffected = 0;
    injurySeverity = 0;
    riskLevel = 0;

    timeReported = "";
    requiredResource = "";

    severityScore = 0;
    severityLevel = "Not Calculated";
    priority = "Not Calculated";

    status = EmergencyStatus::Reported;
}


Emergency::Emergency(
    int id,
    EmergencyType emergencyType,
    const std::string& emergencyLocation,
    int affected,
    int injury,
    int risk,
    const std::string& time,
    const std::string& resource
)
{
    emergencyId = id;

    type = emergencyType;
    location = emergencyLocation;

    peopleAffected = affected;
    injurySeverity = injury;
    riskLevel = risk;

    timeReported = time;
    requiredResource = resource;

    severityScore = 0;
    severityLevel = "Not Calculated";

    // Priority will be implemented in a later phase
    priority = "Not Calculated";

    status = EmergencyStatus::Reported;
}


// ==========================================
// GETTERS
// ==========================================

int Emergency::getEmergencyId() const
{
    return emergencyId;
}


EmergencyType Emergency::getType() const
{
    return type;
}


std::string Emergency::getLocation() const
{
    return location;
}


int Emergency::getPeopleAffected() const
{
    return peopleAffected;
}


int Emergency::getInjurySeverity() const
{
    return injurySeverity;
}


int Emergency::getRiskLevel() const
{
    return riskLevel;
}


std::string Emergency::getTimeReported() const
{
    return timeReported;
}


std::string Emergency::getRequiredResource() const
{
    return requiredResource;
}


int Emergency::getSeverityScore() const
{
    return severityScore;
}


std::string Emergency::getSeverityLevel() const
{
    return severityLevel;
}


std::string Emergency::getPriority() const
{
    return priority;
}


EmergencyStatus Emergency::getStatus() const
{
    return status;
}


void Emergency::setSeverityScore(int score)
{
    severityScore = score;
}


void Emergency::setSeverityLevel(const std::string& level)
{
    severityLevel = level;
}


void Emergency::setPriority(const std::string& priorityLevel)
{
    priority = priorityLevel;
}


void Emergency::setStatus(EmergencyStatus newStatus)
{
    status = newStatus;
}


void Emergency::display() const
{
    std::cout << "\n";
    std::cout << "========================================\n";
    std::cout << "        EMERGENCY INFORMATION\n";
    std::cout << "========================================\n";

    std::cout << "Emergency ID      : "
              << emergencyId << "\n";

    std::cout << "Location          : "
              << location << "\n";

    std::cout << "People Affected   : "
              << peopleAffected << "\n";

    std::cout << "Injury Severity   : "
              << injurySeverity << "/10\n";

    std::cout << "Risk Level        : "
              << riskLevel << "/10\n";

    std::cout << "Time Reported     : "
              << timeReported << "\n";

    std::cout << "Required Resource : "
              << requiredResource << "\n";

    std::cout << "Severity Score    : "
              << severityScore << "\n";

    std::cout << "Severity Level    : "
              << severityLevel << "\n";

    std::cout << "Priority          : "
              << priority << "\n";

    std::cout << "Status            : ";

switch (status)
{
    case EmergencyStatus::Reported:
        std::cout << "Reported";
        break;

    case EmergencyStatus::Pending:
        std::cout << "Pending";
        break;

    case EmergencyStatus::ResourceAssigned:
        std::cout << "Resource Assigned";
        break;

    case EmergencyStatus::InProgress:
        std::cout << "In Progress";
        break;

    case EmergencyStatus::Resolved:
        std::cout << "Resolved";
        break;
}

std::cout << "\n";

    std::cout << "========================================\n";
}