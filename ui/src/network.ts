import axios from 'axios'

import {UserModel} from "./models/user";

class NETWORK {
    static axiosInstance: any = axios.create({
        baseURL: process.env.REACT_APP_SERVER_URL,
        withCredentials: true
    })

    static async get_run(run_uuid: string): Promise<any> {
        return this.axiosInstance.get(`/run/${run_uuid}`)
    }

    static async get_status(run_uuid: string): Promise<any> {
        return this.axiosInstance.get(`/status/${run_uuid}`)
    }

    static async get_tracking(run_uuid: string): Promise<any> {
        return this.axiosInstance.post(`/track/${run_uuid}`, {})
    }

    static async get_runs(labml_token: string | null): Promise<any> {
        return this.axiosInstance.get(`/runs/${labml_token}`, {})
    }

    static async get_user(): Promise<any> {
        return this.axiosInstance.get(`/user`, {})
    }

    static async sign_in(data: UserModel): Promise<any> {
        return this.axiosInstance.post(`/auth/sign_in`, data)
    }

    static async sign_out(): Promise<any> {
        return this.axiosInstance.delete(`/auth/sign_out`)
    }
}

export default NETWORK