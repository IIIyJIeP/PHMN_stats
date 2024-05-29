import 'dotenv/config'

if (!process.env.LCD_ENDPOINT_JUNO) throw new Error('"LCD_ENDPOINT_JUNO" env var is required!')
const junoLcdEndpoint = process.env.LCD_ENDPOINT_JUNO

type ContractState = {
    key: string,
    value: string
}[]

type ContractStateResponse = {
    models: ContractState,
    pagination: {
        next_key: string | null
    }
}

export async function getContractState(contractAddress: string, pagination_key?: string) {
    const result: ContractState = []

    const contractStatePath = `/cosmwasm/wasm/v1/contract/${contractAddress}/state`
    const queryUrl = new URL(
        contractStatePath,
        junoLcdEndpoint
    )
    if (pagination_key) {
        queryUrl.searchParams.append(
            "pagination.key", pagination_key
        )
    }
    

    const response = await fetch(queryUrl)
    if (!response.ok) {
        throw new Error('Respons not OK')
    }
    const responseJson = await response.json() as ContractStateResponse
    
    for (let element of responseJson.models) {
        result.push(element)
    }

    if (responseJson.pagination.next_key !== null) {
        for (let state of await getContractState(contractAddress, responseJson.pagination.next_key)) {
            result.push(state)
        }
    }

    return result
}