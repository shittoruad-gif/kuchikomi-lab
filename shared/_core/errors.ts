export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const ForbiddenError = (msg: string) => new HttpError(403, msg);
export const UnauthorizedError = (msg: string) => new HttpError(401, msg);
export const NotFoundError = (msg: string) => new HttpError(404, msg);
