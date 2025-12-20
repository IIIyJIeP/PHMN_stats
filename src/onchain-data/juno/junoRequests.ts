import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { QueryClient, createProtobufRpcClient } from '@cosmjs/stargate'
import { fromBase64, toBase64, toHex } from '@cosmjs/encoding'
import { QueryClientImpl } from 'cosmjs-types/cosmwasm/wasm/v1/query'

if (!process.env.RPC_ENDPOINT_JUNO) throw new Error('"RPC_ENDPOINT_JUNO" env var is required!')
const junoRpcEndpoint = process.env.RPC_ENDPOINT_JUNO

type ContractState = { key: string; value: string }[]

export async function getContractState(contractAddress: string, pagination_key?: string) {
  const tm = await Tendermint34Client.connect(junoRpcEndpoint)

  try {
    const qc = new QueryClient(tm)
    const rpc = createProtobufRpcClient(qc)
    const wasmQuery = new QueryClientImpl(rpc)

    const result: ContractState = []

    // If key is absent, use empty bytes (treated as "no key")
    let nextKey: Uint8Array = pagination_key ? fromBase64(pagination_key) : new Uint8Array()

    const LIMIT = 200n

    while (true) {
      const res = await wasmQuery.AllContractState({
        address: contractAddress,
        pagination: {
          key: nextKey,
          offset: 0n,        // must be present in your types (but ignored when key is used)
          limit: LIMIT,
          countTotal: false,
          reverse: false
        }
      })

      for (const m of res.models) {
        result.push({
          key: toHex(m.key).toUpperCase(),
          value: toBase64(m.value)
        })
      }

      const nk = res.pagination?.nextKey
      if (!nk || nk.length === 0) break

      nextKey = nk
    }

    return result
  } finally {
    tm.disconnect()
  }
}
