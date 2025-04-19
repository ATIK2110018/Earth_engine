var rajshahi = ee.FeatureCollection("FAO/GAUL/2015/level1")
  .filter(ee.Filter.eq('ADM1_NAME', 'Rajshahi'));

function maskL8toa(image) {
  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 1)
                .or(qa.bitwiseAnd(1 << 3))
                .or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(cloud.not());
}

var primary = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA")
  .filterBounds(rajshahi)
  .filterDate('2014-06-01', '2014-07-30')
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .map(maskL8toa);

var backup = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA")
  .filterBounds(rajshahi)
  .filterDate('2014-05-01', '2014-08-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 40))
  .map(maskL8toa);

var primaryImage = primary.median();
var backupImage = backup.median();
var filled = primaryImage.unmask(backupImage).clip(rajshahi);

var ndvi = filled.normalizedDifference(['B5', 'B4']).rename('NDVI');
var ndwi = filled.normalizedDifference(['B3', 'B5']).rename('NDWI');
var thermal = filled.select('B10').multiply(0.1).subtract(273.15).rename('LST');

Map.centerObject(rajshahi, 8);
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI');
Map.addLayer(ndwi, {min: -1, max: 1, palette: ['brown', 'white', 'blue']}, 'NDWI');
Map.addLayer(thermal, {min: 20, max: 45, palette: ['blue', 'green', 'yellow', 'red']}, 'LST');

Export.image.toDrive({
  image: ndvi,
  description: 'Rajshahi_NDVI_2014_TOA_CloudFilled',
  folder: 'GEE',
  fileNamePrefix: 'Rajshahi_NDVI_2014_TOA_CloudFilled',
  region: rajshahi.geometry(),
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndwi,
  description: 'Rajshahi_NDWI_2014_TOA_CloudFilled',
  folder: 'GEE',
  fileNamePrefix: 'Rajshahi_NDWI_2014_TOA_CloudFilled',
  region: rajshahi.geometry(),
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: thermal,
  description: 'Rajshahi_LST_2014_TOA_CloudFilled',
  folder: 'GEE',
  fileNamePrefix: 'Rajshahi_LST_2014_TOA_CloudFilled',
  region: rajshahi.geometry(),
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
