/** Real-user Core Web Vitals → GA4 `web_vitals` events (CLAUDE.md §15). */
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { track } from './track';

function send(m: Metric) {
  track('web_vitals', {
    metric_name: m.name,
    metric_value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value),
    metric_rating: m.rating,
    metric_id: m.id,
  });
}

onLCP(send);
onCLS(send);
onINP(send);
onFCP(send);
onTTFB(send);
