import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

export type HttpApiResponse = {
	body: any,
	headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
	statusCode?: number
}