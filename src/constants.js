export const VALID_USERNAME_REGEX = /^[a-zA-Z0-9](_(?!(\.|_))|\.(?!(_|\.))|[a-zA-Z0-9]){1,28}[a-zA-Z0-9]$/;

export const RM_STORAGE_KEY = 'scriptory:rm_storage';
export const AUTH_TOKEN_KEY = 'scriptory:auth_token';
export const PRIV_KEYS_PASS_KEY = 'scriptory:generic_priv_key_pass';
export const PASSWORD_HASH_KEY = 'scriptory:password_hash';

export const RM_STORAGE = {
    SESSION: 'session',
    LOCAL: 'local'
};

export const KEYPAIRS_DEFAULT_PURPOSE = 'generic';

export const SANDBOX_TOKENS = {
    1: 'allow-scripts',
    2: 'allow-forms',
    3: 'allow-modals',
    4: 'allow-popups',
    5: 'allow-popups-to-escape-sandbox',
    6: 'allow-presentation',
    7: 'allow-pointer-lock',
    8: 'allow-orientation-lock',
    9: 'allow-same-origin',
    10: 'allow-top-navigation',
    11: 'allow-storage-access-by-user-activation'
};

export const ORIGIN = 'https://scriptory.io';
export const BOARD_CTL_SCRIPT_UID = 'sboardctl';

export const STORAGE_PROVIDERS = {
    'dropbox': {
        name: 'Dropbox',
        appKey: 'e7zdp8eeuoumw95'
    }
};

export const CODES = {
    SUCCESS: {
        code: 1000,
        message: 'Success.'
    },
    ERROR: {
        code: 2000,
        message: 'Something went wrong.'
    },
    RETRIEVE_KEYPAIRS_ERROR: {
        code: 2100,
        message: 'Could not retrieve keypairs.'
    },
    DECRYPT_KEYPAIRS_ERROR: {
        code: 2101,
        message: 'Could not decrypt keypairs.'
    },
    DECRYPT_SECRETS_ERROR: {
        code: 2110,
        message: 'Could not decrypt secrets.'
    },
    STORE_FILE_FETCHED: {
        code: 3000,
        message: 'Store file fetched.'
    },
    STORE_FILE_FETCH_ERROR: {
        code: 4000,
        message: 'Error while fetching store file.'
    }
};

export const EMPTY_RESULTS_STRING = '~~~ What shall we use to fill the empty spaces? ~~~';

export const CODEMIRROR_CODE_OPTIONS = {
    tabSize: 4,
    indentUnit: 4,
    mode: 'htmlmixed',
    theme: '3024-night',
    lineNumbers: true,
    line: true,
    autoHint: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    matchTags: true,
    autoCloseTags: true,
    foldCode: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", /*"CodeMirror-lint-markers"*/],
    highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
    showHint: true,
    hintOptions:{
        completeSingle: false
    },
    styleActiveLine: true,
    keyMap: "sublime",
    extraKeys: { "Ctrl": "autocomplete" },
    //lint: true
};