/*
 * @Description: 将ceisum经常使用到的资源归集并导出
 * @Version: 2.0
 * @Author: ljh
 * @Date: 2023-12-26 16:29:32
 * @LastEditTime: 2023-12-26 17:26:46
 */ 

export const useResource = () => {

    const viewer = window.viewer;
    /* entities */
    const entities = viewer.entities;
    const entitiesArr = entities.values;

    /* dataSources */
    const dataSources = viewer.dataSources;
    const dataSourcesArr = dataSources._dataSources;

    return {
        viewer,
        entities,
        entitiesArr,
        dataSources,
        dataSourcesArr
    }

}