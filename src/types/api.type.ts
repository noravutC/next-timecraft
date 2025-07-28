export interface APIGet<T> {
    data: T[];
    message: string;
    status: number;
}

export interface APISingleGet<T> {
    data: T;
    message: string;
    status: number;
}

export interface APIPost<T> {
    created : T;
    message: string;
    status: number;
}

export interface APIPut<T> {
    updated : T;
    message: string;
    status: number;
}

export interface APIPatch<T> {
    updated : T;
    message: string;
    status: number;
}

export interface APIError {
    message: string;
    status: number;
}