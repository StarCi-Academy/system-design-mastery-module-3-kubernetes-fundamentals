import {
    Controller,
    Get,
} from "@nestjs/common"
import * as os from "os"

@Controller()
export class AppController {
    @Get("api/search")
    getSearch() {
        return {
            service: "Monolith Service",
            module: "Search",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            results: ["Product 1", "Product 2", "Product 3"],
        }
    }

    @Get("api/payment")
    getPayment() {
        return {
            service: "Monolith Service",
            module: "Payment",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            status: "Ready to process payments",
        }
    }
}
