import { IMiddleware, RequestContext } from './middleware';
import { ProviderResponse } from '../../types';

export class RequestPipeline {
  private middlewares: IMiddleware[] = [];

  public use(middleware: IMiddleware): void {
    this.middlewares.push(middleware);
  }

  public async execute(
    context: RequestContext,
    finalHandler: (ctx: RequestContext) => Promise<ProviderResponse>
  ): Promise<ProviderResponse> {
    let index = -1;

    const dispatch = async (i: number): Promise<ProviderResponse> => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;

      if (i === this.middlewares.length) {
        return finalHandler(context);
      }

      const middleware = this.middlewares[i];
      return middleware.execute(context, () => dispatch(i + 1));
    };

    return dispatch(0);
  }
}
