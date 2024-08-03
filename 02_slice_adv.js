// Shows how you can load an exported CCDC asset and apply the coefficients to create an
// Image for any point in time.

var temporalSegmentation = require('users/aufaristama/CCDC_LS:API/temporalSegmentation2') // Load module

var segmentsImage = ee.Image('projects/ee-aufaristama/assets/segments_hokkaido_chi099') // Load CCDC asset
Map.centerObject(segmentsImage)

var segments = temporalSegmentation.Segments(segmentsImage) // Create temporal segments

 // Find segment closest to provided date. Second argument is the strategy to use when there isn't a segment for the date
 // Strategies:
 // mask (default) - Mask out image at pixels without segment
 // closest - Picks segment closest to date
 // previous - Picks first segment before date
 // next - Picks first segment after date
var segment = segments.findByDate('2019-01-01', 'closest')


var slice = segment.slice({ // Use the selected segment's model to evaluate value at the specified date
  date: '2019-01-01', // The date to evaluate. Defaults to date provided with finding segment.
  harmonics: 3, // The number of harmonics from the model to use. Defaults to all 3. 0 would only use the model's linear components.
  extrapolateMaxDays: 0 // The max number of days before/after a segment a slice will be provided for. Defaults to 0
})
var sliceDefault = segment.slice() // Slice with defaults. Should like exactly like the above image.
var sliceStart = segment.startSlice(3) // Slice from start of the segment using three harmonics (default)
var sliceMiddle = segment.middleSlice(3) // Slice from the middle of the segment using three harmonics (default)
var sliceEnd = segment.endSlice(3) // Slice from the end of the segment using three harmonics (default)
var sliceT = segment.slice({
  t: segment.toImage('tStart') // Specify an ee.Image of t instead of date
})
var extrapolate = segment.slice({
  extrapolateMaxFraction: 0.25 // The max fraction of the segment length to extrapolate a value outside of segment.
})
var interpolate = segments.interpolate('2019-01-01', 3) // Interpolate between previous/next segment
var mean = segment.mean(3) // Calculate mean of 3rd order hamonic model


var visParams =  {bands: 'swir2,nir,red', min: [0, 500, 200], max: [1800, 6000, 3500]}

Map.addLayer(slice, visParams, 'Slice')
Map.addLayer(sliceDefault, visParams, 'Slice with default options')
Map.addLayer(sliceStart, visParams, 'Slice start of segment')
Map.addLayer(sliceMiddle, visParams, 'Slice middle of segment')
Map.addLayer(sliceEnd, visParams, 'Slice end of segment')
Map.addLayer(sliceT, visParams, 'Slice t')
Map.addLayer(extrapolate, visParams, 'Extrapolate')
Map.addLayer(interpolate, visParams, 'Interpolate')
Map.addLayer(mean, visParams, 'Segment mean')
