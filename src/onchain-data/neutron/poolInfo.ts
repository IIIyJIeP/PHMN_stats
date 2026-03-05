import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
if (!process.env.RPC_ENDPOINT_NTRN) throw new Error('"RPC_ENDPOINT_NTRN" env var is required!')
const rpcURL = process.env.RPC_ENDPOINT_NTRN

const contractAddress = "neutron1muu00n0ae5z7kwnjfn98naju9p6vrj4msj35netm2ffjqs5wxyts57cwjv" // PHMN/USDC pool
const phmnDenomNeutron = 'ibc/4698B7C533CB50F4120691368F71A0E7161DA26F58376262ADF3F44AAAA6EF9E'
const usdcDenomNeutron = 'ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81'

const queryMsg = `{
  "pool": {}
}`;

const phmnPriceQueryMsg = `{
  "simulation": { "offer_asset": { "amount": "10000", "info": { "native_token": { "denom": ${phmnDenomNeutron} } } } } 
}`;

type PoolInfo = {
    assets:
    {
        info: {
            native_token: {
                denom: string
            }
        },
        amount: string
    }[],
    total_share: string
}

type PriceInfo = {
    return_amount: string,
    spread_amount: string,
    commission_amount: string
}

const getNeutronPoolInfo = async () => {
    const client = await SigningCosmWasmClient.connect(rpcURL)
    const queryResult: PoolInfo = await client.queryContractSmart(
        contractAddress,
        JSON.parse(queryMsg)
    )
    return queryResult
}

export const getNeutronPoolPhmnAmount = async () => {
    const queryResult = await getNeutronPoolInfo()
    const phmnAmount = queryResult.assets.find(asset => asset.info.native_token.denom === phmnDenomNeutron)?.amount
    if (phmnAmount === undefined) throw new Error("getNeutronPoolsPhmnAmount() failed")
    return Number(phmnAmount)
}
export const getNeutronPoolUsdcAmount = async () => {
    const queryResult = await getNeutronPoolInfo()
    const phmnAmount = queryResult.assets.find(asset => asset.info.native_token.denom === usdcDenomNeutron)?.amount
    if (phmnAmount === undefined) throw new Error("getNeutronPoolUsdcAmount() failed")
    return Number(phmnAmount)
}


export async function getPhmnPriceNeutron() {
    const client = await SigningCosmWasmClient.connect(rpcURL)
    const queryResult: PriceInfo = await client.queryContractSmart(
        contractAddress,
        JSON.parse(phmnPriceQueryMsg)
    )
    const price = Math.round((Number(queryResult.commission_amount) + 
        Number(queryResult.return_amount) + 
        Number(queryResult.spread_amount)
    )/100)/100
    
    return price
}