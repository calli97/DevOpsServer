const getBaseUrl = () => localStorage.getItem('devops_url') ?? ''
const getApiKey  = () => localStorage.getItem('devops_apikey') ?? ''

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(getBaseUrl() + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

export const api = {
  status: () => request<{ ok: boolean }>('GET', '/status'),

  projects: {
    list:     ()                      => request('GET',    '/projects'),
    getById:  (id: number)            => request('GET',    `/projects/${id}`),
    create:   (data: unknown)         => request('POST',   '/projects', data),
    update:   (id: number, data: unknown) => request('PUT', `/projects/${id}`, data),
    delete:   (id: number)            => request('DELETE', `/projects/${id}`),
  },

  instances: {
    getById:  (id: number)            => request('GET',    `/project-instances/${id}`),
    create:   (data: unknown)         => request('POST',   '/project-instances', data),
    update:   (id: number, data: unknown) => request('PUT', `/project-instances/${id}`, data),
    delete:   (id: number)            => request('DELETE', `/project-instances/${id}`),
    start:    (id: number)            => request('POST',   `/project-instances/${id}/start`),
  },

  deploys: {
    create:   (data: unknown)             => request('POST',   '/deploys', data),
    update:   (id: number, data: unknown) => request('PUT',    `/deploys/${id}`, data),
    delete:   (id: number)                => request('DELETE', `/deploys/${id}`),
    start:    (id: number)                => request('POST',   `/deploys/${id}/start`),
    stop:     (id: number)                => request('POST',   `/deploys/${id}/stop`),
  },

  configFiles: {
    create:   (data: unknown)             => request('POST',   '/config-files', data),
    update:   (id: number, data: unknown) => request('PUT',    `/config-files/${id}`, data),
    delete:   (id: number)                => request('DELETE', `/config-files/${id}`),
  },

  slaveServers: {
    list:     ()                      => request('GET',    '/slave-servers'),
    create:   (data: unknown)         => request('POST',   '/slave-servers', data),
    delete:   (id: number)            => request('DELETE', `/slave-servers/${id}`),
  },
}
