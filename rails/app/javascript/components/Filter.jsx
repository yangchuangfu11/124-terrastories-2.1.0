import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';

const Filter = ({
  categories,
  filterCategory,
  filterItem,
  handleFilterCategoryChange,
  handleFilterItemChange,
  itemOptions,
}) => {
  const { t } = useTranslation();

  let DEFAULT_CATEGORY_PLACEHOLDER = t("select_category");
  let DEFAULT_ITEM_PLACEHOLDER = t("select_option");

  const handleCategoryChange = option => handleFilterCategoryChange(option);

  const handleItemChange = option => handleFilterItemChange(option);

  const optionsHash = options => {
    return options.map(option => {
      return { value: option, label: option };
    });
  };

  return (
    <React.Fragment>
      <span className="card--nav-filter">{t("filter_stories")}: </span>
      <Select
        className="categoryFilter"
        classNamePrefix="select"
        value={optionsHash([filterCategory])}
        onChange={handleCategoryChange}
        isClearable={filterCategory !== DEFAULT_CATEGORY_PLACEHOLDER}
        name="filter-categories"
        options={optionsHash(categories)}
      />
      <Select
        className="itemFilter"
        classNamePrefix="select"
        value={optionsHash([filterItem])}
        onChange={handleItemChange}
        isClearable={filterItem !== DEFAULT_ITEM_PLACEHOLDER}
        isSearchable={true}
        name="filter-items"
        options={optionsHash(itemOptions)}
      />
    </React.Fragment>
  );
};

Filter.propTypes = {
  categories: PropTypes.array.isRequired,
  filterCategory: PropTypes.string.isRequired,
  filterItem: PropTypes.string.isRequired,
  handleFilterCategoryChange: PropTypes.func.isRequired,
  handleFilterItemChange: PropTypes.func.isRequired,
  itemOptions: PropTypes.array.isRequired,
};

export default Filter;
