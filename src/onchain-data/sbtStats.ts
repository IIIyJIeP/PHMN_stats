import { denomIDs } from './omniflix/sbtConfig.json'
import { getLcdCollectionInfo } from './omniflix/omniflixLcdRequests'
import { WritePoint } from "../db/ifluxdb"

const { SBT_COLLECTION_DENOM_ID } = denomIDs

interface GroupedData {
    [key: string]: {
        epoch: string,
        type: "common" | "bronze" | "silver" | "gold" | "platinum" | "brilliant" | "total",
        sbtCount: number,
        owners: Set<string>,
    }
}

export async function getSbtStats(): Promise<WritePoint[]> {
    try {
        const sbtInfo = await getLcdCollectionInfo(SBT_COLLECTION_DENOM_ID)
        const date = new Date(Date.now())
        
        const grouped = sbtInfo.reduce((acc: GroupedData, item) => {
            const key = `${item.epoch}-${item.type}`
            const all = `All-${item.type}`
            if (!acc[all]) {
                acc[all] = {
                    epoch: 'All',
                    type: item.type,
                    sbtCount: 0,
                    owners: new Set(),
                }
            }
            if (!acc[key]) {
                acc[key] = {
                    epoch: item.epoch,
                    type: item.type,
                    sbtCount: 0,
                    owners: new Set(),
                }
            }
            acc[key].sbtCount++
            acc[key].owners.add(item.owner)
            acc[all].sbtCount++
            acc[all].owners.add(item.owner)
            return acc
        }, {} as GroupedData)
        
        const groupedTotal = sbtInfo.reduce((acc: GroupedData, item) => {
            if (!acc['All']) {
                acc['All'] = {
                    epoch: 'All',
                    type: 'total',
                    sbtCount: 0,
                    owners: new Set(),
                }
            }
            if (!acc[item.epoch]) {
                acc[item.epoch] = {
                    epoch: item.epoch,
                    type: 'total',
                    sbtCount: 0,
                    owners: new Set(),
                }
            }
            acc[item.epoch].sbtCount++
            acc[item.epoch].owners.add(item.owner)
            acc['All'].sbtCount++
            acc['All'].owners.add(item.owner)
            return acc
        }, {} as GroupedData)

        return [
            ...Object.values(grouped).map(group => ({
                measurement: 'posthuman_sbt_by_type',
                time: date,
                tags: [
                    { name: 'epoch', value: group.epoch },
                    { name: 'type', value: group.type },
                ],
                fields: [
                    { name: 'sbt_count', value: group.sbtCount },
                    { name: 'owners_count', value: group.owners.size },
                ],
            })),
            ...Object.values(groupedTotal).map(group => ({
                measurement: 'posthuman_sbt_total',
                time: date,
                tags: [
                    { name: 'epoch', value: group.epoch },
                    { name: 'type', value: group.type },
                ],
                fields: [
                    { name: 'sbt_count', value: group.sbtCount },
                    { name: 'owners_count', value: group.owners.size },
                ],
            })),
        ]
    } catch(e) {
        console.error(e)
        return []
    }
}