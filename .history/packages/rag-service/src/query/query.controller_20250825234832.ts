import { Body, Controller, Post } from '@nestjs/common';
import { QueryService } from './query.service.js';

export interface QueryDto {
  query: string;
}

@Controller('query')
export class QueryController {
  constructor(private readonly svc: QueryService) {}

  @Post()
  async query(@Body() body: QueryDto) {
    return this.svc.search(body.query);
  }
}

