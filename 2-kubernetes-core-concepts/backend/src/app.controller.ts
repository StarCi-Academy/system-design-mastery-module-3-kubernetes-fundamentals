import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"
import {
    CreateItemResponse,
    GetItemsResponse,
    HealthResponse,
} from "./types"

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get("health")
    async getHealth(): Promise<HealthResponse> {
        return this.appService.getHealth()
    }

    @Post("items")
    async createItem(@Body() body: { name: string }): Promise<CreateItemResponse> {
        return this.appService.createItem(body.name)
    }

    @Get("items")
    async getItems(): Promise<GetItemsResponse | { error: string }> {
        return this.appService.getItems()
    }
}
