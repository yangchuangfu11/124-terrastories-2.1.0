import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import StoryMedia from "./StoryMedia";

function Story({ story, storyClass, onStoryClick }) {
  const { t } = useTranslation();

  const renderSpeakers = (speakers) => (
    <div key={`${story.id}-speakers`}>
      {speakers.map((speaker) => (
        <img
          src={speaker.picture_url}
          alt={speaker.name}
          title={speaker.name}
          key={speaker.id}
        />
      ))}
      <p style={{ fontWeight: "bold" }}>{speakers.map((speaker) => speaker.name).join(", ")}</p>
    </div>
  );

  return (
    <li
      className={storyClass}
      onClick={() => onStoryClick(story)}
      onKeyDown={() => onStoryClick(story)}
      key={story.id}
      role="presentation"
    >
      <div className="speakers">{renderSpeakers(story.speakers)}</div>
      <div className="container">
        <h6 className="title">
          {story.title}
          {story.permission_level === "restricted" && " 🔒"}
        </h6>
        <p className="description" dangerouslySetInnerHTML={{ __html: story.desc }} />
        {story.media &&
          story.media.map((file) => <StoryMedia file={file} key={file.id || `${story.id}-${file.url}`} />)}
        {story.language && (
          <p>
            <b>{t("language")}:</b> {story.language}
          </p>
        )}
      </div>
    </li>
  );
}

Story.propTypes = {
  story: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string,
    desc: PropTypes.string,
    permission_level: PropTypes.string,
    language: PropTypes.string,
    speakers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string.isRequired,
        picture_url: PropTypes.string,
      })
    ),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        url: PropTypes.string,
      })
    ),
  }).isRequired,
  onStoryClick: PropTypes.func,
  storyClass: PropTypes.string,
};

Story.defaultProps = {
  onStoryClick: () => {},
  storyClass: "",
};

export default Story;
