(function() {

  var map = null;
  var servicios = null;
  var grupoServicios = null;
  var jstsParser = null;
  var mapFeatureLayerObjects = [];

  var loadData = function() {};
  var createMap = function() {};
  var addMapProperties = function() {};
  var zoomToInitialExtent = function() {};
  var addLayers = function() {};
  var createLegend = function() {};
  var generateHTMLLegendWMS = function() {};
  var generateHTMLLegendWFS = function() {};
  var createTOC = function() {};
  var changeVisibilityLayer = function() {};
  var changeVisibilityGroup = function() {};
  var checkVisibilityAtScale = function() {};
  var _getLayerById = function() {};
  var createIdentify = function() {};
  var identifyInteraction = function() {};
  var addZoomSlider = function() {};
  var setServicios = function() {};
  var setGrupoServicios = function() {};
  var getMap = function() {};
  var getMapFeatureLayerObjects = function() {};
  var getJstsParser = function() {};
  var getIdentifyInteraction = function() {};
  var exposeGlobals = function() {};

  $(function() {
    console.log("Ready!");
    loadData();
  });

  loadData = function() {
    var serviciosPromise = $.get('conf/servicios.json');
    var gruposPromise = $.get('conf/grupos.json');

    $.when(serviciosPromise, gruposPromise).done(function(results1, results2) {
      // do something
      console.log('results', results1, results2);
      servicios = results1[0];
      grupoServicios = results2[0];
      createMap();
    });
  };

  createMap = function() {

    jstsParser = new jsts.io.OL3Parser();

    //var projection = new ol.proj.Projection({code: 'EPSG:4326', units: 'degrees', axisOrientation: 'neu'});

    map = new ol.Map({
      //layers: [osmLayer, wmsLayer, grupoislaLayer, islaLayer],
      //overlays: [overlay],
      target: document.getElementById('map'),
      view: new ol.View({
        //projection: projection,
        center: [-8248199.896347591, 510943.79974994034],
        // extent: [ //Esto limita el mapa a esta extension
        //   -74.18615000043059, 4.514284463291831, -73.92439112512187, 4.659751162274072
        // ],
        zoom: 12,
        maxZoom: 26
      }),
      controls: ol.control.defaults().extend([new ol.control.ScaleLine()])
    });

    addMapProperties();
    addLayers();
    addZoomSlider();
    //checkVisibilityAtScale()
    //add the legend
    createLegend();
    createTOC();
    createIdentify();
    zoomToInitialExtent();
    consultas.addLayerHighlight(map);
    generalReport.loadInterfaces(map);
  };

  addMapProperties = function() {
    map.getLayer = _getLayerById;
  };

  zoomToInitialExtent = function() {
    // var initialExtent = map.getLayer('sede_punto').getSource().getExtent();
    var initialExtent = [-8258364.441961344, 503048.5820093646, -8229225.577251358, 520654.68434993026];
    map.getView().fit(initialExtent, map.getSize());
  };

  addLayers = function() {
    // Base map
    // var osmLayer = new ol.layer.Tile({source: new ol.source.OSM()});
    //
    // map.addLayer(osmLayer);

    // IDECA Base Map
    var idecaLayer = new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'http://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Mapa_Referencia/mapa_base_3857/MapServer/tile/{z}/{y}/{x}'
      })
    });

    map.addLayer(idecaLayer);

    // format used to parse WFS GetFeature responses
    var geojsonFormat = new ol.format.GeoJSON();

    mapFeatureLayerObjects = [];

    var wfsLoader = function(extent, resolution, projection) {
      var indice = this.indice;
      var wfsSource = this;
      var url = servicios[indice].url + '&srsname=EPSG:3857&bbox=' + extent.join(',') + ',EPSG:3857';
      if (url.toLowerCase().indexOf('maxfeatures') !== -1) {
        window.alert('Por favor, retire el parámetro maxFeatures de la url del servicio ' + servicios[indice].id + '.');
      }
      // use jsonp: false to prevent jQuery from adding the "callback"
      // parameter to the URL
      $.ajax({
        url: url,
        dataType: 'json',
        jsonp: false
      }).done(function(response) {
        var features = geojsonFormat.readFeatures(response);
        var filter = wfsSource.config.filter;
        if (typeof filter !== 'undefined' && filter !== '') {
          //window.features = features;
          features = features.filter(function(feature) {
            console.log('eval(filter)', eval(filter), wfsSource.config.id);
            return eval(filter);
          });
        }
        wfsSource.addFeatures(features);
      });
    };

    for (var i = 0; i < servicios.length; i++) {
      var servicio = servicios[i];
      if (typeof servicio.enable === 'undefined' || servicio.enable === true) {
        if (servicio.serviceType === 'WFS') {
          mapFeatureLayerObjects.push(servicio);
          var wfsSource = new ol.source.Vector({
            loader: wfsLoader,
            strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
              maxZoom: 19
            }))
          });
          wfsSource.indice = i;
          wfsSource.config = servicio;

          var wfsLayer = new ol.layer.Vector({
            source: wfsSource,
            style: (function(feature) {
              var ctxServicio = this;
              return mapTools.getLayerStyle(feature, ctxServicio);
            }).bind(servicio),
            visible: (typeof servicio.visible === 'undefined') ?
              true : servicio.visible
          });
          wfsLayer.indice = i;

          map.addLayer(wfsLayer);
        } else if (servicio.serviceType === 'WMS') {
          mapFeatureLayerObjects.push(servicio);
          var wmsSource = new ol.source.TileWMS({
            url: '/geoserver/wms',
            params: {
              'LAYERS': 'parqueaderos:sotano1_50ppp_georeferenced',
              'FORMAT': 'image/png',
              'TILED': true
            },
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
          });
          wmsSource.indice = i;
          wmsSource.config = servicio;

          var wmsLayer = new ol.layer.Tile({
            source: wmsSource,
            opacity: (typeof servicio.opacity === 'undefined') ?
              1 : servicio.opacity,
            visible: (typeof servicio.visible === 'undefined') ?
              true : servicio.visible
          });
          map.addLayer(wmsLayer);

        } else if (servicio.serviceType === 'WMSServer') {
          mapFeatureLayerObjects.push(servicio);
          var wmsServerSource = new ol.source.TileWMS({
            url: servicio.url,
            params: {
              LAYERS: servicio.layers,
              FORMAT: 'image/png'
            },
            crossOrigin: ''
          });
          wmsServerSource.indice = i;
          wmsServerSource.config = servicio;

          var wmsServerLayer = new ol.layer.Tile({
            source: wmsServerSource,
            opacity: (typeof servicio.opacity === 'undefined') ?
              1 : servicio.opacity,
            visible: (typeof servicio.visible === 'undefined') ?
              true : servicio.visible
          });
          map.addLayer(wmsServerLayer);
        }
      }
    }
  };

  createLegend = function() {
    // link: http://docs.geoserver.org/stable/en/user/services/wms/reference.html
    // link: https://openlayers.org/en/latest/examples/wms-capabilities.html
    var legendDiv = $('#legendDiv');
    var layers = map.getLayers().getArray();
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var source = layer.getSource();
      if (typeof(source.config) !== 'undefined') {
        var type = source.config.serviceType;
        if (type === 'WMSServer' || type === 'WMS') {
          $.get(source.config.url + '?service=wms&version=1.1.1&request=GetCapabilities', function(response) {
            generateHTMLLegendWMS(response);
          });
        } else if (type === 'WFS') {
          generateHTMLLegendWFS(source.config);
        }
      }
    }
  };

  generateHTMLLegendWMS = function(response) {
    var legendDiv = $('#legendDiv');
    var parser = new ol.format.WMSCapabilities();
    var result = parser.read(response);
    var layer = result.Capability.Layer;
    var layers = layer.Layer;
    var item = '<li class="collection-header"><h5>' + layer.Title + '</h5></li>';
    legendDiv.append(item);

    var collapsible = '<ul class="collapsible" data-collapsible="expandable"></ul>';
    collapsible = $(collapsible);
    legendDiv.append(collapsible);
    mapTools.searchLayerRecursive(layers, function(layer) {
      var url = layer.Style[0].LegendURL[0].OnlineResource;
      var title = layer.Title;
      if (url) {
        var item = $('<li></li>');
        var div = $('<div class="collapsible-header item-leyenda-wms-title"><i class="material-icons tiny">play_arrow</i>' + title + '</div>');
        var div2 = $('<div class="collapsible-body item-leyenda-wms-content"><span><img src="' + url + '"/></span></div>');
        item.append(div);
        item.append(div2);
        collapsible.append(item);
      }
    });
    $('#legendDiv .collapsible').collapsible();
  };

  generateHTMLLegendWFS = function(config) {
    var legendDiv = $('#legendDiv');
    var layer = config;

    var style = '';
    if (typeof layer.iconImage !== 'undefined' && layer.iconImage !== '') {
      style = 'background-image:url(' + layer.iconImage + '); background-size: 100% 100%; border-style: none;';
    } else {
      style = 'border-color:' + layer.strokeColor + ';border-style: dashed;';
    }

    var item = '<li class="collection-header collection-item"><h5>' + layer.name + '</h5><span class="leyenda-icon" style="' + style + '"></span></li>';
    legendDiv.append(item);
  };

  createTOC = function() {
    var toc = $('#toc-div');
    var collapsible = $('<ul class="collapsible" data-collapsible="accordion"></ul>');
    var i,
      li;
    console.log('jkjdlsf grupoServicios', grupoServicios);
    for (i = 0; i < grupoServicios.length; i++) {
      var grupo = grupoServicios[i];
      var active = (i === 0) ?
        'active' :
        '';

      li = $('<li></li>');

      var aOff =  $('<a href="#!" data-group-layer-off="'+ grupo.id+'" onclick="changeVisibilityGroup(event, \'' + grupo.id + '\', false)"><i class="material-icons btnEyeGroup">visibility_off</i></a>');

      var aOn = $('<a href="#!" data-group-layer-on="'+ grupo.id+'" onclick="changeVisibilityGroup(event, \'' + grupo.id + '\', true)"><i class="material-icons btnEyeGroup">visibility</i></a>');

      var divHeader = $('<div class="collapsible-header ' + active + '"><i class="material-icons">layers</i>' + grupo.name +'</div>');
      divHeader.append(aOff);
      divHeader.append(aOn);

      var divBody = $('<div class="collapsible-body"><ul class="collection" data-group="' + grupo.id + '"></ul></div>');

      li.append(divHeader);
      li.append(divBody);
      collapsible.append(li);
    }
    toc.append(collapsible);

    for (i = 0; i < mapFeatureLayerObjects.length; i++) {
      var layer = mapFeatureLayerObjects[i];
      var classVisible = 'visibility';
      if (layer.visible === false) {
        classVisible = 'visibility_off';
      }
      var imageUrl = (typeof(layer.icon) === 'undefined' || layer.icon === '') ?
        'css/img/oas.jpg' :
        layer.icon;
      var layerMaxScale = (typeof(layer.maxScale) === 'undefined') ?
        'Inf' :
        layer.maxScale;
      var divFilters = $('<div class="input-field col s12"></div>');
      var filterClass = '';
      var selectParams = '';
      if (typeof(layer.select) !== 'undefined' && layer.select !== '') {
        selectParams = layer.select;
      }
      if (typeof(layer.filters) !== 'undefined' && layer.filters !== '') {
        filterClass = ' toc-layer-filters';
        var select = $('<select onchange="mapTools.changeFilter(this, \'' + layer.id + '\')" ' + selectParams + '><option value="" disabled selected>Seleccione un filtro</option></select>');

        for (var j = 0; j < layer.filters.length; j++) {
          var filter = layer.filters[j];
          var option = $('<option value="' + filter.filter + '">' + filter.name + '</option>');
          select.append(option);
        }

        divFilters.append(select);
      }

      li = $('<li class="collection-item avatar' + filterClass + '"></li>');

      var img = $('<img src="' + imageUrl + '" alt="" class="circle" />');
      var span = $('<span class="title" style="padding-right: 22px; display: block;">' + layer.name + '</span>');
      var a = $('<a href="#!" onclick="changeVisibilityLayer(\'' + layer.id + '\')" class="secondary-content"><i class="material-icons btnEye" data-layer-icon="' + layer.id + '">' + classVisible + '</i></a>');

      li.append(img);
      li.append(span);
      li.append(a);
      li.append(divFilters);
      var group = $('[data-group="' + layer.groupId + '"]');
      group.append(li);
    }

    // Se cargan las cosas necesarias
    toc.find('.collapsible').collapsible();
    toc.find('select').material_select();
    //checkVisibilityAtScale();
  };

  changeVisibilityLayer = function(layerId) {
    var layer = map.getLayer(layerId);
    var icon = $('[data-layer-icon="' + layerId + '"]')[0];
    //window.layer = layer;
    if (layer.getVisible()) {
      layer.setVisible(false);
      icon.innerHTML = 'visibility_off';
    } else {
      layer.setVisible(true);
      icon.innerHTML = 'visibility';
    }
  };

  changeVisibilityGroup = function(evt, groupId, visibility) {
    //evt.preventDefault()
    evt.stopPropagation();
    for (var i = 0; i < mapFeatureLayerObjects.length; i++) {
      var layer = mapFeatureLayerObjects[i];
      if (layer.groupId === groupId) {
        var olLayer = map.getLayer(layer.id);
        var icon = $('[data-layer-icon="' + layer.id + '"]')[0];
        if (visibility) {
          olLayer.setVisible(true);
          icon.innerHTML = 'visibility';
        } else {
          olLayer.setVisible(false);
          icon.innerHTML = 'visibility_off';
        }
      }
    }
  };

  // https://developers.arcgis.com/javascript/3/jssamples/fl_performance.html
  checkVisibilityAtScale = function() {

    for (var i = 0; i < mapFeatureLayerObjects.length; i++) {
      var scale = map.getScale();
      var layer = mapFeatureLayerObjects[i];
      var icon;
      if (scale >= layer.minScale && scale <= layer.maxScale) {
        map.getLayer(layer.id).setVisibility(true);
        icon = document.querySelector('[data-layer-icon="' + layer.id + '"]');
        if (icon !== null) {
          icon.innerHTML = 'visibility';
        }

      } else {
        map.getLayer(layer.id).setVisibility(false);
        icon = document.querySelector('[data-layer-icon="' + layer.id + '"]');
        if (icon !== null) {
          icon.innerHTML = 'visibility_off';
        }
      }
    }
  };

  _getLayerById = function(id) {
    var layers = map.getLayers().getArray();
    window.layers = layers;
    return layers.find(function(layer) {
      var source = layer.getSource();
      if (typeof(source.config) !== 'undefined') {
        return source.config.id === id;
      }
      return false;
    });
  };

  createIdentify = function() {

    /**
     * Elements that make up the popup.
     */
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');

    /**
     * Create an overlay to anchor the popup to the map.
     */
    var overlay = new ol.Overlay( /** @type {olx.OverlayOptions} */
      ({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      }));

    map.addOverlay(overlay);
    /**
     * Add a click handler to hide the popup.
     * @return {boolean} Don't follow the href.
     */
    closer.onclick = function() {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    var lastFeature = null;
    var selectInteraction = new ol.interaction.Select();
    selectInteraction.on('select', function(evt) {
      console.log('evt select', evt);
      //window.evt = evt;
      var coordinate = evt.mapBrowserEvent.coordinate;

      var properties = lastFeature.getProperties();

      $(content).html('');
      var featureHTML = $('<div></div>');

      for (var property in properties) {
        if (properties.hasOwnProperty(property)) {
          var span = null;
          if (['geometry'].indexOf(property) === -1) { // Si no esta en la lista
            if (/.*\.(JPG|JPEG|PNG)$/.test((properties[property] + '').toUpperCase())) { // Si termina en .JPG o .PNG es una imagen
              span = $('<span><b>' + property + ':</b><br/><img src="' + properties[property] + '" style="width:200px; height:200px;"/><span/><br/>');
            } else if ((properties[property] + '').toUpperCase() !== 'NULL'){ // Si el campo no es null
              span = $('<span><b>' + property + ':</b> ' + properties[property] + '</span><br/>');
            }
            featureHTML.append(span);
          }
        }
      }

      var geometrySpan = $('<span><a href="#">Acercar</a></span>');
      geometrySpan[0].geometry = properties.geometry;
      geometrySpan.click(function() {
        mapTools.zoomToGeometry(this.geometry);
        var newCoordinate = mapTools.getCenterOfExtent(this.geometry.getExtent());
        overlay.setPosition(newCoordinate);
      });
      featureHTML.append(geometrySpan);

      $(content).append(featureHTML);
      overlay.setPosition(coordinate);
    });

    selectInteraction.getFeatures().on('add', function(evt) {
      console.log('evt add', evt);
      //window.evt2 = evt;
      var feature = evt.element; //the feature selected
      lastFeature = feature;
    });

    map.addInteraction(selectInteraction);
    identifyInteraction = selectInteraction;
  };

  setServicios = function(arrayServicios) {
    servicios = arrayServicios;
  };

  setGrupoServicios = function(arrayGrupoServicios) {
    grupoServicios = arrayGrupoServicios;
  };

  addZoomSlider = function() {
    var zoomslider = new ol.control.ZoomSlider();
    map.addControl(zoomslider);
  };

  getMap = function() {
    return map;
  };

  getMapFeatureLayerObjects = function() {
    return mapFeatureLayerObjects;
  };

  getJstsParser = function() {
    return jstsParser;
  };

  getIdentifyInteraction = function() {
    return identifyInteraction;
  };


  function exposeForTests() {
    if (typeof describe !== 'undefined') {
      // for tests
      window._scopeCreateMap = {};
      window._scopeCreateMap.createMap = createMap;
      // window._scopeCreateMap.addMapProperties = addMapProperties;//testeada en createMap
      window._scopeCreateMap.zoomToInitialExtent = zoomToInitialExtent;
      // window._scopeCreateMap.addLayers = addLayers;//testeada en createMap
      // window._scopeCreateMap.createLegend = createLegend;//testeada en createMap
      // window._scopeCreateMap.generateHTMLLegendWMS = generateHTMLLegendWMS;//testeada en createMap
      // window._scopeCreateMap.generateHTMLLegendWFS = generateHTMLLegendWFS;//testeada en createMap
      // window._scopeCreateMap.createTOC = createTOC;//testeada en createMap//testeada en createMap
      window._scopeCreateMap.changeVisibilityLayer = changeVisibilityLayer;
      window._scopeCreateMap.changeVisibilityGroup = changeVisibilityGroup;
      window._scopeCreateMap.checkVisibilityAtScale = checkVisibilityAtScale;
      window._scopeCreateMap._getLayerById = _getLayerById;
      window._scopeCreateMap.createIdentify = createIdentify;
      window._scopeCreateMap.addZoomSlider = addZoomSlider;
      window._scopeCreateMap.getIdentifyInteraction = getIdentifyInteraction;
      window._scopeCreateMap.getMap = getMap;
      window._scopeCreateMap.exposeGlobals = exposeGlobals;
      window._scopeCreateMap.setServicios = setServicios;
      window._scopeCreateMap.setGrupoServicios = setGrupoServicios;
    }
  }

  exposeGlobals = function() {
    if (typeof window !== 'undefined') {
      window.getMap = getMap;
      window.getMapFeatureLayerObjects = getMapFeatureLayerObjects;
      window.getJstsParser = getJstsParser;
      window.getIdentifyInteraction = getIdentifyInteraction;
      window.changeVisibilityLayer = changeVisibilityLayer;
      window.changeVisibilityGroup = changeVisibilityGroup;
    }
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    console.log('Load module for Node.js');
    // module.exports = something;
  } else {
    exposeGlobals();
    exposeForTests();
  }

})();
