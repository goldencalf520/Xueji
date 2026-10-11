import { describe, expect, it } from 'vitest';
import { collectRoutes, type FeatureRoute } from './route-registry';

const route = (name: string, order?: number): FeatureRoute => ({
  path: name,
  name,
  component: () => Promise.resolve({}),
  meta: { title: name, order },
});

describe('collectRoutes', () => {
  it('合并多个功能目录的路由并按 order 排序', () => {
    const routes = collectRoutes({
      a: { default: [route('b', 20)] },
      b: { default: [route('a', 10), route('c')] },
    });
    expect(routes.map((r) => r.name)).toEqual(['a', 'b', 'c']);
  });
});
