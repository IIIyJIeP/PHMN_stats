if (!process.env.OMNIFLIX_LCD) throw new Error('"OMNIFLIX_LCD" env var is required!')
const omniflixLCD = process.env.OMNIFLIX_LCD

export type SpheresType = "common"|"bronze"|"silver"|"gold"|"platinum"|"brilliant"

export interface SbtInfoResponse {
    id: string,
    epoch: string
    owner: string,
    type: SpheresType,
}

export interface SpheresInfoResponse {
    id: string,
    owner: string,
    type: SpheresType,
}

interface SbtTrates {
    type: string,
    epoch?: string
    drop_number?: number
}

interface SbtInfo {
    id: string,
    name: string,
    owner: string,
    data: string
}

interface CollectionInfo {
    success: boolean,
    result: {
        list: SbtInfo[],
        count: number,
    }
}

interface LcdSbtInfo {
    id: string,
    metadata: {
        name: string,
    },
    owner: string,
    data: string
}

interface LcdCollectionInfo {
    collection: {
        onfts: LcdSbtInfo[],
    }
    pagination: {
        next_key: string,
    }
}

export async function getLcdCollectionInfo(denomId: string): Promise<SbtInfoResponse[]> {
    const result: SbtInfoResponse[] =[]
    const nftPath = `/omniflix/onft/v1beta1/collections/${denomId}`
    const queryUrl = new URL(
        nftPath,
        omniflixLCD
    )
    
    const getInfo = async (paginationKey?: string) => {
        if (paginationKey) {
            queryUrl.searchParams.set('pagination.key', paginationKey)
        }
        const sbtInfoResp = await fetch(queryUrl)
        if (!sbtInfoResp.ok) {
            await new Promise(resolve => setTimeout(resolve, 2*1e3))
            await getInfo (paginationKey)
            return
        }
        const sbtInfo = await sbtInfoResp.json() as LcdCollectionInfo
        
        const nfts = sbtInfo.collection.onfts.map(item => {
            const data: SbtTrates = JSON.parse(item.data)
            let epoch: string
            try {
                epoch = item.metadata.name
                    .replace('POSTHUMAN ', '')
                    .replace(data.type.toUpperCase() + ' ','')
                epoch = epoch === '№1' ? 'Q2 2022' : epoch === '№2' ? 'Q3 2022' : epoch;
                const [quarter, year] = epoch.split(' ')
                epoch = `${year} ${quarter}`
            } catch (e) {
                return null
            }
            
            return {
                id: item.id,
                epoch,
                owner: item.owner,
                type: data.type.toLowerCase() as "common"|"bronze"|"silver"|"gold"|"platinum"|"brilliant"
            }
        }).filter(i => i !== null) as SbtInfoResponse[]
        result.push(...nfts)
        if (sbtInfo.pagination.next_key) {
            await new Promise(resolve => setTimeout(resolve, 100))
            await getInfo(sbtInfo.pagination.next_key)
        }
    }
    await getInfo()
    return result
}

export async function getLcdSpheresInfo(denomId: string, type: SpheresType): Promise<SpheresInfoResponse[]> {
    const result: SpheresInfoResponse[] =[]
    const nftPath = `/omniflix/onft/v1beta1/collections/${denomId}`
    const queryUrl = new URL(
        nftPath,
        omniflixLCD
    )
    
    const getInfo = async (paginationKey?: string) => {
        if (paginationKey) {
            queryUrl.searchParams.set('pagination.key', paginationKey)
        }
        const spheresInfoResp = await fetch(queryUrl)
        if (!spheresInfoResp.ok) {
            await new Promise(resolve => setTimeout(resolve, 2*1e3))
            await getInfo (paginationKey)
            return
        }
        const spheresInfo = await spheresInfoResp.json() as LcdCollectionInfo
        
        const spheres: SpheresInfoResponse[] = spheresInfo.collection.onfts.map(item => {
            return {
                id: item.id,
                owner: item.owner,
                type
            }
        })
        result.push(...spheres)
        if (spheresInfo.pagination.next_key) {
            await new Promise(resolve => setTimeout(resolve, 100))
            await getInfo(spheresInfo.pagination.next_key)
        }
    }
    await getInfo()
    return result
}