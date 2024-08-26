import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function updateDBs() {
    const db = await open({
        filename: './src/db/lastMsgs.db',
        driver: sqlite3.Database
    })
    await db.exec('CREATE TABLE if not exists Msgs(chatId text, msgId text)')
    await db.close()
}

export async function addMsg({chatId, msgId}: {chatId: number, msgId: number}) {
    const db = await open({
        filename: './src/db/lastMsgs.db',
        driver: sqlite3.Database
    })
    const sql = 'INSERT INTO Msgs(chatId, msgId) VALUES(:chatId, :msgId)'
    await db.run(sql,{
        ':chatId': chatId.toString(),
        ':msgId': msgId.toString(),
    })
    await db.close()
}

export async function getChatMsgs(chatId: number) {
    const db = await open({
        filename: './src/db/lastMsgs.db',
        driver: sqlite3.Database
    })
    const sql = `SELECT msgId FROM Msgs WHERE chatId=${chatId.toString()}`
    
    const results = await db.all(sql)
    await db.close()

    return results.map(res => Number(res.msgId))
}

export async function deleteChatMsgs(chatId: number) {
    const db = await open({
        filename: './src/db/lastMsgs.db',
        driver: sqlite3.Database
    })
    const sql = `DELETE FROM Msgs WHERE chatId=${chatId.toString()}`
    await db.exec(sql)
    await db.close()
}