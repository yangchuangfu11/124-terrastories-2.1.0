const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

module.exports = [
  {
    ignores: [
      'app/javascript/vendor/*',
      'app/javascript/components/App.jsx',
      'app/javascript/components/Card.jsx',
      'app/javascript/components/Filter.jsx',
      'app/javascript/components/IntroPopup.jsx',
      'app/javascript/components/Map.jsx',
      'app/javascript/components/Sort.jsx',
      'app/javascript/components/StoryList.jsx',
      'app/javascript/components/StoryMedia.jsx',
    ],
  },
  ...compat.config({
    extends: ['airbnb', 'prettier'],
    parser: '@babel/eslint-parser',
    parserOptions: {
      requireConfigFile: false,
      babelOptions: {
        configFile: './babel.config.js',
      },
    },
    env: {
      browser: true,
      es6: true,
      jest: true,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
      'jsx-a11y/media-has-caption': 'off',
      'react/no-danger': 'warn',
    },
  }),
];
