#ifndef SEVERITY_CALCULATOR_H
#define SEVERITY_CALCULATOR_H

#include "Emergency.h"

class SeverityCalculator
{
public:

    // Calculate the complete severity score
    static int calculateScore(const Emergency& emergency);

    // Convert score into a severity level
    static std::string classifySeverity(int score);

private:

    // Calculate individual factor scores
    static int calculatePeopleScore(int peopleAffected);
    static int calculateInjuryScore(int injurySeverity);
    static int calculateRiskScore(int riskLevel);
    static int calculateTypeScore(EmergencyType type);
};

#endif