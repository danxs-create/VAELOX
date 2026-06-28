import { IModelProvider } from '../providers/IModelProvider';
import { ModelCapability } from './capabilities';
import { ProviderManager } from './ProviderManager';

export interface RouteCriteria {
  requiredCapabilities?: ModelCapability[];
  maxCost?: number;
  maxLatency?: number;
  minContextWindow?: number;
}

export class ModelRouter {
  constructor(private manager: ProviderManager) {}

  public route(criteria: RouteCriteria): IModelProvider | undefined {
    const active = this.manager.getActiveProviders();

    for (const provider of active) {
      const meta = provider.metadata;
      if (!meta) continue;

      let match = true;

      if (criteria.requiredCapabilities) {
        const hasCaps = criteria.requiredCapabilities.every(cap => 
          meta.capabilities.includes(cap)
        );
        if (!hasCaps) match = false;
      }

      if (criteria.minContextWindow && meta.contextWindow < criteria.minContextWindow) {
        match = false;
      }

      if (criteria.maxCost && meta.pricing.inputPer1k > criteria.maxCost) {
        match = false;
      }

      if (match) {
        return provider;
      }
    }

    return this.manager.getFallbackProvider();
  }
}
