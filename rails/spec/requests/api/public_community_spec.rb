require 'rails_helper'

RSpec.describe "Public Community (show) Endpoint", type: :request do
  let!(:public_community) { FactoryBot.create(:public_community, name: "Cool Community") }

  it "returns 404 when community can't be found" do
    get "/api/communities/unknown"

    expect(response).to have_http_status(:not_found)
  end

  it "returns a community's public details" do
    get "/api/communities/cool_community"

    expect(json_response).to include(
      "name",
      "slug",
      "storiesCount",
      "details",
      "points",
      "categories",
      "filters",
      "mapConfig"
    )
  end

  context "community data" do
    it "includes community details for landing panel" do
      get "/api/communities/cool_community"

      expect(json_response["details"]).to include(
        "name" => "Cool Community",
        "description" => nil,
        "sponsorLogos" => []
      )
    end

    # note(LM): Eventually, we can make which categories are
    # offered configurable by community admins
    it "includes community filter categories for landing panel" do
      get "/api/communities/cool_community"

      expect(json_response["categories"]).to contain_exactly(*Community::FILTERABLE_ATTRIBUTES)
    end

    it "includes community map config" do
      get "/api/communities/cool_community"

      expect(json_response["mapConfig"]).to include(
        "mapboxAccessToken",
        "mapboxStyle",
        "mapbox3dEnabled",
        "mapProjection",
        "centerLat",
        "centerLong",
        "swBoundaryLat",
        "swBoundaryLong",
        "neBoundaryLat",
        "neBoundaryLong",
        "center",
        "maxBounds",
        "zoom",
        "pitch",
        "bearing"
      )
    end

    it "returns the configured mapbox style details when exposed" do
      public_community.theme.update!(
        mapbox_style_url: "mapbox://styles/example/style",
        mapbox_access_token: "pk.123",
        expose_mapbox_credentials: true
      )

      get "/api/communities/cool_community"

      expect(json_response.dig("mapConfig", "mapboxStyle")).to eq("mapbox://styles/example/style")
      expect(json_response.dig("mapConfig", "mapboxAccessToken")).to eq("pk.123")
    end

    it "returns nil mapbox values when not exposed" do
      public_community.theme.update!(
        mapbox_style_url: "mapbox://styles/example/style",
        mapbox_access_token: "pk.123",
        expose_mapbox_credentials: false
      )

      get "/api/communities/cool_community"

      expect(json_response.dig("mapConfig", "mapboxStyle")).to be_nil
      expect(json_response.dig("mapConfig", "mapboxAccessToken")).to be_nil
    end

    it "returns non-Mapbox style when credentials are not exposed" do
      public_community.theme.update!(
        protomaps_api_key: "abc123",
        expose_mapbox_credentials: false
      )

      get "/api/communities/cool_community"

      expect(json_response.dig("mapConfig", "mapboxAccessToken")).to be_nil
      expect(json_response.dig("mapConfig", "mapboxStyle")).to eq("https://api.protomaps.com/tiles/v3.json?key=abc123")
    end
  end
end
