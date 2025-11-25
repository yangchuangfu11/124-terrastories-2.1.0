envelope(json) do
  json.array! @communities do |community|
    json.extract! community, :name, :description, :slug

    json.createdAt community.created_at
    json.updatedAt community.updated_at

    if community.display_image.attached?
      json.displayImage rails_blob_url(community.display_image)
    end

    if community.theme.static_map.attached?
      json.staticMapUrl rails_blob_url(community.theme.static_map)
    end

    json.mapConfig do
      map_style = community.theme.map_style_url

      if community.theme.expose_mapbox_credentials?
        json.mapboxAccessToken community.theme.mapbox_access_token
        json.mapboxStyle map_style
      else
        json.mapboxAccessToken nil
        json.mapboxStyle(community.theme.use_maplibre? ? map_style : nil)
      end
      json.mapbox3dEnabled community.theme.mapbox_3d
      json.mapProjection community.theme.map_projection

      json.center community.theme.center

      json.zoom community.theme.zoom
      json.pitch community.theme.pitch
      json.bearing community.theme.bearing
    end
  end
end
