MarkerHandler.prototype = new BaseHandler();

/**
 * Is responsible to show the markers from the markers.js.
 */
function MarkerHandler(control, markers) {
	this.control = control;
	this.layerGroups = {};
	this.markers = markers;
	this.markersByGroup = {};
	this.visible = {};
}

//Markers layer
var layerGroupForSearch = L.layerGroup();

MarkerHandler.prototype.onMapChange = function(name, rotation) {
	for(var group in this.layerGroups)
		this.ui.lmap.removeLayer(this.layerGroups[group]);
	this.layerGroups = {};
	
	var createDefaultMarker = function(ui, groupInfo, markerInfo) {
		var pos = markerInfo.pos;
		// show on top center of block
		var marker = new L.Marker(ui.mcToLatLng(pos[0] + 0.5, pos[1] + 0.5, pos[2]), {
			title: markerInfo.title,
		});

		// The icon may be specified on either a marker or group level, with
		// preference for the marker-specific icon.
		var icon = markerInfo.icon ? markerInfo.icon : groupInfo.icon;
		var iconSize = markerInfo.iconSize ? markerInfo.iconSize : groupInfo.iconSize;

		var copied = "Coords copied to clipboard"
		marker.bindPopup(markerInfo.text ? markerInfo.text : markerInfo.title + "<br />" + copied.bold());
		//On marker click
		marker.on('click', function(ev){
		//Copy coords x, y, z to clipboard
 		navigator.clipboard.writeText(markerInfo.pos[0] + " " + markerInfo.pos[2] + " " + markerInfo.pos[1]);
		});
		return marker;
	};
	var world = this.ui.getCurrentMapConfig().world;
	for(var i = 0; i < this.markers.length; i++) {
		var groupInfo = this.markers[i];
		var group = groupInfo.id;
		this.markersByGroup[group] = groupInfo;
		
		if(!(world in groupInfo.markers)) {
			// create empty layer group
			this.layerGroups[group] = L.layerGroup();
			continue;
		}
		
		if(!groupInfo.createMarker)
			groupInfo.createMarker = createDefaultMarker;
		
		var markers = groupInfo.markers[world];
		var layerGroup = L.layerGroup();
		for(var j = 0; j < markers.length; j++) {
			var markerInfo = markers[j];
			var marker = groupInfo.createMarker(this.ui, groupInfo, markerInfo);
			if(marker != null){
				marker.addTo(layerGroup);
				marker.addTo(layerGroupForSearch);
			}
		}
		
		this.layerGroups[group] = layerGroup;
		if(!(group in this.visible))
			this.visible[group] = true;
		if("showDefault" in groupInfo && !groupInfo.showDefault) {
			this.control.uncheckGroup(group);
			this.visible[group] = false;
		}
	}
	
	for(var group in this.visible)
		this.show(group, this.visible[group]);

	this.updateMarkerCounts();
};

MarkerHandler.prototype.getLayerGroup = function() {
	return layerGroupForSearch;
};

MarkerHandler.prototype.updateMarkerCounts = function() {
	var world = this.ui.getCurrentMapConfig().world;
	var buttons = this.control.buttons;
	for(var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		var group = button.getAttribute("data-group");
		var count = 0;
		if(world in this.markersByGroup[group].markers)
			count = this.markersByGroup[group].markers[world].length;

		var span = button.getElementsByTagName("span")[0];
		span.innerHTML = count;
	}
};

MarkerHandler.prototype.getMarkerGroups = function() {
	var groups = [];
	for(var i = 0; i < this.markers.length; i++)
		groups.push([this.markers[i]["id"], this.markers[i]["name"]]);
	return groups;
};

MarkerHandler.prototype.show = function(group, visible) {
    if (!group) {
        console.warn("show() called with null or undefined group!");
        return;
    }

    var layer = this.layerGroups[group];
    if (!layer) {
        console.warn("Layer group not found:", group, this.layerGroups);
        return;
    }

    if (visible && !this.ui.lmap.hasLayer(layer)) {
        layer.addTo(this.ui.lmap);
    } else if (!visible && this.ui.lmap.hasLayer(layer)) {
        this.ui.lmap.removeLayer(layer);
    }
};
