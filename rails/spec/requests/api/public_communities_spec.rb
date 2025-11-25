require 'rails_helper'

RSpec.describe "Public Communities Endpoint", type: :request do
  let!(:public_community) { FactoryBot.create(:public_community, name: "Cool Community") }
  let!(:community) { FactoryBot.create(:community, name: "Private Community") }

  it "returns an array of public communities" do
    get "/api/communities"

    expect(json_response.length).to eq(1)
    expect(json_response.first).to include({
      "name" => "Cool Community",
      "slug" => "cool_community"
    })
  end

  it "includes the community's display image" do
    get "/api/communities"
    expect(json_response.first.keys).not_to include("displayImage")

    public_community.display_image.attach(io: File.open("./spec/fixtures/media/terrastories.png"), filename: 'file.pdf')

    get "/api/communities"
    expect(json_response.first.keys).to include("displayImage")
  end

  it "includes mapbox style configuration details when exposed" do
    public_community.theme.update!(
      mapbox_style_url: "mapbox://styles/example/style",
      mapbox_access_token: "pk.123",
      expose_mapbox_credentials: true
    )

    get "/api/communities"

    config = json_response.first.fetch("mapConfig")
    expect(config["mapboxStyle"]).to eq("mapbox://styles/example/style")
    expect(config["mapboxAccessToken"]).to eq("pk.123")
  end

  it "hides mapbox style configuration when not exposed" do
    public_community.theme.update!(
      mapbox_style_url: "mapbox://styles/example/style",
      mapbox_access_token: "pk.123",
      expose_mapbox_credentials: false
    )

    get "/api/communities"

    config = json_response.first.fetch("mapConfig")
    expect(config["mapboxStyle"]).to be_nil
    expect(config["mapboxAccessToken"]).to be_nil
  end

  it "still returns non-Mapbox style when credentials are not exposed" do
    public_community.theme.update!(
      protomaps_api_key: "abc123",
      expose_mapbox_credentials: false
    )

    get "/api/communities"

    config = json_response.first.fetch("mapConfig")
    expect(config["mapboxAccessToken"]).to be_nil
    expect(config["mapboxStyle"]).to eq("https://api.protomaps.com/tiles/v3.json?key=abc123")
  end

  context "with search" do
    it "can be filtered with case insensitive query" do
      get "/api/communities", params: {search: "cool"}
      expect(json_response.length).to eq(1)
    end

    it "only returns matching results" do
      get "/api/communities", params: {search: "nope"}
      expect(json_response.length).to eq(0)
    end
  end
end
