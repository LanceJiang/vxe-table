// Table模块主入口
// 负责：
// 1. 组件全局注册
// 2. 功能模块集成
// 3. 导出表格处理接口
import { App } from 'vue'
import { VxeUI } from '../ui'
import VxeTableComponent from './src/table'
import { useCellView } from './src/use'
import './module/filter/hook'
import './module/menu/hook'
import './module/edit/hook'
import './module/export/hook'
import './module/keyboard/hook'
import './module/validator/hook'
import './module/custom/hook'
import './render'

import type { TableHandleExport } from '../../types'

// 表格组件全局安装方法
// 注册组件到Vue应用上下文
export const VxeTable = Object.assign({}, VxeTableComponent, {
  install (app: App) {
    app.component(VxeTableComponent.name as string, VxeTableComponent)
  }
})

const tableHandle: TableHandleExport = {
  useCellView
}

if (VxeUI.dynamicApp) {
  VxeUI.dynamicApp.component(VxeTableComponent.name as string, VxeTableComponent)
}

VxeUI.component(VxeTableComponent)
VxeUI.tableHandle = tableHandle

export const Table = VxeTable
export default VxeTable
