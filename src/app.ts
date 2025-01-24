import 'dotenv/config'
import { writeInfluxDbPoints } from "./db/ifluxdb"
import { setLastPhmnStats } from "./db/lastUpdate"
import { updateDBs } from "./db/sqlite"
import { clearGSheets, updateGSheets } from "./g-sheets/gheet"
import { getPhmnStats } from "./onchain-data/phmnStats"
import { getRespStats } from "./onchain-data/respStats"
import { getSbtStats } from "./onchain-data/sbtStats"
import { TelegramBot } from "./telegram/telegram"

export async function app() {
    // updateDBs()
    // TelegramBot.run()
    // await updateStats()
    // async function updateStats() {
    //     try {
    //         const [
    //             phmnStats,
    //             respStats,
    //         ] = await Promise.all([
    //             getPhmnStats(),
    //             getRespStats(),
    //         ]) 
            
    //         // PHMN stats
    //         setLastPhmnStats(phmnStats)
    //         await writeInfluxDbPoints([phmnStats.phmnStatsPoint], "stats")
    //         await writeInfluxDbPoints(phmnStats.subDaoTreasurys, "stats")
    //         await writeInfluxDbPoints(phmnStats.phmnBalancesPoints, "addresses")
    //         await writeInfluxDbPoints(phmnStats.dasMembersPoints, "addresses")
    //         await writeInfluxDbPoints(phmnStats.dasUnbondings, "addresses")
            
    //         // RESP stats
    //         await writeInfluxDbPoints(respStats.respStatsPoints, "stats")
    //         await writeInfluxDbPoints(respStats.subDaoTreasurys, "stats")
    //         await writeInfluxDbPoints(respStats.respBalancesPoints, "addresses")

    //         console.log(new Date().toLocaleString('ru'), 'Stats updated')

    //         try {
    //             await clearGSheets()
    //             await updateGSheets(phmnStats)
                
    //             console.log(new Date().toLocaleString('ru'), 'Google Sheets updated')
    //         } catch (err) {
    //             console.error(new Date().toLocaleString('ru'), err)
    //         }
            
    //         setTimeout(updateStats, 60*1000)
    //     } catch (err) {
    //         setTimeout(updateStats, 5*1000)
    //         console.error(new Date().toLocaleString('ru'), err)
    //     }
    // }
    
    await updateNftStats()
    async function updateNftStats() {
        try {
            console.log(new Date().toLocaleString('ru'), 'get data...')
            const sbtStats = await getSbtStats()
            // await writeInfluxDbPoints(sbtStats, "nft")
            
            console.log(new Date().toLocaleString('ru'), 'sbtInfo.length = ', sbtStats)

            // setTimeout(updateNftStats, 60*1000)
        } catch (err) {
            // setTimeout(updateNftStats, 5*1000)
            console.error(new Date().toLocaleString('ru'), err)
        }
    }
}