import { hexToText } from "../helpers";
import { getContractState } from "./juno/junoRequests";
import { requestPoolInfoOsmosis } from "./osmosis/osmosisRequests";
import { poolsPHMNosmosis, phmnDenomOsmosis } from './osmosis/phmnConfig.json'
import { contractsAddresses, subdaoTreasuryAddresses } from './juno/phmnConfig.json'
import { WritePoint } from "../db/ifluxdb"
import { getCurrentPrices } from "../onchain-data/pythPrices"

const {
    PHMN_CONTRACT_ADDRESS,
    DAS_CONTRACT_ADDRESS,
    JUNO_SWAP_PHMN_POOL_ADDRESS,
    WYND_PHMN_POOL_ADDRESS,
    DAS_TREASURY_ADDRESS,
    ICS20_CONTRACT_ADDRESS
} = contractsAddresses

type Balance = {
    address: string,
    amount: number
}

type subDaoPhmnBalance = {
    subdaoTag: string,
    phmnAmount: number
}

type Unbonding = {
    address: string,
    amount: number,
    releaseAt: Date
}

export type PhmnStats = { 
    phmnStatsPoint: WritePoint, 
    phmnBalancesPoints: WritePoint[],
    dasMembersPoints: WritePoint[],
    dasUnbondings: WritePoint[],
    subDaoTreasurys: WritePoint[]
}

