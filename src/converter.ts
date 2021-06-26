/*
 *
 * Copyright (c) 2021 Jan Pieter Posthuma / DataScenarios
 *
 * All rights reserved.
 *
 * MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";
import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewTableRow = powerbi.DataViewTableRow;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import IViewPort = powerbi.IViewport;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { getObject } from "powerbi-visuals-utils-dataviewutils/lib/dataViewObjects";
import { LineStyle, DiagramAlignment, TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { chain, head, times } from "lodash";
import { parseSettings, Settings } from "./settings";
import { DataPoint, Device, State, EventDataPoints, Legend } from "./data";
import { scaleTime, max, min, scaleBand } from "d3";

const devicesRole = "device";
const timeRole = "time";
const stateRole = "event";

export function converter(
    dataView: DataView | undefined,
    viewPort: IViewPort,
    host: IVisualHost,
    colors: ISandboxExtendedColorPalette,
    locale: string
): EventDataPoints | undefined {
    const timer = PerfTimer.START(TraceEvents.convertor, true);
    if (!checkValidDataview(dataView)) {
        timer();
        return;
    }
    const settings = parseSettings(dataView as DataView);
    const metadata = dataView && dataView.metadata && dataView.metadata.columns;
    const rows = (dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.root &&
        dataView.matrix.rows.root.children) as DataViewMatrixNode[];
    const rowLevels = (dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.levels) as DataViewHierarchyLevel[];
    const timeColumn: DataViewMetadataColumn = metadata?.filter((c: DataViewMetadataColumn) =>
        c.roles ? c.roles[timeRole] : false
    )[0] as DataViewMetadataColumn;

    const timeFormatter = valueFormatter.create({
        format: timeColumn.format,
        cultureSelector: locale,
    });

    const timeSeries: Date[] = [];
    const legend: Legend[] = [];
    let index = 0;
    if (settings.unknown.show) {
        legend.push({
            legend: settings.unknown.label,
            color: settings.unknown.color,
        });
    }
    const devices: Device[] = rows.map((row: DataViewMatrixNode, index: number) => {
        const deviceSelectionId = host
            .createSelectionIdBuilder()
            .withMatrixNode(row, rowLevels)
            .createSelectionId();
        const device: Device = {
            name: row.value,
            states: [],
            selectionId: deviceSelectionId,
        } as Device;
        if (row.children) {
            device.states = row.children.map((measure: DataViewMatrixNode) => {
                const time = new Date(measure.value as string);
                if (!timeSeries.some((t: Date) => t === time)) timeSeries.push(time);
                const state = measure.values && measure.values[0].value;
                if (!legend.some((s: Legend) => s.legend === state)) {
                    legend.push({
                        legend: state?.toString() as string,
                        color: getColorByIndex(
                            index,
                            index.toString(),
                            dataView?.metadata.objects,
                            "stateColor",
                            colors
                        ),
                    });
                    index++;
                }
                const selectionId = host
                    .createSelectionIdBuilder()
                    .withMatrixNode(row, rowLevels)
                    .withMatrixNode(measure, rowLevels)
                    .createSelectionId();
                return {
                    color: legend.filter((l: Legend) => l.legend === (state?.toString() as string))[0].color,
                    formatter: timeFormatter,
                    isUnknown: false,
                    name: row.value,
                    selectionId,
                    deviceSelectionId,
                    state,
                    time,
                    tooltip: getTooltip,
                } as State;
            });
        }
        return device;
    });

    devices.forEach((device: Device) => {
        if (settings.unknown.show && device.states[0].time !== min(timeSeries)) {
            device.states = [
                {
                    color: settings.unknown.color,
                    formatter: timeFormatter,
                    isUnknown: true,
                    name: device.name,
                    selectionId: undefined,
                    state: settings.unknown.label,
                    time: min(timeSeries) as Date,
                    tooltip: getTooltip,
                } as State,
            ].concat(device.states);
        }
        const nrOfEvents = device.states.length;
        device.states.forEach((state: State, index: number, all: State[]) => {
            if (index < nrOfEvents - 1) state.endTime = all[index + 1].time;
            else state.endTime = max(timeSeries);
        });
    });

    settings.general.width = viewPort.width - 2 * settings.general.padding;
    settings.general.height = viewPort.height - 2 * settings.general.padding;

    timer();
    return {
        devices,
        times: [min(timeSeries) as Date, max(timeSeries) as Date],
        timeFormatter,
        legend,
        settings,
    };
}

function checkValidDataview(dataView: DataView | undefined) {
    return !!(
        dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.levels &&
        dataView.matrix.rows.levels.length > 0 &&
        dataView.matrix.rows.root &&
        dataView.matrix.rows.root.children
    );
}

function getColorByIndex(
    index: number,
    queryName: string,
    objects: powerbi.DataViewObjects | undefined,
    capability: string,
    colorPalette: ISandboxExtendedColorPalette
): string {
    if (objects) {
        const color: any = getObject(objects, capability);
        if (color) {
            const instance: any = color.$instances;
            if (instance) {
                const setting: any = instance[index];
                if (setting) {
                    return setting.fill.solid.color;
                }
            }
        }
    }

    return colorPalette.getColor(queryName).value;
}

function getTooltip(this: State): VisualTooltipDataItem[] {
    return [
        {
            header: this.name,
            displayName: "State",
            color: this.color,
            value: this.state?.toString() as string,
        },
        {
            header: "",
            displayName: "Start time",
            color: this.color,
            opacity: "0",
            value: this.formatter.format(this.time),
        },
        {
            header: "",
            displayName: "End time",
            color: this.color,
            opacity: "0",
            value: this.formatter.format(this.endTime),
        },
    ];
}
