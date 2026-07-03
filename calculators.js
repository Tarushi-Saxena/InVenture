/**
 * Inventure Calculators Engine
 * Handles Burn Rate & Runway calculations and Cap Table & Dilution Modeling (including Option Pools and SAFEs).
 */

const Calculators = {
    /**
     * Calculates Burn Rate, Runway and Funding Requirements
     */
    calculateRunway(currentCash, monthlyRevenue, monthlyExpenses, desiredRunwayMonths) {
        const monthlyBurnRate = Math.max(0, monthlyExpenses - monthlyRevenue);
        const monthsOfRunway = monthlyBurnRate > 0 ? (currentCash / monthlyBurnRate) : Infinity;
        
        let fundingNeeded = 0;
        if (monthlyBurnRate > 0 && monthsOfRunway < desiredRunwayMonths) {
            fundingNeeded = (desiredRunwayMonths - monthsOfRunway) * monthlyBurnRate;
        }

        return {
            monthlyBurnRate,
            monthsOfRunway: isFinite(monthsOfRunway) ? parseFloat(monthsOfRunway.toFixed(1)) : 'Infinity',
            fundingNeeded
        };
    },

    /**
     * Models a funding round with existing cap table, new investment, option pool top-up, and SAFE conversions.
     * 
     * @param {Array} existingCapTable - List of { name, shares, isFounder }
     * @param {Object} roundData - { preMoneyValuation, investmentAmount, optionPoolPercent, optionPoolTiming, safes }
     */
    modelFundingRound(existingCapTable, roundData) {
        const preMoneyValuation = parseFloat(roundData.preMoneyValuation) || 0;
        const investmentAmount = parseFloat(roundData.investmentAmount) || 0;
        const optionPoolPercent = (parseFloat(roundData.optionPoolPercent) || 0) / 100; // e.g. 10% -> 0.10
        const optionPoolTiming = roundData.optionPoolTiming || 'pre-money'; // 'pre-money' (dilutes founders) or 'post-money' (dilutes all)
        const safes = roundData.safes || []; // List of { name, investment, cap, discount }

        // Calculate basic post-money valuation
        const postMoneyValuation = preMoneyValuation + investmentAmount;

        // Calculate total pre-round shares from cap table
        let totalPreRoundShares = existingCapTable.reduce((sum, member) => sum + (parseFloat(member.shares) || 0), 0);
        if (totalPreRoundShares === 0) {
            totalPreRoundShares = 1000000; // default if cap table is empty
        }

        // Before Round structure (normalized)
        const beforeRound = existingCapTable.map(member => ({
            name: member.name,
            shares: parseFloat(member.shares) || 0,
            percent: ((parseFloat(member.shares) || 0) / totalPreRoundShares) * 100,
            isFounder: !!member.isFounder
        }));

        // 1. SAFEs Conversion Math
        // We need to calculate the share price for the priced round.
        // Standard Price Per Share (un-diluted) = Pre-Money Valuation / Total Pre-Round Shares
        let baseSharePrice = preMoneyValuation / totalPreRoundShares;
        
        let safeSharesTotal = 0;
        const safeDetails = [];

        // Calculate conversion for each SAFE
        safes.forEach(safe => {
            const investment = parseFloat(safe.investment) || 0;
            const cap = parseFloat(safe.cap) || 0;
            const discount = (parseFloat(safe.discount) || 0) / 100; // e.g. 20% discount -> 0.20

            let safeConversionPrice = baseSharePrice;

            // Apply cap price if cap exists
            if (cap > 0) {
                // Pre-money vs Post-money SAFE cap math
                const capPrice = cap / totalPreRoundShares;
                safeConversionPrice = Math.min(safeConversionPrice, capPrice);
            }

            // Apply discount if discount exists
            if (discount > 0) {
                const discountPrice = baseSharePrice * (1 - discount);
                safeConversionPrice = Math.min(safeConversionPrice, discountPrice);
            }

            // Shares issued to SAFE holder
            const sharesIssued = safeConversionPrice > 0 ? (investment / safeConversionPrice) : 0;
            safeSharesTotal += sharesIssued;

            safeDetails.push({
                name: safe.name,
                investment,
                conversionPrice: safeConversionPrice,
                shares: sharesIssued
            });
        });

        // 2. Option Pool Math
        // Total shares before new investor but including SAFEs & Option Pool Top-up
        let preRoundSharesWithSafes = totalPreRoundShares + safeSharesTotal;
        let optionPoolShares = 0;

        let totalPostRoundShares = 0;
        let newInvestorShares = 0;

        if (optionPoolPercent > 0) {
            if (optionPoolTiming === 'pre-money') {
                // Dilutes founders more. Option pool is created in the pre-money.
                const investorPercent = investmentAmount / postMoneyValuation;
                totalPostRoundShares = preRoundSharesWithSafes / (1 - investorPercent - optionPoolPercent);
                newInvestorShares = totalPostRoundShares * investorPercent;
                optionPoolShares = totalPostRoundShares * optionPoolPercent;
            } else {
                // Post-money option pool: dilutes everyone.
                const investorPercent = investmentAmount / postMoneyValuation;
                const intermediateShares = preRoundSharesWithSafes / (1 - investorPercent);
                totalPostRoundShares = intermediateShares / (1 - optionPoolPercent);
                newInvestorShares = totalPostRoundShares * investorPercent * (1 - optionPoolPercent);
                optionPoolShares = totalPostRoundShares * optionPoolPercent;
            }
        } else {
            // No option pool
            const investorPercent = investmentAmount / postMoneyValuation;
            totalPostRoundShares = preRoundSharesWithSafes / (1 - investorPercent);
            newInvestorShares = totalPostRoundShares * investorPercent;
        }

        // Final share price based on actual post-round valuation and total post-round shares
        const postRoundSharePrice = postMoneyValuation / totalPostRoundShares;

        // Build Post-Round Cap Table
        const afterRound = [];

        // Existing shareholders (diluted)
        existingCapTable.forEach(member => {
            const shares = parseFloat(member.shares) || 0;
            afterRound.push({
                name: member.name,
                shares: shares,
                percent: (shares / totalPostRoundShares) * 100,
                isFounder: !!member.isFounder,
                type: 'Existing'
            });
        });

        // SAFEs conversions
        safeDetails.forEach(safe => {
            if (safe.shares > 0) {
                afterRound.push({
                    name: safe.name + ' (SAFE)',
                    shares: safe.shares,
                    percent: (safe.shares / totalPostRoundShares) * 100,
                    isFounder: false,
                    type: 'SAFE'
                });
            }
        });

        // Option Pool
        if (optionPoolShares > 0) {
            afterRound.push({
                name: 'New Option Pool',
                shares: optionPoolShares,
                percent: (optionPoolShares / totalPostRoundShares) * 100,
                isFounder: false,
                type: 'Option Pool'
            });
        }

        // New Investor
        if (newInvestorShares > 0) {
            afterRound.push({
                name: 'New Investor',
                shares: newInvestorShares,
                percent: (newInvestorShares / totalPostRoundShares) * 100,
                isFounder: false,
                type: 'New Investor'
            });
        }

        return {
            preMoneyValuation,
            investmentAmount,
            postMoneyValuation,
            totalPreRoundShares,
            totalPostRoundShares,
            postRoundSharePrice,
            beforeRound,
            afterRound,
            safeDetails,
            optionPoolShares
        };
    }
};

// Export to window object for frontend SPA usage
if (typeof window !== 'undefined') {
    window.Calculators = Calculators;
}
