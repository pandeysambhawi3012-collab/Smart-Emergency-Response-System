#ifndef SEVERITY_CALCULATOR_H
#define SEVERITY_CALCULATOR_H

#include "Emergency.h"

class SeverityCalculator
{
public:

    static int calculateScore(const Emergency& emergency);

    static std::string classifySeverity(int score);

private:

    static int calculatePeopleScore(int peopleAffected);
    static int calculateInjuryScore(int injurySeverity);
    static int calculateRiskScore(int riskLevel);
    static int calculateTypeScore(EmergencyType type);
};

#endif