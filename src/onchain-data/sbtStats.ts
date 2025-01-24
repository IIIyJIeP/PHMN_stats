import { denomIDs } from './omniflix/sbtConfig.json'
import { getLcdCollectionInfo } from './omniflix/omniflixLcdRequests'
import { WritePoint } from "../db/ifluxdb"
import * as fs from 'fs'
import { unparse } from 'papaparse'


const { SBT_COLLECTION_DENOM_ID } = denomIDs

interface GroupedData {
    [key: string]: {
        epoch: string,
        type: "common" | "bronze" | "silver" | "gold" | "platinum" | "brilliant" | "total",
        sbtCount: number,
        owners: Set<string>,
    }
}



export async function getSbtStats() {
    try {
        const sbtInfo = await getLcdCollectionInfo(SBT_COLLECTION_DENOM_ID)

        // Подготовка структуры для хранения данных
        const types = ['common', 'bronze', 'silver', 'gold', 'platinum', 'brilliant']
        const groupedByType: Record<string, Record<string, number>> = {}

        // Инициализация структуры для каждого типа
        types.forEach(type => {
            groupedByType[type] = {}
        })

        // Группировка данных по `type` и `owner`
        sbtInfo.forEach(({ owner, type }) => {
            if (!groupedByType[type]) return
            if (!groupedByType[type][owner]) {
                groupedByType[type][owner] = 0
            }
            groupedByType[type][owner]++
        })

        // Генерация CSV-файлов для каждого типа
        types.forEach(type => {
            const data = Object.entries(groupedByType[type]).map(([address, number]) => ({
                address,
                number,
            }))

            const csvString = unparse(data)

            const outputDir = './output'

            // Убедимся, что папка для вывода существует
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir)
            }
            const outputPath = `${outputDir}/${type}.csv`

            // Сохранение файла
            fs.writeFileSync(outputPath, csvString, 'utf-8')
            console.log(`Файл ${type}.csv успешно сохранён в: ${outputPath}`)
        })






        return sbtInfo.length
    } catch (e) {
        console.error(e)
        return []
    }
}