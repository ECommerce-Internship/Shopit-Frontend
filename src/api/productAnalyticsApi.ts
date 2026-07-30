import axiosInstance from './axiosInstance';
import { authStore } from '../context/authStore';

// Product-interest analytics (SCRUM: clicks + time-spent). Two record endpoints
// capture visitor signals as people browse the site; two stats endpoints let a
// product's seller (and admins) read the aggregates back for their dashboard.
//
// See Shopit.API ProductAnalyticsController — record endpoints are
// [AllowAnonymous]; stats endpoints are [Authorize(Roles = "Seller,Admin")].

export type ProductClickStats = {
  productId: number;
  totalClicks: number;
  uniqueUsers: number;
};

export type ProductTimeSpentStats = {
  productId: number;
  /** Sum of all recorded dwell times, in milliseconds. */
  totalDurationMs: number;
  /** Average dwell time per recorded session, in milliseconds. */
  averageDurationMs: number;
  /** Number of time-spent events that make up these figures. */
  sampleCount: number;
};

// ── Recording (fire-and-forget) ──────────────────────────────────────────────
// Uses fetch with keepalive rather than axios so the request still leaves the
// browser while the page is unloading (tab close / navigation) — an XHR started
// during unload is normally cancelled. Auth is optional: the endpoints accept
// anonymous visitors, but we attach the bearer token when present so the backend
// can attribute the interaction to the user for unique-visitor counts. Failures
// are swallowed — analytics must never disrupt the shopping experience.
function recordInteraction(path: string, body?: unknown): void {
  const token = authStore.getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  void fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    keepalive: true,
  }).catch(() => {
    /* ignore analytics failures */
  });
}

/** Records a click/view on a product. */
export function recordProductClick(productId: number): void {
  recordInteraction(`/api/v1/products/${productId}/clicks`);
}

/** Records the dwell time (in milliseconds) a visitor spent on a product page. */
export function recordTimeSpent(productId: number, durationMs: number): void {
  recordInteraction(`/api/v1/products/${productId}/time-spent`, { durationMs });
}

// ── Reading stats (seller/admin) ─────────────────────────────────────────────

export async function fetchClickStats(productId: number): Promise<ProductClickStats> {
  const response = await axiosInstance.get<ProductClickStats>(
    `/api/v1/products/${productId}/clicks/stats`,
  );
  return response.data;
}

export async function fetchTimeSpentStats(productId: number): Promise<ProductTimeSpentStats> {
  const response = await axiosInstance.get<ProductTimeSpentStats>(
    `/api/v1/products/${productId}/time-spent/stats`,
  );
  return response.data;
}
