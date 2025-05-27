
### 1.vxe-table 主体内容
[掘金链接](https://juejin.cn/post/7508380512430374948)
```html
<div class="vxe-table">
    <!-- 主体内容 -->
    <div class="vxe-table--render-wrapper">
        <!-- 根据 props.scrollbarConfig 配置的 {x: {position: 'top'}} 控制横向x滚动条在table上(默认下) -->
        { scrollbarXToTop ? [renderBody(), renderScrollX()] : [renderScrollX(), renderBody()] }
    </div>
</div>

<script lang="tsx">
    // table壳 渲染
    const renderBody = () => {
        // 根据 props.scrollbarConfig 配置的 {y: {position: 'left'}} 控制纵向y滚动条在table上(默认右)
        const scrollbarYToLeft = computeScrollbarYToLeft.value
        return <div class="vxe-table--layout-wrapper">
            {scrollbarYToLeft ? [
                renderScrollY(),
                renderViewport()
            ] : [
                // 真实table
                renderViewport(),
                // 纵向滚动条
                renderScrollY()
            ]}
        </div>
    }
    // table 渲染
    const renderViewport = () => {
        const { showHeader, showFooter } = props
        return <div ref="refTableViewportElem" class="vxe-table--viewport-wrapper">
            {/*渲染table主体内容*/}
            <div class="vxe-table--main-wrapper">
                {/*表头*/}
                {
                    showHeader ? <TableHeaderComponent ref="refTableHeader" tableData tableColumn tableGroupColumn /> : ''
                }
                {/*表体*/}
                <TableBodyComponent ref="refTableBody" tableData tableColumn />
                {/*表尾*/}

                {
                    showHeader ? <TableFooterComponent ref="refTableFooter" footerTableData tableColumn /> : ''
                }
            </div>
            {/*渲染table左/右固定*/}
            <div class="vxe-table--fixed-wrapper">
                {leftList.length && overflowX ? renderFixed('left') : ''}
                {rightList.length && overflowX ? renderFixed('right') : ''}
            </div>
            {/*配置了 expand 的内容渲染*/}
            <div class="vxe-table--row-expanded-wrapper">
                {/*用于updateScrollYSpace更新高度 有作用嘛?? todo*/}
                <div ref="refRowExpandYSpaceElem"></div>
                {/*expandColumn: type="expand"的column 渲染 源于rowExpandedMaps数据整合*/}
                {tableRowExpandedList.map(v => {
                    return <div class="vxe-body--row-expanded-cell">
                        {expandColumn.renderData()}
                    </div>
                })}
            </div>
        </div>
    }
    // 渲染 左右侧 固定的 columns
    const renderFixed =  (fixedType: 'left' | 'right') => {
        const isFixedLeft = fixedType === 'left'
        return <div class={`vxe-table--fixed-${fixedType}-wrapper`} ref={isFixedLeft ? refLeftContainer : refRightContainer}>
            {/*表头*/}
            {
                showHeader ? <TableHeaderComponent ref={isFixedLeft ? refTableLeftHeader : refTableRightHeader} fixedType tableData tableColumn tableGroupColumn fixedColumn /> : ''
            }
            {/*表体*/}
            <TableBodyComponent ref={isFixedLeft ? refTableLeftBody : refTableRightBody} tableData tableColumn fixedColumn />
            {/*表尾*/}

            {
                showHeader ? <TableFooterComponent ref={isFixedLeft ? refTableLeftFooter : refTableRightFooter} fixedType footerTableData tableColumn fixedColumn /> : ''
            }
        </div>
    }
    // x轴滚动条
    const renderScrollX = () => {
        return <div ref="refScrollXVirtualElem" class="vxe-table--scroll-x-virtual">
            <div class="vxe-table--scroll-x-left-corner" ref="refScrollXLeftCornerElem"></div>
            <div class="vxe-table--scroll-x-wrapper" ref="refScrollXWrapperElem">
                <div class="vxe-table--scroll-x-handle" ref="refScrollXHandleElem" onScroll="triggerVirtualScrollXEvent">
                    <div class="vxe-table--scroll-x-space" ref="refScrollXSpaceElem"></div>
                </div>
            </div>
            <div class="vxe-table--scroll-x-right-corner" ref="refScrollXRightCornerElem"></div>
        </div>
    }
    // y轴滚动条
    const renderScrollY = () => {
        return <div ref="refScrollYVirtualElem" class="vxe-table--scroll-y-virtual">
            <div class="vxe-table--scroll-y-top-corner" ref="refScrollYTopCornerElem"></div>
            <div class="vxe-table--scroll-y-wrapper" ref="refScrollYWrapperElem">
                <div class="vxe-table--scroll-y-handle" ref="refScrollYHandleElem" onScroll={triggerVirtualScrollYEvent}>
                    <div class="vxe-table--scroll-y-space" ref="refScrollYSpaceElem"></div>
                </div>
            </div>
            <div class="vxe-table--scroll-y-bottom-corner" ref="refScrollYBottomCornerElem"></div>
        </div>
    }
    // 触发纵向y虚拟滚动事件，通知外部组件滚动状态变化
    const triggerVirtualScrollYEvent = (evnt) => {
        const { elemStore, inWheelScroll, lastScrollTop, inHeaderScroll, inBodyScroll, inFooterScroll } = internalData
        // 过滤掉 body滚动
        if (inHeaderScroll || inBodyScroll || inFooterScroll) {
            return
        }
        // 过滤掉 滚轮 滚动
        if (inWheelScroll) {
            return
        }
        
        // 虚拟y滚动
        if (scrollYLoad) {
            $xeTable.triggerScrollYEvent(evnt)
        }
        $xeTable.handleScrollEvent(evnt, isRollY, isRollX, scrollTop, scrollLeft, {
            type: 'table',
            fixed: ''
        })
    }
    onMounted(() => {
        const tableViewportEl = refTableViewportElem.value
        if (tableViewportEl) {
            // 绑定 滚轮事件 主要兼容 renderFixed('left' | 'right') table 渲染的部分
            tableViewportEl.addEventListener('wheel', /*$xeTable.triggerBodyWheelEvent*/triggerBodyWheelEvent, { passive: false })
            // $xeTable.triggerBodyWheelEvent
            const triggerBodyWheelEvent = (evnt) => {
                if (scrollYLoad) {
                    $xeTable.triggerScrollYEvent(evnt)
                }
                $xeTable.handleScrollEvent(evnt, isRollY, isRollX, currTopNum, bodyScrollElem.scrollLeft, {
                    type: 'table',
                    fixed: ''
                })
            }
        }
    })

    const $xeTable = {
        triggerScrollYEvent() {
            // 纵向 Y 可视渲染处理
            loadScrollYData()
            const loadScrollYData = () => {
                // 计算(存储在 scrollYStore) visibleStartIndex visibleEndIndex,  startIndex endIndex
                $xeTable.updateScrollYData()
            }
        },
        // 计算 展示的 data数据
        handleTableData(force?: boolean) {
            const tableData = scrollYLoad ? fullList.slice(scrollYStore.startIndex, scrollYStore.endIndex) : fullList.slice(0)
            reactData.tableData = tableData
        },
        // 更新y数据
        updateScrollYData() {
            $xeTable.handleTableData()
            $xeTable.updateScrollYSpace()
        },
        // 更新纵向 Y 可视渲染上下剩余空间大小
        updateScrollYSpace() {
            const containerList = ['main', 'left', 'right']
            if (bodyTableElem) {
                bodyTableElem.style.transform = `translate(${reactData.scrollXLeft || 0}px, ${scrollYTop}px)`
            }
            containerList.forEach(name => {
                const layoutList = ['header', 'body', 'footer']
                layoutList.forEach(layout => {
                    const ySpaceElem = getRefElem(elemStore[`${name}-${layout}-ySpace`])
                    if (ySpaceElem) {
                        ySpaceElem.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
                    }
                })
            })
        },
        // 处理滚动事件，计算新的 startIndex 和 endIndex，并触发重新渲染
        handleScrollEvent (evnt, isRollY, isRollX, scrollTop, scrollLeft, params) {
            // 更新 scrollTop
            internalData.lastScrollTop = scrollTop
            // 派发滚动条事件
            dispatchEvent('scroll', evntParams, evnt)
        }
    }
</script>
```
```html
<!-- body.ts 即上述的 TableBodyComponent 组件-->
<script lang="tsx">
    // 渲染主体
    const renderVN = () => {
        const { fixedColumn, fixedType, tableColumn } = props
        // table 的 $xeTable.triggerBodyScrollEvent
        const triggerBodyScrollEvent = (evnt, fixedType) => {
            // 标记body 滚动
            internalData.inBodyScroll = true
            if (scrollYLoad) {
                $xeTable.triggerScrollYEvent(evnt)
            }
            $xeTable.handleScrollEvent(evnt, isRollY, isRollX, scrollTop, scrollLeft, {
                type: 'body',
                fixed: fixedType
            })
        }
        const ons = {
            onScroll(evnt){
                // $xeTable.triggerBodyScrollEvent(evnt, fixedType)
                triggerBodyScrollEvent(evnt, fixedType)
            }
        }
        return <div class={['vxe-table--body-wrapper', fixedType ? `fixed-${fixedType}--wrapper` : 'body--wrapper']}>
            <div class="vxe-table--body-inner-wrapper" ref="refBodyScroll" {...ons}>
                {
                    fixedType ? '' : <div class="vxe-body--x-space"></div>
                }
                <div class="vxe-body--y-space"></div>
                <table class="vxe-table--body">
                    {/*列宽*/}
                    <colgroup>
                        {/* renderColumnList: 即 调整后的tableColumn */}
                        {renderColumnList.map((column, $columnIndex) => {
                            return <col style={`width: ${column.renderWidth}px`}></col>
                        })}
                    </colgroup>
                    {/*内容*/}
                    <tbody ref="refBodyTBody">
                    {renderRows(fixedType, isOptimizeMode, renderDataList, renderColumnList)}
                    </tbody>
                </table>
            </div>
        </div>
    }
    const renderRows = (fixedType: 'left' | 'right' | '', isOptimizeMode: boolean, tableData: any[], tableColumn: VxeTableDefines.ColumnInfo[]) => {
        const rows: any[] = []
        tableData.forEach((row, $rowIndex) => {
            const tdVNs = tableColumn.map((column, $columnIndex) => {
                return renderTdColumn(seq, rowid, fixedType, isOptimizeMode, rowLevel, row, rowIndex, $rowIndex, _rowIndex, column, $columnIndex, tableColumn, tableData)
            })
            rows.push({
                <tr class="vxe-body--row">{tdVNs}</tr>
            })
        }
        return rows
    }
    // 渲染列
    const renderTdColumn = (
            seq: number | string,
            rowid: string,
            fixedType: 'left' | 'right' | '',
            isOptimizeMode: boolean,
            rowLevel: number,
            row: any,
            rowIndex: number,
            $rowIndex: number,
            _rowIndex: number,
            column: VxeTableDefines.ColumnInfo,
            $columnIndex: number,
            columns: VxeTableDefines.ColumnInfo[],
            items: any[]
    ) => {
        // 判断是否是隐藏列
        let fixedHiddenColumn = fixedType ? column.fixed !== fixedType : column.fixed && overflowX
        const tdVNs: any[] = []
        // 渲染单元格
        // 若在该 column 不在body里面渲染(被安排到固定列渲染的部分 只作占位)
        if (fixedHiddenColumn) {
            tdVNs.push(<div class="vxe-cell"></div>)
        } else {
            tdVNs.push(<div class="vxe-cell">
                <div class="vxe-cell--wrapper">
                    {column.renderCell(cellParams)}
                </div>
            </div>
            )   
        }
        /*// 单元格宽度拖拽
        if (!fixedHiddenColumn && showResizable && isAllColumnDrag) {
            tdVNs.push(<div class="vxe-cell--col-resizable"></div>)
        }
        // 单元格高度拖拽
        if ((rowResize || isAllRowDrag) && rowOpts.resizable) {
            tdVNs.push(<div class="vxe-cell--row-resizable"></div>)
        }*/
        return <td class="vxe-body--column">{tdVNs}</td>
    }
</script>
```

```html
<!-- header.ts 即上述的 TableHeaderComponent 组件-->
<script lang="tsx">
    // 渲染主体
    const renderVN = () => {
        const { fixedType, fixedColumn, tableColumn } = props
        return <div class={['vxe-table--header-wrapper', fixedType ? `fixed-${fixedType}--wrapper` : 'body--wrapper']}>
            <div class="vxe-table--header-inner-wrapper" onScroll={event => triggerHeaderScrollEvent(event, fixedType)}>
                {
                    fixedType ? '' : <div class="vxe-body--x-space"></div>
                }
                <table ref="refHeaderTable" class="vxe-table--header">
                    {/*列宽*/}
                    <colgroup>
                        {/* renderColumnList: 即 调整后的tableColumn */}
                        {renderColumnList.map((column, $columnIndex) => {
                            return <col style={`width: ${column.renderWidth}px`}></col>
                        })}
                    </colgroup>
                    {/*头部*/}
                    <thead ref="refHeaderTHead">
                        {renderHeads(isGroup, isOptimizeMode, renderHeaderList)}
                    </thead>
                </table>
                {/*鼠标配置项相关*/}
                {
                    mouseConfig && mouseOpts.area ? <div class="vxe-table--cell-area">
                        {/*该配置相关暂不解析*/}
                    </div> : ''
                }
            </div>
        </div>
    }

    const renderHeads = (isGroup: boolean, isOptimizeMode: boolean, headerGroups: VxeTableDefines.ColumnInfo[][]) => {
        const { fixedType } = props
        
        return headerGroups.map((cols, $rowIndex) => {
            const fixedHiddenColumn = fixedType ? (column.fixed !== fixedType && !isColGroup) : !!column.fixed && overflowX
            return <tr class="vxe-header--row">
                {/* @renderRows 逻辑 */}
                {
                    cols.map((column, $columnIndex) => {
                        return <th class="vxe-header--column">
                            <div class="vxe-cell">
                                {/* 如果是隐藏列 只留占位不做渲染 */}
                                {
                                        isVNPreEmptyStatus || (isOptimizeMode && fixedHiddenColumn) ? '' : <div class="vxe-cell--wrapper">{column.renderHeader()}</div> 
                                }
                            </div>
                            {/*列宽拖动*/}
                            {
                                !fixedHiddenColumn && showResizable ? 
                                    <div class="vxe-cell--col-resizable" onMousedown={ev => handleColResizeMousedownEvent(ev, fixedType)}></div> :
                                    ''
                            }
                        </th>
                    })
                }
            </tr>
        })
                
    }
</script>
```

```html
<!-- footer.ts 即上述的 TableFooterComponent 组件-->
<script lang="tsx">
    // 渲染主体
    const renderVN = () => {
        const { fixedType, fixedColumn, tableColumn } = props
        return <div class={['vxe-table--footer-wrapper', fixedType ? `fixed-${fixedType}--wrapper` : 'body--wrapper']}>
            <div class="vxe-table--footer-inner-wrapper" onScroll={event => triggerFooterScrollEvent(event, fixedType)}>
                {
                    fixedType ? '' : <div class="vxe-body--x-space"></div>
                }
                <table ref="refFooterTable" class="vxe-table--footer">
                    {/*列宽*/}
                    <colgroup>
                        {/* renderColumnList: 即 调整后的tableColumn */}
                        {renderColumnList.map((column, $columnIndex) => {
                            return <col style={`width: ${column.renderWidth}px`}></col>
                        })}
                    </colgroup>
                    {/*底部*/}
                    <tfoot ref="refFooterTFoot">
                    {renderHeads(isOptimizeMode, renderHeaderList)}
                    </tfoot>
                </table>
            </div>
        </div>
    }
    const renderHeads = (isOptimizeMode: boolean, renderColumnList: VxeTableDefines.ColumnInfo[]) => {
        const { fixedType, footerTableData } = props
        return footerTableData.map((row, $rowIndex) => {
            return <tr class="vxe-footer--row">
                {/* @renderRows 逻辑 */}
                {
                    renderColumnList.map((column, $columnIndex) => {
                        return <td class="vxe-footer--column">
                            <div class="vxe-cell">
                                {/* 如果是隐藏列 只留占位不做渲染 */}
                                {
                                    isVNPreEmptyStatus ? '' : <div class="vxe-cell--wrapper">{column.renderFooter()}</div> 
                                }
                            </div>
                            {/*列宽拖动*/}
                            {
                                !fixedHiddenColumn && showResizable && isAllColumnDrag ?
                                        <div class="vxe-cell--col-resizable" onMousedown={ev => handleColResizeMousedownEvent(ev, fixedType)}></div> :
                                        ''
                            }
                        </td>
                    })
                }
            </tr>
        })
    }
</script>
```

