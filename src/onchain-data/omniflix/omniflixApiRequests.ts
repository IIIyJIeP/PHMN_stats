if (!process.env.OMNIFLIX_API_URL) throw new Error('"OMNIFLIX_API_URL" env var is required!')
const omniflixApiUrl = process.env.OMNIFLIX_API_URL

export interface SbtInfoResponse {
    id: string,
    epoch: string
    owner: string,
    type: "common"|"bronze"|"silver"|"gold"|"platinum"|"brilliant",
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