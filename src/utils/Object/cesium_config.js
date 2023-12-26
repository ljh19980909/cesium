/* tool */
import { wgs84togcj02 } from "@/utils/transform.js";
class CesiumObj {
    constructor(models, polygonJson) {
        this.viewer = null
        this.models = models
        this.handler = null

        // 对应的json
        this.polygonJson = polygonJson // 覆盖面对应json
    }

    init(token, id) {
        // 获取token
        Cesium.Ion.defaultAccessToken = token;
        // 视图容器 （https://blog.csdn.net/happyduoduo1/article/details/51865758?spm=1001.2014.3001.5502）
        this.viewer = new Cesium.Viewer(id, {
            animation: false, // 如果设置为false，将不会创建 左下角动画 小部件
            baseLayerPicker: false, // 如果设置为false，将不会创建 右上角图层 按钮
            fullscreenButton: false, // 如果设置为false，将不会创建 右下角全屏 按钮
            vrButton: false, // 设置为false，将不会创建 右下角vrButton 按钮
            geocoder: false, // 如果设置为false，将不会创建 右上角查询(放大镜) 按钮
            homeButton: false, // 如果设置为false，将不会创建 右上角主页(房子) 按钮
            infoBox: false, // 是否显示点击要素之后显示的信息
            sceneModePicker: false, // 如果设置为false，将不会创建 右上角投影方式控件(显示二三维切换按钮)
            selectionIndicator: false, // 是否显示选取指示器组件 (绿色的类似锁定图标)
            timeline: false, // 如果设置为false，则不会创建 正下方时间轴小部件
            navigationHelpButton: false, // 如果设置为false，则不会创建右上角帮助(问号)按钮
            // navigationInstructionsInitiallyVisible: false, // 可选如果导航说明最初应该是可见的，则为true；如果直到用户明确单击该按钮，则不显示该说明，否则为false
            scene3DOnly: true, // 为 true 时，每个几何实例将仅以3D渲染以节省GPU内存
            // clock : new Cesium.Clock(), // 用于控制当前时间的时钟对象
            shouldAnimate: false, // 可选如果默认情况下时钟应尝试延长仿真时间，则为 true ，否则为 false 。此选项优先于设置 Viewer＃clockViewModel
            //  ps. Viewer＃clockViewModel 是用于控制当前时间的时钟视图模型。我们这里用不到时钟，就把shouldAnimate设为false

            fullscreenElement: document.body, // 全屏时渲染的HTML元素 暂时没发现用处，虽然我关闭了全屏按钮，但是键盘按F11 浏览器也还是会进入全屏
            skyBox: false, // 可选用来渲染星星的天空盒
            sceneMode: 3, // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
            requestRenderMode: false, // 可选如果为true，则仅根据场景中的更改确定是否需要渲染帧。启用可减少应用程序的CPU/GPU使用率，并减少移动设备上的电池消耗，但需要使用 '> Scene＃requestRender 来呈现新的在此模式下显式帧。在API的其他部分对场景进行更改之后，在许多情况下这是必要的。请参见 通过显式渲染提高性能 。
            // [使用的图像提供者]使用高德影像地形地图, 仅当options.baseLayerPicker设置为false时，此值才有效
            // imageryProvider: new Cesium.UrlTemplateImageryProvider({
            //   url: 'https://gac-geo.googlecnapps.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}'
            // }),
            // 要使用的地形提供商
            // terrainProvider: new Cesium.CesiumTerrainProvider({
            //   url: "http://data.marsgis.cn/terrain"
            // }),
            showRenderLoopErrors: true, // 如果为true，则在发生渲染循环错误时，此小部件将自动向包含错误的用户显示HTML面板
        })

        // 隐藏版权
        this.viewer._cesiumWidget._creditContainer.style.display = "none";

        // 双击左键清除默认事件
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
        );