export async function getPhmnStats() : Promise<PhmnStats>  {
    const [
        phmnContractInfo, dasContractInfo, phmnPoolsInfoOsmosis, currentPrices
    ] = await Promise.all([
        getPhmnContractInfo(),
        getDasContractInfo(),
        getPhmnPoolsInfoOsmosis(),
        getCurrentPrices()
    ])
    const date = new Date(Date.now())

    const phmnStatsPoint: WritePoint = {
        measurement: 'stats',
        time: date,
        tags: [
            {
                name: 'entity_id',
                value: 'phmn_stats'
            },
            {
                name: 'type',
                value: 'cw20'
            }
        ],
        fields: []
    }

    phmnStatsPoint.fields.push(
        {
            name: 'phmn_in_pool',
            value: phmnContractInfo.junoswapPhmnPool / 1e6
        },
        {
            name: 'total_staked',
            value: dasContractInfo.totalHolded / 1e6
        },
        {
            name: 'members',
            value: dasContractInfo.dasMembers.length
        },
        {
            name: 'max_voting_power',
            value: dasContractInfo.maxVotingPower / 1e6
        },
        {
            name: 'max_voting_power_ratio',
            value: dasContractInfo.maxVotingPower * 100 / dasContractInfo.totalHolded
        },
        {
            name: 'phmn_in_pool_wynd',
            value: phmnContractInfo.wyndDexPhmnPool / 1e6
        },
        {
            name: 'current_supply',
            value: phmnContractInfo.currentSupply / 1e6
        },
        {
            name: 'max_supply',
            value: phmnContractInfo.maxSupply / 1e6
        },
        {
            name: 'current_supply_ratio',
            value: +(phmnContractInfo.currentSupply * 100 / phmnContractInfo.maxSupply).toFixed(2)
        },
        {
            name: 'phmn_das_treasury',
            value: phmnContractInfo.dasTreasury / 1e6
        },
        {
            name: 'unbonding_period',
            value: (phmnContractInfo.dasContractBalance - dasContractInfo.totalHolded) / 1e6
        },
        {
            name: 'total_staked_ratio',
            value: dasContractInfo.totalHolded * 100 / phmnContractInfo.currentSupply
        },
        {
            name: 'atom_price',
            value: currentPrices.currentPriceAtom
        },
        {
            name: 'osmo_price',
            value: currentPrices.currentPriceOsmo
        }
    )

    let phmn_price_osmo = 0 // pool 1255 with Atom
    let phmn_price_osmo_osmo = 0 // pool 1738 with Osmo
    let osmosisPoolsPhmnAmount = 0
    for (let pool of phmnPoolsInfoOsmosis) {
        const phmnAmount = Number(pool.poolInfo.pool_assets.find((asset) => asset.token.denom === phmnDenomOsmosis
        )?.token.amount || '0') / 1e6

        osmosisPoolsPhmnAmount += phmnAmount * 1e6

        const poolInfo = poolsPHMNosmosis.find((elem) => elem.poolId === pool.poolId
        )

        const token2Amount = Number(pool.poolInfo.pool_assets.find((asset) => asset.token.denom === poolInfo?.secondTokenBaseDenom
        )?.token.amount || '0') / poolInfo!.secondTokenMultiplier
        if (phmnAmount === 0 || token2Amount === 0) continue

        const token2PerPhmn = token2Amount / phmnAmount

        if (pool.poolId === 1255) {
            phmn_price_osmo = +(token2PerPhmn * currentPrices.currentPriceAtom).toFixed(2)
            const liquidity = +(phmn_price_osmo * phmnAmount + token2Amount * currentPrices.currentPriceAtom).toFixed(2)

            phmnStatsPoint.fields.push(
                {
                    name: 'phmn_price_osmo',
                    value: phmn_price_osmo
                },
                {
                    name: 'total_liquidity_osmo',
                    value: liquidity
                },
                {
                    name: 'phmn_in_pool_osmo',
                    value: phmnAmount
                },
                {
                    name: 'atom_in_pool_osmo',
                    value: token2Amount
                },
                {
                    name: 'atom_per_phmn_osmo',
                    value: token2PerPhmn
                },
                {
                    name: 'osmo1hyjhy0tp6geral2g9vj9nyteglf8t5q4pqwre8_gamm_osmo',
                    value: +(+pool.poolInfo.owner_shares!.amount / 1e18).toFixed(6)
                },
                {
                    name: 'osmo1hyjhy0tp6geral2g9vj9nyteglf8t5q4pqwre8_liquidity_ratio',
                    value: +(+pool.poolInfo.owner_shares!.amount * 100 / +pool.poolInfo.total_shares.amount).toFixed(2)
                }
            )
        } else if (pool.poolId === 1738) {
            phmn_price_osmo_osmo = +(token2PerPhmn * currentPrices.currentPriceOsmo).toFixed(2)
            const liquidity = +(phmn_price_osmo_osmo * phmnAmount + token2Amount * currentPrices.currentPriceOsmo).toFixed(2)

            phmnStatsPoint.fields.push(
                {
                    name: 'phmn_price_osmo_osmo',
                    value: phmn_price_osmo_osmo
                },
                {
                    name: 'total_liquidity_osmo_osmo',
                    value: liquidity
                },
                {
                    name: 'phmn_in_pool_osmo_osmo',
                    value: phmnAmount
                },
                {
                    name: 'osmo_in_pool_osmo',
                    value: token2Amount
                },
                {
                    name: 'osmo_per_phmn_osmo',
                    value: token2PerPhmn
                },
                {
                    name: 'osmo1hyjhy0tp6geral2g9vj9nyteglf8t5q4pqwre8_gamm_osmo_osmo',
                    value: +(+pool.poolInfo.owner_shares!.amount / 1e18).toFixed(6)
                },
                {
                    name: 'osmo1hyjhy0tp6geral2g9vj9nyteglf8t5q4pqwre8_liquidity_ratio_osmo',
                    value: +(+pool.poolInfo.owner_shares!.amount * 100 / +pool.poolInfo.total_shares.amount).toFixed(2)
                }
            )
        }
    }
    let phmn_price_avg = 0 // average price Osmosis Dex
    if (phmn_price_osmo && phmn_price_osmo_osmo) {
        phmn_price_avg = +((phmn_price_osmo + phmn_price_osmo_osmo) / 2).toFixed(2)
    } else {
        phmn_price_avg = phmn_price_osmo ? phmn_price_osmo : phmn_price_osmo_osmo
    }
    if (phmn_price_avg === 0) {
        throw new Error('Impossible to calculate the price PHMN')
    }
    phmnStatsPoint.fields.push(
        {
            name: 'phmn_price_avg',
            value: phmn_price_avg
        },
        {
            name: 'total_liquidity_wynd',
            value: +(phmnContractInfo.wyndDexPhmnPool * phmn_price_avg * 2 / 1e6).toFixed(2)
        },
        {
            name: 'total_liquidity',
            value: +(phmnContractInfo.junoswapPhmnPool * phmn_price_avg * 2 / 1e6).toFixed(2)
        },
        {
            name: 'market_cap',
            value: +(1.0 * phmnContractInfo.currentSupply * phmn_price_avg / 1e6).toFixed(2)
        },
        {
            name: 'phmnInPools',
            value: (osmosisPoolsPhmnAmount + phmnContractInfo.wyndDexPhmnPool + phmnContractInfo.junoswapPhmnPool) / 1e6
        }
    )
    for (let pool of phmnPoolsInfoOsmosis) {
        if (pool.poolId === 1255 || pool.poolId === 1738) continue
        const phmnAmount = Number(pool.poolInfo.pool_assets.find((asset) => asset.token.denom === phmnDenomOsmosis
        )?.token.amount || '0') / 1e6

        const poolInfo = poolsPHMNosmosis.find((elem) => elem.poolId === pool.poolId
        )

        const token2Amount = Number(pool.poolInfo.pool_assets.find((asset) => asset.token.denom === poolInfo?.secondTokenBaseDenom
        )?.token.amount || '0') / poolInfo!.secondTokenMultiplier
        if (phmnAmount === 0 || token2Amount === 0) continue

        const token2PerPhmn = token2Amount / phmnAmount
        const liquidity = +(phmn_price_avg * phmnAmount * 2).toFixed(2)

        if (pool.poolInfo.owner_shares) {
            const ownerShares = +(
                +pool.poolInfo.owner_shares.amount / 1e18
            ).toFixed(6)
            const ownerSharesRatio = +(+pool.poolInfo.owner_shares!.amount * 100 /
                +pool.poolInfo.total_shares.amount
            ).toFixed(2)
            phmnStatsPoint.fields.push(
                {
                    name: 'owner_shares_osmosis_pool_' + pool.poolId.toString(),
                    value: ownerShares
                },
                {
                    name: 'owner_sharesRatio_osmosis_pool_' + pool.poolId.toString(),
                    value: ownerSharesRatio
                }
            )

        }
        phmnStatsPoint.fields.push(
            {
                name: 'total_liquidity_osmosis_pool_' + pool.poolId.toString(),
                value: liquidity
            },
            {
                name: 'phmn_in_osmosis_pool_' + pool.poolId.toString(),
                value: phmnAmount
            },
            {
                name: poolInfo!.secondTokenDenom + '_in_osmosis_pool_' + pool.poolId.toString(),
                value: token2Amount
            },
            {
                name: poolInfo!.secondTokenDenom + '_per_phmn_osmosis_pool_' + pool.poolId.toString(),
                value: token2PerPhmn
            }

        )
    }
    
    const freePhmnOnOsmosis = phmnContractInfo.ibcSent - osmosisPoolsPhmnAmount
    phmnContractInfo.phmnBalances.push({
        address: 'On the Osmosis network',
        amount: freePhmnOnOsmosis
    })
    const phmnBalancesPoints: WritePoint[] = []
    for (let balance of phmnContractInfo.phmnBalances) {
        phmnBalancesPoints.push({
            measurement: 'unlocked_phmns',
            time: date,
            tags: [{
                name: 'address',
                value: balance.address
            }],
            fields: [{
                name: 'phmn',
                value: balance.amount/1e6
            }]
        })
    }
    
    const dasMembersPoints: WritePoint[] = []
    for (let member of dasContractInfo.dasMembers) {
        dasMembersPoints.push({
            measurement: 'das_members',
            time: date,
            tags: [
                {
                    name: 'address',
                    value: member.address
                },
                {
                    name: 'type',
                    value: 'voting_power'
                }
            ],
            fields: [
                {
                    name: 'phmn',
                    value: member.amount / 1e6
                },
                {
                    name: 'percent',
                    value: member.amount * 100 / dasContractInfo.totalHolded
                }
            ]
        })
    }
    
    const dasUnbondings: WritePoint[] = []
    for (let unbonding of dasContractInfo.unbonding) {
        const flag = (unbonding.releaseAt.getTime() > date.getTime()) ? 
            'Unlocking' 
        : 'Unlocked'
        dasUnbondings.push({
            measurement: 'claims',
            time: date,
            tags: [
                {
                    name: 'address',
                    value: unbonding.address
                },
                {
                    name: 'release',
                    value: unbonding.releaseAt.getTime().toString()
                },
                {
                    name: 'flag',
                    value: flag
                }
            ],
            fields: [{
                name: 'phmn',
                value: unbonding.amount / 1e6
            }]
        })
    }

    const subDaoTreasurys: WritePoint[] = []
    for (let treasury of phmnContractInfo.subDaoPhmnBalances) {
        subDaoTreasurys.push({
            measurement: 'subDaoTreasurys',
            time: date,
            tags: [{
                name: 'subDaoTag',
                value: treasury.subdaoTag
            }],
            fields: [
                {
                    name: 'phmn',
                    value: treasury.phmnAmount / 1e6
                },
                {
                    name: 'usd',
                    value: phmn_price_avg * treasury.phmnAmount / 1e6
                }
            ]
        })
    }
    const totalSubDaoTreasurysPhmnAmount = phmnContractInfo.subDaoPhmnBalances.reduce((sum, subdao) => sum += subdao.phmnAmount / 1e6, 0)
    const totalSubDaoTreasurysUsd = phmn_price_avg * totalSubDaoTreasurysPhmnAmount
    subDaoTreasurys.push({
        measurement: 'subDaoTreasurys',
        time: date,
        tags: [{
            name: 'subDaoTag',
            value: 'totalSubDaoTreasurys'
        }],
        fields: [
            {
                name: 'phmn',
                value: totalSubDaoTreasurysPhmnAmount
            },
            {
                name: 'usd',
                value: totalSubDaoTreasurysUsd
            }
        ]
    })
    for (let subDaoAddress of subdaoTreasuryAddresses) {
        const subDao =  subDaoTreasurys.find((element) => 
            element.tags[0].value === subDaoAddress.subdaoTag
        )
        if (!subDao) {
            subDaoTreasurys.push({
                measurement: 'subDaoTreasurys',
                time: date,
                tags: [{
                    name: 'subDaoTag',
                    value: subDaoAddress.subdaoTag
                }],
                fields: [
                    {
                        name: 'phmn',
                        value: 0
                    },
                    {
                        name: 'usd',
                        value: 0
                    }
                ]
            })
        }
    }  
    
    phmnStatsPoint.fields.push(
        {
            name: 'total_liquidity_osmo_ibcx',
            value: 0
        },
        {
            name: 'phmn_in_pool_osmo_ibcx',
            value: 0
        }

    )

    return { 
        phmnStatsPoint: phmnStatsPoint, 
        phmnBalancesPoints: phmnBalancesPoints,
        dasMembersPoints: dasMembersPoints,
        dasUnbondings: dasUnbondings,
        subDaoTreasurys: subDaoTreasurys
    }
}

