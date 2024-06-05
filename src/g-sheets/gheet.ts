import 'dotenv/config'
import {google} from 'googleapis'
import { PhmnStats } from '../onchain-data/phmnStats'

const CELLS_FOR_CLEAR = {
    UnlockedPHMNs: 'UnlockedPHMNs!A3:B1000000',
    PHMNsInTheDAS: 'PHMNsInTheDAS!A3:B1000000',
    Unbonding: 'Unbonding!A3:C1000000'
}

if (!process.env.G_SHEETS_CREDS) throw new Error('"G_SHEETS_CREDS" env var is required!')
const creds = JSON.parse(process.env.G_SHEETS_CREDS) as {
    client_email: string,
    private_key: string
}
if (!process.env.G_SHEETS_ID) throw new Error('"G_SHEETS_ID" env var is required!')
const sheetsId = process.env.G_SHEETS_ID

const sheets = google.sheets('v4')
const jwtClient = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets',
     'https://www.googleapis.com/auth/drive']
)

export async function clearGSheets() {
    await jwtClient.authorize()
    await Promise.all([
        sheets.spreadsheets.values.clear({
            auth: jwtClient,
            spreadsheetId: sheetsId,
            range: CELLS_FOR_CLEAR.UnlockedPHMNs,
        }),
        sheets.spreadsheets.values.clear({
            auth: jwtClient,
            spreadsheetId: sheetsId,
            range: CELLS_FOR_CLEAR.PHMNsInTheDAS,
        }),
        sheets.spreadsheets.values.clear({
            auth: jwtClient,
            spreadsheetId: sheetsId,
            range: CELLS_FOR_CLEAR.Unbonding,
        })
    ])
}

export async function updateGSheets(phmnStats: PhmnStats) {
    await jwtClient.authorize()
    
    // Stats
    const unbonding = phmnStats.phmnStatsPoint.fields.find((field) =>
        field.name === 'unbonding_period'
    )!.value * 1e6
    const dasTreasury = phmnStats.phmnStatsPoint.fields.find((field) =>
        field.name === 'phmn_das_treasury'
    )!.value * 1e6
    const subDaoTreasurys = phmnStats.subDaoTreasurys.find((treasury) =>
        treasury.tags[0].value === 'totalSubDaoTreasurys'
    )!.fields.find((field) => field.name ==='phmn' )!.value * 1e6
    const phmnInPools = phmnStats.phmnStatsPoint.fields.find((field) =>
        field.name === 'phmnInPools'
    )!.value * 1e6

    // DAS members
    const dasMembers = []
    for (let memberPoint of phmnStats.dasMembersPoints) {
        const address = memberPoint.tags.find((tag) => 
            tag.name === 'address'
        )?.value
        const amount = memberPoint.fields.find((field) => 
            field.name === 'phmn'
        )?.value
        if (!address || !amount) continue;
        dasMembers.push([address, amount * 1e6])
    }
    
    // Unlocked PHMNs
    const phmnBalances = []
    for (let balancePoint of phmnStats.phmnBalancesPoints) {
        const address = balancePoint.tags.find((tag) => 
            tag.name === 'address'
        )?.value
        const amount = balancePoint.fields.find((field) => 
            field.name === 'phmn'
        )?.value
        if (!address || !amount) continue;
        phmnBalances.push([address, amount * 1e6])
    }

    // Unbonding
    const Unbondings = []
    for (let unbondingPoint of phmnStats.dasUnbondings) {
        const address = unbondingPoint.tags.find((tag) => 
            tag.name === 'address'
        )?.value
        const amount = unbondingPoint.fields.find((field) => 
            field.name === 'phmn'
        )?.value
        const releaseAt = unbondingPoint.tags.find((tag) => 
            tag.name === 'release'
        )?.value
        if (!address || !amount || !releaseAt) continue;
        Unbondings.push([releaseAt, amount * 1e6, address])
    }

    await Promise.all([
        updateSheet('PHMNsInTheDAS!N1:O3', [
            ['unbonding_period', unbonding],
            ['phmnInPools', phmnInPools],
            ['phmn_das_subdaos_treasurys', dasTreasury + subDaoTreasurys]
        ]),
        updateSheet(
            'PHMNsInTheDAS!A3:B' + (dasMembers.length + 2).toString(),
            dasMembers
        ),
        updateSheet(
            'UnlockedPHMNs!A3:B' + (phmnBalances.length + 2).toString(),
            phmnBalances
        ),
        updateSheet(
            'Unbonding!A3:C' + (Unbondings.length + 2).toString(),
            Unbondings
        )
    ])
}

async function updateSheet(range: string, values: any [][]) {
    return await sheets.spreadsheets.values.update({
        auth: jwtClient,
        spreadsheetId: sheetsId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: values
        }
    })
}