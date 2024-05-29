import { writeInfluxDbPoints } from "./db/ifluxdb"
import { getPhmnStats } from "./onchain-data/phmnStats"


export async function app() {
    await update()
    async function update() {
        try {
            const phmnStats = await getPhmnStats()
            await writeInfluxDbPoints([phmnStats.phmnStatsPoint], "phmnStats")
            await writeInfluxDbPoints(phmnStats.subDaoTreasurys, "phmnStats")
            await writeInfluxDbPoints(phmnStats.phmnBalancesPoints, "phmnAddresses")
            await writeInfluxDbPoints(phmnStats.dasMembersPoints, "phmnAddresses")
            await writeInfluxDbPoints(phmnStats.dasUnbondings, "phmnAddresses")
            console.log(new Date().toLocaleString('ru'), 'Phmn Stats updated')
            
            setTimeout(update, 60*1000)
        } catch (err) {
            setTimeout(update, 5*1000)
            console.error(err)
        }
    }
}