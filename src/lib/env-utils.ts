import { ConfigValueHolder } from './config-value-holder';
import { EnvConfigError } from './error';
import { EnvUtilsOptions, EnvUtilsReturn, ShortEnvNames } from './types';

export function envUtils<TEnvName extends string = ShortEnvNames>(
    options: EnvUtilsOptions<TEnvName> = {},
): EnvUtilsReturn<TEnvName> {
    const instance = new EnvUtils<TEnvName>(options);

    return {
        env: instance.env,
        validateEnv: instance.validate.bind(instance),
    };
}

export class EnvUtils<TEnvName extends string> {
    private readonly envObject: Record<string, unknown>;
    private readonly envPrefix: string;
    private readonly envName: TEnvName;
    private readonly lazyValidation: boolean;

    constructor(options: EnvUtilsOptions<TEnvName> = {}) {
        if (options.envObject) {
            this.envObject = options.envObject;
        } else if (process?.env) {
            this.envObject = process.env;
        } else {
            throw Error(
                `No envObject defined in EnvUtils options, and process.env is not available`,
            );
        }

        if (options.envName) {
            this.envName = options.envName;
        } else if (typeof this.envObject.NODE_ENV === 'string') {
            this.envName = this.envObject.NODE_ENV as TEnvName;
        } else {
            this.envName = 'undefined' as TEnvName;
        }

        this.envPrefix = options.envPrefix || '';
        this.lazyValidation = options.lazyValidation === true;
    }

    // Collects all configuration errors from config.
    validate<T>(config: T): T {
        let errors: EnvConfigError[] = [];

        // Gets errors recursively from config
        function getErrors(current: any) {
            if (current instanceof EnvConfigError) {
                errors.push(current);
            } else if (current && typeof current === 'object') {
                for (const key in current) {
                    if (current.hasOwnProperty(key)) {
                        getErrors(current[key]); // Recursion
                    }
                }
            }
        }

        getErrors(config);

        if (errors.length === 0) {
            return config;
        }

        const errorPlural = errors.length > 1 ? 'errors' : 'error';
        throw Error(
            `Errors in configuration with env "${this.envName}" (${errors.length} ${errorPlural}):\n` +
                errors.map((err) => '-> ' + err.message).join('\n'),
        );
    }

    // Create an object which return a ConfigValueHolder for any key.
    get env(): Record<string, ConfigValueHolder<TEnvName>> {
        const envManager = this;
        return new Proxy(this.envObject, {
            get(target: Record<string, unknown>, prop: string): ConfigValueHolder<TEnvName> {
                const val = target[envManager.envPrefix + prop];
                return new ConfigValueHolder(
                    prop,
                    typeof val === 'string' ? val : undefined,
                    envManager.envName,
                    envManager.lazyValidation,
                );
            },
        }) as Record<string, ConfigValueHolder<TEnvName>>;
    }
}
