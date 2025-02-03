if (!process.env.OMNIFLIX_API_URL) throw new Error('"OMNIFLIX_API_URL" env var is required!')
const omniflixApiUrl = process.env.OMNIFLIX_API_URL

type Types = "common"|"bronze"|"silver"|"gold"|"platinum"|"brilliant"

export interface SbtInfoResponse {
    id: string,
    epoch: string
    owner: string,
    type: Types,
}

export interface SpheresInfoResponse {
    unique_owners: number,
    total_nfts: number,
    total_listed_nft: number,
    floor_price_in_usd: number
}

interface SpheresCollectionInfo {
    success: boolean,
    result: SpheresInfoResponse
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

export async function getCollectionInfo(denomId: string): Promise<SbtInfoResponse[]> {
    
    const result: SbtInfoResponse[] =[]
    const limit = 20000
    const nftPath = '/nfts'
    const queryUrl = new URL(
        nftPath,
        omniflixApiUrl
    )
    queryUrl.searchParams.append("denomId", denomId)
    queryUrl.searchParams.append("limit", '1')
    
    const sbtInfoResp = await fetch(queryUrl)
    if (!sbtInfoResp.ok) {
        throw new Error('sbtInfo: Respons not OK')
    }
    const sbtInfo = await sbtInfoResp.json() as CollectionInfo
    if (!sbtInfo.success) {
        throw new Error('sbtInfo: Respons not success')
    }
    const nftCount = sbtInfo.result.count
    
    let skip = 0
    queryUrl.searchParams.append("skip", skip.toString())
    queryUrl.searchParams.delete("limit")
    queryUrl.searchParams.append("limit", limit.toString())
    
    const promises: Promise<Response>[] =[]
    while (skip < nftCount) {
        promises.push(fetch(queryUrl))
        queryUrl.searchParams.delete("skip")
        skip += limit
        queryUrl.searchParams.append("skip", skip.toString())
    }
    const responses = await Promise.all(promises)

    for(let resp of responses) {
        if (!resp.ok) {
            throw new Error('sbtInfo: Respons not OK')
        }
        
        const response = await resp.json() as CollectionInfo
        if (!sbtInfo.success) {
            throw new Error('sbtInfo: Respons not success')
        }
        
        const nfts = response.result.list.map(item => {
            const data: SbtTrates = JSON.parse(item.data)
            let epoch: string
            try {
                epoch = item.name
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
    }

    return result
}

export async function getSpheresInfo(denomId: string): Promise<SpheresInfoResponse> {
    const collectionsPath = '/collections/'+ denomId
    const queryUrl = new URL(
        collectionsPath,
        omniflixApiUrl
    )
    
    const spheresInfoResp = await fetch(queryUrl)
    if (!spheresInfoResp.ok) {
        throw new Error('spheresInfoResp: Respons not OK')
    }
    const spheresInfo = await spheresInfoResp.json() as SpheresCollectionInfo
    if (!spheresInfo.success) {
        throw new Error('spheresInfo: Respons not success')
    }
    
    return {
        total_nfts: spheresInfo.result.total_nfts,
        unique_owners: spheresInfo.result.unique_owners,
        total_listed_nft: spheresInfo.result.total_listed_nft,
        floor_price_in_usd: spheresInfo.result.floor_price_in_usd
    }
}