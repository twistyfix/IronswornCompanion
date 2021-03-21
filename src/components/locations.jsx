import React, { Component } from "react";
import Leaflet from "leaflet/dist/leaflet";
import "../../node_modules/leaflet/dist/leaflet.css";
import Oracles from "./oracles";
import ProgressTrack from "./progressTrack";
import TitleBlock from "./titleBlock";
import mapImg from "../img/map.jpg";
import mapMarker from "../img/MapMarker.png";

class Locations extends Component {
  state = {
    id: -1,
    name: "",
    descriptor: "",
    features: "",
    trouble: "",
    x: 0,
    y: 0,
    additionalInfo: "",
    addButtonClass: "show",
    deleteButtonClass: "hide",
    npcs: [],
    markers: [],
  };

  constructor() {
    super();
    this.oracles = new Oracles();
    // const L = Leaflet;
    // let map = this.createMap(L);
  }

  /*=================================*/
  /*    Setup
  /*=================================*/

  clearState() {
    this.setState({ id: -1 });
    this.setState({ name: "" });
    this.setState({ descriptor: "" });
    this.setState({ features: "" });
    this.setState({ trouble: "" });
    this.setState({ additionalInfo: "" });
    this.setState({ x: 0 });
    this.setState({ y: 0 });
    this.setState({ deleteButtonClass: "hide" });
    this.setState({ npcs: null });
    this.setState({ bond: 0 });
  }

  componentDidMount() {
    const L = Leaflet;
    let map = this.createMap();
    this.state.map = map;
    this.createMarkers();
    this.addMarkers();
  }

  setXY(x, y) {
    this.setState({ x });
    this.setState({ y });
  }

  createMap() {
    const L = Leaflet;
    let map = L.map("mapid", {
      crs: L.CRS.Simple,
      zoomSnap: 0.25,
    });
    var bounds = [
      [0, 0],
      [792, 594],
    ];
    L.imageOverlay(mapImg, bounds, {
      attribution:
        '&copy; <a href="https://www.ironswornrpg.com/">Shawn Tomkin</a>, Art by <a href="https://www.blackhawkcartography.com/">Josiah Van Egmond</a>',
    }).addTo(map);
    map.fitBounds(bounds);

    map.on("click", (e) => this.onMapClick(e));
    return map;
  }

  createMarkers = () => {
    const markers = [];
    const L = Leaflet;
    var myIcon = L.icon({
      iconUrl: mapMarker,
      iconSize: [32, 32],
      iconAnchor: [0, 32],
      popupAnchor: [15, -32],
    });

    for (let i = 0; i < this.props.locations.length; i++) {
      const location = this.props.locations[i];
      var loc = L.latLng([location.y, location.x]);
      let marker = L.marker(loc, { icon: myIcon });
      marker.on("click", (e) => this.onMarkerClick(e));
      markers.push({
        marker: marker,
        locationId: location.id,
        locationName: location.name,
      });
    }
    this.setState({ markers });
  };

