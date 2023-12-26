<template>
    <div id="putaoyuan"></div>

    <!-- 消息提示框气泡 -->
    <div id="tooltip-view" class="cesium-popup">
        <div class="cesium-popup-background">
            <div id="tooltip-content" class="cesium-popup-content"></div>
        </div>
        <div class="cesium-popup-tip-container">
            <div class="cesium-popup-tip  cesium-popup-background"></div>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';

import $ from 'jquery';

// json
import points from '@/assets/json/pty/points.json'
import centerNumber from '@/assets/json/pty/centerNumber.json'
import cluster from '@/assets/json/pty/cluster.json'

class Pty {
    static viewer = null;
    static weather = null;
    // 初始化地图
    init() {
        // 获取token
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjODg3NThmOS04MDM1LTQwOTctOGIzOS1mYzE4MjcwNGZkZDciLCJpZCI6OTA0MjcsImlhdCI6MTY1MDM2NjQxOH0.yeYCKo5T5s4Ti6-ozH3hH8w0tjSynOQGdzLeIqLiX2Q'
        this.viewer = new Cesium.Viewer('putaoyuan', {
            baseLayerPicker: false, // 如果设置为false，将不会创建右上角图层按钮。
            geocoder: false, // 如果设置为false，将不会创建右上角查询(放大镜)按钮。
            navigationHelpButton: false, // 如果设置为false，则不会创建右上角帮助(问号)按钮。
            homeButton: false, // 如果设置为false，将不会创建右上角主页(房子)按钮。
            sceneModePicker: false, // 如果设置为false，将不会创建右上角投影方式控件(显示二三维切换按钮)。
            animation: false, // 如果设置为false，将不会创建左下角动画小部件。
            timeline: false, // 如果设置为false，则不会创建正下方时间轴小部件。
            fullscreenButton: false, // 如果设置为false，将不会创建右下角全屏按钮。
            scene3DOnly: true, // 为 true 时，每个几何实例将仅以3D渲染以节省GPU内存。
            // shouldAnimate: false, // 默认true ，否则为 false 。此选项优先于设置 Viewer＃clockViewModel 。
            shouldAnimate: true, // 默认true ，否则为 false 。此选项优先于设置 Viewer＃clockViewModel 。
            // ps. Viewer＃clockViewModel 是用于控制当前时间的时钟视图模型。我们这里用不到时钟，就把shouldAnimate设为false
            infoBox: false, // 是否显示点击要素之后显示的信息
            sceneMode: 3, // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
            requestRenderMode: false, // 启用请求渲染模式，不需要渲染，节约资源吧
            fullscreenElement: document.body, // 全屏时渲染的HTML元素 暂时没发现用处，虽然我关闭了全屏按钮，但是键盘按F11 浏览器也还是会进入全屏

            // 遥感影像
            // terrainProvider: new Cesium.CesiumTerrainProvider({
            //     url: "https://data.marsgis.cn/terrain"
            // })

            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        })

        // 解决加载gltf2.0报错的问题
        // this.sloveGltf2()
        // 使场景变亮
        // this.viewer.scene.highDynamicRange = false;

        // 隐藏版权
        this.viewer._cesiumWidget._creditContainer.style.display = "none";

        // 双击左键清除默认事件
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        // 禁止相机入地【暂时不需要变更】
        this.stopCameraToRoad()

        // 检测深度（默认 false） true: 只能够看到高程上的物体； false： 类似透视的效果，看不出是否合理嵌入【一般情况下开启】
        this.viewer.scene.globe.depthTestAgainstTerrain = true

        // 加载倾斜摄影（模型）
        this.loadModel()

        // 加载单体化
        this.addSignalModel()
        // 单体化模型 鼠标移动变色
        this.mouseMove()

        // 点位打点
        this.getPointsArr()

        // 点位聚合
        // this.initCluster()

        // 天气添加
        // this.addWeather('snow')

        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        handler.setInputAction(click => {
            console.log(click.position, 'click');
            // 获取点击的pick对象
            const pick = this.viewer.scene.pick(click.position)
            // console.log(pick, '获取点击的pick对象');

            if (Cesium.defined(pick)) {
                if (pick.id && pick.id instanceof Cesium.Entity) {
                    console.log(pick.id, "选中了Entity");
                    // this.gridArr.forEach(v => v.show = v.name.includes(pick.id.name) ? true : false)
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

            // 获取鼠标点的对应椭球面位置
            const cartesian = this.viewer.scene.camera.pickEllipsoid(click.position);
            console.log(cartesian, '获取鼠标点的对应椭球面位置');
            // 2.将笛卡尔坐标转换为 经纬度（弧度）坐标
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            console.log(cartographic, 'cartographic');
            // 3.弧度转为度
            const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5)
            const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5)
            console.log(lon, lat, "lon & lat");

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    }
    // 解决加载gltf2.0报错的问题【暂时不用变更】
    sloveGltf2() {
        /* 解决加载gltf2.0报错的问题 */
        var fixGltf = function (gltf) {
            if (!gltf.extensionsUsed || !gltf.extensionsRequired) {
                return;
            }
            var v = gltf.extensionsUsed.indexOf('KHR_technique_webgl');
            var t = gltf.extensionsRequired.indexOf('KHR_technique_webgl');
            if (v !== -1) {
                gltf.extensionsRequired.splice(t, 1, 'KHR_techniques_webgl');
                gltf.extensionsUsed.splice(v, 1, 'KHR_techniques_webgl');
                gltf.extensions = gltf.extensions || {};
                gltf.extensions['KHR_techniques_webgl'] = {};
                gltf.extensions['KHR_techniques_webgl'].programs = gltf.programs;
                gltf.extensions['KHR_techniques_webgl'].shaders = gltf.shaders;
                gltf.extensions['KHR_techniques_webgl'].techniques = gltf.techniques;
                var techniques = gltf.extensions['KHR_techniques_webgl'].techniques;

                gltf.materials.forEach(function (mat, index) {
                    gltf.materials[index].extensions['KHR_technique_webgl'].values = gltf.materials[index].values;
                    gltf.materials[index].extensions['KHR_techniques_webgl'] = gltf.materials[index].extensions['KHR_technique_webgl'];

                    var vtxfMaterialExtension = gltf.materials[index].extensions['KHR_techniques_webgl'];

                    for (var value in vtxfMaterialExtension.values) {
                        var us = techniques[vtxfMaterialExtension.technique].uniforms;
                        for (var key in us) {
                            if (us[key] === value) {
                                vtxfMaterialExtension.values[key] = vtxfMaterialExtension.values[value];
                                delete vtxfMaterialExtension.values[value];
                                break;
                            }
                        }
                    };
                });

                techniques.forEach(function (t) {
                    for (var attribute in t.attributes) {
                        var name = t.attributes[attribute];
                        t.attributes[attribute] = t.parameters[name];
                    };

                    for (var uniform in t.uniforms) {
                        var name = t.uniforms[uniform];
                        t.uniforms[uniform] = t.parameters[name];
                    };
                });
            }
        }

        Object.defineProperties(Cesium.Model.prototype, {
            _cachedGltf: {
                set: function (value) {
                    this._vtxf_cachedGltf = value;
                    if (this._vtxf_cachedGltf && this._vtxf_cachedGltf._gltf) {
                        fixGltf(this._vtxf_cachedGltf._gltf);
                    }
                },
                get: function () {
                    return this._vtxf_cachedGltf;
                }
            }
        });
    }
    // 禁止相机入地【暂时不需要变更】
    stopCameraToRoad() {
        const minPitch = -Cesium.Math.PI_OVER_TWO;
        const maxPitch = 0;
        const minHeight = 1000;
        this.viewer.camera.changed.addEventListener(
            () => {
                if (this.viewer.camera._suspendTerrainAdjustment && this.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
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
                        Math.max(this.viewer.camera.positionCartographic.height, minHeight));
                    this.viewer.camera.setView({
                        destination: destination,
                        orientation: { pitch }
                    });
                    this.viewer.scene.screenSpaceCameraController.enableTilt = true;
                }
            }
        );
    }

    // 模型加载
    loadModel() {
        const options = {
            url: new URL("../assets/3dTiles/pty/b3/tileset.json", import.meta.url).href,  // 这边只需要地址而并不是实际内容
            maximumScreenSpaceError: 256, // 数值加大，能让最终成像变模糊，越快
            skipLevelOfDetail: true,
            baseScreenSpaceError: 1024,
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
            dynamicScreenSpaceErrorDensity: 0.1, // 数值加大，能让周边加载变快
            dynamicScreenSpaceErrorFactor: 1,
            dynamicScreenSpaceError: true // 有了这个后，会在真正的全屏加载完之后才清晰化房屋
        }
        // 改变模型高度【暂时不用变更】
        const changeHeight = (height, tileset) => {
            height = Number(height);
            if (isNaN(height)) {
                return;
            }
            const cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
            const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0);
            const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
            const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
            // 模型位置以及旋转角度高度设置
            tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        }
        // 配置形成 倾斜摄影
        let model = new Cesium.Cesium3DTileset(options)
        // primitives 里面载入 该倾斜摄影
        let tileset = this.viewer.scene.primitives.add(model)
        tileset.readyPromise.then((item) => {
            changeHeight(9, item);
        })
        // 飞向 该倾斜摄影
        this.viewer.flyTo(tileset)
    }
    /* 需求：放在每个大棚上面，大棚的颜色改变 */
    // 单体化模型（叠加）
    addSignalModel() {
        $.ajax({
            url: 'https://www.txputao.cn/putaoyuan/frontputaoyuan/json/res.json',
            dataType: 'json',
            success: (res) => {
                var ldCollection = new Cesium.PrimitiveCollection();
                res.ld.forEach(ld => {
                    // 一般使用该类 做单体化 ClassificationPrimitive
                    ldCollection.add(new Cesium.ClassificationPrimitive({
                        // 官方方法
                        geometryInstances: new Cesium.GeometryInstance({
                            // 因为是矩形，所以使用 PolygonGeometry 类
                            geometry: new Cesium.PolygonGeometry({
                                // 定义多边形角点的位置数组
                                polygonHierarchy: new Cesium.PolygonHierarchy(
                                    Cesium.Cartesian3.fromDegreesArray(ld.coordinates)
                                ),
                                // 多边形拉伸的高度
                                extrudedHeight: ld.height
                            }),
                            id: ld.name,
                            attributes: { // 顶点着色器的属性
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1, 0, 0, 1e-4)),
                                show: new Cesium.ShowGeometryInstanceAttribute(true), //确定是否显示几何实例
                            }
                        }),
                        classificationType: Cesium.ClassificationType.BOTH
                    }))
                })

                // 将点插入场景中
                this.viewer.scene.primitives.add(ldCollection);
            }
        });
    }
    // 移动到单体化模型改变颜色
    mouseMove() {
        // 单体化选中 
        let selected, primitive, color, show, attribute;
        let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
        handler.setInputAction(move => {
            const pick = this.viewer.scene.pick(move.endPosition) // startPosition && endPosition 移动前后的位置 
            // 展示 tooltip
            let showTooltip = () => {
                // 拾取有地形高程的点，但不包括模型、倾斜摄影等表面高度。【地表坐标】
                var ray = this.viewer.scene.camera.getPickRay(move.endPosition);
                var cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
                $('#tooltip-view').show(); // show
                $('#tooltip-content').empty(); // 内容清空
                $('#tooltip-content').append(pick.id || ''); // 添加内容
                var x = move.endPosition.x - ($('#tooltip-view').width()) / 2;
                if (move.endPosition.x >= $('#putaoyuan').clientWidth - $('#tooltip-view').clientWidth) {
                    x = $('#putaoyuan').clientWidth - $('#tooltip-view').clientWidth - 100;
                }
                var y = move.endPosition.y - ($('#tooltip-view').height()) - 100;
                $('#tooltip-view').css('transform', 'translate3d(' + x + 'px, ' + y + 'px, 0)');
                this.viewer.scene.postRender.addEventListener(() => {
                    var changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, cartesian);
                    if (Cesium.defined(changedC)) {
                        var x = changedC.x - ($('#tooltip-view').width()) / 2;
                        var y = changedC.y - ($('#tooltip-view').height());
                        $('#tooltip-view').css('transform', 'translate3d(' + x + 'px, ' + y + 'px, 0)');
                    }
                })
            }
            // 判断 超出模型点击范围外 是否还存在selected，有的话-清除
            let judgeSelected = () => {
                if (Cesium.defined(selected)) {
                    attribute = primitive.getGeometryInstanceAttributes(selected);
                    attribute.color = color;
                    attribute.show = show;
                    selected = undefined;
                    primitive = undefined;
                    color = undefined;
                    show = undefined;
                }
            }
            if (Cesium.defined(pick) && Cesium.defined(pick.id)) {
                if (pick.id === selected) return
                judgeSelected()
                if (Cesium.defined(pick.primitive) && Cesium.defined(pick.primitive.getGeometryInstanceAttributes)) {
                    selected = pick.id;
                    primitive = pick.primitive;
                    attribute = primitive.getGeometryInstanceAttributes(selected);
                    color = attribute.color;
                    show = attribute.show;
                    if (!this.viewer.scene.invertClassification) {
                        console.log(attribute.color, 'attribute');
                        attribute.color = [255, 0, 0, 100];
                        console.log(attribute.color, 'attribute');
                    }
                    attribute.show = [1];
                }
                showTooltip()
            } else {
                // 置空 tooltip
                $('#tooltip-content').empty();
                $('#tooltip-view').hide();
                judgeSelected()
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    }
    // 打点（不同类型）
    getPointsArr() {
        // 点位
        let obj = {
            '轨道机': 'point/guidaoji.png',
            '周界': 'point/zhoujie.png',
            '鹰眼': 'point/yingyan.png',
            '门禁': 'point/menjin.png',
            '物联网相机': 'point/wulianwangxiangji.png',
        }
        // 先按照 name 分类
        points.reduce((prev, cur) => {
            var key = cur.name;
            if (!prev[key]) { prev[key] = [] }
            let item = {
                type: cur.name,
                longitude: Number(cur.longitude),
                latitude: Number(cur.latitude),
                name: cur.cameraname,
                indexcode: cur.indexcode,
                cameraindexcode: cur.cameraindexcode,
                image: obj[cur.name]
            }
            prev[key].push(item)
            this.addPoint(item)
            return prev
        }, {})

        // 中心数字
        centerNumber.forEach((item, index) => {
            this.addPoint({
                type: item.type,
                longitude: Number(item.longitude),
                latitude: Number(item.latitude),
                name: item.name,
                image: `biaohao/${index + 1}.png`
            })
        })
    }
    addPoint(item) {
        // 广告牌 
        this.viewer.entities.add({
            name: item.name,
            type: item.type,
            id: item.indexcode,
            indexcode: item.indexcode || '',
            cameraindexcode: item.cameraindexcode || '',
            position: Cesium.Cartesian3.fromDegrees(
                item.longitude * 1,
                item.latitude * 1,
                15
            ),
            billboard: {
                image: new URL(`../assets/image/pty/${item.image}`, import.meta.url).href,
                width: 50,
                height: 55,
            }
        })
    }

    // 点聚合功能效果
    initCluster() {
        new Cesium.GeoJsonDataSource().load(cluster).then(dataSource => {
            this.viewer.dataSources.add(dataSource);

            // 设置聚合参数
            dataSource.clustering.enabled = true;  // 是否启用集群
            dataSource.clustering.pixelRange = 60;  // 扩展屏幕空间边界框的像素范围
            dataSource.clustering.minimumClusterSize = 2; // 可以群集的最小屏幕空间对象数

            // foreach用于调用数组的每个元素，并将元素传递给回调函数。 
            dataSource.entities.values.forEach(entity => {
                // 将点拉伸一定高度，防止被地形压盖
                entity.position._value.z += 30;
                let obj = {
                    '轨道机': 'point/guidaoji.png',
                    '周界': 'point/zhoujie.png',
                    '鹰眼': 'point/yingyan.png',
                    '门禁': 'point/menjin.png',
                    '物联网相机': 'point/wulianwangxiangji.png',
                }
                entity.billboard = {
                    image: new URL(`../assets/image/pty/${obj[entity.name]}`, import.meta.url).href,
                    width: 50,
                    height: 55,
                }
            });

            // 画布
            const combineIconAndLabel = (url, label, size) => {
                // 创建画布对象
                let canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                let ctx = canvas.getContext("2d");

                let promise = new Cesium.Resource.fetchImage(url).then(image => {
                    // 异常判断
                    try {
                        ctx.drawImage(image, 0, 0);
                    } catch (e) {
                        console.log(e);
                    }

                    // 渲染字体
                    // font属性设置顺序：font-style, font-variant, font-weight, font-size, line-height, font-family
                    // ctx.fillStyle = Cesium.Color.RED.toCssColorString();
                    // ctx.font = 'bold 30px Microsoft YaHei';
                    // ctx.textAlign = "center";
                    // ctx.textBaseline = "middle";
                    // ctx.fillText(label, size / 2, size / 2);

                    return canvas;
                });
                return promise;
            }
            // 添加监听函数
            dataSource.clustering.clusterEvent.addEventListener(
                (clusteredEntities, cluster) => {

                    // 关闭自带的显示聚合数量的标签
                    cluster.label.show = false;
                    cluster.billboard.show = true;

                    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;

                    // 根据聚合数量的多少设置不同层级的图片以及大小
                    // 大于几说明有几个 
                    let image = new URL(`../assets/image/pty/biaohao/ptCluster.png`, import.meta.url).href

                    console.log(cluster.billboard, 'cluster.billboard');
                    if (clusteredEntities.length >= 4) {
                        cluster.billboard.image = combineIconAndLabel(image, clusteredEntities.length, 64);
                        cluster.billboard.width = 72;
                        cluster.billboard.height = 72;
                    } else if (clusteredEntities.length >= 3) {
                        cluster.billboard.image = combineIconAndLabel(image, clusteredEntities.length, 64);
                        cluster.billboard.width = 56;
                        cluster.billboard.height = 56;
                    } else if (clusteredEntities.length >= 2) {
                        cluster.billboard.image = combineIconAndLabel(image, clusteredEntities.length, 64);
                        cluster.billboard.width = 48;
                        cluster.billboard.height = 48;
                    } else {
                        cluster.billboard.image = combineIconAndLabel(image, clusteredEntities.length, 64);
                        cluster.billboard.width = 40;
                        cluster.billboard.height = 40;
                    }
                }
            )
        })
    }

    // 各种天气加载
    addWeather(weather) {
        const weatherObj = {
            rain: {
                name: 'czm_rain',
                fragmentShader:
                    '\n\
                          uniform sampler2D colorTexture;\n\
                            varying vec2 v_textureCoordinates;\n\
                            float hash(float x)\n\
                            {\n\
                             return fract(sin(x*133.3)*13.13);\n\
                            }\n\
                            void main(void){\n\
                              float time = czm_frameNumber / 60.0;\n\
                             vec2 resolution = czm_viewport.zw;\n\
                              vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                              vec3 c=vec3(.6,.7,.8);\n\
                              float a=-.4;\n\
                            float si=sin(a),co=cos(a);\n\
                            uv*=mat2(co,-si,si,co);\n\
                            uv*=length(uv+vec2(0,4.9))*.3+1.;\n\
                             float v=1.-sin(hash(floor(uv.x*100.))*2.);\n\
                            float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n\
                            c*=v*b;\n\
                            gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.2);\n\
                            }'
            },
            snow: {
                name: 'czm_snow',
                fragmentShader:
                    '\n\
                         uniform sampler2D colorTexture;\n\
                         varying vec2 v_textureCoordinates;\n\
                         float snow(vec2 uv,float scale)\n\
                         {\n\
                         float time = czm_frameNumber / 60.0;\n\
                          float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n\
                          uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n\
                           uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n\
                           p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n\
                          k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n\
                         return k*w;\n\
                         }\n\
                         void main(void){\n\
                          vec2 resolution = czm_viewport.zw;\n\
                          vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                          vec3 finalColor=vec3(0);\n\
                            float c = 0.0;\n\
                           c+=snow(uv,30.)*.0;\n\
                           c+=snow(uv,20.)*.0;\n\
                          c+=snow(uv,15.)*.0;\n\
                          c+=snow(uv,10.);\n\
                          c+=snow(uv,8.);\n\
                           c+=snow(uv,6.);\n\
                          c+=snow(uv,5.);\n\
                           finalColor=(vec3(c)); \n\
                         gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5); \n\
                         }'
            },
            fog: {
                name: 'czm_fog',
                fragmentShader:
                    'uniform sampler2D colorTexture;\n\
                         uniform sampler2D depthTexture;\n\
                         uniform float visibility;\n\
                         uniform vec4 fogColor;\n\
                         varying vec2 v_textureCoordinates; \n\
                         void main(void) \n\
                         { \n\
                            vec4 origcolor = texture2D(colorTexture, v_textureCoordinates); \n\
                            float depth = czm_readDepth(depthTexture, v_textureCoordinates); \n\
                            vec4 depthcolor = texture2D(depthTexture, v_textureCoordinates); \n\
                            float f = visibility * (depthcolor.r - 0.3) / 0.2; \n\
                            if (f < 0.0) f = 0.0; \n\
                            else if (f > 1.0) f = 1.0; \n\
                            gl_FragColor = mix(origcolor, fogColor, f); \n\
                         }\n',
                uniforms: {
                    visibility: () => {
                        return Cesium.defaultValue(0.2, 0.1);
                    },
                    fogColor: () => {
                        return Cesium.defaultValue(new Cesium.Color(0.8, 0.8, 0.8, 0.3), new Cesium.Color(0.8, 0.8, 0.8, 0.5));
                    }
                }
            }
        }
        // 如果有天气,先删除天气
        if (this.weather) this.viewer.scene.postProcessStages.remove(this.weather)
        // 初始化天气
        this.weather = new Cesium.PostProcessStage(weatherObj[weather])
        // 将天气加入进去
        this.viewer.scene.postProcessStages.add(this.weather)
    }
    clearWeather() {
        // 如果有天气,先删除天气
        if (this.weather) this.viewer.scene.postProcessStages.remove(this.weather)
    }

    time = null
    /* 昼夜交替 */
    getDayOrNight() {
        const time = moment().format('H')
        console.log(((time > 6) && (time < 18)) ? 1 : 0.5, 'time');
        this.changeTime(((time > 6) && (time < 18)) ? 1 : 0.5)
    }
    changeTime(num) {
        console.log(num, 'num');
        let stages = this.viewer.scene.postProcessStages;
        this.viewer.scene.brightness = this.viewer.scene.brightness || stages.add(Cesium.PostProcessStageLibrary.createBrightnessStage());
        this.viewer.scene.brightness.enabled = true;
        console.log(this.viewer.scene.brightness.uniforms.brightness, 'brightness.uniforms.brightness');
        // 缓慢变亮,由0.2升为1【黑夜变白天】
        // if (this.time) clearInterval(this.time)
        // this.time = setInterval(() => {
        //     brightness.uniforms.brightness = Number(Number(brightness.uniforms.brightness) + 0.1) // -0.1
        //     console.log(brightness.uniforms.brightness, 'brightness.uniforms.brightness');
        //     if (brightness.uniforms.brightness >= num) { // 黑夜 <= num
        //         clearInterval(this.time)
        //     }
        // }, 10000)
        // 缓慢变黑,由1降为0.2【白天变黑夜】
        // let t = setInterval(() => {
        //     this.viewer.scene.brightness.uniforms.brightness = Number(Number(this.viewer.scene.brightness.uniforms.brightness) - 0.1)
        //     // console.log(this.viewer.scene.brightness.uniforms.brightness, 5555)
        //     if (this.viewer.scene.brightness.uniforms.brightness <= 1.0) {
        //         clearInterval(t)
        //     }
        // })
        this.viewer.scene.brightness.uniforms.brightness = Number(num);// 值越大，场景整体越亮
    }
    // 白天
    day() {
        this.changeTime(1)
    }
    // 黑夜
    night() {
        this.changeTime(0.5)
    }
}
const pty = new Pty()

onMounted(() => pty.init()) 
</script>


<style scoped lang="scss">
#putaoyuan {
    width: 100%;
    height: 100%;
}

/*弹出框样式*/
.cesium-popup {
    position: absolute;
    left: 0;
    top: 5px;
    text-align: left;

    .cesium-popup-background {
        background: rgba(35, 72, 72, .6);
        border-radius: 6px;
        padding: 1px 0;

        .cesium-popup-content {
            margin: 15px 10px 10px;
            line-height: 1.4;
            font-size: 13px;
            max-width: 439px;
            min-width: 50px;
            color: white;
        }
    }

    .cesium-popup-tip-container {
        margin: 0 auto;
        width: 40px;
        height: 13px;
        position: relative;
        overflow: hidden;

        .cesium-popup-tip {
            box-shadow: 0 3px 14px rgba(0, 0, 0, .4);
            width: 17px;
            height: 17px;
            padding: 1px;
            margin: -10px auto 0;
            -webkit-transform: rotate(45deg);
            transform: rotate(45deg);
        }
    }
}
</style>