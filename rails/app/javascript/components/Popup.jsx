import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

function Popup({ feature, onCloseClick }) {
  const { t } = useTranslation();
  const {
    name,
    photo_url: photoUrl,
    name_audio_url: nameAudioUrl,
    description,
    region,
    type_of_place: typeOfPlace,
  } = feature.properties;

  const featureId = feature.properties.id ?? feature.id ?? "place";

  return (
    <div id={`popup-${featureId}`}>
      <div className="ts-markerPopup-header">
        <h1>{name}</h1>
        <button className="ts-markerPopup-header-button" type="button" onClick={onCloseClick}>
          ✕
        </button>
      </div>
      <div className="ts-markerPopup-content">
        {photoUrl && <img src={photoUrl} alt={name} />}
        {nameAudioUrl && (
          <div>
            <span className="ts-markerPopup-label">{t("place_name")}:</span>
            <audio
              className="ts-markerPopup-audio"
              controls
              controlsList="nodownload"
              src={nameAudioUrl}
              aria-label={t("place_name")}
            />
          </div>
        )}
        {description && <div className="ts-markerPopup-description">{description}</div>}
        {region && (
          <div className="ts-markerPopup-tag">
            <span className="ts-markerPopup-label">{t("region")}:</span> {region}
          </div>
        )}
        {typeOfPlace && (
          <div className="ts-markerPopup-tag">
            <span className="ts-markerPopup-label">{t("place_type")}:</span> {typeOfPlace}
          </div>
        )}
      </div>
    </div>
  );
}

Popup.propTypes = {
  feature: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    properties: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      photo_url: PropTypes.string,
      name_audio_url: PropTypes.string,
      description: PropTypes.string,
      region: PropTypes.string,
      type_of_place: PropTypes.string,
    }).isRequired,
  }).isRequired,
  onCloseClick: PropTypes.func.isRequired,
};

export default Popup;
