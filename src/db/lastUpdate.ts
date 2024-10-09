import { PhmnStats } from "../onchain-data/phmnStats";

const lastUpdate = {
    phmnStats: undefined as PhmnStats|undefined,
    lastUpdateTime: undefined as Date|undefined,
}

const getPhmnStatByField = (fieldName: string) => {
    return lastUpdate.phmnStats?.phmnStatsPoint.fields.find(
        field => field.name === fieldName
    )?.value
}

export const setLastPhmnStats = (phmnStats: PhmnStats) => {
    lastUpdate.phmnStats = phmnStats
    lastUpdate.lastUpdateTime = new Date()
}

export const getLastPhmnPrices = () => {
    return {
        lastUpdateTime: lastUpdate.lastUpdateTime,
        phmnPrice: getPhmnStatByField('phmn_price_avg'),
        osmoPerPhmn: getPhmnStatByField('osmo_per_phmn_osmo'),
        atomPerPhmn: getPhmnStatByField('atom_per_phmn_osmo'),
        weirdPerPhmn: getPhmnStatByField('WEIRD_per_phmn_osmosis_pool_1776'),
        sinPerWeird: getPhmnStatByField('SIN_per_WEIRD_osmosis_pool_2210'),
    }
}