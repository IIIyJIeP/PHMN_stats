import { hexToText } from "../helpers";
import { getContractState } from "./juno/junoRequests";
import { contractsAddresses } from './juno/respConfig.json'
import { WritePoint } from "../db/ifluxdb"
import { subdaoTreasuryAddresses } from './juno/phmnConfig.json'

const { RESP_CONTRACT_ADDRESS } = contractsAddresses

type Balance = {
    address: string,
    amount: number
}

type subDaoRespBalance = {
    subdaoTag: string,
    respAmount: number
}

export async function getRespStats() {
    const respStatsPoints: WritePoint[] = []

    const respContractInfo = await getRespContractInfo()
    const date = new Date(Date.now())

    const distributedRespAmount = respContractInfo.respBalances.reduce((sum, owner) => sum += owner.amount, 0)
    const distributedRespRatio = distributedRespAmount *100 / respContractInfo.currentSupply
    
    respStatsPoints.push(
        {
            measurement: 'respStats',
            time: date,
            tags : [
                {
                    name: 'name',
                    value: 'currentSupply'
                }
            ],
            fields: [
                {
                    name: 'RESP',
                    value: respContractInfo.currentSupply
                }
            ]
        },
        {
            measurement: 'respStats',
            time: date,
            tags : [
                {
                    name: 'name',
                    value: 'distributedResp'
                }
            ],
            fields: [
                {
                    name: 'RESP',
                    value: distributedRespAmount
                },
                {
                    name: 'Persent',
                    value: distributedRespRatio
                }
            ]
        },
        {
            measurement: 'respStats',
            time: date,
            tags : [
                {
                    name: 'name',
                    value: 'numberOfRespOwners'
                }
            ],
            fields: [
                {
                    name: 'unit',
                    value: respContractInfo.respBalances.length
                }
            ]
        }
    )

    const respBalancesPoints: WritePoint[] = []
    for (let balance of respContractInfo.respBalances) {
        respBalancesPoints.push({
            measurement: 'RESP_owners',
            time: date,
            tags: [{
                name: 'address',
                value: balance.address
            }],
            fields: [{
                name: 'RESP',
                value: balance.amount
            }]
        })
    }
    
    const subDaoTreasurys: WritePoint[] = []
    for (let treasury of respContractInfo.subDaoRespBalances) {
        subDaoTreasurys.push({
            measurement: 'subDaoTreasurys',
            time: date,
            tags: [{
                name: 'subDaoTag',
                value: treasury.subdaoTag
            }],
            fields: [
                {
                    name: 'RESP',
                    value: treasury.respAmount
                }
            ]
        })
    }
    const totalSubDaoTreasurysRespAmount = respContractInfo.subDaoRespBalances.reduce((sum, subdao) => sum += subdao.respAmount, 0)
    subDaoTreasurys.push({
        measurement: 'subDaoTreasurys',
        time: date,
        tags: [{
            name: 'subDaoTag',
            value: 'totalSubDaoTreasurys'
        }],
        fields: [
            {
                name: 'RESP',
                value: totalSubDaoTreasurysRespAmount
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
                        name: 'RESP',
                        value: 0
                    }
                ]
            })
        }
    }  
    
    return { 
        respStatsPoints, 
        respBalancesPoints,
        subDaoTreasurys
    }
}

async function getRespContractInfo() {
    const respContarctStates = await getContractState(RESP_CONTRACT_ADDRESS)
    
    const respContractInfo = {
        respBalances: [] as Balance[],
        subDaoRespBalances: [] as subDaoRespBalance[],
        currentSupply: 0
    }
    
    for (let state of respContarctStates) {
        if (state.key.substring(0, 18) === '000762616C616E6365') {
            const amount = Number(Buffer.from(state.value, 'base64').toString().replaceAll('"', ''))
            if (amount > 0) {
                const address = hexToText(state.key.replace('000762616C616E6365', ''))

                const subDao = subdaoTreasuryAddresses.find((subdao) =>
                    subdao.treasuryAddress === address
                )
                if (subDao) {
                    respContractInfo.subDaoRespBalances.push({
                        subdaoTag: subDao.subdaoTag,
                        respAmount: amount
                    })
                } else {
                    respContractInfo.respBalances.push({ address, amount })
                }

            }
        } else if (state.key === '746F6B656E5F696E666F') { // token_info
            interface TokenInfo {
                total_supply: string
            }
            const tokenInfo: TokenInfo = JSON.parse(Buffer.from(state.value, 'base64').toString())
            respContractInfo.currentSupply = Number(tokenInfo.total_supply)
        }
    }
    
    return respContractInfo
}