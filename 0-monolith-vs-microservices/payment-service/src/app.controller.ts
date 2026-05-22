import {
    Controller,
    Get,
} from "@nestjs/common"
import * as os from "os"

@Controller()
export class AppController {
    @Get()
    getPayment() {
        return {
            service: "Payment Service",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            status: "Ready to process payments",
        }
    }
}
