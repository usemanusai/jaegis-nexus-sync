import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const required = process.env.RAG_API_KEY
    if (!required) return true
    const header = req.headers['x-api-key'] as string | undefined
    return header === required
  }
}

