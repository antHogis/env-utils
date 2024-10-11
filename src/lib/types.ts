import { ConfigValueHolder } from './config-value-holder';

export type ShortEnvNames = 'dev' | 'test' | 'prod';
export type LongEnvNames = 'development' | 'test' | 'production';

// Custom translator for env variable
export type EnvTranslatorFunction<T> = (value: string) => T;

// Translator of env variable, built-in or custom
export type EnvTranslator<T> =
    | 'string'
    | 'boolean'
    | 'integer'
    | 'float'
    | 'array'
    | 'dict'
    | EnvTranslatorFunction<T>;

export interface EnvUtilsOptions<TEnvName extends string> {
    /**
     * If defined, all env variables are prefixed with this value when retrieved.
     *
     * @example
     * const envUtils = new EnvUtils({ envPrefix: 'FOO_' });
     * const myVar = envUtils.env.MY_VAR.get(); // Gets value from FOO_MY_VAR
     */
    envPrefix?: string;

    /**
     * The env object to retrieve env variables from. Set this if env variables should be retrieved
     * from some other object than process.env.
     */
    envObject?: any;

    /**
     * The name of the environment. By default determined by the NODE_ENV env variable.
     */
    envName?: TEnvName;

    /**
     * If true, don't throw errors immediately when translating config value.
     * Instead set erros as values, so they can be collected by EnvUtils.validate
     */
    lazyValidation?: boolean;
}

export interface EnvUtilsReturn<TEnvName extends string> {
    validateEnv<T>(config: T): T;
    env: Record<string, ConfigValueHolder<TEnvName>>;
}

export type EnvDefaultMap<TEnvName extends string, TValue> = {
    [key in TEnvName]?: TValue;
};
