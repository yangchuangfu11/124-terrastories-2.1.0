const getTranslator = () => {
  if (global.I18n && typeof global.I18n.t === 'function') {
    return (...args) => {
      if (typeof global.I18n.currentLocale === 'function') {
        global.I18n.currentLocale();
      }
      return global.I18n.t(...args);
    };
  }
  return (key) => key;
};

module.exports = {
  withTranslation: () => (Component) => {
    const translator = (...args) => getTranslator()(...args);
    Component.defaultProps = {
      ...(Component.defaultProps || {}),
      t: translator,
      i18n: {
        language: 'en',
        changeLanguage: () => Promise.resolve(),
      },
    };
    return Component;
  },
  useTranslation: () => {
    const translator = (...args) => getTranslator()(...args);
    return {
      t: translator,
      i18n: {
        changeLanguage: () => Promise.resolve(),
        language: 'en'
      },
      ready: true
    };
  },
  Trans: ({ children }) => (typeof children === 'function' ? children('') : children),
};
