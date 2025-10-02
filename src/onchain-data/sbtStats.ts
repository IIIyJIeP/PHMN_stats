import { denomIDs } from './omniflix/nftConfig.json'
import { spheresIDs } from './omniflix/spheresConfig.json'
import { getAvatarsCollectionInfo, getLcdCollectionInfo, SpheresType } from './omniflix/omniflixLcdRequests'
import { WritePoint } from "../db/ifluxdb"
import { getSpheresInfo } from './omniflix/omniflixApiRequests'

const { SBT_COLLECTION_DENOM_ID, AVATARS_COLLECTION_DENOM_ID } = denomIDs

interface GroupedData {
    [key: string]: {
        epoch: string,
        type: "common" | "bronze" | "silver" | "gold" | "platinum" | "brilliant" | "total",
        sbtCount: number,
        owners: Set<string>,
    }
}

interface GroupedAvatars {
    [key: string]: {
        type: "common" | "bronze" | "silver" | "gold" | "platinum" | "brilliant",
        nftCount: number,
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

export async function getSpheresStats(): Promise<WritePoint[]> {
    try {
        const date = new Date(Date.now())
        const result: WritePoint[] = []

        for (let type in spheresIDs) {
            const spheresInfo = await getSpheresInfo(spheresIDs[type as SpheresType])
            result.push({
                measurement: 'spheres',
                time: date,
                tags: [
                    { name: 'type', value: type },
                ],
                fields: [
                    { name: 'total_nfts', value: spheresInfo.total_nfts },
                    { name: 'unique_owners', value: spheresInfo.unique_owners },
                    { name: 'total_listed_nft', value: spheresInfo.total_listed_nft },
                    { name: 'floor_price_in_usd', value: spheresInfo.floor_price_in_usd },
                    { name: 'trade_volume_in_usd', value: spheresInfo.trade_volume_in_usd },
                ],
            })
        }
        return result
    } catch(e) {
        console.error(e)
        return []
    }
}

export async function getAvatarCollectionStats(): Promise<WritePoint[]> {
    try {
        const nftInfo = await getAvatarsCollectionInfo(AVATARS_COLLECTION_DENOM_ID)
        const collectionInfo = await getSpheresInfo(AVATARS_COLLECTION_DENOM_ID)
        
        const date = new Date(Date.now())
        const cemetery = nftInfo.filter((avatar)=>avatar.owner === 'omniflix1s3achxs70ysg8pf9xqyytu0m4had60khvw2e8h')
        const liveAvatars = nftInfo.filter((avatar)=>avatar.owner !== 'omniflix1s3achxs70ysg8pf9xqyytu0m4had60khvw2e8h')
        
        const groupedCemetery = cemetery.reduce((acc: GroupedAvatars, item) => {
            const key = item.type
            if (!acc[key]) {
                acc[key] = {
                    type: item.type,
                    nftCount: 0,
                    owners: new Set(),
                }
                acc[key].owners.add(item.owner)
            }
            acc[key].nftCount++
            return acc
        }, {} as GroupedAvatars)

        const groupedLiveAvatars = liveAvatars.reduce((acc: GroupedAvatars, item) => {
            const key = item.type
            if (!acc[key]) {
                acc[key] = {
                    type: item.type,
                    nftCount: 0,
                    owners: new Set(),
                }
            }
            acc[key].nftCount++
            acc[key].owners.add(item.owner)
            return acc
        }, {} as GroupedAvatars)
        
        return [
            ...Object.values(groupedLiveAvatars).map(group => ({
                measurement: 'posthuman_live_avatars_by_type',
                time: date,
                tags: [
                    { name: 'type', value: group.type },
                ],
                fields: [
                    { name: 'nft_count', value: group.nftCount },
                    { name: 'owners_count', value: group.owners.size },
                ],
            })),
            ...Object.values(groupedCemetery).map(group => ({
                measurement: 'posthuman_avatars_cemetery',
                time: date,
                tags: [
                    { name: 'type', value: group.type },
                ],
                fields: [
                    { name: 'nft_count', value: group.nftCount },
                ],
            })),
            {
                measurement: 'posthuman_avatars',
                time: date,
                tags: [],
                fields: [
                    { name: 'total_nfts', value: collectionInfo.total_nfts },
                    { name: 'unique_owners', value: collectionInfo.unique_owners },
                    { name: 'total_listed_nft', value: collectionInfo.total_listed_nft },
                    { name: 'floor_price_in_usd', value: collectionInfo.floor_price_in_usd },
                    { name: 'trade_volume_in_usd', value: collectionInfo.trade_volume_in_usd },
                ],
            }
        ]
    } catch(e) {
        console.error(e)
        return []
    }
}