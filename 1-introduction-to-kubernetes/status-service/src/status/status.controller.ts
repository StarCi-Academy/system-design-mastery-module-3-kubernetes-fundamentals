import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    StatusService,
} from "."

@Controller()
export class StatusController {
    constructor(private readonly statusService: StatusService) {}

    @Get("status")
    getStatus() {
        return this.statusService.getStatus()
    }
}
