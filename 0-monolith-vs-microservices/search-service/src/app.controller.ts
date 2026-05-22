import {
    Controller,
    Get,
} from "@nestjs/common"
import * as os from "os"

@Controller()
export class AppController {
    @Get()
    getSearch() {
        return {
            service: "Search Service",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            results: ["Product 1", "Product 2", "Product 3"],
        }
    }
}
