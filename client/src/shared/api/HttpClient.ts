/** Shared transport concerns; feature services own endpoint paths and payloads. */
export default class HttpClient {
  get<TResponse>(url: string): Promise<TResponse> {
    return this.request<TResponse>(url, 'GET');
  }

  post<TResponse = void>(url: string, body?: unknown): Promise<TResponse> {
    return this.request<TResponse>(url, 'POST', body);
  }

  put<TResponse = void>(url: string, body: unknown): Promise<TResponse> {
    return this.request<TResponse>(url, 'PUT', body);
  }

  private async request<TResponse>(url: string, method: string, body?: unknown): Promise<TResponse> {
    const response = await fetch(url, {
      method,
      ...(body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error ?? `Request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as TResponse;
    return response.json() as Promise<TResponse>;
  }
}
