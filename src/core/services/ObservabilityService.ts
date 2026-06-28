import { BaseService } from './BaseService';
import { ILoggerProvider } from '../providers/ILoggerProvider';
import { Metrics } from '../../types';

export class ObservabilityService extends BaseService {
  constructor(private _logger: ILoggerProvider) {
    super('ObservabilityService');
  }

  public logEvent(event: string, data?: Record<string, unknown>): void {
    this._logger.info(`Event: ${event}`, data);
  }

  public recordMetrics(metrics: Metrics): void {
    this._logger.debug('Metrics recorded', metrics);
  }
}
