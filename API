var temporalSegmentation = {
  Segments: Segments,
  Segment: Segment,
  Classification: Classification,
  chartPoint: chartPoint
};

/**
 * Wraps a CCDC segments image to simplify analysis.
 * 
 * @param {ee.Image} segmentsImage - An ee.Image returned by ee.Algorithms.TemporalSegmentation.Ccdc()
 * @param {number} dateFormat - The date format used in the segmentsImage (0 = jDays, 1 = fractional years, 2 = unix time in milliseconds)
 * @param {number} maxSegments - The maximum number of segments to allow for a pixel.
 */
function Segments(segmentsImage, dateFormat = 0, maxSegments = 50) {
  return {
    dateRange: function (fromDate, toDate) {},
    filterDate: function (fromDate, toDate) {},
    transitions: function () {},
    find: function () {},
    findByDate: function (date, strategy = 'mask') {},
    first: function () {},
    last: function () {},
    min: function (bandName) {},
    max: function (bandName) {},
    interpolate: function (date, harmonics = 3) {},
    sample: function (features, mapSegment, scale) {},
    classify: function (classifier, mapSegment, bandName = 'type') {},
    count: function () {},
    toImage: function (selector) {},
    toCollection: function () {},
    toAsset: function (exportArgs) {},
    dateFormat: function () {},
    toT: function (date) {},
    fromT: function (t) {},
    combinePairwise: function (image, algorithm, suffix) {}
  };
}

/**
 * Wraps a single CCDC segment image to simplify analysis.
 * 
 * @param {ee.Image} segmentImage - An axis-0 slice of the ee.Image returned by ee.Algorithms.TemporalSegmentation.Ccdc()
 * @param {number} dateFormat - The date format used in the segmentsImage (0 = jDays, 1 = fractional years, 2 = unix time in milliseconds)
 * @param {ee.Date|Date|number} defaultDate - Date to use when creating a slice from the segment and not specifying a date.
 */
function Segment(segmentImage, dateFormat, defaultDate) {
  return {
    slice: function (options) {},
    fit: function (options) {},
    startSlice: function (harmonics = 3) {},
    startFit: function (harmonics = 3) {},
    middleSlice: function (harmonics = 3) {},
    middleFit: function (harmonics = 3) {},
    endSlice: function (harmonics = 3) {},
    endFit: function (harmonics = 3) {},
    mean: function (harmonics = 3) {},
    coefs: function (bandName) {},
    intercept: function () {},
    slope: function () {},
    phase: function (harmonic = 1) {},
    amplitude: function (harmonic = 1) {},
    toImage: function (selector) {},
    dateFormat: function () {},
    toT: function (date) {},
    fromT: function (t) {}
  };
}

/**
 * The classification of a Segments instance.
 * 
 * @param {ee.Image} classificationsImage - An array image with segment types.
 * @param {Segments} segments - The Segments instance that was classified.
 * 
 * @returns {Segments} - A Segments instance with an additional 'type' band for each segment.
 */
function Classification(classificationsImage, segments) {
  return Segments(classificationsImage, segments.dateFormat(), segments.maxSegments);
}

/**
 * An intermediate object used to get data on a date range.
 */
function DateRange() {
  return {
    mean: function (harmonics = 3) {},
    pickBreakpoint: function (options) {}
  };
}

/**
 * An intermediate object used to find a specific segment.
 */
function Find() {
  return {
    addBands: function (expressionOrCallback, rename, overwrite) {},
    updateMask: function (expressionOrCallback, expressionArgs) {},
    first: function () {},
    last: function () {},
    min: function (bandName) {},
    max: function (bandName) {}
  };
}

/**
 * Prints a chart of the segment models and optionally raw pixel values, to the console, for a point.
 * 
 * @param {object} options - An object containing the options.
 * @param {ee.Image} options.image - The ee.Algorithms.TemporalSegmentation.Ccdc image to extract the models from.
 * @param {ee.Geometry} options.point - The ee.Geometry to extract the models and raw pixel values from.
 * @param {string} options.bandName - The band name to use.
 * @param {ee.ImageCollection} [options.collection] - The ee.ImageCollection containing the raw time-series.
 * @param {function} [options.callback] - Function receiving the chart. If unspecified, chart is simply printed.
 */
function chartPoint(options) {}