        // 底图加载
        this.loadLayer();
        this.changeLayer(0.0);
        // 禁止相机入地【暂时不需要变更】
        this.stopCameraToRoad();
        // 设置相机
        this.setCamera();
        // 加载模型
        // this.loadModel();
    }

    // 球体旋转
    rotateEarth() {
        const onTickCallback = () => {
            const spinRate = 0.5;
            const currentTime = this.viewer.clock.currentTime.secondsOfDay;
            const delta = (currentTime - previousTime) / 1000;
            previousTime = currentTime;
            this.viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate * delta);
        };
        this.viewer.clock.onTick.addEventListener(onTickCallback); // 开启
        // this.viewer.clock.onTick.removeEventListener(onTickCallback) // 关闭
    }

    // 加载底图
    loadLayer() {
        // 添加底图,在 imageryLayers 可以添加过多图层 以便于后续控制其显示隐藏
        const layer2 = new Cesium.UrlTemplateImageryProvider({
            url:
                "http://10.39.255.68:9001/bigemap.djzshce8/tiles/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY3VzXzd2cHgyOTlzIiwiYSI6IjNsdWp3bnd2dWM3aHNiaTQxMDU0dnh5dmciLCJ0Ijo0fQ.zUGgqJFI5CQfDRtfnD2_tG2RIVnxie0Ddg2YAbzucig",
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
        });
        this.viewer.imageryLayers.addImageryProvider(layer2);
        // this.viewer.imageryLayers._layers 第一个为默认底图,第二个为添加底图
        // console.log(this.viewer.imageryLayers._layers, 'this.viewer.imageryLayers._layers');
        // 控制 该图层是否显示隐藏
        // this.viewer.imageryLayers._layers[1]['show'] = false

        // 控制图层底色颜色
        // this.viewer.imageryLayers._layers.forEach(v => v.alpha = 0.0);
        // 设置地球球体颜色
        // this.viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
        this.viewer.scene.globe.baseColor = Cesium.Color.BLACK.withAlpha(0);
    }

    // 底图改变
    changeLayer(num) {
        // 0 透明
        this.viewer.imageryLayers._layers.forEach((layer) => {
            layer.alpha = num;
        });
    }

    // 用于点击列表修改中心点
    changeCenter(obj, func) {
        let center = {
            destination: Cesium.Cartesian3.fromDegrees(obj?.lng, obj?.lat, obj?.height),
            orientation: {
                // 地球旋转的方向
                // 正数表示顺时针旋转（由于相对运动，在浏览器上看起来是地球在逆时针旋转），可以参考理解（人面向北面，摇头heading、点头pitch、歪头roll）
                heading: obj?.heading, // 绕垂直于地心的轴旋转
                pitch: obj?.pitch, // 绕纬度线旋转
                roll: obj?.roll, // 绕经度线旋转
            },
            duration: obj?.duration,
            complete: () => {
                // 飞行结束后执行的是回调
                func ? this[func]() : (() => { })();
            },
        };
        this.viewer.camera.flyTo(center);
    }

    // 设置摄像机
    setCamera() {
        // 形状大小
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(90, -20, 110, 90);
    }

    // 禁止相机入地【暂时不需要变更】
    stopCameraToRoad() {

        const minPitch = -Cesium.Math.PI_OVER_TWO;
        const maxPitch = 0;
        const minHeight = 1000;
        this.viewer.camera.changed.addEventListener(() => {
            if (
                this.viewer.camera._suspendTerrainAdjustment &&
                this.viewer.scene.mode === Cesium.SceneMode.SCENE3D
            ) {
                this.viewer.camera._suspendTerrainAdjustment = false;
                this.viewer.camera._adjustHeightForTerrain();
            }
            let pitch = this.viewer.camera.pitch;
            if (pitch > maxPitch || pitch < minPitch) {
                this.viewer.scene.screenSpaceCameraController.enableTilt = false;
                if (pitch > maxPitch) {
                    pitch = maxPitch;
                } else if (pitch < minPitch) {
                    pitch = minPitch;
                }
                const destination = Cesium.Cartesian3.fromRadians(
                    this.viewer.camera.positionCartographic.longitude,
                    this.viewer.camera.positionCartographic.latitude,
                    Math.max(this.viewer.camera.positionCartographic.height, minHeight)
                );
                this.viewer.camera.setView({
                    destination: destination,
                    orientation: { pitch },
                });
                this.viewer.scene.screenSpaceCameraController.enableTilt = true;
            }
        });
    }

    // 加载模型
    loadModel() {
        let options = {
            show: true,
            skipLevelOfDetail: true,
            baseScreenSpaceError: 1024,
            maximumScreenSpaceError: 32, // 数值加大，能让最终成像变模糊
            skipScreenSpaceErrorFactor: 16,
            skipLevels: 1,
            immediatelyLoadDesiredLevelOfDetail: false,
            loadSiblings: true, // 如果为true则不会在已加载完概况房屋后，自动从中心开始超清化房屋
            cullWithChildrenBounds: true,
            cullRequestsWhileMoving: true,
            cullRequestsWhileMovingMultiplier: 10, // 值越小能够更快的剔除
            preloadWhenHidden: true,
            preferLeaves: true,
            maximumMemoryUsage: 128, // 内存分配变小有利于倾斜摄影数据回收，提升性能体验
            progressiveResolutionHeightFraction: 0.5, // 数值偏于0能够让初始加载变得模糊
            dynamicScreenSpaceErrorDensity: 0.00275, // 数值加大，能让周边加载变快
            dynamicScreenSpaceErrorFactor: 1,
            dynamicScreenSpaceError: true, // 有了这个后，会在真正的全屏加载完之后才清晰化房屋
        };
        // 改变模型高度【暂时不用变更(已调整)】
        /*
          如果一开始看到位置并无太大差距，则无需纠偏
          位置纠偏注意点：
            1.先开启地形检测，看是否在地面上方，契合地面（每一块模型的高度是否和地面契合）开始纠偏；
            2.纠偏先从小位数开始慢慢调（从小数点第六位开始或者第五位开始比较合适），然后慢慢调到正确位置
        */
        const changeHeight = (height, tileset) => {
            height = Number(height);
            if (isNaN(height)) return;
            const cartographic = Cesium.Cartographic.fromCartesian(
                tileset.boundingSphere.center
            );
            // 如果有纠偏的话，慢慢从小位调，正确位置在目前位置的 左上，那就 lng - ， lat +
            const surface = Cesium.Cartesian3.fromRadians(
                cartographic.longitude - 0.00008,
                cartographic.latitude + 0.000039,
                cartographic.height
            );
            const offset = Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                height
            );
            const translation = Cesium.Cartesian3.subtract(
                offset,
                surface,
                new Cesium.Cartesian3()
            );
            // 模型位置以及旋转角度高度设置
            tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        };
        for (let key in this.models) {
            this.models[key][
                "url"
            ] = `http://10.39.255.67:8999/rgmx/3DT-YS/${key}/tileset.json`; // 旧
            // this.models[key]['url'] = `http://10.39.255.67:8999/rgmx/XJMX/${key}/tileset.json` // 新
            // 将模型添加进 this.viewer(视图容器)
            let getModel = (model) => {
                // 需要深拷贝，不然影响原先 model 的height
                let obj = JSON.parse(JSON.stringify(model));
                delete obj["height"];
                return { ...obj, ...options };
            };
            this.viewer.scene.primitives
                .add(new Cesium.Cesium3DTileset(getModel(this.models[key])))
                .readyPromise.then((tileset) => {
                    changeHeight(this.models[key]["height"], tileset);
                });
        }
    }

    // 清除地图指定资源 dataSource
    clearDataSource(sourceName) {
        if (!this?.viewer?.dataSources?._dataSources) return;
        let findItem = this.viewer.dataSources._dataSources.find(
            (v) => v.name === sourceName
        );
        this.viewer.dataSources.remove(findItem);
    }

    // 清除地图指定底图图层
    clearLayer(num) {
        let layers = this?.viewer?.imageryLayers;
        if (!layers) return;
        if (layers.get(num)) layers.remove(layers.get(num));
    }

    // 添加geojson & 添加流光墙体
    drawLineAndWall() {
        // 添加面点击区域
        this.polygonJson.features.forEach((item) => {
            // 这里根据提供的坐标系来改变转化的坐标系
            item.geometry.coordinates[0] = item.geometry.coordinates[0].map((v) =>
                wgs84togcj02(v[0], v[1])
            );
        });
        // 加载外部json文件 需要使用 GeoJsonDataSource方法
        const promise = Cesium.GeoJsonDataSource.load(this.polygonJson);
        promise.then((data) => {
            data.name = "polygonSource";
            this.viewer.dataSources.add(data);
            const entities = data.entities.values;

            entities.forEach((entity) => {
                let colorVillage = Cesium.Color.fromCssColorString("rgba(0, 0, 0, .1)");
                entity.polygon.material = colorVillage;
                entity.polygon.outline = false;
                entity.type = "行政区划";

                const polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
                    .positions;
                let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);

                entity.position = polyCenter;
            });
        });
    }

    // 添加边界线
    addLine(json, color, type, bool, name = '线') {
        console.log(name, 'name');
        // 将 polygon 格式 转换成 lineString【如果直接是 lineString则不需要转换】
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
        let dataJson = (name === "线") ? json : polygon2line(json);
        console.log(dataJson, 'dataJson');
        dataJson.features.forEach((item) => {
            item.geometry.coordinates = item.geometry.coordinates.map((v) =>
                wgs84togcj02(v[0], v[1])
            );
        });
        // 加载外部json文件 需要使用 GeoJsonDataSource方法
        const promise = Cesium.GeoJsonDataSource.load(dataJson);
        let arr = []
        promise.then((data) => {
            data.name = "lineSource";
            this.viewer.dataSources.add(data);
            arr = data.entities.values;
            arr.forEach((entity) => {
                entity.polyline.width = 3; // 添加线宽
                entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 1, // 一个数字属性，指定发光强度，占总线宽的百分比。
                    color: Cesium.Color.fromCssColorString(color),
                    taperPower: 0.8, // 渐缩效果的强度，以总行长的百分比表示
                });
                entity.type = type;
                entity.show = bool;
            });
        });
        return new Promise((resolve) => {
            resolve(dataJson);
        });
    }

    // 添加隐藏的流光墙体
    addWall(dataJson, color) {
        dataJson.features.forEach((item) => {
            // 着色器改变颜色
            const getColorRamp = (val) => {
                if (val == null) {
                    val = {
                        0.0: "blue",
                        0.1: "cyan",
                        0.37: "lime",
                        0.54: "yellow",
                        1: "red",
                    };
                }
                var ramp = document.createElement("canvas");
                ramp.width = 1;
                ramp.height = 100;
                var ctx = ramp.getContext("2d");
                var grd = ctx.createLinearGradient(0, 0, 0, 100);
                for (var key in val) {
                    grd.addColorStop(1 - Number(key), val[key]);
                }
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, 1, 100);
                return ramp;
            };

            // var rgba = Cesium.Color.fromCssColorString('rgba(40,238,254,0.7)');
            this.viewer.entities.add({
                show: true,
                name: item.properties.name + "立体墙",
                wall: {
                    positions: Cesium.Cartesian3.fromDegreesArray(
                        item.geometry.coordinates.flat(Infinity)
                    ),
                    // 设置高度
                    maximumHeights: new Array(
                        Cesium.Cartesian3.fromDegreesArray(
                            item.geometry.coordinates.flat(Infinity)
                        ).length
                    ).fill(200),
                    minimunHeights: new Array(
                        Cesium.Cartesian3.fromDegreesArray(
                            item.geometry.coordinates.flat(Infinity)
                        ).length
                    ).fill(0),
                    // 扩散墙材质
                    // material: Cesium.Color.fromCssColorString("rgba(40,238,254,0.5)"),
                    material: new Cesium.DynamicWallMaterialProperty(
                        {
                            // color: Cesium.Color.fromBytes(55, 96, 56).withAlpha(0.7),
                            color: Cesium.Color.fromCssColorString(color),

                            duration: 3000,
                        },
                        this.viewer
                    ),
                    // material: new Cesium.ImageMaterialProperty({
                    //   transparent: false, //设置透明
                    //   image: getColorRamp({
                    //     0.0: rgba.withAlpha(1.0).toCssColorString().replace(')', ',1.0)'),
                    //     0.045: rgba.withAlpha(0.8).toCssColorString(),
                    //     0.1: rgba.withAlpha(0.6).toCssColorString(),
                    //     0.15: rgba.withAlpha(0.4).toCssColorString(),
                    //     0.37: rgba.withAlpha(0.2).toCssColorString(),
                    //     0.54: rgba.withAlpha(0.1).toCssColorString(),
                    //     1.0: rgba.withAlpha(0).toCssColorString()
                    //   })
                    // }),
                },
            });
        });
    }

    // 清除地图所有信息
    clearMap() {
        // 清空所有点位
        this.viewer.entities.removeAll();
        // 清空所有加载资源
        this.viewer.dataSources.removeAll();
    }

    // 获取天气情况
    getWeather() {
        $.ajax({
            url:
                "https://wis.qq.com/weather/common?source=pc&weather_type=observe|forecast_24h|air&province=浙江&city=嘉兴&county=桐乡",
            dataType: "jsonp",
            success: (res) => {
                console.log(res.data.observe.weather, "weather");
            },
        });
    }
}
class markPoints extends CesiumObj {
    constructor() {
        super()
    }
    // 点位拾取 & 摄像机的角度(heading,pitch,roll)
    pointPicked() {
        // 监听地图点击事件
        /*
            物体拾取方法：
              1.返回的是椭圆球体表面的一个Cartesian3坐标；适用于裸球表面的选取，是基于数学模型的椭圆球体   ellipsoid: 当前地球使用的椭球对象，this.viewer.scene。glpbe.ellipsoid（默认可省略）【世界坐标】
                this.viewer.scene.camera.pickEllipsoid(click.position, ellipsoid)
    
              2.适用于拾取有地形高程的点，但不包括模型、倾斜摄影等表面高度。【地表坐标】
              其中 ray = this.viewer.camera.getPickRay(pick.position)
                this.viewer.scene.globe.pick(ray, this.viewer.scene)
    
              3.返回一个被屏幕坐标和深度缓存指定的点；适用于模型表面位置的选取，通俗的说就是camera看过去第一个被挡住的模型（如entity）上的坐标，通常结合其他的选取方式一块用于选取模型和球上的点。【场景坐标】
                this.viewer.scene.pickPosition(click.position)
    
              4.返回 scene 中 指定位置的顶端的primitive属性的一个对象；适用于选取 3D tiles，改变 3D tiles的属性，比如颜色等
                this.viewer.scene.pick(click.position)
        */
        // 检测深度（默认 false） true: 有高程遮挡效果； false： 没有高程遮挡效果
        // this.viewer.scene.globe.depthTestAgainstTerrain = true
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((click) => {
            console.log(click.position, "click");
            // 获取点击的pick对象
            const pick = this.viewer.scene.pick(click.position);
            console.log(pick, "pick");

            if (Cesium.defined(pick)) {
                if (pick.id && pick.id instanceof Cesium.Entity) {
                    console.log(pick.id, "pick.id");
                    this.gridArr.forEach((v) => {
                        v.show = pick.id.name.includes(v.name) ? true : false;
                    });
                }
                if (pick.primitive instanceof Cesium.Primitive) {
                    // console.log(pick.primitive, "选中了Primitive");
                }
                // 暂时没有
                // if (pick.primitive instanceof Cesium.Model) {
                //   console.log("选中了模型");
                // }
                // if (pick instanceof Cesium.Cesium3DTileFeature) {
                //   console.log("选中了3DTile");
                // }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // 改变点位
    changePick(click) {
        // 获取鼠标点的对应椭球面位置
        const cartesian = this.viewer.scene.camera.pickEllipsoid(click.position);
        // console.log(cartesian, '获取鼠标点的对应椭球面位置');
        // 2.将笛卡尔坐标转换为 经纬度（弧度）坐标
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        console.log(cartographic, 'cartographic');
        // 3.弧度转为度
        const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5)
        const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5)
        console.log(lon, lat, "lon & lat");

        // 获取加载地形后对应的经纬度和高程
        const ray = this.viewer.camera.getPickRay(click.position);
        const rayPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        // console.log(rayPosition, '获取加载地形后对应的经纬度和高程');

        // 获取倾斜摄影或模型点击处的坐标
        const pickPosition = this.viewer.scene.pickPosition(click.position);
        // console.log(pickPosition, '获取倾斜摄影或模型点击处的坐标');



        // 相机坐标获取并转换
        // console.log(this.viewer.camera, 'this.viewer.camera');
        const camera = this.viewer.camera.position;
        // console.log(camera, 'camera');
        // 将笛卡尔坐标转换为 经纬度（弧度）坐标
        const cartographic2 = Cesium.Cartographic.fromCartesian(camera);
        // console.log(cartographic2, 'cartographic2');
        // 弧度转为度
        const cameraLon = Cesium.Math.toDegrees(cartographic2.longitude).toFixed(5);
        const cameraLat = Cesium.Math.toDegrees(cartographic2.latitude).toFixed(5);
        console.log(cameraLon, cameraLat, "cameraLon & cameraLat");
    }

    /*
        Cesium提供两类API
          （1）面向图形开发人员的底层API，通常称为“Primitive API”。该API暴露最小限度的抽象，使用图形学术语，具有很大的灵活性，需要具有图形学编程的知识
          （2）高级别的数据驱动的API，称为“Entity API”。该API使用一致性设计的、高级别的对象来管理一组相关性的可视化对象，其底层使用Primitive API
    */
    // 点位
    pointAdd(options = {}, item) {
        let bill = {
            ...options, // 一些基本内容之类的

            show: item.show,
            position: Cesium.Cartesian3.fromDegrees(item.lng, item.lat, item.alt),

            billboard: {
                // 设置点位的广告牌
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 获取或设置此广告牌的高度参考
                image: item.img, // 图标
                verticalOrigin: 0, // 获取或设置此广告牌的垂直原点
                width: 125,
                height: 130,
                pixelOffset: new Cesium.Cartesian2(20, -60), // 获取或设置屏幕空间中距此广告牌原点的像素偏移

                scaleByDistance: new Cesium.NearFarScalar(0, 3, 1e4, 1), // 根据广告牌与相机的距离获取或设置广告牌的近和远缩放属性
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 6e4), // 获取或设置条件，该条件指定将在距摄像机的距离显示此广告牌

                // disableDepthTestDistance 获取或设置与相机的距离
                // horizontalOrigin 获取或设置此广告牌的水平原点
                // pixelOffsetScaleByDistance 根据广告牌与摄像头的距离，获取或设置广告牌的近像素偏移量和远像素偏移量缩放属性
                // rotation	获取或设置以弧度为单位的旋转角度
                // scale	获取或设置与广告牌的图像大小（以像素为单位）相乘的统一比例
                // scaleByDistance	根据广告牌与相机的距离获取或设置广告牌的近和远缩放属性
                // show	确定是否显示此广告牌
                // sizeInMeters	获取或设置广告牌大小以米或像素为单位
                // translucencyByDistance	根据广告牌到相机的距离，获取或设置广告牌的近和远半透明属性
                // verticalOrigin	获取或设置此广告牌的垂直原点
            },
            label: {
                // 设置点位的标识
                // text: '标识', // 使用默认名称
                image: "", // 自定义图片
                // 剩余属性大致和广告牌一致
            },
        };
        this.viewer.entities.add(bill);
    }

    // 清除地图指定 entity
    clearEntity(entityId) {
        const entity = this.viewer.entities.getById(entityId);
        this.viewer.entities.remove(entity);
    }
}

class drawShapes extends markPoints {
    constructor() {
        super()

        this.pointsArr = []
    }
    drawShape() {
        // 如果存在handler,清除上一次的记录
        if (this.handler) {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // 左键点击点位
        this.handler.setInputAction((movement) => {
            // 屏幕坐标转为空间坐标
            let earthPosition = this.viewer.camera.pickEllipsoid(
                movement.position,
                this.viewer.scene.globe.ellipsoid
            );
            // 如果在球面上
            if (Cesium.defined(earthPosition)) {
                this.pointsArr.push(this.createPoint(earthPosition));
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 移动鼠标
        this.handler.setInputAction((movement) => {
            // 屏幕坐标转为空间坐标
            let cartesian = this.viewer.camera.pickEllipsoid(
                movement.endPosition,
                this.viewer.scene.globe.ellipsoid
            );
            // 如果在球面上
            if (Cesium.defined(cartesian)) {
                console.log(cartesian, "cartesian");
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 鼠标右键
        this.handler.setInputAction(() => {
            terminateShape();
            if (this.handler) {
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    // 创建点(白色点)
    createPoint(worldPosition) {
        const point = this.viewer.entities.add({
            position: worldPosition,
            point: {
                color: Cesium.Color.WHITE,
                pixelSize: 5,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
        });
        return point;
    };
}

export { CesiumObj }