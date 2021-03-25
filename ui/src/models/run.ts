import {Config, ConfigModel} from "./config"

export interface RunModel {
    run_uuid: string
    name: string
    comment: string
    tags: string[]
    note: string
    start_time: number
    python_file: string
    repo_remotes: string
    commit: string
    commit_message: string
    start_step: number
    is_claimed: boolean
    is_project_run: boolean
    configs: ConfigModel[]
    stdout: string
    logger: string
    stderr: string
}

export interface PointValue {
    step: number
    value: number
    smoothed: number
}

export interface SeriesModel {
    name: string
    step: number[]
    value: number[]
    smoothed: number[]
    mean: number
    series: PointValue[]
    is_editable: boolean
    sub: SeriesModel
}

export interface InsightModel {
    message: string
    type: string
    time: number
}

export interface AnalysisDataModel {
    series: any[]
    insights: InsightModel[]
    summary: any[]
}

export class Run {
    run_uuid: string
    name: string
    comment: string
    note: string
    tags: string[]
    start_time: number
    python_file: string
    repo_remotes: string
    commit: string
    commit_message: string
    start_step: number
    is_claimed: boolean
    is_project_run: boolean
    configs: Config[]
    dynamic: object
    stdout: string
    logger: string
    stderr: string

    constructor(run: RunModel) {
        this.run_uuid = run.run_uuid
        this.name = run.name
        this.comment = run.comment
        this.note = run.note
        this.tags = run.tags
        this.start_time = run.start_time
        this.python_file = run.python_file
        this.repo_remotes = run.repo_remotes
        this.commit = run.commit
        this.commit_message = run.commit_message
        this.start_step = run.start_step
        this.is_claimed = run.is_claimed
        this.is_project_run = run.is_project_run
        this.configs = []
        for (let c of run.configs) {
            this.configs.push(new Config(c))
        }
        this.stdout = run.stdout
        this.logger = run.logger
        this.stderr = run.stderr
    }
}

