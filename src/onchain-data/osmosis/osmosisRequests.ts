import { osmosis } from 'osmojs'
import {poolsPHMNosmosis} from './phmnConfig.json'

if (!process.env.LCD_ENDPOINT_OSMO) throw new Error('"LCD_ENDPOINT_OSMO" env var is required!')
const osmoLcdEndpoint = process.env.LCD_ENDPOINT_OSMO

type Token = {
    denom: string,
    amount: string
}
type PoolAsset = {
    token: Token,
    weight: string
}
interface PoolInfo {
    total_shares: Token,
    owner_shares?: Token,
    pool_assets: PoolAsset[],
}

export async function requestPoolInfoOsmosis(poolId: number) {
    const lcdClient = await osmosis.ClientFactory.createLCDClient({restEndpoint: osmoLcdEndpoint})
    const poolInfo = await lcdClient.osmosis.gamm.v1beta1.pool({poolId: BigInt(poolId)}) as {pool: PoolInfo}
    const ownerAddress = poolsPHMNosmosis.find((element) => 
        element.poolId === poolId
    )?.ownerAddress
    
    poolInfo.pool.owner_shares = ownerAddress ? 
        (await lcdClient.cosmos.bank.v1beta1.balance({
            address: ownerAddress,
            denom: poolInfo.pool.total_shares.denom
        })).balance
    : undefined
    
    return {
        poolId,
        poolInfo: poolInfo.pool,
    }
}