async function getPhmnPoolsInfoOsmosis() {
    const promises = []
    for (let pool of poolsPHMNosmosis) {
        promises.push(requestPoolInfoOsmosis(pool.poolId))
    }

    return await Promise.all(promises)
}
async function getDasContractInfo() {
    const dasContarctInfo = {
        unbonding: [] as  Unbonding[],
        dasMembers: [] as Balance[],
        maxVotingPower: 0,
        totalHolded: 0,
    }
    
    const dasContarctStates = await getContractState(DAS_CONTRACT_ADDRESS)
    for (let state of dasContarctStates) {
        if (state.key.substring(0, 16) === '0006636C61696D73') { // ??claims
            interface Claim {
                amount: string, 
                release_at: {
                    at_time: string
                }
            }
            const claims: Claim[] = JSON.parse(Buffer.from(state.value, 'base64').toString())
            if (claims.length === 0) continue
            
            const address = hexToText(state.key.replace('0006636C61696D73', ''))
            for (let claim of claims) {
                dasContarctInfo.unbonding.push({
                    address,
                    amount: Number(claim.amount),
                    releaseAt: new Date(Number(claim.release_at.at_time.substring(0, 13)))
                })
            }
        } else if (state.key.substring(0, 34) === '000F7374616B65645F62616C616E636573') { // ��staked_balances
            const amount = Number(Buffer.from(state.value, 'base64').toString().replaceAll('"', ''))
            if (amount === 0) continue

            dasContarctInfo.dasMembers.push({
                address: hexToText(state.key.replace('000F7374616B65645F62616C616E636573', '')), 
                amount
            })
            if (dasContarctInfo.maxVotingPower < amount) {
                dasContarctInfo.maxVotingPower = amount
            }
        } else if (state.key.substring(0, 34) === '746F74616C5F7374616B6564') { // total_staked
            dasContarctInfo.totalHolded = Number(
                Buffer.from(state.value, 'base64').toString().replaceAll('"', '')
            )
        }
    }
    return dasContarctInfo
}
async function getPhmnContractInfo() {
    const phmnContarctStates = await getContractState(PHMN_CONTRACT_ADDRESS)
    
    const phmnContractInfo = {
        phmnBalances: [] as Balance[],
        subDaoPhmnBalances: [] as subDaoPhmnBalance[],
        maxSupply: 0,
        currentSupply: 0,
        dasContractBalance: 0,
        junoswapPhmnPool: 0,
        wyndDexPhmnPool: 0,
        dasTreasury: 0,
        ibcSent: 0
    }
    
    for (let state of phmnContarctStates) {
        if (state.key.substring(0, 18) === '000762616C616E6365') {
            const amount = Number(Buffer.from(state.value, 'base64').toString().replaceAll('"', ''))
            if (amount > 0) {
                const address = hexToText(state.key.replace('000762616C616E6365', ''))
                if (address === DAS_CONTRACT_ADDRESS) {
                    phmnContractInfo.dasContractBalance = amount
                } else if (address === JUNO_SWAP_PHMN_POOL_ADDRESS) {
                    phmnContractInfo.junoswapPhmnPool = amount
                } else if (address === WYND_PHMN_POOL_ADDRESS) {
                    phmnContractInfo.wyndDexPhmnPool = amount
                } else if (address === DAS_TREASURY_ADDRESS) {
                    phmnContractInfo.dasTreasury = amount
                } else if (address === ICS20_CONTRACT_ADDRESS) {
                    phmnContractInfo.ibcSent = amount
                } else {
                    const subDao = subdaoTreasuryAddresses.find((subdao) => 
                        subdao.treasuryAddress === address
                    )
                    if (subDao) {
                        phmnContractInfo.subDaoPhmnBalances.push({
                            subdaoTag: subDao.subdaoTag,
                            phmnAmount: amount
                        })
                    } else {
                        phmnContractInfo.phmnBalances.push({address, amount})
                    }
                }
            }
        } else if (state.key === '746F6B656E5F696E666F') { // token_info
            interface TokenInfo {
                total_supply: string,
                mint: {
                    cap: string
                }
            }
            const tokenInfo: TokenInfo = JSON.parse(Buffer.from(state.value, 'base64').toString())
            phmnContractInfo.currentSupply = Number(tokenInfo.total_supply)
            phmnContractInfo.maxSupply = Number(tokenInfo.mint.cap)
        }
    }

    return phmnContractInfo
}