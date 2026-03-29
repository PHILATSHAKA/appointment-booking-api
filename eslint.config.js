import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import path from 'node:path';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [
	{
		ignores: [
			'dist',
			'node_modules'
		]
	},
	...compat.extends(
		// "eslint:recommended",
		// "plugin:@typescript-eslint/eslint-recommended",
		// "plugin:@typescript-eslint/recommended",
		// "plugin:lit/recommended",
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/recommended'
	),
	jsdoc.configs['flat/recommended'],
	{
		plugins: {
			'@typescript-eslint': typescriptEslint,
			'jsdoc': jsdoc
		},

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				RequestInit: 'readonly'
			},

			parser: tsParser,
			ecmaVersion: 12,
			sourceType: 'module',

			parserOptions: {
				requireConfigFile: false,
				experimentalDecorators: true
			}
		},

		settings: {
			jsdoc: {
				mode: 'typescript'
			},
			'import/resolver': {
				'node': {
					'extensions': ['.js', '.ts']
				}
			}
		},

		// 'env': {
		// 'browser': true,
		// 'es6': true,
		// 'node': true
		// },

		'rules': {
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns-description': 'off',
			'import/no-unresolved': 'off',
			'quotes': ['error', 'single'],

			'accessor-pairs': 'error',
			'array-bracket-newline': 'error',
			'array-bracket-spacing': 'error',
			'array-callback-return': 'error',
			'array-element-newline': 'off',
			'arrow-body-style': 'error',
			'arrow-parens': ['off', 'as-needed'],

			'arrow-spacing': [
				'error', {
					'after': true,
					'before': true
				}
			],

			'block-scoped-var': 'error',
			'block-spacing': 'error',
			'brace-style': ['error', '1tbs'],
			'callback-return': 'error',
			'camelcase': 'error',
			'capitalized-comments': 'off',
			'class-methods-use-this': 'off',
			'comma-dangle': 'error',

			'comma-spacing': [
				'error', {
					'after': true,
					'before': false
				}
			],

			'comma-style': 'error',
			'complexity': 'off',
			'computed-property-spacing': 'error',
			'consistent-return': 'off',
			'consistent-this': 'error',
			'curly': 'error',

			'default-case': 'error',
			'dot-location': 'off',
			'dot-notation': 'error',

			'eol-last': 'off',
			'eqeqeq': 'error',

			'func-call-spacing': 'error',
			'func-name-matching': 'error',
			'func-names': 'error',
			'func-style': 'off',
			'function-paren-newline': 'error',

			'generator-star-spacing': 'error',
			'global-require': 'off',
			'guard-for-in': 'error',

			'handle-callback-err': 'error',

			'id-blacklist': 'error',
			'id-length': 'off',
			'id-match': 'error',
			'implicit-arrow-linebreak': ['error', 'beside'],

			'indent': [
				'error', 'tab', {
					'SwitchCase': 1,
					'ignoredNodes': ['PropertyDefinition[decorators]']
				}
			],

			'indent-legacy': 'off',
			'init-declarations': 'off',

			'jsx-quotes': 'error',

			'key-spacing': 'error',
			'keyword-spacing': [
				'error', {
					'after': true,
					'before': true
				}
			],

			'line-comment-position': 'off',
			'linebreak-style': ['off'],
			'lines-around-comment': 'error',
			'lines-around-directive': 'error',
			'lines-between-class-members': ['error', 'always'],

			'max-classes-per-file': 'off',
			'max-depth': 'off',

			'max-len': [
				'error',
				{
					'code': 500,
					'ignoreTrailingComments': true
				}
			],

			'max-lines': 'off',
			'max-lines-per-function': 'off',
			'max-nested-callbacks': 'error',
			'max-params': 'off',
			'max-statements': 'off',
			'max-statements-per-line': 'error',
			'multiline-comment-style': 'off',
			'multiline-ternary': 'off',

			'new-cap': 'off',
			'new-parens': 'error',
			'newline-after-var': 'off',
			'newline-before-return': 'off',
			'newline-per-chained-call': 'off',

			'no-alert': 'off',
			'no-array-constructor': 'error',
			'no-async-promise-executor': 'error',
			'no-await-in-loop': 'error',
			'no-bitwise': 'error',
			'no-buffer-constructor': 'error',
			'no-caller': 'error',
			'no-catch-shadow': 'error',
			'no-confusing-arrow': 'error',
			'no-continue': 'error',
			'no-console': 'off',
			'no-div-regex': 'error',
			'no-duplicate-imports': 'error',
			'no-else-return': 'error',
			'no-empty-function': 'off',
			'no-eq-null': 'off',
			'no-eval': 'error',
			'no-extend-native': 'error',
			'no-extra-bind': 'error',
			'no-extra-label': 'error',
			'no-extra-parens': 'off',
			'no-floating-decimal': 'error',
			'no-global-assign': 'off',
			'no-implicit-coercion': 'error',
			'no-implicit-globals': 'error',
			'no-implied-eval': 'error',
			'no-inline-comments': 'off',
			'no-invalid-this': 'error',
			'no-iterator': 'error',
			'no-label-var': 'error',
			'no-labels': 'error',
			'no-lone-blocks': 'error',
			'no-lonely-if': 'error',
			'no-loop-func': 'error',
			'no-magic-numbers': 'off',
			'no-misleading-character-class': 'error',
			'no-mixed-operators': 'error',
			'no-mixed-requires': 'error',
			'no-multi-assign': 'off',
			'no-multi-spaces': 'error',
			'no-multi-str': 'error',

			'no-multiple-empty-lines': [
				'error', {
					'max': 1,
					'maxEOF': 0,
					'maxBOF': 0
				}
			],

			'no-native-reassign': 'off',
			'no-negated-condition': 'off',
			'no-negated-in-lhs': 'error',
			'no-nested-ternary': 'error',
			'no-new': 'error',
			'no-new-func': 'error',
			'no-new-object': 'error',
			'no-new-require': 'error',
			'no-new-wrappers': 'error',

			'no-octal-escape': 'error',

			'no-param-reassign': 'off',
			'no-path-concat': 'error',
			'no-plusplus': 'off',
			'no-process-env': 'off',
			'no-process-exit': 'error',
			'no-proto': 'error',
			'no-prototype-builtins': 'error',

			'no-restricted-globals': 'error',
			'no-restricted-imports': 'error',
			'no-restricted-modules': 'error',
			'no-restricted-properties': 'error',
			'no-restricted-syntax': 'error',
			'no-return-assign': 'off',
			'no-return-await': 'error',

			'no-script-url': 'error',
			'no-self-compare': 'error',
			'no-sequences': 'error',
			'no-shadow': 'off',
			'no-shadow-restricted-names': 'error',
			'no-spaced-func': 'error',
			'no-sync': 'off',

			'no-tabs': [
				'error', {
					'allowIndentationTabs': true
				}
			],

			'no-trailing-spaces': [
				'error', {
					'ignoreComments': true
				}
			],

			'no-template-curly-in-string': 'error',
			'no-ternary': 'off',
			'no-throw-literal': 'error',

			'no-undef-init': 'error',
			'no-undefined': 'off',
			'no-unmodified-loop-condition': 'error',
			'no-unneeded-ternary': 'error',
			'no-unused-expressions': 'error',
			'no-unused-vars': 'off',
			'no-use-before-define': ['error', 'nofunc'],
			'no-useless-call': 'error',
			'no-useless-catch': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-concat': 'error',
			'no-useless-constructor': 'off',
			'no-useless-rename': 'error',
			'no-useless-return': 'error',

			'no-var': 'error',
			'no-void': 'error',

			'no-warning-comments': 'off',
			'no-whitespace-before-property': 'error',
			'no-with': 'error',

			'nonblock-statement-body-position': 'error',

			'object-curly-newline': 'error',
			'object-curly-spacing': ['error', 'always'],
			'object-property-newline': 'off',
			'object-shorthand': ['error', 'consistent'],
			'one-var': 'off',
			'one-var-declaration-per-line': 'error',
			'operator-assignment': 'error',
			'operator-linebreak': 'error',

			'padded-blocks': 'off',
			'padding-line-between-statements': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'prefer-destructuring': 'off',
			'prefer-numeric-literals': 'error',
			'prefer-object-spread': 'error',
			'prefer-promise-reject-errors': 'error',
			'prefer-reflect': 'off',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'prefer-template': 'error',

			'quote-props': 'off',

			'radix': 'error',
			'require-atomic-updates': 'error',
			'require-await': 'error',
			// 'require-jsdoc': 'error',
			'require-unicode-regexp': 'off',
			'rest-spread-spacing': 'error',

			'semi': 'error',
			'semi-spacing': 'error',
			'semi-style': ['error', 'last'],

			'sort-imports': [
				'error',
				{
					'ignoreCase': false,
					'ignoreDeclarationSort': false,
					'ignoreMemberSort': false,
					'memberSyntaxSortOrder': [
						'all',
						'multiple',
						'single',
						'none'
					],
					'allowSeparatedGroups': true
				}
			],

			'sort-keys': 'off',
			'sort-vars': 'error',
			'space-before-blocks': 'error',
			'space-before-function-paren': ['off', 'never'],
			'space-in-parens': ['error', 'never'],
			'space-infix-ops': 'error',
			'space-unary-ops': 'error',
			'spaced-comment': ['error', 'always'],
			'strict': 'error',
			'switch-colon-spacing': 'error',
			'symbol-description': 'error',

			'template-curly-spacing': ['error', 'never'],
			'template-tag-spacing': 'error',

			'unicode-bom': ['error', 'never'],
			'vars-on-top': 'error',
			'wrap-iife': 'error',
			'wrap-regex': 'error',
			'yield-star-spacing': 'error',
			'yoda': 'error',

			'jsdoc/require-jsdoc': [
				'error', {
					require: {
						FunctionDeclaration: true,
						MethodDefinition: true,
						ClassDeclaration: true,
						ArrowFunctionExpression: false,
						FunctionExpression: false
					}
				}
			],

			// Commenting out for now will retain ones that are required in future
			'jsdoc/require-throws': 'off',

			'jsdoc/check-param-names': [
				'error', {
					checkDestructured: false
				}
			],

			'jsdoc/require-param': [
				'error', {
					checkDestructured: false,
					checkDestructuredRoots: false
				}
			],

			'jsdoc/require-param-type': 'off',

			'jsdoc/require-returns': [
				'error', {
					checkConstructors: false,
					checkGetters: false
				}
			],

			'jsdoc/require-returns-type': 'off',
			'jsdoc/tag-lines': 'off',

			'jsdoc/check-tag-names': [
				'error', {
					definedTags: ['element', 'attribute', 'attr']
				}
			]
		}
	},
	{
		files: ['**/*.ts'],

		rules: {
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-explicit-any': 'off',

			// Commenting out for now will retain ones that are required in future
			'@typescript-eslint/ban-ts-comment': 'off',

			'@typescript-eslint/explicit-function-return-type': 'off',

			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-shadow': 'error',
			'jsdoc/require-description-complete-sentence': 'off',

			'jsdoc/require-returns': 'off',

			'jsdoc/require-returns-check': 'off',
			'no-unknown-attribute': 'off'
		}
	}
];