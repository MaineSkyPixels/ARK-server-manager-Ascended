import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get message from HttpException - use getResponse() and extract message
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      } else {
        message = exception.message || 'Internal server error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error details
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(`HTTP ${status}: ${message} - ${request.method} ${request.url}`);
    }

    // Build error response
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Include validation errors if available
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        if ('message' in exceptionResponse && Array.isArray(exceptionResponse.message)) {
          errorResponse.message = exceptionResponse.message;
        }
      }
    }

    response.status(status).send(errorResponse);
  }
}

