import React from 'react';
import { shallow } from 'enzyme';
import Story from '../../../app/javascript/components/Story';
import * as I18nMock from './__mocks__/I18n.mock';

jest.mock('../../../app/javascript/components/StoryMedia', () => 'StoryMedia');

describe('Story component', () => {
  const baseStory = {
    id: 1,
    title: 'Forest story',
    desc: '<p>Once upon a time</p>',
    permission_level: 'public',
    language: 'English',
    speakers: [
      { id: 10, name: 'Ava', picture_url: '/img/ava.png' },
      { id: 11, name: 'Kai', picture_url: '/img/kai.png' },
    ],
    media: [
      { id: 55, url: '/media/audio.mp3' },
    ],
  };

  beforeEach(() => {
    I18nMock.t.mockClear();
    I18nMock.currentLocale.mockClear();
    global.I18n = {
      t: I18nMock.t,
      currentLocale: I18nMock.currentLocale,
    };
  });

  it('renders speakers, media, and language label', () => {
    const wrapper = shallow(
      <Story
        story={baseStory}
        storyClass="story"
        onStoryClick={jest.fn()}
      />
    );

    expect(wrapper.find('.speakers img')).toHaveLength(2);
    expect(wrapper.text()).toContain('Ava');
    expect(wrapper.text()).toContain('Kai');
    expect(wrapper.find('StoryMedia')).toHaveLength(1);

    const translatedKeys = I18nMock.t.mock.calls.map(call => call[0]);
    expect(translatedKeys).toContain('language');

  });

  it('shows a lock icon for restricted stories', () => {
    const restrictedStory = { ...baseStory, permission_level: 'restricted' };
    const wrapper = shallow(
      <Story story={restrictedStory} storyClass="story" onStoryClick={jest.fn()} />
    );

    expect(wrapper.find('.title').text()).toContain('🔒');
  });

  it('invokes onStoryClick when clicked', () => {
    const onStoryClick = jest.fn();
    const wrapper = shallow(
      <Story
        story={baseStory}
        storyClass="story"
        onStoryClick={onStoryClick}
      />
    );

    wrapper.find('li').simulate('click');
    expect(onStoryClick).toHaveBeenCalledWith(baseStory);
  });
});
