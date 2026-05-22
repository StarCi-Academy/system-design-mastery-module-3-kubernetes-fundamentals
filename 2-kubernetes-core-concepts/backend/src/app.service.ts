import {
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    createConnection,
    Connection,
} from "mysql2/promise"
import {
    createClient,
    RedisClientType,
} from "redis"
import type {
    AppConfig,
} from "./config/app.config"
import type {
    DatabaseConfig,
} from "./config/database.config"
import type {
    RedisConfig,
} from "./config/redis.config"
import type {
    CreateItemResponse,
    GetItemsResponse,
    HealthResponse,
    ItemRow,
} from "./types"

@Injectable()
export class AppService implements OnModuleInit {
    private readonly logger = new Logger(AppService.name)
    private redisClient?: RedisClientType
    private mysqlConn?: Connection
    private readonly redisCfg: RedisConfig
    private readonly databaseCfg: DatabaseConfig
    private readonly podName: string

    constructor(private readonly configService: ConfigService) {
        this.redisCfg = this.configService.get<RedisConfig>("redis")!
        this.databaseCfg = this.configService.get<DatabaseConfig>("database")!
        const app = this.configService.get<AppConfig>("app")!
        this.podName = app.podName
    }

    async onModuleInit(): Promise<void> {
        this.initRedis()
        this.initMySQL()
    }

    private parseCachedItems(raw: string): ReadonlyArray<ItemRow> {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item): item is ItemRow =>
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item) &&
            typeof (item as ItemRow).id === "number" &&
            typeof (item as ItemRow).name === "string",
        )
    }

    private async initRedis(): Promise<void> {
        const url = `redis://${this.redisCfg.host}:${this.redisCfg.port}`
        while (true) {
            try {
                this.redisClient = createClient({ url })
                this.redisClient.on("error", (err) =>
                    this.logger.error("Redis Client Error", err),
                )
                await this.redisClient.connect()
                this.logger.log("Successfully connected to Redis")
                break
            } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error"
                this.logger.warn(`Redis not ready (${message}). Retrying in 5s...`)
                await new Promise((resolve) => setTimeout(resolve, 5000))
            }
        }
    }

    private async initMySQL(): Promise<void> {
        const db = this.databaseCfg
        const mysqlOptions = {
            host: db.host,
            port: db.port,
            user: db.username,
            password: db.password,
            database: db.database,
        }
        while (true) {
            try {
                this.mysqlConn = await createConnection(mysqlOptions)
                await this.mysqlConn.execute(`
                    CREATE TABLE IF NOT EXISTS items (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL
                    )
                `)
                this.logger.log("Successfully connected to MySQL and ensured table exists")
                break
            } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error"
                this.logger.warn(`MySQL not ready (${message}). Retrying in 5s...`)
                await new Promise((resolve) => setTimeout(resolve, 5000))
            }
        }
    }

    async getHealth(): Promise<HealthResponse> {
        return {
            mysql: this.mysqlConn ? "connected" : "disconnected",
            redis: this.redisClient?.isReady ? "connected" : "disconnected",
            podName: this.podName,
        }
    }

    async createItem(name: string): Promise<CreateItemResponse> {
        if (!this.mysqlConn) {
            this.logger.error("Cannot create item: DB disconnected")
            return { error: "DB not connected" }
        }
        await this.mysqlConn.execute("INSERT INTO items (name) VALUES (?)", [name])
        if (this.redisClient?.isReady) {
            await this.redisClient.del("items_list")
            this.logger.log(`Item "${name}" created and cache invalidated`)
        } else {
            this.logger.log(`Item "${name}" created (Redis skipped)`)
        }
        return { success: true }
    }

    async getItems(): Promise<GetItemsResponse | { error: string }> {
        if (this.redisClient?.isReady) {
            const cached = (await this.redisClient.get("items_list")) as string | null
            if (cached) {
                this.logger.log("Cache hit for items_list")
                return {
                    data: this.parseCachedItems(cached),
                    source: "cache",
                    podName: this.podName,
                }
            }
        }
        if (!this.mysqlConn) {
            this.logger.error("Cannot get items: DB disconnected")
            return { error: "DB not connected" }
        }
        this.logger.log("Cache miss. Fetching from MySQL...")
        const [rows] = await this.mysqlConn.execute("SELECT * FROM items")
        const data: ReadonlyArray<ItemRow> = Array.isArray(rows)
            ? rows.filter((row): row is ItemRow =>
                typeof row === "object" &&
                row !== null &&
                !Array.isArray(row) &&
                typeof (row as ItemRow).id === "number" &&
                typeof (row as ItemRow).name === "string",
            )
            : []
        if (this.redisClient?.isReady) {
            await this.redisClient.setEx("items_list", 60, JSON.stringify(data))
            this.logger.log("Saved items_list to Cache")
        }
        return {
            data,
            source: "database",
            podName: this.podName,
        }
    }
}
