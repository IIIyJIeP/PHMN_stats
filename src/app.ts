import 'dotenv/config'

const lcdEndpoint = process.env.LCD_ENDPOINT_OSMO || 'https://lcd.osmosis.zone'

export async function app() {
    await update()
    async function update() {
        try {
            console.log(new Date().toLocaleString('ru'), 'Hello!')

            setTimeout(update, 60*1000)
        } catch (err) {
            setTimeout(update, 5*1000)
            console.error(err)
        }
    }
}
