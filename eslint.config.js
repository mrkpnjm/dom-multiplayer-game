import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,

    // Server files run in Node
    {
        files: ['server/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.node },
        },
    },

    // Client files run in the browser; `io` is a global from the socket.io script tag
    {
        files: ['client/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, io: 'readonly' },
        },
    },
    prettier,
];