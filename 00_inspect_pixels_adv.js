


/// Click on the map to inspect the CCDC results for a single pixel (in the console).

var temporalSegmentation = require('users/aufaristama/CCDC_LS:API/temporalSegmentation')

Map.style().set('cursor', 'crosshair')
Map.onClick(chartPoint)
Map.setOptions('HYBRID')

Map.centerObject(iburi, 12)


function chartPoint(latLon) {
  var point = ee.Geometry.Point([latLon.lon, latLon.lat])
  
  var collection = createLandsatCollection({
    region: point,
    start: '1982-01-01',
    end: '2023-01-01', 
    mapImage: function(image) { return image.addBands(toNDVI(image)) }
  })
  
  var ccdc = ee.Algorithms.TemporalSegmentation.Ccdc({
    collection: collection,
    minObservations: 2,
    breakpointBands: ["ndvi"]
  })
  
    var ccdc2 = ee.Algorithms.TemporalSegmentation.Ccdc({
    collection: collection,
    minObservations: 3,
    breakpointBands: ["ndvi"]
  })
    var ccdc3 = ee.Algorithms.TemporalSegmentation.Ccdc({
    collection: collection,
    minObservations: 6,
    breakpointBands: ["ndvi"]
  })
  
  temporalSegmentation.chartPoint({
    image: ccdc,
    point: point,
    bandName: 'ndvi',
    // If don't plot the raw collection, this will be faster.
    collection: collection,
    callback: function (chart) {
      print(chart)
    }
  })
    temporalSegmentation.chartPoint({
    image: ccdc2,
    point: point,
    bandName: 'ndvi',
    // If don't plot the raw collection, this will be faster.
    collection: collection,
    callback: function (chart) {
      print(chart)
    }
  })  
    temporalSegmentation.chartPoint({
    image: ccdc3,
    point: point,
    bandName: 'ndvi',
    // If don't plot the raw collection, this will be faster.
    collection: collection,
    callback: function (chart) {
      print(chart)
    }
  })  
}

/////////////////////////////////////////////////
// Utility functions to create ImageCollection //
/////////////////////////////////////////////////
function toNDVI(image) {
 var ndvi = image.select(['red', 'nir']).normalizedDifference(['nir', 'red']).multiply(10000)
 .rename('ndvi')
 return ndvi
}

function createLandsatCollection(params) {
  var defaultParams = {
    region: Map.getBounds(true), 
    start: '1982-01-01', 
    end: formatDate(new Date()), 
    mapImage: function (image) { return image }
  }
  params = mergeObjects([defaultParams, params])
  
  var filter = ee.Filter.and(
      ee.Filter.bounds(params.region),
      ee.Filter.date(params.start, params.end  )
  )
  var l4 = ee.ImageCollection('LANDSAT/LT04/C01/T1_SR')
    .merge(ee.ImageCollection('LANDSAT/LT04/C01/T2_SR'))
    .filter(filter)
    .select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'pixel_qa'], 
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pixel_qa']
    )
  var l5 = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .merge(ee.ImageCollection('LANDSAT/LT05/C01/T2_SR'))
    .filter(filter)
    .select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'pixel_qa'], 
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pixel_qa']
    )
  var l7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .merge(ee.ImageCollection('LANDSAT/LE07/C01/T2_SR'))
    .filter(filter)
    .select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'pixel_qa'], 
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pixel_qa']
    )
  var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .merge(ee.ImageCollection('LANDSAT/LC08/C01/T2_SR'))
    .filter(filter)
    .select(
      ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'pixel_qa'], 
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pixel_qa']
    )

  return l4.merge(l5).merge(l7).merge(l8)
    .map(mapImage)
    .sort('system:time_start')
  
  function mapImage(image) {
    return excludeBand('pixel_qa',
      mask(
        params.mapImage(image)
      ).clip(params.region)
    )
  }
  
  function mask(image) {
    var free = image.select('pixel_qa').bitwiseAnd(2)
    var water = image.select('pixel_qa').bitwiseAnd(4)
    return image
      .updateMask(free.or(water))
  }
  
  function excludeBand(bandName, image) {
    var bandNames = image.bandNames()
    var bandIndexes = ee.List.sequence(0, bandNames.size().subtract(1))
      .filter(
        ee.Filter.neq('item', bandNames.indexOf(bandName))
      )
    return image.select(bandIndexes)
  }

  function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()
  
    if (month.length < 2) 
        month = '0' + month
    if (day.length < 2) 
        day = '0' + day
  
    return [year, month, day].join('-')
  }

  function mergeObjects(objects) {
    return objects.reduce(function (acc, o) {
      for (var a in o) { acc[a] = o[a] }
      return acc
      }, {})
  }
}


function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

var dataset = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
                  .filterDate('2020-12-31', '2021-12-31')
                  .map(maskL8sr);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.addLayer(dataset.median(), visParams, 'Surface Reflectance');
Map.addLayer(iburi,{},'inventories')


//Cloud_score
var testPoint =ee.Geometry.Point([141.891171, 42.755315])
var imageColl = createLandsatCollection({
    region: testPoint,
    start: '1982-01-01',
    end: '2023-01-01', 
    mapImage: function(image) { return image.addBands(toNDVI(image)) }
  })


var getCloudScores = function(image)
{
    //Get the cloud cover
    var value = image.get('CLOUD_COVER');
    return ee.Feature(null, {'score': value});
};

var results = imageColl.map(getCloudScores);

print(Chart.feature.byFeature(results))
