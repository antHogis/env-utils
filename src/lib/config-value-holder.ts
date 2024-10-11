import { EnvTranslator, EnvDefaultMap } from './types';
import { EnvConfigError } from './error';

// Utility for translating/casting config values
export class ConfigValueHolder<TEnvName extends string, TValue = string> {
    private readonly name: string;
    private readonly value: string | undefined;
    private readonly envName: TEnvName;
    private readonly errorAsValue: boolean;

    private isOptional = false;
    private translator: EnvTranslator<TValue>;

    constructor(name: string, value: string | undefined, envName: TEnvName, errorAsValue: boolean) {
        this.name = name;
        this.value = value;
        this.envName = envName;
        this.errorAsValue = errorAsValue;
        this.translator = 'string';
    }

    // Get the value from the env variable
    get(defaults?: EnvDefaultMap<TEnvName | '*', TValue>): TValue {
        try {
            if (this.value !== undefined) {
                return this.translateValue(this.value);
            }

            if (defaults) {
                if (defaults[this.envName] !== undefined) return defaults[this.envName]!;
                if (defaults['*'] !== undefined) return defaults['*'];
            }

            if (this.isOptional) {
                return (undefined as unknown) as TValue;
            }

            throw new EnvConfigError(this.name, 'Value not defined');
        } catch (err) {
            if (this.errorAsValue && err instanceof EnvConfigError) {
                return (err as unknown) as TValue;
            }

            throw err;
        }
    }

    optional(): ConfigValueHolder<TEnvName, TValue | undefined> {
        this.isOptional = true;
        return (this as unknown) as ConfigValueHolder<TEnvName, TValue | undefined>;
    }

    string<TString extends string = string>(): ConfigValueHolder<TEnvName, TString> {
        this.throwIfOptional();
        this.translator = 'string';
        return (this as unknown) as ConfigValueHolder<TEnvName, TString>;
    }

    integer(): ConfigValueHolder<TEnvName, number> {
        this.throwIfOptional();
        this.translator = 'integer';
        return (this as unknown) as ConfigValueHolder<TEnvName, number>;
    }

    float(): ConfigValueHolder<TEnvName, number> {
        this.throwIfOptional();
        this.translator = 'float';
        return (this as unknown) as ConfigValueHolder<TEnvName, number>;
    }

    boolean(): ConfigValueHolder<TEnvName, boolean> {
        this.throwIfOptional();
        this.translator = 'boolean';
        return (this as unknown) as ConfigValueHolder<TEnvName, boolean>;
    }

    array(): ConfigValueHolder<TEnvName, string[]> {
        this.throwIfOptional();
        this.translator = 'array';
        return (this as unknown) as ConfigValueHolder<TEnvName, string[]>;
    }

    dict(): ConfigValueHolder<TEnvName, Record<string, string>> {
        this.throwIfOptional();
        this.translator = 'dict';
        return (this as unknown) as ConfigValueHolder<TEnvName, Record<string, string>>;
    }

    custom<TCustom>(translator: EnvTranslator<TCustom>): ConfigValueHolder<TEnvName, TCustom> {
        this.throwIfOptional();
        this.translator = translator as EnvTranslator<TValue>;
        return (this as unknown) as ConfigValueHolder<TEnvName, TCustom>;
    }

    // Translates the value from the environment variable
    private translateValue(value: string): TValue {
        if (typeof this.translator === 'function') {
            return this.translator(value);
        }

        switch (this.translator) {
            case 'string':
                return (value as unknown) as TValue;
            case 'array':
                return (value.split(',') as unknown) as TValue;
            case 'boolean':
                if (this.value === 'true') return (true as unknown) as TValue;
                if (this.value === 'false') return (false as unknown) as TValue;
                throw new EnvConfigError(this.name, `Invalid boolean value "${value}" `);
            case 'float':
                const float = parseFloat(value);
                if (isNaN(float)) {
                    throw new EnvConfigError(this.name, `Invalid float "${value}"`);
                }
                return (float as unknown) as TValue;
            case 'integer':
                const integer = parseInt(value, 10);
                if (isNaN(integer)) {
                    throw new EnvConfigError(this.name, `Invalid integer "${value}"`);
                }
                return (integer as unknown) as TValue;
            case 'dict':
                return (value.split(',').reduce((dict, str) => {
                    const pair = str.split(':');
                    if (pair.length !== 2) {
                        throw new EnvConfigError(
                            this.name,
                            `Invalid dict entry "${str}". Complete value: "${value}"`,
                        );
                    }

                    const [key, val] = pair;
                    dict[key] = val;
                    return dict;
                }, {} as Record<string, string>) as unknown) as TValue;
            default:
                throw new EnvConfigError(
                    this.name,
                    `Invalid translator provided "${this.translator}"`,
                ) as unknown;
        }
    }

    private throwIfOptional() {
        if (this.isOptional) {
            throw new EnvConfigError(
                this.name,
                'Tried to change the type after marking as optional.' +
                    ' This is not allowed because it breaks type safety.' +
                    ' Call .optional() after setting the type instead.',
            );
        }
    }
}
