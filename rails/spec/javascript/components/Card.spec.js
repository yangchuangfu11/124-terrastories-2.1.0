import React from 'react';
import { shallow } from 'enzyme';
import Card from '../../../app/javascript/components/Card';
import * as I18nMock from './__mocks__/I18n.mock';

describe('Card component', () => {
  beforeEach(() => {
    I18nMock.currentLocale.mockClear();
    I18nMock.t.mockClear();
    global.I18n = {
      currentLocale: I18nMock.currentLocale,
      t: I18nMock.t,
    };
  })

  it('Displays correctly', () => {
    const wrapper = shallow(<Card />);

    expect(wrapper.find('StoryList')).toHaveLength(1);
    expect(wrapper.find('.cardContainer').hasClass('onCanvas')).toBe(true);
    expect(wrapper.find('a[href="/en"]').exists()).toBe(true);
  })

  describe('Given a user props', () => {
    describe('With an editor role', () => {
      it('Renders the correct information', () => {
        const wrapper = shallow(<Card user={{ role: 'admin', display_name: 'Alex' }} />);

        expect(wrapper.find('.card--tasks ul li')).toHaveLength(2);
        expect(global.I18n.currentLocale).toHaveBeenCalled();
        const translatedKeys = global.I18n.t.mock.calls.map(call => call[0]);
        expect(translatedKeys).toEqual(expect.arrayContaining(['hello', 'back_to_welcome', 'member_dashboard']));
      });
    })

    describe('With no role', () => {
      it('Renders the correct information', () => {
        shallow(<Card user={{ role: null, display_name: 'Taylor' }} />);

        expect(global.I18n.currentLocale).toHaveBeenCalled();
        const translatedKeys = global.I18n.t.mock.calls.map(call => call[0]);
        expect(translatedKeys).toContain('hello');
        expect(translatedKeys).toContain('back_to_welcome');
        expect(translatedKeys).not.toContain('member_dashboard');
      });
    })

    describe('That is null/empty', () => {
      it('Renders the correct information', () => {
        shallow(<Card />);

        expect(global.I18n.currentLocale).toHaveBeenCalled();
        const translatedKeys = global.I18n.t.mock.calls.map(call => call[0]);
        expect(translatedKeys).not.toContain('hello');
        expect(translatedKeys).toContain('back_to_welcome');
        expect(translatedKeys).not.toContain('member_dashboard');
      });
    })
  });

  it('Toggles the onCanvas/offCanvas CSS classes', () => {
    const wrapper = shallow(
      <Card />,
    );

    expect(wrapper.find('.cardContainer').hasClass('onCanvas')).toBe(true);
    expect(wrapper.find('.cardContainer').hasClass('offCanvas')).toBe(false);
    wrapper.find('.tab').simulate('click');
    expect(wrapper.find('.cardContainer').hasClass('onCanvas')).toBe(false);
    expect(wrapper.find('.cardContainer').hasClass('offCanvas')).toBe(true);
    wrapper.find('.tab').simulate('click');
    expect(wrapper.find('.cardContainer').hasClass('onCanvas')).toBe(true);
    expect(wrapper.find('.cardContainer').hasClass('offCanvas')).toBe(false);
  })
});
