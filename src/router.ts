export type RouteHandler = (
  request: Request,
  match: RegExpMatchArray
) => Promise<Response>;

export interface Route {
  method: string;
  path: RegExp;
  handler: RouteHandler;
}

export class Router {
  routes: Route[];

  constructor() {
    this.routes = [];
  }

  handle(method: string, path: RegExp, handler: RouteHandler) {
    this.routes.push({
      method,
      path,
      handler,
    });
    return this;
  }

  connect(url: RegExp, handler: RouteHandler) {
    return this.handle("CONNECT", url, handler);
  }

  delete(url: RegExp, handler: RouteHandler) {
    return this.handle("DELETE", url, handler);
  }

  get(url: RegExp, handler: RouteHandler) {
    return this.handle("GET", url, handler);
  }

  head(url: RegExp, handler: RouteHandler) {
    return this.handle("HEAD", url, handler);
  }

  options(url: RegExp, handler: RouteHandler) {
    return this.handle("OPTIONS", url, handler);
  }

  patch(url: RegExp, handler: RouteHandler) {
    return this.handle("PATCH", url, handler);
  }

  post(url: RegExp, handler: RouteHandler) {
    return this.handle("POST", url, handler);
  }

  put(url: RegExp, handler: RouteHandler) {
    return this.handle("PUT", url, handler);
  }

  trace(url: RegExp, handler: RouteHandler) {
    return this.handle("TRACE", url, handler);
  }

  async route(req: Request): Promise<Response> {
    for (let indRoute = 0; indRoute < this.routes.length; indRoute++) {
      const route = this.routes[indRoute];

      if (req.method.toUpperCase() !== route.method.toUpperCase()) continue;

      const reqUrl = new URL(req.url);
      const match = reqUrl.pathname.match(route.path);
      if (match === null) continue;

      return route.handler(req, match);
    }

    return new Response("Resource not found", {
      status: 404,
      statusText: "not found",
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
