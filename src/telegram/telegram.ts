import { Markup, Telegraf } from 'telegraf'
import { FmtString, bold, fmt, link, italic, code } from 'telegraf/format'
import { getLastPhmnPrices } from '../db/lastUpdate'
import { addMsg, deleteChatMsgs, getChatMsgs } from '../db/sqlite'
import { denomPHMNcosmos } from '../onchain-data/cosmoshub/phmnConfig.json'

export type NotificationMsg = {
    msg:FmtString,
    daoTag: string
}

if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('"TELEGRAM_BOT_TOKEN" env var is required!');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!process.env.TELEGRAM_ADMIN_ID) throw new Error('"TELEGRAM_ADMIN_ID" env var is required!');
const ADMIN = +process.env.TELEGRAM_ADMIN_ID
if (!process.env.SERVICE_CHAT_ID) throw new Error('"SERVICE_CHAT_ID" env var is required!')
const SERVICE_CHAT_ID = +process.env.SERVICE_CHAT_ID

process.once("SIGINT", () => {
    TelegramBot.bot.stop("SIGINT")
    process.exit()
})
process.once("SIGTERM", () => {
    TelegramBot.bot.stop("SIGTERM")
    process.exit
})

const getPhmnPriceMsg = (date: number) => {
    const prices = getLastPhmnPrices()
    
    let msg = fmt``
    msg = fmt(msg, bold`💲PHMN price:  $${prices.phmnPrice?.toFixed(2) || 'n/a'}\n`)
    msg = fmt(msg, italic`updated ${prices.lastUpdateTime ? date - Math.floor(prices.lastUpdateTime?.valueOf()/1000) : 'n/a'} sec ago\n\n`)
    msg = fmt(msg, `1 BTC = ${prices.phmnPerBtc?.toFixed(1) || 'n/a'} PHMN\n`)
    msg = fmt(msg, `1 PHMN = ${prices.weirdPerPhmn?.toFixed(0) || 'n/a'} Weird\n\n`)
    msg = fmt(msg, link('More stats here', 'https://phmn-stats.posthuman.digital'))
    
    return msg
}

const getPhmnInfoMsg = () => {
    let msg = fmt``
    msg = fmt(msg, bold`PHMN denom: \n`)
    msg = fmt(msg, code`${denomPHMNcosmos}`)

    const links = Markup.inlineKeyboard([
        [
            Markup.button.url("Website", "https://posthuman.digital/"),
            Markup.button.url("Claim PHMN drop", "https://claim.posthuman.digital/claim")
        ],
        [
            Markup.button.url("DAS", "https://daodao.zone/dao/cosmos1lj6knrgumqr5a9jxmkqeag476gmzgn24mv0w3548tyw6a5ryr7ms6xl599/home"),
            Markup.button.url("SubDAOs Chat", "https://t.me/+HzMN6JKxn941ZDMy"),
            Markup.button.url("Community", "https://t.me/posthumanchat_ru"),
        ]
    ])

    return {msg, links}
}

const getWeirdPriceMsg = (date: number) => {
    const prices = getLastPhmnPrices()
    
    const weirdPrice = prices.phmnPrice && prices.weirdPerPhmn ? (prices.phmnPrice/prices.weirdPerPhmn).toFixed(6) : 'n/a'

    let msg = fmt``
    msg = fmt(msg, bold`💲WEIRD price:  $${weirdPrice}\n`)
    msg = fmt(msg, italic`updated ${prices.lastUpdateTime ? date - Math.floor(prices.lastUpdateTime?.valueOf()/1000) : 'n/a'} sec ago\n\n`)
    
    msg = fmt(msg, `1 PHMN = ${prices.weirdPerPhmn?.toFixed(0) || 'n/a'} WEIRD\n`)
    msg = fmt(msg, `1 WEIRD = ${prices.sinPerWeird?.toFixed(2) || 'n/a'} SIN\n\n`)
    
    msg = fmt(msg, link('Buy WEIRD on Osmosis', 'https://app.osmosis.zone/?utm_source=osmosis_landing_page&utm_campaign=swap&from=USDC&to=WEIRD&sellOpen=false&buyOpen=false'))
    
    return msg
}

export class TelegramBot {
    static isRuning = false
    
    static lastPriceMsgs: {
        chatId: number;
        msgId: number
    }[] = []

    static bot = new Telegraf(TOKEN)
        .start((ctx) => {
            const welcomeMsg = fmt('Welcome, ', ctx.from.first_name, '!',
            )
            ctx.reply(welcomeMsg)
        })
        .hears('id', (ctx) => {
            if (ctx.from.id !== ADMIN) return;
            ctx.reply('Chat ID:' + ctx.chat.id.toString() + 
                '\nTopic ID:' + ctx.message.message_thread_id?.toString() +
                '\nUser Id: ' + ctx.from.id.toString()
            )
        })
        .command('phmn_price', async ctx => {
            const msgs = await getChatMsgs(ctx.chat.id)
            await deleteChatMsgs(ctx.chat.id)
            await addMsg({msgId: ctx.message.message_id, chatId: ctx.chat.id})
            
            const msg = await ctx.reply(
                getPhmnPriceMsg(ctx.message.date), 
                ctx.message.reply_to_message ? {
                    reply_parameters: {
                        message_id: ctx.message.reply_to_message.message_id
                    }
                } : undefined
            )
            
            await addMsg({msgId: msg.message_id, chatId: msg.chat.id})
            await ctx.deleteMessages(msgs)
        })
        .command('phmn_info', async ctx => {
            const msgs = await getChatMsgs(ctx.chat.id)
            await deleteChatMsgs(ctx.chat.id)
            await addMsg({msgId: ctx.message.message_id, chatId: ctx.chat.id})
            
            const {msg:txtMsg, links} = getPhmnInfoMsg()
            
            const msg = await ctx.reply(txtMsg, ctx.message.reply_to_message ? {
                reply_parameters: {
                    message_id: ctx.message.reply_to_message.message_id,

                },
                reply_markup: links.reply_markup
            } : links)
            
            await addMsg({msgId: msg.message_id, chatId: msg.chat.id})
            await ctx.deleteMessages(msgs)
        })
        .command('weird_price', async ctx => {
            const msgs = await getChatMsgs(ctx.chat.id)
            await deleteChatMsgs(ctx.chat.id)
            await addMsg({msgId: ctx.message.message_id, chatId: ctx.chat.id})
            
            const msg = await ctx.reply(
                getWeirdPriceMsg(ctx.message.date), 
                ctx.message.reply_to_message ? {
                    reply_parameters: {
                        message_id: ctx.message.reply_to_message.message_id,
                    },
                    link_preview_options: {is_disabled: true}
                } : {link_preview_options: {is_disabled: true}}
            )
            
            await addMsg({msgId: msg.message_id, chatId: msg.chat.id})
            await ctx.deleteMessages(msgs)
        })
       
    static run = () => {
        if(!this.isRuning) {
            this.bot.launch()
                .then((data) => console.log(data))
                .catch((err) => console.error(err))
                .finally(() => {
                    this.isRuning = false
                    setTimeout(this.run, 1000)
                })
            this.isRuning = true
        }
    }
}