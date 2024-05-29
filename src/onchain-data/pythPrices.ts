import {PriceServiceConnection} from '@pythnetwork/price-service-client'

const priceServiceUrl = 'https://hermes.pyth.network'
const connection = new PriceServiceConnection("https://hermes.pyth.network")

const priceIds = [
    "5867f5683c757393a0670ef0f701490950fe93fdb006d181c8265a831ac0c5c6", // OSMO/USD price id
    "b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819", // ATOM/USD price id
]

export async function getCurrentPrices() {
    const currentPrices = await connection.getLatestPriceFeeds(priceIds)
    if (!currentPrices) {
        throw new Error('Error request of prices from pyth service')
    }
    const [currentPriceOsmo, currentPriceAtom] = currentPrices

    return {
        currentPriceOsmo: currentPriceOsmo.getPriceUnchecked().getPriceAsNumberUnchecked(),
        currentPriceAtom: currentPriceAtom.getEmaPriceUnchecked().getPriceAsNumberUnchecked()
    }
}
