var DEM = ee.Image("USGS/SRTMGL1_003")
var JRC = ee.Image("JRC/GSW1_3/GlobalSurfaceWater")
//

  var terrain = ee.Terrain.products(DEM.select('elevation'))
  var slope = terrain.select('slope')     

//Create function to mask water from the image

  var water_mask = JRC.select(['max_extent']).lt(1)


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
                  .filterDate('2019-01-01', '2020-12-31')
                  .map(maskL8sr);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

Map.addLayer(terrain, {bands: ['hillshade']}, 'hillshade',1);

Map.addLayer(dataset.mean(), visParams, 'Surface Reflectance');

var temporalSegmentation = require('users/aufaristama/CCDC_LS:API/temporalSegmentation') // Load module

var segmentsImage = ee.Image('projects/ee-aufaristama/assets/segments_hokkaido_chi095') // Load CCDC asset
Map.centerObject(segmentsImage,12)

var segments = temporalSegmentation.Segments(segmentsImage, 0, 10) // Create temporal segments


    
var largestLossSegmentImage = segments.find()
  .min('ndvi_magnitude') // Pick the segment with the smallest value in ndvi_magnitude
  .toImage().updateMask(slope.gt(10)).updateMask(water_mask) // Turn segment into image


var firstBreakSegment = segments.find()
  .updateMask('i.tBreak > 0')// Exclude segments without a break
  .first() // Pick the first segment that is left
 
  
var maxDurationSegment = segments.find()
  .addBands('i.tEnd - i.tStart', 'duration') // Add a band to the segments, named 'duration'
  .max('duration') // Picks the segment with the max value in the 'duration' band

var longestDurationPositiveTrendSegment = segments.find()
  .addBands('i.tEnd - i.tStart', 'duration')
  .updateMask(function (segment, image) { 
    var ndviCoefs = segment.coefs('ndvi') // Get an image of the coefs for the 'ndvi' band
    return ndviCoefs.select(1).gt(0) // Include only segments where the trend > 0
  })
  .max('duration')
 
var highestAmplitudeSegment = segments.find()
  .addBands(function (segment) { 
    return segment.amplitude() // Calculate the 1st order harmonic amplitude
      .select('ndvi_amplitude_1')
  })
  .updateMask('i.ndvi_magnitude < 0')
  .max('ndvi_amplitude_1')

var lastSegmentImage = segments.find()
  .last() // Finds the last segment
  .toImage('tStart').updateMask(slope.gt(10)).updateMask(water_mask).updateMask(highestAmplitudeSegment.toImage('ndvi_amplitude_1')) // Select the tStart band when turning segment into image

Map.addLayer(largestLossSegmentImage, {
  bands: 'tBreak',
  min: segments.toT('1990-01-01'),
  max: segments.toT('2020-11-01'),
  palette: 'violet,indigo,blue,green,yellow,orange,red'
}, 'Date of largest loss')

Map.addLayer(lastSegmentImage, {
  min: segments.toT('1990-01-01'),
  max: segments.toT('2020-11-01'),
  palette: 'violet,indigo,blue,green,yellow,orange,red'
}, 'Start date of last segment')

Map.addLayer(firstBreakSegment.toImage('tBreak').updateMask(slope.gt(10)).updateMask(water_mask).updateMask(highestAmplitudeSegment.toImage('ndvi_amplitude_1')) , {
  min: segments.toT('1990-01-01'),
  max: segments.toT('2020-11-01'),
  palette: 'violet,indigo,blue,green,yellow,orange,red'
}, 'Date of first break')

Map.addLayer(maxDurationSegment.toImage('duration').updateMask(slope.gt(10)).updateMask(water_mask) , {
  min: 800,
  max: 13000,
  palette: 'violet,indigo,blue,green,yellow,orange,red'
}, 'Duration of longest segment')
   
Map.addLayer(longestDurationPositiveTrendSegment.toImage('duration').updateMask(slope.gt(10)).updateMask(water_mask) , {
  min: 800,
  max: 13000,
  palette: 'violet,indigo,blue,green,yellow,orange,red'
}, 'Duration of longest segment with positive trend')

Map.addLayer(highestAmplitudeSegment.toImage('ndvi_amplitude_1').updateMask(slope.gt(10)).updateMask(water_mask) , {
  min: 0, 
  max: 5000,
  palette: 'blue,green,yellow,orange,red'
}, 'Highest amplitude of segment with loss')


Map.addLayer(iburi,{},'inventories')

// Export the image, specifying the CRS, transform, and region.
/*
 Export.image.toDrive({
  image: highestAmplitudeSegment.toImage('ndvi_amplitude_1'),
  description: 'lowestNDVI_hokkaido_chi099',
  folder: 'CCDC',
  scale: 30,
  region: segmentsImage
});

Export.image.toDrive({
  image: firstBreakSegment.toImage('tBreak'),
  description: 'firstBreak_hokkaido_chi099',
  folder: 'CCDC',
  scale: 30,
  region: segmentsImage
});
*/

Export.image.toDrive({
  image: lastSegmentImage,
  description: 'lastBreak_low_ndvi_hokkaido_chi095',
  folder: 'CCDC',
  scale: 30,
  region: segmentsImage
});
Export.image.toDrive({
  image: firstBreakSegment.toImage('tBreak').updateMask(water_mask).updateMask(highestAmplitudeSegment.toImage('ndvi_amplitude_1')),
  description: 'firstBreak_low_ndvi_hokkaido_chi095',
  folder: 'CCDC',
  scale: 30,
  region: segmentsImage
});

//time series

Map.style().set('cursor', 'crosshair')
Map.onClick(chartPoint)
Map.setOptions('HYBRID')

function chartPoint(latLon) {
  var point = ee.Geometry.Point([latLon.lon, latLon.lat])
  
  var collection = createLandsatCollection({
    region: point,
    start: '1982-01-01',
    end: '2020-01-01', 
    mapImage: function(image) { return image.addBands(toNDVI(image)) }
  })

  var ccdc = ee.Algorithms.TemporalSegmentation.Ccdc({
    collection: collection,
    minObservations: 3,
    breakpointBands: ["ndvi"],
    chiSquareProbability: 0.95
  })

  temporalSegmentation.chartPoint({
    image: ccdc,
    point: point,
    bandName: 'ndvi',
    // If don't plot the raw collection, this will be faster.
    collection: collection,
    callback: function (chart) {
    print(chart)
    
    
    chart.onClick(function(xValue, yValue, seriesName) {
    if (!xValue) return;  // Selection was cleared.
    // Show the image for the clicked date.
    var equalDate = ee.Filter.equals('system:time_start', xValue);
    var collectionshow = ee.Image(collection.filter(equalDate).first());

   // Map.addLayer
   Map.addLayer(collectionshow, {min: 0, max: 10000}, 'image');
    // Show a label with the date on the map.
    var label = ui.Label('Click a point on the chart to show the image for that date.');
    Map.add(label);
    label.setValue((new Date(xValue)).toUTCString()); });
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

//Cloud_score
var testPoint =ee.Geometry.Point([141.93764, 42.68888])
var imageColl = createLandsatCollection({
    region: testPoint,
    start: '1982-01-01',
    end: '2020-01-01', 
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
