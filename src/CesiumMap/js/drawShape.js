/*
 * @Description: 绘制 圆/矩形/多边形 三种方法合并
 * @Version: 2.0
 * @Author: ljh
 * @Date: 2023-12-26 16:28:03
 * @LastEditTime: 2023-12-26 17:27:50
 */

import { returnCesiumResource } from "@/utils/common.js";
import { ElMessage } from "element-plus";
import { computed, ref } from "vue";
// import { drawEntity, getResourceById } from '@/api'



export const useDrawShape = () => {
  const { cesiumMap, viewer } = returnCesiumResource();
  const entities = viewer.entities;
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  //   const showDialog = ref(true); // 弹窗展示

  let activeShapePoints = [];
  let activeShape = undefined;
  let floatingPoint; // 左键点击的点位
  let pointsList = []; // 移动点位的集合
  let shapList = []; // 圈选的点位

  /* 最终绘制数据 */
  let result = { radius: null, coordinateList: [] };
  let resultData = ref([])

  const draw = (type) => {
    // 左键
    handler.setInputAction((movement) => {
      let earthPosition = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      console.log(earthPosition, "earthPosition-------------------------");

      // 如果在球面上
      if (Cesium.defined(earthPosition)) {
        if (activeShapePoints.length === 0) {
          floatingPoint = createPoint(earthPosition);
          activeShapePoints.push(earthPosition);
          let dynamicPositions = new Cesium.CallbackProperty(() => {
            return type === 2
              ? new Cesium.PolygonHierarchy(activeShapePoints)
              : activeShapePoints;
          }, false);
          activeShape = drawShape(dynamicPositions, type);
        }
        activeShapePoints.push(earthPosition);
        createPoint(earthPosition);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 移动鼠标
    handler.setInputAction((movement) => {
      // 如果在球面上
      if (Cesium.defined(floatingPoint)) {
        let newPosition = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
        );
        if (Cesium.defined(newPosition)) {
          floatingPoint.position.setValue(newPosition);
          activeShapePoints.pop();
          activeShapePoints.push(newPosition);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标右键
    handler.setInputAction(async () => {
      window.oncontextmenu = (e) => e.preventDefault();
      console.log(pointsList, "点集合数据------------------");
      if (type === 1 && pointsList.length <= 2) {
        return ElMessage.warning("绘制矩形请先选择两个点位");
      } else if (type === 2 && pointsList.length <= 3) {
        return ElMessage.warning("绘制多边形请至少选择三个点位");
      }
      //       showDialog.value = true;
      terminateShape(type);
      if (handler) {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      }
      ElMessage.info("绘画结束");

      resultData.value = await returnPoint(type)
      console.log(resultData.value, '资源搜索返回的resultData----------------------');
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  // 创建点
  const createPoint = (position) => {
    const point = entities.add({
      position,
      point: {
        color: Cesium.Color.RED,
        pixelSize: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    pointsList.push(point);
    console.log(pointsList, "所有点位集合----------------------");
    return point;
  };

  // 画圆形或矩形或多边形
  const drawShape = (positionData, type) => {
    let shape;
    let arr =
      typeof positionData.getValue === "function"
        ? positionData.getValue(0)
        : positionData;
    console.log(positionData, "绘制时的positionData--------------------");
    console.log(arr, "绘制时的arr--------------------");
    if (type === 0) { // 圆形
      const callBackPos = (arr) => {
        result.radius = Math.sqrt(
          Math.pow(arr[0].x - arr[arr.length - 1].x, 2) +
          Math.pow(arr[0].y - arr[arr.length - 1].y, 2)
        );
        return result.radius ? result.radius : result.radius + 1;
      };
      shape = entities.add({
        name: '应急指挥绘制圈',
        position: activeShapePoints[0],
        ellipse: { //半径 两点间距离
          semiMinorAxis: new Cesium.CallbackProperty(() => callBackPos(arr), false),
          semiMajorAxis: new Cesium.CallbackProperty(() => callBackPos(arr), false),
          material: Cesium.Color.WHITE.withAlpha(0.5),
        },
      });
      result.coordinateList = callBack([{ ...arr[0] }]);
      console.log(result, "圆形---------------------");
      shapList = [...shapList, shape]
      console.log(shapList, "shapList--------------------");
    } else if (type === 1) { // 矩形
      shape = entities.add({
        name: '应急指挥绘制圈',
        rectangle: {
          coordinates: new Cesium.CallbackProperty(() => Cesium.Rectangle.fromCartesianArray(arr), false),
          outline: true,
          outlineColor: Cesium.Color.RED,
          material: Cesium.Color.WHITE.withAlpha(0.5),
        },
      });
      result.coordinateList = callBack(arr);
      console.log(result, "矩形-------------------------------");
      shapList = [...shapList, shape]
      console.log(shapList, "shapList--------------------");
    } else if (type === 2) { // 多边形
      shape = entities.add({
        name: '应急指挥绘制圈',
        polygon: {
          hierarchy: positionData,
          material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.5)),
        },
      });
      result.coordinateList = callBack(arr);
      console.log(result, "多边形-------------------------------");
      shapList = [...shapList, shape]
      console.log(shapList, "shapList--------------------");
    }
    return shape;
  };

  // 终止画圆形或矩形
  const terminateShape = (type) => {
    console.group("终止画圆形或矩形-----------------------------");
    console.log(activeShapePoints, "activeShapePoints");
    if (type !== 0) activeShapePoints.pop();
    drawShape(activeShapePoints, type);

    console.log(floatingPoint, "floatingPoint");
    cesiumMap.clearEntity(floatingPoint._id);
    entities.remove(activeShape._id);
    console.log(activeShape, "activeShape");
    cesiumMap.clearEntity(activeShape.id);

    floatingPoint = undefined;
    activeShape = undefined;
    activeShapePoints = [];
  };

  // 清除所有Entity和ImageryLayers
  const clearHandle = () => {
    //移除所有实体Entity
    let arr = pointsList.map((v) => v.id);
    let shapListArr = shapList.map((v) => v._id);
    let entitiesArr = entities.values.map((v) => v._id);
    console.log(arr, '所有实体Entity---------------');
    console.log(shapListArr, "shapList--------------------");
    console.log(entities.values, '所有entities集合数据');
    [...arr, ...shapListArr].forEach(v => {
      if (entitiesArr.includes(v)) cesiumMap.clearEntity(v);
    })
    shapList = [];
    pointsList = [];

    //     showDialog.value = false;
  };

  // 笛卡尔坐标系转WGS84坐标系
  const Cartesian3_to_WGS84 = (point) => {
    var cartesian33 = new Cesium.Cartesian3(point.x, point.y, point.z);
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian33);
    var longitude = Cesium.Math.toDegrees(cartographic.longitude);
    var latitude = Cesium.Math.toDegrees(cartographic.latitude);
    var altitude = cartographic.height;
    return { longitude, latitude, altitude };
  };

  // 获取点位
  const callBack = (positions) => {
    var wgs84_positions = [];
    for (var i = 0; i < positions.length; i++) {
      var wgs84_point = Cartesian3_to_WGS84({
        x: positions[i].x,
        y: positions[i].y,
        z: positions[i].z,
      });
      console.log(wgs84_point, "wgs84_point");
      wgs84_positions.push(wgs84_point);
    }
    return wgs84_positions;
  };

  const returnPoint = async (type) => {
    if (type === 1) {
      let drawArr = result.coordinateList;
      let point1 = { altitude: drawArr[0]['altitude'], latitude: drawArr[0]['latitude'], longitude: drawArr[1]['longitude'] }
      let point2 = { altitude: drawArr[1]['altitude'], latitude: drawArr[1]['latitude'], longitude: drawArr[0]['longitude'] }
      result.coordinateList = [drawArr[0], point1, drawArr[1], point2];
    }
    console.log(result, 'return了 点位数据集合----------------------');
    // const res = await drawEntity({ selectType: type, ...result })
    // console.group(res.data, '获取了结果数据-----------------');
    // if (res.code !== '00000') return
    // const resourceResult = await getResourceById({ uuid: res.data, typeList: [0, 1, 2] })
    // console.log(resourceResult, '资源结果数据------------------------');
    // return resourceResult.data;
  }

  const data = computed(() => resultData.value)

  return { draw, clearHandle, data };
};
