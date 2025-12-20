export async function getPhmnPriceOsmosis() {
    const request = await fetch("https://api.skip.money/v2/fungible/route", {
        "body": "{\"amount_in\":\"1000000\",\"source_asset_chain_id\":\"osmosis-1\",\"source_asset_denom\":\"ibc/D3B574938631B0A1BA704879020C696E514CFADAA7643CDE4BD5EB010BDE327B\",\"dest_asset_chain_id\":\"osmosis-1\",\"dest_asset_denom\":\"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4\",\"smart_relay\":true,\"experimental_features\":[\"hyperlane\",\"stargate\",\"eureka\",\"layer_zero\"],\"allow_multi_tx\":true,\"allow_unsafe\":true,\"smart_swap_options\":{\"split_routes\":true,\"evm_swaps\":true},\"go_fast\":true}",
        "method": "POST",
    })
    if (!request.ok) {
        throw new Error("getPhmnPriceNeutron failed")
    }
    const price = await request.json()
    return Math.floor(Number(price.estimated_amount_out)/0.99/1e4)/1e2
}

export async function getPhmnPriceNeutron() {
    const request = await fetch("https://api.skip.money/v2/fungible/route", {
        "body": "{\"source_asset_denom\":\"ibc/4698B7C533CB50F4120691368F71A0E7161DA26F58376262ADF3F44AAAA6EF9E\",\"source_asset_chain_id\":\"neutron-1\",\"dest_asset_denom\":\"ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81\",\"dest_asset_chain_id\":\"neutron-1\",\"amount_in\":\"1000000\",\"swap_venues\":[{\"name\":\"neutron-astroport\",\"chain_id\":\"neutron-1\"},{\"name\":\"neutron-duality\",\"chain_id\":\"neutron-1\"}],\"allow_unsafe\":true,\"experimental_features\":[\"stargate\",\"eureka\"]}",
        "method": "POST",
    })
    if (!request.ok) {
        throw new Error("getPhmnPriceNeutron failed")
    }
    const price = await request.json()
    return Math.floor(Number(price.estimated_amount_out)/0.99/1e4)/1e2
}


fetch("https://go.skip.build/api/skip/v2/fungible/route", {
  "headers": {
    "accept": "*/*",
    "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "referrer": "https://go.skip.build/",
  "body": "{\"amount_in\":\"1000000\",\"source_asset_chain_id\":\"osmosis-1\",\"source_asset_denom\":\"ibc/D3B574938631B0A1BA704879020C696E514CFADAA7643CDE4BD5EB010BDE327B\",\"dest_asset_chain_id\":\"osmosis-1\",\"dest_asset_denom\":\"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4\",\"smart_relay\":true,\"experimental_features\":[\"hyperlane\",\"stargate\",\"eureka\",\"layer_zero\"],\"allow_multi_tx\":true,\"allow_unsafe\":true,\"smart_swap_options\":{\"split_routes\":true,\"evm_swaps\":true},\"go_fast\":true}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});