  addMarkers = () => {
    // this.state.markers.map()
    this.state.markers.map((m) => {
      m.marker.addTo(this.state.map);
      m.marker.bindPopup(`${m.locationId}: ${m.locationName}`);
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.markers.length !== prevState.markers.length)
      this.createMarkers();
    this.addMarkers();
    this.props.onComponentUpdate();
  }

  /*=================================*/
  /*    Locations
  /*=================================*/

  handleOnLocationProgressionChanged = (id, increment) => {
    const locations = this.props.locations.map((l) => {
      if (l.id == id) {
        let val = increment ? 1 : -1;
        l.bond += val;
        l.bond = l.bond > 40 ? 40 : l.bond;
        l.bond = l.bond < 0 ? 0 : l.bond;

        const players = this.props.players.map((p) => {
          // if (p.name == this.getSelectedPlayer().name) {
          p.bonds += val;
          p.bonds = p.bonds > 40 ? 40 : p.bonds;
          p.bonds = p.bonds < 0 ? 0 : p.bonds;
          // }
          return p;
        });
        this.setState({ players });
      }
      return l;
    });
    this.setState({ locations });
  };

  /*=================================*/
  /*    Events
  /*=================================*/

  onMapClick = (ev) => {
    this.clearState();
    let x = Math.round(ev.latlng.lng);
    let y = Math.round(ev.latlng.lat);
    this.setXY(x, y);
  };

  onMarkerClick = (ev) => {
    let popup = ev.target._popup._content.toString();
    let id = popup.substr(0, popup.indexOf(":"));
    let x = Math.round(ev.latlng.lng);
    let y = Math.round(ev.latlng.lat);

    let location = this.props.locations.find((l) => l.id == id);
    this.setState({ id: location.id });
    this.setState({ name: location.name });
    this.setState({ descriptor: location.descriptor });
    this.setState({ features: location.features });
    this.setState({ trouble: location.trouble });
    this.setState({ additionalInfo: location.additionalInfo });
    this.setState({ deleteButtonClass: "show" });
    this.setState({
      npcs: this.props.npcs.filter((n) => n.locationId == location.id),
    });
    this.setXY(x, y);
    this.setState({ bond: location.bond });
  };

  handleOnSaveLocation() {
    if (this.state.name != "" && this.state.x > 0 && this.state.y > 0) {
      const locations = this.props.locations;

      let id = 0;
      if (this.state.id > -1) {
        id = this.state.id;
      } else if (locations.length > 0) {
        id = locations[locations.length - 1].id + 1;
      }
      locations[locations.length] = {
        id: id,
        name: this.state.name,
        descriptor: this.state.descriptor,
        features: this.state.features,
        trouble: this.state.trouble,
        x: this.state.x,
        y: this.state.y,
        additionalInfo: this.state.additionalInfo,
        bond: 0,
      };
      this.setState({ locations: locations });
    }

    this.clearState();
    this.createMarkers();
  }

  handleOnDeleteLocation = () => {
    console.log(this.state.id);
    const locations = this.props.locations;
    let pos = -1;
    for (let i = 0; i < locations.length; i++) {
      let l = locations[i];
      if (l.id === this.state.id) {
        pos = i;
      }
    }

    if (pos != -1) locations.splice(pos, 1);
    this.setState({ locations: locations });
    window.location.reload();
  };

  handleOnRollName = () => {
    let rn = this.oracles.SettlementName;
    this.setState({ name: rn });
  };

  handleOnNameChanged = (evt) => {
    this.setState({ name: evt.target.value });
  };

  handleOnRollDescriptor = () => {
    let rn = this.oracles.LocationDescriptor;
    this.setState({ descriptor: rn });
  };

  handleOnDescriptorChanged = (evt) => {
    this.setState({ descriptor: evt.target.value });
  };

  handleOnRollFeature = () => {
    let rn = this.oracles.Location;
    this.setState({ features: rn });
  };

  handleOnRollCoastalFeature = () => {
    let rn = this.oracles.CoastalWatersLocation;
    this.setState({ features: rn });
  };

  handleOnFeatureChanged = (evt) => {
    this.setState({ features: evt.target.value });
  };

  handleOnRollLocationTrouble = () => {
    let rn = this.oracles.LocationTrouble;
    this.setState({ trouble: rn });
  };

  handleOnLocationTroubleChanged = (evt) => {
    this.setState({ trouble: evt.target.value });
  };

  handleOnAdditionalInfoChanged = (evt) => {
    this.setState({ additionalInfo: evt.target.value });
  };

  /*=================================*/
  /*    Render
  /*=================================*/

  render() {
    return (
      <React.Fragment>
        <h1>Locations and Settlements</h1>
        <div className="form-group"></div>
        <div className="row">
          <div className="col-5">
            <div id="mapid"></div>
          </div>
          <div className="col-7">
            <div className="row">
              <div className="col-9">
                <h3>Location/Settlement Details</h3>
              </div>
              <div
                id="locationAddBtn"
                className={`col-3 text-right ${this.state.addButtonClass}`}
              >
                <button
                  className="btn btn-dark"
                  onClick={() => this.handleOnSaveLocation()}
                >
                  <i className="fas fa-save"></i> Save Location
                </button>
              </div>
            </div>

            <p className="mt-3">
              Click on the map to choose an X,Y coordinate for your new
              location. Then fill out the details for each field either by
              typing into the boxes or consulting the oracle. You can edit
              locations by clicking on a map pin and changing the details.
            </p>

            <input
              type="hidden"
              className="form-control"
              value={this.state.id}
              disabled
            />

            <div className="input-group mb-3">
              <label className="input-group-prepend btn btn-dark btn-tag">
                X:
              </label>
              <input
                type="text"
                className="form-control input-group-prepend"
                placeholder="X Coordinate"
                aria-label="Name"
                aria-describedby="basic-addon2"
                disabled
                value={this.state.x}
              />
              <label className="input-group-prepend btn btn-dark btn-tag">
                Y:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Y Coordinate"
                aria-label="Name"
                aria-describedby="basic-addon2"
                disabled
                value={this.state.y}
              />
            </div>

            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => this.handleOnRollName()}
                >
                  <i className="fas fa-dice-d20"></i> Roll
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Settlement/Location Name"
                aria-label="Name"
                aria-describedby="basic-addon2"
                value={this.state.name}
                onChange={(e) => this.handleOnNameChanged(e)}
              />
            </div>

            {/* <div className="onoffswitch">
              <input
                type="checkbox"
                name="onoffswitch"
                className="onoffswitch-checkbox"
                id="myonoffswitch"
                tabindex="0"
              />
              <label className="onoffswitch-label" htmlFor="myonoffswitch">
                <span className="onoffswitch-inner"></span>
                <span className="onoffswitch-switch"></span>
              </label>
            </div> */}

            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => this.handleOnRollDescriptor()}
                >
                  <i className="fas fa-dice-d20"></i> Roll
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Location Descriptor"
                aria-label="Name"
                aria-describedby="basic-addon2"
                value={this.state.descriptor}
                onChange={(e) => this.handleOnRollDescriptor(e)}
              />
            </div>

            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => this.handleOnRollFeature()}
                >
                  <i className="fas fa-dice-d20"></i> Roll Mainland
                </button>
              </div>
              <div className="input-group-prepend">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => this.handleOnRollCoastalFeature()}
                >
                  <i className="fas fa-dice-d20"></i> Roll Coastal
                </button>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="Location Features"
                aria-label="Name"
                aria-describedby="basic-addon2"
                value={this.state.features}
                onChange={(e) => this.handleOnFeatureChanged(e)}
              />
            </div>

            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => this.handleOnRollLocationTrouble()}
                >
                  <i className="fas fa-dice-d20"></i> Roll
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Settlement Trouble"
                aria-label="Name"
                aria-describedby="basic-addon2"
                value={this.state.trouble}
                onChange={(e) => this.handleOnLocationTroubleChanged(e)}
              />
            </div>
            <textarea
              className="form-control mb-3"
              placeholder="Additional Information"
              rows="5"
              value={this.state.additionalInfo}
              onChange={(e) => this.handleOnAdditionalInfoChanged(e)}
            ></textarea>
            <div className={this.state.deleteButtonClass}>
              {this.props.selectedPlayer != null ? (
                <React.Fragment>
                  <TitleBlock title="BOND" />

                  <ProgressTrack
                    key={this.state.id}
                    progress={
                      this.props.locations.find((l) => l.id == this.state.id)
                        ? this.props.locations.find(
                            (l) => l.id == this.state.id
                          ).bond
                        : 0
                      // .bond
                    }
                    onProgressionChange={(increment) =>
                      this.handleOnLocationProgressionChanged(
                        this.state.id,
                        increment
                      )
                    }
                  />
                </React.Fragment>
              ) : (
                <React.Fragment></React.Fragment>
              )}

              <TitleBlock title="Npcs" />
              <table className="table table-striped">
                <tbody>
                  {this.props.npcs
                    .filter((n) => n.locationId == this.state.id)
                    .map((n) => (
                      <tr>
                        <td>{n.name}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div
              id="locationDeleteBtn"
              className={`mt-5 ${this.state.deleteButtonClass}`}
              onClick={() => this.handleOnDeleteLocation()}
            >
              <button className="btn btn-danger">
                <i className="fas fa-times"></i> Delete Location
              </button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Locations;
