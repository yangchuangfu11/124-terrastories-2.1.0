import React from 'react';
import { shallow } from 'enzyme';
import Sort from '../../../app/javascript/components/Sort';
import * as I18nMock from './__mocks__/I18n.mock';

describe('Sort component', () => {
  beforeEach(() => {
    I18nMock.t.mockClear();
    global.I18n = {
      t: I18nMock.t,
      currentLocale: I18nMock.currentLocale,
    };
  });

  const corinneStory = {
    created_at: '2020-10-03T11:13:23.037Z',
    title: "Corinne's testimonial",
  };

  const rudoStory = {
    created_at: '2020-10-01T11:13:23.013Z',
    title: "Rudo's testimonial",
  };

  const sortValues = [
    'sort_stories',
    'most_recent',
    'alphabetical',
    'reversed_alphabetical',
  ];

  it('Displays correctly', () => {
    const wrapper = shallow(<Sort stories={[corinneStory, rudoStory]} />);

    expect(wrapper.find('.card--nav-sort').text()).toBe('sort_stories in local translation: ');

    const translatedKeys = global.I18n.t.mock.calls.map(call => call[0]);
    sortValues.forEach((sortValue) => {
      expect(translatedKeys).toContain(sortValue);
    });

    expect(wrapper.find('.storiesSort').exists()).toBe(true);
  });

  it('Calls handleStoriesChanged on change with expected sort', () => {
    const handleStoriesChanged = jest.fn();

    const props = {
      handleStoriesChanged,
      stories: [corinneStory, rudoStory],
    };
    const wrapper = shallow(<Sort {...props} />);

    // componentDidMount call
    expect(handleStoriesChanged.mock.calls.length).toBe(1);
    expect(handleStoriesChanged.mock.calls[0][0]).toEqual([
      corinneStory,
      rudoStory,
    ]);

    wrapper.find('.storiesSort').simulate('change', { value: 'alphabetical' });

    expect(handleStoriesChanged.mock.calls.length).toBe(2);
    expect(handleStoriesChanged.mock.calls[1][0]).toEqual([
      corinneStory,
      rudoStory,
    ]);

    wrapper
      .find('.storiesSort')
      .simulate('change', { value: 'reversed_alphabetical' });

    expect(handleStoriesChanged.mock.calls.length).toBe(3);
    expect(handleStoriesChanged.mock.calls[2][0]).toEqual([
      rudoStory,
      corinneStory,
    ]);
  });
});
