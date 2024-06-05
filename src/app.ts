import { writeInfluxDbPoints } from "./db/ifluxdb"
import { clearGSheets, updateGSheets } from "./g-sheets/gheet"
import { getPhmnStats } from "./onchain-data/phmnStats"
import { getRespStats } from "./onchain-data/respStats"

export async function app() {
    await update()
    async function update() {
        try {
            const [
                phmnStats,
                respStats
            ] = await Promise.all([
                getPhmnStats(),
                getRespStats()
            ]) 
            
            // PHMN stats
            await writeInfluxDbPoints([phmnStats.phmnStatsPoint], "stats")
            await writeInfluxDbPoints(phmnStats.subDaoTreasurys, "stats")
            await writeInfluxDbPoints(phmnStats.phmnBalancesPoints, "addresses")
            await writeInfluxDbPoints(phmnStats.dasMembersPoints, "addresses")
            await writeInfluxDbPoints(phmnStats.dasUnbondings, "addresses")
            
            // RESP stats
            await writeInfluxDbPoints(respStats.respStatsPoints, "stats")
            await writeInfluxDbPoints(respStats.subDaoTreasurys, "stats")
            await writeInfluxDbPoints(respStats.respBalancesPoints, "addresses")

            console.log(new Date().toLocaleString('ru'), 'Stats updated')

            try {
                await clearGSheets()
                await updateGSheets(phmnStats)
                
                console.log(new Date().toLocaleString('ru'), 'Google Sheets updated')
            } catch (err) {
                console.error(new Date().toLocaleString('ru'), err)
            }
            
            setTimeout(update, 60*1000)
        } catch (err) {
            setTimeout(update, 5*1000)
            console.error(new Date().toLocaleString('ru'), err)
        }
    }
}