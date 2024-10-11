export class EnvConfigError extends Error {
    name = 'EnvConfigError';
    protected configName: string;
    constructor(configName: string, message: string) {
        super(`Error in env variable ${configName}: ${message}`);
        this.configName = configName;
    }
}
