# envious-type
A library for working with environment variables.

## Basic usage
```typescript
import envUtils from 'envious-type';

// Get the env utilities
const { env, validateEnv } = envUtils({ lazyValidation: true });

// Define your configs and validate that all values are ok.
const config = validateEnv({
    // Get a string. Must be defined in your environment.
    someApiUrl: env.SOME_API_URL.get(),

    // Get an integer. Separate defaults defined for when NODE_ENV is dev, test or prod.
    myApiPort: env.MY_API_PORT.integer().get({ dev: 8080, test: 18080, prod: 80 }),
});

// Use config with type safety, no explicit casting needed!
const port: number = config.myApiPort;
```

## Translating different types

```typescript
const myVar = env.MY_VAR
    .string()    // Treat as string.       Define MY_VAR=foo    [DEFAULT]
    .integer()   // Treat as integer.      Define MY_VAR=123
    .float()     // Treat as float.        Define MY_VAR=1.23
    .boolean()   // Treat as boolean.      Define MY_VAR=true or MY_VAR=false
    .array()     // Treat as string array. Define MY_VAR=val1,val2,val3
    .dict()      // Treat as dictionary.   Define key1:val1,key1:val2
    .optional()  // Treat as optional.     Can omit definition without default with no errors.
    .get()       // Return the type-casted and translated value!

// Example of custom translator 
const customVal = env.CUSTOM_VALUE.custom(value => new Person(value)).get(),
```

## Handling configuration errors
By default errors are thrown immediately as they occur.
```typescript
const { env } = envUtils();

// If MY_VAL is not defined in the env, an error is thrown immediately.
const myVal = env.MY_VAL.get(); 
```

**Strongly suggested:**
If you'd like to collect all the errors in one go, you can combine the option
`lazyValidation` with the `validateEnv` utility:

```typescript
const { env, validateEnv } = envUtils({ lazyValidation: true });

// ✅ Safe
const config = validateEnv({
    // Returns an error if MY_VAL is not defined, but this is caught by validateEnv
    val: env.MY_VAL.get() 
})

// ❌ UNSAFE with lazyValidation=true!
const config = {
    // Can return an error, and the value is typed as a string. Might go unnoticed.
    val: env.MY_VAL.get() 
};
```


## Defining environment names and defaults
By default, envUtils uses the value of `NODE_ENV` env variable to determine the current environment name.
Do this if you want to override the environment name:
```typescript
const { env } = envUtils({ envName: 'my-env' });
```

The defaults are applied for different environment names. By default the supported environment names for
are `dev`, `prod` and `test`. These are autocompleted when defining default values.

If you prefer `development`, `production` and `test`, it's possible like this:
```typescript
import envUtils, { LongEnvNames } from 'envious-type';

const { env } = envUtils<LongEnvNames>();

// ✅ OK
const value = env.MY_VAL.get({ development: 'foo' })

// ❌ TypeScript compilation error, 'dev' does not belong to LongEnvNames
const value = env.MY_VAL.get({ dev: 'foo' })
```

You can also provide any string-based type besides `LongEnvNames` and `ShortEnvNames` too, if you need it.

No matter what the type of the environment names is, you can always use a wildcard to set a default
to all environments. This can be overridden for specific environemnts too
```typescript
const value = env.MY_VAL.get({
    '*': 'foo', // Applied for prod, test and any others
    dev: 'bar'  // Applied for dev
});
```


## Custom env object (browser usage)
If you are not using Node.js at runtime, you don't have access to the `process.env` object.
In this case you need to define what object envUtils can get the environment from. Example:

```typescript
// Define your environment on the window global, for example
const { env } = envUtils({ envObject: window._env_ }); 
```


## Environment variable prefix
If all the environment variables you use have a prefix, you can use the `envPrefix` option.
```typescript
const { env } = envUtils({ envPrefix: 'MY_APP_' }); 

const port = env.PORT.get(); // Return value from variable MY_APP_PORT
```

