import { InfluxDB, Point } from '@influxdata/influxdb-client'

if (!process.env.INFLUXDB_TOKEN) throw new Error('"INFLUXDB_TOKEN" env var is required!');
const ifluxDBToken = process.env.INFLUXDB_TOKEN
if (!process.env.INFLUXDB_URL) throw new Error('"INFLUXDB_URL" env var is required!');
const ifluxDbUrl = process.env.INFLUXDB_URL
if (!process.env.INFLUXDB_ORG) throw new Error('"INFLUXDB_ORG" env var is required!');
const org = process.env.INFLUXDB_ORG
    


if (!process.env.PHMN_STATS_BUCKET) throw new Error('"PHMN_STATS_BUCKET" env var is required!');
if (!process.env.PHMN_ADDRESSES_BUCKET) throw new Error('"PHMN_ADDRESSES_BUCKET" env var is required!');
if (!process.env.NFT_BUCKET) throw new Error('"NFT_BUCKET" env var is required!');

const BUCKETS = {
    stats: process.env.PHMN_STATS_BUCKET,
    addresses: process.env.PHMN_ADDRESSES_BUCKET,
    nft: process.env.NFT_BUCKET,
}
type Bucket = 'stats' | 'addresses' | 'nft'

const client = new InfluxDB({url: ifluxDbUrl, token: ifluxDBToken})

export type WritePoint = {
    measurement: string,
    time: Date,
    tags: {
        name: string,
        value: string
    }[],
    fields: {
        name: string,
        value: number
    }[]
}

export async function writeInfluxDbPoints(writePoints: WritePoint[], bucket: Bucket) {
    const writeApi = client.getWriteApi(org, BUCKETS[bucket], 'ms')
    
    for (let writePoint of writePoints) {
        const point = new Point(writePoint.measurement).timestamp(writePoint.time)
        for (let tag of writePoint.tags) {
            point.tag(tag.name, tag.value)
        }
        for (let field of writePoint.fields) {
            point.floatField(field.name, field.value)
        }
        writeApi.writePoint(point)
    }

    return await writeApi.close()
}
