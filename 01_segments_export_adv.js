// Creates an ImageCollection of Landsat scenes, runs CCDC, then exports the results.

// Update the collection creation code and CCDC configuration to what you used when
// inspecting individual pixels. Then run the script and finally the task.

var temporalSegmentation = require('users/aufaristama/CCDC_LS:API/temporalSegmentation')

Map.centerObject(ee.Geometry.Point([141.94511, 42.7708]), 12) //Hokkaido
//Map.centerObject(ee.Geometry.Point([73.439843, 34.403605]), 12) //Khasmir

var region = geometry

var collection = createLandsatCollection({
  region: region,
  start: '1984-01-01',
  end: '2020-01-01', 
  mapImage: function(image) { return image.addBands(toNDVI(image)) },
})

var ccdc = ee.Algorithms.TemporalSegmentation.Ccdc({
  collection: collection,
  minObservations: 3,
  breakpointBands: ['ndvi'],
  chiSquareProbability: 0.95
})

var segments = temporalSegmentation.Segments(ccdc)

// Export as asset. Include same options as for regular exports.
// Skip the image and pyramidingPolicy though, which gets defaulted.
segments.toAsset({
  description: 'segments_hokkaido_chi095',
  region: region,
  scale: 30,
  crs: 'EPSG:4326'
})


/////////////////////////////////////////////////////////
// Generic utility functions to create ImageCollection //
/////////////////////////////////////////////////////////
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

var dataset = ee.ImageCollection('LANDSAT/LE07/C01/T2_SR')
                  .filterDate('2005-01-01', '2005-12-31')
                  .map(maskL8sr);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.addLayer(dataset.mean(), visParams, 'Surface Reflectance');
Map.addLayer(iburi,{},'inventories')
