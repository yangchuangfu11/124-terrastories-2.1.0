class AddExposeMapboxCredentialsToThemes < ActiveRecord::Migration[7.1]
  def change
    add_column :themes, :expose_mapbox_credentials, :boolean, default: false, null: false
  end
end
