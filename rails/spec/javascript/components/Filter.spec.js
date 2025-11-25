import React from 'react';
import { shallow } from 'enzyme';
import Filter from '../../../app/javascript/components/Filter';
import Select from 'react-select';
import * as I18nMock from './__mocks__/I18n.mock';

describe('Filter component', () => {
  const baseProps = {
    categories: ['People', 'Places'],
    filterCategory: 'select_category',
    filterItem: 'select_option',
    handleFilterCategoryChange: jest.fn(),
    handleFilterItemChange: jest.fn(),
    itemOptions: ['All', 'Recent'],
  };

  beforeEach(() => {
    I18nMock.t.mockClear();
    I18nMock.currentLocale.mockClear();
    global.I18n = {
      t: I18nMock.t,
      currentLocale: I18nMock.currentLocale,
    };
  });

  it('renders both selects with translated placeholders', () => {
    const wrapper = shallow(<Filter {...baseProps} />);

    const categorySelect = wrapper.find('.categoryFilter');
    const itemSelect = wrapper.find('.itemFilter');

    expect(categorySelect.exists()).toBe(true);
    expect(itemSelect.exists()).toBe(true);

    const translatedKeys = I18nMock.t.mock.calls.map(call => call[0]);
    expect(translatedKeys).toEqual(
      expect.arrayContaining(['select_category', 'select_option'])
    );
  });

  it('invokes handlers with selected options', () => {
    const handleFilterCategoryChange = jest.fn();
    const handleFilterItemChange = jest.fn();

    const wrapper = shallow(
      <Filter
        {...baseProps}
        handleFilterCategoryChange={handleFilterCategoryChange}
        handleFilterItemChange={handleFilterItemChange}
      />
    );

    const categoryOption = { value: 'People', label: 'People' };
    const itemOption = { value: 'Recent', label: 'Recent' };

    wrapper.find(Select).at(0).prop('onChange')(categoryOption);
    wrapper.find(Select).at(1).prop('onChange')(itemOption);

    expect(handleFilterCategoryChange).toHaveBeenCalledWith(categoryOption);
    expect(handleFilterItemChange).toHaveBeenCalledWith(itemOption);
  });

  it('sets clearable flags based on selected values', () => {
    const wrapper = shallow(<Filter {...baseProps} filterCategory="People" filterItem="Recent" />);
    const categorySelect = wrapper.find(Select).at(0);
    const itemSelect = wrapper.find(Select).at(1);

    expect(categorySelect.prop('isClearable')).toBe(true);
    expect(itemSelect.prop('isClearable')).toBe(true);
  });
});
