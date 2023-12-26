/* 面转线 */
export const changeLine = (polygonJson) => {
  function flatten(array) {
    return [].concat.apply([], array);
  }
  function polygonToLineString(coordinates, properties) {
    return coordinates.map(function (coordinates) {
      return turf.lineString(coordinates, properties);
    });
  }
  function multiPolygonToLineString(coordinates, properties) {
    return flatten(
      coordinates.map(function (coordinates) {
        return polygonToLineString(coordinates, properties);
      })
    );
  }
  function toLineString(feature) {
    var geometry = feature.geometry,
      properties = feature.properties;
    switch (geometry.type) {
      case "Polygon":
        return polygonToLineString(geometry.coordinates, properties);
      case "MultiPolygon":
        return multiPolygonToLineString(geometry.coordinates, properties);
      default:
        return feature;
    }
  }
  function polygon2line(geojson) {
    var features = geojson.features.map(toLineString);
    return turf.featureCollection(flatten(features));
  }

  const json = polygon2line(polygonJson);
  return json;
};

/* 线转面 */
export const changePolygon = (lineJson) => {
  function lineStringToPolygon(coordinates, properties) {
    return [coordinates].map(function (coordinates) {
      return turf.polygon([[...coordinates, coordinates[0]]], properties);
    });
  }
  // 暂未测试
  // function multiLineStringToPolygon(coordinates, properties) {
  //   return flatten(
  //     [coordinates].map(function (coordinates) {
  //       return lineStringToPolygon([[...coordinates, coordinates[0]]], properties);
  //     })
  //   );
  // }
  function toPolygon(feature) {
    var geometry = feature.geometry,
      properties = feature.properties;

    switch (geometry.type) {
      case "LineString":
        return lineStringToPolygon(geometry.coordinates, properties);
      // case "MultiLineString":
      //   return multiLineStringToPolygon(geometry.coordinates, properties);
      default:
        return feature;
    }
  }
  function flatten(array) {
    return [].concat.apply([], array);
  }
  function line2polygon(geojson) {
    var features = geojson.features.map(toPolygon);
    return turf.featureCollection(flatten(features));
  }

  const json = line2polygon(lineJson);
  return json;
};
